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

  // Bind Instant Global Control Tumblers (tied to single settings/festival Firestore doc)
  const maintenanceSwitch = document.getElementById("cfgMaintenanceMode");
  if (maintenanceSwitch) {
    maintenanceSwitch.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      await updateGlobalTumbler({
        maintenanceMode: isEnabled
      }, isEnabled ? "Profilaktikos rėžimas ĮJUNGTAS (Platformos prieiga apribota)" : "Profilaktikos rėžimas IŠJUNGTAS (Platforma atvira lankytojams)", e.target);
    });
  }

  const votingSwitch = document.getElementById("cfgVotingActive");
  if (votingSwitch) {
    votingSwitch.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      // Keep cfgShowVoting in sync
      const showVotingElem = document.getElementById("cfgShowVoting");
      if (showVotingElem) showVotingElem.checked = isEnabled;

      await updateGlobalTumbler({
        votingActive: isEnabled,
        showVoting: isEnabled
      }, isEnabled ? "Žiūrovų balsavimas ATIDARYTAS (Balsavimo skiltis aktyvi)" : "Žiūrovų balsavimas UŽDARYTAS (Apklausa sustabdyta)", e.target);
    });
  }

  const archiveSwitch = document.getElementById("cfgArchiveVisibility");
  if (archiveSwitch) {
    archiveSwitch.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      // Keep cfgShowArchive in sync
      const showArchiveElem = document.getElementById("cfgShowArchive");
      if (showArchiveElem) showArchiveElem.checked = isEnabled;

      await updateGlobalTumbler({
        archiveVisibility: isEnabled,
        showArchive: isEnabled
      }, isEnabled ? "Archyvas MATOMAS (Retrospektyva viešai pasiekiama)" : "Archyvas PASLĖPTAS (Retrospektyvos skiltis išjungta)", e.target);
    });
  }

  const btnShowAllTabs = document.getElementById("btnShowAllTabs");
  if (btnShowAllTabs) {
    btnShowAllTabs.addEventListener("click", () => {
      const allSwitches = [
        "cfgShowAbout", "cfgShowTerms", "cfgShowFaq", "cfgShowCategories",
        "cfgShowEditions", "cfgShowArchive", "cfgShowCurrentEdition",
        "cfgShowResults", "cfgShowVoting", "cfgShowScreening", "cfgShowSubmit",
        "cfgVotingActive", "cfgArchiveVisibility"
      ];
      allSwitches.forEach((id) => {
        const elem = document.getElementById(id);
        if (elem) elem.checked = true;
      });
      showToast("Visi skirtukai pažymėti kaip matomi!");
    });
  }
}

async function updateGlobalTumbler(patchData, successMsg, toggleInput) {
  if (toggleInput) toggleInput.disabled = true;

  try {
    const payload = {
      ...patchData,
      updatedAt: new Date().toISOString()
    };

    // 1. Update single Firestore document: settings/festival
    if (db) {
      await db.collection("settings").doc("festival").set(payload, { merge: true });
    }

    // 2. Sync to local backend settings API for mirror consistency
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData)
      });
    } catch (apiErr) {
      console.warn("Backend settings sync notice:", apiErr.message);
    }

    showToast(successMsg, "success");
  } catch (err) {
    console.error("Error updating settings/festival tumbler:", err);
    if (toggleInput) toggleInput.checked = !toggleInput.checked; // Revert switch state on error
    showToast("Klaida keičiant nustatymą: " + err.message, "error");
  } finally {
    if (toggleInput) toggleInput.disabled = false;
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

      // Global Control Tumblers (tied to settings/festival)
      const isMaintenance = d.maintenanceMode === true;
      const isVotingActive = (d.votingActive === true || d.showVoting === true);
      const isArchiveVisible = (d.archiveVisibility !== false && d.showArchive !== false);

      const mElem = document.getElementById("cfgMaintenanceMode");
      if (mElem) mElem.checked = isMaintenance;
      const mBadge = document.getElementById("badgeMaintenanceMode");
      if (mBadge) mBadge.style.display = isMaintenance ? "inline-flex" : "none";

      const vElem = document.getElementById("cfgVotingActive");
      if (vElem) vElem.checked = isVotingActive;
      const vBadge = document.getElementById("badgeVotingActive");
      if (vBadge) {
        vBadge.style.display = isVotingActive ? "inline-flex" : "none";
        vBadge.textContent = isVotingActive ? "Atidarytas" : "Uždarytas";
      }

      const aElem = document.getElementById("cfgArchiveVisibility");
      if (aElem) aElem.checked = isArchiveVisible;
      const aBadge = document.getElementById("badgeArchiveVisibility");
      if (aBadge) {
        aBadge.className = isArchiveVisible ? "status-pill status-accepted" : "status-pill status-rejected";
        aBadge.textContent = isArchiveVisible ? "Matomas" : "Paslėptas";
      }

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

  const maintenanceChecked = document.getElementById("cfgMaintenanceMode") ? document.getElementById("cfgMaintenanceMode").checked : false;
  const votingChecked = document.getElementById("cfgVotingActive") ? document.getElementById("cfgVotingActive").checked : false;
  const archiveChecked = document.getElementById("cfgArchiveVisibility") ? document.getElementById("cfgArchiveVisibility").checked : true;

  const updated = {
    maintenanceMode: maintenanceChecked,
    votingActive: votingChecked,
    archiveVisibility: archiveChecked,
    showAbout: document.getElementById("cfgShowAbout").checked,
    showTerms: document.getElementById("cfgShowTerms").checked,
    showFaq: document.getElementById("cfgShowFaq").checked,
    showCategories: document.getElementById("cfgShowCategories").checked,
    showEditions: document.getElementById("cfgShowEditions").checked,
    showArchive: archiveChecked,
    showCurrentEdition: document.getElementById("cfgShowCurrentEdition").checked,
    showResults: document.getElementById("cfgShowResults").checked,
    showVoting: votingChecked,
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