document.addEventListener('DOMContentLoaded', function() {
  // 상태 데이터를 저장할 배열들
  let favoriteMoods = [];
  let dislikedActivities = [];
  let dietaryRestrictions = [];
  let hasExistingTaste = false;

  // DOM 요소 선택
  const buttons = document.querySelectorAll('.taste-btn');
  const customDietInput = document.getElementById('customDiet');
  const completeBtn = document.getElementById('completeBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // 1. 기존 데이터 로드 (localStorage 사용)
  const loadExistingTaste = () => {
    const savedTaste = localStorage.getItem('userTaste');
    if (savedTaste) {
      hasExistingTaste = true;
      const data = JSON.parse(savedTaste);
      favoriteMoods = data.favoriteMoods || [];
      dislikedActivities = data.dislikedActivities || [];
      dietaryRestrictions = data.dietaryRestrictions || [];
      customDietInput.value = data.customDietaryRestrictions || "";
      
      updateAllUI();
      checkCompletion();
    }
  };

  // 2. UI 업데이트 함수 (배열에 값이 있으면 활성화 스타일 적용)
  const updateAllUI = () => {
    buttons.forEach(btn => {
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');
      let isSelected = false;

      // 초기화
      btn.className = "taste-btn p-3 rounded-xl border-2 transition-all";

      if (type === 'mood') {
        isSelected = favoriteMoods.includes(id);
        if (isSelected) btn.classList.add('border-pink-500', 'bg-pink-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-pink-300');
      } 
      else if (type === 'activity') {
        isSelected = dislikedActivities.includes(id);
        if (isSelected) btn.classList.add('border-red-500', 'bg-red-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-red-300');
      } 
      else if (type === 'diet') {
        isSelected = dietaryRestrictions.includes(id);
        if (isSelected) btn.classList.add('border-orange-500', 'bg-orange-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-orange-300');
      }
    });
  };

  // 3. 버튼 클릭 이벤트 (배열 값 추가/제거)
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');

      if (type === 'mood') {
        if (favoriteMoods.includes(id)) favoriteMoods = favoriteMoods.filter(item => item !== id);
        else favoriteMoods.push(id);
      } 
      else if (type === 'activity') {
        if (dislikedActivities.includes(id)) dislikedActivities = dislikedActivities.filter(item => item !== id);
        else dislikedActivities.push(id);
      } 
      else if (type === 'diet') {
        if (dietaryRestrictions.includes(id)) dietaryRestrictions = dietaryRestrictions.filter(item => item !== id);
        else dietaryRestrictions.push(id);
      }

      updateAllUI();
      checkCompletion();
    });
  });

  // 4. 완료 버튼 활성화 조건 (분위기 최소 1개 이상 선택)
  const checkCompletion = () => {
    if (favoriteMoods.length > 0) {
      completeBtn.removeAttribute('disabled');
    } else {
      completeBtn.setAttribute('disabled', 'true');
    }
  };

  // 5. 완료 버튼 클릭 시 저장 및 페이지 이동
  completeBtn.addEventListener('click', () => {
    const tasteData = {
      favoriteMoods,
      dislikedActivities,
      dietaryRestrictions,
      customDietaryRestrictions: customDietInput.value,
      savedAt: new Date().toISOString()
    };

    // localStorage에 저장 (Spring Boot 백엔드가 연결되면 fetch API로 대체)
    localStorage.setItem('userTaste', JSON.stringify(tasteData));
    console.log("취향 저장 완료:", tasteData);

    // 수정 모드였으면 마이페이지로, 신규 설정이었으면 홈으로 이동
    if (hasExistingTaste) {
      window.location.href = "/mypage.html";
    } else {
      window.location.href = "/home.html";
    }
  });

  // 6. 기타 버튼 이벤트
  cancelBtn.addEventListener('click', () => {
    window.history.back(); // 이전 페이지로
  });

  clearAllBtn.addEventListener('click', () => {
    if (confirm("모든 선택을 초기화하시겠습니까?")) {
      favoriteMoods = [];
      dislikedActivities = [];
      dietaryRestrictions = [];
      customDietInput.value = "";
      updateAllUI();
      checkCompletion();
    }
  });

  // 초기화 실행
  loadExistingTaste();
});