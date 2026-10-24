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

  const btnH2hJson = document.getElementById("btnDownloadH2hJson");
  const btnH2hCsv = document.getElementById("btnDownloadH2hCsv");
  const btnVotingCsv = document.getElementById("btnDownloadVotingCsv");

  async function populateSelects() {
    try {
      const res = await fetch("/api/admin/submissions");
      let films = [];
      if (res.ok) {
        const d = await res.json();
        films = d.submissions || [];
      }

      if (npSelect && nextSelect) {
        const optionsHtml = '<option value="">-- Nepasirinkta --</option>' + 
          films.map(f => `<option value="${f.id}">${(f.filmTitle || 'Be pavadinimo')} (${f.category || 'Kat.'} - ${f.name || ''})</option>`).join("");
        
        const curNp = npSelect.value;
        const curNext = nextSelect.value;
        npSelect.innerHTML = optionsHtml;
        nextSelect.innerHTML = optionsHtml;
        if (curNp) npSelect.value = curNp;
        if (curNext) nextSelect.value = curNext;
      }

      try {
        const bRes = await fetch("/api/broadcast/overlay");
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.nowPlaying && bData.nowPlaying.id && npSelect) npSelect.value = bData.nowPlaying.id;
          if (bData.nextFilm && bData.nextFilm.id && nextSelect) nextSelect.value = bData.nextFilm.id;
          if (publicCb && typeof bData.isPublicVisible === "boolean") publicCb.checked = bData.isPublicVisible;
          updatePreview(bData.nowPlaying);
        }
      } catch (e) {}

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

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saugoma...";
      try {
        const res = await fetch("/api/admin/submissions");
        let films = [];
        if (res.ok) {
          const d = await res.json();
          films = d.submissions || [];
        }

        const npFilm = films.find(f => f.id === npSelect.value);
        const nextFilm = films.find(f => f.id === nextSelect.value);

        const payload = {
          nowPlaying: npFilm ? {
            id: npFilm.id,
            title: npFilm.filmTitle,
            director: npFilm.name || npFilm.director,
            category: npFilm.category,
            country: npFilm.country || "Lietuva"
          } : null,
          nextFilm: nextFilm ? {
            id: nextFilm.id,
            title: nextFilm.filmTitle,
            director: nextFilm.name || nextFilm.director,
            category: nextFilm.category,
            country: nextFilm.country || "Lietuva"
          } : null,
          isPublicVisible: publicCb ? publicCb.checked : true
        };

        await fetch("/api/broadcast/overlay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        updatePreview(payload.nowPlaying);
        alert("Eterio nustatymai sėkmingai išsaugoti!");
      } catch (err) {
        alert("Klaida išsaugant eterio duomenis: " + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Išsaugoti Eterio Titrus";
      }
    });
  }

  if (btnH2hJson) {
    btnH2hJson.addEventListener("click", async () => {
      const res = await fetch("/api/broadcast/overlay");
      const data = res.ok ? await res.json() : {};
      if (window.H2HExport) {
        window.H2HExport.downloadJSON(data);
      }
    });
  }

  if (btnH2hCsv) {
    btnH2hCsv.addEventListener("click", async () => {
      const res = await fetch("/api/broadcast/overlay");
      const data = res.ok ? await res.json() : {};
      if (window.H2HExport) {
        window.H2HExport.downloadCSV(data);
      }
    });
  }

  if (btnVotingCsv) {
    btnVotingCsv.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/admin/submissions");
        const d = res.ok ? await res.json() : { submissions: [] };
        const rows = [["ID", "FILM_TITLE", "DIRECTOR", "CATEGORY", "VOTES", "STATUS"]];
        (d.submissions || []).forEach(f => {
          rows.push([f.id, f.filmTitle, f.name, f.category, f.votesCount || 0, f.status]);
        });
        const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `asiff-voting-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        alert("Klaida eksportuojant CSV: " + e.message);
      }
    });
  }

  populateSelects();
}
