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
      }, isEnabled ? "Profilaktikos režimas ĮJUNGTAS (Platformos prieiga apribota)" : "Profilaktikos režimas IŠJUNGTAS (Platforma atvira lankytojams)", e.target);
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

  // 2027 Theme & Date Presets
  const btnThemePurpose = document.getElementById("btnThemePresetPurpose");
  if (btnThemePurpose) {
    btnThemePurpose.addEventListener("click", () => {
      const ltTopic = document.getElementById("cfgLtTopic");
      const enTopic = document.getElementById("cfgEnTopic");
      if (ltTopic) ltTopic.value = "Mano pašaukimas";
      if (enTopic) enTopic.value = "My Purpose";
      showToast("Nustatyta tema: „Mano pašaukimas“ / My Purpose");
    });
  }

  const btnThemeFate = document.getElementById("btnThemePresetFate");
  if (btnThemeFate) {
    btnThemeFate.addEventListener("click", () => {
      const ltTopic = document.getElementById("cfgLtTopic");
      const enTopic = document.getElementById("cfgEnTopic");
      if (ltTopic) ltTopic.value = "Mano pašaukimas";
      if (enTopic) enTopic.value = "My Fate";
      showToast("Nustatyta tema: „Mano pašaukimas“ / My Fate");
    });
  }

  const btnThemeBoth = document.getElementById("btnThemePresetBoth");
  if (btnThemeBoth) {
    btnThemeBoth.addEventListener("click", () => {
      const ltTopic = document.getElementById("cfgLtTopic");
      const enTopic = document.getElementById("cfgEnTopic");
      if (ltTopic) ltTopic.value = "Mano pašaukimas";
      if (enTopic) enTopic.value = "My Purpose (My Fate)";
      showToast("Nustatyta tema: „Mano pašaukimas“ / My Purpose (My Fate)");
    });
  }

  const btnDate2027 = document.getElementById("btnDatePreset2027");
  if (btnDate2027) {
    btnDate2027.addEventListener("click", () => {
      const ltOpening = document.getElementById("cfgLtOpening");
      const ltDeadline = document.getElementById("cfgLtDeadline");
      const ltEvent = document.getElementById("cfgLtEvent");
      const ltDates = document.getElementById("cfgLtDates");

      const enOpening = document.getElementById("cfgEnOpening");
      const enDeadline = document.getElementById("cfgEnDeadline");
      const enEvent = document.getElementById("cfgEnEvent");
      const enDates = document.getElementById("cfgEnDates");

      if (ltOpening) ltOpening.value = "Lapkričio 1 d.";
      if (ltDeadline) ltDeadline.value = "Kovo 26 d.";
      if (ltEvent) ltEvent.value = "2027 m. balandžio 23 d. (Kino festivalis ir tiesioginė transliacija)";
      if (ltDates) ltDates.value = "Nuo lapkričio 1 d. iki kovo 26 d.";

      if (enOpening) enOpening.value = "November 1st";
      if (enDeadline) enDeadline.value = "March 26th";
      if (enEvent) enEvent.value = "April 23rd, 2027 (Film Festival & Live Stream)";
      if (enDates) enDates.value = "November 1st – March 26th";

      showToast("Nustatytos oficialios festivalio datos: Lapkričio 1 d. &bull; Kovo 26 d. &bull; Balandžio 23 d.", "success");
    });
  }
}

async function updateGlobalTumbler(patchData, successMsg, toggleInput) {
  if (toggleInput) toggleInput.disabled = true;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    const payload = {
      ...patchData,
      adminEmail: callerEmail,
      updatedAt: new Date().toISOString()
    };

    // 1. Primary: Save to local server backend API (always reliable and instant)
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Nepavyko išsaugoti serverio nustatymo");
    }

    // 2. Secondary: Safely mirror to Firestore if db is available
    if (db && typeof db.collection === "function") {
      try {
        await db.collection("settings").doc("festival").set(payload, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore settings tumbler direct sync notice:", fsErr.message);
      }
    }

    showToast(successMsg, "success");
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
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
  const origText = btn.textContent;
  btn.textContent = "Siunčiama...";

  try {
    await sendAdminInviteLink(email);
    input.value = "";
    showToast(`Prieigos nuoroda su žetonu sėkmingai išsiųsta į ${email}!`, "success");
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
}

function applySettingsToForm(d) {
  if (!d) d = DEFAULT_CONTENT;
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

  const mAlert = document.getElementById("maintenanceActiveAlert");
  if (mAlert) {
    if (isMaintenance) {
      mAlert.classList.remove("d-none");
    } else {
      mAlert.classList.add("d-none");
    }
  }

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
  const showAboutElem = document.getElementById("cfgShowAbout");
  if (showAboutElem) showAboutElem.checked = d.showAbout !== false;
  const showTermsElem = document.getElementById("cfgShowTerms");
  if (showTermsElem) showTermsElem.checked = d.showTerms !== false;
  const showFaqElem = document.getElementById("cfgShowFaq");
  if (showFaqElem) showFaqElem.checked = d.showFaq !== false;
  const showCatElem = document.getElementById("cfgShowCategories");
  if (showCatElem) showCatElem.checked = d.showCategories !== false;
  const showEdElem = document.getElementById("cfgShowEditions");
  if (showEdElem) showEdElem.checked = d.showEditions !== false;
  const showArchElem = document.getElementById("cfgShowArchive");
  if (showArchElem) showArchElem.checked = d.showArchive !== false;
  const showCurrElem = document.getElementById("cfgShowCurrentEdition");
  if (showCurrElem) showCurrElem.checked = d.showCurrentEdition !== false;
  const showResElem = document.getElementById("cfgShowResults");
  if (showResElem) showResElem.checked = d.showResults === true;
  const showVoteElem = document.getElementById("cfgShowVoting");
  if (showVoteElem) showVoteElem.checked = d.showVoting === true;
  const showScreenElem = document.getElementById("cfgShowScreening");
  if (showScreenElem) showScreenElem.checked = d.showScreening !== false;
  const showSubElem = document.getElementById("cfgShowSubmit");
  if (showSubElem) showSubElem.checked = d.showSubmit !== false;

  const recUrlElem = document.getElementById("cfgRecordingUrl");
  if (recUrlElem) recUrlElem.value = d.recordingVideoUrl || "";

  const ltTopicElem = document.getElementById("cfgLtTopic");
  if (ltTopicElem) ltTopicElem.value = lt.topic || "Mano pašaukimas";
  const ltOpeningElem = document.getElementById("cfgLtOpening");
  if (ltOpeningElem) ltOpeningElem.value = lt.openingDate || "Lapkričio 1 d.";
  const ltDeadlineElem = document.getElementById("cfgLtDeadline");
  if (ltDeadlineElem) ltDeadlineElem.value = lt.deadlineDate || "Kovo 26 d.";
  const ltEventElem = document.getElementById("cfgLtEvent");
  if (ltEventElem) ltEventElem.value = lt.dateEvent || lt.eventDate || "2027 m. balandžio 23 d. (Kino festivalis ir tiesioginė transliacija)";
  const ltDatesElem = document.getElementById("cfgLtDates");
  if (ltDatesElem) ltDatesElem.value = lt.datesSubmissions || "Nuo lapkričio 1 d. iki kovo 26 d.";
  const ltAboutElem = document.getElementById("cfgLtAbout");
  if (ltAboutElem) ltAboutElem.value = lt.aboutText || "";
  const ltHeroBadgeElem = document.getElementById("cfgLtHeroBadge");
  if (ltHeroBadgeElem) ltHeroBadgeElem.value = lt.heroBadge || "7-asis Tarptautinis Mokinių Filmų Festivalis";
  const ltTargetElem = document.getElementById("cfgLtTarget");
  if (ltTargetElem) ltTargetElem.value = lt.targetAudience || "Mokiniai (10–18 m.)";
  const ltRecPhElem = document.getElementById("cfgLtRecordingPh");
  if (ltRecPhElem) ltRecPhElem.value = lt.recordingPlaceholder || "Festivalio ir tiesioginės transliacijos vaizdo įrašas bus pasiekiamas 2027 m. balandžio 23 d.";

  const enTopicElem = document.getElementById("cfgEnTopic");
  if (enTopicElem) enTopicElem.value = en.topic || "My Purpose (My Fate)";
  const enOpeningElem = document.getElementById("cfgEnOpening");
  if (enOpeningElem) enOpeningElem.value = en.openingDate || "November 1st";
  const enDeadlineElem = document.getElementById("cfgEnDeadline");
  if (enDeadlineElem) enDeadlineElem.value = en.deadlineDate || "March 26th";
  const enEventElem = document.getElementById("cfgEnEvent");
  if (enEventElem) enEventElem.value = en.dateEvent || en.eventDate || "April 23rd, 2027 (Film Festival & Live Stream)";
  const enDatesElem = document.getElementById("cfgEnDates");
  if (enDatesElem) enDatesElem.value = en.datesSubmissions || "November 1st – March 26th";
  const enAboutElem = document.getElementById("cfgEnAbout");
  if (enAboutElem) enAboutElem.value = en.aboutText || "";
  const enHeroBadgeElem = document.getElementById("cfgEnHeroBadge");
  if (enHeroBadgeElem) enHeroBadgeElem.value = en.heroBadge || "The 7th International Students Film Festival";
  const enTargetElem = document.getElementById("cfgEnTarget");
  if (enTargetElem) enTargetElem.value = en.targetAudience || "Students (10–18 yrs)";
  const enRecPhElem = document.getElementById("cfgEnRecordingPh");
  if (enRecPhElem) enRecPhElem.value = en.recordingPlaceholder || "The official festival recording and live stream replay will be published here on April 23rd, 2027.";

  syncArchiveState(d);
}

export async function loadSettingsFromApi() {
  try {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        applySettingsToForm(data.settings);
      }
    }
  } catch (err) {
    console.warn("Could not load settings from backend API:", err);
  }
}

export function subscribeSettings() {
  if (unsubscribeSettings) {
    unsubscribeSettings();
  }

  // Always load from server backend first so form is immediately filled
  loadSettingsFromApi();

  if (db && typeof db.collection === "function") {
    try {
      unsubscribeSettings = db.collection("settings").doc("festival")
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data && Object.keys(data).length > 0) {
              applySettingsToForm(data);
            }
          }
        }, (err) => {
          console.warn("Firestore settings stream notice:", err.message);
        });
    } catch (e) {
      console.warn("Firestore subscribeSettings notice:", e);
    }
  }
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

  const ltOpening = (document.getElementById("cfgLtOpening")?.value || "").trim() || "Lapkričio 1 d.";
  const ltDeadline = (document.getElementById("cfgLtDeadline")?.value || "").trim() || "Kovo 26 d.";
  const ltEvent = (document.getElementById("cfgLtEvent")?.value || "").trim() || "2027 m. balandžio 23 d. (Kino festivalis ir tiesioginė transliacija)";
  const ltDates = (document.getElementById("cfgLtDates")?.value || "").trim() || "Nuo lapkričio 1 d. iki kovo 26 d.";

  const enOpening = (document.getElementById("cfgEnOpening")?.value || "").trim() || "November 1st";
  const enDeadline = (document.getElementById("cfgEnDeadline")?.value || "").trim() || "March 26th";
  const enEvent = (document.getElementById("cfgEnEvent")?.value || "").trim() || "April 23rd, 2027 (Film Festival & Live Stream)";
  const enDates = (document.getElementById("cfgEnDates")?.value || "").trim() || "November 1st – March 26th";

  const updated = {
    selectedYear: "2027",
    maintenanceMode: maintenanceChecked,
    votingActive: votingChecked,
    archiveVisibility: archiveChecked,
    showAbout: document.getElementById("cfgShowAbout") ? document.getElementById("cfgShowAbout").checked : true,
    showTerms: document.getElementById("cfgShowTerms") ? document.getElementById("cfgShowTerms").checked : true,
    showFaq: document.getElementById("cfgShowFaq") ? document.getElementById("cfgShowFaq").checked : true,
    showCategories: document.getElementById("cfgShowCategories") ? document.getElementById("cfgShowCategories").checked : true,
    showEditions: document.getElementById("cfgShowEditions") ? document.getElementById("cfgShowEditions").checked : true,
    showArchive: archiveChecked,
    showCurrentEdition: document.getElementById("cfgShowCurrentEdition") ? document.getElementById("cfgShowCurrentEdition").checked : true,
    showResults: document.getElementById("cfgShowResults") ? document.getElementById("cfgShowResults").checked : false,
    showVoting: votingChecked,
    showScreening: document.getElementById("cfgShowScreening") ? document.getElementById("cfgShowScreening").checked : true,
    showSubmit: document.getElementById("cfgShowSubmit") ? document.getElementById("cfgShowSubmit").checked : true,
    recordingVideoUrl: document.getElementById("cfgRecordingUrl") ? document.getElementById("cfgRecordingUrl").value.trim() : "",
    lt: {
      topic: (document.getElementById("cfgLtTopic")?.value || "").trim() || "Mano pašaukimas",
      openingDate: ltOpening,
      deadlineDate: ltDeadline,
      eventDate: ltEvent,
      datesSubmissions: ltDates,
      dateEvent: ltEvent,
      aboutText: (document.getElementById("cfgLtAbout")?.value || "").trim(),
      heroBadge: (document.getElementById("cfgLtHeroBadge")?.value || "").trim() || "7-asis Tarptautinis Mokinių Filmų Festivalis",
      targetAudience: (document.getElementById("cfgLtTarget")?.value || "").trim() || "Mokiniai (10–18 m.)",
      recordingPlaceholder: (document.getElementById("cfgLtRecordingPh")?.value || "").trim() || "Festivalio ir tiesioginės transliacijos vaizdo įrašas bus pasiekiamas 2027 m. balandžio 23 d."
    },
    en: {
      topic: (document.getElementById("cfgEnTopic")?.value || "").trim() || "My Purpose (My Fate)",
      openingDate: enOpening,
      deadlineDate: enDeadline,
      eventDate: enEvent,
      datesSubmissions: enDates,
      dateEvent: enEvent,
      aboutText: (document.getElementById("cfgEnAbout")?.value || "").trim(),
      heroBadge: (document.getElementById("cfgEnHeroBadge")?.value || "").trim() || "The 7th International Students Film Festival",
      targetAudience: (document.getElementById("cfgEnTarget")?.value || "").trim() || "Students (10–18 yrs)",
      recordingPlaceholder: (document.getElementById("cfgEnRecordingPh")?.value || "").trim() || "The official festival recording and live stream replay will be published here on April 23rd, 2027."
    }
  };

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";

    // 1. Primary: Save to local server backend API (always works reliably)
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updated,
        adminEmail: callerEmail
      })
    });

    // 2. Secondary: Also sync to Firestore if db is available
    if (db && typeof db.collection === "function") {
      try {
        await db.collection("settings").doc("festival").set(updated, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore settings direct sync notice:", fsErr.message);
      }
    }

    if (res.ok) {
      showToast("Nustatymai sėkmingai išsaugoti!", "success");
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || "Nepavyko išsaugoti nustatymų", "error");
    }
  } catch (err) {
    showToast("Klaida išsaugant nustatymus: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}