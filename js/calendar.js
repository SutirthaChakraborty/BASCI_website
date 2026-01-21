(() => {
    const MONTH_NAMES = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];

    const YEAR = 2026;

    const rawEvents = [
        { title: 'AGM & Awards Night', months: [0], when: "Jan '26" },
        { title: 'BASCI Badminton Open', months: [2], when: "Mar '26" },
        { title: 'Friendship Cup 2026', months: [2], when: "Mar '26" },
        { title: 'Roy Sinha Memorial Derby Cup', months: [3], when: "Apr '26" },
        { title: 'BASCI Trail Expedition', months: [5, 6, 7], when: "Summer '26" },
        { title: "Women’s Yoga Therapy", months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], when: 'Monthly' },
        { title: 'BASCI 1 Day Tournament', months: [8], when: "Sept '26" }
    ];

    function buildMonthMap() {
        const map = new Map();
        for (let m = 0; m < 12; m++) map.set(m, []);
        for (const event of rawEvents) {
            for (const monthIndex of event.months) {
                if (!map.has(monthIndex)) continue;
                map.get(monthIndex).push({ title: event.title, when: event.when });
            }
        }
        return map;
    }

    function createMonthButton(monthIndex, hasEvents) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `year-calendar__month${hasEvents ? ' year-calendar__month--has-events' : ''}`;
        button.dataset.month = String(monthIndex);
        button.setAttribute('aria-pressed', 'false');

        const name = document.createElement('span');
        name.className = 'year-calendar__month-name';
        name.textContent = MONTH_NAMES[monthIndex];

        const marker = document.createElement('span');
        marker.className = 'year-calendar__month-marker';
        marker.setAttribute('aria-hidden', 'true');

        button.appendChild(name);
        button.appendChild(marker);
        return button;
    }

    function renderEvents(monthIndex, events, monthTitleEl, eventsEl, emptyEl) {
        monthTitleEl.textContent = `${MONTH_NAMES[monthIndex]} ${YEAR}`;
        eventsEl.innerHTML = '';

        if (!events.length) {
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        for (const ev of events) {
            const li = document.createElement('li');
            li.className = 'year-calendar__event';

            const title = document.createElement('div');
            title.className = 'year-calendar__event-title';
            title.textContent = ev.title;

            const meta = document.createElement('div');
            meta.className = 'year-calendar__event-meta';
            meta.textContent = ev.when;

            li.appendChild(title);
            li.appendChild(meta);
            eventsEl.appendChild(li);
        }
    }

    function setSelectedMonth(rootEl, monthIndex) {
        rootEl.querySelectorAll('.year-calendar__month').forEach(btn => {
            const isSelected = Number(btn.dataset.month) === monthIndex;
            btn.classList.toggle('is-selected', isSelected);
            btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
    }

    function init() {
        const monthsRoot = document.getElementById('calendarMonths');
        const monthTitleEl = document.getElementById('calendarMonthTitle');
        const eventsEl = document.getElementById('calendarEvents');
        const emptyEl = document.getElementById('calendarEmpty');

        if (!monthsRoot || !monthTitleEl || !eventsEl || !emptyEl) return;

        const monthMap = buildMonthMap();
        monthsRoot.innerHTML = '';

        const now = new Date();
        const selectedMonth = now.getFullYear() === YEAR ? now.getMonth() : 0;

        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const events = monthMap.get(monthIndex) ?? [];
            const button = createMonthButton(monthIndex, events.length > 0);
            button.addEventListener('click', () => {
                setSelectedMonth(monthsRoot, monthIndex);
                renderEvents(monthIndex, events, monthTitleEl, eventsEl, emptyEl);
            });
            monthsRoot.appendChild(button);
        }

        setSelectedMonth(monthsRoot, selectedMonth);
        renderEvents(selectedMonth, monthMap.get(selectedMonth) ?? [], monthTitleEl, eventsEl, emptyEl);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
