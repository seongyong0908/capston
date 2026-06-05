document.addEventListener('DOMContentLoaded', function() {
  
  // 1. 네비게이션 버튼 이벤트 설정
  document.getElementById('navCalendarBtn').addEventListener('click', () => {
    window.location.href = "/calendar.html";
  });

  document.getElementById('navMyPageBtn').addEventListener('click', () => {
    window.location.href = "/mypage.html";
  });

  document.getElementById('navLogoutBtn').addEventListener('click', () => {
    if(confirm("로그아웃 하시겠습니까?")) {
      console.log("로그아웃 처리");
      window.location.href = "/login.html";
    }
  });

  // 추천받기 버튼 이벤트
  const handleStartRecommendation = () => {
    window.location.href = "/mapview.html"; // 코스에서는 /preferences 로 되어있으나, 지도 화면 연결을 위해 mapview로 설정
  };

  document.getElementById('startRecommendBtn').addEventListener('click', handleStartRecommendation);
  document.getElementById('footerStartBtn').addEventListener('click', handleStartRecommendation);


  // 2. 임시 날씨 데이터 로드 (React의 useEffect 로직 대체)
  const mockWeatherData = {
    temp: 22,
    feelsLike: 23,
    description: "맑고 화창함",
    humidity: 45,
    windSpeed: 2.5,
    emoji: "☀️"
  };

  // 날씨 API 연동 시 사용할 함수 뼈대 (임시 데이터를 바로 그려줌)
  const loadWeather = () => {
    const container = document.getElementById('weatherContainer');
    
    document.getElementById('weatherEmoji').textContent = mockWeatherData.emoji;
    document.getElementById('weatherTemp').textContent = mockWeatherData.temp;
    document.getElementById('weatherDesc').textContent = mockWeatherData.description;
    document.getElementById('weatherFeelsLike').textContent = mockWeatherData.feelsLike;
    document.getElementById('weatherHumidity').textContent = mockWeatherData.humidity;
    document.getElementById('weatherWind').textContent = mockWeatherData.windSpeed;

    // 데이터가 세팅되면 숨겨둔 날씨 위젯을 표시
    container.classList.remove('hidden');
  };

  // 날씨 로드 실행
  loadWeather();
});