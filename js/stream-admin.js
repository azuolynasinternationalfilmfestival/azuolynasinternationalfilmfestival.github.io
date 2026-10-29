/**
 * js/stream-admin.js
 * Cloudflare Stream Live Preview, OBS Parameters, Viewer Signed Tokens & RSVP
 * Ąžuolynas International Film Festival Admin
 */

import { showToast } from "./ui-feedback.js";

let streamConfig = null;
let allSubmissions = [];
let authorizedViewers = [];
let activeViewerCount = 0;

export function initStreamAdmin() {
  // 1. Stream State Buttons
  const btnSetLive = document.getElementById("btnSetStreamLive");
  const btnSetPaused = document.getElementById("btnSetStreamPaused");
  const btnSetEnded = document.getElementById("btnSetStreamEnded");

  if (btnSetLive) btnSetLive.addEventListener("click", () => updateStreamState("live"));
  if (btnSetPaused) btnSetPaused.addEventListener("click", () => updateStreamState("paused"));
  if (btnSetEnded) btnSetEnded.addEventListener("click", () => updateStreamState("ended"));

  // 2. Setup OBS copy buttons
  setupCopyButtons();

  // 3. Search and filter for participants
  const searchInput = document.getElementById("filterStreamRsvpSearch");
  if (searchInput) searchInput.addEventListener("input", renderRsvpTable);

  const typeFilter = document.getElementById("filterStreamRsvpType");
  if (typeFilter) typeFilter.addEventListener("change", renderRsvpTable);

  // 4. Search and filter for authorized signed viewers
  const viewerSearchInput = document.getElementById("filterSignedViewersSearch");
  if (viewerSearchInput) viewerSearchInput.addEventListener("input", renderAuthorizedViewersTable);

  const viewerTypeFilter = document.getElementById("filterSignedViewersType");
  if (viewerTypeFilter) viewerTypeFilter.addEventListener("change", renderAuthorizedViewersTable);

  // 5. Classroom vs Individual Radio Handlers
  initViewerTypeToggles();

  // 6. Bulk Classroom Tokens Drawer & Actions
  initBulkClassroomHandlers();

  // 7. QR Modal Actions
  initTokenQrModalHandlers();

  // 8. Add Viewer & Generate Signed Token Form
  initViewerTokenForm();

  // 9. Iframe URL edit & save handlers
  initStreamIframeUrlControls();

  // 10. Refresh button
  const refreshBtn = document.getElementById("btnRefreshStreamAdmin");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinama transliacijos ir žiūrovų informacija...");
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
    fetchAuthorizedViewers(),
    fetchViewerCount()
  ]);
  renderStreamControls();
  renderLivePreviewIframe();
  renderAuthorizedViewersTable();
  renderRsvpTable();
}

async function fetchStreamStatus() {
  try {
    const res = await FirebaseClient.request("live.status");
    if (res.ok) {
      streamConfig = await res.json();
    }
  } catch (err) {
    console.warn("Klaida gaunant transliacijos būseną:", err);
  }
}

async function fetchSubmissionsList() {
  try {
    const res = await FirebaseClient.request("submissions");
    if (res.ok) {
      const data = await res.json();
      allSubmissions = data.submissions || [];
    }
  } catch (err) {
    console.warn("Klaida gaunant dalyvių sąrašą:", err);
  }
}

async function fetchAuthorizedViewers() {
  try {
    const res = await FirebaseClient.request("stream.viewers");
    if (res.ok) {
      const data = await res.json();
      authorizedViewers = data.viewers || [];
    }
  } catch (err) {
    console.warn("Klaida gaunant autorizuotų žiūrovų sąrašą:", err);
  }
}

async function fetchViewerCount() {
  try {
    const res = await FirebaseClient.request("live.viewers");
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
    const res = await FirebaseClient.request("live.viewers");
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

function renderLivePreviewIframe() {
  const iframeContainer = document.getElementById("adminStreamLiveIframeContainer");
  const iframeEl = document.getElementById("adminStreamLiveIframe");
  if (!iframeContainer || !streamConfig) return;

  const defaultIframeUrl = "https://customer-auu36r7owuzogvfb.cloudflarestream.com/937d1a8b2c545a980c9fabc8502d8af4/iframe";
  const url = streamConfig.iframeUrl || defaultIframeUrl;

  if (iframeEl && iframeEl.getAttribute("src") !== url) {
    iframeEl.setAttribute("src", url);
  }

  const inputEl = document.getElementById("adminStreamIframeUrlInput");
  if (inputEl && document.activeElement !== inputEl && inputEl.dataset.edited !== "true") {
    inputEl.value = url;
  }

  const permSelect = document.getElementById("adminStreamViewPermissionSelect");
  if (permSelect && streamConfig.viewPermission) {
    permSelect.value = streamConfig.viewPermission;
  }

  const permDisplay = document.getElementById("lblCurrentViewPermissionDisplay");
  if (permDisplay) {
    const permLabels = {
      token_only: "Token Only (Tik su žetonu)",
      public: "Vieša transliacija (Public)",
      restricted: "Apribota (Tik admin/žiuri)"
    };
    permDisplay.textContent = permLabels[streamConfig.viewPermission] || streamConfig.viewPermission || "Token Only";
  }

  const displayEl = document.getElementById("lblCurrentIframeUrlDisplay");
  if (displayEl) {
    displayEl.textContent = url.length > 60 ? (url.slice(0, 57) + "...") : url;
    displayEl.title = url;
  }
}

function initStreamIframeUrlControls() {
  const btnSaveIframe = document.getElementById("btnSaveStreamIframeUrl");
  const btnResetIframe = document.getElementById("btnResetStreamIframeUrl");
  const inputIframe = document.getElementById("adminStreamIframeUrlInput");
  const selectPermission = document.getElementById("adminStreamViewPermissionSelect");
  const form = document.getElementById("streamIframeUrlForm");

  inputIframe?.addEventListener("input", () => { inputIframe.dataset.edited = "true"; });

  if (form && btnSaveIframe && inputIframe) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newUrl = inputIframe.value.trim();
      const viewPermission = selectPermission ? selectPermission.value : (streamConfig?.viewPermission || "token_only");
      if (!newUrl) {
        showToast("Įveskite galiojančią iframe nuorodą", "error");
        return;
      }
      btnSaveIframe.disabled = true;
      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        const res = await FirebaseClient.request("stream.iframe-url", {
          method: "POST",
          body: {
            iframeUrl: newUrl,
            viewPermission,
            adminEmail: callerEmail
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Iframe nuoroda ir prieigos teisės sėkmingai atnaujintos!", "success");
          streamConfig = {
            ...streamConfig,
            iframeUrl: data.iframeUrl,
            viewPermission: data.viewPermission || viewPermission
          };
          inputIframe.dataset.edited = "false";
          renderLivePreviewIframe();
          renderStreamControls();
        } else {
          showToast("Klaida saugant nustatymus: " + (data.error || "Serverio klaida"), "error");
        }
      } catch (err) {
        showToast("Tinklo klaida: " + err.message, "error");
      } finally {
        btnSaveIframe.disabled = false;
      }
    });
  }

  // OBS configuration form
  const obsForm = document.getElementById("obsStreamSettingsForm");
  if (obsForm) {
    obsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const serverUrl = document.getElementById("obsServerUrlInput")?.value.trim();
      const streamKey = document.getElementById("obsStreamKeyInput")?.value.trim();
      const btn = document.getElementById("btnSaveObsSettings");
      if (btn) btn.disabled = true;
      try {
        const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
        const res = await FirebaseClient.request("stream.iframe-url", {
          method: "POST",
          body: {
            serverUrl,
            streamKey,
            adminEmail: callerEmail
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("OBS transliacijos nustatymai išsaugoti!", "success");
          streamConfig = { ...streamConfig, serverUrl, streamKey };
        } else {
          showToast("Nepavyko išsaugoti OBS nustatymų", "error");
        }
      } catch (err) {
        showToast("Tinklo klaida: " + err.message, "error");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  if (btnResetIframe && inputIframe) {
    btnResetIframe.addEventListener("click", () => {
      inputIframe.value = "https://customer-auu36r7owuzogvfb.cloudflarestream.com/937d1a8b2c545a980c9fabc8502d8af4/iframe";
      inputIframe.dataset.edited = "true";
    });
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
      badge.style.background = "rgba(255, 255, 255, 0.08)";
      badge.style.color = "#E2E8F0";
      badge.style.border = "1px solid rgba(255, 255, 255, 0.2)";
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

// ============================================================================
// CLASSROOM & TOKEN TYPE TOGGLES & BULK ACTIONS
// ============================================================================
function initViewerTypeToggles() {
  const radioIndiv = document.getElementById("viewerTypeIndividual");
  const radioClass = document.getElementById("viewerTypeClassroom");
  const classroomRow = document.getElementById("classroomSettingsRow");
  const lblName = document.getElementById("lblViewerName");
  const roleSelect = document.getElementById("newViewerRole");

  function updateState() {
    const isClassroom = radioClass && radioClass.checked;
    if (classroomRow) {
      classroomRow.style.display = isClassroom ? "grid" : "none";
    }
    if (lblName) {
      lblName.textContent = isClassroom ? "Mokytojo Vardas, Pavardė *" : "Žiūrovo Vardas, Pavardė *";
    }
    if (roleSelect && isClassroom) {
      roleSelect.value = "classroom_viewer";
    }
  }

  if (radioIndiv) radioIndiv.addEventListener("change", updateState);
  if (radioClass) radioClass.addEventListener("change", updateState);
  updateState();
}

function initBulkClassroomHandlers() {
  const toggleBtn = document.getElementById("btnToggleBulkClassroomBox");
  const drawer = document.getElementById("bulkClassroomDrawer");
  const runBtn = document.getElementById("btnRunBulkClassroomGenerate");
  const exportBtn = document.getElementById("btnExportClassroomCsv");

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener("click", () => {
      drawer.classList.toggle("d-none");
    });
  }

  if (runBtn) {
    runBtn.addEventListener("click", runBulkClassroomGenerate);
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportClassroomTokensCsv);
  }
}

function initTokenQrModalHandlers() {
  const modal = document.getElementById("tokenQrModal");
  const closeBtn = document.getElementById("closeTokenQrModalBtn");
  const cancelBtn = document.getElementById("btnCancelTokenQrModal");
  const copyLinkBtn = document.getElementById("btnCopyTokenQrLink");
  const printBtn = document.getElementById("btnPrintTokenQr");

  if (closeBtn) closeBtn.addEventListener("click", closeTokenQrModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeTokenQrModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeTokenQrModal();
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => {
      const input = document.getElementById("tokenQrDirectLinkInput");
      if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
          showToast("Transliacijos nuoroda nukopijuota į iškarpinę!", "success");
        }).catch(() => {
          showToast("Nepavyko nukopijuoti", "error");
        });
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener("click", () => {
      const printArea = document.getElementById("tokenQrPrintableArea");
      const name = document.getElementById("tokenQrTargetName")?.textContent || "Prieiga";
      const link = document.getElementById("tokenQrDirectLinkInput")?.value || "";
      if (!printArea) return;

      const printWin = window.open("", "_blank", "width=640,height=700");
      if (printWin) {
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Ąžuolynas Film Fest - ${name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 40px; margin: 0; }
              .card { border: 2px dashed #041310; border-radius: 12px; padding: 30px; max-width: 440px; margin: 0 auto; }
              h1 { font-size: 20px; color: #041310; margin-bottom: 6px; }
              p { color: #475569; font-size: 14px; margin: 4px 0 20px 0; }
              .link { font-family: monospace; font-size: 12px; word-break: break-all; margin-top: 14px; color: #1e293b; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>ĄŽUOLYNAS FILM FESTIVAL 2027</h1>
              <p>Mokyklos / Klasės Transliacijos QR Prieiga<br><strong>${name}</strong></p>
              ${printArea.innerHTML}
              <div class="link">Tiesioginė nuoroda: ${link}</div>
            </div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
          </html>
        `);
        printWin.document.close();
      }
    });
  }
}

export function openTokenQrModal(viewer) {
  const modal = document.getElementById("tokenQrModal");
  if (!modal || !viewer) return;

  const targetName = document.getElementById("tokenQrTargetName");
  const typeBadge = document.getElementById("tokenQrTypeBadge");
  const codeDisplay = document.getElementById("tokenQrCodeDisplay");
  const linkInput = document.getElementById("tokenQrDirectLinkInput");
  const qrContainer = document.getElementById("tokenQrCanvasContainer");

  const isClassroom = viewer.tokenType === "classroom";
  const nameLabel = isClassroom ? (viewer.classroomLabel || viewer.name || "Klasės peržiūra") : (viewer.name || viewer.email || "Žiūrovas");
  const maxDevices = viewer.maxConcurrentDevices || (isClassroom ? 35 : 1);
  const liveLink = `${window.location.origin}/live.html?t=${encodeURIComponent(viewer.token)}`;

  if (targetName) targetName.textContent = nameLabel;
  if (typeBadge) {
    if (isClassroom) {
      typeBadge.textContent = `🏫 Klasė (${maxDevices} įrenginiai)`;
      typeBadge.style.background = "rgba(255,255,255,0.08)";
      typeBadge.style.color = "#FFFFFF";
      typeBadge.style.borderColor = "rgba(255,255,255,0.2)";
    } else {
      typeBadge.textContent = "👤 Individualus žiūrovas (1 įr.)";
      typeBadge.style.background = "rgba(111,165,138,0.2)";
      typeBadge.style.color = "#9BC4AE";
      typeBadge.style.borderColor = "rgba(111,165,138,0.4)";
    }
  }
  if (codeDisplay) codeDisplay.textContent = viewer.token;
  if (linkInput) linkInput.value = liveLink;

  if (qrContainer && window.FestivalQR) {
    window.FestivalQR.render(liveLink, qrContainer, { size: 190 });
  }

  modal.classList.remove("d-none");
}

export function closeTokenQrModal() {
  const modal = document.getElementById("tokenQrModal");
  if (modal) modal.classList.add("d-none");
}

// ============================================================================
// AUTHORIZED VIEWERS & CLOUDFLARE SIGNED TOKENS LIST
// ============================================================================
export function renderAuthorizedViewersTable() {
  const tableBody = document.getElementById("streamAuthorizedViewersTableBody");
  if (!tableBody) return;

  const searchVal = (document.getElementById("filterSignedViewersSearch")?.value || "").toLowerCase().trim();
  const typeFilter = document.getElementById("filterSignedViewersType")?.value || "all";

  // Metrics
  const totalViewersElem = document.getElementById("statStreamTotalViewers");
  if (totalViewersElem) totalViewersElem.textContent = authorizedViewers.length;

  const filtered = authorizedViewers.filter(v => {
    if (typeFilter === "classroom" && v.tokenType !== "classroom") return false;
    if (typeFilter === "individual" && v.tokenType === "classroom") return false;

    if (!searchVal) return true;
    const matchEmail = (v.email || "").toLowerCase().includes(searchVal);
    const matchName = (v.name || "").toLowerCase().includes(searchVal);
    const matchClass = (v.classroomLabel || "").toLowerCase().includes(searchVal);
    const matchToken = (v.token || "").toLowerCase().includes(searchVal);
    const matchRole = (v.role || "").toLowerCase().includes(searchVal);
    return matchEmail || matchName || matchClass || matchToken || matchRole;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:32px 16px; color:var(--text-muted);">
          Autorizuotų žiūrovų su Prieigos žetonais nerasta. Pasinaudokite aukščiau esančia forma naujam žiūrovui ar klasei pridėti.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(viewer => {
    const liveLink = `${window.location.origin}/live.html?t=${encodeURIComponent(viewer.token)}`;
    const isClassroom = viewer.tokenType === "classroom";
    const dateFormatted = viewer.createdAt ? new Date(viewer.createdAt).toLocaleDateString("lt-LT") : "—";
    const maxDevices = viewer.maxConcurrentDevices || (isClassroom ? 35 : 1);
    const activeDevices = viewer.activeDevices || 0;

    return `
      <tr>
        <td>
          ${isClassroom ? `
            <strong style="color:#FFFFFF; font-size:0.92rem;">🏫 ${escapeHtml(viewer.classroomLabel || viewer.name)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(viewer.email)} &bull; ${escapeHtml(viewer.name)}</div>
          ` : `
            <strong style="color:var(--text-color); font-size:0.92rem;">👤 ${escapeHtml(viewer.name || viewer.email)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(viewer.email)} &bull; Sukurta: ${dateFormatted}</div>
          `}
        </td>
        <td>
          ${isClassroom ? `
            <span class="badge" style="background:rgba(255,255,255,0.08); color:#FFFFFF; border:1px solid rgba(255,255,255,0.2); font-size:0.75rem; border-radius:2px;">
              🏫 Klasė (${activeDevices}/${maxDevices} įr.)
            </span>
          ` : `
            <span class="badge" style="background:rgba(111,165,138,0.18); color:#9BC4AE; border:1px solid rgba(111,165,138,0.35); font-size:0.75rem; border-radius:2px;">
              👤 1 įrenginys
            </span>
          `}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <code style="background:rgba(0,0,0,0.35); padding:3px 8px; border-radius:2px; color:#FFFFFF; font-size:0.78rem; border:1px solid rgba(255,255,255,0.15);">
              ${escapeHtml(viewer.token)}
            </code>
            <button type="button" class="btn-icon-copy btn-copy-raw-token" data-token="${escapeHtml(viewer.token)}" title="Kopijuoti žetoną">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
        </td>
        <td>
          <span class="badge" style="background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(34,197,94,0.35); font-size:0.75rem;">
            Autorizuotas
          </span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="text" readonly value="${escapeHtml(liveLink)}" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-muted); padding:3px 6px; font-size:0.75rem; width:130px; border-radius:4px;" title="${escapeHtml(liveLink)}">
            <button type="button" class="btn-outline btn-xs btn-copy-viewer-link" data-link="${escapeHtml(liveLink)}" title="Kopijuoti nuorodą">
              <span>Kopijuoti</span>
            </button>
          </div>
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex; align-items:center; gap:5px;">
            <button type="button" class="btn-solid btn-xs btn-open-qr-row" data-token="${escapeHtml(viewer.token)}" style="background:#FFFFFF; color:#070908; font-weight:700; border-radius:2px;" title="Rodyti QR kodą ir nuorodą">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>QR</span>
            </button>
            <button type="button" class="btn-outline btn-xs btn-resend-viewer-token" data-token="${escapeHtml(viewer.token)}" title="Išsiųsti el. laišką su žetonu">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </button>
            <button type="button" class="btn-outline btn-xs btn-delete-viewer" data-token="${escapeHtml(viewer.token)}" style="color:#f87171; border-color:rgba(239,68,68,0.3);" title="Pašalinti prieigą">
              &times;
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Attach event handlers
  tableBody.querySelectorAll(".btn-open-qr-row").forEach(btn => {
    btn.onclick = () => {
      const tok = btn.getAttribute("data-token");
      const v = authorizedViewers.find(x => x.token === tok);
      if (v) openTokenQrModal(v);
    };
  });

  tableBody.querySelectorAll(".btn-copy-raw-token").forEach(btn => {
    btn.onclick = () => {
      const tok = btn.getAttribute("data-token");
      if (tok) {
        navigator.clipboard.writeText(tok).then(() => showToast(`Signed Token nukopijuotas: ${tok}`, "success"));
      }
    };
  });

  tableBody.querySelectorAll(".btn-copy-viewer-link").forEach(btn => {
    btn.onclick = () => {
      const link = btn.getAttribute("data-link");
      if (link) {
        navigator.clipboard.writeText(link).then(() => showToast("Transliacijos nuoroda nukopijuota į iškarpinę!", "success"));
      }
    };
  });

  tableBody.querySelectorAll(".btn-resend-viewer-token").forEach(btn => {
    btn.onclick = async () => {
      const token = btn.getAttribute("data-token");
      if (!token) return;
      btn.disabled = true;
      try {
        showToast("Siunčiamas transliacijos žetono laiškas...");
        const res = await FirebaseClient.request("stream.viewers.resend", {
          method: "POST",
          body: { token }
        });
        if (res.ok) {
          showToast("Laiškas įrašytas į siuntimo eilę.", "success");
        } else {
          showToast("Klaida siunčiant laišką", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      } finally {
        btn.disabled = false;
      }
    };
  });

  tableBody.querySelectorAll(".btn-delete-viewer").forEach(btn => {
    btn.onclick = async () => {
      const token = btn.getAttribute("data-token");
      if (!token || !confirm("Ar tikrai norite atšaukti šį žiūrovo prieigos žetoną?")) return;
      try {
        const res = await FirebaseClient.request("stream.viewers.delete", {
          method: "POST",
          body: { token }
        });
        if (res.ok) {
          authorizedViewers = authorizedViewers.filter(v => v.token !== token);
          renderAuthorizedViewersTable();
          showToast("Žiūrovo prieiga sėkmingai pašalinta.", "success");
        } else {
          showToast("Nepavyko pašalinti prieigos", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      }
    };
  });
}

function initViewerTokenForm() {
  const form = document.getElementById("formAddStreamViewer");
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnAddStreamViewerSubmit");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Generuojama...";
    }

    try {
      const email = document.getElementById("newViewerEmail")?.value.trim();
      const name = document.getElementById("newViewerName")?.value.trim();
      const customToken = document.getElementById("newViewerCustomToken")?.value.trim();
      const role = document.getElementById("newViewerRole")?.value || "guest_viewer";
      const expiresInHours = document.getElementById("newViewerExpires")?.value || "48";
      const sendEmail = document.getElementById("newViewerSendEmail")?.checked === true;

      const isClassroom = document.getElementById("viewerTypeClassroom")?.checked === true;
      const tokenType = isClassroom ? "classroom" : "individual";
      const classroomLabel = document.getElementById("newViewerClassroomLabel")?.value.trim() || "";
      const maxConcurrentDevices = isClassroom 
        ? Math.max(1, Math.min(100, parseInt(document.getElementById("newViewerMaxDevices")?.value || "35", 10)))
        : 1;

      const res = await FirebaseClient.request("stream.viewers.create", {
        method: "POST",
        body: {
          email,
          name,
          customToken,
          role,
          expiresInHours,
          sendEmail,
          tokenType,
          classroomLabel,
          maxConcurrentDevices
        }
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Prieigos žetonas sėkmingai sugeneruotas: ${data.viewer?.token}!`, "success");
        form.reset();
        await fetchAuthorizedViewers();
        renderAuthorizedViewersTable();

        // Open QR & Direct Link modal automatically
        if (data.viewer) {
          openTokenQrModal(data.viewer);
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Nepavyko sugeneruoti žetono", "error");
      }
    } catch (err) {
      showToast("Ryšio klaida", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Sugeneruoti Prieigos Žetoną";
      }
    }
  };
}

// Bulk generate from pasted lines
async function runBulkClassroomGenerate() {
  const textarea = document.getElementById("bulkClassroomInput");
  const text = (textarea?.value || "").trim();
  if (!text) {
    showToast("Įklijuokite bent vieną mokytojo / klasės eilutę", "error");
    return;
  }

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items = [];

  for (const line of lines) {
    const parts = line.split(",").map(p => p.trim());
    if (parts.length >= 1) {
      const name = parts[0] || "Mokytojas";
      const classroomLabel = parts[1] || name;
      const email = (parts[2] && parts[2].includes("@")) ? parts[2] : `mokytojas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@mokykla.lt`;
      const maxConcurrentDevices = parts[3] ? parseInt(parts[3], 10) : 35;

      items.push({
        name,
        classroomLabel,
        email,
        maxConcurrentDevices: isNaN(maxConcurrentDevices) ? 35 : maxConcurrentDevices,
        tokenType: "classroom"
      });
    }
  }

  if (items.length === 0) {
    showToast("Nepavyko nuskaityti eilučių", "error");
    return;
  }

  const btn = document.getElementById("btnRunBulkClassroomGenerate");
  if (btn) btn.disabled = true;

  try {
    showToast(`Generuojami ${items.length} klasių prieigos žetonai...`, "info");
    const res = await FirebaseClient.request("stream.viewers.bulk-create", {
      method: "POST",
      body: { items }
    });

    if (res.ok) {
      const data = await res.json();
      showToast(`Sėkmingai sugeneruoti ${data.count} klasės žetonai!`, "success");
      if (textarea) textarea.value = "";
      await fetchAuthorizedViewers();
      renderAuthorizedViewersTable();
    } else {
      const err = await res.json();
      showToast(err.error || "Klaida generuojant žetonus", "error");
    }
  } catch (err) {
    showToast("Ryšio klaida", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// CSV Export for Classroom tokens
function exportClassroomTokensCsv() {
  const classrooms = authorizedViewers.filter(v => v.tokenType === "classroom");
  const listToExport = classrooms.length > 0 ? classrooms : authorizedViewers;

  if (listToExport.length === 0) {
    showToast("Nėra autorizuotų žetonų eksportavimui", "error");
    return;
  }

  const headers = ["Mokytojas / Klasė", "El. Paštas", "Cloudflare Signed Token", "Tiesioginė Nuoroda", "Maks. Įrenginiai", "Galioja Iki"];
  const rows = listToExport.map(v => {
    const liveLink = `${window.location.origin}/live.html?t=${encodeURIComponent(v.token)}`;
    const label = v.classroomLabel || v.name || "";
    const devices = v.maxConcurrentDevices || 35;
    const expires = v.expiresAt || "";
    return [
      `"${label.replace(/"/g, '""')}"`,
      `"${(v.email || '').replace(/"/g, '""')}"`,
      `"${(v.token || '').replace(/"/g, '""')}"`,
      `"${liveLink}"`,
      devices,
      `"${expires}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asiff-klasiu-zetonai-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Eksportuota ${listToExport.length} žetonų į CSV failą!`, "success");
}

// ============================================================================
// RSVP & REMOTE PARTICIPANTS SUBMISSIONS TABLE
// ============================================================================
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
    const liveLink = sub.liveStreamUrl || `${window.location.origin}/live.html?token=${encodeURIComponent(token)}`;

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
          <code style="background:rgba(0,0,0,0.35); padding:3px 8px; border-radius:2px; color:#FFFFFF; font-size:0.8rem; border:1px solid rgba(255,255,255,0.15);">
            ${escapeHtml(token)}
          </code>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="text" readonly value="${escapeHtml(liveLink)}" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-muted); padding:3px 6px; font-size:0.75rem; width:150px; border-radius:4px;" title="${escapeHtml(liveLink)}">
            <button type="button" class="btn-outline btn-xs btn-copy-link" data-link="${escapeHtml(liveLink)}" title="Kopijuoti nuorodą">
              <span>Kopijuoti</span>
            </button>
          </div>
        </td>
        <td>
          <button type="button" class="btn-solid btn-xs btn-resend-token" data-sub-id="${escapeHtml(sub.id)}" title="Išsiųsti el. laišką su žetonu ir nuoroda">
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
          showToast("Nuoroda nukopijuota į iškarpinę!", "success");
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
    const res = await FirebaseClient.request("stream.status", {
      method: "POST",

      body: { state: newState }
    });
    if (res.ok) {
      const data = await res.json();
      streamConfig = data.streamConfig;
      renderStreamControls();
      renderLivePreviewIframe();
      showToast(`Transliacijos būsena sėkmingai atnaujinta į ${newState.toUpperCase()}`, "success");
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      const err = await res.json();
      showToast(err.error || "Nepavyko atnaujinti transliacijos būsenos", "error");
    }
  } catch (err) {
    showToast("Firebase ryšio klaida", "error");
  }
}

async function resendLiveTokenEmail(submissionId) {
  try {
    showToast("Siunčiamas el. laiškas dalyviui...");
    const res = await FirebaseClient.request("resend-live-link", {
      method: "POST",

      body: { submissionId }
    });
    if (res.ok) {
      showToast("Laiškas su prieigos nuoroda įrašytas į siuntimo eilę.", "success");
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      const err = await res.json();
      showToast(err.error || "Klaida siunčiant laišką", "error");
    }
  } catch (err) {
    showToast("Firebase ryšio klaida", "error");
  }
}

function setupCopyButtons() {
  const copyServerBtn = document.getElementById("btnCopyObsServer");
  if (copyServerBtn) {
    copyServerBtn.addEventListener("click", () => {
      const val = document.getElementById("obsServerUrlInput")?.value || "rtmps://live.cloudflare.com:443/live/";
      navigator.clipboard.writeText(val).then(() => showToast("OBS Server URL nukopijuotas!", "success"));
    });
  }

  const copyKeyBtn = document.getElementById("btnCopyObsKey");
  if (copyKeyBtn) {
    copyKeyBtn.addEventListener("click", () => {
      const val = document.getElementById("obsStreamKeyInput")?.value || "6561bd7efd0ad61e9040a08676049c4dk937d1a8b2c545a980c9fabc8502d8af4";
      navigator.clipboard.writeText(val).then(() => showToast("OBS Stream Key nukopijuotas!", "success"));
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
      navigator.clipboard.writeText(code).then(() => showToast("Cloudflare Stream iframe kodas nukopijuotas!", "success"));
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
