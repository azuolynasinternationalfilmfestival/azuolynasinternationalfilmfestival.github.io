/**
 * Ąžuolynas Film Festival - Hero Submission Deadline Countdown
 * Calculates and renders live days, hours, minutes, and seconds until March 26th
 */
(function() {
  function getSubmissionDeadline() {
    const now = new Date();
    const currentYear = now.getFullYear();
    // March 26th, 23:59:59 (Month is 0-indexed: 2 = March)
    let deadline = new Date(currentYear, 2, 26, 23, 59, 59);
    // If deadline has already passed this calendar year, count down to next year's March 26th
    if (now.getTime() > deadline.getTime()) {
      deadline = new Date(currentYear + 1, 2, 26, 23, 59, 59);
    }
    return deadline;
  }

  function formatNumber(num) {
    return String(num).padStart(2, '0');
  }

  function initCountdown() {
    const container = document.getElementById('heroCountdownTimer');
    if (!container) return;

    const daysEl = container.querySelector('[data-countdown="days"]');
    const hoursEl = container.querySelector('[data-countdown="hours"]');
    const minutesEl = container.querySelector('[data-countdown="minutes"]');
    const secondsEl = container.querySelector('[data-countdown="seconds"]');
    const footerMsgEl = container.querySelector('[data-countdown="footer-msg"]');
    const daysLabelEl = container.querySelector('[data-countdown="days-label"]');

    const isLt = document.documentElement.lang === 'lt' || window.location.pathname.includes('/lt/');

    function update() {
      const now = new Date();
      const deadline = getSubmissionDeadline();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) {
        if (daysEl) daysEl.textContent = '0';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
        if (footerMsgEl) {
          footerMsgEl.innerHTML = isLt
            ? '⚠️ <strong>Paraiškų teikimas šiam etapui baigtas.</strong> Laukite festivalio transliacijos!'
            : '⚠️ <strong>Submissions are now closed for this edition.</strong> Stay tuned for the festival stream!';
        }
        return;
      }

      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      if (daysEl) daysEl.textContent = String(totalDays);
      if (hoursEl) hoursEl.textContent = formatNumber(hours);
      if (minutesEl) minutesEl.textContent = formatNumber(minutes);
      if (secondsEl) secondsEl.textContent = formatNumber(seconds);

      if (daysLabelEl) {
        if (isLt) {
          let suffix = 'Dienų';
          if (totalDays % 10 === 1 && totalDays % 100 !== 11) {
            suffix = 'Diena';
          } else if ([2, 3, 4, 5, 6, 7, 8, 9].includes(totalDays % 10) && ![12, 13, 14, 15, 16, 17, 18, 19].includes(totalDays % 100)) {
            suffix = 'Dienos';
          }
          daysLabelEl.textContent = suffix;
        } else {
          daysLabelEl.textContent = totalDays === 1 ? 'Day' : 'Days';
        }
      }
    }

    update();
    setInterval(update, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountdown);
  } else {
    initCountdown();
  }
})();
