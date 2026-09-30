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
  unsubscribeUsersListener
} from "./users.js";
import { initInviteModal } from "./invite-modal.js";

document.addEventListener("DOMContentLoaded", () => {
  initSubmissions();
  initEditions();
  initArchive();
  initUsers();
  initInviteModal();
  initSettings();
  initTabNavigation();

  initAuth({
    onLoginSuccess: (user) => {
      evaluateAdminPrivileges(user);
      subscribeSubmissions();
      subscribeEditions();
      subscribeUsers();
      subscribeSettings();
    },
    onLogout: () => {
      unsubscribeSubmissionsListener();
      unsubscribeEditionsListener();
      unsubscribeUsersListener();
      unsubscribeSettingsListener();
    }
  });
});

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
