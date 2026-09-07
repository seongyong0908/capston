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

  // 초기 렌더링
  //renderCompanions();
  renderCategories();
  renderSequence();
  renderMoods();
  
  console.log("🚀 JS 파일 로드 완료!!");

  document.getElementById("btnSubmit").addEventListener("click", function(e) {
    e.preventDefault();

    const locSelect = document.getElementById('locSelect');
    const locCustom = document.getElementById('locCustom');

    const isCustom = locSelect.classList.contains('hidden');
    const selectedRegion = isCustom ? locCustom.value.trim() : locSelect.value;

    if (!selectedRegion) {
      alert("지역을 입력하거나 선택해주세요.");
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

          const dateValue = document.getElementById('dateInput').value;
          const startTime = document.getElementById('startTime').value;
          const endTime = document.getElementById('endTime').value;

          const peopleSelect = document.getElementById('peopleSelect');
          const peopleCustom = document.getElementById('peopleCountCustom');
          const peopleCount = peopleSelect.classList.contains('hidden')
            ? peopleCustom.value
            : peopleSelect.value;

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
            places: nearbyPlaces.map(p => ({ id: p.id, name: p.placeName, category: p.category, description: p.description }))
          };

          console.log("1. 스프링 부트로 데이터 전송 시작!", requestData);

          fetch('/api/get-course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          })
          .then(response => response.json())
          .then(data => {
            console.log("3. AI 추천 결과 도착:", data);
            sessionStorage.setItem('recommendedCourses', JSON.stringify(data.courses));
            window.location.href = '/multiple-courses';
          })
          .catch(error => {
            console.error("에러 발생:", error);
          });
        });
    }

    const preRegisteredCoords = REGION_COORDS[selectedRegion];

    if (preRegisteredCoords) {
      proceedWithCoords(preRegisteredCoords.lat, preRegisteredCoords.lng);
    } else {
      const geocoder = new kakao.maps.services.Geocoder();
      const places = new kakao.maps.services.Places();

      places.keywordSearch(selectedRegion, function(result, status) {
        if (status === kakao.maps.services.Status.OK && result.length > 0) {
          const lat = result[0].y;
          const lng = result[0].x;
          proceedWithCoords(lat, lng);
        } else {
          alert("입력하신 지역을 찾을 수 없어요. 다른 이름으로 시도해주세요.");
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

});