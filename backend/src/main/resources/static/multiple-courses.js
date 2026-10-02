document.addEventListener('DOMContentLoaded', function() {
  let selectedCourseId = null;
  let coursesData = []; // 데이터를 나중에 채우기 위해 let으로 변경

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

  // 💡 파이썬 데이터를 화면용 데이터로 예쁘게 가공하는 함수
  function updateCoursesData(rawCourses) {
    coursesData = rawCourses.map((course, index) => {
      const courseNum = index + 1; // 1번, 2번, 3번 코스 번호 자동 부여
      return {
        id: String(courseNum),
        name: course.course_name || `AI 추천 코스 ${courseNum}`,
        time: formatTimeRange(course.time),
        budget: formatBudget(course.budget),
        places: (course.places || []).map(item => ({
          emoji: item.noResult ? "❔" : (CATEGORY_ICONS[item.categoryId] || "📍"),
          name: item.noResult ? "검색 결과 없음" : (item.place_name || item.name),
          category: item.reason || item.category,
          address: item.address,
          noResult: !!item.noResult
        }))
      };
    });
  }

  const container = document.getElementById('coursesContainer');
  const actionContainer = document.getElementById('actionContainer');
  const selectCourseText = document.getElementById('selectCourseText');
  const loader = document.getElementById('aiLoadingOverlay'); // 💡 2단계에서 만든 로딩창 가져오기

  const renderCourses = () => {
    if (coursesData.length === 0) {
      container.innerHTML = '<div class="p-5 text-center text-red-500">추천 결과를 찾을 수 없어요. 이전 화면에서 다시 시도해 주세요!</div>';
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
    renderCourses();
    
    const selectedCourseData = coursesData.find(c => c.id === id);
    selectCourseText.textContent = `${selectedCourseData.name} 선택하기`;
    actionContainer.classList.remove('hidden');
    actionContainer.classList.add('flex');
  };

  // 버튼 이벤트
  document.getElementById('btnBack').addEventListener('click', () => {
    window.location.href = '/preferences';
  });

  // 🚨 [수정할 부분] '선택하기' 버튼을 눌렀을 때의 동작
  document.getElementById('btnSelectCourse').addEventListener('click', () => {
    
    // 1. 방금 사용자가 선택한 코스(id로 찾기)의 모든 정보를 가져옵니다.
    const mySelectedCourse = coursesData.find(course => course.id === selectedCourseId);
    
    if (mySelectedCourse) {
        // 2. 3페이지(result.js)가 읽을 수 있도록 세션에 저장합니다.
        // 이때 원래 파이썬에서 왔던 형태랑 최대한 비슷하게 이름을 맞춰서 저장해 줍니다.
        const dataForNextPage = {
            course_name: mySelectedCourse.name,
            totalTime: mySelectedCourse.time,
            totalBudget: mySelectedCourse.budget,
            places: mySelectedCourse.places
        };
        sessionStorage.setItem('finalSelectedCourse', JSON.stringify(dataForNextPage));
        
        // 3. 당당하게 3페이지로 넘어갑니다!
        window.location.href = '/result'; 
    } else {
        alert("코스를 먼저 선택해 주세요!");
    }
  });

  // =========================================================================
  // 🚀 핵심 비동기 로직: 화면이 열리자마자 세션을 확인하고 AI 결과를 요청합니다.
  // =========================================================================
  const pendingRequestRaw = sessionStorage.getItem('pendingAiRequest');

  if (pendingRequestRaw) {
    // 1. 1페이지에서 방금 넘어온 경우 (AI 요청을 해야 함)
    const requestData = JSON.parse(pendingRequestRaw);

    // 로딩창 띄우기
    if (loader) {
      loader.classList.remove('hidden');
      loader.classList.add('flex');
    }

    console.log("👉 백엔드로 AI 코스 생성 요청 시작...");

    fetch('/api/get-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })
    .then(response => response.json())
    .then(data => {
      console.log("✅ AI 추천 결과 도착!", data);

      // 로딩창 끄기
      if (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
      }

      // 다음을 위해 결과 저장
      sessionStorage.setItem('recommendedCourses', JSON.stringify(data.courses));
      sessionStorage.setItem('aiCourses', JSON.stringify(data.courses));
      
      // 일회용 임시 데이터 삭제
      sessionStorage.removeItem('pendingAiRequest');

      // 데이터 가공 및 화면 렌더링
      updateCoursesData(data.courses);
      renderCourses();
    })
    .catch(error => {
      console.error("❌ 에러 발생:", error);
      if (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
      }
      alert("AI 코스 생성 중 오류가 발생했습니다.");
      window.location.href = '/preferences'; // 오류 시 1페이지로 돌려보냄
    });

  } else {
    // 2. 이미 결과가 저장되어 있는 경우 (새로고침을 했거나 다른 페이지에서 뒤로가기 한 경우)
    const savedData = sessionStorage.getItem('recommendedCourses');
    if (savedData) {
      updateCoursesData(JSON.parse(savedData));
      renderCourses();
    } else {
      console.warn("⚠️ 세션스토리지에 추천 코스 데이터가 없습니다!");
      renderCourses(); // 에러 메시지가 뜨도록 빈 배열로 렌더링
    }
  }

    document.getElementById('btnSelectCourse').addEventListener('click', function() {
  
  window.location.href = '/result'; 
});
});