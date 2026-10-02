document.addEventListener('DOMContentLoaded', () => {
  // 상태 관리
  let preferences = { companion: "연인", courseSequence: [], mood: [] };

  const REGION_COORDS = {
    "홍대/연남동": { lat: 37.5563, lng: 126.9237 },
    "강남/청담": { lat: 37.5172, lng: 127.0473 },
    "성수동": { lat: 37.5445, lng: 127.0559 },
    "잠실": { lat: 37.5133, lng: 127.1000 },
    "이태원/한남": { lat: 37.5347, lng: 126.9946 },
    "여의도": { lat: 37.5219, lng: 126.9245 }
  };

  kakao.maps.load(function() {
    console.log("카카오맵 SDK 로딩 완료");
  });
  
  const companions = ["연인", "친구", "가족"];
  const categories = [
    { id: "cafe", label: "카페", emoji: "☕" }, { id: "restaurant", label: "레스토랑", emoji: "🍽️" },
    { id: "movie", label: "영화", emoji: "🎬" }, { id: "exhibition", label: "전시회", emoji: "🖼️" },
    { id: "shopping", label: "쇼핑", emoji: "🛍️" }, { id: "park", label: "공원/산책", emoji: "🌳" },
    { id: "sports", label: "스포츠", emoji: "⚽" }, { id: "culture", label: "문화생활", emoji: "🎭" }
  ];
  const moods = [
    { id: "romantic", label: "로맨틱" }, { id: "casual", label: "캐주얼" },
    { id: "luxury", label: "럭셔리" }, { id: "active", label: "액티브" },
    { id: "relaxed", label: "여유로운" }, { id: "trendy", label: "트렌디" },
    { id: "classic", label: "클래식" }, { id: "modern", label: "모던" }, { id: "cozy", label: "아늑한" }
  ];

  const renderCompanions = () => {
    const container = document.getElementById('companionContainer');
    container.innerHTML = companions.map(comp => `
      <button onclick="setCompanion('${comp}')" class="py-2 px-3 rounded-lg border-2 transition-all ${preferences.companion === comp ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-gray-200 hover:border-purple-500'}">
        ${comp}
      </button>
    `).join('');
  };

  const renderCategories = () => {
    const container = document.getElementById('categoryContainer');
    container.innerHTML = categories.map(cat => {
      const count = preferences.courseSequence.filter(id => id === cat.id).length;
      return `
        <button onclick="addSequence('${cat.id}')" class="relative flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 rounded-full text-sm font-semibold text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95 shadow-sm">
          <span>${cat.emoji}</span><span>${cat.label}</span>
          <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          ${count > 0 ? `<span class="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${count}</span>` : ''}
        </button>
      `;
    }).join('');
  };

  const renderSequence = () => {
    const container = document.getElementById('sequenceContainer');
    const seqCount = document.getElementById('sequenceCount');
    
    if (preferences.courseSequence.length === 0) {
      seqCount.classList.add('hidden');
      container.innerHTML = `<div class="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"><span class="text-3xl mb-2">📋</span><p class="text-sm">위 버튼을 눌러 코스를 만들어보세요!</p></div>`;
      return;
    }

    seqCount.textContent = `${preferences.courseSequence.length}개`;
    seqCount.classList.remove('hidden');

    const gradients = ["from-pink-400 to-pink-500", "from-purple-400 to-purple-500", "from-blue-400 to-blue-500", "from-green-400 to-teal-500"];
    container.innerHTML = preferences.courseSequence.map((catId, index) => {
      const cat = categories.find(c => c.id === catId);
      const bg = gradients[index % gradients.length];
      return `
        <div class="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-xl p-3 group">
          <span class="w-8 h-8 bg-gradient-to-br ${bg} text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span>
          <span class="text-xl">${cat.emoji}</span>
          <span class="flex-1 font-semibold text-gray-800">${cat.label}</span>
          <button onclick="removeSequence(${index})" class="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-400 hover:text-red-600 rounded-full flex items-center justify-center transition-colors shrink-0"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
        </div>
      `;
    }).join('');
  };

  const renderMoods = () => {
    const container = document.getElementById('moodContainer');
    container.innerHTML = moods.map(mood => {
      const isSelected = preferences.mood.includes(mood.id);
      return `
        <button onclick="toggleMood('${mood.id}')" class="px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${isSelected ? 'border-pink-500 bg-pink-500 text-white shadow-md scale-105' : 'border-gray-300 bg-white text-gray-700 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50'}">
          #${mood.label}
        </button>
      `;
    }).join('');
  };

  // ---- 추천받기를 눌러 multiple-courses 화면으로 넘어갔다가 뒤로가기로 돌아왔을 때도
  // 입력했던 내용(지역/날짜/인원/시간/예산/코스순서/분위기/AI메시지)이 그대로 남아있도록
  // sessionStorage에 임시 저장해두고 복원하는 로직 ----
  const DRAFT_KEY = 'preferencesDraft';

  const saveDraft = () => {
    const locSelect = document.getElementById('locSelect');
    const locCustom = document.getElementById('locCustom');
    const peopleSelect = document.getElementById('peopleSelect');
    const peopleCountCustom = document.getElementById('peopleCountCustom');

    const draft = {
      preferences: preferences,
      locSelectValue: locSelect.value,
      locCustomValue: locCustom.value,
      locCustomVisible: !locCustom.classList.contains('hidden'),
      dateInput: document.getElementById('dateInput').value,
      peopleSelectValue: peopleSelect.value,
      peopleCountCustomValue: peopleCountCustom.value,
      peopleCountCustomVisible: !peopleCountCustom.classList.contains('hidden'),
      startTime: document.getElementById('startTime').value,
      endTime: document.getElementById('endTime').value,
      budgetInput: document.getElementById('budgetInput').value,
      aiMessage: document.getElementById('aiMessage').value
    };

    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('입력 내용을 임시 저장하지 못했습니다:', e);
    }
  };

  const restoreDraft = () => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw);

      if (draft.preferences) {
        preferences.companion = draft.preferences.companion || preferences.companion;
        preferences.courseSequence = draft.preferences.courseSequence || [];
        preferences.mood = draft.preferences.mood || [];
      }

      const locSelect = document.getElementById('locSelect');
      const locCustom = document.getElementById('locCustom');
      if (draft.locCustomVisible) {
        locSelect.classList.add('hidden');
        locCustom.classList.remove('hidden');
        locCustom.value = draft.locCustomValue || '';
      } else if (draft.locSelectValue) {
        locSelect.value = draft.locSelectValue;
      }

      if (draft.dateInput) document.getElementById('dateInput').value = draft.dateInput;

      const peopleSelect = document.getElementById('peopleSelect');
      const peopleCountCustom = document.getElementById('peopleCountCustom');
      if (draft.peopleCountCustomVisible) {
        peopleSelect.classList.add('hidden');
        peopleCountCustom.classList.remove('hidden');
        peopleCountCustom.value = draft.peopleCountCustomValue || '';
      } else if (draft.peopleSelectValue) {
        peopleSelect.value = draft.peopleSelectValue;
      }

      if (draft.startTime) document.getElementById('startTime').value = draft.startTime;
      if (draft.endTime) document.getElementById('endTime').value = draft.endTime;
      if (draft.budgetInput) document.getElementById('budgetInput').value = draft.budgetInput;
      if (draft.aiMessage) document.getElementById('aiMessage').value = draft.aiMessage;
    } catch (e) {
      console.error('임시 저장된 입력 내용을 불러오지 못했습니다:', e);
    }
  };

  // 전역 함수 등록
  window.setCompanion = (comp) => { preferences.companion = comp; renderCompanions(); };
  window.addSequence = (id) => { preferences.courseSequence.push(id); renderCategories(); renderSequence(); };
  window.removeSequence = (idx) => { preferences.courseSequence.splice(idx, 1); renderCategories(); renderSequence(); };
  window.toggleMood = (id) => { 
    if(preferences.mood.includes(id)) preferences.mood = preferences.mood.filter(m => m !== id);
    else preferences.mood.push(id);
    renderMoods();
  };

  // 네비게이션
  document.getElementById('btnBack').addEventListener('click', () => window.location.href = '/home');

  // 초기 렌더링 (이전에 입력하다가 뒤로가기로 돌아온 경우, 임시 저장해둔 내용을 먼저 복원)
  restoreDraft();
  //renderCompanions();
  renderCategories();
  renderSequence();
  renderMoods();
  
  console.log("🚀 JS 파일 로드 완료!!");

  document.getElementById("btnSubmit").addEventListener("click", function(e) {
    e.preventDefault();

    const dateInputNode = document.getElementById('dateInput');
    const noDateCheck = document.getElementById('noDateCheckbox');

    let finalDate = dateInputNode ? dateInputNode.value : '';

    if ((noDateCheck && noDateCheck.checked) || !finalDate) {
        finalDate = '날짜 미정';
    }
    localStorage.setItem('savedCourseDate', finalDate);

    const startTime = document.getElementById('startTime').value; 
    const endTime = document.getElementById('endTime').value;     
    localStorage.setItem('savedStartTime', startTime);
    localStorage.setItem('savedEndTime', endTime);

    const locSelect = document.getElementById('locSelect');
    const locCustom = document.getElementById('locCustom');

    const isCustom = locSelect.classList.contains('hidden');
    const selectedRegion = isCustom ? locCustom.value.trim() : locSelect.value;

    if (!selectedRegion) {
      alert("지역을 입력하거나 선택해주세요.");
      return;
    }

    const dateValue = document.getElementById('dateInput').value;
    const isNoDateChecked = document.getElementById('noDateCheckbox') && document.getElementById('noDateCheckbox').checked;

    // 💡 날짜도 안 고르고, 미정 체크도 안 했을 때만 경고창 띄우기
    if (!dateValue && !isNoDateChecked) {
        alert("날짜를 선택하거나 '미정'을 체크해주세요.");
        return;
    }

    const peopleSelect = document.getElementById('peopleSelect');
    const peopleCustom = document.getElementById('peopleCountCustom');
    const peopleCount = peopleSelect.classList.contains('hidden')
      ? peopleCustom.value
      : peopleSelect.value;

    if (!peopleCount) {
      alert("인원 수를 선택해주세요.");
      return;
    }

    if (preferences.courseSequence.length === 0) {
      alert("코스 순서를 1개 이상 정해주세요.");
      return;
    }

    function proceedWithCoords(lat, lng) {
      fetch(`/api/place/nearby?lat=${lat}&lng=${lng}&radius=3`)
        .then(response => response.json())
        .then(nearbyPlaces => {
          if (nearbyPlaces.length === 0) {
            alert("이 지역에 등록된 장소가 없어요.");
            return;
          }

          const startTime = document.getElementById('startTime').value;
          const endTime = document.getElementById('endTime').value;

          const budgetRaw = document.getElementById('budgetInput').value;
          const budget = budgetRaw ? budgetRaw.replace(/,/g, '') : '';

          const aiMessage = document.getElementById('aiMessage').value;

         const requestData = {
            date: dateValue,
            startTime: startTime,
            endTime: endTime,
            peopleCount: peopleCount,
            budget: budget,
            courseSequence: preferences.courseSequence,
            mood: preferences.mood,
            extraMessage: aiMessage,
            lat: lat,
            lng: lng,
            // 💡 이 부분을 이렇게 섞고 40개 뽑는 코드로 교체하세요!
            places: nearbyPlaces
              .sort(() => Math.random() - 0.5) // 1. 무작위로 섞기
              .slice(0, 40)                    // 2. 넉넉하게 40개 자르기
              .map(p => ({ 
                  id: p.id, 
                  name: p.placeName, 
                  category: p.category 
              }))
          };
          console.log("1. 요청 데이터를 세션에 저장하고 즉시 다음 페이지로 이동!", requestData);

          // 1. 2페이지에서 꺼내 쓸 수 있도록 AI에게 보낼 데이터를 세션에 임시 저장
          sessionStorage.setItem('pendingAiRequest', JSON.stringify(requestData));

          // 2. 혹시 뒤로가기로 돌아왔을 때를 대비해 현재 화면의 입력 폼 내용 저장
          saveDraft();

          // 3. fetch로 기다리지 않고 즉시 2페이지로 이동!
          window.location.href = '/multiple-courses';
        });
    }

    const preRegisteredCoords = REGION_COORDS[selectedRegion];

    if (preRegisteredCoords) {
      proceedWithCoords(preRegisteredCoords.lat, preRegisteredCoords.lng);
    } else {
      // "강남", "왕십리"처럼 직접 입력한 지역은 REGION_COORDS에 없어서 카카오 API로
      // 좌표를 찾아야 하는데, 장소명(키워드) 검색만 쓰면 "강남"이 들어간 아무 상호명이나
      // 1순위로 잡혀서 실제 강남역/강남구와 전혀 다른 곳이 나올 수 있었음(왕십리/강남 모두
      // 이 문제로 실패). 주소 검색(addressSearch)을 먼저 시도해서 더 정확한 좌표를 찾고,
      // 그래도 못 찾으면 서울 범위로 제한한 키워드 검색으로 한 번 더 시도하도록 수정.
      const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.9780 };
      // 서울 전체를 넉넉히 덮는 사각 범위 (좌하단, 우상단) - 이 범위 밖 결과는 후보에서 제외
      const SEOUL_RECT = "126.734,37.413,127.269,37.715";

      function distanceKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const toRad = deg => deg * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
      }

      // 결과가 여러 개면 무조건 첫 번째를 쓰지 않고, 서울시청과 가장 가까운 후보를 선택
      function pickClosestToSeoul(results) {
        let best = null;
        let bestDist = Infinity;
        for (const r of results) {
          const lat = parseFloat(r.y);
          const lng = parseFloat(r.x);
          const d = distanceKm(lat, lng, SEOUL_CITY_HALL.lat, SEOUL_CITY_HALL.lng);
          if (d < bestDist) {
            bestDist = d;
            best = { lat, lng };
          }
        }
        return best;
      }

      const geocoder = new kakao.maps.services.Geocoder();
      const places = new kakao.maps.services.Places();

      function tryKeywordSearch() {
        places.keywordSearch(selectedRegion, function(result, status) {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const best = pickClosestToSeoul(result);
            proceedWithCoords(best.lat, best.lng);
          } else {
            alert("입력하신 지역을 찾을 수 없어요. 다른 이름으로 시도해주세요.");
          }
        }, { rect: SEOUL_RECT });
      }

      geocoder.addressSearch(selectedRegion, function(result, status) {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const best = pickClosestToSeoul(result);
          proceedWithCoords(best.lat, best.lng);
        } else {
          // 주소로 못 찾으면 키워드 검색으로 재시도
          tryKeywordSearch();
        }
      });
    }
  });


  //인원수
  document.getElementById('peopleSelect').addEventListener('change', function() {
  const select = this;
  const customInput = document.getElementById('peopleCountCustom');
  if (this.value === 'custom') {
    select.classList.add('hidden');
    customInput.classList.remove('hidden');
    customInput.focus();
  }
  });

  document.getElementById('peopleCountCustom').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 4);
  });

  document.getElementById('peopleCountCustom').addEventListener('blur', function() {
    if (this.value === '') {
      this.classList.add('hidden');
      document.getElementById('peopleSelect').classList.remove('hidden');
      document.getElementById('peopleSelect').value = '2';
    }
  });

  //예산
  document.getElementById('budgetInput').addEventListener('input', function() {
    let numericValue = this.value.replace(/[^0-9]/g, '');
    if (numericValue) {
      this.value = Number(numericValue).toLocaleString('ko-KR');
    } else {
      this.value = '';
    }
  });

  // 추천 받을 지역
  document.getElementById('locSelect').addEventListener('change', function() {
    const select = this;
    const customInput = document.getElementById('locCustom');
    if (this.value === 'custom') {
      select.classList.add('hidden');
      customInput.classList.remove('hidden');
      customInput.focus();
    }
  });

  document.getElementById('locCustom').addEventListener('blur', function() {
    if (this.value.trim() === '') {
      this.classList.add('hidden');
      document.getElementById('locSelect').classList.remove('hidden');
      document.getElementById('locSelect').value = '';
    }
  });

  window.toggleDateInput = function() {
    const dateInput = document.getElementById('dateInput');
    const noDateCheck = document.getElementById('noDateCheckbox');
    
    if (noDateCheck.checked) {
        dateInput.disabled = true;           // 달력 잠금
        dateInput.value = '';                // 값 비우기
        dateInput.classList.add('bg-gray-100', 'text-gray-400'); // 회색으로 변경
    } else {
        dateInput.disabled = false;          // 달력 다시 열기
        dateInput.classList.remove('bg-gray-100', 'text-gray-400');
    }
};
});