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
import { initTasks, loadTasks } from "./tasks.js";
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
        try { loadTasks(); } catch (e) { console.error("loadTasks error:", e); }
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
  try { initEditions(); } catch (e) { console.error("initEditions error:", e); }
  try { initArchive(); } catch (e) { console.error("initArchive error:", e); }
  try { initTasks(); } catch (e) { console.error("initTasks error:", e); }
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
    { btn: "tabSubmissionsBtn", content: "submissionsTab" },
    { btn: "tabVotingBtn", content: "votingTab" },
    { btn: "tabStreamBtn", content: "streamTab" },
    { btn: "tabEditionsBtn", content: "editionsTab" },
    { btn: "tabArchiveBtn", content: "archiveTab" },
    { btn: "tabTasksBtn", content: "tasksTab" },
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
