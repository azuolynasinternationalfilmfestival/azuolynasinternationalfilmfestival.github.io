import { db, storage } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

let submissionsList = [];
let currentEntry = null;
let unsubscribeSubmissions = null;

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
  const filterCategory = document.getElementById("filterCategory");
  const filterStatus = document.getElementById("filterStatus");
  const filterVoting = document.getElementById("filterVoting");

  if (filterSearch) filterSearch.addEventListener("input", renderTable);
  if (filterCategory) filterCategory.addEventListener("change", renderTable);
  if (filterStatus) filterStatus.addEventListener("change", renderTable);
  if (filterVoting) filterVoting.addEventListener("change", renderTable);

  initEntryModal();
  initWinnersManager();
}

export function subscribeSubmissions() {
  if (unsubscribeSubmissions) {
    unsubscribeSubmissions();
  }

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
    }, (err) => {
      showToast("Klaida gaunant paraiškas: " + err.message, "error");
    });
}

export function unsubscribeSubmissionsListener() {
  if (unsubscribeSubmissions) {
    unsubscribeSubmissions();
    unsubscribeSubmissions = null;
  }
}

function updateMetrics() {
  const totalElem = document.getElementById("statTotal");
  const acceptedElem = document.getElementById("statAccepted");
  const votingElem = document.getElementById("statVoting");
  const finalsElem = document.getElementById("statFinals");

  if (totalElem) totalElem.textContent = submissionsList.length;
  if (acceptedElem) acceptedElem.textContent = submissionsList.filter(s => s.status === "accepted").length;
  if (votingElem) votingElem.textContent = submissionsList.filter(s => s.inVoting === true).length;
  if (finalsElem) finalsElem.textContent = submissionsList.filter(s => ["semifinal", "final", "winner"].includes(s.status)).length;
}

function renderTable() {
  const searchInput = document.getElementById("filterSearch");
  const catInput = document.getElementById("filterCategory");
  const statusInput = document.getElementById("filterStatus");
  const votingInput = document.getElementById("filterVoting");

  const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const cat = catInput ? catInput.value : "all";
  const st = statusInput ? statusInput.value : "all";
  const vt = votingInput ? votingInput.value : "all";

  const filtered = submissionsList.filter((item) => {
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
    return matchSearch && matchCat && matchStatus && matchVoting;
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
      <td data-label="Balsai"><strong style="color:var(--accent-light);">${sub.votesCount || 0}</strong></td>
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

    if (action === "toggle-voting") {
      const current = btn.dataset.status === "true";
      await toggleVoting(id, current, btn);
    } else if (action === "view") {
      openModal(id);
    } else if (action === "delete") {
      await deleteSubmission(id);
    }
  });
}

async function toggleVoting(id, currentStatus, btn) {
  btn.disabled = true;
  try {
    await db.collection("submissions").doc(id).update({
      inVoting: !currentStatus
    });
    showToast(currentStatus ? "Filmas paslėptas nuo balsavimo." : "Filmas aktyvuotas balsavimui!");
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
    if (entry.storagePath) {
      try {
        await storage.ref(entry.storagePath).delete();
      } catch (err) {}
    }
    await db.collection("submissions").doc(id).delete();
    showToast("Paraiška sėkmingai pašalinta.");
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

      try {
        await db.collection("submissions").doc(currentEntry.id).update({
          status: newStatus,
          inVoting: inVotingVal,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (tpl !== "none" && typeof generateEmailHtml === "function") {
          const emailHtml = generateEmailHtml(lang, tpl, {
            name: currentEntry.name,
            filmTitle: currentEntry.filmTitle,
            category: currentEntry.category,
            customMessage: customMsg,
            streamLink: streamLink
          });

          await db.collection("mail").add({
            to: [currentEntry.email],
            message: {
              subject: emailTexts[lang][tpl].sub,
              html: emailHtml
            }
          });
          showToast("Statusas atnaujintas ir el. laiškas išsiųstas!");
        } else {
          showToast("Statusas sėkmingai atnaujintas.");
        }

        closeModal();
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

      const filmId = filmSelect ? filmSelect.value : "";
      const awardTitle = titleInput ? titleInput.value.trim() : "";

      if (!filmId || !awardTitle) {
        showToast("Pasirinkite filmą ir įveskite nominaciją!", "error");
        return;
      }

      assignWinnerBtn.disabled = true;

      try {
        await db.collection("submissions").doc(filmId).update({
          isWinner: true,
          awardTitle: awardTitle,
          status: "winner"
        });
        if (titleInput) titleInput.value = "";
        showToast("Laimėtojas sėkmingai paskelbtas!");
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
        await db.collection("submissions").doc(filmId).update({
          isWinner: false,
          awardTitle: firebase.firestore.FieldValue.delete()
        });
        showToast("Laimėtojo statusas atšauktas.");
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
  if (!select || !list) return;

  const previousSelected = select.value;
  select.innerHTML = '<option value="" disabled selected>Pasirinkite filmą iš sąrašo...</option>';

  submissionsList.forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    opt.textContent = `${sub.filmTitle} — ${sub.name} (${sub.category || ''})`;
    select.appendChild(opt);
  });

  if (previousSelected && submissionsList.some(s => s.id === previousSelected)) {
    select.value = previousSelected;
  }

  const winners = submissionsList.filter((s) => s.isWinner === true);
  if (winners.length === 0) {
    list.innerHTML = '<p class="text-muted-sm" style="padding:10px 0;">Nėra paskelbtų laimėtojų.</p>';
    return;
  }

  list.innerHTML = winners.map((w) => `
    <div class="winner-item-row">
      <div>
        <strong style="color:var(--accent-light);">${w.awardTitle || 'Laureatas'}</strong>: 
        <strong style="color:var(--text-color);">${w.filmTitle}</strong> 
        <span class="text-muted-sm">(${w.name})</span>
      </div>
      <button class="btn-delete btn-xs" data-action="revoke" data-id="${w.id}">Atšaukti</button>
    </div>
  `).join("");
}
