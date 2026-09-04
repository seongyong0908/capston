document.addEventListener('DOMContentLoaded', function() {
  
  // -- 상태 (State) 및 임시 데이터 --
  let favoritePlaces = [];
  let isSaved = false;

  // 전체 장소 데이터 풀 (장소 교체 기능에 사용)
  const allPlacesPool = [
    { id: 'p1', name: '연남동 감성 카페', category: '카페/디저트', emoji: '☕', description: '빈티지한 인테리어와 수제 디저트가 맛있는 카페', rating: 4.8, reviewCount: 1250, estimatedTime: '1시간 30분', address: '서울 마포구 연남동 123-45', phone: '02-123-4567', color: 'from-orange-400 to-red-400' },
    { id: 'p2', name: '홍대 갤러리', category: '전시/관람', emoji: '🖼️', description: '트렌디한 현대미술 전시가 열리는 복합문화공간', rating: 4.6, reviewCount: 890, estimatedTime: '2시간', address: '서울 마포구 서교동 456-78', phone: '02-987-6543', color: 'from-blue-400 to-indigo-400' },
    { id: 'p3', name: '루프탑 이탈리안', category: '레스토랑/다이닝', emoji: '🍝', description: '야경이 예쁜 로맨틱한 분위기의 파스타 맛집', rating: 4.9, reviewCount: 2100, estimatedTime: '2시간', address: '서울 마포구 합정동 789-01', phone: '02-111-2222', color: 'from-pink-400 to-rose-400' },
    // 대체 장소용 더미
    { id: 'p4', name: '망원동 로스터리', category: '카페/디저트', emoji: '🍰', description: '직접 로스팅한 스페셜티 커피를 즐길 수 있는 곳', rating: 4.7, reviewCount: 650, estimatedTime: '1시간', address: '서울 마포구 망원동', phone: '', color: 'from-orange-400 to-red-400' },
    { id: 'p5', name: '프리미엄 스테이크하우스', category: '레스토랑/다이닝', emoji: '🥩', description: '최상급 한우 스테이크와 와인', rating: 4.9, reviewCount: 1500, estimatedTime: '2시간 30분', address: '서울 강남구 청담동', phone: '', color: 'from-red-500 to-red-700' }
  ];

  // 현재 사용자에게 추천된 코스
  let currentCourse = [allPlacesPool[0], allPlacesPool[1], allPlacesPool[2]];

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
    // 1. 지도 렌더링
    let mapHtml = `<div class="flex items-center gap-4">`;
    currentCourse.forEach((place, index) => {
      mapHtml += `
        <div class="flex items-center">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br ${place.color} flex items-center justify-center text-white font-bold shadow-xl border-4 border-white z-10">${index + 1}</div>
            <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold bg-white px-2 py-1 rounded shadow text-gray-800">${place.name.length > 8 ? place.name.substring(0,8)+'...' : place.name}</div>
          </div>
          ${index < currentCourse.length - 1 ? `<div class="w-8 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-2"></div>` : ''}
        </div>`;
    });
    mapHtml += `</div>`;
    simpleMapContainer.innerHTML = mapHtml;

    // 2. 목록 렌더링
    let listHtml = '';
    currentCourse.forEach((place, index) => {
      const isFav = favoritePlaces.includes(place.id);
      const favClass = isFav ? "text-pink-600 fill-pink-600" : "text-gray-400";
      const btnBg = isFav ? "bg-pink-100 hover:bg-pink-200" : "hover:bg-pink-100";

      listHtml += `
        <div class="relative mt-8">
          ${index < currentCourse.length - 1 ? `<div class="absolute left-8 top-full w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 z-0"></div>` : ''}
          <div class="relative border-0 shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-xl transition-shadow rounded-xl" onclick="openPlaceDetail('${place.id}')">
            <div class="absolute inset-0 bg-gradient-to-br ${place.color} opacity-5 pointer-events-none"></div>
            
            <div class="absolute -left-4 top-8 w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl z-20 shadow-xl border-4 border-white">${index + 1}</div>
            
            <div class="p-6 pl-16 pb-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-5xl">${place.emoji}</span>
                    <div>
                      <h3 class="text-2xl font-bold">${place.name}</h3>
                      <span class="inline-block text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-semibold mt-1">${place.category}</span>
                    </div>
                  </div>
                  <p class="text-base text-gray-600 mt-2">${place.description}</p>
                </div>
                <button onclick="event.stopPropagation(); toggleFavorite('${place.id}')" class="shrink-0 h-12 w-12 rounded-md transition-all ${btnBg} flex items-center justify-center">
                  <svg class="w-6 h-6 ${favClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
              </div>
            </div>

            <div class="p-6 pl-16 space-y-4">
              <div class="flex gap-3">
                <button onclick="event.stopPropagation(); window.open('https://map.kakao.com/link/search/${encodeURIComponent(place.address)}') " class="flex-1 h-14 border-2 border-purple-300 hover:bg-purple-50 rounded-md font-semibold text-gray-800 flex items-center justify-center">
                  <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>길찾기
                </button>
                <button onclick="event.stopPropagation(); location.href='tel:${place.phone}'" class="flex-1 h-14 border-2 border-pink-300 hover:bg-pink-50 rounded-md font-semibold text-gray-800 flex items-center justify-center">
                  <svg class="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>전화하기
                </button>
              </div>
              <div class="pt-4 border-t border-gray-200">
                <button onclick="event.stopPropagation(); openReplaceModal('${place.id}')" class="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3">
                  <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  이 장소 변경하기
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    courseListContainer.innerHTML = listHtml;
    updateSummary();
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

    document.getElementById('detailEmoji').textContent = place.emoji;
    document.getElementById('detailName').textContent = place.name;
    document.getElementById('detailCat').textContent = place.category;
    document.getElementById('detailDesc').textContent = place.description;
    document.getElementById('detailRating').textContent = place.rating;
    document.getElementById('detailReviewCount').textContent = `(${place.reviewCount.toLocaleString()}개의 리뷰)`;
    document.getElementById('detailTime').textContent = place.estimatedTime;
    document.getElementById('detailAddr').textContent = place.address;

    // 리뷰 더미 렌더링
    document.getElementById('reviewsContainer').innerHTML = `
      <div class="bg-white p-4 rounded-xl border-2 border-gray-100">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">🙋‍♀️</div>
          <div><p class="font-semibold text-gray-900 mb-1">김데이트</p><p class="text-sm text-gray-600">분위기가 정말 좋아요! 코스로 딱입니다.</p></div>
        </div>
      </div>
    `;
    modalPlaceDetail.classList.remove('hidden');
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
  document.getElementById('btnStart').addEventListener('click', () => {
    alert("카카오맵 경로 탐색을 시작합니다!");
    window.open(`https://map.kakao.com/link/search/${encodeURIComponent(currentCourse[0].address)}`);
  });

  document.getElementById('btnShare').addEventListener('click', () => {
    alert("코스 정보가 클립보드에 복사되었습니다!");
  });

  document.getElementById('btnSaveCourse').addEventListener('click', () => {
    isSaved = true;
    document.getElementById('iconSave').classList.add('text-pink-600', 'fill-pink-600');
    alert("내 마이페이지에 코스가 저장되었습니다.");
  });

  // 초기 렌더링
  renderCourse();
});