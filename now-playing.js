/**
 * Ąžuolynas Film Festival - Now Playing Banner
 * Displays the current festival film on air across public pages.
 */
(function() {
  function initNowPlaying() {
    if (document.getElementById("asiffNowPlayingBar")) return;

    const bar = document.createElement("aside");
    bar.id = "asiffNowPlayingBar";
    bar.className = "now-playing-strip d-none";
    bar.setAttribute("aria-label", "Dabar rodomas festivalio filmas");

    bar.innerHTML = `
      <div class="now-playing-inner">
        <div class="now-playing-badge">
          <span class="now-playing-pulse" aria-hidden="true"></span>
          <span id="nowPlayingLabel">DABAR EKRANE</span>
        </div>
        <div class="now-playing-info">
          <strong id="nowPlayingTitle">-</strong>
          <span id="nowPlayingDirector" class="now-playing-director"></span>
        </div>
        <a id="nowPlayingLiveBtn" href="live.html" class="now-playing-action-btn">
          <span>Žiūrėti transliaciją</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </a>
        <button type="button" class="now-playing-close" id="nowPlayingCloseBtn" aria-label="Užverti">&times;</button>
      </div>
    `;

    // Inject styles
    const style = document.createElement("style");
    style.id = "nowPlayingStyles";
    style.textContent = `
      .now-playing-strip {
        position: fixed;
        top: 72px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        max-width: 760px;
        width: calc(100% - 32px);
        background: rgba(12, 36, 31, 0.94);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(212, 175, 55, 0.45);
        border-radius: 30px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        padding: 6px 14px;
        color: #F8FAF7;
        font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        animation: nowPlayingDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes nowPlayingDown {
        from { opacity: 0; transform: translate(-50%, -12px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .now-playing-inner {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .now-playing-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.5);
        color: #fca5a5;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 20px;
        flex-shrink: 0;
      }
      .now-playing-pulse {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 8px #ef4444;
        animation: pulseDot 1.4s infinite ease-in-out;
      }
      .now-playing-info {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.85rem;
      }
      .now-playing-director {
        color: var(--text-muted, #94a3b8);
        font-size: 0.78rem;
        margin-left: 6px;
      }
      .now-playing-action-btn {
        background: #D4AF37;
        color: #041310;
        text-decoration: none;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 12px;
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        transition: transform 0.2s ease, background-color 0.2s ease;
      }
      .now-playing-action-btn:hover {
        background: #F3E5AB;
        transform: scale(1.04);
      }
      .now-playing-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.15rem;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      .now-playing-close:hover { color: #ffffff; }
      @media (max-width: 640px) {
        .now-playing-strip { top: 64px; border-radius: 12px; }
        .now-playing-action-btn span { display: none; }
        .now-playing-action-btn { padding: 4px 8px; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(bar);

    const closeBtn = bar.querySelector("#nowPlayingCloseBtn");
    closeBtn.addEventListener("click", () => {
      bar.classList.add("d-none");
    });

    syncNowPlayingData(bar);
  }

  async function syncNowPlayingData(bar) {
    try {
      // 1. Try Firestore if available
      if (window.firebase && window.firebase.firestore) {
        try {
          const db = window.firebase.firestore();
          db.collection("settings").doc("broadcast_overlay").onSnapshot((doc) => {
            if (doc.exists) {
              applyData(doc.data(), bar);
            } else {
              fallbackFetch(bar);
            }
          }, () => {
            fallbackFetch(bar);
          });
          return;
        } catch {
          // fallback
        }
      }
      fallbackFetch(bar);
    } catch {
      // quiet
    }
  }

  async function fallbackFetch(bar) {
    try {
      const res = await fetch("/api/broadcast/overlay");
      if (res.ok) {
        const data = await res.json();
        applyData(data, bar);
      }
    } catch {
      // quiet
    }
  }

  function applyData(data, bar) {
    if (!data || !data.nowPlaying || !data.nowPlaying.title || data.isPublicVisible === false) {
      bar.classList.add("d-none");
      return;
    }

    const titleElem = bar.querySelector("#nowPlayingTitle");
    const dirElem = bar.querySelector("#nowPlayingDirector");

    if (titleElem) titleElem.textContent = data.nowPlaying.title;
    if (dirElem) dirElem.textContent = data.nowPlaying.director ? `(${data.nowPlaying.director})` : "";
    bar.classList.remove("d-none");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNowPlaying);
  } else {
    initNowPlaying();
  }
})();
