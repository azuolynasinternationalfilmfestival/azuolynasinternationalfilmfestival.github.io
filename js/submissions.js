import { db, storage } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

let submissionsList = [];
let currentEntry = null;
let unsubscribeSubmissions = null;

export function getSubmissionsList() {
  return submissionsList || [];
}

export function getSubmissionYear(sub) {
  if (!sub) return "2026";
  if (sub.year) return String(sub.year).trim();
  if (sub.edition) return String(sub.edition).replace(/[^0-9]/g, "");
  if (sub.awardYear) return String(sub.awardYear).trim();
  if (sub.submittedAt) {
    if (sub.submittedAt.toDate) {
      return String(sub.submittedAt.toDate().getFullYear());
    }
    const d = new Date(sub.submittedAt);
    if (!isNaN(d.getFullYear())) return String(d.getFullYear());
  }
  return "2026";
}

const STATUS_DICTIONARY = {
  submitted: { label: "Pateikta", className: "status-submitted" },
  accepted: { label: "Priimta", className: "status-accepted" },
  semifinal: { label: "Pusfinalis", className: "status-semifinal" },
  final: { label: "Finalas", className: "status-final" },
  winner: { label: "Laureatas", className: "status-winner" },
  rejected: { label: "Atmesta", className: "status-rejected" }
};

export function initSubmissions() {
  const filterSearch = document.getElementById("filterSearch");
  const filterYear = document.getElementById("filterYear");
  const filterCategory = document.getElementById("filterCategory");
  const filterStatus = document.getElementById("filterStatus");
  const filterVoting = document.getElementById("filterVoting");

  if (filterSearch) filterSearch.addEventListener("input", renderTable);
  if (filterYear) {
    filterYear.addEventListener("change", () => {
      updateMetrics();
      updateWinnersSelector();
      renderTable();
      updateYearBadges();
    });
  }
  if (filterCategory) filterCategory.addEventListener("change", renderTable);
  if (filterStatus) filterStatus.addEventListener("change", renderTable);
  if (filterVoting) filterVoting.addEventListener("change", renderTable);

  initEntryModal();
  initWinnersManager();
  updateYearBadges();
}

function updateYearBadges() {
  const filterYear = document.getElementById("filterYear");
  const selYear = filterYear ? filterYear.value : "all";
  const badge = document.getElementById("winnerPanelYearBadge");
  const status = document.getElementById("dashboardSystemStatus");

  if (badge) {
    badge.textContent = selYear === "all" ? "Visi metai" : `FEST ${selYear}`;
  }
  if (status) {
    status.innerHTML = selYear === "all"
      ? `Sistema paruošta`
      : `${selYear} m. leidimas`;
  }
}

export async function loadSubmissionsFromApi() {
  try {
    const res = await fetch("/api/admin/submissions");
    if (res.ok) {
      const data = await res.json();
      submissionsList = data.submissions || [];
      updateMetrics();
      updateWinnersSelector();
      renderTable();
      updateYearBadges();
    }
  } catch (err) {
    console.warn("Could not load submissions from API:", err);
  }
}

export function subscribeSubmissions() {
  if (unsubscribeSubmissions) {
    unsubscribeSubmissions();
    unsubscribeSubmissions = null;
  }

  // Always load from local server API first so table is populated immediately
  loadSubmissionsFromApi();

  if (db && typeof db.collection === "function") {
    try {
      unsubscribeSubmissions = db.collection("submissions")
        .orderBy("submittedAt", "desc")
        .onSnapshot((snap) => {
          submissionsList = [];
          snap.forEach((doc) => {
            submissionsList.push({ id: doc.id, ...doc.data() });
          });
          updateMetrics();
          updateWinnersSelector();
          renderTable();
          updateYearBadges();
        }, (err) => {
          console.warn("Firestore submissions listener notice:", err.message);
          loadSubmissionsFromApi();
        });
    } catch (fsErr) {
      console.warn("Firestore subscribe error:", fsErr);
      loadSubmissionsFromApi();
    }
  }
}

export function unsubscribeSubmissionsListener() {
  if (unsubscribeSubmissions) {
    unsubscribeSubmissions();
    unsubscribeSubmissions = null;
  }
}

async function updateMetrics() {
  const filterYear = document.getElementById("filterYear");
  const selYear = filterYear ? filterYear.value : "2026";

  const list = (selYear === "all")
    ? submissionsList
    : submissionsList.filter(s => getSubmissionYear(s) === selYear);

  const totalElem = document.getElementById("statTotal");
  const acceptedElem = document.getElementById("statAccepted");
  const votingElem = document.getElementById("statVoting");
  const finalsElem = document.getElementById("statFinals");
  const inPersonElem = document.getElementById("statInPerson");
  const remoteElem = document.getElementById("statRemote");
  const liveViewersElem = document.getElementById("statLiveViewers");
  const badgeYear = document.getElementById("badgeYearSubmissions");

  if (badgeYear) badgeYear.textContent = selYear === "all" ? "Visi metai" : `${selYear} m.`;
  if (totalElem) totalElem.textContent = list.length;
  if (acceptedElem) acceptedElem.textContent = list.filter(s => s.status === "accepted").length;
  if (votingElem) votingElem.textContent = list.filter(s => s.inVoting === true).length;
  if (finalsElem) finalsElem.textContent = list.filter(s => ["semifinal", "final", "winner"].includes(s.status)).length;
  if (inPersonElem) inPersonElem.textContent = list.filter(s => s.attendanceType === "in_person").length;
  if (remoteElem) remoteElem.textContent = list.filter(s => s.attendanceType === "remote" || !s.attendanceType).length;

  if (liveViewersElem) {
    try {
      const res = await fetch("/api/admin/live/viewers");
      if (res.ok) {
        const d = await res.json();
        liveViewersElem.textContent = d.activeViewers || 0;
      }
    } catch {
      // Keep previous
    }
  }
}

function renderTable() {
  const searchInput = document.getElementById("filterSearch");
  const yearInput = document.getElementById("filterYear");
  const catInput = document.getElementById("filterCategory");
  const statusInput = document.getElementById("filterStatus");
  const votingInput = document.getElementById("filterVoting");

  const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const yr = yearInput ? yearInput.value : "all";
  const cat = catInput ? catInput.value : "all";
  const st = statusInput ? statusInput.value : "all";
  const vt = votingInput ? votingInput.value : "all";

  const filtered = submissionsList.filter((item) => {
    const itemYear = getSubmissionYear(item);
    const matchYear = yr === "all" || itemYear === yr;
    const matchSearch = !q ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.filmTitle && item.filmTitle.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q));
    const matchCat = cat === "all" || item.category === cat;
    const matchStatus = st === "all" || item.status === st;
    const matchVoting = 
      vt === "all" || 
      (vt === "inVoting" && item.inVoting === true) || 
      (vt === "notInVoting" && item.inVoting !== true);
    return matchYear && matchSearch && matchCat && matchStatus && matchVoting;
  });

  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.innerHTML = `<td colspan="9" style="text-align:center; padding:24px; color:var(--text-muted);">Paraiškų pagal pasirinktus filtrus nerasta.</td>`;
    tableBody.appendChild(emptyTr);
    return;
  }

  filtered.forEach((sub) => {
    const tr = document.createElement("tr");

    let dateStr = "-";
    if (sub.submittedAt && sub.submittedAt.toDate) {
      dateStr = sub.submittedAt.toDate().toLocaleDateString("lt-LT", { 
        month: "2-digit", 
        day: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }

    const rawStatus = sub.status || "submitted";
    const statusMeta = STATUS_DICTIONARY[rawStatus] || { label: rawStatus, className: "status-submitted" };
    const isVoting = sub.inVoting === true;

    tr.innerHTML = `
      <td data-label="Data" class="text-date">${dateStr}</td>
      <td data-label="Kūrėjas"><strong>${sub.name || ''}</strong><br><span class="text-muted-sm">${sub.email || ''}</span></td>
      <td data-label="Amžius / Kat.">${sub.age || ''} m.<br><span class="text-muted-sm">${sub.category || ''}</span></td>
      <td data-label="Filmas"><strong style="color:var(--text-color);">${sub.filmTitle || ''}</strong></td>
      <td data-label="Balsai">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <strong id="voteCountBadge_${sub.id}" style="color:var(--accent-light); font-size:1.05rem;">${sub.votesCount || 0}</strong>
          <button type="button" class="btn-outline btn-xs" data-action="quick-test-vote" data-id="${sub.id}" data-title="${(sub.filmTitle || '').replace(/"/g, '&quot;')}" title="Atlikti testinį balsą šiam filmui (+1)" style="padding:2px 7px; font-size:0.75rem;">
            <span>+1 Testas</span>
          </button>
        </div>
      </td>
      <td data-label="Balsavime">
        <button type="button" class="admin-switch-btn ${isVoting ? 'active' : ''}" data-action="toggle-voting" data-id="${sub.id}" data-status="${isVoting}">
          <span class="admin-switch-knob"></span>
          <span>${isVoting ? 'Aktyvus' : 'Išjungtas'}</span>
        </button>
      </td>
      <td data-label="Trukmė">${sub.videoDurationSeconds ? sub.videoDurationSeconds + 's' : '-'}</td>
      <td data-label="Statusas">
        <span class="status-pill ${statusMeta.className}">
          <span class="status-dot"></span>
          <span>${statusMeta.label}</span>
        </span>
      </td>
      <td data-label="Veiksmai">
        <div class="action-btns-cell">
          <button class="btn-outline btn-xs" data-action="view" data-id="${sub.id}">Peržiūrėti</button>
          <button class="btn-delete btn-xs" data-action="delete" data-id="${sub.id}">Ištrinti</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

const tableBodyElem = document.getElementById("tableBody");
if (tableBodyElem) {
  tableBodyElem.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "quick-test-vote") {
      await handleQuickTestVote(id, btn.dataset.title || "", btn);
    } else if (action === "toggle-voting") {
      const current = btn.dataset.status === "true";
      await toggleVoting(id, current, btn);
    } else if (action === "view") {
      openModal(id);
    } else if (action === "delete") {
      await deleteSubmission(id);
    }
  });
}

async function handleQuickTestVote(filmId, filmTitle, btn) {
  if (btn) btn.disabled = true;
  const startTime = Date.now();
  try {
    const res = await fetch("/api/admin/test-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId, count: 1 })
    });
    const data = await res.json().catch(() => null);
    const latency = Date.now() - startTime;

    if (res.ok && data && data.success) {
      const badge = document.getElementById(`voteCountBadge_${filmId}`);
      if (badge) {
        badge.textContent = data.currentVotes;
        badge.style.transition = "transform 0.25s ease, color 0.25s ease";
        badge.style.color = "#4ade80";
        badge.style.transform = "scale(1.3)";
        setTimeout(() => {
          badge.style.color = "var(--accent-light)";
          badge.style.transform = "scale(1)";
        }, 400);
      }
      showToast(`⚡ Testinis balsas užskaitytas per ${data.latencyMs || latency} ms! Nauja suma: ${data.currentVotes} balsų. Sistema veikia sklandžiai, nestringa!`, "success");
    } else {
      // Direct Firestore fallback
      await db.collection("submissions").doc(filmId).update({
        votesCount: firebase.firestore.FieldValue.increment(1)
      });
      showToast("Testinis balsas užskaitytas per Firestore!", "success");
    }
  } catch (err) {
    showToast("Klaida siunčiant testinį balsą: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function toggleVoting(id, currentStatus, btn) {
  btn.disabled = true;
  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    const res = await fetch("/api/admin/submissions/toggle-voting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, inVoting: !currentStatus, adminEmail: callerEmail })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Nepavyko pakeisti balsavimo būsenos serveryje");
    }

    if (db && typeof db.collection === "function") {
      try {
        await db.collection("submissions").doc(id).update({
          inVoting: !currentStatus
        });
      } catch (fsErr) {
        console.warn("Firestore toggleVoting sync notice:", fsErr.message);
      }
    }

    showToast(currentStatus ? "Filmas paslėptas nuo balsavimo." : "Filmas aktyvuotas balsavimui!", "success");
    await loadSubmissionsFromApi();
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
  } catch (err) {
    showToast("Klaida keičiant balsavimo būseną: " + err.message, "error");
    btn.disabled = false;
  }
}

async function deleteSubmission(id) {
  const entry = submissionsList.find(x => x.id === id);
  if (!entry) return;

  const confirmed = confirm(`Ar tikrai norite negrįžtamai pašalinti paraišką „${entry.filmTitle}“ (${entry.name})?`);
  if (!confirmed) return;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    if (entry.storagePath) {
      try {
        await storage.ref(entry.storagePath).delete();
      } catch (err) {}
    }

    const res = await fetch("/api/admin/submissions/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminEmail: callerEmail })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Nepavyko pašalinti paraiškos serveryje");
    }

    if (db && typeof db.collection === "function") {
      try {
        await db.collection("submissions").doc(id).delete();
      } catch (fsErr) {
        console.warn("Firestore delete submission notice:", fsErr.message);
      }
    }

    showToast("Paraiška sėkmingai pašalinta.", "success");
    await loadSubmissionsFromApi();
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
  } catch (err) {
    showToast("Klaida trinant paraišką: " + err.message, "error");
  }
}

function initEntryModal() {
  const entryModal = document.getElementById("entryModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const mDeleteBtn = document.getElementById("mDeleteBtn");
  const mSaveBtn = document.getElementById("mSaveBtn");
  const mStatusSelect = document.getElementById("mNewStatus");

  if (mStatusSelect) {
    mStatusSelect.addEventListener("change", (e) => {
      const wrap = document.getElementById("mAwardTitleWrap");
      if (wrap) {
        wrap.style.display = (e.target.value === "winner") ? "block" : "none";
      }
    });
  }

  if (entryModal) {
    entryModal.addEventListener("click", (e) => {
      if (e.target === entryModal) closeModal();
    });
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);

  if (mDeleteBtn) {
    mDeleteBtn.addEventListener("click", async () => {
      if (!currentEntry) return;
      const targetId = currentEntry.id;
      closeModal();
      await deleteSubmission(targetId);
    });
  }

  if (mSaveBtn) {
    mSaveBtn.addEventListener("click", async () => {
      if (!currentEntry) return;
      mSaveBtn.disabled = true;

      const newStatus = document.getElementById("mNewStatus").value;
      const inVotingVal = document.getElementById("mInVoting").checked;
      const tpl = document.getElementById("mEmailTemplate").value;
      const lang = document.getElementById("mEmailLang").value;
      const customMsg = document.getElementById("mCustomText").value.trim();
      const streamLink = document.getElementById("mStreamLink").value.trim();
      const awardInput = document.getElementById("mAwardTitle");
      const awardVal = awardInput ? awardInput.value.trim() : "";

      const updateData = {
        status: newStatus,
        inVoting: inVotingVal,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (newStatus === "winner") {
        updateData.isWinner = true;
        if (awardVal) {
          updateData.awardTitle = awardVal;
        }
      } else if (currentEntry.isWinner) {
        updateData.isWinner = false;
        updateData.awardTitle = firebase.firestore.FieldValue.delete();
      }

      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";

        // 1. Primary: Save via backend API
        const res = await fetch("/api/admin/submissions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentEntry.id, updates: updateData, adminEmail: callerEmail })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Nepavyko atnaujinti paraiškos serveryje");
        }

        // 2. Secondary: Mirror to Firestore if available
        if (db && typeof db.collection === "function") {
          try {
            await db.collection("submissions").doc(currentEntry.id).update(updateData);
          } catch (fsErr) {
            console.warn("Firestore submission update notice:", fsErr.message);
          }
        }

        if (tpl !== "none" && typeof generateEmailHtml === "function") {
          const emailData = {
            id: currentEntry.id,
            name: currentEntry.name,
            filmTitle: currentEntry.filmTitle,
            category: currentEntry.category,
            institution: currentEntry.institution,
            deviceModel: currentEntry.deviceModel,
            videoDurationSeconds: currentEntry.videoDurationSeconds,
            customMessage: customMsg,
            streamLink: streamLink
          };
          const emailHtml = generateEmailHtml(lang, tpl, emailData);
          const emailSubject = (typeof getEmailSubject === "function")
            ? getEmailSubject(lang, tpl, emailData)
            : emailTexts[lang][tpl].sub;

          if (db && typeof db.collection === "function") {
            try {
              await db.collection("mail").add({
                to: [currentEntry.email],
                message: {
                  subject: emailSubject,
                  html: emailHtml
                }
              });
            } catch (mailErr) {
              console.warn("Mail queue notice:", mailErr.message);
            }
          }
          showToast("Statusas atnaujintas ir el. laiškas paruoštas!", "success");
        } else {
          showToast("Statusas sėkmingai atnaujintas.", "success");
        }

        closeModal();
        await loadSubmissionsFromApi();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } catch (err) {
        showToast("Klaida atnaujinant paraišką: " + err.message, "error");
      } finally {
        mSaveBtn.disabled = false;
      }
    });
  }
}

function openModal(id) {
  currentEntry = submissionsList.find((x) => x.id === id);
  if (!currentEntry) return;

  document.getElementById("mTitle").textContent = currentEntry.filmTitle || "Filmas";
  document.getElementById("mAuthor").textContent = currentEntry.name || "";
  document.getElementById("mEmail").textContent = currentEntry.email || "";
  document.getElementById("mAgeInst").textContent = `${currentEntry.age || ''} m. | ${currentEntry.institution || 'Nenurodyta'}`;
  document.getElementById("mLocation").textContent = currentEntry.location || "";
  document.getElementById("mDevice").textContent = currentEntry.deviceModel || "";
  document.getElementById("mDuration").textContent = currentEntry.videoDurationSeconds || "";
  document.getElementById("mVotes").textContent = currentEntry.votesCount || 0;
  document.getElementById("mSynopsis").textContent = currentEntry.synopsis || "";
  document.getElementById("mInVoting").checked = currentEntry.inVoting === true;

  const isWinner = currentEntry.status === "winner" || currentEntry.isWinner === true;
  const awardWrap = document.getElementById("mAwardTitleWrap");
  const awardField = document.getElementById("mAwardTitle");
  if (awardWrap) awardWrap.style.display = isWinner ? "block" : "none";
  if (awardField) awardField.value = currentEntry.awardTitle || "";

  const mVideo = document.getElementById("mVideo");
  if (mVideo) {
    mVideo.src = currentEntry.videoUrl || "";
  }
  const downloadLink = document.getElementById("mDownloadLink");
  if (downloadLink) {
    downloadLink.href = currentEntry.videoUrl || "";
  }

  document.getElementById("mNewStatus").value = currentEntry.status || "submitted";
  document.getElementById("mEmailLang").value = currentEntry.submissionLang || "lt";
  document.getElementById("mEmailTemplate").value = "none";
  document.getElementById("mCustomText").value = "";
  document.getElementById("mStreamLink").value = "";

  const modal = document.getElementById("entryModal");
  if (modal) modal.classList.add("active");
}

function closeModal() {
  const entryModal = document.getElementById("entryModal");
  const mVideo = document.getElementById("mVideo");
  if (entryModal) entryModal.classList.remove("active");
  if (mVideo) {
    mVideo.pause();
    mVideo.src = "";
  }
  currentEntry = null;
}

function initWinnersManager() {
  const assignWinnerBtn = document.getElementById("assignWinnerBtn");
  if (assignWinnerBtn) {
    assignWinnerBtn.addEventListener("click", async () => {
      const filmSelect = document.getElementById("adminSelectFilm");
      const titleInput = document.getElementById("adminAwardTitle");
      const yearInput = document.getElementById("filterYear");

      const filmId = filmSelect ? filmSelect.value : "";
      const awardTitle = titleInput ? titleInput.value.trim() : "";
      const selYear = (yearInput && yearInput.value !== "all") ? yearInput.value : "2026";

      if (!filmId || !awardTitle) {
        showToast("Pasirinkite filmą ir įveskite nominaciją!", "error");
        return;
      }

      assignWinnerBtn.disabled = true;

      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        // 1. Primary: Declare via backend API
        const res = await fetch("/api/admin/declare-winner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filmId, awardTitle, year: selYear, adminEmail: callerEmail })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Nepavyko paskelbti laimėtojo serveryje");
        }

        // 2. Secondary: Mirror to Firestore if available
        if (db && typeof db.collection === "function") {
          try {
            await db.collection("submissions").doc(filmId).update({
              isWinner: true,
              awardTitle: awardTitle,
              awardYear: selYear,
              status: "winner"
            });
          } catch (fsErr) {
            console.warn("Firestore declare-winner notice:", fsErr.message);
          }
        }

        if (titleInput) titleInput.value = "";
        showToast(`Laimėtojas sėkmingai paskelbtas (${selYear} m.)!`, "success");
        await loadSubmissionsFromApi();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } catch (err) {
        showToast("Klaida skelbiant laimėtoją: " + err.message, "error");
      } finally {
        assignWinnerBtn.disabled = false;
      }
    });
  }

  const winnersList = document.getElementById("adminWinnersList");
  if (winnersList) {
    winnersList.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action='revoke']");
      if (!btn) return;
      const filmId = btn.dataset.id;
      btn.disabled = true;
      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        // 1. Primary: Revoke via backend API
        const res = await fetch("/api/admin/revoke-winner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filmId, adminEmail: callerEmail })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Nepavyko atšaukti laimėtojo serveryje");
        }

        // 2. Secondary: Mirror to Firestore if available
        if (db && typeof db.collection === "function") {
          try {
            await db.collection("submissions").doc(filmId).update({
              isWinner: false,
              awardTitle: firebase.firestore.FieldValue.delete()
            });
          } catch (fsErr) {
            console.warn("Firestore revoke-winner notice:", fsErr.message);
          }
        }

        showToast("Laimėtojo statusas atšauktas.", "success");
        await loadSubmissionsFromApi();
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      } catch (err) {
        showToast("Klaida atšaukiant laimėtoją: " + err.message, "error");
        btn.disabled = false;
      }
    });
  }
}

function updateWinnersSelector() {
  const select = document.getElementById("adminSelectFilm");
  const list = document.getElementById("adminWinnersList");
  const yearInput = document.getElementById("filterYear");
  if (!select || !list) return;

  const yr = yearInput ? yearInput.value : "2026";
  const currentYearList = (yr === "all")
    ? submissionsList
    : submissionsList.filter(s => getSubmissionYear(s) === yr);

  const previousSelected = select.value;
  select.innerHTML = '<option value="" disabled selected>Pasirinkite filmą iš sąrašo...</option>';

  currentYearList.forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = `${sub.filmTitle} — ${sub.name} (${sub.category || ''})`;
    select.appendChild(opt);
  });

  if (previousSelected && currentYearList.some(s => s.id === previousSelected)) {
    select.value = previousSelected;
  }

  const winners = currentYearList.filter((s) => s.isWinner === true);
  if (winners.length === 0) {
    list.innerHTML = `<p class="text-muted-sm" style="padding:10px 0;">Nėra paskelbtų laimėtojų ${yr === 'all' ? 'visose edicijose' : yr + ' m. laidoje'}.</p>`;
    return;
  }

  list.innerHTML = winners.map((w) => `
    <div class="winner-item-row">
      <div>
        <strong style="color:var(--accent-light);">${w.awardTitle || 'Laureatas'}</strong>: 
        <strong style="color:var(--text-color);">${w.filmTitle}</strong> 
        <span class="text-muted-sm">(${w.name})</span>
        ${yr === 'all' ? `<span class="badge badge-accepted" style="font-size:0.65rem; margin-left:6px;">${getSubmissionYear(w)} m.</span>` : ''}
      </div>
      <button class="btn-delete btn-xs" data-action="revoke" data-id="${w.id}">Atšaukti</button>
    </div>
  `).join("");
}
