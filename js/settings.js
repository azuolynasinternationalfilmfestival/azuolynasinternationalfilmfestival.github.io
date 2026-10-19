import { db, auth, DEFAULT_CONTENT, PRIMARY_SUPERADMIN_EMAIL, AUTHORIZED_ADMIN_EMAILS } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { syncArchiveState } from "./archive.js";
import { sendAdminInviteLink } from "./auth.js";

let unsubscribeSettings = null;
let unsubscribeMail = null;

export function initSettings() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveSettings);
  }

  const sendInviteBtn = document.getElementById("sendInviteBtn");
  if (sendInviteBtn) {
    sendInviteBtn.addEventListener("click", handleSendAdminInvite);
  }

  // Bind email sender and SMTP testing controls
  bindEmailSenderControls();

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
      const ltTopicDesc = document.getElementById("cfgLtTopicDesc");
      const enTopicDesc = document.getElementById("cfgEnTopicDesc");

      if (ltTopic) ltTopic.value = "Mano pašaukimas";
      if (enTopic) enTopic.value = "My Purpose";
      if (ltTopicDesc) ltTopicDesc.value = "Ką norite veikti savo gyvenime ir kaip atrasti tikrąjį pašaukimą? Ieškome istorijų apie savo kelio paieškas, karjeros pasirinkimus ir vidinių abejonių įveikimą. Papasakokite, ko reikia, kad sektumėte savo aistra, kai aplinkiniai tikisi kažko kito – ar tai būtų šeimos spaudimas rinktis „rimtą“ profesiją, pavyzdžiui, mediciną ar teisę, ar jūsų pačių baimė žengti į meną, muziką ar kūrybines sritis. Parodykite šios kelionės tikrovę, kliūtis pakeliui ir tą akimirką, kai jūs ar jūsų herojai suprato, ką iš tiesų lemta daryti.";
      if (enTopicDesc) enTopicDesc.value = "What do you want to do with your life, and how do you find your true calling? We are looking for stories about discovering your path, making career choices, and overcoming self-doubt. Tell us what it takes to follow your passion when the people around you expect something different—whether it is family pressure to pursue a \"serious\" career like medicine or law, or your own fear of stepping into the arts, music, or creative fields. Show the reality of this journey, the obstacles along the way, and the exact moment you or your characters realized what you were meant to do.";

      showToast("Nustatyta tema: „Mano pašaukimas“ / My Purpose");
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

  const isSuperAdmin = user && user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase());
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
  const ltTopicDescElem = document.getElementById("cfgLtTopicDesc");
  if (ltTopicDescElem) ltTopicDescElem.value = lt.topicDesc || "Ką norite veikti savo gyvenime ir kaip atrasti tikrąjį pašaukimą? Ieškome istorijų apie savo kelio paieškas, karjeros pasirinkimus ir vidinių abejonių įveikimą. Papasakokite, ko reikia, kad sektumėte savo aistra, kai aplinkiniai tikisi kažko kito – ar tai būtų šeimos spaudimas rinktis „rimtą“ profesiją, pavyzdžiui, mediciną ar teisę, ar jūsų pačių baimė žengti į meną, muziką ar kūrybines sritis. Parodykite šios kelionės tikrovę, kliūtis pakeliui ir tą akimirką, kai jūs ar jūsų herojai suprato, ką iš tiesų lemta daryti.";
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
  if (enTopicElem) enTopicElem.value = en.topic || "My Purpose";
  const enTopicDescElem = document.getElementById("cfgEnTopicDesc");
  if (enTopicDescElem) enTopicDescElem.value = en.topicDesc || "What do you want to do with your life, and how do you find your true calling? We are looking for stories about discovering your path, making career choices, and overcoming self-doubt. Tell us what it takes to follow your passion when the people around you expect something different—whether it is family pressure to pursue a \"serious\" career like medicine or law, or your own fear of stepping into the arts, music, or creative fields. Show the reality of this journey, the obstacles along the way, and the exact moment you or your characters realized what you were meant to do.";
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

  if (d.smtp && typeof d.smtp === "object") {
    if (document.getElementById("cfgSmtpHost")) document.getElementById("cfgSmtpHost").value = d.smtp.host || "smtp.gmail.com";
    if (document.getElementById("cfgSmtpPort")) document.getElementById("cfgSmtpPort").value = d.smtp.port || "587";
    if (document.getElementById("cfgSmtpUser")) document.getElementById("cfgSmtpUser").value = d.smtp.user || "azuolynasfilmfestival@gmail.com";
    if (document.getElementById("cfgEmailFrom")) document.getElementById("cfgEmailFrom").value = d.smtp.from || '"Ąžuolynas Film Fest" <azuolynasfilmfestival@gmail.com>';
  }

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
  refreshEmailStatusDisplay();
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
  if (unsubscribeMail) {
    unsubscribeMail();
    unsubscribeMail = null;
  }
  document.getElementById("emailDeliveryLog")?.replaceChildren();
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
  const ltTopicDesc = (document.getElementById("cfgLtTopicDesc")?.value || "").trim() || "Ką norite veikti savo gyvenime ir kaip atrasti tikrąjį pašaukimą? Ieškome istorijų apie savo kelio paieškas, karjeros pasirinkimus ir vidinių abejonių įveikimą. Papasakokite, ko reikia, kad sektumėte savo aistra, kai aplinkiniai tikisi kažko kito – ar tai būtų šeimos spaudimas rinktis „rimtą“ profesiją, pavyzdžiui, mediciną ar teisę, ar jūsų pačių baimė žengti į meną, muziką ar kūrybines sritis. Parodykite šios kelionės tikrovę, kliūtis pakeliui ir tą akimirką, kai jūs ar jūsų herojai suprato, ką iš tiesų lemta daryti.";

  const enOpening = (document.getElementById("cfgEnOpening")?.value || "").trim() || "November 1st";
  const enDeadline = (document.getElementById("cfgEnDeadline")?.value || "").trim() || "March 26th";
  const enEvent = (document.getElementById("cfgEnEvent")?.value || "").trim() || "April 23rd, 2027 (Film Festival & Live Stream)";
  const enDates = (document.getElementById("cfgEnDates")?.value || "").trim() || "November 1st – March 26th";
  const enTopicDesc = (document.getElementById("cfgEnTopicDesc")?.value || "").trim() || "What do you want to do with your life, and how do you find your true calling? We are looking for stories about discovering your path, making career choices, and overcoming self-doubt. Tell us what it takes to follow your passion when the people around you expect something different—whether it is family pressure to pursue a \"serious\" career like medicine or law, or your own fear of stepping into the arts, music, or creative fields. Show the reality of this journey, the obstacles along the way, and the exact moment you or your characters realized what you were meant to do.";

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
      topicDesc: ltTopicDesc,
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
      topic: (document.getElementById("cfgEnTopic")?.value || "").trim() || "My Purpose",
      topicDesc: enTopicDesc,
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
        await db.collection("settings").doc("festival").set({
          ...updated,
          adminEmail: callerEmail
        }, { merge: true });
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

// ---------------------------------------------------------------------------
// EMAIL SENDER & SMTP SERVICE CLIENT CONTROLS
// ---------------------------------------------------------------------------

export function bindEmailSenderControls() {
  const btnRefresh = document.getElementById("btnRefreshEmailStatus");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", refreshEmailStatusDisplay);
  }

  const btnSendTest = document.getElementById("btnSendTestEmail");
  if (btnSendTest) {
    btnSendTest.addEventListener("click", handleSendTestEmail);
  }

  const btnSendDirect = document.getElementById("btnSendDirectEmail");
  if (btnSendDirect) {
    btnSendDirect.addEventListener("click", handleSendDirectEmail);
  }

  const btnSaveSmtp = document.getElementById("btnSaveSmtpConfig");
  if (btnSaveSmtp) {
    btnSaveSmtp.addEventListener("click", handleSaveSmtpConfig);
  }

  const tplSelect = document.getElementById("directEmailTemplate");
  if (tplSelect) {
    tplSelect.addEventListener("change", (e) => {
      const isCustom = e.target.value === "custom";
      const subjInput = document.getElementById("directEmailSubject");
      if (subjInput && !isCustom) {
        subjInput.placeholder = "Šablono tema paruošta automatiškai";
      } else if (subjInput) {
        subjInput.placeholder = "Ąžuolynas Film Fest | Pranešimas";
      }
    });
  }

  // Load initial email status
  refreshEmailStatusDisplay();
}

async function refreshEmailStatusDisplay() {
  const badge = document.getElementById("smtpStatusBadge");
  const note = document.getElementById("emailTransportNote");
  try {
    const hasServer = await window.FestivalApi.hasServer();
    const drawer = document.getElementById("smtpConfigDrawer");
    if (drawer) drawer.hidden = !hasServer;
    if (note) note.textContent = hasServer
      ? "Laiškus siunčia serveris. Nepavykus SMTP, naudojama Firestore eilė."
      : "Laiškus siunčia Firestore plėtinys. SMTP nustatymus keiskite Firebase plėtinio konfigūracijoje.";
    if (!hasServer) {
      if (badge) badge.textContent = "Firestore laiškų eilė";
    } else {
      const data = await window.FestivalApi.json("/api/admin/email-status");
      if (badge) badge.textContent = data.smtpConfigured ? `SMTP nustatytas (${data.smtpUser})` : "Firestore laiškų eilė";
      for (const [id, value] of Object.entries({cfgSmtpHost: data.smtpHost, cfgSmtpPort: data.smtpPort,
        cfgSmtpUser: data.smtpUser, cfgEmailFrom: data.emailFrom})) {
        const input = document.getElementById(id);
        if (input && !input.value && value) input.value = value;
      }
    }
    if (db && auth?.currentUser && !unsubscribeMail) {
      unsubscribeMail = db.collection("mail").orderBy("createdAt", "desc").limit(10).onSnapshot(snapshot => {
        const log = document.getElementById("emailDeliveryLog");
        if (!log) return;
        log.replaceChildren();
        for (const doc of snapshot.docs) {
          const mail = doc.data();
          const state = mail.delivery?.state;
          const status = state === 'SUCCESS' ? 'Pristatyta pašto serveriui' : state === 'ERROR' ? 'Siuntimo klaida'
            : ['PROCESSING', 'RETRY'].includes(state) ? 'Siunčiama' : 'Eilėje';
          const row = document.createElement('p');
          row.textContent = `${Array.isArray(mail.to) ? mail.to.join(', ') : mail.to} — ${mail.message?.subject || ''} — ${status}${mail.delivery?.error ? ': ' + mail.delivery.error : ''}`;
          log.appendChild(row);
        }
        if (!snapshot.docs.length) log.textContent = "Laiškų eilė tuščia. Galite išsiųsti bandomąjį laišką.";
      }, error => {
        const log = document.getElementById("emailDeliveryLog");
        if (log) log.textContent = "Nepavyko perskaityti laiškų būsenų: " + error.message;
      });
    }
  } catch (err) {
    if (badge) badge.textContent = "Būsena nepasiekiama";
    if (note) note.textContent = err.message;
  }
}

async function handleSendTestEmail() {
  const input = document.getElementById("testEmailRecipient");
  const btn = document.getElementById("btnSendTestEmail");
  const targetEmail = (input ? input.value : "").trim();
  if (!targetEmail || !targetEmail.includes("@")) {
    showToast("Nurodykite teisingą gavėjo el. pašto adresą!", "error");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Siunčiama...";
  }

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || PRIMARY_SUPERADMIN_EMAIL;
    let data;
    if (await window.FestivalApi.hasServer()) {
      data = await window.FestivalApi.json("/api/admin/email/test", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: targetEmail, adminEmail: callerEmail })
      });
    } else {
      data = await window.MailClient.send(db, { to: targetEmail, subject: "Ąžuolynas Film Fest — bandomasis laiškas",
        html: window.generateEmailHtml('submissionReceived', 'lt', { name: 'Bandomasis gavėjas', filmTitle: 'Bandomasis laiškas' }) });
    }
    if (data.success) {
      showToast(data.message || `Bandomasis laiškas sėkmingai išsiųstas į ${targetEmail}!`, "success");
      refreshEmailStatusDisplay();
    } else {
      showToast(data.error || "Nepavyko išsiųsti bandomojo laiško.", "error");
    }
  } catch (err) {
    showToast("Ryšio klaida siunčiant laišką: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        <span>Siųsti Bandomąjį Laišką</span>
      `;
    }
  }
}

async function handleSendDirectEmail() {
  const recipientInput = document.getElementById("directEmailRecipient");
  const tplSelect = document.getElementById("directEmailTemplate");
  const langSelect = document.getElementById("directEmailLang");
  const subjectInput = document.getElementById("directEmailSubject");
  const bodyInput = document.getElementById("directEmailBody");
  const btn = document.getElementById("btnSendDirectEmail");

  const to = (recipientInput ? recipientInput.value : "").trim();
  const template = tplSelect ? tplSelect.value : "custom";
  const lang = langSelect ? langSelect.value : "lt";
  let subject = (subjectInput ? subjectInput.value : "").trim();
  const body = (bodyInput ? bodyInput.value : "").trim();

  if (!to || !to.includes("@")) {
    showToast("Nurodykite galiojantį gavėjo el. pašto adresą!", "error");
    return;
  }

  if (template === "custom" && !subject) {
    subject = lang === "en" ? "Ąžuolynas Film Fest Notification" : "Ąžuolynas Film Fest Pranešimas";
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Siunčiama...";
  }

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || PRIMARY_SUPERADMIN_EMAIL;
    const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const templateData = { name: to.split("@")[0], customMessage: body };
    const data = await window.MailClient.send(db, {
      to,
      subject: subject || window.getEmailSubject(template, lang, templateData),
      html: template === 'custom' ? `<div style="font-family:sans-serif;padding:24px;"><p>${escape(body).replace(/\n/g, '<br>')}</p></div>`
        : window.generateEmailHtml(template, lang, templateData),
      text: body || subject
    });
    if (data.success) {
      showToast(data.message || `El. laiškas sėkmingai išsiųstas į ${to}!`, "success");
      if (recipientInput) recipientInput.value = "";
      if (bodyInput) bodyInput.value = "";
    } else {
      showToast(data.error || "Nepavyko išsiųsti laiško", "error");
    }
  } catch (err) {
    showToast("Ryšio klaida siunčiant laišką: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        <span>Išsiųsti El. Laišką</span>
      `;
    }
  }
}

async function handleSaveSmtpConfig() {
  const host = (document.getElementById("cfgSmtpHost")?.value || "").trim();
  const port = parseInt(document.getElementById("cfgSmtpPort")?.value || "587", 10);
  const user = (document.getElementById("cfgSmtpUser")?.value || "").trim();
  const pass = (document.getElementById("cfgSmtpPass")?.value || "").trim();
  const from = (document.getElementById("cfgEmailFrom")?.value || "").trim();

  const btn = document.getElementById("btnSaveSmtpConfig");
  if (btn) btn.disabled = true;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || PRIMARY_SUPERADMIN_EMAIL;
    const data = await window.FestivalApi.json("/api/admin/email/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host,
        port,
        user,
        pass,
        from,
        adminEmail: callerEmail
      })
    });
    if (data.success) {
      showToast("SMTP nustatymai sėkmingai išsaugoti!", "success");
      refreshEmailStatusDisplay();
    } else {
      showToast(data.error || "Nepavyko išsaugoti SMTP nustatymų", "error");
    }
  } catch (err) {
    showToast("Ryšio klaida saugant SMTP: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}
