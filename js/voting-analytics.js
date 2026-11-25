/**
 * voting-analytics.js
 * Real-Time Voting Management, Jury Evaluation Console & Live Laureates Editor
 * Ąžuolynas International Film Festival
 */

import { db } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { getSubmissionsList, getSubmissionYear } from "./submissions.js";

let evaluationsData = [];
let serverAnalyticsSummary = null;
let liveVotesDocsCount = 0;
let currentJudgeFilm = null;
let unsubscribeEvalsListener = null;
let unsubscribeVotesListener = null;
let listenersBound = false;

const STAGE_LABELS = {
  submitted: { label: "Pateikta", className: "status-submitted" },
  accepted: { label: "Priimta", className: "status-accepted" },
  semifinal: { label: "Pusfinalis", className: "status-semifinal" },
  final: { label: "Finalas", className: "status-final" },
  winner: { label: "Laureatas", className: "status-winner" },
  rejected: { label: "Atmesta", className: "status-rejected" }
};

async function hasBackendServer() {
  if (window.FestivalApi && typeof window.FestivalApi.hasServer === "function") {
    return window.FestivalApi.hasServer().catch(() => false);
  }
  return false;
}

function getParticipantName(film) {
  if (!film) return "";
  const full = `${film.directorFirstName || ""} ${film.directorLastName || ""}`.trim();
  return full || film.directorName || film.name || film.director || film.author || "";
}

function computeJudgeSummaries() {
  const grouped = {};
  (evaluationsData || []).forEach((ev) => {
    if (!ev || !ev.filmId) return;
    if (!grouped[ev.filmId]) grouped[ev.filmId] = [];
    grouped[ev.filmId].push(ev);
  });

  const summaries = {};
  Object.keys(grouped).forEach((filmId) => {
    const list = grouped[filmId];
    const total = list.reduce((sum, item) => sum + Number(item.averageScore || 0), 0);
    summaries[filmId] = {
      judgeCount: list.length,
      averageJudgeScore: Number((total / list.length).toFixed(1)),
      evaluations: list
    };
  });

  if (serverAnalyticsSummary && serverAnalyticsSummary.judgeSummaries) {
    Object.entries(serverAnalyticsSummary.judgeSummaries).forEach(([filmId, srvSummary]) => {
      if (!summaries[filmId]) {
        summaries[filmId] = srvSummary;
      }
    });
  }

  return summaries;
}

export function initVotingAnalytics() {
  const saveEvalBtn = document.getElementById("saveJudgeEvalBtn");
  if (saveEvalBtn) {
    saveEvalBtn.addEventListener("click", handleSaveJudgeEvaluation);
  }

  const closeJudgeModalBtn = document.getElementById("closeJudgeEvalModalBtn");
  const cancelJudgeModalBtn = document.getElementById("cancelJudgeEvalModalBtn");
  const judgeModal = document.getElementById("judgeEvalModal");

  if (closeJudgeModalBtn && judgeModal) {
    closeJudgeModalBtn.addEventListener("click", () => judgeModal.classList.add("d-none"));
  }
  if (cancelJudgeModalBtn && judgeModal) {
    cancelJudgeModalBtn.addEventListener("click", () => judgeModal.classList.add("d-none"));
  }

  ["scoreCreativity", "scoreDirecting", "scoreCamera", "scoreSound", "scoreImpact"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", updateEvalCalculations);
    }
  });

  const filterStage = document.getElementById("filterVotingStage");
  if (filterStage) {
    filterStage.addEventListener("change", renderVotingLeaderboard);
  }

  const filterCategory = document.getElementById("filterVotingAnalyticsCategory");
  if (filterCategory) {
    filterCategory.addEventListener("change", renderVotingLeaderboard);
  }

  const refreshBtn = document.getElementById("btnRefreshVotingAnalytics");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      showToast("Atnaujinama balsavimo ir komisijos statistika...");
      await loadVotingAnalytics();
    });
  }

  initWinnerEditModal();

  if (!listenersBound) {
    listenersBound = true;
    window.addEventListener("submissions-updated", () => {
      renderVotingMetrics();
      renderVotingLeaderboard();
    });
  }

  window.openWinnerEditModal = openWinnerEditModal;

  subscribeVotingAnalytics();
  loadVotingAnalytics();
}

export function subscribeVotingAnalytics() {
  unsubscribeVotingAnalyticsListener();
  if (!db || typeof db.collection !== "function") return;

  try {
    unsubscribeEvalsListener = db.collection("judge_evaluations").onSnapshot(
      (snap) => {
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        evaluationsData = list;
        renderVotingMetrics();
        renderVotingLeaderboard();
      },
      (err) => {
        console.warn("Firestore judge_evaluations listener notice:", err.message);
      }
    );
  } catch (err) {
    console.warn("judge_evaluations listener setup error:", err.message);
  }

  try {
    unsubscribeVotesListener = db.collection("votes").onSnapshot(
      (snap) => {
        liveVotesDocsCount = snap.size || 0;
        renderVotingMetrics();
      },
      () => {}
    );
  } catch (err) {
    // Silent fallback
  }
}

export function unsubscribeVotingAnalyticsListener() {
  if (unsubscribeEvalsListener) {
    unsubscribeEvalsListener();
    unsubscribeEvalsListener = null;
  }
  if (unsubscribeVotesListener) {
    unsubscribeVotesListener();
    unsubscribeVotesListener = null;
  }
}

export async function loadVotingAnalytics() {
  try {
    // 1. Load live Firestore evaluations & votes if not yet populated by snapshot
    if (db && typeof db.collection === "function") {
      try {
        const evalSnap = await db.collection("judge_evaluations").get();
        const fsEvals = [];
        evalSnap.forEach((doc) => fsEvals.push({ id: doc.id, ...doc.data() }));
        if (fsEvals.length > 0 || evaluationsData.length === 0) {
          evaluationsData = fsEvals;
        }
      } catch (fsErr) {
        console.warn("Firestore judge_evaluations read notice:", fsErr.message);
      }
    }

    // 2. Optional Express server hydration ONLY when backend server exists
    if (await hasBackendServer()) {
      const [evalsRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/judge-evaluations").catch(() => null),
        fetch("/api/admin/voting-analytics").catch(() => null)
      ]);

      if (evalsRes && evalsRes.ok) {
        const data = await evalsRes.json().catch(() => null);
        if (data && Array.isArray(data.evaluations) && evaluationsData.length === 0) {
          evaluationsData = data.evaluations;
        }
      }

      if (analyticsRes && analyticsRes.ok) {
        serverAnalyticsSummary = await analyticsRes.json().catch(() => null);
      }
    }

    renderVotingMetrics();
    renderVotingLeaderboard();
  } catch (err) {
    console.warn("Error loading voting analytics:", err);
  }
}

function renderVotingMetrics() {
  const statAudienceVotes = document.getElementById("statTotalAudienceVotes");
  const statJudgeEvals = document.getElementById("statTotalJudgeEvals");
  const statTopFilm = document.getElementById("statTopRankedFilm");
  const statAvgScore = document.getElementById("statOverallAvgScore");

  const submissions = getSubmissionsList();
  const sumFilmVotes = submissions.reduce((acc, s) => acc + Number(s.votesCount ?? s.votes ?? 0), 0);
  const serverTotal = serverAnalyticsSummary ? Number(serverAnalyticsSummary.totalAudienceVotes || 0) : 0;
  const totalAudience = Math.max(sumFilmVotes, liveVotesDocsCount, serverTotal);
  const totalEvals = (evaluationsData || []).length;

  if (statAudienceVotes) statAudienceVotes.textContent = totalAudience;
  if (statJudgeEvals) statJudgeEvals.textContent = totalEvals;

  if (evaluationsData.length > 0) {
    const avg = evaluationsData.reduce((acc, e) => acc + Number(e.averageScore || 0), 0) / evaluationsData.length;
    if (statAvgScore) statAvgScore.textContent = avg.toFixed(1) + " / 10";
  } else if (statAvgScore) {
    statAvgScore.textContent = "—";
  }

  if (statTopFilm) {
    if (submissions.length > 0) {
      const sorted = [...submissions].sort((a, b) => Number(b.votesCount ?? b.votes ?? 0) - Number(a.votesCount ?? a.votes ?? 0));
      const top = sorted[0];
      const topVotes = Number(top.votesCount ?? top.votes ?? 0);
      statTopFilm.textContent = topVotes > 0 ? (top.filmTitle || top.title || "—") : (top.filmTitle || "—");
    } else {
      statTopFilm.textContent = "—";
    }
  }
}

export function renderVotingLeaderboard() {
  const tbody = document.getElementById("votingLeaderboardBody");
  if (!tbody) return;

  const submissions = getSubmissionsList();
  const stageFilter = document.getElementById("filterVotingStage")?.value || "selected";
  const catFilter = document.getElementById("filterVotingAnalyticsCategory")?.value || "all";

  let list = submissions.filter((s) => {
    const status = s.status || "submitted";
    const isWinner = s.isWinner === true || status === "winner";
    const isSelectedStage = ["accepted", "semifinal", "final", "winner"].includes(status) || s.inVoting === true || isWinner;

    if (stageFilter === "selected" && !isSelectedStage) return false;
    if (stageFilter === "inVoting" && s.inVoting !== true) return false;
    if (stageFilter === "final" && !["final", "winner"].includes(status) && !isWinner) return false;
    if (stageFilter === "winner" && !isWinner) return false;
    if (catFilter !== "all" && s.category !== catFilter) return false;
    return true;
  });

  const judgeSummaries = computeJudgeSummaries();

  list.sort((a, b) => {
    const aWinner = a.isWinner === true || a.status === "winner";
    const bWinner = b.isWinner === true || b.status === "winner";
    if (aWinner !== bWinner) return aWinner ? -1 : 1;

    const aPlace = Number(a.juryPlace || 99);
    const bPlace = Number(b.juryPlace || 99);
    if (aPlace !== bPlace) return aPlace - bPlace;

    const aVotes = Number(a.votesCount ?? a.votes ?? 0);
    const bVotes = Number(b.votesCount ?? b.votes ?? 0);
    const aJudge = judgeSummaries[a.id]?.averageJudgeScore || 0;
    const bJudge = judgeSummaries[b.id]?.averageJudgeScore || 0;
    return (bVotes + bJudge * 10) - (aVotes + aJudge * 10);
  });

  if (list.length === 0) {
    const emptyMsg = submissions.length > 0
      ? "Pagal pasirinktą filtrą filmų nėra. Perjunkite filtrą į „Visi pateikti filmai“ arba pažymėkite filmus į atranką / finalą."
      : "Kol kas pateiktų filmų sąrašas tuščias.";
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          ${emptyMsg}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((film, index) => {
    const jSummary = judgeSummaries[film.id];
    const jScore = jSummary ? jSummary.averageJudgeScore : null;
    const jCount = jSummary ? jSummary.judgeCount : 0;
    const isWinner = film.status === "winner" || film.isWinner === true;
    const participantName = getParticipantName(film) || "Nenurodyta";
    const stageMeta = STAGE_LABELS[film.status || "submitted"] || { label: film.status || "Pateikta", className: "status-submitted" };
    const juryPlaceBadge = film.juryPlace
      ? `<span class="badge" style="background:rgba(52,211,153,0.16); border:1px solid rgba(52,211,153,0.45); color:#34D399; font-size:0.68rem; font-family:monospace;">#${escapeHtml(film.juryPlace)} vieta</span>`
      : "";

    return `
      <tr data-film-row="${escapeHtml(film.id)}">
        <td style="font-weight:700; font-family:monospace; color:${index === 0 ? '#FFFFFF' : index === 1 ? '#cbd5e1' : index === 2 ? '#94a3b8' : 'var(--text-muted)'}; width:46px; text-align:center;">
          #${index + 1}
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-color); font-family:var(--font-cinema); font-size:0.96rem;">
            ${escapeHtml(film.filmTitle || film.title || "Be pavadinimo")}
          </div>
          <div style="font-size:0.76rem; color:var(--text-muted);">
            <strong style="color:#E2E8F0;">${escapeHtml(participantName)}</strong>
            ${(film.institution || film.location) ? ` &bull; ${escapeHtml([film.institution, film.location].filter(Boolean).join(" • "))}` : ""}
          </div>
        </td>
        <td>
          <span class="badge" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:var(--accent-light); font-size:0.72rem; border-radius:2px;">
            ${escapeHtml(film.category || "Nenurodyta")}
          </span>
        </td>
        <td style="text-align:center; font-weight:700; font-family:monospace; color:var(--accent-light);">
          <span style="font-size:1.05rem;">${Number(film.votesCount ?? film.votes ?? 0)}</span>
          <span style="font-size:0.7rem; color:var(--text-muted); display:block;">balsai</span>
        </td>
        <td style="text-align:center; font-family:monospace;">
          ${jScore !== null ? `
            <span class="badge" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#FFFFFF; font-weight:700; font-size:0.84rem; border-radius:2px;">
              ${jScore} / 10
            </span>
            <span style="font-size:0.68rem; color:var(--text-muted); display:block;">(${jCount} vert.)</span>
          ` : `
            <span style="font-size:0.75rem; color:var(--text-subtle);">Neįvertinta</span>
          `}
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-start;">
            <div style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">
              ${isWinner ? `
                <button type="button" class="badge badge-winner btn-edit-winner" data-film-id="${escapeHtml(film.id)}" title="Spustelėkite norėdami pakeisti laureato duomenis" style="display:inline-flex; align-items:center; gap:5px; cursor:pointer; border:1px solid rgba(52,211,153,0.45);">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                  <span>${escapeHtml(film.awardTitle || "Laureatas")}</span>
                </button>
              ` : `
                <span class="status-pill ${stageMeta.className}">
                  <span class="status-dot"></span>
                  <span>${escapeHtml(stageMeta.label)}</span>
                </span>
              `}
              ${juryPlaceBadge}
            </div>
            <button type="button" class="admin-switch-btn ${film.inVoting ? "active" : ""} btn-toggle-live-voting" data-film-id="${escapeHtml(film.id)}" data-voting="${film.inVoting ? "true" : "false"}" style="padding:2px 8px 2px 4px; font-size:0.7rem;" title="Įjungti arba išjungti filmą viešame balsavime gyvai">
              <span class="admin-switch-knob"></span>
              <span>${film.inVoting ? "Gyvai balsavime" : "Nepaskelbta bals."}</span>
            </button>
          </div>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:6px; flex-wrap:wrap; justify-content:flex-end;">
            <button type="button" class="btn-solid btn-xs btn-judge-eval" data-film-id="${escapeHtml(film.id)}">
              Vertinti (Komisija)
            </button>
            <button type="button" class="btn-outline btn-xs btn-edit-winner" data-film-id="${escapeHtml(film.id)}" style="${isWinner ? "color:#34D399; border-color:rgba(52,211,153,0.5);" : "color:#FFFFFF; border-color:rgba(255,255,255,0.28);"} border-radius:2px;">
              ${isWinner ? "Keisti laureatą" : "Laureatas / Statusas"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".btn-judge-eval").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetFilm = submissions.find((s) => s.id === btn.dataset.filmId);
      if (targetFilm) openJudgeEvalModal(targetFilm);
    });
  });

  tbody.querySelectorAll(".btn-edit-winner").forEach((btn) => {
    btn.addEventListener("click", () => {
      openWinnerEditModal(btn.dataset.filmId);
    });
  });

  tbody.querySelectorAll(".btn-toggle-live-voting").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const filmId = btn.dataset.filmId;
      const currentVoting = btn.dataset.voting === "true";
      await toggleLiveVotingStatus(filmId, !currentVoting, btn);
    });
  });
}

async function toggleLiveVotingStatus(filmId, nextVoting, btn) {
  const submissions = getSubmissionsList();
  const targetFilm = submissions.find((s) => s.id === filmId);
  if (!targetFilm) return;
  if (btn) btn.disabled = true;

  try {
    let fsSucceeded = false;
    let apiSucceeded = false;

    if (db && typeof db.collection === "function") {
      await db.collection("submissions").doc(filmId).update({
        inVoting: Boolean(nextVoting)
      });
      fsSucceeded = true;
    }

    if (await hasBackendServer()) {
      const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
      const res = await fetch("/api/admin/submissions/toggle-voting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: filmId, inVoting: Boolean(nextVoting), adminEmail: callerEmail })
      }).catch(() => null);
      if (res && res.ok) apiSucceeded = true;
    }

    if (!fsSucceeded && !apiSucceeded) {
      throw new Error("Nepavyko atnaujinti balsavimo būsenos");
    }

    targetFilm.inVoting = Boolean(nextVoting);
    renderVotingLeaderboard();
    window.dispatchEvent(new CustomEvent("submissions-updated", { detail: submissions }));
    showToast(nextVoting ? "Filmas įjungtas viešame balsavime gyvai!" : "Filmas išimtas iš viešo balsavimo.", "success");
  } catch (err) {
    showToast("Klaida keičiant balsavimo būseną: " + err.message, "error");
    if (btn) btn.disabled = false;
  }
}

function openJudgeEvalModal(film) {
  currentJudgeFilm = film;
  const modal = document.getElementById("judgeEvalModal");
  if (!modal) return;

  const participant = getParticipantName(film);
  document.getElementById("judgeEvalFilmTitle").textContent = film.filmTitle || film.title || "Filmo vertinimas";
  document.getElementById("judgeEvalAuthorMeta").textContent = `${participant}${film.category ? ` (${film.category})` : ""}`;

  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "";
  const currentUserName = sessionStorage.getItem("admin_user_name") || "Komisijos narys";

  document.getElementById("judgeEvalNameInput").value = currentUserName;

  const existing = (evaluationsData || []).find(
    (e) => e.filmId === film.id && String(e.judgeEmail || "").toLowerCase() === currentUserEmail.toLowerCase()
  );
  if (existing && existing.scores) {
    document.getElementById("scoreCreativity").value = existing.scores.creativity || 5;
    document.getElementById("scoreDirecting").value = existing.scores.directing || 5;
    document.getElementById("scoreCamera").value = existing.scores.cinematography || 5;
    document.getElementById("scoreSound").value = existing.scores.sound || 5;
    document.getElementById("scoreImpact").value = existing.scores.impact || 5;
    document.getElementById("judgeEvalNotes").value = existing.notes || "";
  } else {
    document.getElementById("scoreCreativity").value = 8;
    document.getElementById("scoreDirecting").value = 8;
    document.getElementById("scoreCamera").value = 8;
    document.getElementById("scoreSound").value = 8;
    document.getElementById("scoreImpact").value = 8;
    document.getElementById("judgeEvalNotes").value = "";
  }

  updateEvalCalculations();
  modal.classList.remove("d-none");
}

function updateEvalCalculations() {
  const c = Number(document.getElementById("scoreCreativity")?.value || 5);
  const d = Number(document.getElementById("scoreDirecting")?.value || 5);
  const cam = Number(document.getElementById("scoreCamera")?.value || 5);
  const s = Number(document.getElementById("scoreSound")?.value || 5);
  const imp = Number(document.getElementById("scoreImpact")?.value || 5);

  document.getElementById("valCreativity").textContent = c;
  document.getElementById("valDirecting").textContent = d;
  document.getElementById("valCamera").textContent = cam;
  document.getElementById("valSound").textContent = s;
  document.getElementById("valImpact").textContent = imp;

  const avg = ((c + d + cam + s + imp) / 5).toFixed(1);
  const avgElem = document.getElementById("judgeEvalAverageDisplay");
  if (avgElem) {
    avgElem.textContent = avg + " / 10";
  }
}

async function handleSaveJudgeEvaluation() {
  if (!currentJudgeFilm) return;

  const saveBtn = document.getElementById("saveJudgeEvalBtn");
  if (saveBtn) saveBtn.disabled = true;

  const judgeName = (document.getElementById("judgeEvalNameInput")?.value || "Komisijos narys").trim();
  const judgeEmail = (sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com").trim().toLowerCase();

  const scores = {
    creativity: Number(document.getElementById("scoreCreativity").value),
    directing: Number(document.getElementById("scoreDirecting").value),
    cinematography: Number(document.getElementById("scoreCamera").value),
    sound: Number(document.getElementById("scoreSound").value),
    impact: Number(document.getElementById("scoreImpact").value)
  };

  const averageScore = Number(
    ((scores.creativity + scores.directing + scores.cinematography + scores.sound + scores.impact) / 5).toFixed(1)
  );
  const notes = (document.getElementById("judgeEvalNotes")?.value || "").trim();
  const filmTitleVal = currentJudgeFilm.filmTitle || currentJudgeFilm.title || "Filmas";

  const safeEmailKey = judgeEmail.replace(/[^a-z0-9]/gi, "_");
  const docId = `${currentJudgeFilm.id}_${safeEmailKey}`;
  const evalRecord = {
    id: docId,
    filmId: currentJudgeFilm.id,
    filmTitle: filmTitleVal,
    judgeEmail,
    judgeName,
    scores,
    averageScore,
    notes,
    updatedAt: new Date().toISOString()
  };

  try {
    let fsSucceeded = false;
    let apiSucceeded = false;

    if (db && typeof db.collection === "function") {
      await db.collection("judge_evaluations").doc(docId).set(evalRecord, { merge: true });
      fsSucceeded = true;
    }

    if (await hasBackendServer()) {
      const res = await fetch("/api/admin/judge-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filmId: currentJudgeFilm.id,
          filmTitle: filmTitleVal,
          judgeEmail,
          judgeName,
          scores,
          notes
        })
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success) apiSucceeded = true;
      }
    }

    if (!fsSucceeded && !apiSucceeded) {
      throw new Error("Nepavyko išsaugoti vertinimo duomenų bazėje");
    }

    const idx = evaluationsData.findIndex(
      (e) => e.filmId === currentJudgeFilm.id && String(e.judgeEmail || "").toLowerCase() === judgeEmail
    );
    if (idx >= 0) {
      evaluationsData[idx] = evalRecord;
    } else {
      evaluationsData.push(evalRecord);
    }

    showToast(`Komisijos įvertinimas filmui „${filmTitleVal}“ (${averageScore}/10) išsaugotas gyvai!`, "success");
    document.getElementById("judgeEvalModal")?.classList.add("d-none");
    renderVotingMetrics();
    renderVotingLeaderboard();
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
  } catch (err) {
    showToast("Klaida saugant įvertinimą: " + err.message, "error");
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function initWinnerEditModal() {
  const modal = document.getElementById("winnerEditModal");
  if (!modal) return;

  const closeBtn = document.getElementById("closeWinnerEditModalBtn");
  const cancelBtn = document.getElementById("cancelWinnerEditModalBtn");
  const saveBtn = document.getElementById("saveWinnerEditBtn");
  const revokeBtn = document.getElementById("winnerEditRevokeBtn");
  const liveBtn = document.getElementById("winnerEditSendToLiveBtn");
  const statusSelect = document.getElementById("winnerEditStatus");
  const isWinnerCb = document.getElementById("winnerEditIsWinner");

  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.add("d-none"));
  if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.add("d-none"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("d-none");
  });

  if (isWinnerCb && statusSelect) {
    isWinnerCb.addEventListener("change", () => {
      if (isWinnerCb.checked) {
        statusSelect.value = "winner";
      } else if (statusSelect.value === "winner") {
        statusSelect.value = "final";
      }
    });
    statusSelect.addEventListener("change", () => {
      isWinnerCb.checked = statusSelect.value === "winner";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveWinnerEditModal);
  }
  if (revokeBtn) {
    revokeBtn.addEventListener("click", revokeWinnerFromModal);
  }
  if (liveBtn) {
    liveBtn.addEventListener("click", pushFilmToLiveBroadcast);
  }
}

export function openWinnerEditModal(filmId) {
  const modal = document.getElementById("winnerEditModal");
  const submissions = getSubmissionsList();
  const film = submissions.find((s) => s.id === filmId);
  if (!modal || !film) return;

  const participant = getParticipantName(film) || "Nenurodyta";
  const summaries = computeJudgeSummaries();
  const jSummary = summaries[film.id];
  const jText = jSummary ? `${jSummary.averageJudgeScore} / 10 (${jSummary.judgeCount} vert.)` : "Neįvertinta";
  const isWinner = film.isWinner === true || film.status === "winner";

  document.getElementById("winnerEditFilmId").value = film.id;
  document.getElementById("winnerEditFilmTitle").textContent = film.filmTitle || film.title || "Be pavadinimo";
  document.getElementById("winnerEditAuthorMeta").textContent = `${participant}${film.category ? ` • ${film.category}` : ""}`;
  document.getElementById("winnerEditMetricsBadge").textContent =
    `Žiūrovų balsai: ${Number(film.votesCount ?? film.votes ?? 0)} • Komisijos balas: ${jText}`;

  document.getElementById("winnerEditStatus").value = isWinner ? "winner" : (film.status || "final");
  document.getElementById("winnerEditYear").value = film.awardYear || getSubmissionYear(film) || "2027";
  document.getElementById("winnerEditAwardTitle").value = film.awardTitle || "";
  document.getElementById("winnerEditJuryPlace").value = film.juryPlace ? String(film.juryPlace) : "";
  document.getElementById("winnerEditInVoting").checked = film.inVoting === true;
  document.getElementById("winnerEditIsWinner").checked = isWinner;

  const revokeBtn = document.getElementById("winnerEditRevokeBtn");
  if (revokeBtn) revokeBtn.classList.toggle("d-none", !isWinner);

  modal.classList.remove("d-none");
}

async function saveWinnerEditModal() {
  const modal = document.getElementById("winnerEditModal");
  const saveBtn = document.getElementById("saveWinnerEditBtn");
  const filmId = document.getElementById("winnerEditFilmId")?.value;
  if (!filmId) return;

  const submissions = getSubmissionsList();
  const film = submissions.find((s) => s.id === filmId);

  const isWinner = Boolean(document.getElementById("winnerEditIsWinner")?.checked);
  const rawStatus = document.getElementById("winnerEditStatus")?.value || "final";
  const status = isWinner ? "winner" : (rawStatus === "winner" ? "final" : rawStatus);
  const inVoting = Boolean(document.getElementById("winnerEditInVoting")?.checked);
  const awardTitle = (document.getElementById("winnerEditAwardTitle")?.value || "").trim();
  const juryPlaceRaw = document.getElementById("winnerEditJuryPlace")?.value || "";
  const juryPlace = juryPlaceRaw ? Number(juryPlaceRaw) : null;
  const awardYear = document.getElementById("winnerEditYear")?.value || "2027";

  if (isWinner && !awardTitle) {
    showToast("Įveskite laureato nominaciją (pvz. „1-oji vieta“ arba „Grand Prix“).", "error");
    return;
  }

  if (saveBtn) saveBtn.disabled = true;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    let fsSucceeded = false;
    let apiSucceeded = false;

    if (db && typeof db.collection === "function") {
      const fv = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue
        : null;
      const updates = {
        status,
        isWinner,
        inVoting,
        awardYear
      };
      if (fv && typeof fv.serverTimestamp === "function") {
        updates.lastUpdated = fv.serverTimestamp();
      }
      if (isWinner) {
        updates.awardTitle = awardTitle;
      } else if (fv && typeof fv.delete === "function") {
        updates.awardTitle = fv.delete();
      }
      if (juryPlace) {
        updates.juryPlace = juryPlace;
      } else if (fv && typeof fv.delete === "function") {
        updates.juryPlace = fv.delete();
      }
      await db.collection("submissions").doc(filmId).update(updates);
      fsSucceeded = true;
    }

    if (await hasBackendServer()) {
      const endpoint = isWinner ? "/api/admin/declare-winner" : "/api/admin/submissions/update";
      const body = isWinner
        ? { filmId, awardTitle, juryPlace, year: awardYear, adminEmail: callerEmail }
        : { id: filmId, updates: { status, isWinner: false, inVoting, awardTitle: "", juryPlace: null }, adminEmail: callerEmail };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).catch(() => null);
      if (res && res.ok) apiSucceeded = true;
    }

    if (!fsSucceeded && !apiSucceeded) {
      throw new Error("Nepavyko išsaugoti pakeitimų duomenų bazėje");
    }

    if (film) {
      film.status = status;
      film.isWinner = isWinner;
      film.inVoting = inVoting;
      film.awardYear = awardYear;
      if (isWinner) film.awardTitle = awardTitle;
      else delete film.awardTitle;
      if (juryPlace) film.juryPlace = juryPlace;
      else delete film.juryPlace;
    }

    modal?.classList.add("d-none");
    renderVotingMetrics();
    renderVotingLeaderboard();
    window.dispatchEvent(new CustomEvent("submissions-updated", { detail: submissions }));
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
    showToast(isWinner ? `Laureatas atnaujintas gyvai: „${awardTitle}“!` : "Filmo statusas atnaujintas gyvai!", "success");
  } catch (err) {
    showToast("Klaida išsaugant pakeitimus: " + err.message, "error");
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function revokeWinnerFromModal() {
  const modal = document.getElementById("winnerEditModal");
  const revokeBtn = document.getElementById("winnerEditRevokeBtn");
  const filmId = document.getElementById("winnerEditFilmId")?.value;
  if (!filmId) return;

  if (revokeBtn) revokeBtn.disabled = true;

  try {
    const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
    let fsSucceeded = false;
    let apiSucceeded = false;

    if (db && typeof db.collection === "function") {
      const fv = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue
        : null;
      const revokeData = { isWinner: false, status: "final" };
      if (fv && typeof fv.delete === "function") {
        revokeData.awardTitle = fv.delete();
        revokeData.juryPlace = fv.delete();
      }
      await db.collection("submissions").doc(filmId).update(revokeData);
      fsSucceeded = true;
    }

    if (await hasBackendServer()) {
      const res = await fetch("/api/admin/revoke-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId, adminEmail: callerEmail })
      }).catch(() => null);
      if (res && res.ok) apiSucceeded = true;
    }

    if (!fsSucceeded && !apiSucceeded) {
      throw new Error("Nepavyko atšaukti laureato statuso");
    }

    const submissions = getSubmissionsList();
    const film = submissions.find((s) => s.id === filmId);
    if (film) {
      film.isWinner = false;
      film.status = "final";
      delete film.awardTitle;
      delete film.juryPlace;
    }

    modal?.classList.add("d-none");
    renderVotingMetrics();
    renderVotingLeaderboard();
    window.dispatchEvent(new CustomEvent("submissions-updated", { detail: submissions }));
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
    showToast("Laureato statusas nuimtas (filmas liko finale).", "success");
  } catch (err) {
    showToast("Klaida atšaukiant laureatą: " + err.message, "error");
  } finally {
    if (revokeBtn) revokeBtn.disabled = false;
  }
}

async function pushFilmToLiveBroadcast() {
  const filmId = document.getElementById("winnerEditFilmId")?.value;
  const submissions = getSubmissionsList();
  const film = submissions.find((s) => s.id === filmId);
  if (!film) return;

  const participant = getParticipantName(film) || "Autorius";
  const nowPlaying = {
    id: film.id,
    title: film.filmTitle || film.title || "Filmas",
    director: participant,
    category: film.category || "Bendroji",
    country: film.location || film.country || "Lietuva"
  };

  try {
    let saved = false;
    if (db && typeof db.collection === "function") {
      await db.collection("stream_config").doc("broadcast").set({
        nowPlaying,
        isPublicVisible: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      saved = true;
    }
    if (await hasBackendServer()) {
      const res = await fetch("/api/broadcast/overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nowPlaying, isPublicVisible: true })
      }).catch(() => null);
      if (res && res.ok) saved = true;
    }
    if (!saved) throw new Error("Nepavyko atnaujinti tiesioginio eterio");
    if (typeof window.refreshBroadcastOverlaySelects === "function") {
      window.refreshBroadcastOverlaySelects(submissions);
    }
    showToast(`„${nowPlaying.title}“ (${participant}) perduotas į tiesioginį eterį!`, "success");
  } catch (err) {
    showToast("Klaida siunčiant į eterį: " + err.message, "error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
