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
// 💡 1. 화면에 코스 카드를 그려주는 메인 함수
function renderSavedCourses() {
    const container = document.getElementById('coursesContainer');
    if (!container) return;

    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');

    if (savedCourses.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-10 font-medium">
                아직 찜한 코스가 없어요.<br>마음에 드는 데이트 코스를 보관해 보세요!
            </div>
        `;
        return;
    }

    let html = '';
    savedCourses.forEach(course => {
        const placeCount = course.places ? course.places.length : 0;
        
        // 💡 [변경] 방 종류별 색상 완벽 적용 (기본은 뱃지 없는 하얀색)
        let cardClass = "border-gray-200 hover:border-gray-400 bg-white"; 
        let badgeHtml = ""; 

        if (course.room === 'couple') {
            // ❤️ 연인 방: 빨강
            cardClass = "border-red-200 hover:border-red-400 bg-red-50";
            badgeHtml = `<div class="inline-block px-2.5 py-1 bg-red-100 text-red-600 text-xs font-extrabold rounded-md mb-2">❤️ 연인 방</div>`;
        } else if (course.room === 'friend') {
            // ⭐ 친구 방: 노랑
            cardClass = "border-yellow-200 hover:border-yellow-400 bg-yellow-50";
            badgeHtml = `<div class="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-extrabold rounded-md mb-2">⭐ 친구 방</div>`;
        } else if (course.room === 'family') {
            // 🍀 가족 방: 초록
            cardClass = "border-green-200 hover:border-green-400 bg-green-50";
            badgeHtml = `<div class="inline-block px-2.5 py-1 bg-green-100 text-green-600 text-xs font-extrabold rounded-md mb-2">🍀 가족 방</div>`;
        }

        const courseTitle = `${course.date} 맞춤 코스`;

        // 💡 [개선] 장소 데이터 제대로 보여주기 (ex: 스타벅스, 남산타워 외 1곳)
        let placeNames = '장소 정보 없음';
        if (placeCount > 0) {
            // 장소 이름들만 뽑아오기 (데이터 구조에 따라 place_name 또는 name)
            const names = course.places.map(p => p.place_name || p.name || '이름 모를 장소');
            if (names.length > 2) {
                placeNames = `${names[0]}, ${names[1]} 외 ${names.length - 2}곳`;
            } else {
                placeNames = names.join(', ');
            }
        }

        html += `
        <div class="p-4 rounded-xl border-2 ${cardClass} shadow-sm mb-4 transition-all">
            ${badgeHtml}
            <h3 class="font-bold text-gray-800 text-lg cursor-pointer" onclick="openCourseDetail('${course.id}')">
                ${courseTitle}
            </h3>
            <p class="text-sm text-gray-600 mt-1 font-medium">${placeNames}</p>
            <p class="text-xs text-gray-400 mt-0.5">총 ${placeCount}곳 · ${course.time}</p>
            
            <div class="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button onclick="deleteCourse('${course.id}')" class="px-3 py-2 bg-white/60 hover:bg-red-50 text-red-500 text-sm font-bold rounded-lg transition-colors">
                    삭제
                </button>
                <button onclick="openScheduleModal('${course.id}')" class="flex-1 px-3 py-2 bg-white/60 hover:bg-white text-gray-800 text-sm font-bold rounded-lg shadow-sm transition-colors text-center">
                    🗓️ 내 일정에 추가하기
                </button>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// 💡 2. 삭제 기능 (해당 ID를 가진 코스만 빼고 다시 저장)
window.deleteCourse = function(courseId) {
    if (!confirm('이 코스를 보관함에서 삭제하시겠습니까?')) return;
    
    let savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');
    savedCourses = savedCourses.filter(course => course.id !== courseId); // 해당 ID 삭제
    localStorage.setItem('mySavedCourses', JSON.stringify(savedCourses)); // 덮어쓰기
    
    renderSavedCourses(); // 화면 다시 그리기
};

// 💡 3. 일정 추가 기능 (우선 알림창 띄우고, 추후 진짜 캘린더 데이터에 넣을 준비)
window.addCourseToSchedule = function(courseId) {
    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');
    const targetCourse = savedCourses.find(c => c.id === courseId);
    
    if (targetCourse) {
        // 나중에 진짜 캘린더 DB(로컬스토리지 등)에 추가하는 코드를 여기에 넣을 겁니다!
        alert(`[${targetCourse.date}] 일정이 캘린더에 추가되었습니다! 🎉`);
    }
};

// 💡 4. 페이지 켜지면 무조건 한 번 실행!
document.addEventListener('DOMContentLoaded', () => {
    renderSavedCourses();
});

// 💡 모달 닫기 공통 함수
window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.add('hidden');
};

// 💡 상세 팝업 열기 함수 (디자인 업그레이드 & 카카오맵 연동)
window.openCourseDetail = function(courseId) {
    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');
    const course = savedCourses.find(c => c.id === courseId);
    if (!course) return;

    // 제목에 날짜와 코스 시간 추가
    document.getElementById('detailTitle').innerHTML = `
        <div class="text-sm text-purple-600 font-bold mb-1">${course.date}</div>
        <div class="text-xl font-extrabold text-gray-800">맞춤 코스 상세</div>
        <div class="text-xs text-gray-500 mt-1">총 예상 시간: ${course.time}</div>
    `;
    
    let contentHtml = '';
    if (course.places && course.places.length > 0) {
        // 💡 타임라인 스타일의 뼈대 시작
        contentHtml += '<div class="relative border-l-2 border-purple-200 ml-3 mt-4 space-y-6 pb-4">';
        
        course.places.forEach((place, index) => {
            const placeName = place.place_name || place.name || '이름 모를 장소';
            // 카카오맵 검색 링크 (이름으로 바로 검색되게)
            const mapLink = `https://map.kakao.com/?q=${encodeURIComponent(placeName)}`;
            
            contentHtml += `
                <div class="relative pl-6">
                    <!-- 보라색 동그라미 포인트 -->
                    <div class="absolute -left-[9px] top-1 w-4 h-4 bg-purple-500 rounded-full border-4 border-white shadow-sm"></div>
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start gap-2">
                            <div>
                                <span class="text-xs font-bold text-purple-500 mb-1 block">${index + 1}번째 장소</span>
                                <h3 class="font-bold text-gray-800 text-base">${placeName}</h3>
                            </div>
                            <a href="${mapLink}" target="_blank" class="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                📍 지도보기
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
        contentHtml += '</div>';
    } else {
        contentHtml = '<p class="text-gray-500 text-sm text-center py-10">저장된 장소 정보가 없습니다.</p>';
    }

    document.getElementById('detailContent').innerHTML = contentHtml;
    document.getElementById('detailModal').classList.remove('hidden');
};

let selectedCourseIdForSchedule = null;
let targetRoomForSchedule = 'none';

// 💡 캘린더 팝업 열기
window.openScheduleModal = function(courseId) {
    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');
    const course = savedCourses.find(c => c.id === courseId);
    if (!course) return;

    selectedCourseIdForSchedule = courseId;
    targetRoomForSchedule = course.room || 'none'; 

   // 💡 제목 칸을 아예 비워둡니다 (placeholder 텍스트만 보임)
    document.getElementById('scheduleTitleInput').value = '';

    // 오늘 날짜 세팅
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('scheduleDateInput').value = today;

    // 방 배정 UI 처리 (이전과 동일)
    const roomSelectArea = document.getElementById('roomSelectArea');
    const autoRoomBadge = document.getElementById('autoRoomBadge');

    if (targetRoomForSchedule === 'none') {
        roomSelectArea.classList.remove('hidden');
        autoRoomBadge.classList.add('hidden');
    } else {
        roomSelectArea.classList.add('hidden');
        autoRoomBadge.classList.remove('hidden');
        
        let badgeHtml = '';
        if(targetRoomForSchedule === 'couple') badgeHtml = '<span class="inline-block px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md">❤️ 연인 방 캘린더에 추가됩니다</span>';
        else if(targetRoomForSchedule === 'friend') badgeHtml = '<span class="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md">⭐ 친구 방 캘린더에 추가됩니다</span>';
        else if(targetRoomForSchedule === 'family') badgeHtml = '<span class="inline-block px-2.5 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-md">🍀 가족 방 캘린더에 추가됩니다</span>';
        autoRoomBadge.innerHTML = badgeHtml;
    }
    
    document.getElementById('scheduleModal').classList.remove('hidden');
};

// 💡 일정 최종 저장
window.confirmSchedule = function() {
    const selectedDate = document.getElementById('scheduleDateInput').value;
    const finalTitle = document.getElementById('scheduleTitleInput').value || '제목 없는 일정'; // 💡 제목 가져오기
    
    if (!selectedDate) {
        alert("날짜를 선택해 주세요!");
        return;
    }

    let finalRoom = targetRoomForSchedule;
    if (finalRoom === 'none') {
        finalRoom = document.getElementById('scheduleRoomSelect').value;
    }

    const savedCourses = JSON.parse(localStorage.getItem('mySavedCourses') || '[]');
    const courseToSchedule = savedCourses.find(c => c.id === selectedCourseIdForSchedule);
    if (!courseToSchedule) return;

    // 💡 캘린더 이벤트에 title 추가해서 저장!
    const newScheduleEvent = {
        id: `event-${Date.now()}`,
        courseId: courseToSchedule.id,
        title: finalTitle, // 드디어 캘린더 제목이 들어갑니다!
        date: selectedDate, 
        time: courseToSchedule.time,
        room: finalRoom,
        places: courseToSchedule.places
    };

    const calendarEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    calendarEvents.push(newScheduleEvent);
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));

    // 기본 방(none)이었으면 색칠해주기
    if (courseToSchedule.room === 'none') {
        courseToSchedule.room = finalRoom;
        localStorage.setItem('mySavedCourses', JSON.stringify(savedCourses));
        if (typeof renderSavedCourses === 'function') renderSavedCourses(); 
    }

    alert(`[${finalTitle}] 일정이 캘린더에 성공적으로 저장되었습니다! 🗓️`);
    closeModal('scheduleModal');
};
});