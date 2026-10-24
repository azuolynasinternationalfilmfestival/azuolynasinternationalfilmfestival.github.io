/**
 * Ąžuolynas Film Festival - Global On-Screen Error Reporter
 * Captures window.onerror, unhandledrejection, and explicit try/catch reports.
 * Displays an on-screen diagnostic box with error code, file/function, timestamp, and a Copy button.
 */
(function() {
  const errorLogs = [];
  const MAX_LOGS = 50;

  function formatTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  function createErrorUI() {
    if (document.getElementById("asiffErrorContainer")) return;

    const style = document.createElement("style");
    style.id = "asiffErrorStyles";
    style.textContent = `
      #asiffErrorContainer {
        position: fixed;
        bottom: 24px;
        left: 24px;
        max-width: 460px;
        width: calc(100% - 48px);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      }
      .asiff-error-card {
        background: rgba(18, 12, 12, 0.96);
        border: 1px solid rgba(239, 68, 68, 0.6);
        border-left: 4px solid #ef4444;
        border-radius: 8px;
        padding: 14px 16px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.65);
        color: #f8fafc;
        pointer-events: auto;
        animation: asiffErrorSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      @keyframes asiffErrorSlideIn {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .asiff-error-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .asiff-error-badge {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        padding: 2px 7px;
        border-radius: 4px;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }
      .asiff-error-time {
        font-size: 0.72rem;
        color: #94a3b8;
        font-family: monospace;
      }
      .asiff-error-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 1.1rem;
        line-height: 1;
        padding: 2px 4px;
      }
      .asiff-error-close:hover { color: #ffffff; }
      .asiff-error-action {
        font-size: 0.88rem;
        font-weight: 600;
        color: #fef2f2;
        margin-bottom: 4px;
      }
      .asiff-error-msg {
        font-size: 0.8rem;
        color: #fca5a5;
        font-family: monospace;
        word-break: break-word;
        background: rgba(0, 0, 0, 0.4);
        padding: 6px 8px;
        border-radius: 4px;
        border: 1px solid rgba(239, 68, 68, 0.2);
        margin-bottom: 8px;
        max-height: 90px;
        overflow-y: auto;
      }
      .asiff-error-location {
        font-size: 0.74rem;
        color: #cbd5e1;
        margin-bottom: 10px;
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .asiff-error-location span {
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }
      .asiff-error-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .asiff-error-btn-copy {
        background: rgba(212, 175, 55, 0.2);
        border: 1px solid #D4AF37;
        color: #F8FAF7;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      }
      .asiff-error-btn-copy:hover {
        background: #D4AF37;
        color: #041310;
      }
      .asiff-error-count {
        font-size: 0.72rem;
        color: #94a3b8;
      }
    `;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "asiffErrorContainer";
    container.setAttribute("role", "alert");
    container.setAttribute("aria-live", "assertive");
    document.body.appendChild(container);
  }

  function reportError(details) {
    const entry = {
      action: details.action || "Sistemos veiksmas / System action",
      message: details.message || "Nežinoma klaida / Unknown error",
      code: details.code || "ERR_GENERAL",
      file: details.file || "unknown",
      functionName: details.functionName || "anonymous",
      timestamp: formatTime(new Date()),
      stack: details.stack || ""
    };

    errorLogs.unshift(entry);
    if (errorLogs.length > MAX_LOGS) errorLogs.pop();

    if (typeof window !== "undefined") {
      window.asiffLastErrors = errorLogs;
    }

    if (document.body) {
      renderErrorCard(entry);
    } else {
      document.addEventListener("DOMContentLoaded", () => renderErrorCard(entry));
    }
  }

  function renderErrorCard(entry) {
    createErrorUI();
    const container = document.getElementById("asiffErrorContainer");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "asiff-error-card";

    const jsonDetails = JSON.stringify(entry, null, 2);

    card.innerHTML = `
      <div class="asiff-error-header">
        <span class="asiff-error-badge">Klaida / Error: ${escapeHtml(entry.code)}</span>
        <span class="asiff-error-time">${entry.timestamp}</span>
        <button type="button" class="asiff-error-close" title="Užverti">&times;</button>
      </div>
      <div class="asiff-error-action">${escapeHtml(entry.action)}</div>
      <div class="asiff-error-msg">${escapeHtml(entry.message)}</div>
      <div class="asiff-error-location">
        <span>Failas: ${escapeHtml(entry.file)}</span>
        <span>Funkcija: ${escapeHtml(entry.functionName)}</span>
      </div>
      <div class="asiff-error-footer">
        <button type="button" class="asiff-error-btn-copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Kopijuoti klaidą (Copy details)</span>
        </button>
        <span class="asiff-error-count">Žurnale: ${errorLogs.length}</span>
      </div>
    `;

    const closeBtn = card.querySelector(".asiff-error-close");
    closeBtn.addEventListener("click", () => {
      card.remove();
    });

    const copyBtn = card.querySelector(".asiff-error-btn-copy");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(jsonDetails);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>Nukopijuota! (Copied)</span>`;
        setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
      } catch (err) {
        console.warn("Clipboard write failed:", err);
      }
    });

    // Keep max 3 cards visible simultaneously
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(card);
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

  // Global listeners
  window.addEventListener("error", function(event) {
    const file = event.filename ? event.filename.split("/").pop() : "inline";
    reportError({
      action: "Nenumatyta kodo klaida (window.onerror)",
      message: event.message || "Script execution error",
      code: "SCRIPT_ERROR",
      file: file + ":" + (event.lineno || 0) + ":" + (event.colno || 0),
      functionName: "global",
      stack: event.error && event.error.stack ? event.error.stack : ""
    });
  });

  window.addEventListener("unhandledrejection", function(event) {
    const reason = event.reason || {};
    const message = reason.message || String(reason);
    const code = reason.code || "UNHANDLED_PROMISE";
    reportError({
      action: "Asinchroninė operacija (unhandledrejection)",
      message: message,
      code: code,
      file: "promise",
      functionName: "async",
      stack: reason.stack || ""
    });
  });

  // Expose API
  window.reportAsiffError = reportError;
  window.getAsiffErrorLogs = function() {
    return errorLogs;
  };
})();
