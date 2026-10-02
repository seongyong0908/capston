document.addEventListener('DOMContentLoaded', function() {
  
  // -- 상태 (State) 및 임시 데이터 --
  let favoritePlaces = [];
  let isSaved = false;

  let currentCourse = []; 

  const savedCourseData = sessionStorage.getItem('finalSelectedCourse');

  if (savedCourseData) {
      const parsedData = JSON.parse(savedCourseData);
      
      // 만약 파이썬에서 제목과 예산을 함께 넘겨줬다면 가져옵니다.
      if(parsedData.title) courseTitle = parsedData.title;
      if(parsedData.totalBudget) courseBudget = parsedData.totalBudget;
      
      // places 배열(남산타워, 명동교자 등)을 currentCourse에 매핑합니다.
      // (기존 프론트엔드 코드 형식에 맞게 속성 이름을 살짝 바꿔줍니다)
      currentCourse = parsedData.places.map((place, index) => ({
          id: `p${index + 1}`,
          name: place.name || place.place_name, 
          category: place.category,
          emoji: '📍', // AI 데이터에는 이모지가 없으므로 기본 핀 이모지로 통일
          description: place.reason || 'AI 추천 장소입니다.',
          rating: 4.5, // AI 데이터에는 별점이 없으므로 임시 별점
          reviewCount: Math.floor(Math.random() * 500) + 50, // 가짜 리뷰 수
          estimatedTime: '2시간', // 시간 데이터가 없다면 임시 시간
          address: place.address || '주소 정보 없음',
          phone: '',
          color: 'from-pink-400 to-rose-400'
      }));
  } else {
      alert("선택된 코스 정보가 없습니다. 첫 화면으로 돌아갑니다.");
      window.location.href = '/';
      return; // 코드 실행 중단
  }

  // 💡(참고) 장소 '교체' 기능을 위한 allPlacesPool은 일단 비워두거나,
  // currentCourse로 덮어써서 에러를 방지합니다. (나중에 AI에게 다시 물어보는 기능으로 발전시킬 수 있습니다)
  const allPlacesPool = [...currentCourse];

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

    // 2. 비용 계산 (더미 1인당 3만원 기준 대략 계산)
    const budget = currentCourse.length * 30000;

    document.getElementById('summaryTime').textContent = `총 ${hours}시간 ${mins}분`;
    document.getElementById('summaryPlaces').textContent = `${currentCourse.length}개 장소`;
    document.getElementById('summaryBudget').textContent = `2명 약 ${budget.toLocaleString()}원`;
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
                // 주소가 없는 장소는 건너뜁니다
                if (!place.address) {
                    processedCount++;
                    return; 
                }

                // 각 장소의 주소로 좌표를 검색합니다
                geocoder.addressSearch(place.address, function(result, status) {
                    if (status === kakao.maps.services.Status.OK) {
                        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                        
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
                            map.setBounds(bounds);
                        }
                    }
                });
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

                <!-- 하단: 길찾기 & 전화 버튼 (높이를 줄이고 얇게) -->
                <div class="flex gap-2 mt-4">
                  <button onclick="event.stopPropagation(); window.open('https://map.kakao.com/link/search/${encodeURIComponent(place.address)}') " class="flex-1 py-1.5 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    길찾기
                  </button>
                  <button onclick="event.stopPropagation(); location.href='tel:${place.phone}'" class="flex-1 py-1.5 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    전화
                  </button>
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
  safeSetText('detailCat', 'AI 추천'); // 보라색 태그는 깔끔하게 단어로 고정!
  safeSetText('detailDesc', place.category); // 꼬여서 들어온 '진짜 추천 이유'를 넓은 설명칸으로!
  safeSetText('detailRating', place.rating);
  safeSetText('detailTime', place.estimatedTime);
  safeSetText('detailAddr', place.address);

  const reviewCountEl = document.getElementById('detailReviewCount');
  if (reviewCountEl) {
      reviewCountEl.textContent = `(${place.reviewCount.toLocaleString()}개의 리뷰)`;
  }

  // 🌟 [추가된 핵심 코드] 카카오맵 노란색 찐리뷰/사진 보기 버튼 생성
  const reviewsContainer = document.getElementById('reviewsContainer');
  if (reviewsContainer) {
      const searchQuery = encodeURIComponent(place.name + ' ' + place.address);
      reviewsContainer.innerHTML = `
        <button onclick="window.open('https://map.kakao.com/link/search/${searchQuery}')" 
                class="w-full py-3.5 bg-[#FEE500] hover:bg-[#EBD300] text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.86 1.83 5.37 4.6 6.83l-1.5 5.2 6.1-3.6c.92.11 1.85.17 2.8.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
          </svg>
          카카오맵 열기
        </button>
      `;
  }

  // 모달창 띄우기
  if (modalPlaceDetail) {
      modalPlaceDetail.classList.remove('hidden');
  } else {
      alert(`[${place.name}]\n\n${place.category}\n\n📍 주소: ${place.address}`);
  }
};

  document.getElementById('btnDetailClose').addEventListener('click', () => modalPlaceDetail.classList.add('hidden'));

  // 장소 교체 모달 열기
  window.openReplaceModal = (id) => {
    currentReplaceId = id;
    const currentPlace = currentCourse.find(p => p.id === id);
    
    // 같은 카테고리이면서 현재 코스에 없는 장소들 필터링
    const alternatives = allPlacesPool.filter(p => p.id !== id && !currentCourse.some(c => c.id === p.id) && p.category === currentPlace.category);
    
    // 만약 대체 장소가 없으면 더미 아무거나 추가
    if(alternatives.length === 0) {
      alternatives.push(allPlacesPool[3], allPlacesPool[4]);
    }

    const container = document.getElementById('alternativesContainer');
    container.innerHTML = alternatives.map(place => `
      <button onclick="executeReplace('${place.id}')" class="w-full p-5 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left flex gap-4">
        <span class="text-5xl">${place.emoji}</span>
        <div>
          <div class="flex gap-2 mb-1"><h3 class="text-xl font-bold">${place.name}</h3><span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">${place.category}</span></div>
          <p class="text-sm text-gray-600 mb-2">${place.description}</p>
          <div class="text-sm text-gray-500">⭐ ${place.rating} · 📍 ${place.address}</div>
        </div>
      </button>
    `).join('');

    modalAlternatives.classList.remove('hidden');
  };

  document.getElementById('btnCancelAlternatives').addEventListener('click', () => modalAlternatives.classList.add('hidden'));

  window.executeReplace = (newPlaceId) => {
    const newPlace = allPlacesPool.find(p => p.id === newPlaceId);
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

  document.getElementById('btnSaveCourse').addEventListener('click', () => {
    isSaved = true;
    document.getElementById('iconSave').classList.add('text-pink-600', 'fill-pink-600');
    alert("내 마이페이지에 코스가 저장되었습니다.");
  });

 // 🌟 캘린더 저장 팝업 제어 로직
const btnAddToCalendar = document.getElementById('btnAddToCalendar'); // 일정 추가 버튼
const saveCourseModal = document.getElementById('saveCourseModal');   // 팝업창
const btnCancelSave = document.getElementById('btnCancelSave');       // 취소 버튼
const btnConfirmSave = document.getElementById('btnConfirmSave');     // 저장 완료 버튼
const customCourseTitleInput = document.getElementById('customCourseTitle'); // 제목 입력칸

const savedDate = localStorage.getItem('savedCourseDate');
if (savedDate === '날짜 미정' && btnAddToCalendar) {
    btnAddToCalendar.classList.add('hidden');
}

if (btnAddToCalendar && saveCourseModal) {
    // 1. [캘린더에 일정 추가하기] 버튼 누르면 팝업 열기
    btnAddToCalendar.addEventListener('click', () => {
        // 입력칸에 기본 추천 제목을 미리 채워주기
        customCourseTitleInput.value = typeof courseTitle !== 'undefined' ? courseTitle : "AI 맞춤 데이트 코스";
        saveCourseModal.classList.remove('hidden');
        saveCourseModal.classList.add('flex'); // 화면 중앙에 띄우기
    });

    // 2. [취소] 버튼 누르면 팝업 닫기
    btnCancelSave.addEventListener('click', () => {
        saveCourseModal.classList.add('hidden');
        saveCourseModal.classList.remove('flex');
    });

    // 3. [저장 완료] 버튼 누르면 내가 쓴 제목으로 저장 후 캘린더 이동!
    btnConfirmSave.addEventListener('click', () => {
        
        const savedDate = localStorage.getItem('savedCourseDate');
        const todayStr = new Date().toISOString().split('T')[0]; 
        const targetDate = savedDate ? savedDate : todayStr; 

        const savedStart = localStorage.getItem('savedStartTime') || '';
        const savedEnd = localStorage.getItem('savedEndTime') || '';
        const timeString = (savedStart && savedEnd) ? `${savedStart} ~ ${savedEnd}` : '';

        const finalTitle = customCourseTitleInput.value.trim() || "이름 없는 코스";
        const placesStr = currentCourse.map(p => p.name).join(" ➔ ");
        const selectedRoom = document.querySelector('input[name="roomType"]:checked').value;

        // 피그마 캘린더가 읽을 수 있는 형태로 데이터 조립
        const newCourseEvent = {
            id: `event-${Date.now()}`,
            date: targetDate,
            title: finalTitle,
            description: placesStr,
            type: 'course', // 💡 핵심: 'course' 타입으로 저장해야 달력에 보라색 점이 찍힘!
            room:selectedRoom,
            time: timeString
        };

        // 로컬 스토리지에 저장
        let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
        events.push(newCourseEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(events));

        // 팝업 닫고 캘린더로 이동
        saveCourseModal.classList.add('hidden');
        alert("📅 캘린더에 코스가 추가되었습니다!");
        window.location.href = 'calendar'; 
    });
}

// 💡 [수정] 코스 보관하기 기능 (어디서든 부를 수 있게 전역 함수로 설정)
window.saveCurrentCourse = function() {
    // 1. 마이페이지에 저장해둘 기존 보관함 데이터를 불러옵니다 (없으면 빈 배열)
    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');

    // 2. 메인 화면에서 골랐던 날짜, 시간, 방 타입(연인/친구) 가져오기
    const date = localStorage.getItem('savedCourseDate') || '날짜 미지정';
    const startT = localStorage.getItem('savedStartTime') || '10:00';
    const endT = localStorage.getItem('savedEndTime') || '22:00';
    const roomType = localStorage.getItem('activeRoomType') || 'none'; 

    // 3. 보관함에 넣을 '하나의 완성된 코스 세트' 만들기
    const newSavedCourse = {
        id: `course-${Date.now()}`,
        date: date,
        time: `${startT} ~ ${endT}`,
        room: roomType, 
        places: typeof currentCourse !== 'undefined' ? currentCourse : [] // 에러 방지용 안전장치 추가
    };

    // 4. 보관함 배열에 새 코스를 추가하고 브라우저에 저장
    savedCourses.push(newSavedCourse);
    localStorage.setItem('mySavedCourses', JSON.stringify(savedCourses));

    // 5. 유저에게 알려주기
    alert('코스가 성공적으로 보관되었습니다! 💖');

    window.location.href = "mypage";
};

  // 초기 렌더링
  renderCourse();
});