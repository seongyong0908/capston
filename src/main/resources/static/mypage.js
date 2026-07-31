document.addEventListener('DOMContentLoaded', function() {
  
  // -- 상태(State) 데이터 (임시 데이터 초기화) --
  let userProfile = {
    name: "김데이트",
    email: "date@example.com",
    phone: "010-1234-5678",
    joinDate: "2026.03.15"
  };

  let userTaste = localStorage.getItem('userTaste'); // 취향 설정 화면에서 저장한 값 연동

  let roomsData = [
    { id: 'r1', name: '우리 둘만', type: 'couple', isActive: true, members: [{id:'m1', name:'여친님', relationship:''}] },
    { id: 'r2', name: '가족 모임', type: 'family', isActive: false, members: [] }
  ];

  let savedCoursesData = [
    { id: 'c1', title: '홍대 감성 데이트', location: '서울 마포구', date: '2026.06.01', places: ['카페', '전시회', '레스토랑'] },
    { id: 'c2', title: '강남 럭셔리 코스', location: '서울 강남구', date: '2026.05.28', places: ['브런치', '쇼핑', '파인다이닝'] }
  ];

  // 방 만들기용 임시 멤버 상태
  let tempMembers = [];
  let tempRoomType = 'couple';

  // 리뷰용 상태
  let currentReviewPlace = null;
  let currentRating = 5;

  // -- 기본 UI 렌더링 함수 --
  const renderProfile = () => {
    document.getElementById('profileAvatar').textContent = userProfile.name.charAt(0);
    document.getElementById('profileName').textContent = userProfile.name;
    document.getElementById('profileEmail').textContent = userProfile.email;
    document.getElementById('tasteStatusText').textContent = userTaste ? "취향을 확인하고 수정하세요" : "취향을 설정하고 더 나은 추천을 받아보세요";
  };

  const renderRooms = () => {
    const container = document.getElementById('roomsContainer');
    if (roomsData.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p class="mb-2">아직 생성된 방이 없어요</p>
          <p class="text-sm text-gray-400">누구와 함께 할지 방을 만들어보세요!</p>
        </div>`;
      return;
    }

    let html = '';
    roomsData.forEach(room => {
      const typeEmoji = room.type === 'couple' ? '💕 연인' : room.type === 'friend' ? '⭐ 친구' : '👨‍👩‍👧‍👦 가족';
      const activeClass = room.isActive ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300';
      const activeBadge = room.isActive ? `<span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>활성화</span>` : '';
      
      let membersHtml = room.members.map(m => `<span class="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full">${m.name}${m.relationship ? ` (${m.relationship})` : ''}</span>`).join('');

      html += `
        <div class="border-2 rounded-xl p-4 transition-all cursor-pointer ${activeClass}" onclick="setActiveRoom('${room.id}')">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-lg font-bold">${room.name}</h3>
                ${activeBadge}
                <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${typeEmoji}</span>
              </div>
              <div class="flex flex-wrap gap-1 mt-2">${membersHtml}</div>
            </div>
            <button class="hover:bg-red-100 hover:text-red-600 p-2 rounded-md transition-colors" onclick="event.stopPropagation(); deleteRoom('${room.id}')">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  };

  const renderSavedCourses = () => {
    const container = document.getElementById('coursesContainer');
    if (savedCoursesData.length === 0) {
      container.innerHTML = `<div class="text-center py-12 text-gray-500">코스가 없습니다.</div>`;
      return;
    }
    
    let html = '';
    savedCoursesData.forEach(course => {
      let placesHtml = course.places.slice(0,4).map(p => `<span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${p}</span>`).join('');
      if(course.places.length > 4) placesHtml += `<span class="text-xs bg-gray-100 px-2 py-1 rounded-full">+${course.places.length - 4}</span>`;

      html += `
        <div class="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-500 transition-all cursor-pointer" onclick="openCourseDetail('${course.id}')">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-lg font-bold">${course.title}</h3>
                <span class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">${course.location}</span>
              </div>
              <p class="text-sm text-gray-600 mb-2">${course.date}</p>
              <div class="flex flex-wrap gap-1">${placesHtml}</div>
            </div>
            <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  };

  // 전역 함수화 (HTML onclick 연동용)
  window.setActiveRoom = (id) => {
    roomsData.forEach(r => r.isActive = (r.id === id));
    renderRooms();
  };
  window.deleteRoom = (id) => {
    if(confirm("이 방을 삭제하시겠습니까?")) {
      roomsData = roomsData.filter(r => r.id !== id);
      renderRooms();
    }
  };

  // -- 라우팅 & 단순 이동 이벤트 --
  document.getElementById('btnLogout').addEventListener('click', () => {
    if(confirm("로그아웃 하시겠습니까?")) window.location.href = "/";
  });
  document.getElementById('btnMyTaste').addEventListener('click', () => {
    window.location.href = "/taste-setup";
  });


  // -- 1. 프로필 수정 모달 --
  const modalProfile = document.getElementById('modalProfile');
  document.getElementById('btnEditProfile').addEventListener('click', () => {
    document.getElementById('editName').value = userProfile.name;
    document.getElementById('editEmail').value = userProfile.email;
    document.getElementById('editPhone').value = userProfile.phone;
    modalProfile.classList.remove('hidden');
  });
  document.getElementById('btnProfileCancel').addEventListener('click', () => modalProfile.classList.add('hidden'));
  document.getElementById('btnProfileSave').addEventListener('click', () => {
    userProfile.name = document.getElementById('editName').value;
    userProfile.email = document.getElementById('editEmail').value;
    userProfile.phone = document.getElementById('editPhone').value;
    renderProfile();
    modalProfile.classList.add('hidden');
  });

  // -- 2. 코스 상세 모달 --
  const modalCourseDetail = document.getElementById('modalCourseDetail');
  window.openCourseDetail = (id) => {
    const course = savedCoursesData.find(c => c.id === id);
    if(!course) return;

    document.getElementById('detailTitle').textContent = course.title;
    document.getElementById('detailLoc').textContent = course.location;
    document.getElementById('detailDate').textContent = course.date;
    
    let placesHtml = '';
    course.places.forEach((place, idx) => {
      placesHtml += `
        <div class="p-3 border-2 border-gray-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">${idx+1}</div>
            <h4 class="font-bold text-base flex-1">${place}</h4>
            <button onclick="openReviewModal('${place}')" class="shrink-0 h-8 px-3 text-xs border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-md">리뷰 작성</button>
          </div>
        </div>`;
    });
    document.getElementById('detailPlacesContainer').innerHTML = placesHtml;
    modalCourseDetail.classList.remove('hidden');
  };
  const closeCourseDetail = () => modalCourseDetail.classList.add('hidden');
  document.getElementById('btnCourseClose').addEventListener('click', closeCourseDetail);
  document.getElementById('btnCourseCloseBottom').addEventListener('click', closeCourseDetail);


  // -- 3. 리뷰 작성 모달 --
  const modalReview = document.getElementById('modalReview');
  const starContainer = document.getElementById('starContainer');
  
  const renderStars = () => {
    let html = '';
    for(let i=1; i<=5; i++){
      const activeClass = i <= currentRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-none';
      html += `
        <button onclick="setReviewRating(${i})" class="transition-transform hover:scale-110">
          <svg class="w-10 h-10 ${activeClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>`;
    }
    starContainer.innerHTML = html;
  };
  
  window.setReviewRating = (rating) => {
    currentRating = rating;
    renderStars();
  };

  window.openReviewModal = (placeName) => {
    currentReviewPlace = placeName;
    currentRating = 5;
    document.getElementById('reviewPlaceName').textContent = placeName;
    document.getElementById('reviewText').value = '';
    renderStars();
    modalReview.classList.remove('hidden');
  };

  const closeReviewModal = () => modalReview.classList.add('hidden');
  document.getElementById('btnReviewClose').addEventListener('click', closeReviewModal);
  document.getElementById('btnReviewCancel').addEventListener('click', closeReviewModal);
  document.getElementById('btnReviewSave').addEventListener('click', () => {
    if(!document.getElementById('reviewText').value.trim()) return alert("리뷰 내용을 입력해주세요.");
    alert("리뷰가 등록되었습니다!");
    closeReviewModal();
  });


  // -- 4. 방 만들기 모달 --
  const modalRoom = document.getElementById('modalRoom');
  
  const renderTempMembers = () => {
    const container = document.getElementById('addedMembersContainer');
    container.innerHTML = tempMembers.map(m => `
      <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2">
        ${m.name}${m.relationship ? ` (${m.relationship})` : ''}
        <button onclick="removeTempMember('${m.id}')" class="hover:text-red-600"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </span>
    `).join('');
  };

  window.removeTempMember = (id) => {
    tempMembers = tempMembers.filter(m => m.id !== id);
    renderTempMembers();
  };

  document.getElementById('btnOpenRoomModal').addEventListener('click', () => {
    document.getElementById('roomName').value = '';
    tempMembers = [];
    tempRoomType = 'couple';
    // 방 타입 버튼 스타일 리셋
    document.querySelectorAll('.room-type-btn').forEach(btn => {
      btn.className = btn.dataset.type === 'couple' 
        ? "room-type-btn p-3 rounded-xl border-2 transition-all bg-pink-50 border-pink-500 shadow-md"
        : "room-type-btn p-3 rounded-xl border-2 border-gray-200 transition-all";
    });
    renderTempMembers();
    modalRoom.classList.remove('hidden');
  });

  // 멤버 추가 버튼
  document.getElementById('btnAddMember').addEventListener('click', () => {
    const nameInput = document.getElementById('memberName');
    const relInput = document.getElementById('memberRel');
    if(nameInput.value.trim()){
      tempMembers.push({ id: `m${Date.now()}`, name: nameInput.value, relationship: relInput.value });
      nameInput.value = '';
      relInput.value = '';
      renderTempMembers();
    }
  });

  // 방 타입 변경 버튼
  document.querySelectorAll('.room-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      tempRoomType = btn.dataset.type;
      document.querySelectorAll('.room-type-btn').forEach(b => {
        if(b === btn) {
          if(tempRoomType==='couple') b.className = "room-type-btn p-3 rounded-xl border-2 transition-all bg-pink-50 border-pink-500 shadow-md";
          else if(tempRoomType==='friend') b.className = "room-type-btn p-3 rounded-xl border-2 transition-all bg-yellow-50 border-yellow-500 shadow-md";
          else b.className = "room-type-btn p-3 rounded-xl border-2 transition-all bg-green-50 border-green-500 shadow-md";
        } else {
          b.className = "room-type-btn p-3 rounded-xl border-2 border-gray-200 transition-all hover:border-gray-300";
        }
      });
    });
  });

  const closeRoomModal = () => modalRoom.classList.add('hidden');
  document.getElementById('btnRoomClose').addEventListener('click', closeRoomModal);
  document.getElementById('btnRoomCancel').addEventListener('click', closeRoomModal);
  document.getElementById('btnRoomSave').addEventListener('click', () => {
    const roomName = document.getElementById('roomName').value;
    if(!roomName.trim()) return alert("방 이름을 입력해주세요.");
    
    roomsData.push({
      id: `r${Date.now()}`,
      name: roomName,
      type: tempRoomType,
      isActive: roomsData.length === 0, // 첫 방이면 활성화
      members: [...tempMembers]
    });
    
    renderRooms();
    closeRoomModal();
  });

  // 초기 렌더링 실행
  renderProfile();
  renderRooms();
  renderSavedCourses();
});