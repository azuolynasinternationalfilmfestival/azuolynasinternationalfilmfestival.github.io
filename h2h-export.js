/**
 * Ąžuolynas Film Festival - Broadcast Graphics & H2H Graphic Exporter
 * Generates JSON and CSV files formatted for live television graphics (H2H Graphic, CasparCG, OBS, vMix).
 */
(function(window) {
  const H2HExport = {
    /**
     * Build unified broadcast payload
     */
    buildGraphicsPayload(nominations = [], nowPlaying = null, nextFilm = null, votesData = {}) {
      return {
        meta: {
          festival: "Ąžuolynas International Student Film Festival",
          exportedAt: new Date().toISOString(),
          version: "1.0.0"
        },
        nowPlaying: nowPlaying ? {
          title: nowPlaying.filmTitle || nowPlaying.title || "",
          director: nowPlaying.director || nowPlaying.name || "",
          country: nowPlaying.country || "Lietuva",
          duration: nowPlaying.duration || "",
          category: nowPlaying.category || "",
          synopsis: nowPlaying.synopsis || "",
          status: "ON_AIR"
        } : null,
        nextFilm: nextFilm ? {
          title: nextFilm.filmTitle || nextFilm.title || "",
          director: nextFilm.director || nextFilm.name || "",
          country: nextFilm.country || "Lietuva",
          duration: nextFilm.duration || "",
          category: nextFilm.category || "",
          status: "UP_NEXT"
        } : null,
        nominations: nominations.map(nom => ({
          id: nom.id || nom.name,
          title: nom.title || nom.name,
          category: nom.category || nom.name,
          films: (nom.films || []).map(f => ({
            id: f.id,
            title: f.filmTitle || f.title,
            director: f.director || f.name,
            country: f.country || "LT",
            votes: votesData[f.id] || f.votesCount || 0
          }))
        }))
      };
    },

    /**
     * Download JSON format for H2H Graphic or OBS Browser Source
     */
    downloadJSON(payload, filename = "asiff-broadcast-graphics.json") {
      const jsonStr = JSON.stringify(payload, null, 2);
      this.triggerDownload(jsonStr, filename, "application/json");
    },

    /**
     * Download CSV format for spreadsheet rundowns and graphic software table inputs
     */
    downloadCSV(payload, filename = "asiff-broadcast-rundown.csv") {
      const rows = [];
      rows.push(["SECTION", "CATEGORY", "FILM_TITLE", "DIRECTOR", "COUNTRY", "DURATION", "VOTES", "STATUS"]);

      if (payload.nowPlaying) {
        const p = payload.nowPlaying;
        rows.push(["NOW_PLAYING", p.category, p.title, p.director, p.country, p.duration, "-", "ON_AIR"]);
      }
      if (payload.nextFilm) {
        const n = payload.nextFilm;
        rows.push(["NEXT_UP", n.category, n.title, n.director, n.country, n.duration, "-", "NEXT"]);
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

      const csvContent = rows.map(r => r.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(",")).join("\r\n");
      this.triggerDownload(csvContent, filename, "text/csv;charset=utf-8;");
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

  window.H2HExport = H2HExport;
})(window);
