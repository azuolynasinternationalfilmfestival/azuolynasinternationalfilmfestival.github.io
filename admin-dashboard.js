/**
 * Ąžuolynas Film Festival - Admin Submissions Statistics Dashboard
 * Renders real-time visual charts for Categories, Attendance Donut, and Countries leaderboard.
 */
(function(window) {
  let cachedSubmissions = [];

  function initAdminDashboard() {
    const yearSelect = document.getElementById("dashYearSelect");
    if (yearSelect) {
      yearSelect.addEventListener("change", () => {
        renderDashboardData();
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById("btnRefreshDashboard");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        fetchSubmissionsAndRender();
      });
    }

    fetchSubmissionsAndRender();
  }

  async function fetchSubmissionsAndRender() {
    try {
      // 1. Try global submissions if already loaded by submissions module
      if (window.getSubmissionsList && window.getSubmissionsList().length > 0) {
        cachedSubmissions = window.getSubmissionsList();
        renderDashboardData();
        return;
      }

      // 2. Try Firestore
      if (window.firebase && window.firebase.firestore) {
        try {
          const db = window.firebase.firestore();
          const snap = await db.collection("submissions").get();
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          cachedSubmissions = list;
          renderDashboardData();
          return;
        } catch (e) {}
      }

      // 3. Fallback server API
      const res = await fetch("/api/admin/submissions");
      if (res.ok) {
        const data = await res.json();
        cachedSubmissions = data.submissions || [];
        renderDashboardData();
      }
    } catch (err) {
      console.warn("Dashboard submissions load notice:", err);
    }
  }

  function getSubmissionYear(sub) {
    if (!sub) return "2026";
    if (sub.year) return String(sub.year).trim();
    if (sub.edition) return String(sub.edition).replace(/[^0-9]/g, "");
    if (sub.submittedAt) {
      if (sub.submittedAt.toDate) return String(sub.submittedAt.toDate().getFullYear());
      const d = new Date(sub.submittedAt);
      if (!isNaN(d.getFullYear())) return String(d.getFullYear());
    }
    return "2026";
  }

  function renderDashboardData() {
    const yearSelect = document.getElementById("dashYearSelect");
    const selectedYear = yearSelect ? yearSelect.value : "2026";

    const filtered = (selectedYear === "all")
      ? cachedSubmissions
      : cachedSubmissions.filter(s => getSubmissionYear(s) === selectedYear);

    const total = filtered.length;
    const accepted = filtered.filter(s => s.status === "accepted" || s.status === "winner" || s.status === "final").length;
    const inPerson = filtered.filter(s => s.attendanceType === "in_person").length;
    const remote = filtered.filter(s => s.attendanceType === "remote" || !s.attendanceType).length;
    const voting = filtered.filter(s => s.inVoting === true).length;

    // Update Summary metric cards
    setText("dashTotal", total);
    setText("dashAccepted", accepted);
    setText("dashInPerson", inPerson);
    setText("dashRemote", remote);
    setText("dashVoting", voting);

    renderCategoryBars(filtered, total);
    renderAttendanceDonut(inPerson, remote, total);
    renderCountryLeaderboard(filtered, total);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderCategoryBars(list, total) {
    const container = document.getElementById("dashCategoryList");
    if (!container) return;

    if (total === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Šio leidimo paraiškų nerasta.</p>`;
      return;
    }

    const catCounts = {};
    list.forEach(s => {
      const cat = s.category || "Nenurodyta";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

    const palette = ["#D4AF37", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#fb923c"];

    container.innerHTML = sortedCats.map(([cat, count], idx) => {
      const pct = Math.round((count / total) * 100);
      const color = palette[idx % palette.length];
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-meta">
            <span>${escapeHtml(cat)}</span>
            <strong>${count} (${pct}%)</strong>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${pct}%; background:${color};"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderAttendanceDonut(inPerson, remote, total) {
    const container = document.getElementById("dashAttendanceContainer");
    if (!container) return;

    if (total === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Dalyvavimo duomenų nerasta.</p>`;
      return;
    }

    const inPersonPct = Math.round((inPerson / total) * 100);
    const remotePct = 100 - inPersonPct;

    // Circumference for r=40 is 2 * PI * 40 ≈ 251.3
    const circ = 251.3;
    const strokeDash = (inPersonPct / 100) * circ;

    container.innerHTML = `
      <div class="donut-chart-container">
        <div class="donut-svg-wrap">
          <svg width="110" height="110" viewBox="0 0 100 100">
            <!-- Background track (Remote) -->
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#60a5fa" stroke-width="12" opacity="0.85"></circle>
            <!-- Foreground arc (In-person) -->
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4ade80" stroke-width="12"
              stroke-dasharray="${strokeDash} ${circ}"
              stroke-dashoffset="0"
              style="transition: stroke-dasharray 0.6s ease;">
            </circle>
          </svg>
          <div class="donut-center-label">
            <span class="donut-center-val">${total}</span>
            <span class="donut-center-sub">Dalyviai</span>
          </div>
        </div>

        <div class="donut-legends">
          <div class="donut-legend-item">
            <span class="donut-legend-dot" style="background:#4ade80;"></span>
            <span>Gyvai Kaune</span>
            <strong>${inPerson} (${inPersonPct}%)</strong>
          </div>
          <div class="donut-legend-item">
            <span class="donut-legend-dot" style="background:#60a5fa;"></span>
            <span>Nuotolinė transliacija</span>
            <strong>${remote} (${remotePct}%)</strong>
          </div>
        </div>
      </div>
    `;
  }

  function renderCountryLeaderboard(list, total) {
    const container = document.getElementById("dashCountryList");
    if (!container) return;

    if (total === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:12px 0;">Šalių duomenų nerasta.</p>`;
      return;
    }

    const countryCounts = {};
    list.forEach(s => {
      let c = (s.country || s.city || "Lietuva").trim();
      if (!c) c = "Lietuva";
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

    container.innerHTML = sortedCountries.map(([country, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="country-chart-item">
          <div class="country-chart-meta">
            <span class="country-chart-name">
              <span>🌐</span>
              <span>${escapeHtml(country)}</span>
            </span>
            <span style="font-size:0.8rem; color:#F8FAF7; font-weight:600;">${count} filmai (${pct}%)</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${pct}%; background:#D4AF37;"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.AdminDashboard = {
    init: initAdminDashboard,
    update: (submissions) => {
      if (submissions) cachedSubmissions = submissions;
      renderDashboardData();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminDashboard);
  } else {
    initAdminDashboard();
  }
})(window);
