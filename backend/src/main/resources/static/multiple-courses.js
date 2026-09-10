document.addEventListener('DOMContentLoaded', function() {
  let selectedCourseId = null;

  // preferences.js의 categories 배열과 맞춘 카테고리별 아이콘
  const CATEGORY_ICONS = {
    cafe: "☕",
    restaurant: "🍽️",
    movie: "🎬",
    exhibition: "🖼️",
    shopping: "🛍️",
    park: "🌳",
    sports: "⚽",
    culture: "🎭"
  };

  // preferences 화면에서 /api/get-course 호출 후 저장해둔 실제 AI 추천 결과를 사용
  const savedData = sessionStorage.getItem('recommendedCourses');
  const rawCourses = savedData ? JSON.parse(savedData) : [];

  if (!rawCourses || rawCourses.length === 0) {
      console.warn("⚠️ 세션스토리지에 추천 코스 데이터가 없습니다! 메인에서 다시 시도해주세요.");
  }

  function formatTimeRange(timeStr) {
    if (!timeStr || timeStr === "미정") return "미정";

    const parts = timeStr.split(" ~ ");
    if (parts.length !== 2) return timeStr;

    function convert(t) {
      const [hourStr, minStr] = t.split(":");
      let hour = parseInt(hourStr, 10);
      const period = hour < 12 ? "오전" : "오후";
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      return `${period} ${displayHour}시 ${minStr}분`;
    }

    return `${convert(parts[0])} ~ ${convert(parts[1])}`;
  }

  function formatBudget(budgetStr) {
    if (!budgetStr || budgetStr === "미정") return "미정";
    const num = Number(budgetStr);
    if (isNaN(num)) return budgetStr;
    return num.toLocaleString('ko-KR');
  }

 // 💡 파이썬이 주는 배열의 순서(인덱스)를 이용해 안전하게 번호와 데이터를 매칭합니다.
  const coursesData = rawCourses.map((course, index) => {
    const courseNum = index + 1; // 1번, 2번, 3번 코스 번호 자동 부여
    return {
      id: String(courseNum),
      name: course.course_name || `AI 추천 코스 ${courseNum}`, // 파이썬이 보낸 course_name을 우선 사용!
      time: formatTimeRange(course.time),
      budget: formatBudget(course.budget),
      places: (course.places || []).map(item => ({
        emoji: item.noResult ? "❔" : (CATEGORY_ICONS[item.categoryId] || "📍"),
        name: item.noResult ? "검색 결과 없음" : (item.place_name || item.name),
        category: item.reason || item.category,
        noResult: !!item.noResult
      }))
    };
  });

  const container = document.getElementById('coursesContainer');
  const actionContainer = document.getElementById('actionContainer');
  const selectCourseText = document.getElementById('selectCourseText');

  const renderCourses = () => {
    if (coursesData.length === 0) {
      container.innerHTML = '<div class="p-5 text-center text-red-500">추천 결과를 찾을 수 없어요. preferences 화면에서 다시 시도해 주세요!</div>';
      return;
    }
    let html = '';
    coursesData.forEach((course, idx) => {
      const isSelected = selectedCourseId === course.id;
      const ringClass = isSelected ? "ring-4 ring-purple-500 scale-105" : "";
      
      let headerGradient = "from-blue-400 to-blue-600";
      if(idx === 0) headerGradient = "from-pink-400 to-pink-600";
      if(idx === 1) headerGradient = "from-purple-400 to-purple-600";

      const checkIcon = isSelected ? `<div class="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center"><svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></div>` : '';

      let placesHtml = course.places.map((place, pIdx) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg ${place.noResult ? 'opacity-60' : ''}">
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

  // ⭐️ preferences 화면에서 이미 받아온 추천 결과를 바로 그립니다.
  renderCourses();
});