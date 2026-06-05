document.addEventListener('DOMContentLoaded', () => {
  // 1. 상태 관리 (State)
  // 실제 서버와 연동하기 전까지 사용할 가상의 방 데이터입니다.
  const rooms = [
    { id: 1, name: "우주최강 커플", type: "couple", members: [{name: "지민"}] },
    { id: 2, name: "불금 동기모임", type: "friend", members: [{name: "철수"}, {name: "영희"}] },
    { id: 3, name: "주말 가족나들이", type: "family", members: [{name: "엄마"}, {name: "아빠"}] }
  ];
  
  // 처음에 선택된 방이 없는 상태로 시작 (null)
  let activeRoom = null;

  // 2. DOM 요소 선택
  const body = document.getElementById('bodyContainer');
  const blob1 = document.getElementById('blob1');
  const blob2 = document.getElementById('blob2');
  const heroLogo = document.getElementById('heroLogo');
  const heroEmoji = document.getElementById('heroEmoji');
  const title1 = document.getElementById('title1');
  const title2 = document.getElementById('title2');
  const subtitle = document.getElementById('subtitle');
  const btnStart = document.getElementById('btnStart');
  
  const activeRoomName = document.getElementById('activeRoomName');
  const activeRoomEmoji = document.getElementById('activeRoomEmoji');
  const noRoomNotice = document.getElementById('noRoomNotice');
  const roomListContainer = document.getElementById('roomListContainer'); // 방 목록이 들어갈 영역

  // 3. 테마 적용 함수 (이전에 완성한 핵심 로직)
  const applyTheme = () => {
    // 기본 테마 (방이 선택되지 않았을 때)
    let config = {
      title1: "완벽한 데이트 코스를", title2: "AI가 추천해드립니다", 
      subtitle: "더 이상 데이트 계획으로 고민하지 마세요 💕",
      emoji: "💕", gradient: "from-pink-500 via-purple-500 to-purple-600",
      bgGradient: "from-pink-100 via-purple-50 to-blue-50",
      blob1: "bg-pink-300", blob2: "bg-purple-300", shadow: "shadow-pink-300/50"
    };

    // 방이 선택되었을 때 타입에 따라 테마 변경
    if (activeRoom) {
      if (activeRoom.type === 'couple') {
        const partnerName = activeRoom.members[0]?.name || "당신";
        config = { 
          title1: `${partnerName} 님과 함께 갈`, title2: "로맨틱한 코스를 준비했어요", 
          subtitle: "우리 둘만의 특별한 시간을 만들어보세요 👩‍❤️‍👨", emoji: "💕", 
          gradient: "from-pink-500 via-rose-500 to-red-500", 
          bgGradient: "from-pink-100 via-rose-50 to-red-50", 
          blob1: "bg-pink-300", blob2: "bg-rose-300", shadow: "shadow-pink-300/50" 
        };
      } else if (activeRoom.type === 'friend') {
        const fCount = activeRoom.members.length;
        config = { 
          title1: `${activeRoom.members[0]?.name || "친구"} 님${fCount > 1 ? ` 외 ${fCount - 1}명` : ""}과 함께 갈`, 
          title2: "힙한 핫플을 찾아왔어요", 
          subtitle: "트렌디한 장소에서 즐거운 시간 보내세요 🍻", emoji: "⭐", 
          gradient: "from-yellow-500 via-orange-500 to-amber-500", 
          bgGradient: "from-yellow-100 via-orange-50 to-amber-50", 
          blob1: "bg-yellow-300", blob2: "bg-orange-300", shadow: "shadow-yellow-300/50" 
        };
      } else if (activeRoom.type === 'family') {
        config = { 
          title1: "가족들과 함께 가기 좋은", title2: "편안한 나들이 코스예요", 
          subtitle: "모두가 편하게 즐길 수 있는 장소를 찾아드려요 🌳", emoji: "👨‍👩‍👧‍👦", 
          gradient: "from-green-500 via-emerald-500 to-teal-500", 
          bgGradient: "from-green-100 via-emerald-50 to-teal-50", 
          blob1: "bg-green-300", blob2: "bg-emerald-300", shadow: "shadow-green-300/50" 
        };
      }
    }

    // 화면에 테마 값 적용
    if(body) body.className = `min-h-screen transition-colors duration-500 flex flex-col overflow-auto ${config.bgGradient}`;
    if(blob1) blob1.className = `absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-colors duration-500 ${config.blob1}`;
    if(blob2) blob2.className = `absolute bottom-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transition-colors duration-500 ${config.blob2}`;
    
    if(heroLogo) heroLogo.className = `mx-auto w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${config.gradient} ${config.shadow}`;
    if(heroEmoji) heroEmoji.textContent = config.emoji;
    
    if(title1) title1.textContent = config.title1;
    if(title2) {
      title2.className = `bg-clip-text text-transparent transition-colors duration-500 ${config.gradient}`;
      title2.textContent = config.title2;
    }
    if(subtitle) subtitle.textContent = config.subtitle;
    
    if(btnStart) btnStart.className = `w-full text-xl px-12 py-5 text-white rounded-xl shadow-lg transition-all duration-500 hover:scale-[1.02] inline-flex items-center justify-center font-bold ${config.gradient}`;

    // 하단 방 정보 표시 업데이트
    if (activeRoom) {
      if(activeRoomName) activeRoomName.textContent = activeRoom.name;
      if(activeRoomEmoji) activeRoomEmoji.textContent = config.emoji;
      if(noRoomNotice) noRoomNotice.classList.add('hidden');
    } else {
      if(activeRoomName) activeRoomName.textContent = "방 선택하기";
      if(activeRoomEmoji) activeRoomEmoji.textContent = "";
      if(noRoomNotice) noRoomNotice.classList.remove('hidden');
    }
  };

  // 4. 방 목록 렌더링 함수
  const renderRoomList = () => {
    if(!roomListContainer) return;
    
    roomListContainer.innerHTML = rooms.map(room => `
      <button onclick="selectRoom(${room.id})" 
              class="w-full text-left p-4 rounded-xl border-2 transition-all ${activeRoom && activeRoom.id === room.id ? 'border-purple-500 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}">
        <div class="font-bold text-lg">${room.name}</div>
        <div class="text-sm text-gray-500">${room.type === 'couple' ? '연인' : room.type === 'friend' ? '친구' : '가족'} 방</div>
      </button>
    `).join('');
  };

  // 5. 방 선택 이벤트 (전역 함수로 등록하여 HTML의 onclick에서 호출 가능하게 함)
  window.selectRoom = (roomId) => {
    activeRoom = rooms.find(r => r.id === roomId);
    renderRoomList(); // 목록 버튼 스타일 업데이트 (선택된 방 테두리 강조)
    applyTheme();     // 전체 테마 업데이트
  };

  // 6. 추천 시작 버튼 클릭 이벤트
  if(btnStart) {
    btnStart.addEventListener('click', () => {
      if (!activeRoom) {
        alert("먼저 상단에서 방을 선택해주세요!");
        return;
      }
      // 선택된 방의 데이터를 가지고 선호도 조사 페이지로 이동
      // (실제 구현에서는 localStorage에 저장하거나 URL 파라미터로 넘깁니다)
      localStorage.setItem('selectedRoomId', activeRoom.id);
      window.location.href = 'new-preferences.html';
    });
  }

  // 7. 초기화 실행
  renderRoomList();
  applyTheme();
});