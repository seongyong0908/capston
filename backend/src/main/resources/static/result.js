document.addEventListener('DOMContentLoaded', function() {
  
  // -- 상태 (State) 및 임시 데이터 --
  let favoritePlaces = [];
  let isSaved = false;

  let currentCourse = []; 

  const savedCourseData = sessionStorage.getItem('finalSelectedCourse');

  if (savedCourseData) {
      const parsedData = JSON.parse(savedCourseData);
      
      // 추천 코스 제목을 표시용으로 가져옵니다.
      if(parsedData.title) courseTitle = parsedData.title;
      else if(parsedData.course_name) courseTitle = parsedData.course_name;
      
      // places 배열(남산타워, 명동교자 등)을 currentCourse에 매핑합니다.
      // (기존 프론트엔드 코드 형식에 맞게 속성 이름을 살짝 바꿔줍니다)
      currentCourse = parsedData.places.map((place, index) => ({
          id: `p${index + 1}`,
          name: place.name || place.place_name, 
          placeId: place.placeId || place.id,
          category: place.category,
          subcategory: place.subcategory || '',
          emoji: '📍', // AI 데이터에는 이모지가 없으므로 기본 핀 이모지로 통일
          description: place.reason || 'AI 추천 장소입니다.',
          address: place.address || '',
          lat: place.lat,
          lng: place.lng,
          phone: place.phone || '',
          color: 'from-pink-400 to-rose-400'
      }));
  } else {
      alert("선택된 코스 정보가 없습니다. 첫 화면으로 돌아갑니다.");
      window.location.href = '/';
      return; // 코드 실행 중단
  }

  // 💡(참고) 장소 '교체' 기능을 위한 allPlacesPool은 일단 비워두거나,
  // currentCourse로 덮어써서 에러를 방지합니다. (나중에 AI에게 다시 물어보는 기능으로 발전시킬 수 있습니다)
  let allPlacesPool = [...currentCourse];
  const selectedCourseContext = savedCourseData ? JSON.parse(savedCourseData) : {};
  const selectedRegion = selectedCourseContext.region || '';
  const mapCenter = selectedCourseContext;

  window.openKakaoDirections = (placeId) => {
    const place = currentCourse.find(item => item.id === placeId);
    if (!place) return;

    const target = Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng))
      ? `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`
      : `https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address}`.trim())}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  // -- DOM 엘리먼트 --
  const courseListContainer = document.getElementById('courseListContainer');
  const simpleMapContainer = document.getElementById('simpleMapContainer');
  
  // -- 함수: 상단 요약 정보 계산 --
  const updateSummary = () => {
    // 1. 시간 계산 (문자열에서 시간/분 파싱)
    let totalMinutes = 0;
    currentCourse.forEach(p => {
      let tStr = p.estimatedTime || '';
      let hMatch = tStr.match(/(\d+)시간/);
      let mMatch = tStr.match(/(\d+)분/);
      if(hMatch) totalMinutes += parseInt(hMatch[1]) * 60;
      if(mMatch) totalMinutes += parseInt(mMatch[1]);
    });
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    document.getElementById('summaryTime').textContent = `총 ${hours}시간 ${mins}분`;
    document.getElementById('summaryPlaces').textContent = `${currentCourse.length}개 장소`;
  };

  // -- 함수: 코스 목록 렌더링 --
  const renderCourse = () => {
    // 1. 진짜 카카오맵 렌더링
// 1. 진짜 카카오맵 렌더링 (주소 기반 숫자 핀 & 동선 점선 긋기)
    if (typeof kakao !== 'undefined' && kakao.maps) {
        kakao.maps.load(function() {
            const options = {
                center: new kakao.maps.LatLng(37.5665, 126.9780), // 초기 서울 중심
                level: 5
            };

            const map = new kakao.maps.Map(simpleMapContainer, options);
            
            // 주소-좌표 변환 객체를 생성합니다
            const geocoder = new kakao.maps.services.Geocoder();
            const bounds = new kakao.maps.LatLngBounds();
            const linePath = [];
            let processedCount = 0; 

            currentCourse.forEach((place, index) => {
                const finishPlace = (coords) => {
                    if (coords) {
                        
                        // 🌟 [개선 1] 파란색 핀 대신 '핑크색 동그라미 숫자(1, 2, 3) 마커' 생성
                        const customMarkerHtml = `
                            <div style="background-color: #ec4899; color: white; width: 30px; height: 30px; border-radius: 50%; text-align: center; line-height: 26px; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                ${index + 1}
                            </div>
                        `;
                        
                        // 커스텀 마커를 지도에 띄웁니다
                        const customOverlay = new kakao.maps.CustomOverlay({
                            map: map,
                            position: coords,
                            content: customMarkerHtml,
                            yAnchor: 1 // 마커가 붕 뜨지 않고 좌표에 딱 맞게 설정
                        });

                        // 선을 그리기 위해 좌표 배열에 순서대로 넣습니다
                        linePath[index] = coords;
                        bounds.extend(coords);
                    }

                    processedCount++;

                    // 🌟 [개선 2] 모든 주소 검색이 끝났을 때 점선 긋기
                    if (processedCount === currentCourse.length) {
                        // 혹시 주소 검색 실패로 구멍난 데이터가 있다면 걸러냅니다
                        const validPath = linePath.filter(coord => coord !== undefined);

                        if (validPath.length > 1) {
                            const polyline = new kakao.maps.Polyline({
                                path: validPath, // 선을 구성하는 좌표 배열
                                strokeWeight: 4, // 선의 두께
                                strokeColor: '#ec4899', // 핑크색
                                strokeOpacity: 0.8, // 투명도
                                strokeStyle: 'shortdash', // 👈 빽빽한 실선 대신 세련된 짧은 점선
                                endArrow: true // 👈 선 끝에 화살표 추가 (이동 방향 표시)
                            });
                            polyline.setMap(map);
                        }

                        // 마커들이 모두 한눈에 보이도록 지도 줌 레벨 자동 조절
                        if (validPath.length > 0) {
                            map.setBounds(bounds, 48, 48, 48, 48);
                        }
                    }
                };

                if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
                    finishPlace(new kakao.maps.LatLng(place.lat, place.lng));
                } else if (place.address) {
                    geocoder.addressSearch(place.address, function(result, status) {
                        const coords = status === kakao.maps.services.Status.OK
                            ? new kakao.maps.LatLng(result[0].y, result[0].x)
                            : null;
                        finishPlace(coords);
                    });
                } else {
                    finishPlace(null);
                }
            });
        });
}

    // 2. 목록 렌더링
    let listHtml = '';
    currentCourse.forEach((place, index) => {
      const isFav = favoritePlaces.includes(place.id);
      const favClass = isFav ? "text-pink-600 fill-pink-600" : "text-gray-400";
      const btnBg = isFav ? "bg-pink-100 hover:bg-pink-200" : "hover:bg-pink-100";

      listHtml += `
        <div class="relative mt-4">
          <!-- 카드 사이를 잇는 연결선 (마지막 카드에는 안 보임) -->
          ${index < currentCourse.length - 1 ? `<div class="absolute left-9 top-14 bottom-[-32px] w-0.5 bg-gray-200 z-0"></div>` : ''}
          
          <!-- 슬림해진 개별 장소 카드 -->
          <div class="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow z-10 cursor-pointer" onclick="openPlaceDetail('${place.id}')">
            <div class="flex gap-4">
              
              <!-- 왼쪽: 순서 번호 & 아이콘 -->
              <div class="flex flex-col items-center gap-2 shrink-0">
                <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md z-10">
                  ${index + 1}
                </div>
                <span class="text-2xl mt-1">${place.emoji}</span>
              </div>

              <!-- 오른쪽: 장소 정보 및 액션 -->
              <div class="flex-1">
                
                <!-- 타이틀 & 상단 액션 (변경, 찜) -->
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-bold text-lg text-gray-900">${place.name}</h3>
                    <span class="inline-block mt-1 px-2.5 py-0.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-full border border-purple-100">
                      ${place.category}
                    </span>
                  </div>
                  
                  <!-- [핵심] 작아진 변경 버튼 & 하트 버튼 -->
                  <div class="flex items-center gap-1 shrink-0">
                    <button onclick="event.stopPropagation(); openReplaceModal('${place.id}')" class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      변경
                    </button>
                    <button onclick="event.stopPropagation(); toggleFavorite('${place.id}')" class="p-1.5 rounded-full transition-colors ${btnBg}">
                      <svg class="w-5 h-5 ${favClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </button>
                  </div>
                </div>

                <!-- 설명 -->
                <p class="text-sm text-gray-600 mt-2 line-clamp-2">${place.description}</p>

                <div class="flex gap-2 mt-4">
                  <button onclick="event.stopPropagation(); window.openKakaoDirections('${place.id}')" class="flex-1 py-1.5 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    카카오맵 길찾기
                  </button>
                ${place.phone ? `
                  <button onclick="event.stopPropagation(); location.href='tel:${place.phone.replace(/[^\d+]/g, '')}'" class="flex-1 py-1.5 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    전화
                  </button>
                ` : ''}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      `;
    });

    courseListContainer.innerHTML = listHtml;
    

        function updateSummaryBar() {
        const startT = localStorage.getItem('savedStartTime') || '10:00';
        const endT = localStorage.getItem('savedEndTime') || '22:00';
        
        const timeElement = document.getElementById('summaryTimeRange');
        if (timeElement) timeElement.textContent = `${startT} ~ ${endT}`;

        const countElement = document.getElementById('summaryPlaceCount');
        if (countElement && typeof currentCourse !== 'undefined') {
            countElement.textContent = `${currentCourse.length}개 장소`;
        }
    }
    updateSummaryBar();
  };

  // 전역 함수화 (인라인 이벤트 용)
  window.toggleFavorite = (id) => {
    if(favoritePlaces.includes(id)) favoritePlaces = favoritePlaces.filter(fid => fid !== id);
    else favoritePlaces.push(id);
    renderCourse(); // 재렌더링하여 하트 갱신
  };


  // -- 모달 제어 로직 --
  const modalPlaceDetail = document.getElementById('modalPlaceDetail');
  const modalAlternatives = document.getElementById('modalAlternatives');
  let currentReplaceId = null;

// 장소 상세 모달
window.openPlaceDetail = (id) => {
  const place = currentCourse.find(p => p.id === id) || allPlacesPool.find(p => p.id === id);
  if(!place) return;

  // 💡 화면(HTML)에 해당 글자칸이 없어도 에러가 나지 않도록 안전하게 텍스트를 집어넣는 마법의 함수!
  const safeSetText = (elementId, text) => {
      const el = document.getElementById(elementId);
      if (el) el.textContent = text;
  };

  // 준비된 텍스트들을 팝업창에 쏙쏙 집어넣습니다.
  safeSetText('detailEmoji', place.emoji);
  safeSetText('detailName', place.name);
  const categoryLabel = [place.category, place.subcategory].filter(Boolean).join(' · ');
  safeSetText('detailCat', categoryLabel || '분류 정보 없음');
  safeSetText('detailAddr', place.address || '주소 정보 없음');

  const phoneContainer = document.getElementById('detailPhoneContainer');
  const phoneLink = document.getElementById('detailPhone');
  if (phoneContainer && phoneLink) {
      if (place.phone) {
          phoneLink.textContent = place.phone;
          phoneLink.href = `tel:${place.phone.replace(/[^\d+]/g, '')}`;
          phoneContainer.classList.remove('hidden');
          phoneContainer.classList.add('flex');
      } else {
          phoneLink.removeAttribute('href');
          phoneContainer.classList.add('hidden');
          phoneContainer.classList.remove('flex');
      }
  }

  // 모달창 띄우기
  if (modalPlaceDetail) {
      modalPlaceDetail.classList.remove('hidden');
  } else {
      alert(`[${place.name}]\n\n${categoryLabel || '분류 정보 없음'}\n\n📍 주소: ${place.address || '주소 정보 없음'}${place.phone ? `\n☎️ 전화번호: ${place.phone}` : ''}`);
  }
};

  document.getElementById('btnDetailClose').addEventListener('click', () => modalPlaceDetail.classList.add('hidden'));

  // 장소 교체 모달 열기
  window.openReplaceModal = async (id) => {
    currentReplaceId = id;
    const currentPlace = currentCourse.find(p => p.id === id);
    const container = document.getElementById('alternativesContainer');
    if (!currentPlace || !container) return;

    if (!selectedRegion || !Number.isFinite(mapCenter.lat) || !Number.isFinite(mapCenter.lng)) {
      container.innerHTML = '<p class="p-5 text-center text-gray-500">지역 정보가 없습니다. 지역을 선택해 새 추천을 받아주세요.</p>';
      modalAlternatives.classList.remove('hidden');
      return;
    }

    modalAlternatives.classList.remove('hidden');
    container.innerHTML = '<p class="p-5 text-center text-gray-500">같은 지역의 장소를 찾고 있어요...</p>';

    try {
      const activeRequest = JSON.parse(
        sessionStorage.getItem('activeRecommendationRequest') || '{}'
      );
      const response = await fetch('/api/get-alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: selectedRegion,
          lat: mapCenter.lat,
          lng: mapCenter.lng,
          category: currentPlace.category,
          login_id: activeRequest.login_id,
          roomId: activeRequest.roomId,
          roomType: activeRequest.roomType,
          mood: activeRequest.mood || [],
          courseSequence: activeRequest.courseSequence || [],
          extraMessage: activeRequest.extraMessage || '',
          currentPlace: {
            id: currentPlace.placeId,
            name: currentPlace.name,
            category: currentPlace.category
          },
          currentPlaces: currentCourse
            .filter(place => place.id !== currentReplaceId)
            .map(place => ({
              name: place.name,
              category: place.category,
              address: place.address
            })),
          excludePlaceIds: currentCourse.map(place => place.placeId)
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.detail || `대체 장소 조회 실패 (${response.status})`);
      }

      const places = await response.json();
      const alternatives = places
        .filter(place => String(place.id) !== String(currentPlace.placeId))
        .filter(place => !currentCourse.some(item => String(item.placeId) === String(place.id)))
        .map(place => ({
          id: `db-${place.id}`,
          placeId: place.id,
          name: place.placeName || place.name || '이름 정보 없음',
          category: place.category,
          description: place.reason || place.description || place.tags || '같은 방 취향 조건을 고려한 대체 장소입니다.',
          address: place.address || '',
          lat: Number(place.latitude),
          lng: Number(place.longitude),
          phone: place.phone || '',
          emoji: '📍',
          rating: place.rating || '-'
        }));

      if (alternatives.length === 0) {
        container.innerHTML = '<p class="p-5 text-center text-gray-500">선택한 지역에 바꿀 장소가 더 없습니다.</p>';
        return;
      }

      allPlacesPool = [...allPlacesPool.filter(place => !String(place.id).startsWith('db-')), ...alternatives];
      container.innerHTML = alternatives.map(place => `
        <button onclick="executeReplace('${place.id}')" class="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left flex gap-4">
          <span class="text-5xl">${place.emoji}</span>
          <div>
            <div class="flex gap-2 mb-1"><h3 class="text-xl font-bold">${place.name}</h3><span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">${place.category}</span></div>
            <p class="text-sm text-gray-600 mb-2">${place.description}</p>
            <div class="text-sm text-gray-500">📍 ${place.address}</div>
          </div>
        </button>
      `).join('');
    } catch (error) {
      console.error('대체 장소를 불러오지 못했습니다.', error);
      container.innerHTML = '<p class="p-5 text-center text-red-500">대체 장소를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    }
  };

  document.getElementById('btnCancelAlternatives').addEventListener('click', () => modalAlternatives.classList.add('hidden'));

  window.executeReplace = (newPlaceId) => {
    const newPlace = allPlacesPool.find(p => p.id === newPlaceId);
    if (!newPlace) {
      alert("선택한 대체 장소를 찾지 못했습니다. 다시 열어주세요.");
      return;
    }
    currentCourse = currentCourse.map(p => p.id === currentReplaceId ? newPlace : p);
    
    modalAlternatives.classList.add('hidden');
    renderCourse(); // 새 코스로 리렌더링
  };


  // -- 헤더 & 바텀 네비게이션 액션 --
  document.getElementById('btnNavCalendar').addEventListener('click', () => window.location.href = '/calendar');
  document.getElementById('btnNavMyPage').addEventListener('click', () => window.location.href = '/mypage');
  document.getElementById('btnRetry').addEventListener('click', () => window.location.href = '/preferences');
  

  document.getElementById('btnShare').addEventListener('click', () => {
    alert("코스 정보가 클립보드에 복사되었습니다!");
  });

  const loginId = localStorage.getItem('loginId') || selectedCourseContext.login_id;
  const getPlaceIds = () => currentCourse.map(place => Number(place.placeId));
  const getAcceptedRooms = async () => {
    if (!loginId) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.');
    const response = await fetch(`/api/rooms?login_id=${encodeURIComponent(loginId)}`);
    if (!response.ok) throw new Error('방 목록을 불러오지 못했습니다.');
    const rooms = await response.json();
    return rooms.filter(room => String(room.memberStatus).toUpperCase() === 'ACCEPTED');
  };
  const fillRoomSelect = async (select) => {
    select.innerHTML = '<option value="">방 선택</option>';
    const rooms = await getAcceptedRooms();
    rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = `${room.roomName} (${room.roomType})`;
      select.appendChild(option);
    });
    const activeRoomId = localStorage.getItem('activeRoomId');
    if (activeRoomId && rooms.some(room => String(room.id) === activeRoomId)) {
      select.value = activeRoomId;
    }
    if (rooms.length === 0) {
      select.innerHTML = '<option value="">승인된 방이 없습니다. 먼저 방에 가입해 주세요.</option>';
    }
  };
  const getCoursePayload = (title, roomId, plannedDate) => ({
    login_id: loginId,
    roomId: roomId ? Number(roomId) : null,
    title,
    region: selectedRegion,
    plannedDate: plannedDate && plannedDate !== '날짜 미정' ? plannedDate : null,
    startTime: localStorage.getItem('savedStartTime') || null,
    endTime: localStorage.getItem('savedEndTime') || null,
    placeIds: getPlaceIds()
  });
  const defaultCourseTitle = selectedCourseContext.course_name
    || selectedCourseContext.title
    || (typeof courseTitle !== 'undefined' ? courseTitle : 'AI 맞춤 데이트 코스');

  document.getElementById('btnSaveCourse').addEventListener('click', () => {
    window.saveCurrentCourse();
  });

  const btnAddToCalendar = document.getElementById('btnAddToCalendar');
  const saveCourseModal = document.getElementById('saveCourseModal');
  const btnCancelSave = document.getElementById('btnCancelSave');
  const btnConfirmSave = document.getElementById('btnConfirmSave');
  const customCourseTitleInput = document.getElementById('customCourseTitle');
  const scheduleRoomSelect = document.getElementById('scheduleRoomSelect');
  const scheduleEventDate = document.getElementById('scheduleEventDate');
  const savedDate = localStorage.getItem('savedCourseDate');
  if (savedDate === '날짜 미정' && btnAddToCalendar) {
    btnAddToCalendar.classList.add('hidden');
  }

  if (btnAddToCalendar && saveCourseModal) {
    btnAddToCalendar.addEventListener('click', async () => {
      customCourseTitleInput.value = defaultCourseTitle;
      const today = new Date();
      scheduleEventDate.value = savedDate && savedDate !== '날짜 미정'
        ? savedDate
        : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      try {
        await fillRoomSelect(scheduleRoomSelect);
      } catch (error) {
        alert(error.message);
        return;
      }
      saveCourseModal.classList.remove('hidden');
      saveCourseModal.classList.add('flex');
    });

    btnCancelSave.addEventListener('click', () => {
      saveCourseModal.classList.add('hidden');
      saveCourseModal.classList.remove('flex');
    });

    btnConfirmSave.addEventListener('click', async () => {
      const title = customCourseTitleInput.value.trim();
      const eventDate = scheduleEventDate.value;
      const roomId = scheduleRoomSelect.value;
      if (!title || !eventDate || !roomId) {
        alert('일정 제목, 날짜와 방을 모두 선택해 주세요.');
        return;
      }
      btnConfirmSave.disabled = true;
      try {
        const response = await fetch('/api/courses/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...getCoursePayload(title, roomId, eventDate),
            eventDate,
            startTime: localStorage.getItem('savedStartTime') || null,
            endTime: localStorage.getItem('savedEndTime') || null
          })
        });
        if (!response.ok) throw new Error(await response.text() || '일정 저장에 실패했습니다.');
        saveCourseModal.classList.add('hidden');
        saveCourseModal.classList.remove('flex');
        alert('캘린더에 코스가 저장되었습니다.');
        window.location.href = '/calendar';
      } catch (error) {
        console.error('일정 저장 실패:', error);
        alert(error.message || '일정 저장에 실패했습니다.');
      } finally {
        btnConfirmSave.disabled = false;
      }
    });
  }

  window.saveCurrentCourse = async function() {
    const button = document.getElementById('btnSaveCourse');
    if (!loginId) {
      alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
      return;
    }
    button.disabled = true;
    try {
      const activeRoomId = localStorage.getItem('activeRoomId');
      const response = await fetch('/api/courses/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCoursePayload(
          defaultCourseTitle,
          activeRoomId,
          localStorage.getItem('savedCourseDate')
        ))
      });
      if (!response.ok) throw new Error(await response.text() || '코스 보관에 실패했습니다.');
      isSaved = true;
      document.getElementById('iconSave').classList.add('text-pink-600', 'fill-pink-600');
      alert('코스가 DB에 보관되었습니다.');
      window.location.href = '/mypage';
    } catch (error) {
      console.error('코스 보관 실패:', error);
      alert(error.message || '코스 보관에 실패했습니다.');
    } finally {
      button.disabled = false;
    }
  };

  // 초기 렌더링
  renderCourse();
});