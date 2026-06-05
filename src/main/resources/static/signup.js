document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault(); // 기본 폼 제출 방지

  console.log("회원가입 이벤트 작동");

  // 유저 입력값 가져오기
  const name = document.getElementById('name').value;
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;

  // 간단한 유효성 검사: 비밀번호가 일치하는지 확인
  if (password !== passwordConfirm) {
    alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
    return; // 일치하지 않으면 함수를 종료하여 백엔드로 넘어가지 못하게 함
  }

  /* TODO: 추후 Spring Boot 컨트롤러(회원가입 API)와 연동할 때 아래 코드를 활성화합니다.
     fetch('/api/signup', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name, username, email, phone, password })
     })
     .then(res => {
         if(res.ok) {
             alert("회원가입이 완료되었습니다!");
             window.location.href = "/login.html";
         } else {
             alert("회원가입에 실패했습니다.");
         }
     });
  */

  // 임시 클라이언트 로직 (테스트용)
  alert("회원가입이 완료되었습니다! (임시 안내)");
  window.location.href = "/login.html"; // 가입 완료 후 로그인 화면으로 이동
});