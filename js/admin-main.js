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

document.addEventListener("DOMContentLoaded", () => {
  initSubmissions();
  initArchive();
  initSettings();
  initTabNavigation();

  initAuth({
    onLoginSuccess: (user) => {
      evaluateAdminPrivileges(user);
      subscribeSubmissions();
      subscribeSettings();
    },
    onLogout: () => {
      unsubscribeSubmissionsListener();
      unsubscribeSettingsListener();
    }
  });
});

function initTabNavigation() {
  const tabs = [
    { btn: "tabSubmissionsBtn", content: "submissionsTab" },
    { btn: "tabArchiveBtn", content: "archiveTab" },
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