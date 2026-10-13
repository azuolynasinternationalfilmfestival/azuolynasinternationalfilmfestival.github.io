/**
 * notifications-log.js
 * Lead Admin Audit Log & Activity Notifications (Kas ką pakeitė, kokia informacija)
 * Ąžuolynas International Film Festival
 */

import { showToast } from "./ui-feedback.js";

let allLogs = [];
let currentCategoryFilter = "all";

export function initNotificationsLog() {
  const refreshBtn = document.getElementById("btnRefreshLogs");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinamas veiklos žurnalas...");
      loadActivityLogs();
    });
  }

  const categoryFilter = document.getElementById("filterLogCategory");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      currentCategoryFilter = e.target.value;
      renderLogsFeed();
    });
  }

  const searchInput = document.getElementById("filterLogSearch");
  if (searchInput) {
    searchInput.addEventListener("input", renderLogsFeed);
  }

  const exportBtn = document.getElementById("btnExportLogs");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportLogsJson);
  }

  // Listen to custom refresh event dispatched by other modules
  window.addEventListener("refresh-notifications", () => {
    loadActivityLogs();
  });

  loadActivityLogs();
}

export async function loadActivityLogs() {
  try {
    const res = await fetch("/api/admin/logs");
    if (res.ok) {
      const data = await res.json();
      allLogs = data.logs || [];
      renderLogsFeed();
      updateNotificationsBadge();
    }
  } catch (err) {
    console.warn("Failed to load activity logs:", err);
  }
}

function updateNotificationsBadge() {
  const badges = document.querySelectorAll(".notifications-unread-count");
  const count = allLogs.length;
  badges.forEach(b => {
    b.textContent = count > 99 ? "99+" : count;
    b.style.display = count > 0 ? "inline-flex" : "none";
  });
}

export function renderLogsFeed() {
  const container = document.getElementById("activityLogsFeed");
  if (!container) return;

  const searchVal = (document.getElementById("filterLogSearch")?.value || "").toLowerCase().trim();

  const filtered = allLogs.filter(l => {
    if (currentCategoryFilter !== "all" && l.category !== currentCategoryFilter) return false;
    if (searchVal) {
      const matchDetails = (l.details || "").toLowerCase().includes(searchVal);
      const matchEmail = (l.adminEmail || "").toLowerCase().includes(searchVal);
      const matchTarget = (l.target || "").toLowerCase().includes(searchVal);
      const matchAction = (l.action || "").toLowerCase().includes(searchVal);
      if (!matchDetails && !matchEmail && !matchTarget && !matchAction) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 20px; color:var(--text-muted); background:var(--surface-card); border-radius:var(--site-radius); border:1px solid var(--border-color);">
        <div style="margin-bottom:8px; color:var(--accent-light);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin:0 auto;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <strong>Pranešimų nerasta</strong>
        <p style="font-size:0.85rem; margin-top:4px;">Pagal pasirinktą filtrą įrašų žurnale nėra.</p>
      </div>
    `;
    return;
  }

  const categoryIcons = {
    stream: "Transliacija & RSVP",
    settings: "Nustatymai",
    editions: "Metų leidiniai (2027)",
    submissions: "Paraiškos & Laureatai",
    voting: "Balsavimas & Teisėjai",
    tasks: "Užduotys",
    users: "Vartotojai & Prieiga"
  };

  container.innerHTML = filtered.map(item => {
    const timeFormatted = formatTimestamp(item.timestamp);
    const catLabel = categoryIcons[item.category] || item.category || "Veikla";

    return `
      <div class="audit-log-item" style="background:var(--surface-card); border:1px solid var(--border-color); border-left:3px solid var(--accent-color); border-radius:var(--site-radius); padding:16px 18px; margin-bottom:12px; transition:transform 0.15s ease;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge" style="background:rgba(111,165,138,0.2); color:var(--accent-light); font-size:0.75rem;">
              ${catLabel}
            </span>
            <strong style="color:var(--text-color); font-size:0.88rem;">${escapeHtml(item.adminName || item.adminEmail || 'Administratorius')}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">(${escapeHtml(item.adminEmail || '')})</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">
            ${timeFormatted}
          </div>
        </div>

        <div style="color:var(--text-color); font-size:0.92rem; line-height:1.45; margin-bottom:6px;">
          ${escapeHtml(item.details || item.action || 'Veiksmas atliktas sistemoje')}
        </div>

        ${item.target ? `
          <div style="font-size:0.76rem; color:var(--accent-light); opacity:0.85;">
            Objektas / Tikslas: <code>${escapeHtml(item.target)}</code>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function formatTimestamp(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("lt-LT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch {
    return isoStr;
  }
}

function exportLogsJson() {
  const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `azuolynas-fest-audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Audito žurnalas sėkmingai eksportuotas!");
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
