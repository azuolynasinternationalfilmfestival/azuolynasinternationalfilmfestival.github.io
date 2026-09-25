import { db, DEFAULT_CONTENT, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { syncArchiveState } from "./archive.js";
import { sendAdminInviteLink } from "./auth.js";

let unsubscribeSettings = null;

export function initSettings() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveSettings);
  }

  const sendInviteBtn = document.getElementById("sendInviteBtn");
  if (sendInviteBtn) {
    sendInviteBtn.addEventListener("click", handleSendAdminInvite);
  }

  const btnShowAllTabs = document.getElementById("btnShowAllTabs");
  if (btnShowAllTabs) {
    btnShowAllTabs.addEventListener("click", () => {
      const allSwitches = [
        "cfgShowAbout", "cfgShowTerms", "cfgShowFaq", "cfgShowCategories",
        "cfgShowEditions", "cfgShowArchive", "cfgShowCurrentEdition",
        "cfgShowResults", "cfgShowVoting", "cfgShowScreening", "cfgShowSubmit"
      ];
      allSwitches.forEach((id) => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = true;
      });
      showToast("Visi skirtukai pažymėti kaip matomi!");
    });
  }
}

export function evaluateAdminPrivileges(user) {
  const inviteCard = document.getElementById("adminInviteCard");
  if (!inviteCard) return;

  const isSuperAdmin = user && user.email && user.email.toLowerCase() === PRIMARY_SUPERADMIN_EMAIL;
  if (isSuperAdmin) {
    inviteCard.classList.remove("d-none");
  } else {
    inviteCard.classList.add("d-none");
  }
}

async function handleSendAdminInvite() {
  const input = document.getElementById("inviteAdminEmail");
  const btn = document.getElementById("sendInviteBtn");
  const email = input.value.trim().toLowerCase();

  if (!email) {
    showToast("Įveskite el. pašto adresą!", "error");
    return;
  }

  btn.disabled = true;

  try {
    await sendAdminInviteLink(email);
    input.value = "";
    showToast(`Prieigos nuoroda išsiųsta į ${email}`);
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

export function subscribeSettings() {
  if (unsubscribeSettings) {
    unsubscribeSettings();
  }

  unsubscribeSettings = db.collection("settings").doc("festival")
    .onSnapshot((doc) => {
      const d = doc.exists ? doc.data() : DEFAULT_CONTENT;
      const lt = d.lt || DEFAULT_CONTENT.lt;
      const en = d.en || DEFAULT_CONTENT.en;

      // Tab Visibilities (default true unless explicitly set to false; voting and results default false)
      document.getElementById("cfgShowAbout").checked = d.showAbout !== false;
      document.getElementById("cfgShowTerms").checked = d.showTerms !== false;
      document.getElementById("cfgShowFaq").checked = d.showFaq !== false;
      document.getElementById("cfgShowCategories").checked = d.showCategories !== false;
      document.getElementById("cfgShowEditions").checked = d.showEditions !== false;
      document.getElementById("cfgShowArchive").checked = d.showArchive !== false;
      document.getElementById("cfgShowCurrentEdition").checked = d.showCurrentEdition !== false;
      document.getElementById("cfgShowResults").checked = d.showResults === true;
      document.getElementById("cfgShowVoting").checked = d.showVoting === true;
      document.getElementById("cfgShowScreening").checked = d.showScreening !== false;
      document.getElementById("cfgShowSubmit").checked = d.showSubmit !== false;

      document.getElementById("cfgRecordingUrl").value = d.recordingVideoUrl || "";

      document.getElementById("cfgLtTopic").value = lt.topic || "";
      document.getElementById("cfgLtAbout").value = lt.aboutText || "";
      document.getElementById("cfgLtHeroBadge").value = lt.heroBadge || "";
      document.getElementById("cfgLtDates").value = lt.datesSubmissions || "";
      document.getElementById("cfgLtEvent").value = lt.dateEvent || "";
      document.getElementById("cfgLtTarget").value = lt.targetAudience || "";
      document.getElementById("cfgLtRecordingPh").value = lt.recordingPlaceholder || "";

      document.getElementById("cfgEnTopic").value = en.topic || "";
      document.getElementById("cfgEnAbout").value = en.aboutText || "";
      document.getElementById("cfgEnHeroBadge").value = en.heroBadge || "";
      document.getElementById("cfgEnDates").value = en.datesSubmissions || "";
      document.getElementById("cfgEnEvent").value = en.dateEvent || "";
      document.getElementById("cfgEnTarget").value = en.targetAudience || "";
      document.getElementById("cfgEnRecordingPh").value = en.recordingPlaceholder || "";

      syncArchiveState(d);
    }, (err) => {
      showToast("Klaida gaunant nustatymus: " + err.message, "error");
    });
}

export function unsubscribeSettingsListener() {
  if (unsubscribeSettings) {
    unsubscribeSettings();
    unsubscribeSettings = null;
  }
}

async function saveSettings() {
  const btn = document.getElementById("saveSettingsBtn");
  btn.disabled = true;

  const updated = {
    showAbout: document.getElementById("cfgShowAbout").checked,
    showTerms: document.getElementById("cfgShowTerms").checked,
    showFaq: document.getElementById("cfgShowFaq").checked,
    showCategories: document.getElementById("cfgShowCategories").checked,
    showEditions: document.getElementById("cfgShowEditions").checked,
    showArchive: document.getElementById("cfgShowArchive").checked,
    showCurrentEdition: document.getElementById("cfgShowCurrentEdition").checked,
    showResults: document.getElementById("cfgShowResults").checked,
    showVoting: document.getElementById("cfgShowVoting").checked,
    showScreening: document.getElementById("cfgShowScreening").checked,
    showSubmit: document.getElementById("cfgShowSubmit").checked,
    recordingVideoUrl: document.getElementById("cfgRecordingUrl").value.trim(),
    lt: {
      topic: document.getElementById("cfgLtTopic").value.trim(),
      aboutText: document.getElementById("cfgLtAbout").value.trim(),
      heroBadge: document.getElementById("cfgLtHeroBadge").value.trim(),
      datesSubmissions: document.getElementById("cfgLtDates").value.trim(),
      dateEvent: document.getElementById("cfgLtEvent").value.trim(),
      targetAudience: document.getElementById("cfgLtTarget").value.trim(),
      recordingPlaceholder: document.getElementById("cfgLtRecordingPh").value.trim()
    },
    en: {
      topic: document.getElementById("cfgEnTopic").value.trim(),
      aboutText: document.getElementById("cfgEnAbout").value.trim(),
      heroBadge: document.getElementById("cfgEnHeroBadge").value.trim(),
      datesSubmissions: document.getElementById("cfgEnDates").value.trim(),
      dateEvent: document.getElementById("cfgEnEvent").value.trim(),
      targetAudience: document.getElementById("cfgEnTarget").value.trim(),
      recordingPlaceholder: document.getElementById("cfgEnRecordingPh").value.trim()
    }
  };

  try {
    await db.collection("settings").doc("festival").set(updated, { merge: true });
    showToast("Nustatymai sėkmingai išsaugoti!");
  } catch (err) {
    showToast("Klaida išsaugant nustatymus: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}