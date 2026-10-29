/**
 * Ąžuolynas Film Festival - Broadcast Graphics & H2H Graphic Exporter
 * Generates JSON, CSV, and Standalone HTML files formatted for live television graphics (H2H Graphic, CasparCG, OBS Browser Source, vMix).
 */
(function(window) {
  const H2HExport = {
    /**
     * Build unified, normalized broadcast payload
     */
    buildGraphicsPayload(nominations = [], nowPlaying = null, nextFilm = null, votesData = {}) {
      const now = nowPlaying ? {
        id: nowPlaying.id || "",
        title: nowPlaying.filmTitle || nowPlaying.title || "Filmo Pavadinimas",
        director: nowPlaying.director || nowPlaying.name || "Režisierius",
        country: nowPlaying.country || "Lietuva",
        duration: nowPlaying.duration || "",
        category: nowPlaying.category || "Bendroji nominacija",
        synopsis: nowPlaying.synopsis || "",
        status: "ON_AIR"
      } : null;

      const next = nextFilm ? {
        id: nextFilm.id || "",
        title: nextFilm.filmTitle || nextFilm.title || "Sekantis Filmas",
        director: nextFilm.director || nextFilm.name || "Režisierius",
        country: nextFilm.country || "Lietuva",
        duration: nextFilm.duration || "",
        category: nextFilm.category || "Bendroji nominacija",
        status: "UP_NEXT"
      } : null;

      const normNominations = (nominations || []).map(nom => ({
        id: nom.id || nom.title || nom.name || "nomination",
        title: nom.title || nom.name || "Nominacija",
        category: nom.category || nom.title || nom.name || "Kategorija",
        films: (nom.films || []).map(f => ({
          id: f.id || "",
          title: f.filmTitle || f.title || "Filmas",
          director: f.director || f.name || "Autorius",
          country: f.country || "LT",
          duration: f.duration || "",
          votes: (votesData && votesData[f.id] !== undefined) ? votesData[f.id] : (f.votesCount || f.votes || 0)
        }))
      }));

      return {
        meta: {
          festival: "Ąžuolynas International Student Film Festival",
          exportedAt: new Date().toISOString(),
          version: "2.0.0",
          edition: "2027",
          format: "H2H_BROADCAST_GRAPHICS"
        },
        nowPlaying: now,
        nextFilm: next,
        nominations: normNominations
      };
    },

    /**
     * Download JSON format for H2H Graphic or OBS Browser Source
     */
    downloadJSON(rawPayload, filename = "asiff-broadcast-graphics.json") {
      let payload = rawPayload;
      if (!rawPayload.meta) {
        payload = this.buildGraphicsPayload(rawPayload.nominations, rawPayload.nowPlaying, rawPayload.nextFilm);
      }
      const jsonStr = JSON.stringify(payload, null, 2);
      this.triggerDownload(jsonStr, filename, "application/json");
    },

    /**
     * Download CSV format for spreadsheet rundowns and graphic software table inputs
     */
    downloadCSV(rawPayload, filename = "asiff-broadcast-rundown.csv") {
      let payload = rawPayload;
      if (!rawPayload.meta) {
        payload = this.buildGraphicsPayload(rawPayload.nominations, rawPayload.nowPlaying, rawPayload.nextFilm);
      }

      const rows = [];
      rows.push(["SECTION", "CATEGORY", "FILM_TITLE", "DIRECTOR", "COUNTRY", "DURATION", "VOTES", "STATUS"]);

      if (payload.nowPlaying) {
        const p = payload.nowPlaying;
        rows.push(["NOW_PLAYING", p.category, p.title, p.director, p.country, p.duration || "-", "-", "ON_AIR"]);
      }
      if (payload.nextFilm) {
        const n = payload.nextFilm;
        rows.push(["NEXT_UP", n.category, n.title, n.director, n.country, n.duration || "-", "-", "NEXT"]);
      }

      (payload.nominations || []).forEach(nom => {
        (nom.films || []).forEach(film => {
          rows.push([
            "NOMINEE",
            nom.title,
            film.title,
            film.director,
            film.country,
            film.duration || "-",
            film.votes,
            "NOMINATED"
          ]);
        });
      });

      const csvContent = "\uFEFF" + rows.map(r => r.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\r\n");
      this.triggerDownload(csvContent, filename, "text/csv;charset=utf-8;");
    },

    /**
     * Generate standalone self-contained 1080p HTML for OBS Browser Source
     */
    generateOBSHtml(rawPayload) {
      let payload = rawPayload;
      if (!rawPayload || !rawPayload.meta) {
        payload = this.buildGraphicsPayload(rawPayload ? rawPayload.nominations : [], rawPayload ? rawPayload.nowPlaying : null, rawPayload ? rawPayload.nextFilm : null);
      }

      const np = payload.nowPlaying || {
        title: "AISFF CEREMONIJA",
        director: "Tiesioginė transliacija",
        category: "Ceremonija",
        country: "Lietuva"
      };

      const next = payload.nextFilm;

      return `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080, initial-scale=1.0">
  <title>AISFF - Broadcast Lower Third & H2H Graphic</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1920px;
      height: 1080px;
      background: transparent;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #FFFFFF;
    }
    .obs-canvas {
      position: relative;
      width: 1920px;
      height: 1080px;
      pointer-events: none;
    }
    /* Lower Third Main Plate */
    .lower-third-card {
      position: absolute;
      left: 96px;
      bottom: 84px;
      min-width: 680px;
      max-width: 1020px;
      background: #070908;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      padding: 26px 36px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
      animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .top-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 10px;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.5);
      color: #FCA5A5;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 2px;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #EF4444;
      box-shadow: 0 0 10px #EF4444;
      animation: pulse 1.5s infinite;
    }
    .festival-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #E2E8F0;
      font-weight: 700;
    }
    .film-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 36px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.02em;
      line-height: 1.15;
      text-transform: uppercase;
    }
    .film-meta {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 15px;
      color: #CBD5E1;
      font-weight: 500;
      font-family: 'JetBrains Mono', monospace;
    }
    .film-meta-sep {
      color: rgba(255, 255, 255, 0.3);
    }
    .film-category {
      color: #34D399;
      font-weight: 600;
    }
    /* Up Next Secondary Strip */
    .up-next-row {
      margin-top: 4px;
      padding-top: 10px;
      border-top: 1px dashed rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    .up-next-label {
      color: #94A3B8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
    }
    .up-next-title {
      color: #FFFFFF;
      font-weight: 600;
    }
    .up-next-director {
      color: #94A3B8;
    }

    /* Bug / Watermark in Top Right */
    .top-right-bug {
      position: absolute;
      right: 96px;
      top: 64px;
      background: #070908;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .bug-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .bug-year {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #34D399;
      font-weight: 600;
    }

    @keyframes slideInUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.15); }
    }
  </style>
</head>
<body>
  <div class="obs-canvas">
    <!-- Top Right Corner Festival Bug -->
    <div class="top-right-bug">
      <div class="bug-title">AISFF</div>
      <div class="bug-year">2027</div>
    </div>

    <!-- Lower Third Overlay Card -->
    <div class="lower-third-card" id="lowerThirdPlate">
      <div class="top-strip">
        <div class="live-badge">
          <span class="live-dot"></span>
          <span>DABAR ETERIS</span>
        </div>
        <div class="festival-name">Kauno Tarptautinė Gimnazija</div>
      </div>

      <div class="film-title" id="dispTitle">${escapeHtml(np.title)}</div>

      <div class="film-meta">
        <span id="dispDirector">Režisierius: ${escapeHtml(np.director)}</span>
        <span class="film-meta-sep">•</span>
        <span id="dispCategory" class="film-category">${escapeHtml(np.category)}</span>
        <span class="film-meta-sep">•</span>
        <span id="dispCountry">${escapeHtml(np.country)}</span>
      </div>

      ${next ? `
      <div class="up-next-row" id="dispNextRow">
        <span class="up-next-label">Kitas filmas:</span>
        <span class="up-next-title" id="dispNextTitle">${escapeHtml(next.title)}</span>
        <span class="up-next-director" id="dispNextDir">(${escapeHtml(next.director)})</span>
      </div>
      ` : ''}
    </div>
  </div>

  <script>
    // Live updater script: checks for live /api/broadcast/overlay updates if hosted on a web server
    (function() {
      async function pollOverlay() {
        try {
          const res = await fetch('/api/broadcast/overlay');
          if (res.ok) {
            const data = await res.json();
            if (data.nowPlaying && data.nowPlaying.title) {
              const t = document.getElementById('dispTitle');
              const d = document.getElementById('dispDirector');
              const c = document.getElementById('dispCategory');
              const k = document.getElementById('dispCountry');
              if (t) t.textContent = data.nowPlaying.title;
              if (d) d.textContent = 'Režisierius: ' + (data.nowPlaying.director || 'Mokinys');
              if (c) c.textContent = data.nowPlaying.category || 'Filmas';
              if (k) k.textContent = data.nowPlaying.country || 'Lietuva';
            }
            if (data.nextFilm && data.nextFilm.title) {
              const nt = document.getElementById('dispNextTitle');
              const nd = document.getElementById('dispNextDir');
              if (nt) nt.textContent = data.nextFilm.title;
              if (nd) nd.textContent = '(' + (data.nextFilm.director || '') + ')';
            }
          }
        } catch (e) {
          // Offline fallback mode
        }
      }
      setInterval(pollOverlay, 5000);
    })();
  </script>
</body>
</html>`;
    },

    /**
     * Download standalone OBS Browser Source HTML file
     */
    downloadOBSHtml(rawPayload, filename = "asiff-h2h-overlay.html") {
      const htmlContent = this.generateOBSHtml(rawPayload);
      this.triggerDownload(htmlContent, filename, "text/html;charset=utf-8;");
    },

    triggerDownload(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  window.H2HExport = H2HExport;
})(window);
