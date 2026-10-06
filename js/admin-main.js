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
import { initTestVoting } from "./test-voting.js";

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
        if (hasUserManagementAccess) {
          try { subscribeUsers(); } catch (e) { console.error("subscribeUsers error:", e); }
        }
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
  try { initEditions(); } catch (e) { console.error("initEditions error:", e); }
  try { initArchive(); } catch (e) { console.error("initArchive error:", e); }
  try { initUsers(); } catch (e) { console.error("initUsers error:", e); }
  try { initInviteModal(); } catch (e) { console.error("initInviteModal error:", e); }
  try { initTestVoting(); } catch (e) { console.error("initTestVoting error:", e); }
  try { initSettings(); } catch (e) { console.error("initSettings error:", e); }
  try { initTabNavigation(); } catch (e) { console.error("initTabNavigation error:", e); }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootAdmin);
} else {
  bootAdmin();
}

function initTabNavigation() {
  const tabs = [
    { btn: "tabSubmissionsBtn", content: "submissionsTab" },
    { btn: "tabEditionsBtn", content: "editionsTab" },
    { btn: "tabArchiveBtn", content: "archiveTab" },
    { btn: "tabUsersBtn", content: "usersTab" },
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
        document.getElementById(t.btn).classList.toggle("active", isCurrent);
      });
    });
  });
}
