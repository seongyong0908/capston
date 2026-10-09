document.addEventListener('DOMContentLoaded', function() {
  let favoriteMoods = [];
  let dislikedActivities = [];
  let dietaryRestrictions = [];

  const buttons = document.querySelectorAll('.taste-btn');
  const customDietInput = document.getElementById('customDiet');
  const completeBtn = document.getElementById('completeBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  const updateCompleteButton = () => {
    const hasSelection = favoriteMoods.length > 0
      || dislikedActivities.length > 0
      || dietaryRestrictions.length > 0
      || Boolean(customDietInput && customDietInput.value.trim());
    completeBtn.disabled = !hasSelection;
  };

  // UI 업데이트 및 버튼 클릭 로직
  const updateAllUI = () => {
    buttons.forEach(btn => {
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');
      let isSelected = false;

      btn.className = "taste-btn p-3 rounded-xl border-2 transition-all";

      if (type === 'mood') {
        isSelected = favoriteMoods.includes(id);
        if (isSelected) btn.classList.add('border-pink-500', 'bg-pink-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-pink-300');
      } else if (type === 'activity') {
        isSelected = dislikedActivities.includes(id);
        if (isSelected) btn.classList.add('border-red-500', 'bg-red-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-red-300');
      } else if (type === 'diet') {
        isSelected = dietaryRestrictions.includes(id);
        if (isSelected) btn.classList.add('border-orange-500', 'bg-orange-50', 'shadow-md');
        else btn.classList.add('border-gray-200', 'hover:border-orange-300');
      }
      btn.setAttribute('aria-pressed', String(isSelected));
    });
  };

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      const id = btn.getAttribute('data-id');

      if (type === 'mood') {
        if (favoriteMoods.includes(id)) favoriteMoods = favoriteMoods.filter(item => item !== id);
        else favoriteMoods.push(id);
      } else if (type === 'activity') {
        if (dislikedActivities.includes(id)) dislikedActivities = dislikedActivities.filter(item => item !== id);
        else dislikedActivities.push(id);
      } else if (type === 'diet') {
        if (dietaryRestrictions.includes(id)) dietaryRestrictions = dietaryRestrictions.filter(item => item !== id);
        else dietaryRestrictions.push(id);
      }

      updateAllUI();
      updateCompleteButton();
    });
  });

  customDietInput?.addEventListener('input', updateCompleteButton);

  clearAllBtn?.addEventListener('click', () => {
    favoriteMoods = [];
    dislikedActivities = [];
    dietaryRestrictions = [];
    if (customDietInput) customDietInput.value = '';
    updateAllUI();
    updateCompleteButton();
  });

  cancelBtn?.addEventListener('click', () => {
    window.location.href = '/mypage';
  });

  // 💡 핵심: 백엔드로 전송하는 완료 버튼 클릭 이벤트
  completeBtn.addEventListener('click', async () => {
    // ✅ 수정 후 (로그인한 사람의 아이디를 브라우저 메모장에서 몰래 가져옴!)
    const login_id = localStorage.getItem("loginId");

    // 안전장치: 혹시 로그인을 안 하고 들어왔을 때를 대비
    if (!login_id) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "/";
        return;
    } 

    const tasteData = {
      login_id: login_id,
      like_vibe: favoriteMoods.join(','),
      hate_act: dislikedActivities.join(','),
      food_limit: dietaryRestrictions.join(','),
      food_memo: customDietInput ? customDietInput.value : ""
    };

    completeBtn.disabled = true;
    try {
      const response = await fetch('/api/taste-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasteData)
      });

      if (response.ok) {
        alert("취향 설정이 완료되었습니다!");
        localStorage.setItem('userTaste', 'done');
        window.location.href = "/mypage";
      } else {
        alert("서버 오류로 취향 저장에 실패했습니다.");
        updateCompleteButton();
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신 중 에러가 발생했습니다.");
      updateCompleteButton();
    }
  });

  updateAllUI();
  updateCompleteButton();
});