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
            const session = await response.json();
            localStorage.setItem("loginId", session.loginId);

            if (session.needsTasteSetup) {
                localStorage.removeItem("userTaste");
                window.location.href = "/taste-setup";
            } else {
                localStorage.setItem("userTaste", "done");
                window.location.href = "/home";
            }

        } else {
            // ❌ 로그인 실패 시
            const errorMsg = await response.text();
            alert(errorMsg);
        }
    } catch (error) {
        console.error("로그인 통신 에러:", error);
        alert("서버와 통신하는 중 문제가 발생했습니다.");
    }
});