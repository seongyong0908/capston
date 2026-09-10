document.addEventListener('DOMContentLoaded', function() {

  let userTaste = localStorage.getItem('userTaste'); // 취향 설정 화면에서 저장한 값 연동

  let savedCoursesData = [];

  // 방 만들기용 임시 멤버 상태
  let tempMembers = [];
  let tempRoomType = 'couple';

  // 리뷰용 상태
  let currentReviewPlace = null;
  let currentRating = 5;

  // -- 기본 UI 렌더링 함수 --
  const renderProfile = () => {
    document.getElementById('tasteStatusText').textContent = userTaste ? "취향을 확인하고 수정하세요" : "취향을 설정하고 더 나은 추천을 받아보세요";
  };

 // 💡 서버 연동 + 방 삭제 + 멤버 표시 기능이 모두 합쳐진 최종 renderRooms 함수
const renderRooms = async () => {
    const container = document.getElementById('roomsContainer');
    if (!container) return;

    const loginId = localStorage.getItem("loginId");
    if (!loginId) return;

    try {
        // 1. 서버에서 진짜 방 목록 가져오기
        const response = await fetch(`/api/rooms?login_id=${loginId}`);
        if (!response.ok) return;

        const roomsData = await response.json();

        // 2. 방이 없을 때 화면 처리
        if (roomsData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <p class="mb-2">아직 생성된 방이 없어요</p>
                    <p class="text-sm text-gray-400">누구와 함께 할지 방을 만들어보세요!</p>
                </div>`;
            return;
        }

        // 3. 방 목록을 화면에 예쁘게 그리기
        let html = '';
        roomsData.forEach((room, index) => {
            const typeEmoji = room.roomType === 'couple' ? '💕 연인' : room.roomType === 'friend' ? '⭐ 친구' : '👨‍👩‍👧‍👦 가족';
            const activeClass = index === 0 ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300';
            const activeBadge = index === 0 ? `<span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1">활성화</span>` : '';
            
            // 초대 코드 UI (클릭하면 복사됨!)
            const inviteCodeHtml = room.inviteCode ? `
              <div class="mt-2 flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 inline-flex">
                <span class="text-xs text-gray-500 font-medium">초대 코드:</span>
                <span class="text-sm font-mono font-bold text-blue-600 tracking-wider">${room.inviteCode}</span>
                <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${room.inviteCode}').then(() => alert('초대 코드가 복사되었습니다! 📋'))" class="ml-1 text-xs bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded shadow-sm transition-colors">
                  복사
                </button>
              </div>
            ` : '';

            html += `
              <div class="border-2 rounded-xl p-4 transition-all cursor-pointer ${activeClass}">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-lg font-bold">${room.roomName}</h3>
                      ${activeBadge}
                      <span class="text-xs bg-gray-100 px-2 py-1 rounded-full">${typeEmoji}</span>
                    </div>
                    ${inviteCodeHtml}
                  </div>
                </div>
              </div>`;
        });
        
        container.innerHTML = html;

    } catch (error) {
        console.error("방 목록 불러오기 실패:", error);
    }
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
    // document.getElementById('editName').value = userProfile.name;
    // document.getElementById('editEmail').value = userProfile.email;
    // document.getElementById('editPhone').value = userProfile.phone;
    modalProfile.classList.remove('hidden');
  });
  document.getElementById('btnProfileCancel').addEventListener('click', () =>{
    modalProfile.classList.add('hidden');
  });
 document.getElementById('btnProfileSave').addEventListener('click', async () => {
    const loginId = localStorage.getItem("loginId");
    const newName = document.getElementById('editNameInput').value; // HTML input의 id에 맞춰 수정 가능
    const newEmail = document.getElementById('editEmailInput').value;
    const newPhone = document.getElementById('editPhoneInput').value;

    try {
        // 서버에 수정 요청 보내기 (백엔드 API 주소에 맞게 확인 필요)
        const response = await fetch(`/api/user?login_id=${loginId}`, {
            method: 'PUT', // 또는 PATCH
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, email: newEmail, phone: newPhone })
        });

        if (response.ok) {
            alert("프로필이 성공적으로 수정되었습니다! ✨");
            modalProfile.classList.add('hidden');
            loadUserInfo(); // 화면 새로고침 없이 바로 최신 정보로 다시 불러오기
        } else {
            alert("프로필 수정에 실패했습니다.");
        }
    } catch (error) {
        console.error("프로필 수정 통신 에러:", error);
    }
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
  


  document.getElementById('btnOpenRoomModal').addEventListener('click', () => {
    document.getElementById('roomName').value = '';
    tempRoomType = 'couple';
    // 방 타입 버튼 스타일 리셋
    document.querySelectorAll('.room-type-btn').forEach(btn => {
      btn.className = btn.dataset.type === 'couple' 
        ? "room-type-btn p-3 rounded-xl border-2 transition-all bg-pink-50 border-pink-500 shadow-md"
        : "room-type-btn p-3 rounded-xl border-2 border-gray-200 transition-all";
    });
    modalRoom.classList.remove('hidden');
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
  document.getElementById('btnRoomSave').addEventListener('click', async () => {
    const roomName = document.getElementById('roomName').value;
    if(!roomName.trim()) return alert("방 이름을 입력해주세요.");
    
   
    // 1. 로컬스토리지에서 로그인한 유저 아이디 가져오기
    const loginId = localStorage.getItem("loginId");
    if (!loginId) {
        alert("로그인 정보가 없습니다.");
        return;
    }

    // 2. 서버로 보낼 데이터 묶기
    const requestData = {
        login_id: loginId,
        room_name: roomName, // 사용자가 입력한 방 이름
        room_type: tempRoomType // 사용자가 선택한 연인/친구/가족 타입
    };

    try {
        // 3. 백엔드(스프링 부트)로 방 생성 요청 쏘기!
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            alert("방이 성공적으로 생성되었습니다! 초대 코드가 발급되었습니다. 🎉");
            closeRoomModal(); // 팝업 닫기
            
            // 임시: 서버에 저장된 내역을 다시 불러오기 위해 새로고침
            window.location.reload(); 
        } else {
            alert("방 생성에 실패했습니다.");
        }
    } catch (error) {
        console.error("통신 에러:", error);
        alert("서버 오류가 발생했습니다.");
    }
    // ⬆️ 여기까지 붙여넣기! ⬆️
  });

  // 초기 렌더링 실행
  renderProfile();
  renderRooms();
  renderSavedCourses();
  loadUserInfo();
  renderMyRooms();

// 💡 1. 내 정보 불러오기 (바깥 화면 + 모달창 입력칸 싹 다 채움!)
async function loadUserInfo() {
    const loginId = localStorage.getItem("loginId");
    if (!loginId) return;
    
    try {
        const response = await fetch(`/api/user?login_id=${loginId}`);
        if (!response.ok) return;
        const user = await response.json();
        
        // [바깥 화면 채우기]
        if (document.getElementById('profileName')) document.getElementById('profileName').textContent = user.name || "이름 없음";
        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = user.email || "이메일 없음";
        if (document.getElementById('profileAvatar') && user.name) document.getElementById('profileAvatar').textContent = user.name.charAt(0);
        
        // [수정 모달창 입력칸 채우기]
        if (document.getElementById('editNameInput')) document.getElementById('editNameInput').value = user.name || "";
        if (document.getElementById('editEmailInput')) document.getElementById('editEmailInput').value = user.email || "";
        if (document.getElementById('editPhoneInput')) document.getElementById('editPhoneInput').value = user.phone || "";
        
    } catch (error) { console.error("프로필 정보 로드 실패:", error); }
}

// 💡 2. 방 목록 불러오기
async function renderMyRooms() {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    const loginId = localStorage.getItem("loginId");
    if (!loginId) return;

    try {
        const response = await fetch(`/api/rooms?login_id=${loginId}`);
        if (!response.ok) return;
        const myRooms = await response.json();

        if (myRooms.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">참여 중인 방이 없습니다.</p>`;
            return;
        }

        let html = '';
        myRooms.forEach((room) => {
            const isRoomAdmin = room.adminId === loginId;
            
            // 💡 백엔드에서 넘겨주는 상태값 확인 (가입 대기중인지 여부)
            // 백엔드 API에서 상태를 memberStatus 같은 이름으로 준다고 가정했습니다.
            const isPending = room.memberStatus === 'PENDING'; 

            html += `
              <div class="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl mb-3 bg-white shadow-sm">
                <div>
                  <div class="flex items-center gap-2">
                      <h3 class="text-lg font-bold text-gray-800">${room.name || room.roomName || room.room_name}</h3>
                      
                      <!-- ⏳ 일반 멤버이고 승인 대기중일 때만 뱃지 표시 -->
                      ${!isRoomAdmin && isPending ? `<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">⏳ 승인 대기중</span>` : ''}
                  </div>
                  <p class="text-xs text-gray-500 mt-1">초대 코드: <span class="font-mono bg-gray-100 px-1">${room.inviteCode || "발급안됨"}</span></p>
                </div>
                
                <div class="flex gap-2">
                    ${isRoomAdmin 
                        ? ` <!-- 방장 전용 버튼 2개 -->
                            <button onclick="openMemberManageModal('${room.id || room.roomId || room.room_id}')" class="text-sm px-4 py-2 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors">👥 멤버 관리</button>
                            <button onclick="deleteRoom('${room.id || room.roomId || room.room_id}')" class="text-sm px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors">💣 방 없애기</button>` 
                        : ` <!-- 일반 멤버 전용 버튼 1개 -->
                            <button onclick="leaveRoom('${room.id || room.roomId || room.room_id}')" class="text-sm px-4 py-2 bg-gray-50 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">🏃‍♂️ 방 나가기</button>`
                    }
                </div>
              </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) { console.error("방 목록 로드 실패:", error); }
}

// 💡 3. 방 삭제 기능 (방장용)
window.deleteRoom = async (roomId) => {
    if (!confirm("정말 이 방을 삭제하시겠습니까? 🗑️")) return;
    try {
        const response = await fetch(`/api/rooms/${roomId}`, { method: 'DELETE' });
        if (response.ok) { alert("방이 성공적으로 삭제되었습니다."); window.location.reload(); }
    } catch (error) { console.error(error); }
}

// 💡 4. 방 탈퇴 기능 (멤버용)
window.leaveRoom = async (roomId) => {
    const loginId = localStorage.getItem("loginId");
    if (!confirm("이 방에서 정말 나가시겠습니까? 🏃‍♂️")) return;
    try {
        const response = await fetch(`/api/rooms/${roomId}/leave?login_id=${loginId}`, { method: 'POST' });
        if (response.ok) { alert("방에서 나갔습니다."); window.location.reload(); }
    } catch (error) { console.error(error); }
}

// ==========================================
// 💡 5. [초대코드로 방 참여] 모달 관련 로직
// ==========================================
const btnOpenJoinModal = document.getElementById('btn-open-join-modal');
const joinRoomModal = document.getElementById('joinRoomModal');
const btnCloseJoinModal = document.getElementById('btn-close-join-modal');
const btnCancelJoin = document.getElementById('btn-cancel-join');
const btnSubmitJoin = document.getElementById('btn-submit-join');
const inviteCodeInput = document.getElementById('inviteCodeInput');

// 모달 열기
if (btnOpenJoinModal) {
    btnOpenJoinModal.addEventListener('click', () => {
        joinRoomModal.classList.remove('hidden');
        if (inviteCodeInput) {
            inviteCodeInput.value = '';
            inviteCodeInput.focus();
        }
    });
}

// 모달 닫기 함수
const closeJoinModal = () => {
    if (joinRoomModal) joinRoomModal.classList.add('hidden');
};

// X 버튼이나 취소 버튼 누르면 닫기
if (btnCloseJoinModal) btnCloseJoinModal.addEventListener('click', closeJoinModal);
if (btnCancelJoin) btnCancelJoin.addEventListener('click', closeJoinModal);

// [참여하기] 버튼 눌렀을 때 서버 통신
if (btnSubmitJoin) {
    btnSubmitJoin.addEventListener('click', async () => {
        const code = inviteCodeInput.value.trim();
        
        if (!code) {
            alert("초대 코드를 입력해주세요!");
            inviteCodeInput.focus();
            return;
        }

        const loginId = localStorage.getItem("loginId");
        if (!loginId) {
            alert("로그인 정보가 없습니다.");
            return;
        }

        try {
            // 스프링 부트 서버로 참여 요청 (기존 백엔드 규격에 맞춤)
            const response = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    login_id: loginId, 
                    invite_code: code 
                })
            });

            if (response.ok) {
                alert("방에 성공적으로 참여했습니다! 🎉");
                closeJoinModal();
                window.location.reload(); // 성공 시 새로고침하여 목록 갱신
            } else {
                const errorMsg = await response.text();
                alert(errorMsg || "초대 코드가 틀렸거나 참여할 수 없는 방입니다.");
            }
        } catch (error) {
            console.error("초대코드 전송 에러:", error);
            alert("서버와 통신 중 문제가 발생했습니다.");
        }
    });
}
// ==========================================
// 👥 [멤버 관리] 모달 관련 로직 (방장 전용)
// ==========================================
const memberManageModal = document.getElementById('memberManageModal');
const memberListContainer = document.getElementById('memberListContainer');

// 1. 멤버 관리 창 열기
window.openMemberManageModal = async (roomId) => {
    // 1. 모달 띄우기
    memberManageModal.classList.remove('hidden');
    memberListContainer.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">멤버 정보를 불러오는 중입니다...</p>';

    // 2. 백엔드에서 이 방의 멤버 목록(대기자 포함) 가져오기
    try {
        const response = await fetch(`/api/rooms/${roomId}/members`);
        if (!response.ok) throw new Error("멤버 목록을 불러오지 못했습니다.");
        
        const members = await response.json();
        
        // 3. 목록 그리기
        if (members.length === 0) {
            memberListContainer.innerHTML = '<p class="text-center text-gray-500 py-4 text-sm">참여 중인 멤버가 없습니다.</p>';
            return;
        }

        let html = '';
        members.forEach(member => {
            // 멤버 상태에 따라 뱃지와 버튼 다르게 그리기
            const isPending = member.status === 'PENDING';
            
            html += `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg ${isPending ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white'}">
                    <div>
                        <p class="font-bold text-gray-800 flex items-center gap-2">
                            ${member.userId} 
                            ${isPending ? '<span class="text-[10px] bg-yellow-400 text-white px-1.5 py-0.5 rounded">대기중</span>' : ''}
                            ${member.role === 'HOST' ? '<span class="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">방장</span>' : ''}
                        </p>
                    </div>
                    
                    <div class="flex gap-1">
                        ${isPending ? `
                            <button onclick="approveMember(${member.roomId}, '${member.userId}')" class="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">승인</button>
                            <button onclick="rejectMember(${member.roomId}, '${member.userId}')" class="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">거절</button>
                        ` : `
                            ${member.role !== 'HOST' ? `<button onclick="rejectMember(${member.roomId}, '${member.userId}')" class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">추방</button>` : ''}
                        `}
                    </div>
                </div>
            `;
        });
        
        memberListContainer.innerHTML = html;

    } catch (error) {
        console.error(error);
        memberListContainer.innerHTML = '<p class="text-center text-red-500 py-4 text-sm">오류가 발생했습니다.</p>';
    }
};

// 2. 멤버 관리 창 닫기
window.closeMemberManageModal = () => {
    memberManageModal.classList.add('hidden');
};

// 3. 멤버 승인 (진짜 백엔드 통신)
window.approveMember = async (roomId, userId) => {
    if(!confirm(`${userId}님을 승인하시겠습니까?`)) return;
    try {
        const response = await fetch(`/api/rooms/${roomId}/members/${userId}/approve`, { method: 'PUT' });
        if (response.ok) {
            alert(`${userId}님을 승인했습니다! 🎉`);
            openMemberManageModal(roomId); // 모달창 목록 새로고침
        }
    } catch (error) { console.error(error); }
};

// 4. 멤버 거절/추방 (진짜 백엔드 통신)
window.rejectMember = async (roomId, userId) => {
    if(!confirm(`${userId}님을 정말 거절/추방하시겠습니까? 💥`)) return;
    try {
        const response = await fetch(`/api/rooms/${roomId}/members/${userId}/reject`, { method: 'DELETE' });
        if (response.ok) {
            alert(`${userId}님을 추방했습니다.`);
            openMemberManageModal(roomId); // 모달창 목록 새로고침
        }
    } catch (error) { console.error(error); }
};
});