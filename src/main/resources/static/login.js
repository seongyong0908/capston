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
            // ✅ 로그인 성공 시 로컬 스토리지에 아이디 저장
            localStorage.setItem("loginId", username);

            // 💡 DB에서 이 유저의 진짜 정보를 가져와서 취향이 설정되어 있는지 확인!
            try {
                const userRes = await fetch(`/api/user?login_id=${username}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
            
                    // 유저 데이터에 취향(likeVibe 등)이 비어있으면 (우리가 아까 가입할 때 "" 로 보냈죠?)
                    if (!userData.likeVibe || userData.likeVibe === "") {
                        window.location.href = "/taste-setup"; // 취향 설정 페이지로 이동!
                    } else {
                        // 이미 취향이 있다면 로컬 스토리지도 최신화해주고 홈으로 이동
                        localStorage.setItem("userTaste", "true"); 
                        window.location.href = "/home"; 
                    }
                }
            } catch (error) {
                console.error("유저 정보 확인 실패:", error);
                window.location.href = "/home"; // 에러 나면 일단 홈으로
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