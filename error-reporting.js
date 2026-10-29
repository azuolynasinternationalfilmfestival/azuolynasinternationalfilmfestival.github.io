/**
 * Ąžuolynas Film Festival - Global On-Screen Error Reporter
 * Captures window.onerror, unhandledrejection, and explicit try/catch reports.
 * 
 * Features:
 * 1. Non-fatal AbortError suppression: Never disturbs viewers, logs quietly to diagnostics.
 * 2. Secret Redaction: Strips stream tokens, signed URLs, JWTs, voter IDs, and private paths.
 * 3. Gated UI: Full technical error box (code, file, function, copy button) is displayed ONLY to signed-in admins or when URL contains ?debug=1.
 *    For regular viewers, displays a brief friendly message or stays quiet.
 * 4. Genuine stack tracing: Parses real file and function names from the error stack.
 */
(function() {
  const errorLogs = [];
  const MAX_LOGS = 50;

  function formatTime(date) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  // Check if current visitor has admin rights or ?debug=1 in query params
  function isDebugOrAdmin() {
    try {
      if (typeof window === "undefined") return false;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("debug") === "1" || urlParams.get("debug") === "true") return true;

      // Check Firebase Auth currentUser
      if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
        const email = (window.firebase.auth().currentUser.email || "").toLowerCase();
        if (email === "azuolynasfilmfestival@gmail.com" || email === "karina.brdar@gmail.com") {
          return true;
        }
      }

      // Check admin session role
      const adminRole = sessionStorage.getItem("admin_user_role");
      const adminEmail = (sessionStorage.getItem("admin_user_email") || "").toLowerCase();
      if (adminRole === "admin" && (adminEmail === "azuolynasfilmfestival@gmail.com" || adminEmail === "karina.brdar@gmail.com")) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  // Redact secrets, tokens, signed URLs, JWTs, voter IDs, and private paths
  function redactSecrets(text) {
    if (!text) return "";
    let str = String(text);

    // 1. Live stream tokens & Cloudflare signatures
    str = str.replace(/asiff_live_[a-zA-Z0-9_\-]+/gi, "asiff_live_***");
    str = str.replace(/cfs_[a-zA-Z0-9_\-]+/gi, "cfs_***");
    str = str.replace(/(?:token|tokenHash|signature|client_secret|api_key|auth_token)=([a-zA-Z0-9_\-\.]+)/gi, "$1=***");

    // 2. Signed URLs
    str = str.replace(/https:\/\/[^\s"'<>]+\?(?:[^<>"'\s]*token=[^<>"'\s]*)/gi, "[SIGNED_STREAM_URL_REDACTED]");

    // 3. JWTs (three base64 segments)
    str = str.replace(/eyJ[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]+/g, "[AUTH_TOKEN_REDACTED]");

    // 4. Voter anonymous UIDs (alphanumeric 20+ chars)
    str = str.replace(/(?:userId|voterId|uid)["']?\s*[:=]\s*["']?([a-zA-Z0-9_\-]{20,})["']?/gi, "userId: \"[VOTER_ID_REDACTED]\"");

    // 5. Private collections in Firestore paths
    str = str.replace(/\/databases\/[^\/]+\/documents\/(tasks|admin_tokens|config|settings\/private)\/[a-zA-Z0-9_\-]+/gi, "/documents/$1/[REDACTED]");

    return str;
  }

  // Parse stack trace to extract genuine file and function name
  function parseStack(stack) {
    if (!stack || typeof stack !== "string") return null;
    const lines = stack.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip the reporter itself
      if (line.includes("error-reporting.js") || line.includes("reportError")) continue;

      // Chrome/Firefox format: at functionName (http://.../file.js:line:col) or at http://.../file.js:line:col
      const match = line.match(/at (?:([a-zA-Z0-9_$.<>]+)\s+)?\(?(?:https?:\/\/[^/]+)?\/([^:)]+):(\d+):(\d+)\)?/);
      if (match) {
        return {
          functionName: match[1] || "anonymous",
          file: match[2] || "script",
          line: match[3],
          col: match[4]
        };
      }
    }
    return null;
  }

  // Check if error is non-fatal AbortError
  function isAbortError(err, message, code) {
    if (code === 20 || code === "ABORT_ERR" || code === "AbortError") return true;
    if (err && (err.name === "AbortError" || err.code === 20)) return true;
    const msg = (message || "").toLowerCase();
    if (msg.includes("the operation was aborted") || msg.includes("aborted") || msg.includes("play() request was interrupted")) {
      return true;
    }
    return false;
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
        max-width: 480px;
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
      .asiff-toast-card {
        background: rgba(11, 17, 14, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-left: 3px solid #34D399;
        border-radius: 2px;
        padding: 12px 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
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
        border-radius: 2px;
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
        border-radius: 2px;
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
        border-radius: 2px;
        font-family: monospace;
      }
      .asiff-error-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .asiff-error-btn-copy {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #F8FAF7;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 5px 10px;
        border-radius: 2px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      }
      .asiff-error-btn-copy:hover {
        background: #FFFFFF;
        color: #070908;
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
    const rawMessage = details.message || "Nežinoma klaida / Unknown error";
    const rawCode = details.code || "ERR_GENERAL";
    const rawStack = details.stack || "";

    // 1. Non-fatal AbortError handling: Suppress from UI completely
    const isAbort = isAbortError(details.error, rawMessage, rawCode);

    // 2. Extract genuine file and function from stack if generic
    let resolvedFile = details.file || "unknown";
    let resolvedFunction = details.functionName || "anonymous";

    if ((resolvedFile === "promise" || resolvedFile === "unknown" || resolvedFile === "inline") && rawStack) {
      const parsed = parseStack(rawStack);
      if (parsed) {
        resolvedFile = `${parsed.file}:${parsed.line}:${parsed.col}`;
        resolvedFunction = parsed.functionName;
      }
    }

    // 3. Redact secrets in message, stack, and details
    const sanitizedEntry = {
      action: redactSecrets(details.action || "Sistemos veiksmas / System action"),
      message: redactSecrets(rawMessage),
      code: isAbort ? "ABORT_SUPPRESSED" : redactSecrets(String(rawCode)),
      file: redactSecrets(resolvedFile),
      functionName: redactSecrets(resolvedFunction),
      timestamp: formatTime(new Date()),
      stack: redactSecrets(rawStack),
      isSuppressed: isAbort
    };

    errorLogs.unshift(sanitizedEntry);
    if (errorLogs.length > MAX_LOGS) errorLogs.pop();

    if (typeof window !== "undefined") {
      window.asiffLastErrors = errorLogs;
    }

    // If it's an AbortError, log quietly and DO NOT render card to screen
    if (isAbort) {
      console.debug("[ASIFF Notice] Suppressed non-fatal AbortError in diagnostics log:", sanitizedEntry);
      return;
    }

    // If caller is in browser DOM, decide whether to render detailed card or friendly viewer notice
    if (document.body) {
      renderErrorCard(sanitizedEntry);
    } else {
      document.addEventListener("DOMContentLoaded", () => renderErrorCard(sanitizedEntry));
    }
  }

  function renderErrorCard(entry) {
    createErrorUI();
    const container = document.getElementById("asiffErrorContainer");
    if (!container) return;

    const isAdminOrDebug = isDebugOrAdmin();

    if (!isAdminOrDebug) {
      // Normal viewer: Show non-technical, friendly notice only for critical errors, or stay quiet
      const toast = document.createElement("div");
      toast.className = "asiff-toast-card";
      toast.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="font-size:0.85rem; color:#cbd5e1;">Atsiprašome, įvyko laikina sistemos klaida. Bandykite perkrauti puslapį.</span>
          <button type="button" class="asiff-error-close" title="Užverti" style="color:#cbd5e1;">&times;</button>
        </div>
      `;
      toast.querySelector(".asiff-error-close").addEventListener("click", () => toast.remove());
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
      container.appendChild(toast);
      return;
    }

    // Signed-in admin or ?debug=1: Show full diagnostic box with code, location, timestamp and copy button
    const card = document.createElement("div");
    card.className = "asiff-error-card";

    // Clean JSON details with secrets already redacted
    const exportDetails = {
      action: entry.action,
      message: entry.message,
      code: entry.code,
      file: entry.file,
      functionName: entry.functionName,
      timestamp: entry.timestamp,
      stack: entry.stack ? entry.stack.split("\n").slice(0, 5).join("\n") : ""
    };
    const jsonDetails = JSON.stringify(exportDetails, null, 2);

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

  // Global window.onerror listener
  window.addEventListener("error", function(event) {
    const isAbort = isAbortError(event.error, event.message, "");
    const file = event.filename ? event.filename.split("/").pop() : "inline";
    reportError({
      action: "Nenumatyta kodo klaida (window.onerror)",
      message: event.message || "Script execution error",
      code: isAbort ? "ABORT_SUPPRESSED" : "SCRIPT_ERROR",
      file: file + ":" + (event.lineno || 0) + ":" + (event.colno || 0),
      functionName: "global",
      stack: event.error && event.error.stack ? event.error.stack : "",
      error: event.error
    });
  });

  // Global unhandledrejection listener
  window.addEventListener("unhandledrejection", function(event) {
    const reason = event.reason || {};
    const message = reason.message || String(reason);
    const code = reason.code || "UNHANDLED_PROMISE";
    const isAbort = isAbortError(reason, message, code);

    // Parse stack to find real origin instead of placeholder
    const parsed = parseStack(reason.stack);
    const resolvedFile = parsed ? `${parsed.file}:${parsed.line}:${parsed.col}` : "promise";
    const resolvedFunc = parsed ? parsed.functionName : "async";

    reportError({
      action: "Asinchroninė operacija (unhandledrejection)",
      message: message,
      code: isAbort ? "ABORT_SUPPRESSED" : code,
      file: resolvedFile,
      functionName: resolvedFunc,
      stack: reason.stack || "",
      error: reason
    });
  });

  // Expose API
  window.reportAsiffError = reportError;
  window.getAsiffErrorLogs = function() {
    return errorLogs;
  };
})();
