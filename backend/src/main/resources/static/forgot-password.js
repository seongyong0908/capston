document.addEventListener('DOMContentLoaded', function() {
  // 제어할 요소들 가져오기
  const form = document.getElementById('forgotPasswordForm');
  const successMessage = document.getElementById('successMessage');
  const cardTitle = document.getElementById('cardTitle');
  const cardDescription = document.getElementById('cardDescription');
  const retryBtn = document.getElementById('retryBtn');

  // 1. 이메일 발송 폼 제출 이벤트
  form.addEventListener('submit', function(e) {
    e.preventDefault(); // 기본 새로고침 방지

    const email = document.getElementById('email').value.trim();
    console.log("비밀번호 재설정 이메일 발송 요청:", email);

    if (!email) {
      alert("이메일을 입력해주세요!");
      return;
    }

    // 💡 백엔드 API 연동 fetch 요청
    fetch('/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
    .then(async response => {
      const text = await response.text();
      
      if (response.ok) {
        // 성공 시: 화면 상태 변경
        form.classList.add('hidden'); // 폼 숨기기
        successMessage.classList.remove('hidden'); // 성공 메시지 보여주기
        
        // 헤더 텍스트 변경
        cardTitle.textContent = "이메일 발송 완료";
        cardDescription.textContent = "비밀번호 재설정 링크를 보내드렸습니다";
      } else {
        // 실패 시 (예: 가입되지 않은 이메일 등 서버 에러 메시지 출력)
        alert(text || "메일 전송에 실패했습니다.");
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert("서버 통신 중 오류가 발생했습니다.");
    });
  });

  // 2. 다시 시도하기 버튼 이벤트
  retryBtn.addEventListener('click', function() {
    // 화면 상태 초기화 (emailSent = false와 동일한 효과)
    successMessage.classList.add('hidden'); // 성공 메시지 숨기기
    form.classList.remove('hidden'); // 폼 다시 보여주기
    document.getElementById('email').value = ''; // 입력했던 이메일 비우기
    
    // 헤더 텍스트 원상복구
    cardTitle.textContent = "비밀번호 찾기";
    cardDescription.textContent = "가입하신 이메일을 입력해주세요";
  });
});