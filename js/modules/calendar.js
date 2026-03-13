/**
 * Calendar Module - 日历今天高亮
 */
const Calendar = (function () {
  function init() {
    const calendarDays = document.querySelector('.calendar-days');
    if (!calendarDays) return;

    const today = new Date().getDate();
    const daySpans = calendarDays.querySelectorAll('span[data-date]');

    daySpans.forEach(function (span) {
      const dateNum = parseInt(span.dataset.date, 10);
      if (dateNum === today) {
        span.classList.add('today');
      }
    });
  }

  return { init: init };
})();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Calendar.init);
} else {
  Calendar.init();
}
