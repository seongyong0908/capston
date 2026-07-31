document.addEventListener('DOMContentLoaded', function() {
  
  let selectedCourseId = null;

  // 3가지 가상 코스 데이터
  const coursesData = [
    {
      id: 'A', name: '코스 A', budget: '65,000', time: '3시간 30분',
      places: [
        { id: 'p1', name: '홍대 감성 카페', category: '카페', emoji: '☕' },
        { id: 'p2', name: '트릭아이 미술관', category: '전시회', emoji: '🖼️' },
        { id: 'p3', name: '루프탑 레스토랑', category: '레스토랑', emoji: '🍽️' }
      ]
    },
    {
      id: 'B', name: '코스 B', budget: '80,000', time: '4시간 15분',
      places: [
        { id: 'p4', name: '연남동 핫플 식당', category: '식당', emoji: '🍝' },
        { id: 'p5', name: '셀프 사진관', category: '액티비티', emoji: '📸' },
        { id: 'p6', name: '분위기 좋은 칵테일바', category: '바', emoji: '🍸' }
      ]
    },
    {
      id: 'C', name: '코스 C', budget: '45,000', time: '3시간 0분',
      places: [
        { id: 'p7', name: '경의선 숲길', category: '공원/산책', emoji: '🌳' },
        { id: 'p8', name: '소품샵 투어', category: '쇼핑', emoji: '🛍️' },
        { id: 'p9', name: '아늑한 디저트 카페', category: '카페', emoji: '🍰' }
      ]
    }
  ];

  const container = document.getElementById('coursesContainer');
  const actionContainer = document.getElementById('actionContainer');
  const selectCourseText = document.getElementById('selectCourseText');

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
    // 최종 결과 화면으로 이동
    window.location.href = '/results';
  });

  // 초기 렌더링
  renderCourses();
});