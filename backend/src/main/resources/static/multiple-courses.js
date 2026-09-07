document.addEventListener('DOMContentLoaded', function() {
  let selectedCourseId = null;
  // 서버에서 데이터를 받아올 빈 바구니 준비
  let coursesData = [];

  const container = document.getElementById('coursesContainer');
  const actionContainer = document.getElementById('actionContainer');
  const selectCourseText = document.getElementById('selectCourseText');

  // 백엔드(스프링 부트)에서 데이터를 가져오는 마법의 함수!
  const fetchCourseData = async () => {
    try {
      // 1. 백엔드에 요청을 보냅니다 (주소는 백엔드 Controller에 맞게 수정하세요!)
      const response = await fetch('http://localhost:8080/api/get-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 이전 페이지에서 누른 조건을 여기서 백엔드로 넘겨줘야 합니다. (지금은 임시 데이터)
        body: JSON.stringify({ tastes: ['조용한', '매운맛'], places: [] }) 
      });

      // 2. 백엔드를 거쳐 파이썬에서 온 가짜 데이터를 JSON으로 변환합니다.
      const result = await response.json();

     // 3. 파이썬이 보낸 AI 응답 텍스트를 화면 양식에 맞게 쪼개서 조립합니다!
      coursesData = [
        {
          id: 'course-1',
          name: 'AI 맞춤 데이트 코스',
          time: '약 4시간',
          budget: '미정',
          places: [
            {
              emoji: '📍',
              name: '1단계: AI 추천 장소 및 코스 시작',
              category: result.course[0] ? result.course[0].reason : 'AI 추천 내용 불러오는 중...'
            },
            {
              emoji: '🔥',
              name: '2단계: 메인 맛집/활동',
              category: '조용한 분위기 속 매운맛을 즐길 수 있는 코스'
            },
            {
              emoji: '☕',
              name: '3단계: 디저트 및 마무리',
              category: '매운 혀를 달래줄 고요한 찻집 또는 카페'
            }
          ]
        }
      ];

      // 4. 조립이 끝났으니 화면에 예쁘게 그립니다.
      renderCourses();

    } catch (error) {
      console.error("서버 통신 에러:", error);
      container.innerHTML = '<div class="p-5 text-center text-red-500">데이터를 불러오지 못했습니다. 서버가 켜져 있는지 확인해 주세요!</div>';
    }
  };

  const renderCourses = () => {
    let html = '';
    coursesData.forEach((course, idx) => {
      const isSelected = selectedCourseId === course.id;
      const ringClass = isSelected ? "ring-4 ring-purple-500 scale-105" : "";
      
      let headerGradient = "from-blue-400 to-blue-600";
      if(idx === 0) headerGradient = "from-pink-400 to-pink-600";
      if(idx === 1) headerGradient = "from-purple-400 to-purple-600";

      const checkIcon = isSelected ? `<div class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center"><svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></div>` : '';

      let placesHtml = course.places.map((place, pIdx) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div class="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">${pIdx + 1}</div>
          <div class="flex-1">
            <div class="flex items-center gap-2"><span class="text-xl">${place.emoji}</span><h4 class="font-semibold text-sm text-gray-800">${place.name}</h4></div>
            <p class="text-xs text-gray-500 mt-1">${place.category}</p>
          </div>
        </div>
      `).join('');

      html += `
        <div class="rounded-xl bg-white border-0 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] overflow-hidden ${ringClass}" onclick="selectCourse('${course.id}')">
          <div class="p-6 bg-gradient-to-br ${headerGradient} text-white relative">
            ${checkIcon}
            <h3 class="text-2xl font-bold">${course.name}</h3>
            <p class="text-sm opacity-90 mt-2">${course.places.length}개 장소 · ${course.time}</p>
            <p class="text-sm opacity-90">예상 비용: ${course.budget}원</p>
          </div>
          <div class="p-6 space-y-3">
            ${placesHtml}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  };

  // 전역 함수화
  window.selectCourse = (id) => {
    selectedCourseId = id;
    renderCourses(); // 리렌더링하여 선택 효과 적용
    
    // 버튼 보이기
    const selectedCourseData = coursesData.find(c => c.id === id);
    selectCourseText.textContent = `${selectedCourseData.name} 선택하기`;
    actionContainer.classList.remove('hidden');
    actionContainer.classList.add('flex');
  };

  // 버튼 이벤트
  document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = '/preferences';
  });

  document.getElementById('btnSelectCourse').addEventListener('click', () => {
    window.location.href = '/results';
  });

  // ⭐️ 페이지가 로딩되면 텅 빈 렌더링 대신, 서버에 데이터 요청(fetch)을 먼저 시작합니다!
  fetchCourseData();
});