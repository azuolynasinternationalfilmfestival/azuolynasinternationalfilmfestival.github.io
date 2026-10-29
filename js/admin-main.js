import { initAuth } from "./auth.js";
import { 
  initSubmissions, 
  subscribeSubmissions, 
  unsubscribeSubmissionsListener 
} from "./submissions.js";
import { 
  initSettings, 
  subscribeSettings, 
  unsubscribeSettingsListener,
  evaluateAdminPrivileges
} from "./settings.js";
import { initArchive } from "./archive.js";
import { 
  initEditions, 
  subscribeEditions, 
  unsubscribeEditionsListener 
} from "./editions.js";
import {
  initUsers,
  subscribeUsers,
  unsubscribeUsersListener,
  evaluateUserManagementAccess
} from "./users.js";
import { initInviteModal } from "./invite-modal.js";
import { initVotingAnalytics, loadVotingAnalytics } from "./voting-analytics.js";
import { initStreamAdmin, loadStreamData } from "./stream-admin.js";
import { initNotificationsLog, loadActivityLogs } from "./notifications-log.js";
import { initDiagnostics, loadDiagnosticsData } from "./diagnostics.js";
import { showToast } from "./ui-feedback.js";

function bootAdmin() {
  // 1. Initialize Authentication FIRST so the login interface is immediately responsive
  try {
    initAuth({
      onLoginSuccess: async (user) => {
        try { evaluateAdminPrivileges(user); } catch (e) { console.error("evaluateAdminPrivileges error:", e); }
        let hasUserManagementAccess = false;
        try {
          hasUserManagementAccess = await evaluateUserManagementAccess(user);
        } catch (e) {
          console.error("evaluateUserManagementAccess error:", e);
        }
        try { subscribeSubmissions(); } catch (e) { console.error("subscribeSubmissions error:", e); }
        try { subscribeEditions(); } catch (e) { console.error("subscribeEditions error:", e); }
        try { loadVotingAnalytics(); } catch (e) { console.error("loadVotingAnalytics error:", e); }
        try { loadStreamData(); } catch (e) { console.error("loadStreamData error:", e); }
        try { loadActivityLogs(); } catch (e) { console.error("loadActivityLogs error:", e); }
        if (hasUserManagementAccess) {
          try { subscribeUsers(); } catch (e) { console.error("subscribeUsers error:", e); }
        }
        try { loadDiagnosticsData(); } catch (e) { console.error("loadDiagnosticsData error:", e); }
        try { subscribeSettings(); } catch (e) { console.error("subscribeSettings error:", e); }
        try { if (window.refreshBroadcastOverlaySelects) window.refreshBroadcastOverlaySelects(); } catch (e) {}
      },
      onLogout: () => {
        try { evaluateUserManagementAccess(null); } catch (e) { console.error(e); }
        try { unsubscribeSubmissionsListener(); } catch (e) { console.error(e); }
        try { unsubscribeEditionsListener(); } catch (e) { console.error(e); }
        try { unsubscribeUsersListener(); } catch (e) { console.error(e); }
        try { unsubscribeSettingsListener(); } catch (e) { console.error(e); }
      }
    });
  } catch (authInitErr) {
    console.error("Critical error in initAuth:", authInitErr);
  }

  // 2. Initialize management panel tabs and subsystems
  try { initSubmissions(); } catch (e) { console.error("initSubmissions error:", e); }
  try { initVotingAnalytics(); } catch (e) { console.error("initVotingAnalytics error:", e); }
  try { initStreamAdmin(); } catch (e) { console.error("initStreamAdmin error:", e); }
  try { initGraphicsManager(); } catch (e) { console.error("initGraphicsManager error:", e); }
  try { initEditions(); } catch (e) { console.error("initEditions error:", e); }
  try { initArchive(); } catch (e) { console.error("initArchive error:", e); }
  try { initNotificationsLog(); } catch (e) { console.error("initNotificationsLog error:", e); }
  try { initDiagnostics(); } catch (e) { console.error("initDiagnostics error:", e); }
  try { initUsers(); } catch (e) { console.error("initUsers error:", e); }
  try { initInviteModal(); } catch (e) { console.error("initInviteModal error:", e); }
  try { initSettings(); } catch (e) { console.error("initSettings error:", e); }
  try { initTabNavigation(); } catch (e) { console.error("initTabNavigation error:", e); }
  try { initMobileSidebarToggle(); } catch (e) { console.error("initMobileSidebarToggle error:", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAdmin);
} else {
  bootAdmin();
}

function initTabNavigation() {
  const tabs = [
    { btn: "tabDashboardBtn", content: "dashboardTab" },
    { btn: "tabSubmissionsBtn", content: "submissionsTab" },
    { btn: "tabVotingBtn", content: "votingTab" },
    { btn: "tabStreamBtn", content: "streamTab" },
    { btn: "tabGraphicsBtn", content: "graphicsTab" },
    { btn: "tabEditionsBtn", content: "editionsTab" },
    { btn: "tabArchiveBtn", content: "archiveTab" },
    { btn: "tabUsersBtn", content: "usersTab" },
    { btn: "tabNotificationsBtn", content: "notificationsTab" },
    { btn: "tabDiagnosticsBtn", content: "diagnosticsTab" },
    { btn: "tabSettingsBtn", content: "settingsTab" }
  ];

  tabs.forEach((tab) => {
    const btnElem = document.getElementById(tab.btn);
    if (!btnElem) return;

    btnElem.addEventListener("click", () => {
      if (tab.btn === "tabUsersBtn" && btnElem.classList.contains("d-none")) {
        return;
      }
      tabs.forEach((t) => {
        const isCurrent = t.btn === tab.btn;
        const contentElem = document.getElementById(t.content);
        if (contentElem) {
          contentElem.classList.toggle("d-none", !isCurrent);
        }
        const b = document.getElementById(t.btn);
        if (b) b.classList.toggle("active", isCurrent);
      });

      // Update header section title breadcrumb if present
      const titleElem = document.getElementById("adminCurrentSectionTitle");
      if (titleElem) {
        const textSpan = btnElem.querySelector("span:not(.badge)");
        titleElem.textContent = textSpan ? textSpan.textContent.trim() : "Valdymo Skydas";
      }

      // Close mobile sidebar on selection
      const sidebar = document.getElementById("adminSidebar");
      if (sidebar && window.innerWidth <= 1024) {
        sidebar.classList.remove("sidebar-open");
      }
    });
  });

  // Top header bell button also opens notifications
  const topBellBtn = document.getElementById("btnHeaderNotifications");
  if (topBellBtn) {
    topBellBtn.addEventListener("click", () => {
      const notifBtn = document.getElementById("tabNotificationsBtn");
      if (notifBtn) notifBtn.click();
    });
  }
}

function initMobileSidebarToggle() {
  const toggleBtn = document.getElementById("adminSidebarMobileToggle");
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("adminSidebarBackdrop");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("sidebar-open");
      if (backdrop) backdrop.classList.toggle("d-none");
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("sidebar-open");
      backdrop.classList.add("d-none");
    });
  }
}

function initGraphicsManager() {
  const npSelect = document.getElementById("graphicsNowPlayingSelect");
  const nextSelect = document.getElementById("graphicsNextSelect");
  const publicCb = document.getElementById("graphicsPublicVisible");
  const saveBtn = document.getElementById("btnSaveBroadcastOverlay");
  const previewTitle = document.getElementById("previewOverlayTitle");
  const previewDir = document.getElementById("previewOverlayDirector");

  const btnH2hHtml = document.getElementById("btnDownloadH2hHtml");
  const btnH2hJson = document.getElementById("btnDownloadH2hJson");
  const btnH2hCsv = document.getElementById("btnDownloadH2hCsv");
  const btnVotingCsv = document.getElementById("btnDownloadVotingCsv");

  let allFilms = [];

  async function fetchSubmissionsSafe() {
    // 1. Try FirebaseClient request first (authenticated)
    if (window.FirebaseClient && typeof window.FirebaseClient.request === "function") {
      try {
        const res = await window.FirebaseClient.request("submissions");
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data.submissions) && data.submissions.length > 0) {
            return data.submissions;
          }
        }
      } catch (err) {
        console.warn("[Graphics] FirebaseClient submissions notice:", err.message);
      }
    }

    // 2. Try with session token if present
    try {
      const token = sessionStorage.getItem("admin_session_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/admin/submissions", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) return data.submissions;
      }
    } catch (e) {}

    // 3. Fallback to public submissions endpoint
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) return data.submissions;
      }
    } catch (e) {}

    return [];
  }

  async function populateSelects() {
    try {
      allFilms = await fetchSubmissionsSafe();

      if (npSelect && nextSelect) {
        const curNp = npSelect.value;
        const curNext = nextSelect.value;

        if (allFilms.length === 0) {
          npSelect.innerHTML = '<option value="">-- Nėra pateiktų filmų --</option>';
          nextSelect.innerHTML = '<option value="">-- Nėra pateiktų filmų --</option>';
        } else {
          const optionsHtml = '<option value="">-- Nepasirinkta --</option>' + 
            allFilms.map(f => {
              const title = f.filmTitle || f.title || "Be pavadinimo";
              const cat = f.category || "Bendroji";
              const author = f.name || f.director || "";
              return `<option value="${f.id}">${escapeHtml(title)} (${escapeHtml(cat)} - ${escapeHtml(author)})</option>`;
            }).join("");

          npSelect.innerHTML = optionsHtml;
          nextSelect.innerHTML = optionsHtml;

          if (curNp) npSelect.value = curNp;
          if (curNext) nextSelect.value = curNext;
        }
      }

      // Fetch active broadcast overlay settings
      try {
        const bRes = await fetch("/api/broadcast/overlay");
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.nowPlaying && bData.nowPlaying.id && npSelect) {
            npSelect.value = bData.nowPlaying.id;
          }
          if (bData.nextFilm && bData.nextFilm.id && nextSelect) {
            nextSelect.value = bData.nextFilm.id;
          }
          if (publicCb && typeof bData.isPublicVisible === "boolean") {
            publicCb.checked = bData.isPublicVisible;
          }
          updatePreview(bData.nowPlaying);
        }
      } catch (e) {
        console.warn("[Graphics] Overlay fetch note:", e.message);
      }

    } catch (e) {
      console.warn("populateSelects error:", e);
    }
  }

  function updatePreview(film) {
    if (previewTitle && previewDir) {
      if (film && film.title) {
        previewTitle.textContent = film.title;
        previewDir.textContent = `Režisierius: ${film.director || 'Mokinys'} • ${film.category || 'Filmas'}`;
      } else {
        previewTitle.textContent = "Filmo Pavadinimas";
        previewDir.textContent = "Režisierius: Vardas Pavardė • Lietuva";
      }
    }
  }

  // Interactive live preview updates when dropdown selection changes
  if (npSelect) {
    npSelect.addEventListener("change", () => {
      const selectedId = npSelect.value;
      const f = allFilms.find(x => x.id === selectedId);
      if (f) {
        updatePreview({
          title: f.filmTitle || f.title,
          director: f.name || f.director,
          category: f.category
        });
      } else {
        updatePreview(null);
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saugoma...";
      try {
        // If allFilms empty, attempt one quick re-fetch
        if (allFilms.length === 0) {
          allFilms = await fetchSubmissionsSafe();
        }

        const npFilm = allFilms.find(f => f.id === npSelect.value);
        const nextFilm = allFilms.find(f => f.id === nextSelect.value);

        const payload = {
          nowPlaying: npFilm ? {
            id: npFilm.id,
            title: npFilm.filmTitle || npFilm.title || "Filmas",
            director: npFilm.name || npFilm.director || "Autorius",
            category: npFilm.category || "Bendroji",
            country: npFilm.country || "Lietuva"
          } : null,
          nextFilm: nextFilm ? {
            id: nextFilm.id,
            title: nextFilm.filmTitle || nextFilm.title || "Filmas",
            director: nextFilm.name || nextFilm.director || "Autorius",
            category: nextFilm.category || "Bendroji",
            country: nextFilm.country || "Lietuva"
          } : null,
          isPublicVisible: publicCb ? publicCb.checked : true
        };

        const res = await fetch("/api/broadcast/overlay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          updatePreview(payload.nowPlaying);
          showToast("Eterio titrai (Now Playing & Next) sėkmingai išsaugoti!", "success");
        } else {
          showToast("Nepavyko išsaugoti eterio titrų", "error");
        }
      } catch (err) {
        showToast("Klaida išsaugant eterio duomenis: " + err.message, "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Išsaugoti Eterio Titrus";
      }
    });
  }

  // Standalone HTML Download for OBS Browser Source
  if (btnH2hHtml) {
    btnH2hHtml.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/broadcast/overlay");
        const data = res.ok ? await res.json() : {};
        if (window.H2HExport && typeof window.H2HExport.downloadOBSHtml === "function") {
          window.H2HExport.downloadOBSHtml(data, `asiff-h2h-overlay-${new Date().toISOString().slice(0, 10)}.html`);
          showToast("H2H HTML failas sugeneruotas ir atsisiųstas OBS šaltiniui!", "success");
        } else {
          showToast("H2H eksportuotojas nepasiekiamas", "error");
        }
      } catch (e) {
        showToast("Klaida atsisiunčiant H2H HTML: " + e.message, "error");
      }
    });
  }

  if (btnH2hJson) {
    btnH2hJson.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/broadcast/overlay");
        const data = res.ok ? await res.json() : {};
        if (window.H2HExport && typeof window.H2HExport.downloadJSON === "function") {
          window.H2HExport.downloadJSON(data, `asiff-h2h-graphics-${new Date().toISOString().slice(0, 10)}.json`);
          showToast("H2H JSON grafikos duomenys sėkmingai atsisiųsti!", "success");
        }
      } catch (e) {
        showToast("Klaida eksportuojant JSON", "error");
      }
    });
  }

  if (btnH2hCsv) {
    btnH2hCsv.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/broadcast/overlay");
        const data = res.ok ? await res.json() : {};
        if (window.H2HExport && typeof window.H2HExport.downloadCSV === "function") {
          window.H2HExport.downloadCSV(data, `asiff-rundown-${new Date().toISOString().slice(0, 10)}.csv`);
          showToast("Transliacijos Rundown CSV atsisiųstas!", "success");
        }
      } catch (e) {
        showToast("Klaida eksportuojant CSV", "error");
      }
    });
  }

  if (btnVotingCsv) {
    btnVotingCsv.addEventListener("click", async () => {
      try {
        if (allFilms.length === 0) {
          allFilms = await fetchSubmissionsSafe();
        }
        const rows = [["ID", "FILM_TITLE", "DIRECTOR", "CATEGORY", "VOTES", "STATUS"]];
        allFilms.forEach(f => {
          rows.push([f.id, f.filmTitle || f.title, f.name || f.director, f.category, f.votesCount || 0, f.status || "pateikta"]);
        });
        const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asiff-voting-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Balsavimo statistikos CSV atsisiųstas!", "success");
      } catch (e) {
        showToast("Klaida eksportuojant CSV: " + e.message, "error");
      }
    });
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

  window.refreshBroadcastOverlaySelects = populateSelects;
  populateSelects();
}
