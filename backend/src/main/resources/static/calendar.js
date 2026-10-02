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
    
    if (calendarTitle) {
      calendarTitle.textContent = `${year}년 ${month + 1}월`;
    }

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

    if (calendarGrid) {
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
    }
  };

  // -- 선택된 날짜의 이벤트 목록 그리기 --
  const renderEventList = () => {
    if (!selectedDate) {
      if (selectedDateTitle) selectedDateTitle.textContent = "날짜를 선택하세요";
      if (selectedDateCount) selectedDateCount.textContent = "";
      if (btnAddEvent) btnAddEvent.classList.add('hidden');
      if (quickAddCard) quickAddCard.classList.add('hidden');
      if (eventListContainer) {
        eventListContainer.innerHTML = `
          <div class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <p>캘린더에서 날짜를 선택해주세요</p>
          </div>
        `;
      }
      return;
    }

    if (selectedDateTitle) selectedDateTitle.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
    if (btnAddEvent) btnAddEvent.classList.remove('hidden');
    if (quickAddCard) quickAddCard.classList.remove('hidden');

    const dayEvents = getEventsForDay(selectedDate);
    if (selectedDateCount) selectedDateCount.textContent = `${dayEvents.length}개의 일정`;

    if (dayEvents.length === 0) {
      if (eventListContainer) {
        eventListContainer.innerHTML = `
          <div class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>
            <p>이 날짜에 등록된 일정이 없습니다</p>
            <button id="btnEmptyAdd" class="mt-4 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 rounded-md px-4 py-2 text-sm inline-flex items-center text-gray-700 transition-colors">
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>일정 추가하기
            </button>
          </div>
        `;
        const btnEmptyAdd = document.getElementById('btnEmptyAdd');
        if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => openModal());
      }
    } else {
      let listHTML = `<div class="space-y-3 max-h-96 overflow-y-auto pr-2">`;
      dayEvents.forEach(ev => {
        // 아이콘 배경색과 모양 설정
        const bg = ev.type === 'course' ? 'bg-purple-500' : ev.type === 'reminder' ? 'bg-pink-500' : 'bg-blue-500';
        const iconSvg = ev.type === 'course' 
          ? `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>` 
          : ev.type === 'reminder' 
          ? `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`
          : `<path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/>`;

        // 💡 [핵심 추가] 데이터에 있는 방 종류(ev.room)를 확인해서 뱃지 HTML을 만듭니다.
        let roomBadge = '';
        if (ev.room === 'couple') {
            roomBadge = `<span class="px-2 py-0.5 rounded-md bg-pink-100 text-pink-600 text-[10px] font-extrabold ml-2">💕 연인방</span>`;
        } else if (ev.room === 'friend') {
            roomBadge = `<span class="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-[10px] font-extrabold ml-2">👫 친구방</span>`;
        }

        // 화면에 그려질 HTML 조립
        listHTML += `
          <div class="border-2 border-gray-100 rounded-2xl p-4 hover:border-purple-300 transition-all mb-3 shadow-sm bg-white">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl ${bg} flex items-center justify-center text-white shadow-sm shadow-purple-500/20 shrink-0">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconSvg}</svg>
                </div>
                <div>
                  <div class="flex items-center">
                    <h4 class="font-bold text-gray-900 text-base">${ev.title}</h4>
                    ${roomBadge} <!-- 💡 바로 여기에 방 뱃지가 나타납니다! -->
                  </div>
                  ${ev.time ? `<p class="text-xs font-medium text-gray-500 mt-0.5">${ev.time}</p>` : ''}
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <button class="btn-edit h-8 w-8 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors" data-id="${ev.id}">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
                <button class="btn-del h-8 w-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors" data-id="${ev.id}">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            ${ev.description ? `<p class="text-sm text-gray-600 mt-2 ml-12 leading-relaxed">${ev.description}</p>` : ''}
          </div>
        `;
      });
      listHTML += `</div>`;
      if (eventListContainer) eventListContainer.innerHTML = listHTML;

      // 수정/삭제 버튼 이벤트 연결
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const ev = events.find(item => item.id === btn.dataset.id);
          if (ev) openModal(ev);
        });
      });

      document.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', () => {
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
    if (eventModal) eventModal.classList.remove('hidden');
    if (modalDesc && selectedDate) modalDesc.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;

    if (ev) { // 수정 모드
      if (modalTitle) modalTitle.textContent = "일정 수정";
      if (eventIdInput) eventIdInput.value = ev.id;
      if (eventTitleInput) eventTitleInput.value = ev.title;
      const endTimeInput = document.getElementById('eventEndTime');
        if (ev.time && ev.time.includes('~')) {
            const times = ev.time.split(' ~ ');
            if (eventTimeInput) eventTimeInput.value = times[0];
            if (endTimeInput) endTimeInput.value = times[1];
        } else {
            if (eventTimeInput) eventTimeInput.value = ev.time || '';
            if (endTimeInput) endTimeInput.value = '';
        }
      if (eventDescInput) eventDescInput.value = ev.description || '';
      setEventTypeUI(ev.type);
    } else { // 추가 모드
      if (modalTitle) modalTitle.textContent = "일정 추가";
      if (eventIdInput) eventIdInput.value = '';
      if (eventTitleInput) eventTitleInput.value = '';
      if (eventTimeInput) eventTimeInput.value = '';
      if (eventDescInput) eventDescInput.value = '';
      setEventTypeUI('memo');
    }
  };

  const closeModal = () => {
    if (eventModal) eventModal.classList.add('hidden');
  };

  // 유형(코스,메모,알림) UI 갱신 함수
  const setEventTypeUI = (type) => {
    currentEventType = type;
    typeBtns.forEach(btn => {
      btn.className = "type-btn flex-1 h-9 rounded-md border border-gray-200 text-sm font-medium transition-colors";
      if (btn.dataset.val === type) {
        if (type === 'course') btn.classList.add('bg-purple-500', 'text-white', 'border-purple-500');
        else if (type === 'memo') btn.classList.add('bg-blue-500', 'text-white', 'border-blue-500');
        else btn.classList.add('bg-pink-500', 'text-white', 'border-pink-500');
      }
    });
  };

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => setEventTypeUI(btn.dataset.val));
  });

  const btnModalSave = document.getElementById('btnModalSave');
  if (btnModalSave) {
    btnModalSave.addEventListener('click', () => {
      const title = eventTitleInput.value.trim();
      if (!title) return alert('제목을 입력해주세요.');

      const startT = document.getElementById('eventTime').value;
      const endT = document.getElementById('eventEndTime').value;
      const timeStr = (startT && endT) ? `${startT} ~ ${endT}` : (startT || '');

      const newEv = {
        id: eventIdInput.value || `event-${Date.now()}`,
        date: formatDate(selectedDate),
        title: title,
        description: eventDescInput.value.trim(),
        type: currentEventType,
        time: timeStr
      };

      if (eventIdInput.value) {
        const idx = events.findIndex(e => e.id === eventIdInput.value);
        if (idx > -1) {
          // 💡 핵심: 기존 데이터(...events[idx])를 잃어버리지 않게 깔아두고, 수정한 내용(...newEv)만 덮어씁니다!
          events[idx] = { ...events[idx], ...newEv };
        }
      } else {
        events.push(newEv);
      }

      saveData();
      closeModal();
    });
  }

  const saveData = () => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar();
    renderEventList();
  };

  // -- 이벤트 리스너 --
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  const btnNextMonth = document.getElementById('btnNextMonth');
  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  const btnToday = document.getElementById('btnToday');
  if (btnToday) {
    btnToday.addEventListener('click', () => {
      currentDate = new Date();
      selectedDate = new Date();
      renderCalendar();
      renderEventList();
    });
  }

  if (btnAddEvent) btnAddEvent.addEventListener('click', () => openModal());
  
  const btnModalClose = document.getElementById('btnModalClose');
  if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
  
  const btnModalCancel = document.getElementById('btnModalCancel');
  if (btnModalCancel) btnModalCancel.addEventListener('click', closeModal);

  // 초기 렌더링
  renderCalendar();
  renderEventList();
});