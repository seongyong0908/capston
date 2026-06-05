document.addEventListener('DOMContentLoaded', function() {

  // 1. 서울 주요 지역 데이터 배열
  const seoulAreas = [
    { name: "홍대/연남동", color: "from-pink-400 to-pink-600" },
    { name: "강남/청담", color: "from-purple-400 to-purple-600" },
    { name: "성수동", color: "from-blue-400 to-blue-600" },
    { name: "잠실", color: "from-green-400 to-green-600" },
    { name: "이태원/한남", color: "from-red-400 to-red-600" },
    { name: "여의도", color: "from-yellow-400 to-yellow-600" },
    { name: "신촌/이대", color: "from-indigo-400 to-indigo-600" },
    { name: "건대", color: "from-teal-400 to-teal-600" },
    { name: "명동/남산", color: "from-orange-400 to-orange-600" },
    { name: "강북/북촌", color: "from-cyan-400 to-cyan-600" },
  ];

  const markersContainer = document.getElementById('markersContainer');

  // 2. 마커 동적 생성 및 원형 배치 로직
  seoulAreas.forEach((area, index) => {
    // 360도를 아이템 개수로 나누어 원형으로 배치하기 위한 삼각함수 계산
    const angle = (index / seoulAreas.length) * 2 * Math.PI;
    const radius = 35; // 원의 반지름 (백분율 %)
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);

    // 버튼 엘리먼트 생성
    const btn = document.createElement('button');
    btn.className = "absolute transform -translate-x-1/2 -translate-y-1/2 group z-20";
    btn.style.left = `${x}%`;
    btn.style.top = `${y}%`;

    // MapPin SVG 아이콘 문자열
    const mapPinSVG = `<svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    // 버튼 내부 HTML 세팅
    btn.innerHTML = `
      <div class="w-16 h-16 bg-gradient-to-br ${area.color} rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-4 border-white group-hover:border-blue-200">
        ${mapPinSVG}
      </div>
      <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div class="bg-white px-3 py-1 rounded-full shadow-lg border-2 border-gray-200 group-hover:border-blue-400 transition-all">
          <p class="text-sm font-bold text-gray-800">${area.name}</p>
        </div>
      </div>
    `;

    // 클릭 이벤트 추가: 선택한 지역의 파라미터를 담아 이동 (추후 생성할 preferences.html로 연결 예정)
    btn.addEventListener('click', () => {
      // URL 인코딩을 통해 한글 깨짐 방지
      window.location.href = `/preferences.html?location=${encodeURIComponent(area.name)}`;
    });

    // 컨테이너에 마커 추가
    markersContainer.appendChild(btn);
  });

  // 3. 우측 상단 빠른 네비게이션 버튼 이벤트
  document.getElementById('quickNavBtn').addEventListener('click', () => {
    window.location.href = "/preferences.html";
  });

  // 4. 검색창 이벤트 (UI 동작만 구현)
  document.getElementById('searchInput').addEventListener('input', (e) => {
    console.log("검색어 입력 중:", e.target.value);
  });

});