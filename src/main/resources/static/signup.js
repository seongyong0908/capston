document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault(); // 기본 폼 제출 방지

  console.log("회원가입 이벤트 작동");

  // 유저 입력값 가져오기
  const name = document.getElementById('name').value;
  const username = document.getElementById('username').value; // 이 값이 컨트롤러의 login_id로 매칭됨
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('password-confirm').value;
  const likeVibe = document.getElementById('like_vibe').value;
  const hateAct = document.getElementById('hate_act').value;
  const foodLimit = document.getElementById('food_limit').value;
  const foodMemo = document.getElementById('food_memo').value;

  // 비밀번호 일치 검사
  if (password !== passwordConfirm) {
    alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
    return;
  }

  // 💡 스프링 부트 컨트롤러(/signup)로 데이터 전송!
  fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          name: name,
          login_id: username, // 자바스크립트의 username을 백엔드가 받는 login_id 이름으로 매칭
          email: email,
          phone: phone,
          password: password,

          likeVibe: likeVibe,
          hateAct: hateAct,
          foodLimit: foodLimit,
          foodMemo: foodMemo
      })
  })
  .then(res => {
      if(res.ok) {
          alert("회원가입이 완료되었습니다!");
          window.location.href = "/";
      } else {
          alert("회원가입에 실패했습니다.");
      }
  })
  .catch(err => {
      console.error("통신 에러:", err);
      alert("서버와 통신 중 에러가 발생했습니다.");
  });
});