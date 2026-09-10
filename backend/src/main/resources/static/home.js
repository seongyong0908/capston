document.addEventListener('DOMContentLoaded', () => {


  // 더미 데이터: 인기 코스
  const popularCourses = [
    { id: "popular-1", userName: "김민지", userAvatar: "🙋‍♀️", title: "홍대 감성 데이트 코스", location: "홍대/신촌", type: "couple", places: ["망원한강공원", "연남동 카페거리", "홍대 맛집"], likes: 234, views: 1240, tags: ["로맨틱", "감성", "카페"] },
    { id: "popular-2", userName: "박서준", userAvatar: "🙋‍♂️", title: "강남 핫플 투어", location: "강남/역삼", type: "friend", places: ["압구정 로데오", "청담동 카페", "강남 술집"], likes: 189, views: 890, tags: ["핫플", "트렌디", "액티비티"] },
    { id: "popular-3", userName: "이가은", userAvatar: "👩", title: "가족과 함께 서울숲", location: "성수/서울숲", type: "family", places: ["서울숲", "성수 카페", "어린이대공원"], likes: 156, views: 720, tags: ["가족", "힐링", "자연"] }
  ];

  // 더미 데이터: 사용자 방 목록 (localStorage 등에서 불러왔다고 가정)
  let allRooms = [];
  let activeRoom = null; // 초기에는 선택 안 된 상태

  // DOM 요소
  const body = document.getElementById('bodyContainer');
  const blob1 = document.getElementById('blob1');
  const blob2 = document.getElementById('blob2');
  const heroLogo = document.getElementById('heroLogo');
  const heroEmoji = document.getElementById('heroEmoji');
  const title1 = document.getElementById('heroTitle1');
  const title2 = document.getElementById('heroTitle2');
  const subtitle = document.getElementById('heroSubtitle');
  const btnStart = document.getElementById('btnStartRecommend');
  const activeRoomName = document.getElementById('activeRoomName');
  const activeRoomEmoji = document.getElementById('activeRoomEmoji');
  const noRoomNotice = document.getElementById('noRoomNotice');
  const modal = document.getElementById('roomSelectorModal');
  const weatherEmojiEl = document.getElementById('weatherEmoji');
  const weatherTempEl = document.getElementById('weatherTemp');
  const weatherDescEl = document.getElementById('weatherDesc');

  // 방 종류(couple/friend/family)에 따른 하단 네비게이션 강조 색상
  // (홈/지도보기/캘린더/마이페이지 화면에서 공통으로 쓰는 색상표)
  const ROOM_NAV_COLORS = {
    couple: { text: 'text-rose-600', fill: 'fill-rose-100', stroke: 'stroke-rose-600', bar: 'bg-rose-600' },
    friend: { text: 'text-orange-600', fill: 'fill-orange-100', stroke: 'stroke-orange-600', bar: 'bg-orange-600' },
    family: { text: 'text-emerald-600', fill: 'fill-emerald-100', stroke: 'stroke-emerald-600', bar: 'bg-emerald-600' },
    default: { text: 'text-purple-600', fill: 'fill-purple-100', stroke: 'stroke-purple-600', bar: 'bg-purple-600' }
  };

  // 현재 화면(홈)의 하단 네비게이션 "홈" 탭 색상을 활성화된 방 색상에 맞게 바꿈
  const applyNavRoomColor = () => {
    const type = localStorage.getItem('activeRoomType') || 'default';
    const c = ROOM_NAV_COLORS[type] || ROOM_NAV_COLORS.default;
    const navBtn = document.getElementById('navActiveBtn');
    const navIcon = document.getElementById('navActiveIcon');
    const navBar = document.getElementById('navActiveBar');
    if (navBtn) navBtn.className = `relative flex flex-col items-center justify-center py-3 px-1 transition-all ${c.text}`;
    if (navIcon) navIcon.setAttribute('class', `w-6 h-6 mb-1 ${c.fill} ${c.stroke}`);
    if (navBar) navBar.className = `absolute bottom-0 w-8 h-0.5 ${c.bar} rounded-full`;
  };

  // 기상청 API는 별도 키 발급이 필요해서, 키 없이 바로 쓸 수 있는 Open-Meteo로
  // 서울(시청 좌표) 현재 날씨를 가져온다.
  const SEOUL_LAT = 37.5665;
  const SEOUL_LNG = 126.9780;

  // Open-Meteo의 weathercode(WMO 코드) -> 이모지/한글 설명
  function describeWeatherCode(code) {
    if (code === 0) return { emoji: "☀️", desc: "맑고 화창함" };
    if (code === 1) return { emoji: "🌤️", desc: "대체로 맑음" };
    if (code === 2) return { emoji: "⛅", desc: "구름 조금" };
    if (code === 3) return { emoji: "☁️", desc: "흐림" };
    if (code === 45 || code === 48) return { emoji: "🌫️", desc: "안개" };
    if ([51, 53, 55, 56, 57].includes(code)) return { emoji: "🌦️", desc: "이슬비" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { emoji: "🌧️", desc: "비" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { emoji: "❄️", desc: "눈" };
    if (code === 95 || code === 96 || code === 99) return { emoji: "⛈️", desc: "천둥번개" };
    return { emoji: "🌡️", desc: "" };
  }

  const loadSeoulWeather = async () => {
    if (!weatherTempEl) return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${SEOUL_LAT}&longitude=${SEOUL_LNG}&current_weather=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("날씨 API 응답 오류");
      const data = await response.json();
      const current = data.current_weather;
      if (!current) throw new Error("날씨 데이터 없음");

      const { emoji, desc } = describeWeatherCode(current.weathercode);
      weatherTempEl.textContent = `${Math.round(current.temperature)}°C`;
      if (weatherDescEl) weatherDescEl.textContent = desc;
      if (weatherEmojiEl) weatherEmojiEl.textContent = emoji;
    } catch (error) {
      console.error("날씨 정보를 불러오지 못했습니다:", error);
      if (weatherDescEl) weatherDescEl.textContent = "날씨 정보를 불러올 수 없어요";
    }
  };


  const renderRooms = async () => {
    const container = document.getElementById('roomListContainer');
    if (!container) return;

    const loginId = localStorage.getItem("loginId");
    if (!loginId) return;

    try {
        const response = await fetch(`/api/rooms?login_id=${loginId}`);
        if (!response.ok) return;

        allRooms = await response.json();

        // 로컬스토리지에 저장해둔 활성 방 id가 있으면 복원 (다른 화면 갔다가 홈으로 돌아와도 선택했던 방이 유지되게)
        const savedRoomId = localStorage.getItem('activeRoomId');
        if (savedRoomId) {
            const restored = allRooms.find(r => String(r.id ?? r.roomId ?? r.room_id) === String(savedRoomId));
            if (restored) {
                activeRoom = restored;
            } else {
                // 저장해둔 방이 삭제되는 등 더 이상 없으면 초기화
                localStorage.removeItem('activeRoomId');
                localStorage.removeItem('activeRoomType');
                activeRoom = null;
            }
        }
        applyTheme(); // 복원된(혹은 초기화된) activeRoom 기준으로 화면 다시 반영

        // 방이 하나도 없을 때의 화면 + 닫기/방관리 버튼
        if (allRooms.length === 0) {
            container.innerHTML = `
                <p class="text-sm text-gray-400 text-center py-4">참여 중인 방이 없습니다.</p>
                <div class="pt-4 flex gap-3 mt-2">
                    <button onclick="document.getElementById('roomSelectorModal').classList.add('hidden')" class="flex-1 h-11 border-2 border-gray-200 rounded-md hover:bg-gray-50 transition-colors">닫기</button>
                    <button onclick="window.location.href='/mypage'" class="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md transition-transform hover:scale-105">방 관리</button>
                </div>
            `;
            return;
        }

        let html = '';

        // 0. 메인(기본 화면)으로 돌아가는 옵션 - 특정 방을 선택하지 않은 기본 상태로 전환
        const isMain = !activeRoom;
        html += `
          <button onclick="resetToMainRoom()" class="w-full p-4 border-2 rounded-xl transition-all text-left mb-2 ${isMain ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-lg font-bold">🏠 메인으로</h3>
              ${isMain ? `<span class="text-xs bg-purple-500 text-white px-2 py-1 rounded-full shadow-sm">✓ 활성화</span>` : ''}
            </div>
            <p class="text-xs text-gray-500">특정 방 없이 기본 화면으로 돌아가요</p>
          </button>
        `;

        // 1. 방 목록 예쁘게 그리기
        allRooms.forEach((room) => {
            const currentName = room.name || room.roomName || room.room_name || "이름 없음";
            const currentType = room.type || room.roomType || room.room_type || "family";
            const currentId = room.id || room.roomId || room.room_id;

            const isAct = activeRoom && activeRoom.id === currentId;
            const typeEmoji = currentType === 'couple' ? '💕 연인' : currentType === 'friend' ? '⭐ 친구' : '👨‍👩‍👧‍👦 가족';
            
            html += `
              <button onclick="selectRoom('${currentId}')" class="w-full p-4 border-2 rounded-xl transition-all text-left mb-2 ${isAct ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold">${currentName}</h3>
                  ${isAct ? `<span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full shadow-sm">✓ 활성화</span>` : ''}
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${typeEmoji}</span>
                </div>
              </button>
            `;
        });

        // 2. 잃어버린 닫기 / 방 관리 버튼 추가하기!
        html += `
          <div class="pt-4 flex gap-3 mt-2 border-t border-gray-100">
            <button onclick="document.getElementById('roomSelectorModal').classList.add('hidden')" class="flex-1 h-11 border-2 border-gray-200 rounded-md hover:bg-gray-50 transition-colors">닫기</button>
            <button onclick="window.location.href='/mypage'" class="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md transition-transform hover:scale-[1.02] shadow-md">방 관리</button>
          </div>
        `;
        
        container.innerHTML = html;

    } catch (error) {
        console.error("방 목록 불러오기 실패:", error);
    }
};

  // 방 타입에 따른 테마 설정
  const applyTheme = () => {
    let config = {
      title1: "완벽한 데이트 코스를", title2: "AI가 추천해드립니다", subtitle: "더 이상 데이트 계획으로 고민하지 마세요 💕",
      emoji: "💕", gradient: "bg-gradient-to-r from-pink-500 via-purple-500 to-purple-600",
      bgGradient: "bg-gradient-to-br from-pink-100 via-purple-50 to-blue-50",
      blob1: "bg-pink-300", blob2: "bg-purple-300", shadow: "shadow-pink-300/50"
    };

    if (activeRoom) {
      // 💡 수정포인트 1: 백엔드에서 주는 이름표인 'roomType'으로 변경!
      const rType = activeRoom.roomType; 
      // 💡 수정포인트 2: 멤버 이름 대신 백엔드에서 주는 'roomName'(방 이름) 사용!
      const rName = activeRoom.roomName || activeRoom.name || "우리"; 

      if (rType === 'couple') {
        config = { ...config, title1: `[${rName}] 방을 위한`, title2: "로맨틱한 코스를 준비했어요", subtitle: "우리 둘만의 특별한 시간을 만들어보세요 👩‍❤️‍👨", emoji: "💕", gradient: "bg-gradient-to-r from-pink-500 via-rose-500 to-red-500", bgGradient: "bg-gradient-to-br from-pink-100 via-rose-50 to-red-50", blob1: "bg-pink-300", blob2: "bg-rose-300", shadow: "shadow-pink-300/50" };
      } else if (rType === 'friend') {
        config = { ...config, title1: `[${rName}] 방 친구들과 갈`, title2: "힙한 핫플을 찾아왔어요", subtitle: "트렌디한 장소에서 즐거운 시간 보내세요 🍻", emoji: "⭐", gradient: "bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500", bgGradient: "bg-gradient-to-br from-yellow-100 via-orange-50 to-amber-50", blob1: "bg-yellow-300", blob2: "bg-orange-300", shadow: "shadow-yellow-300/50" };
      } else if (rType === 'family') {
        config = { ...config, title1: `[${rName}] 가족들과 가기 좋은`, title2: "편안한 나들이 코스예요", subtitle: "모두가 편하게 즐길 수 있는 장소를 찾아드려요 🌳", emoji: "👨‍👩‍👧‍👦", gradient: "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500", bgGradient: "bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50", blob1: "bg-green-300", blob2: "bg-emerald-300", shadow: "shadow-green-300/50" };
      }
    }


    // UI 반영
    body.className = `min-h-screen transition-colors duration-500 flex flex-col overflow-auto ${config.bgGradient}`;
    blob1.className = `absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob transition-colors duration-500 ${config.blob1}`;
    blob2.className = `absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 transition-colors duration-500 ${config.blob2}`;
    
    heroLogo.className = `mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-xl animate-pulse-slow transition-all duration-500 ${config.gradient} ${config.shadow}`;
    heroEmoji.textContent = config.emoji;
    
    title1.textContent = config.title1;
    title2.className = `${config.gradient} bg-clip-text text-transparent transition-colors duration-500`;
    title2.textContent = config.title2;
    subtitle.textContent = config.subtitle;
    
    btnStart.className = `text-xl px-12 py-6 text-white rounded-md shadow-2xl transition-all duration-500 hover:scale-105 inline-flex items-center ${config.gradient}`;

    if (activeRoom) {
      // 💡 백엔드가 주는 필드명은 roomName이라 활성 방 이름이 그동안 안 나오고 있었음 - roomName 우선 사용하도록 수정
      activeRoomName.textContent = activeRoom.roomName || activeRoom.name || "이름 없음";
      activeRoomEmoji.textContent = config.emoji;
      noRoomNotice.classList.add('hidden');
    } else {
      activeRoomName.textContent = "방 선택하기";
      activeRoomEmoji.textContent = "";
      noRoomNotice.classList.remove('hidden');
    }

    applyNavRoomColor(); // 하단 네비게이션 "홈" 탭 색상도 방 색상에 맞게 갱신
  };

  // 인기 코스 렌더링
  const renderPopularCourses = () => {
    const container = document.getElementById('popularCoursesContainer');
    container.innerHTML = popularCourses.map(c => `
      <div class="border border-gray-100 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] bg-white p-5">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-lg">${c.userAvatar}</div>
          <div class="flex-1"><p class="text-sm font-semibold text-gray-900">${c.userName}</p><p class="text-xs text-gray-500">${c.location}</p></div>
          <span class="text-xl">${c.type === 'couple' ? '💕' : c.type === 'friend' ? '⭐' : '👨‍👩‍👧‍👦'}</span>
        </div>
        <h3 class="font-bold text-lg mb-3 text-gray-900">${c.title}</h3>
        <div class="space-y-2 mb-4">
          ${c.places.map(p => `<div class="flex items-center gap-2 text-sm text-gray-600">📍 <span>${p}</span></div>`).join('')}
        </div>
        <div class="flex flex-wrap gap-1 mb-3">
          ${c.tags.map(t => `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">#${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  };

  // 방 선택 모달 리스트 렌더링
  const renderRoomModal = () => {
    const container = document.getElementById('roomListContainer');
    container.innerHTML = allRooms.map(room => {
      const isAct = activeRoom && activeRoom.id === room.id;
      return `
        <button onclick="selectRoom('${room.id}')" class="w-full p-4 border-2 rounded-xl transition-all text-left ${isAct ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-lg font-bold">${room.name}</h3>
            ${isAct ? `<span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">✓ 활성화</span>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${room.type === 'couple' ? '💕 연인' : room.type === 'friend' ? '⭐ 친구' : '👨‍👩‍👧‍👦 가족'}</span>
          </div>
        </button>
      `;
    }).join('') + `
      <div class="pt-4 flex gap-3">
        <button onclick="document.getElementById('roomSelectorModal').classList.add('hidden')" class="flex-1 h-11 border-2 border-gray-200 rounded-md hover:bg-gray-50">닫기</button>
        <button onclick="window.location.href='/mypage'" class="flex-1 h-11 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md">방 관리</button>
      </div>
    `;
  };

// 방 선택 함수 (수정됨)
window.selectRoom = (id) => {
    // 💡 r.id를 String으로 바꿔서 글자끼리 안전하게 비교하도록 수정!
    activeRoom = allRooms.find(r => String(r.id ?? r.roomId ?? r.room_id) === String(id));

    console.log("선택된 방 데이터:", activeRoom); // 👈 잘 들어왔는지 CCTV도 하나 달아둡시다!

    // 다른 화면 갔다가 돌아와도 선택한 방이 유지되도록 저장
    if (activeRoom) {
        const roomId = activeRoom.id ?? activeRoom.roomId ?? activeRoom.room_id;
        localStorage.setItem('activeRoomId', roomId);
        localStorage.setItem('activeRoomType', activeRoom.roomType || activeRoom.type || activeRoom.room_type || 'default');
    }

    modal.classList.add('hidden');
    applyTheme();
    renderRooms(); // 방 선택 모달의 "활성화" 표시와 방 이름 표시를 최신 상태로 갱신
};

// 메인(기본) 화면으로 돌아가는 함수 - 선택했던 방을 해제함
window.resetToMainRoom = () => {
    activeRoom = null;
    localStorage.removeItem('activeRoomId');
    localStorage.removeItem('activeRoomType');
    modal.classList.add('hidden');
    applyTheme();
    renderRooms();
};

  // 모달 토글
  document.getElementById('btnOpenRoomSelector').addEventListener('click', () => { modal.classList.remove('hidden'); });
  document.getElementById('btnRoomClose').addEventListener('click', () => modal.classList.add('hidden'));

  // 추천받기 버튼
  btnStart.addEventListener('click', () => window.location.href = '/preferences');

  // 초기화
  applyTheme();
  renderPopularCourses();
  renderRooms();
  loadSeoulWeather();
});

// 💡 새로운 방을 생성해서 서버로 보내는 함수
async function createNewRoom(roomName, roomType) {
    // 1. 로컬스토리지에서 현재 로그인한 내 아이디 꺼내기
    const loginId = localStorage.getItem("loginId");
    
    if (!loginId) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        window.location.href = "/";
        return;
    }
 
    // 2. 서버로 보낼 데이터 포장
    const roomData = {
        login_id: loginId,
        room_name: roomName,
        room_type: roomType
    };

    try {
        // 3. 백엔드 주방장에게 방 만들어달라고 요청 (fetch)
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });

        if (response.ok) {
            alert("새로운 방이 성공적으로 만들어졌습니다! 🎉");
            // 방이 만들어졌으니 화면을 새로고침해서 최신 상태로 만듦
            window.location.reload(); 
        } else {
            alert("방 생성에 실패했습니다.");
        }
    } catch (error) {
        console.error("통신 에러:", error);
        alert("서버와 통신하는 중 문제가 발생했습니다.");
    }
}
