document.addEventListener('DOMContentLoaded', () => {
  // 1. 상태 관리 (React의 useState 역할)
  let state = { 
    companion: '연인', 
    sequence: [] 
  };
  
  // 데이터 목록 정의
  const seoulAreas = ["홍대/연남동", "강남/청담", "성수동", "잠실", "이태원/한남", "대학로/혜화"];
  const categories = [
    { id: "cafe", label: "카페", emoji: "☕" }, 
    { id: "restaurant", label: "식당", emoji: "🍽️" },
    { id: "movie", label: "영화", emoji: "🎬" }, 
    { id: "park", label: "공원/산책", emoji: "🌳" },
    { id: "activity", label: "액티비티", emoji: "🎯" },
    { id: "bar", label: "술집", emoji: "🍻" }
  ];
  const companions = ['연인', '친구', '가족'];

  // 2. 화면 렌더링 함수
  function render() {
    // 2-1. 지역 옵션 렌더링 (최초 1회만 실행해도 되지만 통합 관리)
    const locSelect = document.getElementById('locSelect');
    if (locSelect.options.length === 0) {
      locSelect.innerHTML = '<option value="">지역을 선택하세요</option>' + 
        seoulAreas.map(area => `<option value="${area}">${area}</option>`).join('');
    }

    // 2-2. 동행자(누구랑) 버튼 렌더링
    document.getElementById('companionContainer').innerHTML = companions.map(c => `
      <button onclick="setCompanion('${c}')" 
              class="flex-1 py-3 border-2 rounded-lg font-medium transition-all ${
                state.companion === c 
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }">
        ${c}
      </button>
    `).join('');

    // 2-3. 코스 카테고리 버튼 렌더링
    document.getElementById('categoryContainer').innerHTML = categories.map(cat => `
      <button onclick="addSequence('${cat.id}')" 
              class="px-4 py-2 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-full text-sm font-medium shadow-sm transition-all flex items-center gap-1">
        <span>${cat.emoji}</span> ${cat.label}
      </button>
    `).join('');

    // 2-4. 선택된 코스 순서 목록 렌더링
    const sequenceContainer = document.getElementById('sequenceContainer');
    if (state.sequence.length === 0) {
      sequenceContainer.innerHTML = `<div class="text-center text-gray-400 py-4 text-sm">아직 선택된 코스가 없습니다.<br>위에서 카테고리를 눌러 추가해주세요.</div>`;
    } else {
      sequenceContainer.innerHTML = state.sequence.map((id, idx) => {
        const cat = categories.find(c => c.id === id);
        return `
          <div class="p-3 bg-white border border-purple-100 rounded-lg flex justify-between items-center shadow-sm animate-fade-in">
            <div class="flex items-center gap-3">
              <span class="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">${idx + 1}</span>
              <span class="font-medium">${cat.emoji} ${cat.label}</span>
            </div>
            <button onclick="removeSequence(${idx})" class="text-gray-400 hover:text-red-500 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // 3. 전역 이벤트 함수 (HTML의 onclick 속성에서 호출됨)
  window.setCompanion = (c) => { 
    state.companion = c; 
    render(); 
  };
  
  window.addSequence = (id) => { 
    if(state.sequence.length >= 5) {
      alert("코스는 최대 5개까지만 선택 가능합니다.");
      return;
    }
    state.sequence.push(id); 
    render(); 
  };
  
  window.removeSequence = (idx) => { 
    state.sequence.splice(idx, 1); 
    render(); 
  };
  
  // 4. 폼 제출 로직
  document.getElementById('btnSubmit').addEventListener('click', () => {
    const location = document.getElementById('locSelect').value;
    const date = document.getElementById('dateInput').value;
    const startTime = document.getElementById('startTime').value;

    // 유효성 검사
    if (!location) return alert("추천받을 지역을 선택해주세요.");
    if (state.sequence.length === 0) return alert("최소 1개 이상의 코스 순서를 선택해주세요.");

    // 데이터 취합
    const preferenceData = {
      location: location,
      companion: state.companion,
      date: date,
      startTime: startTime,
      sequence: state.sequence
    };

    console.log("제출할 데이터:", preferenceData);
    
    // 로컬 스토리지에 저장하여 다음 페이지에서 쓸 수 있게 함
    localStorage.setItem('userPreferences', JSON.stringify(preferenceData));

    // 다음 페이지로 이동
    window.location.href = 'multiple-courses.html';
  });

  // 5. 초기 화면 렌더링 실행
  render();
});