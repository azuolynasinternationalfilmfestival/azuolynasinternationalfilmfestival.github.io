/**
 * voting-analytics.js
 * Real Voting Management, Jury Evaluation Console & In-Depth Analytics
 * Ąžuolynas International Film Festival
 */

import { showToast } from "./ui-feedback.js";
import { getSubmissionsList } from "./submissions.js";

let evaluationsData = [];
let analyticsSummary = null;
let currentJudgeFilm = null;

export function initVotingAnalytics() {
  const saveEvalBtn = document.getElementById("saveJudgeEvalBtn");
  if (saveEvalBtn) {
    saveEvalBtn.addEventListener("click", handleSaveJudgeEvaluation);
  }

  const closeJudgeModalBtn = document.getElementById("closeJudgeEvalModalBtn");
  const cancelJudgeModalBtn = document.getElementById("cancelJudgeEvalModalBtn");
  const modal = document.getElementById("judgeEvalModal");

  if (closeJudgeModalBtn && modal) {
    closeJudgeModalBtn.addEventListener("click", () => modal.classList.add("d-none"));
  }
  if (cancelJudgeModalBtn && modal) {
    cancelJudgeModalBtn.addEventListener("click", () => modal.classList.add("d-none"));
  }

  // Setup score slider listeners to update average score dynamically
  ["scoreCreativity", "scoreDirecting", "scoreCamera", "scoreSound", "scoreImpact"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("input", updateEvalCalculations);
    }
  });

  const filterCategory = document.getElementById("filterVotingAnalyticsCategory");
  if (filterCategory) {
    filterCategory.addEventListener("change", renderVotingLeaderboard);
  }

  const refreshBtn = document.getElementById("btnRefreshVotingAnalytics");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      showToast("Atnaujinama balsavimo analitika...");
      await loadVotingAnalytics();
    });
  }

  loadVotingAnalytics();
}

export async function loadVotingAnalytics() {
  try {
    const [evalsRes, analyticsRes] = await Promise.all([
      fetch("/api/admin/judge-evaluations"),
      fetch("/api/admin/voting-analytics")
    ]);

    if (evalsRes.ok) {
      const data = await evalsRes.json();
      evaluationsData = data.evaluations || [];
    }

    if (analyticsRes.ok) {
      analyticsSummary = await analyticsRes.json();
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

  const totalAudience = analyticsSummary ? analyticsSummary.totalAudienceVotes || 0 : 0;
  const totalEvals = (evaluationsData || []).length;

  if (statAudienceVotes) statAudienceVotes.textContent = totalAudience;
  if (statJudgeEvals) statJudgeEvals.textContent = totalEvals;

  if (evaluationsData.length > 0) {
    const avg = evaluationsData.reduce((acc, e) => acc + (e.averageScore || 0), 0) / evaluationsData.length;
    if (statAvgScore) statAvgScore.textContent = avg.toFixed(1) + " / 10";
  } else if (statAvgScore) {
    statAvgScore.textContent = "—";
  }

  // Determine top film from submissions or votes
  const submissions = getSubmissionsList();
  if (submissions.length > 0 && statTopFilm) {
    const sorted = [...submissions].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    statTopFilm.textContent = sorted[0].title || "—";
  }
}

export function renderVotingLeaderboard() {
  const tbody = document.getElementById("votingLeaderboardBody");
  if (!tbody) return;

  const submissions = getSubmissionsList();
  const catFilter = document.getElementById("filterVotingAnalyticsCategory")?.value || "all";

  let list = submissions.filter(s => {
    if (s.inVoting === false && s.status !== "winner") return false; // In competition
    if (catFilter !== "all" && s.category !== catFilter) return false;
    return true;
  });

  const judgeSummaries = analyticsSummary ? analyticsSummary.judgeSummaries || {} : {};

  // Sort by combined score or public votes
  list.sort((a, b) => {
    const aVotes = Number(a.votes || 0);
    const bVotes = Number(b.votes || 0);
    const aJudge = judgeSummaries[a.id]?.averageJudgeScore || 0;
    const bJudge = judgeSummaries[b.id]?.averageJudgeScore || 0;
    return (bVotes + bJudge * 10) - (aVotes + aJudge * 10);
  });

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          Šiuo metu nėra filmų, dalyvaujančių balsavimo atrankoje. Pažymėkite paraiškas varnele „Dalyvauja balsavime“.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((film, index) => {
    const jSummary = judgeSummaries[film.id];
    const jScore = jSummary ? jSummary.averageJudgeScore : null;
    const jCount = jSummary ? jSummary.judgeCount : 0;
    const isWinner = film.status === "winner";

    return `
      <tr>
        <td style="font-weight:700; color:${index === 0 ? '#F3E5AB' : index === 1 ? '#cbd5e1' : index === 2 ? '#fbbf24' : 'var(--text-muted)'}; width:40px; text-align:center;">
          #${index + 1}
        </td>
        <td>
          <div style="font-weight:600; color:var(--text-color); font-family:var(--font-cinema); font-size:0.96rem;">
            ${escapeHtml(film.title)}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(film.author || '')} &bull; ${escapeHtml(film.school || '')}</div>
        </td>
        <td>
          <span class="badge" style="background:rgba(111,165,138,0.15); color:var(--accent-light); font-size:0.72rem;">
            ${escapeHtml(film.category || 'Nenurodyta')}
          </span>
        </td>
        <td style="text-align:center; font-weight:700; color:var(--accent-light);">
          <span style="font-size:1.05rem;">${film.votes || 0}</span>
          <span style="font-size:0.72rem; color:var(--text-muted); display:block;">balsai</span>
        </td>
        <td style="text-align:center;">
          ${jScore !== null ? `
            <span class="badge" style="background:rgba(212,175,55,0.2); color:#F3E5AB; font-weight:700; font-size:0.85rem;">
              ${jScore} / 10
            </span>
            <span style="font-size:0.7rem; color:var(--text-muted); display:block;">(${jCount} teisėjai)</span>
          ` : `
            <span style="font-size:0.75rem; color:var(--text-subtle);">Neįvertinta</span>
          `}
        </td>
        <td>
          ${isWinner ? `
            <span class="badge badge-winner" style="display:inline-flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg><span>${escapeHtml(film.awardTitle || 'Laureatas')}</span></span>
          ` : `
            <span class="badge badge-accepted">Balsavime</span>
          `}
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:6px;">
            <button type="button" class="btn-solid btn-xs btn-judge-eval" data-film-id="${film.id}">
              Vertinti (Komisija)
            </button>
            ${!isWinner ? `
              <button type="button" class="btn-outline btn-xs btn-declare-winner" data-film-id="${film.id}" style="color:#F3E5AB; border-color:#D4AF37;">
                Paskelbti laimėtoju
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Attach buttons
  tbody.querySelectorAll(".btn-judge-eval").forEach(btn => {
    btn.addEventListener("click", () => {
      const filmId = btn.dataset.filmId;
      const targetFilm = submissions.find(s => s.id === filmId);
      if (targetFilm) {
        openJudgeEvalModal(targetFilm);
      }
    });
  });

  tbody.querySelectorAll(".btn-declare-winner").forEach(btn => {
    btn.addEventListener("click", async () => {
      const filmId = btn.dataset.filmId;
      const award = prompt("Įveskite laimėtojo nominaciją (pvz. „1-oji vieta“ arba „Žiūrovų simpatijų prizas“):", "Žiūrovų simpatijų laureatas");
      if (award) {
        await declareWinnerAction(filmId, award);
      }
    });
  });
}

function openJudgeEvalModal(film) {
  currentJudgeFilm = film;
  const modal = document.getElementById("judgeEvalModal");
  if (!modal) return;

  document.getElementById("judgeEvalFilmTitle").textContent = film.title || "Filmo vertinimas";
  document.getElementById("judgeEvalAuthorMeta").textContent = `${film.author || ''} (${film.category || ''})`;

  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "teisejas.komisija@gmail.com";
  const currentUserName = sessionStorage.getItem("admin_user_name") || "Komisijos narys";

  document.getElementById("judgeEvalNameInput").value = currentUserName;

  // Check if existing evaluation
  const existing = (evaluationsData || []).find(e => e.filmId === film.id && e.judgeEmail.toLowerCase() === currentUserEmail.toLowerCase());
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

  const judgeName = (document.getElementById("judgeEvalNameInput")?.value || "Komisijos narys").trim();
  const judgeEmail = sessionStorage.getItem("admin_user_email") || "teisejas.komisija@gmail.com";

  const scores = {
    creativity: Number(document.getElementById("scoreCreativity").value),
    directing: Number(document.getElementById("scoreDirecting").value),
    cinematography: Number(document.getElementById("scoreCamera").value),
    sound: Number(document.getElementById("scoreSound").value),
    impact: Number(document.getElementById("scoreImpact").value)
  };

  const notes = (document.getElementById("judgeEvalNotes")?.value || "").trim();

  try {
    const res = await fetch("/api/admin/judge-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filmId: currentJudgeFilm.id,
        filmTitle: currentJudgeFilm.title,
        judgeEmail,
        judgeName,
        scores,
        notes
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Įvertinimas filmui „${currentJudgeFilm.title}“ išsaugotas!`, "success");
      document.getElementById("judgeEvalModal").classList.add("d-none");
      await loadVotingAnalytics();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      showToast("Nepavyko išsaugoti: " + (data.error || "Klaida"), "error");
    }
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  }
}

async function declareWinnerAction(filmId, awardTitle) {
  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
  try {
    const res = await fetch("/api/admin/declare-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filmId,
        awardTitle,
        year: "2026",
        adminEmail: currentUserEmail
      })
    });

    if (res.ok) {
      showToast(`Filmas paskelbtas laureatu: „${awardTitle}“!`, "success");
      await loadVotingAnalytics();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    }
  } catch (err) {
    showToast("Klaida skelbiant laureatą: " + err.message, "error");
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
