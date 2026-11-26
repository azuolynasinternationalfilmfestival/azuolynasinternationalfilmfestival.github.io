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
import {
  initContent,
  subscribeContent,
  unsubscribeContentListener
} from "./content.js";
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
        try { subscribeContent(); } catch (e) { console.error("subscribeContent error:", e); }
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
        try { unsubscribeContentListener(); } catch (e) { console.error(e); }
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
  try { initContent(); } catch (e) { console.error("initContent error:", e); }
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
  const sectionTitles = {
    dashboard: "Apžvalga",
    submissions: "Paraiškos",
    voting: "Balsavimas ir žiūri",
    content: "Turinys",
    streamGraphics: "Transliacija ir grafika",
    users: "Komanda",
    settings: "Nustatymai",
    notifications: "Veiklos žurnalas"
  };

  const allContentIds = [
    "dashboardTab",
    "submissionsTab",
    "votingTab",
    "streamTab",
    "graphicsTab",
    "contentTab",
    "usersTab",
    "notificationsTab",
    "diagnosticsTab",
    "settingsTab"
  ];

  const streamSubTabs = [
    { btn: "tabStreamBtn", content: "streamTab" },
    { btn: "tabGraphicsBtn", content: "graphicsTab" }
  ];

  let activeStreamSub = "tabStreamBtn";

  function syncNavHighlights(sectionKey) {
    document.querySelectorAll("[data-admin-section]").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-admin-section") === sectionKey);
    });
    const titleElem = document.getElementById("adminCurrentSectionTitle");
    if (titleElem) {
      titleElem.textContent = sectionTitles[sectionKey] || "Apžvalga";
    }
  }

  function showOnlyTabContent(targetId) {
    allContentIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("d-none", id !== targetId);
    });
  }

  function toggleSubNavGroups(sectionKey) {
    const streamNav = document.getElementById("streamGraphicsSubNav");
    if (streamNav) streamNav.classList.toggle("d-none", sectionKey !== "streamGraphics");
  }

  function activateSubTab(groupList, btnId) {
    groupList.forEach((item) => {
      const b = document.getElementById(item.btn);
      if (b) b.classList.toggle("active", item.btn === btnId);
    });
    const matched = groupList.find((item) => item.btn === btnId) || groupList[0];
    if (matched) {
      showOnlyTabContent(matched.content);
    }
  }

  function closeMobileSheet() {
    const sheet = document.getElementById("adminMobileSheet");
    const backdrop = document.getElementById("adminMobileSheetBackdrop");
    const openBtn = document.getElementById("btnOpenMobileMenuSheet");
    if (sheet) {
      sheet.classList.remove("is-open");
      sheet.classList.add("d-none");
    }
    if (backdrop) {
      backdrop.classList.remove("is-open");
      backdrop.classList.add("d-none");
    }
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
  }

  function activateSection(sectionKey) {
    if (sectionKey === "users") {
      const usersBtn = document.getElementById("tabUsersBtn");
      if (usersBtn && usersBtn.classList.contains("d-none")) return;
    }

    toggleSubNavGroups(sectionKey);
    syncNavHighlights(sectionKey);

    if (sectionKey === "dashboard") {
      showOnlyTabContent("dashboardTab");
    } else if (sectionKey === "submissions") {
      showOnlyTabContent("submissionsTab");
    } else if (sectionKey === "voting") {
      showOnlyTabContent("votingTab");
    } else if (sectionKey === "content") {
      showOnlyTabContent("contentTab");
    } else if (sectionKey === "streamGraphics") {
      activateSubTab(streamSubTabs, activeStreamSub);
    } else if (sectionKey === "users") {
      showOnlyTabContent("usersTab");
    } else if (sectionKey === "settings") {
      showOnlyTabContent("settingsTab");
    } else if (sectionKey === "notifications") {
      showOnlyTabContent("notificationsTab");
    }

    closeMobileSheet();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Bind all sidebar, mobile bottom nav, and mobile sheet primary section triggers
  document.querySelectorAll("[data-admin-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-admin-section");
      if (target) activateSection(target);
    });
  });

  // Bind sub-tabs inside "Transliacija ir grafika"
  streamSubTabs.forEach((item) => {
    const b = document.getElementById(item.btn);
    if (!b) return;
    b.addEventListener("click", () => {
      activeStreamSub = item.btn;
      toggleSubNavGroups("streamGraphics");
      syncNavHighlights("streamGraphics");
      activateSubTab(streamSubTabs, item.btn);
    });
  });

  // Top header bell button opens activity log cleanly without taking a menu slot
  const topBellBtn = document.getElementById("btnHeaderNotifications");
  if (topBellBtn) {
    topBellBtn.addEventListener("click", () => activateSection("notifications"));
  }

  // Keep mobile sheet "Komanda" item synchronized with #tabUsersBtn visibility
  const sidebarUsersBtn = document.getElementById("tabUsersBtn");
  const sheetUsersBtn = document.getElementById("mobileSheetUsersBtn");
  if (sidebarUsersBtn && sheetUsersBtn) {
    const syncUsersVisibility = () => {
      sheetUsersBtn.classList.toggle("d-none", sidebarUsersBtn.classList.contains("d-none"));
    };
    syncUsersVisibility();
    if (typeof MutationObserver !== "undefined") {
      const obs = new MutationObserver(syncUsersVisibility);
      obs.observe(sidebarUsersBtn, { attributes: true, attributeFilter: ["class"] });
    }
  }

  // Mirror logout clicks from sidebar footer and mobile sheet
  ["sidebarLogoutMirrorBtn", "mobileSheetLogoutBtn"].forEach((mirrorId) => {
    const mirrorBtn = document.getElementById(mirrorId);
    if (mirrorBtn) {
      mirrorBtn.addEventListener("click", () => {
        closeMobileSheet();
        document.getElementById("logoutBtn")?.click();
      });
    }
  });
}

function initMobileSidebarToggle() {
  const openBtn = document.getElementById("btnOpenMobileMenuSheet");
  const closeBtn = document.getElementById("btnCloseMobileMenuSheet");
  const sheet = document.getElementById("adminMobileSheet");
  const backdrop = document.getElementById("adminMobileSheetBackdrop");

  function openSheet() {
    if (!sheet || !backdrop) return;
    backdrop.classList.remove("d-none");
    sheet.classList.remove("d-none");
    requestAnimationFrame(() => {
      backdrop.classList.add("is-open");
      sheet.classList.add("is-open");
    });
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
  }

  function closeSheet() {
    if (!sheet || !backdrop) return;
    sheet.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!sheet.classList.contains("is-open")) {
        sheet.classList.add("d-none");
        backdrop.classList.add("d-none");
      }
    }, 180);
  }

  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (sheet && sheet.classList.contains("is-open")) {
        closeSheet();
      } else {
        openSheet();
      }
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeSheet);
  if (backdrop) backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet && sheet.classList.contains("is-open")) {
      closeSheet();
    }
  });
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

