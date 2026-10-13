import { db, auth, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

let unsubscribeLogs = null;
let allLogsList = [];

const ACTION_METADATA = {
  USER_INVITED: {
    label: "Vartotojas Pakviestas",
    labelEn: "User Invited",
    pillClass: "status-accepted",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`
  },
  USER_DELETED: {
    label: "Vartotojas Pašalintas",
    labelEn: "User Deleted",
    pillClass: "status-rejected",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
  },
  USER_STATUS_TOGGLED: {
    label: "Būsena Pakeista",
    labelEn: "Status Toggled",
    pillClass: "status-semifinal",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>`
  },
  USER_ROLE_CHANGED: {
    label: "Rolė Pakeista",
    labelEn: "Role Changed",
    pillClass: "status-final",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`
  },
  SETTINGS_CHANGED: {
    label: "Nustatymai Pakeisti",
    labelEn: "Settings Changed",
    pillClass: "status-final",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
  },
  SYSTEM_BOOT: {
    label: "Sistemos Paleidimas",
    labelEn: "System Boot",
    pillClass: "status-submitted",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>`
  }
};

export function initActivityLogs() {
  const searchInput = document.getElementById("filterLogSearch");
  const categorySelect = document.getElementById("filterLogCategory");
  const actionSelect = document.getElementById("filterLogAction");
  const refreshBtn = document.getElementById("btnRefreshLogs");
  const resetBtn = document.getElementById("btnResetLogsFilter");

  if (searchInput) searchInput.addEventListener("input", renderLogsTable);
  if (categorySelect) categorySelect.addEventListener("change", renderLogsTable);
  if (actionSelect) actionSelect.addEventListener("change", renderLogsTable);

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinamas veiklos žurnalas...");
      subscribeActivityLogs();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (categorySelect) categorySelect.value = "all";
      if (actionSelect) actionSelect.value = "all";
      renderLogsTable();
      showToast("Filtrai atstatyti");
    });
  }
}

export function subscribeActivityLogs() {
  if (unsubscribeLogs) {
    unsubscribeLogs();
  }

  const loadingElem = document.getElementById("logsLoadingState");
  if (loadingElem) loadingElem.classList.remove("d-none");

  // Initial fetch from backend API to ensure instant display
  fetchLogsFromApi().then(() => {
    if (loadingElem) loadingElem.classList.add("d-none");
  });

  // Real-time Firestore onSnapshot listener
  if (db) {
    try {
      unsubscribeLogs = db.collection("logs")
        .orderBy("timestamp", "desc")
        .limit(100)
        .onSnapshot(
          (snapshot) => {
            if (loadingElem) loadingElem.classList.add("d-none");

            if (!snapshot.empty) {
              const firestoreLogs = [];
              snapshot.forEach((doc) => {
                firestoreLogs.push({
                  id: doc.id,
                  ...doc.data()
                });
              });

              // Merge unique logs
              mergeLogs(firestoreLogs);
            }

            updateLogMetrics();
            renderLogsTable();
          },
          (err) => {
            console.warn("Firestore logs listener note (falling back to REST):", err.message);
            if (loadingElem) loadingElem.classList.add("d-none");
            fetchLogsFromApi();
          }
        );
    } catch (err) {
      console.warn("Error starting logs snapshot:", err);
      fetchLogsFromApi();
    }
  }
}

export function unsubscribeActivityLogsListener() {
  if (unsubscribeLogs) {
    unsubscribeLogs();
    unsubscribeLogs = null;
  }
}

async function fetchLogsFromApi() {
  try {
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    if (data.success && Array.isArray(data.logs)) {
      mergeLogs(data.logs);
      updateLogMetrics();
      renderLogsTable();
    }
  } catch (err) {
    console.warn("Could not fetch logs from API:", err.message);
  }
}

function mergeLogs(incomingList) {
  const map = new Map();
  // Preserve existing
  allLogsList.forEach((log) => map.set(log.id || (log.action + log.timestamp), log));
  // Overwrite with incoming
  incomingList.forEach((log) => map.set(log.id || (log.action + log.timestamp), log));

  allLogsList = Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.timestamp || 0).getTime();
    const tB = new Date(b.timestamp || 0).getTime();
    return tB - tA; // latest first
  });
}

export async function logActivity({ action, category = "users", target = "", details = "", status = "success" }) {
  const currentAdmin = auth?.currentUser;
  const adminEmail = currentAdmin?.email || PRIMARY_SUPERADMIN_EMAIL;
  const adminName = currentAdmin?.displayName || (adminEmail.split("@")[0]);
  const timestamp = new Date().toISOString();
  const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const newLogObj = {
    id: logId,
    action,
    category,
    adminEmail,
    adminName,
    target,
    details,
    timestamp,
    status
  };

  // 1. Add locally for immediate optimistic UI update
  allLogsList.unshift(newLogObj);
  updateLogMetrics();
  renderLogsTable();

  // 2. Persist to Firestore logs collection
  if (db) {
    try {
      await db.collection("logs").doc(logId).set(newLogObj);
    } catch (err) {
      console.warn("Firestore log write notice:", err.message);
    }
  }

  // 3. Persist to server API mirror
  try {
    await fetch("/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLogObj)
    });
  } catch (apiErr) {
    console.warn("Backend log sync notice:", apiErr.message);
  }
}

function updateLogMetrics() {
  const total = allLogsList.length;
  const userActions = allLogsList.filter((l) => l.category === "users" || (l.action && l.action.startsWith("USER_"))).length;
  const settingsActions = allLogsList.filter((l) => l.category === "settings" || (l.action && l.action.includes("SETTINGS"))).length;
  const latestLog = allLogsList[0] || null;

  const statTotal = document.getElementById("statLogsTotal");
  const statUsers = document.getElementById("statLogsUsers");
  const statSettings = document.getElementById("statLogsSettings");
  const statLatest = document.getElementById("statLogsLatest");

  if (statTotal) statTotal.textContent = total;
  if (statUsers) statUsers.textContent = userActions;
  if (statSettings) statSettings.textContent = settingsActions;
  if (statLatest) statLatest.textContent = latestLog ? formatRelativeTime(latestLog.timestamp) : "—";
}

function renderLogsTable() {
  const tbody = document.getElementById("logsTableBody");
  const emptyState = document.getElementById("logsEmptyState");
  if (!tbody) return;

  const searchVal = document.getElementById("filterLogSearch")?.value.trim().toLowerCase() || "";
  const catVal = document.getElementById("filterLogCategory")?.value || "all";
  const actionVal = document.getElementById("filterLogAction")?.value || "all";

  const filtered = allLogsList.filter((log) => {
    const admin = (log.adminEmail || "").toLowerCase();
    const details = (log.details || "").toLowerCase();
    const target = (log.target || "").toLowerCase();
    const action = (log.action || "").toLowerCase();

    const matchesSearch = !searchVal || admin.includes(searchVal) || details.includes(searchVal) || target.includes(searchVal) || action.includes(searchVal);
    const matchesCat = catVal === "all" || log.category === catVal;
    const matchesAction = actionVal === "all" || log.action === actionVal;

    return matchesSearch && matchesCat && matchesAction;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  tbody.innerHTML = filtered
    .map((log) => {
      const meta = ACTION_METADATA[log.action] || {
        label: log.action || "Veiksmas",
        pillClass: "status-submitted",
        icon: ""
      };

      const formattedDateTime = formatFullDate(log.timestamp);
      const relativeTime = formatRelativeTime(log.timestamp);
      const adminName = escapeHtml(log.adminName || (log.adminEmail ? log.adminEmail.split("@")[0] : "Admin"));
      const adminEmail = escapeHtml(log.adminEmail || "—");
      const initials = getInitials(log.adminName, log.adminEmail);

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:var(--text-color); font-size:0.84rem;">
              ${formattedDateTime}
            </div>
            <div style="font-size:0.74rem; color:var(--accent-light); margin-top:2px;">
              ${relativeTime}
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="user-avatar-badge" style="width:28px; height:28px; font-size:0.75rem;">
                ${initials}
              </div>
              <div>
                <div style="font-weight:500; font-size:0.84rem; color:var(--text-color);">${adminName}</div>
                <div style="font-size:0.72rem; color:var(--text-subtle);">${adminEmail}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="status-pill ${meta.pillClass}" style="display:inline-flex; align-items:center; gap:6px;">
              ${meta.icon}
              <span>${meta.label}</span>
            </span>
          </td>
          <td>
            <code style="background:var(--surface-color); border:1px solid var(--border-color); padding:3px 8px; border-radius:4px; font-size:0.8rem; color:var(--accent-light);">
              ${escapeHtml(log.target || "—")}
            </code>
          </td>
          <td style="max-width:320px;">
            <div style="color:var(--text-muted); font-size:0.84rem; line-height:1.4;">
              ${escapeHtml(log.details || "—")}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function formatFullDate(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hours}:${mins}`;
  } catch (e) {
    return isoString;
  }
}

function formatRelativeTime(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Ką tik";
    if (diffMins < 60) return `Prieš ${diffMins} min.`;
    if (diffHours < 24) return `Prieš ${diffHours} val.`;
    if (diffDays === 1) return "Vakar";
    return `Prieš ${diffDays} d.`;
  } catch (e) {
    return "";
  }
}

function getInitials(name, email) {
  if (name && name.length >= 2) {
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "AD";
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
