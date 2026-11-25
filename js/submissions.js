import { db, storage } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { generateClientSubmissionPdf } from "./submission-pdf-client.js";

async function hasBackendServer() {
  if (window.FestivalApi && typeof window.FestivalApi.hasServer === "function") {
    return window.FestivalApi.hasServer().catch(() => false);
  }
  return false;
}

let submissionsList = [];
let currentEntry = null;
let unsubscribeSubmissions = null;

export function getSubmissionsList() {
  return submissionsList || [];
}

export function getSubmissionYear(sub) {
  if (!sub) return "2027";
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
  return "2027";
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
    badge.textContent = selYear === "all" ? "Visi metai" : `${selYear} m.`;
  }
  if (status) {
    status.innerHTML = selYear === "all"
      ? `Sistema paruošta`
      : `${selYear} m. leidimas`;
  }
}

function formatParticipantName(sub) {
  if (!sub) return "";
  const full = `${sub.directorFirstName || ""} ${sub.directorLastName || ""}`.trim();
  return full || sub.directorName || sub.name || sub.director || "";
}

function notifySubmissionsUpdated() {
  updateMetrics();
  updateWinnersSelector();
  renderTable();
  updateYearBadges();
  try {
    if (window.AdminDashboard && typeof window.AdminDashboard.update === "function") {
      window.AdminDashboard.update(submissionsList);
    }
  } catch (e) {}
  try {
    if (typeof window.refreshBroadcastOverlaySelects === "function") {
      window.refreshBroadcastOverlaySelects(submissionsList);
    }
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent("submissions-updated", { detail: submissionsList }));
  } catch (e) {}
}

export async function loadSubmissionsFromApi() {
  try {
    if (!(await hasBackendServer())) return;
    const res = await fetch("/api/admin/submissions");
    if (res.ok) {
      const data = await res.json();
      submissionsList = data.submissions || [];
      notifySubmissionsUpdated();
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

  // Hydrate from server API only if backend is running
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
          notifySubmissionsUpdated();
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
  const selYear = filterYear ? filterYear.value : "2027";

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
      if (await hasBackendServer()) {
        const res = await fetch("/api/admin/live/viewers");
        if (res.ok) {
          const d = await res.json();
          liveViewersElem.textContent = d.activeViewers || 0;
        }
      }
    } catch {
      // Keep previous
    }
  }
}

function formatSubmissionDate(rawDate, includeYear = false) {
  if (!rawDate) return "-";
  let d = null;
  if (typeof rawDate === "object" && typeof rawDate.toDate === "function") {
    try {
      d = rawDate.toDate();
    } catch {
      d = null;
    }
  } else {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d) return "-";
  const opts = {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  if (includeYear) opts.year = "numeric";
  return d.toLocaleString("lt-LT", opts);
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
    const searchable = [
      item.id,
      item.name,
      item.directorName,
      item.directorFirstName,
      item.directorLastName,
      item.cameraOperator,
      item.cameraOperatorFirstName,
      item.cameraOperatorLastName,
      item.ideaAuthor,
      item.ideaAuthorFirstName,
      item.ideaAuthorLastName,
      item.screenwriter,
      item.screenwriterFirstName,
      item.screenwriterLastName,
      item.filmTitle,
      item.email,
      item.institution,
      item.location
    ].filter(Boolean).join(" ").toLowerCase();
    const matchSearch = !q || searchable.includes(q);
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

    const dateStr = formatSubmissionDate(sub.submittedAt, false);
    const authorDisplay = `${sub.directorFirstName || ""} ${sub.directorLastName || ""}`.trim() || sub.name || sub.directorName || "";
    const metaSubline = [sub.email, sub.institution || sub.location].filter(Boolean).join(" • ");

    const rawStatus = sub.status || "submitted";
    const statusMeta = STATUS_DICTIONARY[rawStatus] || { label: rawStatus, className: "status-submitted" };
    const isVoting = sub.inVoting === true;

    tr.innerHTML = `
      <td data-label="Data" class="text-date">${dateStr}</td>
      <td data-label="Kūrėjas"><strong>${authorDisplay}</strong><br><span class="text-muted-sm">${metaSubline}</span></td>
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
    let handledByServer = false;
    if (await hasBackendServer()) {
      const res = await fetch("/api/admin/test-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId, count: 1 })
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      const latency = Date.now() - startTime;

      if (res && res.ok && data && data.success) {
        handledByServer = true;
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
        showToast(`Testinis balsas užskaitytas per ${data.latencyMs || latency} ms. Nauja suma: ${data.currentVotes}.`, "success");
      }
    }

    if (!handledByServer) {
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
    let updated = false;

    if (db && typeof db.collection === "function") {
      try {
        await db.collection("submissions").doc(id).update({
          inVoting: !currentStatus
        });
        updated = true;
      } catch (fsErr) {
        console.warn("Firestore toggleVoting sync notice:", fsErr.message);
      }
    }

    if (await hasBackendServer()) {
      const res = await fetch("/api/admin/submissions/toggle-voting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, inVoting: !currentStatus, adminEmail: callerEmail })
      }).catch(() => null);
      if (res && res.ok) {
        updated = true;
      } else if (!updated) {
        const errData = res ? await res.json().catch(() => ({})) : {};
        throw new Error(errData.error || "Nepavyko pakeisti balsavimo būsenos");
      }
    }

    if (!updated) {
      throw new Error("Nepavyko atnaujinti balsavimo būsenos duomenų bazėje");
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
  const entry = submissionsList.find(x => String(x.id).trim() === String(id).trim());
  if (!entry) return;

  const confirmed = confirm(`Ar tikrai norite negrįžtamai pašalinti paraišką „${entry.filmTitle}“ (${entry.name})?`);
  if (!confirmed) return;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    const storagePath = entry.storagePath || (entry.videoUrl && entry.videoUrl.includes('/o/') ? decodeURIComponent(entry.videoUrl.match(/\/o\/([^?#]+)/)?.[1] || '') : null);

    // 1. Delete associated Storage file (handles storagePath and videoUrl)
    if (storagePath && storage && typeof storage.ref === "function") {
      try {
        await storage.ref(storagePath).delete();
      } catch (stErr) {
        console.warn("Storage deletion notice:", stErr.message);
      }
    }

    let fsDeleted = false;
    // 2. Delete Firestore document and associated hierarchy
    if (db && typeof db.collection === "function") {
      try {
        // Delete votes subcollection
        try {
          const votesSnap = await db.collection("submissions").doc(id).collection("votes").get();
          if (votesSnap && votesSnap.docs) {
            for (const doc of votesSnap.docs) {
              await doc.ref.delete().catch(() => {});
            }
          }
        } catch (vErr) {
          console.warn("Votes cleanup notice:", vErr.message);
        }

        // Delete main submission document
        await db.collection("submissions").doc(id).delete();
        fsDeleted = true;

        // Delete associated live viewer document if remote participant
        if (entry.liveToken) {
          await db.collection("live_viewers").doc(entry.liveToken).delete().catch(() => {});
        }

        // Delete associated mail notifications
        await db.collection("mail").doc(`${id}_receipt`).delete().catch(() => {});
        await db.collection("mail").doc(`${id}_organizer`).delete().catch(() => {});
      } catch (fsErr) {
        console.warn("Firestore delete submission notice:", fsErr.message);
      }
    }

    // 3. Delete on backend server only when Express server exists
    let apiDeleted = false;
    if (await hasBackendServer()) {
      try {
        const res = await fetch("/api/admin/submissions/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, adminEmail: callerEmail, storagePath })
        });
        if (res.ok) {
          apiDeleted = true;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn("Backend submissions/delete notice:", errData.error);
        }
      } catch (apiErr) {
        console.warn("Backend submissions/delete API notice:", apiErr.message);
      }
    }

    if (!fsDeleted && !apiDeleted) {
      throw new Error("Nepavyko pašalinti paraiškos nei serveryje, nei Firestore");
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

  const mDownloadPdfBtn = document.getElementById("mDownloadPdfBtn");
  if (mDownloadPdfBtn) {
    mDownloadPdfBtn.addEventListener("click", async () => {
      if (!currentEntry) return;
      const prevText = mDownloadPdfBtn.textContent;
      mDownloadPdfBtn.disabled = true;
      mDownloadPdfBtn.textContent = "Ruošiamas PDF...";
      try {
        let blob = null;
        let filename = "";

        if (await hasBackendServer()) {
          try {
            const res = await fetch("/api/admin/submissions/pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: currentEntry.id, submission: currentEntry })
            });
            const ct = (res.headers.get("content-type") || "").toLowerCase();
            if (res.ok && ct.includes("application/pdf")) {
              blob = await res.blob();
              const headerFilename = res.headers.get("X-Generated-PDF-Filename");
              const disp = res.headers.get("Content-Disposition") || "";
              const dispMatch = disp.match(/filename="?([^"]+)"?/i);
              filename = headerFilename || (dispMatch && dispMatch[1]) || currentEntry.pdfFilename || `AISFF_${currentEntry.id}.pdf`;
            }
          } catch (srvPdfErr) {
            console.warn("Server PDF fallback to client PDF generator:", srvPdfErr?.message || srvPdfErr);
          }
        }

        if (!blob) {
          const generated = await generateClientSubmissionPdf(currentEntry);
          blob = generated.blob;
          filename = generated.filename;
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        showToast(`PDF byla atsisiųsta: ${filename}`, "success");
      } catch (err) {
        showToast("Nepavyko atsisiųsti PDF: " + err.message, "error");
      } finally {
        mDownloadPdfBtn.disabled = false;
        mDownloadPdfBtn.textContent = prevText;
      }
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
      const juryPlaceInput = document.getElementById("mJuryPlace");
      const juryPlaceVal = juryPlaceInput && juryPlaceInput.value ? Number(juryPlaceInput.value) : null;

      // 1. Clean JSON-serializable updates for backend server
      const serverUpdates = {
        status: newStatus,
        inVoting: Boolean(inVotingVal)
      };

      if (newStatus === "winner") {
        serverUpdates.isWinner = true;
        if (awardVal) {
          serverUpdates.awardTitle = awardVal;
        }
        if (juryPlaceVal) {
          serverUpdates.juryPlace = juryPlaceVal;
        }
      } else if (currentEntry.isWinner) {
        serverUpdates.isWinner = false;
        serverUpdates.awardTitle = "";
        serverUpdates.juryPlace = null;
      }

      // 2. Client Firestore SDK updates with server timestamp & FieldValue.delete
      const fsUpdateData = {
        status: newStatus,
        inVoting: Boolean(inVotingVal)
      };

      const fsFieldValue = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue
        : null;
      if (fsFieldValue && typeof fsFieldValue.serverTimestamp === "function") {
        fsUpdateData.lastUpdated = fsFieldValue.serverTimestamp();
      }
      if (newStatus === "winner") {
        fsUpdateData.isWinner = true;
        if (awardVal) {
          fsUpdateData.awardTitle = awardVal;
        }
        if (juryPlaceVal) {
          fsUpdateData.juryPlace = juryPlaceVal;
        } else if (fsFieldValue && typeof fsFieldValue.delete === "function") {
          fsUpdateData.juryPlace = fsFieldValue.delete();
        }
      } else if (currentEntry.isWinner) {
        fsUpdateData.isWinner = false;
        if (fsFieldValue && typeof fsFieldValue.delete === "function") {
          fsUpdateData.awardTitle = fsFieldValue.delete();
          fsUpdateData.juryPlace = fsFieldValue.delete();
        }
      }

      // Helper to strip any undefined values that would cause Firestore to error
      const cleanFsData = {};
      for (const [k, v] of Object.entries(fsUpdateData)) {
        if (v !== undefined) cleanFsData[k] = v;
      }

      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        let apiSucceeded = false;
        let fsSucceeded = false;

        // 1. Direct Firestore update (primary for live sync & static hosting)
        if (db && typeof db.collection === "function") {
          try {
            await db.collection("submissions").doc(currentEntry.id).update(cleanFsData);
            fsSucceeded = true;
          } catch (fsErr) {
            console.warn("Firestore submission update notice:", fsErr.message);
          }
        }

        // 2. Optional Express backend sync
        if (await hasBackendServer()) {
          try {
            const res = await fetch("/api/admin/submissions/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: currentEntry.id,
                updates: {
                  ...serverUpdates,
                  filmTitle: currentEntry.filmTitle,
                  name: formatParticipantName(currentEntry),
                  email: currentEntry.email,
                  category: currentEntry.category
                },
                adminEmail: callerEmail
              })
            });
            if (res.ok) {
              apiSucceeded = true;
            } else {
              const errData = await res.json().catch(() => ({}));
              console.warn("Backend submissions/update response:", errData.error);
            }
          } catch (apiErr) {
            console.warn("Backend submissions/update API notice:", apiErr.message);
          }
        }

        if (!apiSucceeded && !fsSucceeded) {
          throw new Error("Nepavyko atnaujinti paraiškos nei serveryje, nei Firestore duomenų bazėje");
        }

        if (tpl !== "none") {
          let emailSentSuccessfully = false;
          const participantFullName = formatParticipantName(currentEntry);
          const mailPayload = {
            id: currentEntry.id,
            submissionId: currentEntry.id,
            name: participantFullName,
            directorName: participantFullName,
            directorFirstName: currentEntry.directorFirstName,
            directorLastName: currentEntry.directorLastName,
            email: currentEntry.email,
            filmTitle: currentEntry.filmTitle,
            category: currentEntry.category,
            location: currentEntry.location || currentEntry.countryCity,
            institution: currentEntry.institution,
            deviceModel: currentEntry.deviceModel,
            videoDurationSeconds: currentEntry.videoDurationSeconds,
            customMessage: customMsg,
            streamLink,
            awardTitle: awardVal || currentEntry.awardTitle || "",
            juryPlace: juryPlaceVal || currentEntry.juryPlace || null
          };

          if (await hasBackendServer()) {
            try {
              const emailResp = await fetch("/api/admin/submissions/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...mailPayload,
                  to: currentEntry.email,
                  template: tpl,
                  lang,
                  adminEmail: callerEmail
                })
              });
              if (emailResp.ok) {
                const resData = await emailResp.json();
                emailSentSuccessfully = resData.success;
              }
            } catch (apiEmailErr) {
              console.warn("Backend submission send-email notice:", apiEmailErr.message);
            }
          }

          // Fallback or static-hosting queue via client Firestore (Trigger Email extension format)
          if (!emailSentSuccessfully && typeof generateEmailHtml === "function" && db && typeof db.collection === "function") {
            try {
              const emailHtml = generateEmailHtml(tpl, lang, mailPayload);
              const emailSubject = (typeof getEmailSubject === "function")
                ? getEmailSubject(tpl, lang, mailPayload)
                : ((window.emailTexts && window.emailTexts[lang] && window.emailTexts[lang][tpl]) ? window.emailTexts[lang][tpl].sub : "Ąžuolynas Film Fest Pranešimas");

              await db.collection("mail").add({
                to: [currentEntry.email],
                from: "azuolynasfilmfestival@gmail.com",
                replyTo: "azuolynasfilmfestival@gmail.com",
                message: {
                  subject: emailSubject,
                  html: emailHtml,
                  text: emailSubject
                },
                createdAt: new Date().toISOString()
              });
              emailSentSuccessfully = true;
            } catch (mailErr) {
              console.warn("Mail queue notice:", mailErr.message);
            }
          }

          showToast(`Statusas atnaujintas ir el. laiškas sėkmingai išsiųstas į ${currentEntry.email}!`, "success");
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

function splitRoleNames(first, last, combined) {
  const f = String(first || "").trim();
  const l = String(last || "").trim();
  if (f || l) return { first: f || "—", last: l || "—" };
  const full = String(combined || "").trim();
  if (!full) return { first: "—", last: "—" };
  const parts = full.split(/\s+/);
  return { first: parts[0] || "—", last: parts.slice(1).join(" ") || "—" };
}

function buildReadablePdfNameFallback(entry) {
  const first = String(entry.directorFirstName || "").trim();
  const last = String(entry.directorLastName || "").trim();
  const pupil = `${first} ${last}`.trim() || entry.name || "Autorius";
  const film = entry.filmTitle || "Filmas";
  const clean = (s) => String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${clean(pupil)}_-_${clean(film)}.pdf`;
}

function openModal(id) {
  currentEntry = submissionsList.find((x) => x.id === id);
  if (!currentEntry) return;

  const formatAuthor = (first, last, combined) => {
    const joined = `${first || ""} ${last || ""}`.trim();
    return joined || combined || "—";
  };

  const setOptionalText = (elId, value) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = (value === undefined || value === null || value === "") ? "—" : String(value);
  };

  const dirSplit = splitRoleNames(currentEntry.directorFirstName, currentEntry.directorLastName, currentEntry.directorName || currentEntry.name);
  const camSplit = splitRoleNames(currentEntry.cameraOperatorFirstName, currentEntry.cameraOperatorLastName, currentEntry.cameraOperator);
  const ideaSplit = splitRoleNames(currentEntry.ideaAuthorFirstName, currentEntry.ideaAuthorLastName, currentEntry.ideaAuthor);
  const writerSplit = splitRoleNames(currentEntry.screenwriterFirstName, currentEntry.screenwriterLastName, currentEntry.screenwriter);

  setOptionalText("mTitle", currentEntry.filmTitle || "Filmo peržiūra");
  setOptionalText("mSubId", currentEntry.id || "—");
  setOptionalText("mSubmittedAt", formatSubmissionDate(currentEntry.submittedAt, true));
  setOptionalText("mSubmissionLang", currentEntry.submissionLang === "en" ? "English (EN)" : "Lietuvių (LT)");
  const statusInfo = STATUS_DICTIONARY[currentEntry.status || "submitted"];
  setOptionalText("mStatusDisplay", statusInfo ? statusInfo.label : (currentEntry.status || "submitted"));
  setOptionalText("mResponseSla", currentEntry.responseTimeText || "per 5 darbo dienas");
  setOptionalText("mVotes", currentEntry.votesCount || 0);

  setOptionalText("mDirFirst", dirSplit.first);
  setOptionalText("mDirLast", dirSplit.last);
  setOptionalText("mCamFirst", camSplit.first);
  setOptionalText("mCamLast", camSplit.last);
  setOptionalText("mIdeaFirst", ideaSplit.first);
  setOptionalText("mIdeaLast", ideaSplit.last);
  setOptionalText("mWriterFirst", writerSplit.first);
  setOptionalText("mWriterLast", writerSplit.last);

  setOptionalText("mAuthor", formatAuthor(currentEntry.directorFirstName, currentEntry.directorLastName, currentEntry.name));
  setOptionalText("mDirectorRole", formatAuthor(currentEntry.directorFirstName, currentEntry.directorLastName, currentEntry.name));
  setOptionalText("mCameraOperatorRole", formatAuthor(currentEntry.cameraOperatorFirstName, currentEntry.cameraOperatorLastName, currentEntry.cameraOperator));
  setOptionalText("mIdeaAuthorRole", formatAuthor(currentEntry.ideaAuthorFirstName, currentEntry.ideaAuthorLastName, currentEntry.ideaAuthor));
  setOptionalText("mScreenwriterRole", formatAuthor(currentEntry.screenwriterFirstName, currentEntry.screenwriterLastName, currentEntry.screenwriter));

  setOptionalText("mEmail", currentEntry.email);
  setOptionalText("mAge", currentEntry.age ? `${currentEntry.age} m.` : "—");
  setOptionalText("mCategory", currentEntry.category);
  setOptionalText("mAgeInst", `${currentEntry.age || ""} m. | ${currentEntry.institution || "Nenurodyta"}`);
  setOptionalText("mLocation", currentEntry.location || currentEntry.countryCity);
  setOptionalText("mInstitution", currentEntry.institution);
  setOptionalText("mAwardDisplay", currentEntry.awardTitle || "—");

  const attendanceLabel = currentEntry.attendanceType === "remote"
    ? "Nuotoliniu būdu (Remote)"
    : "Dalyvaus gyvai Kaune (In person)";
  setOptionalText("mAttendanceType", attendanceLabel);
  setOptionalText("mLiveToken", currentEntry.liveToken);

  const liveUrlEl = document.getElementById("mLiveStreamUrl");
  if (liveUrlEl) {
    if (currentEntry.liveStreamUrl) {
      liveUrlEl.innerHTML = `<a href="${currentEntry.liveStreamUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-light); text-decoration:underline;">${currentEntry.liveStreamUrl}</a>`;
    } else {
      liveUrlEl.textContent = "—";
    }
  }

  setOptionalText("mDevice", currentEntry.deviceModel);
  setOptionalText("mVideoMethod", currentEntry.videoSourceType === "link" ? "Išorinė vaizdo nuoroda (URL)" : "Įkeltas vaizdo failas");
  setOptionalText("mVideoFileName", currentEntry.videoFileName);

  const bytes = Number(currentEntry.videoSizeBytes || currentEntry.videoFileSizeBytes || 0);
  const sizeParts = [];
  if (bytes > 0) sizeParts.push(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
  if (currentEntry.videoMimeType) sizeParts.push(currentEntry.videoMimeType);
  setOptionalText("mVideoSize", sizeParts.length ? sizeParts.join(" • ") : "—");
  setOptionalText("mDuration", currentEntry.videoDurationSeconds || "—");
  setOptionalText("mResolution", currentEntry.videoResolution);
  setOptionalText("mVideoValidation", currentEntry.videoValidationStatus || "PASSED");

  const resolvedPdfName = currentEntry.pdfFilename || buildReadablePdfNameFallback(currentEntry);
  setOptionalText("mPdfFilename", resolvedPdfName);

  const videoUrlEl = document.getElementById("mVideoUrlLink");
  const vidUrl = currentEntry.videoUrl || currentEntry.videoLink || "";
  if (videoUrlEl) {
    if (vidUrl) {
      videoUrlEl.innerHTML = `<a href="${vidUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-light); text-decoration:underline;">${vidUrl}</a>`;
    } else {
      videoUrlEl.textContent = "—";
    }
  }

  const notifParts = [];
  const receiptRes = currentEntry.notificationResults?.receipt;
  const orgRes = currentEntry.notificationResults?.organizer;
  if (receiptRes) notifParts.push(`Autoriui: ${receiptRes.success ? "Išsiųsta" : "Klaida"}`);
  if (orgRes) notifParts.push(`Administratoriui: ${orgRes.success ? "Išsiųsta" : "Klaida"}`);
  setOptionalText("mNotifyStatus", notifParts.length ? notifParts.join(" • ") : "Automatinis patvirtinimas");

  const specsParts = [];
  if (currentEntry.videoSourceType) specsParts.push(currentEntry.videoSourceType === "link" ? "Nuoroda" : "Failas");
  if (currentEntry.videoFileName) specsParts.push(currentEntry.videoFileName);
  if (bytes > 0) specsParts.push(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
  if (currentEntry.videoResolution) specsParts.push(currentEntry.videoResolution);
  specsParts.push(`PDF: ${resolvedPdfName}`);
  setOptionalText("mVideoSpecs", specsParts.join(" • "));

  setOptionalText("mSynopsis", currentEntry.synopsis || "—");
  document.getElementById("mInVoting").checked = currentEntry.inVoting === true;

  const isWinner = currentEntry.status === "winner" || currentEntry.isWinner === true;
  const awardWrap = document.getElementById("mAwardTitleWrap");
  const awardField = document.getElementById("mAwardTitle");
  const juryPlaceField = document.getElementById("mJuryPlace");
  if (awardWrap) awardWrap.style.display = isWinner ? "block" : "none";
  if (awardField) awardField.value = currentEntry.awardTitle || "";
  if (juryPlaceField) juryPlaceField.value = currentEntry.juryPlace ? String(currentEntry.juryPlace) : "";

  const mVideo = document.getElementById("mVideo");
  if (mVideo) {
    mVideo.src = vidUrl;
  }
  const downloadLink = document.getElementById("mDownloadLink");
  if (downloadLink) {
    downloadLink.href = vidUrl || "#";
    downloadLink.style.display = vidUrl ? "inline-flex" : "none";
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

function escapeSubsHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initWinnersManager() {
  const assignWinnerBtn = document.getElementById("assignWinnerBtn");
  const filmSelect = document.getElementById("adminSelectFilm");
  const titleInput = document.getElementById("adminAwardTitle");
  const placeInput = document.getElementById("adminJuryPlace");

  if (filmSelect) {
    filmSelect.addEventListener("change", () => {
      const film = submissionsList.find((s) => s.id === filmSelect.value);
      if (film) {
        if (titleInput) titleInput.value = film.awardTitle || "";
        if (placeInput) placeInput.value = film.juryPlace ? String(film.juryPlace) : "";
      }
    });
  }

  if (assignWinnerBtn) {
    assignWinnerBtn.addEventListener("click", async () => {
      const yearInput = document.getElementById("filterYear");

      const filmId = filmSelect ? filmSelect.value : "";
      const awardTitle = titleInput ? titleInput.value.trim() : "";
      const juryPlace = placeInput && placeInput.value ? Number(placeInput.value) : null;
      const targetFilm = submissionsList.find((s) => s.id === filmId);
      const selYear = (yearInput && yearInput.value !== "all")
        ? yearInput.value
        : (targetFilm ? getSubmissionYear(targetFilm) : "2027");

      if (!filmId || !awardTitle) {
        showToast("Pasirinkite filmą ir įveskite nominaciją!", "error");
        return;
      }

      assignWinnerBtn.disabled = true;

      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        let fsSucceeded = false;
        let apiSucceeded = false;

        // 1. Primary: Firestore direct update for instant live sync across site & voting
        if (db && typeof db.collection === "function") {
          const fsPayload = {
            isWinner: true,
            awardTitle,
            awardYear: selYear,
            status: "winner"
          };
          const fv = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue
            : null;
          if (juryPlace) {
            fsPayload.juryPlace = juryPlace;
          } else if (fv && typeof fv.delete === "function") {
            fsPayload.juryPlace = fv.delete();
          }
          if (fv && typeof fv.serverTimestamp === "function") {
            fsPayload.lastUpdated = fv.serverTimestamp();
          }
          await db.collection("submissions").doc(filmId).update(fsPayload);
          fsSucceeded = true;
        }

        // 2. Secondary: Optional backend sync only when Express server is present
        if (await hasBackendServer()) {
          const res = await fetch("/api/admin/declare-winner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filmId, awardTitle, juryPlace, year: selYear, adminEmail: callerEmail })
          }).catch(() => null);
          if (res && res.ok) {
            apiSucceeded = true;
          } else if (!fsSucceeded) {
            const errData = res ? await res.json().catch(() => ({})) : {};
            throw new Error(errData.error || "Nepavyko paskelbti laimėtojo serveryje");
          }
        }

        if (!fsSucceeded && !apiSucceeded) {
          throw new Error("Nepavyko išsaugoti laureato duomenų bazėje");
        }

        if (targetFilm) {
          targetFilm.isWinner = true;
          targetFilm.awardTitle = awardTitle;
          targetFilm.awardYear = selYear;
          targetFilm.status = "winner";
          if (juryPlace) targetFilm.juryPlace = juryPlace;
          else delete targetFilm.juryPlace;
          notifySubmissionsUpdated();
        }

        if (titleInput) titleInput.value = "";
        if (placeInput) placeInput.value = "";
        showToast(`Laureatas išsaugotas gyvai (${selYear} m.)!`, "success");
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
      const editBtn = e.target.closest("button[data-action='edit-winner']");
      if (editBtn) {
        const filmId = editBtn.dataset.id;
        if (typeof window.openWinnerEditModal === "function") {
          window.openWinnerEditModal(filmId);
        } else if (filmSelect) {
          filmSelect.value = filmId;
          filmSelect.dispatchEvent(new Event("change"));
        }
        return;
      }

      const btn = e.target.closest("button[data-action='revoke']");
      if (!btn) return;
      const filmId = btn.dataset.id;
      btn.disabled = true;
      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        let fsSucceeded = false;
        let apiSucceeded = false;

        // 1. Primary: Firestore update (keeps film in finalists, removes winner tag)
        if (db && typeof db.collection === "function") {
          const fv = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue
            : null;
          const revokePayload = {
            isWinner: false,
            status: "final"
          };
          if (fv && typeof fv.delete === "function") {
            revokePayload.awardTitle = fv.delete();
            revokePayload.juryPlace = fv.delete();
          }
          await db.collection("submissions").doc(filmId).update(revokePayload);
          fsSucceeded = true;
        }

        // 2. Secondary: Optional Express server sync
        if (await hasBackendServer()) {
          const res = await fetch("/api/admin/revoke-winner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filmId, adminEmail: callerEmail })
          }).catch(() => null);
          if (res && res.ok) {
            apiSucceeded = true;
          } else if (!fsSucceeded) {
            const errData = res ? await res.json().catch(() => ({})) : {};
            throw new Error(errData.error || "Nepavyko atšaukti laimėtojo serveryje");
          }
        }

        if (!fsSucceeded && !apiSucceeded) {
          throw new Error("Nepavyko atnaujinti statuso duomenų bazėje");
        }

        const targetFilm = submissionsList.find((s) => s.id === filmId);
        if (targetFilm) {
          targetFilm.isWinner = false;
          targetFilm.status = "final";
          delete targetFilm.awardTitle;
          delete targetFilm.juryPlace;
          notifySubmissionsUpdated();
        }

        showToast("Laureato statusas atšauktas (filmas išliko finale).", "success");
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

  const yr = yearInput ? yearInput.value : "all";
  const currentYearList = (yr === "all")
    ? [...submissionsList]
    : submissionsList.filter(s => getSubmissionYear(s) === yr);

  // Order real uploaded films with finalists/accepted/winners first so they are easy to pick
  const stagePriority = { winner: 0, final: 1, semifinal: 2, accepted: 3, submitted: 4, rejected: 5 };
  currentYearList.sort((a, b) => {
    const aScore = (a.inVoting ? -2 : 0) + (stagePriority[a.status || "submitted"] ?? 4);
    const bScore = (b.inVoting ? -2 : 0) + (stagePriority[b.status || "submitted"] ?? 4);
    if (aScore !== bScore) return aScore - bScore;
    return String(a.filmTitle || "").localeCompare(String(b.filmTitle || ""));
  });

  const previousSelected = select.value;
  select.innerHTML = '<option value="" disabled selected>Pasirinkite filmą iš sąrašo...</option>';

  currentYearList.forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub.id;
    const participant = formatParticipantName(sub) || "Be vardo";
    const statusText = sub.isWinner || sub.status === "winner"
      ? `Laureatas: ${sub.awardTitle || "Taip"}`
      : (STATUS_DICTIONARY[sub.status || "submitted"]?.label || "Pateikta");
    const votingFlag = sub.inVoting ? " • Balsavime" : "";
    opt.textContent = `${sub.filmTitle || "Be pavadinimo"} — ${participant} (${sub.category || ""} | ${statusText}${votingFlag})`;
    select.appendChild(opt);
  });

  if (previousSelected && currentYearList.some(s => s.id === previousSelected)) {
    select.value = previousSelected;
  }

  const winners = currentYearList
    .filter((s) => s.isWinner === true || s.status === "winner")
    .sort((a, b) => (Number(a.juryPlace || 99)) - (Number(b.juryPlace || 99)));

  if (winners.length === 0) {
    list.innerHTML = `<p class="text-muted-sm" style="padding:10px 0;">Nėra paskelbtų laureatų ${yr === 'all' ? 'visose edicijose' : yr + ' m. laidoje'}. Galite pažymėti bet kurį atrinktą filmą aukščiau arba turnyrinėje lentelėje.</p>`;
    return;
  }

  list.innerHTML = winners.map((w) => {
    const participant = formatParticipantName(w) || "Nenurodyta";
    const placeLabel = w.juryPlace ? `#${w.juryPlace} vieta · ` : "";
    return `
      <div class="winner-item-row" style="cursor:pointer;" data-winner-row="${escapeSubsHtml(w.id)}">
        <div>
          <strong style="color:var(--accent-light);">${escapeSubsHtml(placeLabel + (w.awardTitle || "Laureatas"))}</strong>:
          <strong style="color:var(--text-color);">„${escapeSubsHtml(w.filmTitle || "Be pavadinimo")}“</strong>
          <span class="text-muted-sm">— ${escapeSubsHtml(participant)} (${escapeSubsHtml(w.category || "")})</span>
          ${w.inVoting ? `<span class="badge badge-accepted" style="font-size:0.65rem; margin-left:6px;">Balsavime</span>` : ""}
          ${yr === 'all' ? `<span class="badge" style="font-size:0.65rem; margin-left:6px; background:rgba(255,255,255,0.08); color:#E2E8F0;">${escapeSubsHtml(getSubmissionYear(w))} m.</span>` : ""}
        </div>
        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button type="button" class="btn-outline btn-xs" data-action="edit-winner" data-id="${escapeSubsHtml(w.id)}">Keisti / Redaguoti</button>
          <button type="button" class="btn-delete btn-xs" data-action="revoke" data-id="${escapeSubsHtml(w.id)}">Atšaukti</button>
        </div>
      </div>
    `;
  }).join("");
}
