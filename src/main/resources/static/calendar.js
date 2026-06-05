document.addEventListener('DOMContentLoaded', function() {
  
  // -- 상태 (State) 변수 --
  let currentDate = new Date();
  let selectedDate = null;
  let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
  let currentEventType = 'memo'; // 기본값

  // -- DOM 요소 선택 --
  const calendarTitle = document.getElementById('calendarTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateCount = document.getElementById('selectedDateCount');
  const eventListContainer = document.getElementById('eventListContainer');
  const btnAddEvent = document.getElementById('btnAddEvent');
  const quickAddCard = document.getElementById('quickAddCard');

  // 모달 요소
  const eventModal = document.getElementById('eventModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const eventIdInput = document.getElementById('eventId');
  const eventTitleInput = document.getElementById('eventTitle');
  const eventTimeInput = document.getElementById('eventTime');
  const eventDescInput = document.getElementById('eventDesc');
  const typeBtns = document.querySelectorAll('.type-btn');

  // -- 날짜 포맷 함수 (YYYY-MM-DD) --
  const formatDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDay = (date) => {
    const dateStr = formatDate(date);
    return events.filter(e => e.date === dateStr);
  };

  // -- 달력 그리기 --
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    calendarTitle.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
    const daysInMonth = lastDay.getDate();

    let gridHTML = '';

    // 빈 칸 (이전 달)
    for (let i = 0; i < startingDayOfWeek; i++) {
      gridHTML += `<div class="aspect-square p-2 invisible"></div>`;
    }

    // 날짜 칸
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = formatDate(dateObj);
      const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear();
      const isSelected = selectedDate && formatDate(selectedDate) === dateStr;
      
      const dayEvents = getEventsForDay(dateObj);
      
      // 클래스 조합
      let btnClass = "aspect-square p-2 rounded-xl text-sm transition-all relative ";
      if (isToday) btnClass += "bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold shadow-lg ";
      else if (isSelected) btnClass += "bg-purple-100 border-2 border-purple-500 ";
      else btnClass += "hover:bg-gray-100 text-gray-800 ";

      // 이벤트 점(Dot) 마크 HTML
      let dotsHTML = '';
      if (dayEvents.length > 0) {
        dotsHTML = `<div class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">`;
        dayEvents.slice(0, 3).forEach(ev => {
          const color = ev.type === 'course' ? 'bg-purple-500' : ev.type === 'reminder' ? 'bg-pink-500' : 'bg-blue-500';
          dotsHTML += `<div class="w-1.5 h-1.5 rounded-full ${color}"></div>`;
        });
        dotsHTML += `</div>`;
      }

      gridHTML += `
        <button class="${btnClass}" data-year="${year}" data-month="${month}" data-day="${day}">
          <div class="font-semibold">${day}</div>
          ${dotsHTML}
        </button>
      `;
    }

    calendarGrid.innerHTML = gridHTML;

    // 날짜 클릭 이벤트 연결
    const dayButtons = calendarGrid.querySelectorAll('button[data-day]');
    dayButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const y = parseInt(btn.dataset.year);
        const m = parseInt(btn.dataset.month);
        const d = parseInt(btn.dataset.day);
        selectedDate = new Date(y, m, d);
        
        renderCalendar(); // 선택 UI(테두리) 업데이트를 위해 다시 그림
        renderEventList(); // 우측 패널 업데이트
      });
    });
  };

  // -- 선택된 날짜의 이벤트 목록 그리기 --
  const renderEventList = () => {
    if (!selectedDate) {
      selectedDateTitle.textContent = "날짜를 선택하세요";
      selectedDateCount.textContent = "";
      btnAddEvent.classList.add('hidden');
      quickAddCard.classList.add('hidden');
      eventListContainer.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          <p>캘린더에서 날짜를 선택해주세요</p>
        </div>
      `;
      return;
    }

    selectedDateTitle.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
    btnAddEvent.classList.remove('hidden');
    quickAddCard.classList.remove('hidden'); // 저장된 코스가 있다고 가정

    const dayEvents = getEventsForDay(selectedDate);
    selectedDateCount.textContent = `${dayEvents.length}개의 일정`;

    if (dayEvents.length === 0) {
      eventListContainer.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>
          <p>이 날짜에 등록된 일정이 없습니다</p>
          <button id="btnEmptyAdd" class="mt-4 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 rounded-md px-4 py-2 text-sm inline-flex items-center text-gray-700 transition-colors">
            <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>일정 추가하기
          </button>
        </div>
      `;
      // 빈 화면의 일정 추가 버튼 이벤트
      document.getElementById('btnEmptyAdd').addEventListener('click', () => openModal());
    } else {
      let listHTML = `<div class="space-y-3 max-h-96 overflow-y-auto pr-2">`;
      dayEvents.forEach(ev => {
        const bg = ev.type === 'course' ? 'bg-purple-500' : ev.type === 'reminder' ? 'bg-pink-500' : 'bg-blue-500';
        // 아이콘 (SVG)
        const iconSvg = ev.type === 'course' 
          ? `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>` 
          : ev.type === 'reminder' 
          ? `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`
          : `<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>`;

        listHTML += `
          <div class="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-500 transition-all">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg ${bg} flex items-center justify-center text-white">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900">${ev.title}</h4>
                  ${ev.time ? `<p class="text-xs text-gray-500">${ev.time}</p>` : ''}
                </div>
              </div>
              <div class="flex gap-1">
                <button class="btn-edit h-8 w-8 rounded-md hover:bg-purple-100 text-gray-600 flex items-center justify-center transition-colors" data-id="${ev.id}">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button class="btn-del h-8 w-8 rounded-md hover:bg-red-100 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors" data-id="${ev.id}">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            ${ev.description ? `<p class="text-sm text-gray-600 mt-2">${ev.description}</p>` : ''}
          </div>
        `;
      });
      listHTML += `</div>`;
      eventListContainer.innerHTML = listHTML;

      // 수정/삭제 버튼 이벤트 연결
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const ev = events.find(item => item.id === btn.dataset.id);
          if (ev) openModal(ev);
        });
      });

      document.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (confirm("이 일정을 삭제하시겠습니까?")) {
            events = events.filter(item => item.id !== btn.dataset.id);
            saveData();
          }
        });
      });
    }
  };

  // -- 모달 로직 --
  const openModal = (ev = null) => {
    eventModal.classList.remove('hidden');
    modalDesc.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;

    if (ev) { // 수정 모드
      modalTitle.textContent = "일정 수정";
      eventIdInput.value = ev.id;
      eventTitleInput.value = ev.title;
      eventTimeInput.value = ev.time || '';
      eventDescInput.value = ev.description || '';
      setEventTypeUI(ev.type);
    } else { // 추가 모드
      modalTitle.textContent = "일정 추가";
      eventIdInput.value = '';
      eventTitleInput.value = '';
      eventTimeInput.value = '';
      eventDescInput.value = '';
      setEventTypeUI('memo');
    }
  };

  const closeModal = () => {
    eventModal.classList.add('hidden');
  };

  // 유형(코스,메모,알림) UI 갱신 함수
  const setEventTypeUI = (type) => {
    currentEventType = type;
    typeBtns.forEach(btn => {
      btn.className = "type-btn flex-1 h-9 rounded-md border border-gray-200 text-sm font-medium transition-colors"; // 리셋
      if (btn.dataset.val === type) {
        if (type === 'course') btn.classList.add('bg-purple-500', 'text-white', 'border-purple-500');
        else if (type === 'memo') btn.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
        else btn.classList.add('bg-pink-500', 'text-white', 'border-pink-500');
      }
    });
  };

  // 유형 버튼 클릭 이벤트
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => setEventTypeUI(btn.dataset.val));
  });

  // 일정 저장/업데이트 로직
  document.getElementById('btnModalSave').addEventListener('click', () => {
    const title = eventTitleInput.value.trim();
    if (!title) return alert('제목을 입력해주세요.');

    const newEv = {
      id: eventIdInput.value || `event-${Date.now()}`,
      date: formatDate(selectedDate),
      title: title,
      description: eventDescInput.value.trim(),
      type: currentEventType,
      time: eventTimeInput.value
    };

    if (eventIdInput.value) { // 수정
      const idx = events.findIndex(e => e.id === eventIdInput.value);
      if (idx > -1) events[idx] = newEv;
    } else { // 신규 추가
      events.push(newEv);
    }

    saveData();
    closeModal();
  });

  // 데이터 로컬 스토리지에 저장하고 UI 갱신하는 공통 함수
  const saveData = () => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    renderEventList();
  };

  // -- 이벤트 리스너 --
  document.getElementById('btnPrevMonth').addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderCalendar();
  });

  document.getElementById('btnNextMonth').addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderCalendar();
  });

  document.getElementById('btnToday').addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date(); // 오늘로 선택 이동
    renderCalendar();
    renderEventList();
  });

  btnAddEvent.addEventListener('click', () => openModal());
  document.getElementById('btnModalClose').addEventListener('click', closeModal);
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);

  // 초기 렌더링
  renderCalendar();
  renderEventList();
});