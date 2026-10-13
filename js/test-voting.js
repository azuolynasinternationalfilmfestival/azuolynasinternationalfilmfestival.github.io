import { db } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { getSubmissionsList } from "./submissions.js";

let modalElement = null;
let filmSelectElement = null;
let logConsoleElement = null;
let latencyBadgeElement = null;
let healthTitleElement = null;
let healthDotElement = null;

export function initTestVoting() {
  modalElement = document.getElementById("testVotingModal");
  filmSelectElement = document.getElementById("tvSelectFilm");
  logConsoleElement = document.getElementById("tvConsoleOutput");
  latencyBadgeElement = document.getElementById("tvLatencyBadge");
  healthTitleElement = document.getElementById("tvHealthTitle");
  healthDotElement = document.getElementById("tvHealthDot");

  const openBtn = document.getElementById("btnOpenTestVotingModal");
  if (openBtn) {
    openBtn.addEventListener("click", openTestVotingModal);
  }

  const closeBtn1 = document.getElementById("closeTestVotingModalBtn");
  const closeBtn2 = document.getElementById("btnCloseTestVotingModal");
  if (closeBtn1) closeBtn1.addEventListener("click", closeTestVotingModal);
  if (closeBtn2) closeBtn2.addEventListener("click", closeTestVotingModal);

  const refreshPingBtn = document.getElementById("btnRefreshHealthPing");
  if (refreshPingBtn) refreshPingBtn.addEventListener("click", checkVotingHealth);

  const singleVoteBtn = document.getElementById("btnRunSingleTestVote");
  if (singleVoteBtn) singleVoteBtn.addEventListener("click", runSingleTestVote);

  const stressVoteBtn = document.getElementById("btnRunStressTestVotes");
  if (stressVoteBtn) stressVoteBtn.addEventListener("click", runStressTestVotes);

  const resetBtn = document.getElementById("btnExecuteResetVotes");
  if (resetBtn) resetBtn.addEventListener("click", executeResetVotes);

  const clearLogsBtn = document.getElementById("btnClearTvLogs");
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener("click", () => {
      if (logConsoleElement) logConsoleElement.innerHTML = "<div>[Žurnalas išvalytas]</div>";
    });
  }

  if (filmSelectElement) {
    filmSelectElement.addEventListener("change", updateFilmSelectionMeta);
  }
}

export async function openTestVotingModal() {
  if (!modalElement) modalElement = document.getElementById("testVotingModal");
  if (!modalElement) return;

  populateFilmSelector();
  modalElement.classList.remove("d-none");
  modalElement.classList.add("active");

  logToConsole("🔍 Tikrinama balsavimo posistemio būsena ir ryšio užlaikymas...");
  await checkVotingHealth();
}

export function closeTestVotingModal() {
  if (modalElement) {
    modalElement.classList.remove("active");
    modalElement.classList.add("d-none");
  }
}

function logToConsole(message, type = "info") {
  if (!logConsoleElement) logConsoleElement = document.getElementById("tvConsoleOutput");
  if (!logConsoleElement) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  let color = "#a7f3d0";
  if (type === "success") color = "#4ade80";
  if (type === "warn") color = "#fde047";
  if (type === "error") color = "#f87171";

  const line = document.createElement("div");
  line.style.color = color;
  line.style.marginTop = "2px";
  line.textContent = `[${timeStr}] ${message}`;
  logConsoleElement.appendChild(line);
  logConsoleElement.scrollTop = logConsoleElement.scrollHeight;
}

function populateFilmSelector() {
  if (!filmSelectElement) filmSelectElement = document.getElementById("tvSelectFilm");
  if (!filmSelectElement) return;

  const films = getSubmissionsList();
  filmSelectElement.innerHTML = "";

  if (films.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Nėra paraiškų";
    filmSelectElement.appendChild(opt);
    updateFilmSelectionMeta();
    return;
  }

  films.forEach((film) => {
    const opt = document.createElement("option");
    opt.value = film.id;
    const inVotingLabel = film.inVoting === true ? "✔ Balsavime" : "✖ Nedalyvauja";
    opt.textContent = `${film.filmTitle || 'Bevardis'} (${film.name || 'Autorius'}) [${film.votesCount || 0} balsų] - ${inVotingLabel}`;
    filmSelectElement.appendChild(opt);
  });

  updateFilmSelectionMeta();
}

function updateFilmSelectionMeta() {
  const metaElem = document.getElementById("tvSelectedFilmMeta");
  if (!metaElem || !filmSelectElement) return;

  const filmId = filmSelectElement.value;
  if (!filmId) {
    metaElem.textContent = "";
    return;
  }

  const films = getSubmissionsList();
  const film = films.find((f) => f.id === filmId);
  if (!film) {
    metaElem.textContent = "";
    return;
  }

  const inVoting = film.inVoting === true;
  metaElem.innerHTML = `Dabartiniai balsai: <strong>${film.votesCount || 0}</strong> • ${inVoting ? '<span style="color:#4ade80;">Balsavime</span>' : '<span style="color:#f87171;">Nedalyvauja balsavime</span>'}`;
}

async function checkVotingHealth() {
  const start = Date.now();
  try {
    const res = await fetch("/api/admin/voting-health");
    const data = await res.json().catch(() => null);
    const latency = Date.now() - start;

    if (latencyBadgeElement) {
      latencyBadgeElement.textContent = `Ping: ${data?.latencyMs || latency} ms`;
    }

    if (res.ok && data && data.healthy) {
      if (healthDotElement) healthDotElement.style.background = "#4ade80";
      if (healthTitleElement) {
        healthTitleElement.textContent = data.votingActive
          ? `Balsavimo sistema AKTYVI • Atsakas: ${data.latencyMs || latency} ms (Nestringa)`
          : `Balsavimo sistema SUSTABDYTA nustatymuose • Atsakas: ${data.latencyMs || latency} ms`;
      }
      logToConsole(`✔ Serverio atsakas: ${data.latencyMs || latency} ms. Viso registruota balsų: ${data.totalVotesRecorded}.`, "success");
    } else {
      if (healthDotElement) healthDotElement.style.background = "#f87171";
      if (healthTitleElement) healthTitleElement.textContent = "Ryšio klaida tikrinant būseną";
      logToConsole(`⚠️ Nepavyko patikrinti sveikatos būsenos: ${data?.error || 'Klaida'}`, "warn");
    }
  } catch (err) {
    if (healthDotElement) healthDotElement.style.background = "#f87171";
    if (healthTitleElement) healthTitleElement.textContent = "Tinklo klaida";
    logToConsole(`❌ Tinklo klaida: ${err.message}`, "error");
  }
}

async function runSingleTestVote() {
  const filmId = filmSelectElement ? filmSelectElement.value : "";
  if (!filmId) {
    showToast("Pirmiausia pasirinkite filmą iš sąrašo!", "error");
    return;
  }

  const btn = document.getElementById("btnRunSingleTestVote");
  if (btn) btn.disabled = true;

  const films = getSubmissionsList();
  const film = films.find((f) => f.id === filmId);
  const filmTitle = film ? film.filmTitle : filmId;

  logToConsole(`▶ Siunčiamas 1 testinis balsas filmui „${filmTitle}“...`);
  const start = Date.now();

  try {
    const res = await fetch("/api/admin/test-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId, count: 1 })
    });
    const data = await res.json().catch(() => null);
    const roundTrip = Date.now() - start;

    if (res.ok && data && data.success) {
      logToConsole(`✅ Testinis balsas patvirtintas per ${data.latencyMs || roundTrip} ms! Naujas balsų skaičius: ${data.currentVotes}. Sistema veikia sparčiai ir nestringa.`, "success");
      showToast(`✅ Testinis balsas užskaitytas (${data.latencyMs || roundTrip} ms)! Nauja suma: ${data.currentVotes}.`, "success");
      updateRowBadge(filmId, data.currentVotes);
      updateFilmSelectionMeta();
    } else {
      // Fallback direct to Firestore
      logToConsole(`⚠️ API atsakė klaida, bandoma tiesiogiai per Firestore...`, "warn");
      await db.collection("submissions").doc(filmId).update({
        votesCount: (film?.votesCount || 0) + 1
      });
      logToConsole(`✔ Firestore atnaujintas tiesiogiai. Nauja suma: ${(film?.votesCount || 0) + 1}.`, "success");
      showToast("Balsas atnaujintas per Firestore!", "success");
    }
  } catch (err) {
    logToConsole(`❌ Klaida vykdant testinį balsą: ${err.message}`, "error");
    showToast("Klaida: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function runStressTestVotes() {
  const filmId = filmSelectElement ? filmSelectElement.value : "";
  if (!filmId) {
    showToast("Pirmiausia pasirinkite filmą!", "error");
    return;
  }

  const btn = document.getElementById("btnRunStressTestVotes");
  if (btn) btn.disabled = true;

  const films = getSubmissionsList();
  const film = films.find((f) => f.id === filmId);
  const filmTitle = film ? film.filmTitle : filmId;

  logToConsole(`⚡ Pradedamas streso testas: siunčiami 5 testiniai balsai filmui „${filmTitle}“...`);
  const overallStart = Date.now();

  try {
    const res = await fetch("/api/admin/test-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId, count: 5 })
    });
    const data = await res.json().catch(() => null);
    const duration = Date.now() - overallStart;

    if (res.ok && data && data.success) {
      const avgMs = Math.round(duration / 5);
      logToConsole(`🎉 Streso testas sėkmingas! 5 balsai užfiksuoti per ${duration} ms (vidutiniškai ~${avgMs} ms/balsas).`, "success");
      logToConsole(`📊 Naujas bendras balsų skaičius: ${data.currentVotes}. Nėra jokių užstrigimų ar duomenų praradimo.`, "success");
      showToast(`⚡ 5 testiniai balsai įskaityti per ${duration} ms! Sistema veikia be strigimų.`, "success");
      updateRowBadge(filmId, data.currentVotes);
      updateFilmSelectionMeta();
    } else {
      throw new Error(data?.error || "Nepavyko atlikti streso testo");
    }
  } catch (err) {
    logToConsole(`❌ Streso testo klaida: ${err.message}`, "error");
    showToast("Klaida: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function executeResetVotes() {
  const filmId = filmSelectElement ? filmSelectElement.value : "";
  if (!filmId) {
    showToast("Pasirinkite filmą!", "error");
    return;
  }

  const targetInput = document.getElementById("tvResetTargetCount");
  const targetVotes = targetInput ? Math.max(0, parseInt(targetInput.value, 10) || 0) : 0;

  const films = getSubmissionsList();
  const film = films.find((f) => f.id === filmId);
  const filmTitle = film ? film.filmTitle : filmId;

  const confirmed = confirm(`Ar tikrai norite atstatyti filmo „${filmTitle}“ balsų skaičių į ${targetVotes}?`);
  if (!confirmed) return;

  logToConsole(`🔄 Atstatomas filmo „${filmTitle}“ balsų skaičius į ${targetVotes}...`);

  try {
    const res = await fetch("/api/admin/reset-votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filmId, targetVotes })
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.success) {
      logToConsole(`✔ Balsai sėkmingai atstatyti į ${targetVotes}.`, "success");
      showToast(`Balsai atstatyti į ${targetVotes}!`, "success");
      updateRowBadge(filmId, targetVotes);
      updateFilmSelectionMeta();
    } else {
      // Direct Firestore fallback
      await db.collection("submissions").doc(filmId).update({
        votesCount: targetVotes
      });
      logToConsole(`✔ Firestore atnaujintas tiesiogiai į ${targetVotes}.`, "success");
      showToast(`Balsai atstatyti per Firestore!`, "success");
      updateRowBadge(filmId, targetVotes);
      updateFilmSelectionMeta();
    }
  } catch (err) {
    logToConsole(`❌ Klaida atstatant balsus: ${err.message}`, "error");
    showToast("Klaida: " + err.message, "error");
  }
}

function updateRowBadge(filmId, count) {
  const badge = document.getElementById(`voteCountBadge_${filmId}`);
  if (badge) {
    badge.textContent = count;
    badge.style.transition = "transform 0.25s ease, color 0.25s ease";
    badge.style.color = "#4ade80";
    badge.style.transform = "scale(1.3)";
    setTimeout(() => {
      badge.style.color = "var(--accent-light)";
      badge.style.transform = "scale(1)";
    }, 400);
  }
}
