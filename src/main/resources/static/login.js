document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault(); // 로그인 제출 시 화면이 새로고침되는 기본 동작 방지
  
  console.log("로그인 이벤트 작동");
  
  // 1. 유저가 입력한 아이디와 비밀번호 가져오기
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  /* TODO: 추후 Spring Boot 컨트롤러 API와 연동할 때 이 자리에 fetch 코드를 작성합니다.
     예시:
     fetch('/api/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ username, password })
     })
     .then(res => res.json())
     .then(data => { ... });
  */

  // 2. 임시 클라이언트 로직 (기존 React 소스코드 로직 이식)
  // 브라우저 로컬 스토리지에 유저 취향(userTaste) 정보가 있는지 검사
  const userTaste = localStorage.getItem('userTaste');

  // 취향 데이터 존재 여부에 따라 페이지 리다이렉션 처리
  if (!userTaste) {
    window.location.href = "/taste-setup.html"; // 취향 세팅이 안 되어 있으면 설정 페이지로
  } else {
    window.location.href = "/home.html";        // 설정되어 있으면 메인 홈 화면으로
  }
});