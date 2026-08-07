document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // 로그인 제출 시 화면이 새로고침되는 기본 동작 방지

    console.log("로그인 이벤트 작동");

    // 1. 유저가 입력한 아이디와 비밀번호 가져오기
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 2. 백엔드 API로 로그인 검증 요청 보내기
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 백엔드에서 기대하는 키값(login_id)에 맞춰서 데이터를 보냅니다.
            body: JSON.stringify({ login_id: username, password: password }) 
        });

        // 3. 서버 응답에 따른 처리
        if (response.ok) {
            // ✅ 로그인 성공 시에만 로컬 스토리지에 아이디 저장
            localStorage.setItem("loginId", username);

            // 취향 데이터 존재 여부에 따라 페이지 리다이렉션 처리
            const userTaste = localStorage.getItem('userTaste');
            if (!userTaste) {
                window.location.href = "/taste-setup"; // 취향 세팅 안 되어 있으면 설정 페이지로
            } else {
                window.location.href = "/home";        // 설정되어 있으면 메인 홈 화면으로
            }
        } else {
            // ❌ 로그인 실패 시 (비밀번호 틀림, 없는 아이디 등)
            const errorMsg = await response.text(); 
            alert(errorMsg); // 팝업으로 에러 메시지 띄우기
        }
    } catch (error) {
        console.error("로그인 통신 에러:", error);
        alert("서버와 통신하는 중 문제가 발생했습니다.");
    }
});