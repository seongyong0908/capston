document.addEventListener('DOMContentLoaded', () => {
  const loginId = localStorage.getItem('loginId');
  const calendarTitle = document.getElementById('calendarTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  const selectedDateCount = document.getElementById('selectedDateCount');
  const eventListContainer = document.getElementById('eventListContainer');
  const scheduleModal = document.getElementById('scheduleModal');
  const eventModal = document.getElementById('eventModal');
  const eventIdInput = document.getElementById('eventId');
  const eventTitleInput = document.getElementById('eventTitle');
  const eventDateInput = document.getElementById('eventDate');
  const eventStartTimeInput = document.getElementById('eventTime');
  const eventEndTimeInput = document.getElementById('eventEndTime');

  let currentDate = new Date();
  let selectedDate = new Date();
  let events = [];

  const formatDate = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

  const setError = message => {
    eventListContainer.innerHTML = `<p class="text-center text-red-500 py-10">${escapeHtml(message)}</p>`;
  };

  const loadEvents = async () => {
    if (!loginId) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.');
    const response = await fetch(`/api/calendar?login_id=${encodeURIComponent(loginId)}`);
    if (!response.ok) throw new Error('캘린더 일정을 불러오지 못했습니다.');
    const data = await response.json();
    events = data.map(event => ({
      ...event,
      id: String(event.id),
      date: event.eventDate,
      startTime: event.startTime ? event.startTime.slice(0, 5) : '',
      endTime: event.endTime ? event.endTime.slice(0, 5) : ''
    }));
  };

  const eventsForSelectedDay = () => events.filter(event => event.date === formatDate(selectedDate));

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    calendarTitle.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayString = formatDate(new Date());
    let html = '';

    for (let empty = 0; empty < firstDay.getDay(); empty++) {
      html += '<div class="aspect-square p-2 invisible"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(new Date(year, month, day));
      const dayHasEvents = events.some(event => event.date === dateString);
      let buttonClass = 'aspect-square p-2 rounded-xl text-sm transition-all relative ';
      if (dateString === todayString) {
        buttonClass += 'bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold shadow-lg ';
      } else if (formatDate(selectedDate) === dateString) {
        buttonClass += 'bg-purple-100 border-2 border-purple-500 ';
      } else {
        buttonClass += 'hover:bg-gray-100 text-gray-800 ';
      }
      const dot = dayHasEvents
        ? '<div class="absolute bottom-1 left-1/2 -translate-x-1/2"><span class="block w-1.5 h-1.5 rounded-full bg-purple-500"></span></div>'
        : '';
      html += `<button class="${buttonClass}" data-date="${dateString}"><div class="font-semibold">${day}</div>${dot}</button>`;
    }

    calendarGrid.innerHTML = html;
  };

  const renderEventList = () => {
    const dayEvents = eventsForSelectedDay();
    selectedDateTitle.textContent = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;
    selectedDateCount.textContent = `${dayEvents.length}개의 코스 일정`;

    if (dayEvents.length === 0) {
      eventListContainer.innerHTML = `
        <div class="text-center py-12 text-gray-500">
          <p>이 날짜에 등록된 코스 일정이 없습니다.</p>
          <p class="text-sm text-gray-400 mt-2">추천 결과나 보관함에서 코스를 일정에 추가할 수 있어요.</p>
        </div>`;
      return;
    }

    eventListContainer.innerHTML = `<div class="space-y-3 max-h-96 overflow-y-auto pr-2">
      ${dayEvents.map(event => `
        <div class="border-2 border-gray-100 rounded-2xl p-4 hover:border-purple-300 transition-all mb-3 shadow-sm bg-white">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h4 class="font-bold text-gray-900 text-base">${escapeHtml(event.title)}</h4>
              <p class="text-xs font-medium text-gray-500 mt-1">${escapeHtml(event.roomName)} · ${escapeHtml(event.roomType)}</p>
              <p class="text-xs font-medium text-gray-500 mt-1">${event.startTime || '시간 미정'}${event.endTime ? ` ~ ${event.endTime}` : ''}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button class="h-8 px-2 rounded-lg hover:bg-gray-50 text-gray-500 text-xs font-bold" data-action="edit" data-id="${event.id}">수정</button>
              <button class="h-8 px-2 rounded-lg hover:bg-red-50 text-red-500 text-xs font-bold" data-action="delete" data-id="${event.id}">삭제</button>
            </div>
          </div>
          ${event.description ? `<p class="text-sm text-gray-600 mt-3 leading-relaxed">${escapeHtml(event.description)}</p>` : ''}
        </div>`).join('')}
    </div>`;
  };

  const closeScheduleModal = () => {
    scheduleModal.classList.add('hidden');
    scheduleModal.classList.remove('flex');
  };

  const openEditModal = event => {
    document.getElementById('modalTitle').textContent = '코스 일정 수정';
    eventIdInput.value = event.id;
    eventTitleInput.value = event.title;
    eventDateInput.value = event.date;
    eventStartTimeInput.value = event.startTime;
    eventEndTimeInput.value = event.endTime;
    eventModal.classList.remove('hidden');
  };

  const closeEditModal = () => eventModal.classList.add('hidden');

  calendarGrid.addEventListener('click', event => {
    const button = event.target.closest('button[data-date]');
    if (!button) return;
    const [year, month, day] = button.dataset.date.split('-').map(Number);
    selectedDate = new Date(year, month - 1, day);
    renderCalendar();
    renderEventList();
    scheduleModal.classList.remove('hidden');
    scheduleModal.classList.add('flex');
  });

  eventListContainer.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const selectedEvent = events.find(item => item.id === button.dataset.id);
    if (!selectedEvent) return;

    if (button.dataset.action === 'edit') {
      openEditModal(selectedEvent);
      return;
    }

    if (!confirm('이 일정을 삭제하면 연결된 코스와 장소 순서 정보도 함께 완전히 삭제됩니다. 계속할까요?')) return;
    try {
      const response = await fetch(`/api/calendar/${selectedEvent.id}?login_id=${encodeURIComponent(loginId)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(await response.text() || '일정을 삭제하지 못했습니다.');
      await loadEvents();
      renderCalendar();
      renderEventList();
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      alert(error.message || '일정을 삭제하지 못했습니다.');
    }
  });

  document.getElementById('btnModalSave').addEventListener('click', async () => {
    const eventId = eventIdInput.value;
    const title = eventTitleInput.value.trim();
    const eventDate = eventDateInput.value;
    if (!title || !eventDate) {
      alert('일정 제목과 날짜를 입력해 주세요.');
      return;
    }
    try {
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: loginId,
          title,
          eventDate,
          startTime: eventStartTimeInput.value || null,
          endTime: eventEndTimeInput.value || null
        })
      });
      if (!response.ok) throw new Error(await response.text() || '일정을 수정하지 못했습니다.');
      await loadEvents();
      const [year, month, day] = eventDate.split('-').map(Number);
      selectedDate = new Date(year, month - 1, day);
      currentDate = new Date(year, month - 1, 1);
      closeEditModal();
      renderCalendar();
      renderEventList();
    } catch (error) {
      console.error('일정 수정 실패:', error);
      alert(error.message || '일정을 수정하지 못했습니다.');
    }
  });

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
    selectedDate = new Date();
    renderCalendar();
    renderEventList();
    scheduleModal.classList.remove('hidden');
    scheduleModal.classList.add('flex');
  });
  document.getElementById('btnCloseSchedule').addEventListener('click', closeScheduleModal);
  document.getElementById('btnModalClose').addEventListener('click', closeEditModal);
  document.getElementById('btnModalCancel').addEventListener('click', closeEditModal);

  loadEvents()
    .then(() => {
      renderCalendar();
      renderEventList();
    })
    .catch(error => {
      console.error('캘린더 조회 실패:', error);
      renderCalendar();
      setError(error.message || '캘린더 일정을 불러오지 못했습니다.');
    });
});
