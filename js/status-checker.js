/**
 * Ąžuolynas International Students Film Festival
 * Participant Film Submission Status Checker Component
 */

(function () {
  const i18n = {
    lt: {
      searchPlaceholder: "Įveskite savo el. pašto adresą...",
      checkBtn: "Tikrinti Būseną",
      checkingBtn: "Tikrinama...",
      emptyEmail: "Prašome įvesti el. pašto adresą.",
      invalidEmail: "Įveskite teisingą el. pašto formatą (pvz., vardas@pavyzdys.lt).",
      notFoundTitle: "Paraiškų nerasta",
      notFoundDesc: "Pagal nurodytą el. paštą <strong>{email}</strong> paraiškų sistemoje nerasta. Patikrinkite, ar neįsivėlė klaida, arba pateikite filmą dabar.",
      submitNewBtn: "Pateikti paraišką dabar",
      errorTitle: "Nepavyko patikrinti būsenos",
      errorDesc: "Įvyko ryšio klaida. Prašome patikrinti interneto ryšį ir pabandyti dar kartą.",
      retryBtn: "Bandyti vėl",
      foundCount: "Rasta paraiškų: {count}",
      steps: {
        received: "1. Pateikta",
        review: "2. Patvirtinta",
        shortlist: "3. Trumpasis sąrašas",
        final: "4. Finalas"
      },
      statuses: {
        submitted: {
          badge: "Laukiama atrankos",
          title: "Paraiška gauta ir laukia peržiūros",
          text: "Jūsų filmas sėkmingai gautas ir įtrauktas į festivalio atrankos eilę. Mūsų komanda netrukus patikrins techninius reikalavimus (telefonu/planšete filmuotas formatas, trukmė iki 180 s).",
          cls: "stage-pending",
          step: 1
        },
        accepted: {
          badge: "Patvirtinta (Priimta į festivalį)",
          title: "Filmas patvirtintas ir priimtas",
          text: "Sveikiname! Jūsų filmas atitinka visus techninius ir festivalio reikalavimus bei yra perduotas vertinimo komisijai ir žiuri peržiūrai.",
          cls: "stage-approved",
          step: 2
        },
        semifinal: {
          badge: "Pusfinalis (Trumpasis sąrašas)",
          title: "Patekote į trumpąjį sąrašą!",
          text: "Puikios žinios! Žiuri atrinko jūsų filmą tarp stipriausių festivalio kūrinių (trumpajame sąraše). Filmas varžosi dėl patekimo į didįjį finalą.",
          cls: "stage-shortlisted",
          step: 3
        },
        final: {
          badge: "Didysis Finalas",
          title: "Sveikiname – jūs finale!",
          text: "Jūsų kūrinys pateko į didįjį „Ąžuolynas Fest“ finalą ir bus demonstruojamas oficialioje festivalio atidarymo ceremonijoje bei peržiūros programoje!",
          cls: "stage-finalist",
          step: 4
        },
        winner: {
          badge: "Festivalio Laureatas",
          title: "Sveikiname pelnius festivalio apdovanojimą!",
          text: "Jūsų filmas iškovojo oficialų festivalio įvertinimą! Širdingai sveikiname jaunąjį kūrėją ir komandą.",
          cls: "stage-winner",
          step: 4
        },
        rejected: {
          badge: "Neatrinktas šiam leidimui",
          title: "Dėkojame už kūrybinį darbą",
          text: "Nuoširdžiai dėkojame už atsiųstą filmą. Konkursas buvo itin didelis, ir šį sezoną filmas į kitą etapą nepateko. Labai vertiname jūsų kūrybiškumą ir kviečiame nenuleisti rankų!",
          cls: "stage-rejected",
          step: 1
        }
      },
      votingCallout: "Šis filmas šiuo metu varžosi viešame žiūrovų balsavime!",
      voteBtn: "Balsuoti už filmą",
      categoryLabel: "Kategorija:",
      filmmakerLabel: "Kūrėjas:",
      submittedOnLabel: "Pateikta:"
    },
    en: {
      searchPlaceholder: "Enter your email address...",
      checkBtn: "Check Status",
      checkingBtn: "Checking...",
      emptyEmail: "Please enter your email address.",
      invalidEmail: "Please enter a valid email address (e.g. name@example.com).",
      notFoundTitle: "No Submissions Found",
      notFoundDesc: "No entries were found for <strong>{email}</strong>. Please check for typos or submit your film now.",
      submitNewBtn: "Submit Film Now",
      errorTitle: "Unable to Check Status",
      errorDesc: "A network issue occurred. Please check your internet connection and try again.",
      retryBtn: "Retry",
      foundCount: "Submissions found: {count}",
      steps: {
        received: "1. Received",
        review: "2. Approved",
        shortlist: "3. Shortlisted",
        final: "4. Finals"
      },
      statuses: {
        submitted: {
          badge: "Pending Review",
          title: "Submission Received & Pending Review",
          text: "Your film has been securely received and queued for review. Our curation team will verify technical compliance (smartphone/tablet filming, duration up to 180 s).",
          cls: "stage-pending",
          step: 1
        },
        accepted: {
          badge: "Approved (Accepted)",
          title: "Film Approved & Accepted",
          text: "Congratulations! Your film meets all regulations and has successfully advanced to the jury evaluation panel.",
          cls: "stage-approved",
          step: 2
        },
        semifinal: {
          badge: "Shortlisted (Semifinalist)",
          title: "Shortlisted for Festival Honors!",
          text: "Great news! The jury has selected your film for the official festival shortlist among top international entries.",
          cls: "stage-shortlisted",
          step: 3
        },
        final: {
          badge: "Official Finalist",
          title: "Congratulations – You are a Finalist!",
          text: "Your entry has reached the festival grand finals and will be showcased during the official festival ceremony program!",
          cls: "stage-finalist",
          step: 4
        },
        winner: {
          badge: "Festival Laureate / Winner",
          title: "Congratulations on Winning an Award!",
          text: "Your film has won an official festival award! We warmly congratulate the student filmmaker and team.",
          cls: "stage-winner",
          step: 4
        },
        rejected: {
          badge: "Not Selected This Season",
          title: "Thank You for Participating",
          text: "Thank you sincerely for submitting your work. While not advancing this season due to competitive capacity, we were inspired by your creative effort and urge you to keep filming!",
          cls: "stage-rejected",
          step: 1
        }
      },
      votingCallout: "This film is currently competing in the public audience voting!",
      voteBtn: "Vote for Film",
      categoryLabel: "Category:",
      filmmakerLabel: "Filmmaker:",
      submittedOnLabel: "Submitted:"
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(timestamp, lang) {
    if (!timestamp) return "";
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (typeof timestamp === "string" || typeof timestamp === "number") {
        date = new Date(timestamp);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      }
      if (date && !isNaN(date.getTime())) {
        return date.toLocaleDateString(lang === "lt" ? "lt-LT" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
    } catch (e) {
      console.warn("Date parse error:", e);
    }
    return "";
  }

  function initStatusChecker() {
    const isEn = document.documentElement.lang === "en" || window.location.pathname.includes("/en/");
    const lang = isEn ? "en" : "lt";
    const t = i18n[lang];

    const tabSubmit = document.getElementById("tabModeSubmit");
    const tabStatus = document.getElementById("tabModeStatus");
    const viewSubmit = document.getElementById("viewSubmitForm");
    const viewStatus = document.getElementById("viewStatusChecker");

    const emailInput = document.getElementById("statusCheckEmail");
    const checkBtn = document.getElementById("statusCheckBtn");
    const resultsArea = document.getElementById("statusResultsArea");

    if (!tabStatus || !viewStatus || !emailInput || !checkBtn) {
      return;
    }

    // Switch view function
    function switchMode(mode, prefillEmail = "") {
      if (mode === "status") {
        tabStatus.classList.add("active");
        tabStatus.setAttribute("aria-selected", "true");
        tabSubmit.classList.remove("active");
        tabSubmit.setAttribute("aria-selected", "false");

        viewStatus.classList.remove("d-none");
        viewSubmit.classList.add("d-none");

        if (prefillEmail) {
          emailInput.value = prefillEmail;
          executeCheck(prefillEmail);
        } else {
          setTimeout(() => emailInput.focus(), 80);
        }
      } else {
        tabSubmit.classList.add("active");
        tabSubmit.setAttribute("aria-selected", "true");
        tabStatus.classList.remove("active");
        tabStatus.setAttribute("aria-selected", "false");

        viewSubmit.classList.remove("d-none");
        viewStatus.classList.add("d-none");
      }
    }

    // Tab buttons
    tabSubmit.addEventListener("click", () => switchMode("submit"));
    tabStatus.addEventListener("click", () => switchMode("status"));

    // Check on submit or enter
    checkBtn.addEventListener("click", (e) => {
      e.preventDefault();
      executeCheck();
    });

    emailInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeCheck();
      }
    });

    // Check status logic
    async function executeCheck(forcedEmail) {
      const email = (forcedEmail || emailInput.value || "").trim().toLowerCase();

      if (!email) {
        showFeedback(t.emptyEmail, "warning");
        emailInput.focus();
        return;
      }

      if (!email.includes("@") || email.length < 5) {
        showFeedback(t.invalidEmail, "warning");
        emailInput.focus();
        return;
      }

      // UI Loading state
      checkBtn.disabled = true;
      checkBtn.innerHTML = `<span class="status-loading-spinner" style="width:16px;height:16px;border-width:2px;"></span> <span>${t.checkingBtn}</span>`;
      resultsArea.innerHTML = `
        <div class="status-loading-box">
          <div class="status-loading-spinner"></div>
          <span>${isEn ? "Retrieving submission records..." : "Tikrinamos paraiškos duomenų bazėje..."}</span>
        </div>
      `;

      try {
        let entries = [];

        // Primary: Query secure server API
        try {
          const apiResp = await fetch(`/api/submission-status?email=${encodeURIComponent(email)}`);
          if (apiResp.ok) {
            const json = await apiResp.json();
            if (json && json.entries) {
              entries = json.entries;
            }
          }
        } catch (apiErr) {
          console.warn("API status fetch fallback to client SDK:", apiErr);
        }

        // Secondary fallback: Client-side Firestore SDK
        if (entries.length === 0) {
          const firestore = (typeof window !== "undefined" && window.db) || 
                            (typeof db !== "undefined" ? db : null) || 
                            (typeof firebase !== "undefined" && typeof firebase.firestore === "function" ? firebase.firestore() : null);

          if (firestore && typeof firestore.collection === "function") {
            try {
              const snap = await firestore.collection("submissions").where("email", "==", email).get();
              if (!snap.empty) {
                snap.forEach((doc) => {
                  entries.push({ id: doc.id, ...doc.data() });
                });
              }
            } catch (fsErr) {
              console.warn("Client Firestore query note:", fsErr);
            }
          }
        }

        // Render results
        if (entries.length > 0) {
          renderEntries(entries, email);
        } else {
          renderNotFound(email);
        }
      } catch (err) {
        console.error("Status check failed:", err);
        renderError(email);
      } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = `<span>${t.checkBtn}</span>`;
      }
    }

    function renderEntries(entries, email) {
      let cardsHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="font-size:0.88rem; color:var(--accent-light); font-weight:600;">
            ${t.foundCount.replace("{count}", entries.length)} (${escapeHtml(email)})
          </div>
          <button type="button" class="btn-outline btn-xs" id="statusClearResultsBtn" style="padding:4px 10px; font-size:0.75rem;">
            ${isEn ? "Search Another Email" : "Ieškoti Kito El. Pašto"}
          </button>
        </div>
        <div class="status-results-box">
      `;

      entries.forEach((item) => {
        const rawStatus = (item.status || "submitted").toLowerCase();
        let statusKey = rawStatus;
        if (item.isWinner) statusKey = "winner";
        else if (rawStatus === "semifinal" || rawStatus === "shortlist") statusKey = "semifinal";
        else if (rawStatus === "final" || rawStatus === "finalist") statusKey = "final";
        else if (rawStatus === "accepted" || rawStatus === "approved") statusKey = "accepted";
        else if (rawStatus === "rejected") statusKey = "rejected";
        else statusKey = "submitted";

        const statusInfo = t.statuses[statusKey] || t.statuses.submitted;
        const currentStep = statusInfo.step || 1;
        const formattedDate = formatDate(item.submittedAt, lang);

        cardsHtml += `
          <article class="status-entry-card" aria-label="Filmo paraiškos būsena">
            <div class="status-entry-head">
              <div>
                <h3 class="status-entry-title">${escapeHtml(item.filmTitle || (isEn ? "Untitled Film" : "Bevardis filmas"))}</h3>
                <div class="status-entry-meta">
                  <span><strong>${t.filmmakerLabel}</strong> ${escapeHtml(item.name || "")}</span>
                  ${item.category ? `<span class="status-entry-meta-separator">·</span><span><strong>${t.categoryLabel}</strong> ${escapeHtml(item.category)}</span>` : ""}
                  ${item.institution ? `<span class="status-entry-meta-separator">·</span><span>${escapeHtml(item.institution)}</span>` : ""}
                  ${formattedDate ? `<span class="status-entry-meta-separator">·</span><span><strong>${t.submittedOnLabel}</strong> ${formattedDate}</span>` : ""}
                </div>
              </div>
            </div>

            <!-- Stage Progress Tracker -->
            <div class="status-stage-tracker" role="progressbar" aria-valuenow="${currentStep}" aria-valuemin="1" aria-valuemax="4">
              <div class="status-tracker-step ${currentStep >= 1 ? (currentStep === 1 ? "active" : "completed") : ""}">
                <div class="status-tracker-bar"></div>
                <span class="status-tracker-label">${t.steps.received}</span>
              </div>
              <div class="status-tracker-step ${currentStep >= 2 ? (currentStep === 2 ? "active" : "completed") : ""}">
                <div class="status-tracker-bar"></div>
                <span class="status-tracker-label">${t.steps.review}</span>
              </div>
              <div class="status-tracker-step ${currentStep >= 3 ? (currentStep === 3 ? "active" : "completed") : ""}">
                <div class="status-tracker-bar"></div>
                <span class="status-tracker-label">${t.steps.shortlist}</span>
              </div>
              <div class="status-tracker-step ${currentStep >= 4 ? "active completed" : ""}">
                <div class="status-tracker-bar"></div>
                <span class="status-tracker-label">${t.steps.final}</span>
              </div>
            </div>

            <!-- Detailed Explanation Banner -->
            <div class="status-explanation-banner ${statusInfo.cls}">
              <div class="status-explanation-title">
                <span>●</span>
                <span>${statusInfo.badge}</span>
                ${item.awardTitle ? `<span style="color:#ffd700;">— „${escapeHtml(item.awardTitle)}“</span>` : ""}
              </div>
              <p class="status-explanation-text">
                <strong>${statusInfo.title}.</strong> ${statusInfo.text}
              </p>
            </div>

            <!-- Live Audience Voting Callout (if inVoting is true) -->
            ${item.inVoting ? `
              <div class="status-voting-callout">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.1rem;">🗳️</span>
                  <span>${t.votingCallout}</span>
                </div>
                <a href="#competition" class="btn-solid btn-xs" style="background:#e06d6d; color:#fff; border-radius:4px; padding:6px 12px; text-decoration:none;">
                  ${t.voteBtn} &rarr;
                </a>
              </div>
            ` : ""}
          </article>
        `;
      });

      cardsHtml += `</div>`;
      resultsArea.innerHTML = cardsHtml;

      const clearBtn = document.getElementById("statusClearResultsBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          emailInput.value = "";
          resultsArea.innerHTML = "";
          emailInput.focus();
        });
      }
    }

    function renderNotFound(email) {
      resultsArea.innerHTML = `
        <div class="status-empty-box">
          <div class="status-empty-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <h4 class="status-empty-title">${t.notFoundTitle}</h4>
          <p class="status-empty-desc">${t.notFoundDesc.replace("{email}", escapeHtml(email))}</p>
          <button type="button" class="btn-solid btn-sm" id="notFoundSubmitBtn" style="margin-top:6px;">
            ${t.submitNewBtn}
          </button>
        </div>
      `;

      const notFoundBtn = document.getElementById("notFoundSubmitBtn");
      if (notFoundBtn) {
        notFoundBtn.addEventListener("click", () => {
          switchMode("submit");
        });
      }
    }

    function renderError(email) {
      resultsArea.innerHTML = `
        <div class="status-empty-box" style="border-color: rgba(224, 109, 109, 0.4);">
          <div class="status-empty-icon" style="color: #e06d6d; background: rgba(224, 109, 109, 0.1);">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h4 class="status-empty-title" style="color:#e06d6d;">${t.errorTitle}</h4>
          <p class="status-empty-desc">${t.errorDesc}</p>
          <button type="button" class="btn-outline btn-sm" id="statusRetryBtn">
            ${t.retryBtn}
          </button>
        </div>
      `;

      const retryBtn = document.getElementById("statusRetryBtn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          executeCheck(email);
        });
      }
    }

    function showFeedback(msg, type) {
      resultsArea.innerHTML = `
        <div style="padding:14px 18px; border-radius:var(--radius-sm); font-size:0.9rem; background:${type === 'warning' ? 'rgba(224, 152, 72, 0.15)' : 'rgba(224, 109, 109, 0.15)'}; border:1px solid ${type === 'warning' ? '#e09848' : '#e06d6d'}; color:${type === 'warning' ? '#f5c68f' : '#f5a4a4'};">
          ${escapeHtml(msg)}
        </div>
      `;
    }

    // Expose global API
    window.StatusChecker = {
      open: (email) => switchMode("status", email),
      close: () => switchMode("submit")
    };

    // Check if URL has #check-status or #status hash
    if (window.location.hash === "#check-status" || window.location.hash === "#status") {
      switchMode("status");
    }

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      if (window.location.hash === "#check-status" || window.location.hash === "#status") {
        switchMode("status");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStatusChecker);
  } else {
    initStatusChecker();
  }
})();
