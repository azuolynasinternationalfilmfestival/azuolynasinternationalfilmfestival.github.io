import { db, DEFAULT_CONTENT } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { syncArchiveState } from "./archive.js";

let unsubscribeSettings = null;

export function initSettings() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  saveBtn.addEventListener("click", saveSettings);
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

      document.getElementById("cfgShowVoting").checked = d.showVoting === true;
      document.getElementById("cfgShowResults").checked = d.showResults === true;
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
    showVoting: document.getElementById("cfgShowVoting").checked,
    showResults: document.getElementById("cfgShowResults").checked,
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
