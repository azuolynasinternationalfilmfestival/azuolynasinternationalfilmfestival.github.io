/**
 * js/stream-admin.js
 * Cloudflare Stream, OBS, RSVP & Remote Participant Token Management
 * Ąžuolynas International Film Festival Admin
 */

import { showToast } from "./ui-feedback.js";

let streamConfig = null;
let allSubmissions = [];
let activeViewerCount = 0;

export function initStreamAdmin() {
  // 1. Stream State Buttons
  const btnSetLive = document.getElementById("btnSetStreamLive");
  const btnSetPaused = document.getElementById("btnSetStreamPaused");
  const btnSetEnded = document.getElementById("btnSetStreamEnded");

  if (btnSetLive) {
    btnSetLive.addEventListener("click", () => updateStreamState("live"));
  }
  if (btnSetPaused) {
    btnSetPaused.addEventListener("click", () => updateStreamState("paused"));
  }
  if (btnSetEnded) {
    btnSetEnded.addEventListener("click", () => updateStreamState("ended"));
  }

  // 2. Copy helper buttons for OBS parameters
  setupCopyButtons();

  // 3. Search and filter for participants
  const searchInput = document.getElementById("filterStreamRsvpSearch");
  if (searchInput) {
    searchInput.addEventListener("input", renderRsvpTable);
  }

  const typeFilter = document.getElementById("filterStreamRsvpType");
  if (typeFilter) {
    typeFilter.addEventListener("change", renderRsvpTable);
  }

  // 4. Refresh button
  const refreshBtn = document.getElementById("btnRefreshStreamAdmin");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinama transliacijos ir RSVP informacija...");
      loadStreamData();
    });
  }

  // Initial load
  loadStreamData();

  // Polling every 15 seconds for viewer count and updates
  setInterval(pollStreamStats, 15000);
}

export async function loadStreamData() {
  await Promise.all([
    fetchStreamStatus(),
    fetchSubmissionsList(),
    fetchViewerCount()
  ]);
  renderStreamControls();
  renderRsvpTable();
}

async function fetchStreamStatus() {
  try {
    const res = await fetch("/api/live/status");
    if (res.ok) {
      streamConfig = await res.json();
    }
  } catch (err) {
    console.warn("Klaida gaunant transliacijos būseną:", err);
  }
}

async function fetchSubmissionsList() {
  try {
    const res = await fetch("/api/admin/submissions");
    if (res.ok) {
      const data = await res.json();
      allSubmissions = data.submissions || [];
    }
  } catch (err) {
    console.warn("Klaida gaunant dalyvių sąrašą:", err);
  }
}

async function fetchViewerCount() {
  try {
    const res = await fetch("/api/admin/live/viewers");
    if (res.ok) {
      const data = await res.json();
      activeViewerCount = data.activeViewers || 0;
    }
  } catch (err) {
    console.warn("Klaida gaunant žiūrovų skaičių:", err);
  }
}

async function pollStreamStats() {
  try {
    const res = await fetch("/api/admin/live/viewers");
    if (res.ok) {
      const data = await res.json();
      activeViewerCount = data.activeViewers || 0;
      const viewerElem = document.getElementById("statStreamLiveViewers");
      if (viewerElem) viewerElem.textContent = activeViewerCount;
    }
  } catch {
    // Silent polling
  }
}

function renderStreamControls() {
  if (!streamConfig) return;

  const badge = document.getElementById("streamStateBadge");
  const state = streamConfig.streamState || (streamConfig.isLive ? "live" : "paused");

  if (badge) {
    if (state === "live") {
      badge.className = "status-pill status-accepted";
      badge.innerHTML = `<span class="pulse-dot" style="width:6px; height:6px;"></span><span>LIVE Transliacija Aktyvi</span>`;
    } else if (state === "paused") {
      badge.className = "status-pill";
      badge.style.background = "rgba(245, 158, 11, 0.2)";
      badge.style.color = "#fbbf24";
      badge.style.border = "1px solid rgba(245, 158, 11, 0.4)";
      badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>PAUSED Pristabdyta</span>`;
    } else {
      badge.className = "status-pill status-rejected";
      badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg><span>ENDED Pasibaigusi</span>`;
    }
  }

  // Update OBS inputs if present
  const serverInput = document.getElementById("obsServerUrlInput");
  if (serverInput) serverInput.value = streamConfig.serverUrl || "rtmps://live.cloudflare.com:443/live/";

  const keyInput = document.getElementById("obsStreamKeyInput");
  if (keyInput) keyInput.value = streamConfig.streamKey || "6561bd7efd0ad61e9040a08676049c4dk937d1a8b2c545a980c9fabc8502d8af4";

  // Active viewers metric
  const viewerElem = document.getElementById("statStreamLiveViewers");
  if (viewerElem) viewerElem.textContent = activeViewerCount;
}

export function renderRsvpTable() {
  const tableBody = document.getElementById("streamRsvpTableBody");
  if (!tableBody) return;

  const searchVal = (document.getElementById("filterStreamRsvpSearch")?.value || "").toLowerCase().trim();
  const typeFilter = document.getElementById("filterStreamRsvpType")?.value || "all";

  // Calculate metrics
  let inPersonCount = 0;
  let remoteCount = 0;
  allSubmissions.forEach(sub => {
    if (sub.attendanceType === "in_person") {
      inPersonCount++;
    } else {
      remoteCount++;
    }
  });

  const total = allSubmissions.length;
  const inPersonElem = document.getElementById("statStreamInPerson");
  if (inPersonElem) inPersonElem.textContent = inPersonCount;

  const remoteElem = document.getElementById("statStreamRemote");
  if (remoteElem) remoteElem.textContent = remoteCount;

  const totalElem = document.getElementById("statStreamTotalRsvp");
  if (totalElem) totalElem.textContent = total;

  // Filter
  const filtered = allSubmissions.filter(sub => {
    if (typeFilter === "remote" && sub.attendanceType !== "remote") return false;
    if (typeFilter === "in_person" && sub.attendanceType !== "in_person") return false;

    if (searchVal) {
      const matchName = (sub.name || "").toLowerCase().includes(searchVal);
      const matchEmail = (sub.email || "").toLowerCase().includes(searchVal);
      const matchFilm = (sub.filmTitle || "").toLowerCase().includes(searchVal);
      const matchToken = (sub.liveToken || "").toLowerCase().includes(searchVal);
      const matchLoc = (sub.location || "").toLowerCase().includes(searchVal);
      if (!matchName && !matchEmail && !matchFilm && !matchToken && !matchLoc) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px 16px; color:var(--text-muted);">
          Dalyvių pagal pasirinktus kriterijus nerasta.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(sub => {
    const isRemote = sub.attendanceType === "remote";
    const rsvpBadge = isRemote
      ? `<span class="badge" style="background:rgba(59,130,246,0.18); color:#60a5fa; border:1px solid rgba(59,130,246,0.35); display:inline-flex; align-items:center; gap:5px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg><span>Nuotolinis</span></span>`
      : `<span class="badge" style="background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(34,197,94,0.35); display:inline-flex; align-items:center; gap:5px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg><span>Gyvai vietoje</span></span>`;

    const token = sub.liveToken || "—";
    const liveLink = sub.liveStreamUrl || `https://azuolynasinternationalfilmfestival.github.io/live.html?token=${encodeURIComponent(token)}`;

    return `
      <tr>
        <td>
          <strong style="color:var(--text-color);">${escapeHtml(sub.name || 'Dalyvis')}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(sub.institution || sub.location || '')}</div>
        </td>
        <td>
          <a href="mailto:${escapeHtml(sub.email)}" style="color:var(--accent-light); font-size:0.85rem;">
            ${escapeHtml(sub.email)}
          </a>
        </td>
        <td>
          <span style="font-family:var(--font-cinema); color:var(--text-color); font-weight:600;">
            ${escapeHtml(sub.filmTitle || '—')}
          </span>
          <div style="font-size:0.74rem; color:var(--text-muted);">${escapeHtml(sub.category || '')}</div>
        </td>
        <td>${rsvpBadge}</td>
        <td>
          <code style="background:rgba(0,0,0,0.35); padding:3px 8px; border-radius:4px; color:#F3E5AB; font-size:0.8rem; border:1px solid rgba(212,175,55,0.25);">
            ${escapeHtml(token)}
          </code>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="text" readonly value="${escapeHtml(liveLink)}" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-muted); padding:3px 6px; font-size:0.75rem; width:150px; border-radius:4px;" title="${escapeHtml(liveLink)}">
            <button type="button" class="btn-outline btn-xs btn-copy-link" data-link="${escapeHtml(liveLink)}" title="Kopijuoti nuorodą" style="display:inline-flex; align-items:center; gap:4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Kopijuoti</span>
            </button>
          </div>
        </td>
        <td>
          <button type="button" class="btn-solid btn-xs btn-resend-token" data-sub-id="${escapeHtml(sub.id)}" title="Išsiųsti el. laišką su žetonu ir nuoroda" style="display:inline-flex; align-items:center; gap:5px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>Siųsti el. laišką</span>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach event handlers
  tableBody.querySelectorAll(".btn-copy-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const link = btn.getAttribute("data-link");
      if (link) {
        navigator.clipboard.writeText(link).then(() => {
          showToast("Nuoroda nukopijuota į iškarpinę!");
        }).catch(() => {
          prompt("Nukopijuokite tiesioginės transliacijos nuorodą:", link);
        });
      }
    });
  });

  tableBody.querySelectorAll(".btn-resend-token").forEach(btn => {
    btn.addEventListener("click", () => {
      const subId = btn.getAttribute("data-sub-id");
      resendLiveTokenEmail(subId);
    });
  });
}

async function updateStreamState(newState) {
  try {
    showToast(`Keičiama transliacijos būsena į: ${newState.toUpperCase()}...`);
    const res = await fetch("/api/admin/stream/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState })
    });
    if (res.ok) {
      const data = await res.json();
      streamConfig = data.streamConfig;
      renderStreamControls();
      showToast(`Transliacijos būsena sėkmingai atnaujinta į ${newState.toUpperCase()}`);
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      const err = await res.json();
      showToast(err.error || "Nepavyko atnaujinti transliacijos būsenos", "error");
    }
  } catch (err) {
    showToast("Serverio ryšio klaida", "error");
  }
}

async function resendLiveTokenEmail(submissionId) {
  try {
    showToast("Siunčiamas el. laiškas dalyviui...");
    const res = await fetch("/api/admin/resend-live-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId })
    });
    if (res.ok) {
      showToast("El. laiškas su žetonu ir transliacijos nuoroda sėkmingai išsiųstas!");
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      const err = await res.json();
      showToast(err.error || "Klaida siunčiant laišką", "error");
    }
  } catch (err) {
    showToast("Serverio ryšio klaida", "error");
  }
}

function setupCopyButtons() {
  const copyServerBtn = document.getElementById("btnCopyObsServer");
  if (copyServerBtn) {
    copyServerBtn.addEventListener("click", () => {
      const val = document.getElementById("obsServerUrlInput")?.value || "rtmps://live.cloudflare.com:443/live/";
      navigator.clipboard.writeText(val).then(() => showToast("OBS Server URL nukopijuotas!"));
    });
  }

  const copyKeyBtn = document.getElementById("btnCopyObsKey");
  if (copyKeyBtn) {
    copyKeyBtn.addEventListener("click", () => {
      const val = document.getElementById("obsStreamKeyInput")?.value || "6561bd7efd0ad61e9040a08676049c4dk937d1a8b2c545a980c9fabc8502d8af4";
      navigator.clipboard.writeText(val).then(() => showToast("OBS Stream Key nukopijuotas!"));
    });
  }

  const copyIframeBtn = document.getElementById("btnCopyStreamIframe");
  if (copyIframeBtn) {
    copyIframeBtn.addEventListener("click", () => {
      const code = `<div style="position: relative; padding-top: 56.25%;">
  <iframe
    src="https://customer-auu36r7owuzogvfb.cloudflarestream.com/937d1a8b2c545a980c9fabc8502d8af4/iframe"
    style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true"
  ></iframe>
</div>`;
      navigator.clipboard.writeText(code).then(() => showToast("Cloudflare Stream iframe kodas nukopijuotas!"));
    });
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
