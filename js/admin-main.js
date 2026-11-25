import { db } from "./firebase-init.js";
import { initAuth } from "./auth.js";
import {
  initSubmissions,
  subscribeSubmissions,
  unsubscribeSubmissionsListener,
  getSubmissionsList
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
  initAlbums,
  subscribeAlbums,
  unsubscribeAlbumsListener
} from "./albums.js";
import {
  initUsers,
  subscribeUsers,
  unsubscribeUsersListener,
  evaluateUserManagementAccess
} from "./users.js";
import { initInviteModal } from "./invite-modal.js";
import {
  initVotingAnalytics,
  loadVotingAnalytics,
  subscribeVotingAnalytics,
  unsubscribeVotingAnalyticsListener
} from "./voting-analytics.js";
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
        try { subscribeAlbums(); } catch (e) { console.error("subscribeAlbums error:", e); }
        try { subscribeVotingAnalytics(); } catch (e) { console.error("subscribeVotingAnalytics error:", e); }
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
        try { unsubscribeAlbumsListener(); } catch (e) { console.error(e); }
        try { unsubscribeVotingAnalyticsListener(); } catch (e) { console.error(e); }
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
  try { initAlbums(); } catch (e) { console.error("initAlbums error:", e); }
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
    { btn: "tabAlbumsBtn", content: "albumsTab" },
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
        titleElem.textContent = textSpan ? textSpan.textContent.trim() : "Administravimo Portalas";
      }

      if (tab.btn === "tabDiagnosticsBtn") {
        try { loadDiagnosticsData(); } catch (e) { console.error("loadDiagnosticsData error:", e); }
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

function formatDirectorName(film) {
  if (!film) return "";
  const full = [film.directorFirstName, film.directorLastName]
    .filter((v) => typeof v === "string" && v.trim())
    .join(" ")
    .trim();
  return full || film.director || film.directorName || film.name || "";
}

async function hasBackendServer() {
  if (window.FestivalApi && typeof window.FestivalApi.hasServer === "function") {
    try {
      return await window.FestivalApi.hasServer();
    } catch {
      return false;
    }
  }
  return false;
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
  let cachedOverlayState = null;

  async function fetchSubmissionsSafe() {
    // 1. Live in-memory list synced from Firestore onSnapshot
    if (typeof getSubmissionsList === "function") {
      const cached = getSubmissionsList();
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }

    // 2. Direct Firestore submissions collection
    if (db && typeof db.collection === "function") {
      try {
        const snap = await db.collection("submissions").orderBy("submittedAt", "desc").get();
        const docs = [];
        snap.forEach((doc) => docs.push({ id: doc.id, ...doc.data() }));
        if (docs.length > 0) return docs;
      } catch (e) {
        console.warn("[Graphics] Firestore submissions query note:", e.message);
      }
    }

    // 3. Backend server fallback only when Express server is present
    if (!(await hasBackendServer())) {
      return [];
    }

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

    try {
      const token = sessionStorage.getItem("admin_session_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("/api/admin/submissions", { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) return data.submissions;
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.submissions)) return data.submissions;
      }
    } catch (e) {}

    return [];
  }

  function sortFilmsForBroadcast(films) {
    const score = (f) => {
      if (f.isWinner || f.status === "winner") return 4;
      if (f.inVoting === true) return 3;
      if (f.status === "final") return 2;
      if (f.status === "accepted") return 1;
      return 0;
    };
    return [...(films || [])].sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return (b.votesCount || 0) - (a.votesCount || 0);
    });
  }

  function buildRealNominations(films) {
    const selected = (films || []).filter(
      (f) => f.inVoting === true || f.isWinner === true || f.status === "final" || f.status === "winner"
    );
    const pool = selected.length > 0 ? selected : (films || []);
    const byCategory = new Map();
    pool.forEach((f) => {
      const cat = (f.category || "Konkursinė programa").trim();
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push({
        id: f.id,
        title: f.filmTitle || f.title || "Be pavadinimo",
        director: formatDirectorName(f) || "Autorius",
        country: f.country || f.location || "Lietuva",
        duration: f.videoDurationSeconds ? `${f.videoDurationSeconds}s` : (f.duration || ""),
        votes: Number(f.votesCount || f.votes || 0)
      });
    });

    return Array.from(byCategory.entries()).map(([cat, list]) => ({
      id: cat.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      title: cat,
      category: cat,
      films: list.sort((a, b) => b.votes - a.votes)
    }));
  }

  async function fetchOverlayStateSafe() {
    if (db && typeof db.collection === "function") {
      try {
        const doc = await db.collection("stream_config").doc("broadcast").get();
        if (doc.exists) {
          cachedOverlayState = doc.data();
          return cachedOverlayState;
        }
      } catch (e) {
        console.warn("[Graphics] Firestore broadcast read note:", e.message);
      }
    }

    if (await hasBackendServer()) {
      try {
        const bRes = await fetch("/api/broadcast/overlay");
        if (bRes.ok) {
          cachedOverlayState = await bRes.json();
          return cachedOverlayState;
        }
      } catch (e) {}
    }

    return cachedOverlayState || {};
  }

  async function buildCurrentBroadcastPayload() {
    if (allFilms.length === 0) {
      allFilms = await fetchSubmissionsSafe();
    }
    const npFilm = npSelect ? allFilms.find((f) => f.id === npSelect.value) : null;
    const nextFilm = nextSelect ? allFilms.find((f) => f.id === nextSelect.value) : null;
    const saved = cachedOverlayState || (await fetchOverlayStateSafe()) || {};

    const toBroadcastFilm = (f) => ({
      id: f.id,
      title: f.filmTitle || f.title || "Be pavadinimo",
      director: formatDirectorName(f) || "Autorius",
      category: f.category || "Bendroji",
      country: f.country || f.location || "Lietuva",
      duration: f.videoDurationSeconds ? `${f.videoDurationSeconds}s` : (f.duration || ""),
      synopsis: f.synopsis || "",
      awardTitle: f.awardTitle || ""
    });

    const nowPlaying = npFilm ? toBroadcastFilm(npFilm) : (saved.nowPlaying || null);
    const nextUp = nextFilm ? toBroadcastFilm(nextFilm) : (saved.nextFilm || null);
    const nominations = buildRealNominations(allFilms);

    return {
      nowPlaying,
      nextFilm: nextUp,
      isPublicVisible: publicCb ? publicCb.checked : (typeof saved.isPublicVisible === "boolean" ? saved.isPublicVisible : true),
      nominations
    };
  }

  async function populateSelects(optionalFilms) {
    try {
      allFilms = Array.isArray(optionalFilms) && optionalFilms.length > 0
        ? optionalFilms
        : await fetchSubmissionsSafe();

      const sortedFilms = sortFilmsForBroadcast(allFilms);

      if (npSelect && nextSelect) {
        const curNp = npSelect.value;
        const curNext = nextSelect.value;

        if (sortedFilms.length === 0) {
          npSelect.innerHTML = '<option value="">-- Nėra pateiktų filmų --</option>';
          nextSelect.innerHTML = '<option value="">-- Nėra pateiktų filmų --</option>';
        } else {
          const optionsHtml = '<option value="">-- Nepasirinkta --</option>' +
            sortedFilms.map((f) => {
              const title = f.filmTitle || f.title || "Be pavadinimo";
              const cat = f.category || "Bendroji";
              const author = formatDirectorName(f) || "Autorius";
              const stageTag = (f.isWinner || f.status === "winner")
                ? " [LAUREATAS]"
                : (f.inVoting ? " [BALSAVIMAS]" : (f.status === "final" ? " [FINALAS]" : ""));
              return `<option value="${f.id}">${escapeHtml(title)} — ${escapeHtml(author)} (${escapeHtml(cat)})${stageTag}</option>`;
            }).join("");

          npSelect.innerHTML = optionsHtml;
          nextSelect.innerHTML = optionsHtml;

          if (curNp) npSelect.value = curNp;
          if (curNext) nextSelect.value = curNext;
        }
      }

      const bData = await fetchOverlayStateSafe();
      if (bData) {
        if (bData.nowPlaying && bData.nowPlaying.id && npSelect && (!npSelect.value || !optionalFilms)) {
          npSelect.value = bData.nowPlaying.id;
        }
        if (bData.nextFilm && bData.nextFilm.id && nextSelect && (!nextSelect.value || !optionalFilms)) {
          nextSelect.value = bData.nextFilm.id;
        }
        if (publicCb && typeof bData.isPublicVisible === "boolean") {
          publicCb.checked = bData.isPublicVisible;
        }
        if (bData.nowPlaying) {
          updatePreview(bData.nowPlaying);
        } else if (npSelect && npSelect.value) {
          const sel = allFilms.find((x) => x.id === npSelect.value);
          updatePreview(sel ? { title: sel.filmTitle || sel.title, director: formatDirectorName(sel), category: sel.category } : null);
        }
      }
    } catch (e) {
      console.warn("populateSelects error:", e);
    }
  }

  function updatePreview(film) {
    if (previewTitle && previewDir) {
      if (film && film.title) {
        previewTitle.textContent = film.title;
        previewDir.textContent = `Dalyvis / Režisierius: ${film.director || "Autorius"} • ${film.category || "Filmas"}`;
      } else {
        previewTitle.textContent = "Pasirinkite filmą iš sąrašo";
        previewDir.textContent = "Dalyvis / Režisierius • Kategorija";
      }
    }
  }

  // Interactive live preview updates when dropdown selection changes
  if (npSelect) {
    npSelect.addEventListener("change", () => {
      const selectedId = npSelect.value;
      const f = allFilms.find((x) => x.id === selectedId);
      if (f) {
        updatePreview({
          title: f.filmTitle || f.title,
          director: formatDirectorName(f),
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
        const payload = await buildCurrentBroadcastPayload();
        let fsSaved = false;
        let apiSaved = false;

        if (db && typeof db.collection === "function") {
          const fsPayload = { ...payload };
          if (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue) {
            fsPayload.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
          } else {
            fsPayload.updatedAt = new Date().toISOString();
          }
          await db.collection("stream_config").doc("broadcast").set(fsPayload, { merge: true });
          fsSaved = true;
        }

        if (await hasBackendServer()) {
          const res = await fetch("/api/broadcast/overlay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).catch(() => null);
          if (res && res.ok) apiSaved = true;
        }

        if (fsSaved || apiSaved) {
          cachedOverlayState = payload;
          updatePreview(payload.nowPlaying);
          showToast("Eterio titrai (Now Playing & Next) išsaugoti tiesioginiam eteriui!", "success");
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

  // Standalone HTML Download for OBS Browser Source (real finalist & overlay data)
  if (btnH2hHtml) {
    btnH2hHtml.addEventListener("click", async () => {
      try {
        const data = await buildCurrentBroadcastPayload();
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
        const data = await buildCurrentBroadcastPayload();
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
        const data = await buildCurrentBroadcastPayload();
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
        const rows = [["ID", "FILM_TITLE", "PARTICIPANT_DIRECTOR", "CATEGORY", "VOTES", "IN_VOTING", "IS_WINNER", "AWARD_TITLE", "JURY_PLACE", "STATUS"]];
        allFilms.forEach((f) => {
          rows.push([
            f.id,
            f.filmTitle || f.title,
            formatDirectorName(f),
            f.category,
            f.votesCount || 0,
            f.inVoting ? "YES" : "NO",
            f.isWinner ? "YES" : "NO",
            f.awardTitle || "",
            f.juryPlace || "",
            f.status || "submitted"
          ]);
        });
        const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
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

  window.addEventListener("submissions-updated", (e) => {
    const list = Array.isArray(e.detail) ? e.detail : e.detail?.submissions;
    populateSelects(list);
  });

  window.refreshBroadcastOverlaySelects = populateSelects;
  populateSelects();
}

