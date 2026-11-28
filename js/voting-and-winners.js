/**
 * voting-and-winners.js
 * Enhanced Laureates Showcase & Audience Choice Voting System
 * Ąžuolynas International Film Festival
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.FestivalLaureates = exports.FestivalLaureates;
    root.FestivalVoting = exports.FestivalVoting;
    root.triggerFestivalConfetti = exports.triggerFestivalConfetti;
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function formatParticipantName(film) {
    if (!film) return "";
    const full = [film.directorFirstName, film.directorLastName]
      .filter((v) => typeof v === "string" && v.trim())
      .join(" ")
      .trim();
    return full || film.director || film.directorName || film.name || "";
  }

  const LAUREL_SVG = `
    <svg class="winner-laurel-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  `;

  const LAUREL_BRANCH_SVG = `
    <svg class="winner-laurel-icon" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-4.5 18.9V19c0-.6.4-1 1-1h1v-2c0-.6.4-1 1-1h1.5l1.4-2.8c.2-.4.6-.7 1.1-.7H16v-2h-3c-.6 0-1-.4-1-1s.4-1 1-1h4V7h-3c-.6 0-1-.4-1-1s.4-1 1-1h2V3.1A10 10 0 0 0 12 2z"/>
    </svg>
  `;

  // Canvas confetti animation engine
  function triggerFestivalConfetti() {
    let canvas = document.getElementById("confettiCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confettiCanvas";
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ["#e6b980", "#6fa58a", "#ffffff", "#c4974a", "#296658", "#ffd700"];
    const particles = [];
    const particleCount = 120;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() * 200 - 100),
        y: height * 0.7 + (Math.random() * 100 - 50),
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 8,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.45,
        drag: 0.96,
        alpha: 1
      });
    }

    let animationFrame;
    const startTime = Date.now();

    function render() {
      ctx.clearRect(0, 0, width, height);
      let alive = false;

      for (let p of particles) {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (Date.now() - startTime > 1800) {
          p.alpha -= 0.02;
        }

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrame);
        ctx.clearRect(0, 0, width, height);
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }
    }

    render();
  }

  function bindTablistRoving(tablistId, btnSelector, panelId, onActivate) {
    const tablist = document.getElementById(tablistId);
    if (!tablist || tablist.dataset.ariaBound === "1") return;
    tablist.dataset.ariaBound = "1";
    const tabs = Array.from(tablist.querySelectorAll(btnSelector));
    const panel = document.getElementById(panelId);
    tabs.forEach((btn, idx) => {
      if (!btn.hasAttribute("role")) btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", panelId);
      const isSelected = btn.getAttribute("aria-selected") === "true" || btn.classList.contains("active");
      btn.setAttribute("tabindex", isSelected ? "0" : "-1");
      if (isSelected && panel && btn.id) panel.setAttribute("aria-labelledby", btn.id);
      btn.addEventListener("keydown", (e) => {
        let nextIdx = null;
        if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
        else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") nextIdx = 0;
        else if (e.key === "End") nextIdx = tabs.length - 1;
        if (nextIdx !== null) {
          e.preventDefault();
          const target = tabs[nextIdx];
          if (target) {
            onActivate(target);
            target.focus();
          }
        }
      });
    });
  }

  // ==========================================
  // LAUREATES / WINNERS SYSTEM
  // ==========================================
  const FestivalLaureates = {
    currentCategory: "all",
    cachedWinners: [],
    currentLang: "en",

    setCategory: function (cat, btnElem) {
      this.currentCategory = cat;
      const bar = document.getElementById("resultsFilterBar");
      const panel = document.getElementById("winnersListContainer");
      if (bar) {
        const btns = bar.querySelectorAll(".results-filter-btn");
        btns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
          b.setAttribute("tabindex", "-1");
        });
      }
      if (btnElem) {
        btnElem.classList.add("active");
        btnElem.setAttribute("aria-selected", "true");
        btnElem.setAttribute("tabindex", "0");
        if (panel && btnElem.id) panel.setAttribute("aria-labelledby", btnElem.id);
      }
      this.render();
    },

    render: function (films, lang) {
      if (films) this.cachedWinners = films.filter((f) => f.isWinner === true);
      if (lang) this.currentLang = lang;
      bindTablistRoving("resultsFilterBar", ".results-filter-btn", "winnersListContainer", (btn) => {
        const m = (btn.getAttribute("onclick") || "").match(/setCategory\(['"]([^'"]+)['"]/);
        this.setCategory(m ? m[1] : (btn.dataset.category || "all"), btn);
      });

      const container = document.getElementById("winnersListContainer");
      if (!container) return;

      const isLt = this.currentLang === "lt";
      const winners = this.cachedWinners;

      if (!winners || winners.length === 0) {
        container.innerHTML = `
          <div class="winner-deliberation-box">
            <div class="winner-deliberation-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg></div>
            <h3 class="winner-deliberation-title">
              ${isLt ? "Festivalio Laureatų Skelbimas" : "Official Laureates Reveal"}
            </h3>
            <p class="winner-deliberation-text">
              ${isLt
                ? "Tarptautinė vertinimo komisija vertina konkursinius darbus. Oficialūs festivalio nugalėtojai, Grand Prix laureatai ir nominacijų nugalėtojai bus paskelbti iškilmingos apdovanojimų ceremonijos metu Kauno tarptautinėje gimnazijoje 2027 m. balandžio 27 d."
                : "The international festival jury evaluates all competing entries. Official festival laureates, the Grand Prix winner, and special jury mentions will be unveiled during the award gala at Kaunas International Gymnasium on April 27, 2027."}
            </p>
            <div class="winner-deliberation-pills">
              <span class="chip">Grand Prix</span>
              <span class="chip">${isLt ? "I Kategorija (10–13)" : "Category I (10–13)"}</span>
              <span class="chip">${isLt ? "II Kategorija (14–18)" : "Category II (14–18)"}</span>
              <span class="chip">${isLt ? "Žiūrovų Simpatijų Prizas" : "Audience Choice Award"}</span>
              <span class="chip">${isLt ? "Už Vaizdo Meistriškumą" : "Best Cinematography"}</span>
            </div>
          </div>
        `;
        return;
      }

      // Filter by category
      let filtered = winners;
      if (this.currentCategory === "top") {
        filtered = winners.filter((w) => {
          const award = (w.awardTitle || "").toLowerCase();
          return award.includes("grand") || award.includes("1-oji") || award.includes("1st") || award.includes("pirmoji") || award.includes("best film");
        });
      } else if (this.currentCategory === "cat1") {
        filtered = winners.filter((w) => (w.category || "").includes("I") && !(w.category || "").includes("II"));
      } else if (this.currentCategory === "cat2") {
        filtered = winners.filter((w) => (w.category || "").includes("II"));
      } else if (this.currentCategory === "special") {
        filtered = winners.filter((w) => {
          const award = (w.awardTitle || "").toLowerCase();
          return award.includes("simpatij") || award.includes("audience") || award.includes("special") || award.includes("nominac");
        });
      }

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state-notice">
            ${isLt ? "Šioje kategorijoje laureatų kol kas nėra." : "No laureates in this category yet."}
          </div>
        `;
        return;
      }

      const sortedWinners = [...filtered].sort((a, b) => {
        const rankA = Number(a.juryPlace || a.place || 999);
        const rankB = Number(b.juryPlace || b.place || 999);
        if (rankA !== rankB) return rankA - rankB;
        return Number(b.votesCount || 0) - Number(a.votesCount || 0);
      });

      container.innerHTML = sortedWinners.map((w) => {
        const award = w.awardTitle || (isLt ? "Laureatas" : "Laureate");
        const placeLabel = w.juryPlace ? `${w.juryPlace}${isLt ? " vieta" : (w.juryPlace === 1 ? "st" : w.juryPlace === 2 ? "nd" : "rd")} • ` : "";
        const isTop =
          Number(w.juryPlace) === 1 ||
          award.toLowerCase().includes("grand") ||
          award.toLowerCase().includes("1-oji") ||
          award.toLowerCase().includes("1st") ||
          award.toLowerCase().includes("pirmoji");

        const durationText = w.videoDurationSeconds ? `${w.videoDurationSeconds}s` : "";
        const synopsis = w.synopsis || "";
        const participantName = formatParticipantName(w) || (isLt ? "Autorius" : "Filmmaker");

        return `
          <div class="winner-card ${isTop ? "top-honor" : ""}" id="winner-${w.id}">
            <div>
              <div class="winner-laurel-wrap">
                ${LAUREL_BRANCH_SVG}
                <div class="winner-badge">
                  <span>${placeLabel}${award}</span>
                </div>
                ${LAUREL_BRANCH_SVG}
              </div>

              <h3 class="winner-title">${w.filmTitle || (isLt ? "Bevardis filmas" : "Untitled Film")}</h3>

              <div class="winner-thumb-box" onclick="openPublicModal('${w.id}')" title="${isLt ? "Žiūrėti filmą" : "Watch film"}">
                <video src="${w.videoUrl || ""}" preload="metadata" muted playsinline></video>
                <div class="winner-thumb-play-overlay">
                  <div class="winner-play-btn-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg></div>
                </div>
                ${durationText ? `<span class="winner-duration-pill">${durationText}</span>` : ""}
              </div>

              <div class="winner-meta">
                <div class="winner-director-line">
                  <strong>${participantName}</strong>
                </div>
                <div>${w.institution ? `${w.institution} • ` : ""}${w.location || ""}</div>
                <div class="winner-tags-row">
                  <span class="winner-tag-pill">${w.category || (isLt ? "Konkursas" : "Competition")}</span>
                  ${w.deviceModel ? `<span class="winner-tag-pill">${w.deviceModel}</span>` : ""}
                </div>
                ${synopsis ? `<div class="winner-synopsis-teaser">“${synopsis}”</div>` : ""}
              </div>
            </div>

            <div class="winner-actions-col">
              <button class="btn-solid btn-full" onclick="openPublicModal('${w.id}')">
                ${isLt ? "ŽIŪRĖTI LAUREATO FILMĄ" : "WATCH AWARD-WINNING FILM"}
              </button>

              <div class="winner-social-share">
                <span class="winner-share-label">${isLt ? "Dalintis apdovanojimu:" : "Share award:"}</span>
                <div class="winner-share-btns">
                  <button type="button" class="btn-share-pill btn-share-fb" onclick="FestivalShare.shareWinnerFacebook('${w.id}')" title="Share on Facebook" aria-label="Share on Facebook">
                    <svg class="share-icon-sm" viewBox="0 0 24 24"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Facebook</span>
                  </button>
                  <button type="button" class="btn-share-pill btn-share-ig" onclick="FestivalShare.shareWinnerInstagram('${w.id}')" title="Share on Instagram" aria-label="Share on Instagram">
                    <svg class="share-icon-sm" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    <span>Instagram</span>
                  </button>
                  <button type="button" class="btn-share-pill btn-share-copy" onclick="FestivalShare.copyWinnerLink('${w.id}')" title="Copy link" aria-label="Copy link">
                    <svg class="share-icon-sm" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  };

  // ==========================================
  // AUDIENCE CHOICE VOTING SYSTEM
  // ==========================================
  const FestivalVoting = {
    cachedFilms: [],
    activeCategory: "all",
    searchQuery: "",
    sortMode: "votes",
    currentLang: "en",
    pendingVoteFilmId: null,

    init: function (films, lang) {
      if (films) this.cachedFilms = films.filter((f) => f.inVoting === true);
      if (lang) this.currentLang = lang;
      bindTablistRoving("votingTabsGroup", ".voting-tab-btn", "filmsGalleryContainer", (btn) => {
        const m = (btn.getAttribute("onclick") || "").match(/setCategory\(['"]([^'"]+)['"]/);
        this.setCategory(m ? m[1] : (btn.dataset.category || "all"), btn);
      });
      this.render();
      this.updateStatusBanner();

      // Sync server-authoritative live vote counts only when backend API is present
      Promise.resolve(window.FestivalApi && typeof window.FestivalApi.hasServer === "function" ? window.FestivalApi.hasServer() : false)
        .then((hasServer) => (hasServer ? fetch("/api/votes") : null))
        .then((res) => (res && res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success && data.votes) {
            let changed = false;
            this.cachedFilms.forEach((film) => {
              if (data.votes[film.id] !== undefined) {
                const srvCount = Number(data.votes[film.id]);
                if (srvCount > (film.votesCount || 0)) {
                  film.votesCount = srvCount;
                  changed = true;
                }
              }
            });
            if (changed) {
              this.render();
              this.updateStatusBanner();
            }
          }
        })
        .catch(() => {});
    },

    setCategory: function (cat, btnElem) {
      this.activeCategory = cat;
      const group = document.getElementById("votingTabsGroup");
      const panel = document.getElementById("filmsGalleryContainer");
      if (group) {
        const btns = group.querySelectorAll(".voting-tab-btn");
        btns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
          b.setAttribute("tabindex", "-1");
        });
      }
      if (btnElem) {
        btnElem.classList.add("active");
        btnElem.setAttribute("aria-selected", "true");
        btnElem.setAttribute("tabindex", "0");
        if (panel && btnElem.id) panel.setAttribute("aria-labelledby", btnElem.id);
      }
      this.render();
    },

    setSearch: function (query) {
      this.searchQuery = (query || "").trim().toLowerCase();
      this.render();
    },

    setSort: function (mode) {
      this.sortMode = mode;
      this.render();
    },

    updateStatusBanner: function () {
      const banner = document.getElementById("voterStatusBanner");
      if (!banner) return;

      const isLt = this.currentLang === "lt";
      const votedFilmId = localStorage.getItem("festival_voted_film_id");

      if (votedFilmId) {
        const votedFilm = this.cachedFilms.find((f) => f.id === votedFilmId);
        const title = votedFilm ? votedFilm.filmTitle : (isLt ? "Pasirinktą filmą" : "Your selected film");

        banner.className = "voter-status-banner has-voted";
        banner.innerHTML = `
          <span>
            ${isLt ? "Jūsų oficialus festivalio balsas atiduotas už:" : "You have officially cast your festival vote for:"} 
            <strong class="status-highlight">“${title}”</strong>. ${isLt ? "Ačiū už jaunimo kino palaikymą." : "Thank you for supporting youth cinema."}
          </span>
          <button type="button" class="btn-campaign-link" onclick="FestivalVoting.shareCampaign('${votedFilmId}', 'copy')">
            ${isLt ? "Kviesti draugus balsuoti" : "Invite friends to vote"}
          </button>
        `;
      } else {
        banner.className = "voter-status-banner";
        banner.innerHTML = `
          <span>
            <strong>${isLt ? "Žiūrovų Simpatijų Balsavimas:" : "Audience Choice Award Voting:"}</strong> 
            ${isLt ? "Kiekvienas lankytojas turi 1 oficialų balsą. Peržiūrėkite filmus ir balsuokite už geriausią darbą." : "Each festival visitor receives 1 official vote. Watch the student films and vote for your favorite work."}
          </span>
          <span class="status-highlight">${this.cachedFilms.length} ${isLt ? "konkursiniai filmai" : "contending films"}</span>
        `;
      }
    },

    renderLeaderboard: function () {
      const widget = document.getElementById("votingLeaderboardWidget");
      if (!widget) return;

      const isLt = this.currentLang === "lt";
      const films = Array.isArray(this.cachedFilms) ? this.cachedFilms : [];
      if (films.length === 0) {
        widget.classList.add("is-empty");
        widget.innerHTML = "";
        return;
      }

      const safeText = (str) => String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const ranked = [...films]
        .sort((a, b) => {
          const diff = Number(b.votesCount || 0) - Number(a.votesCount || 0);
          if (diff !== 0) return diff;
          return String(a.filmTitle || "").localeCompare(String(b.filmTitle || ""));
        })
        .slice(0, 5);

      const totalVotes = films.reduce((sum, f) => sum + Number(f.votesCount || 0), 0);
      const maxVotes = Math.max(...ranked.map((f) => Number(f.votesCount || 0)), 1);
      const userVotedFilmId = localStorage.getItem("festival_voted_film_id");
      const voteWord = (n) => {
        if (!isLt) return n === 1 ? "vote" : "votes";
        if (n % 10 === 1 && n % 100 !== 11) return "balsas";
        if (n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 10 || n % 100 >= 20)) return "balsai";
        return "balsų";
      };

      widget.classList.remove("is-empty");
      widget.innerHTML = `
        <div class="lb-widget-header">
          <div class="lb-widget-title-group">
            <span class="lb-widget-kicker">${isLt ? "TIESIOGINĖ RIKIUOTĖ" : "LIVE STANDINGS"}</span>
            <h3 class="lb-widget-heading">${isLt ? "TOP 5 Lyderių Lentelė" : "Top 5 Films Leaderboard"}</h3>
          </div>
          <div class="lb-widget-meta">
            ${isLt ? `Iš viso balsų: ${totalVotes} • ${films.length} filmai` : `Total votes: ${totalVotes} • ${films.length} films`}
          </div>
        </div>
        <div class="lb-rows-list">
          ${ranked.map((film, idx) => {
            const votes = Number(film.votesCount || 0);
            const barWidth = totalVotes > 0 ? Math.max(4, Math.round((votes / maxVotes) * 100)) : 0;
            const sharePct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const rankNum = String(idx + 1).padStart(2, "0");
            const rankClass = idx < 3 ? `rank-${idx + 1}` : "";
            const isVoted = userVotedFilmId === film.id;
            const director = formatParticipantName(film) || (isLt ? "Autorius" : "Filmmaker");
            const cat = film.category ? ` • ${film.category}` : "";

            return `
              <button type="button" class="lb-row-btn ${isVoted ? "is-user-voted" : ""}" onclick="if (typeof openPublicModal === 'function') openPublicModal('${safeText(film.id)}')" title="${isLt ? "Peržiūrėti filmą" : "Watch film"}">
                <span class="lb-rank-num ${rankClass}">#${rankNum}</span>
                <span class="lb-film-info">
                  <span class="lb-film-title">${safeText(film.filmTitle || (isLt ? "Bevardis filmas" : "Untitled Film"))}</span>
                  <span class="lb-film-sub">${safeText(director)}${safeText(cat)}</span>
                </span>
                <span class="lb-bar-wrap" aria-hidden="true">
                  <span class="lb-bar-fill" style="display:block; width:${barWidth}%;"></span>
                </span>
                <span class="lb-votes-tally">${votes} ${voteWord(votes)} · ${sharePct}%</span>
              </button>
            `;
          }).join("")}
        </div>
      `;
    },

    render: function (films, lang) {
      if (films) this.cachedFilms = films.filter((f) => f.inVoting === true);
      if (lang) this.currentLang = lang;

      this.renderLeaderboard();

      const container = document.getElementById("filmsGalleryContainer");
      if (!container) return;

      const isLt = this.currentLang === "lt";
      const eligible = this.cachedFilms;

      if (!eligible || eligible.length === 0) {
        container.innerHTML = `
          <div class="empty-state-notice">
            ${isLt ? "Šiuo metu konkursinių filmų balsavimui dar nėra paskelbta. Užsukite netrukus!" : "There are currently no films open for public voting. Check back soon!"}
          </div>
        `;
        return;
      }

      // Filter by category
      let list = eligible.filter((f) => {
        if (this.activeCategory === "cat1") {
          return (f.category || "").includes("I") && !(f.category || "").includes("II");
        }
        if (this.activeCategory === "cat2") {
          return (f.category || "").includes("II");
        }
        return true;
      });

      // Filter by search
      if (this.searchQuery) {
        const q = this.searchQuery;
        list = list.filter((f) => {
          return (
            (f.filmTitle || "").toLowerCase().includes(q) ||
            (f.name || "").toLowerCase().includes(q) ||
            (f.institution || "").toLowerCase().includes(q) ||
            (f.location || "").toLowerCase().includes(q) ||
            (f.synopsis || "").toLowerCase().includes(q)
          );
        });
      }

      // Sort
      if (this.sortMode === "votes") {
        list.sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
      } else if (this.sortMode === "title") {
        list.sort((a, b) => (a.filmTitle || "").localeCompare(b.filmTitle || ""));
      }

      const totalVotes = eligible.reduce((acc, curr) => acc + (curr.votesCount || 0), 0);
      const userVotedFilmId = localStorage.getItem("festival_voted_film_id");

      if (list.length === 0) {
        container.innerHTML = `
          <div class="empty-state-notice">
            ${isLt ? "Pagal jūsų paieškos kriterijus filmų nerasta." : "No films matched your search criteria."}
          </div>
        `;
        return;
      }

      const buildCardHtml = (film, index) => {
        const votes = film.votesCount || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isThisFilmVoted = userVotedFilmId === film.id;
        const isUserAlreadyVoted = Boolean(userVotedFilmId);

        let voteBtnText = isLt ? "Balsuoti už šį filmą" : "Vote for this Film";
        let voteBtnClass = "btn-vote btn-vote-active";
        let voteBtnDisabled = false;

        if (isThisFilmVoted) {
          voteBtnText = isLt ? "Jūsų balsas atiduotas" : "Your Official Vote Cast";
          voteBtnClass = "btn-vote btn-voted";
          voteBtnDisabled = true;
        } else if (isUserAlreadyVoted) {
          voteBtnText = isLt ? "Balsas jau panaudotas" : "Vote already cast for another film";
          voteBtnClass = "btn-vote";
          voteBtnDisabled = true;
        }

        // Rank indicator
        let rankBadgeHtml = "";
        if (this.sortMode === "votes") {
          if (index === 0 && votes > 0) {
            rankBadgeHtml = `<span class="film-rank-badge rank-1">#1 ${isLt ? "Lyderis" : "Leader"}</span>`;
          } else if (index === 1 && votes > 0) {
            rankBadgeHtml = `<span class="film-rank-badge rank-2">#2 ${isLt ? "Vieta" : "Runner-up"}</span>`;
          } else if (index === 2 && votes > 0) {
            rankBadgeHtml = `<span class="film-rank-badge rank-3">#3 ${isLt ? "Vieta" : "Contender"}</span>`;
          } else {
            rankBadgeHtml = `<span class="film-rank-badge rank-other">#${index + 1}</span>`;
          }
        }

        const duration = film.videoDurationSeconds ? `${film.videoDurationSeconds}s` : "";

        return `
          <div class="film-card ${isThisFilmVoted ? "voted-card" : ""}" id="film-card-${film.id}">
            ${rankBadgeHtml}
            ${isThisFilmVoted ? `<div class="film-card-voted-stamp">${isLt ? "JŪSŲ BALSAS" : "VOTED"}</div>` : ""}

            <div>
              <div class="film-card-thumb" onclick="openPublicModal('${film.id}')" style="cursor: pointer;" title="${isLt ? "Žiūrėti filmą" : "Watch film"}">
                <video src="${film.videoUrl || ""}" preload="metadata" muted playsinline></video>
                <div class="winner-thumb-play-overlay">
                  <div class="winner-play-btn-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg></div>
                </div>
                ${duration ? `<span class="winner-duration-pill">${duration}</span>` : ""}
              </div>

              <div class="film-card-title">${film.filmTitle || (isLt ? "Bevardis filmas" : "Untitled Film")}</div>
              <div class="film-card-meta">
                <strong style="color:var(--text-color);">${formatParticipantName(film)}</strong><br>
                <span>${film.category || ""} • ${film.location || ""}</span>
                ${film.institution ? `<br><small style="color:var(--text-subtle);">${film.institution}</small>` : ""}
              </div>
            </div>

            <div>
              <button class="btn-preview" onclick="openPublicModal('${film.id}')">
                ${isLt ? "ŽIŪRĖTI FILMĄ" : "WATCH FILM"}
              </button>

              <div class="vote-box">
                <div class="vote-stats">
                  <span>${isLt ? "Žiūrovų balsai" : "Audience Votes"}</span>
                  <span class="vote-num" id="voteCount_${film.id}">${votes} (${pct}%)</span>
                </div>
                <div class="vote-bar-bg">
                  <div class="vote-bar-fill" id="voteFill_${film.id}" style="width: ${pct}%;"></div>
                </div>

                <button class="${voteBtnClass}" id="voteBtn_${film.id}" onclick="FestivalVoting.promptVote('${film.id}')" ${voteBtnDisabled ? "disabled" : ""}>
                  ${voteBtnText}
                </button>

                <div class="vote-campaign-share">
                  <span>${isLt ? "Kviesti balsuoti:" : "Campaign:"}</span>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="btn-campaign-link" onclick="FestivalVoting.shareCampaign('${film.id}', 'whatsapp')" title="WhatsApp">
                      WA
                    </button>
                    <button type="button" class="btn-campaign-link" onclick="FestivalVoting.shareCampaign('${film.id}', 'facebook')" title="Facebook">
                      FB
                    </button>
                    <button type="button" class="btn-campaign-link" onclick="FestivalVoting.shareCampaign('${film.id}', 'copy')" title="Copy Link">
                      URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      };

      const CHUNK_SIZE = 12;
      if (list.length <= CHUNK_SIZE || typeof setTimeout !== "function" || typeof container.insertAdjacentHTML !== "function") {
        container.innerHTML = list.map(buildCardHtml).join("");
      } else {
        const renderToken = (this._renderSeq = (this._renderSeq || 0) + 1);
        container.innerHTML = list.slice(0, CHUNK_SIZE).map(buildCardHtml).join("");
        let offset = CHUNK_SIZE;
        const appendNext = () => {
          if (this._renderSeq !== renderToken) return;
          const batchHtml = list.slice(offset, offset + CHUNK_SIZE).map((f, i) => buildCardHtml(f, offset + i)).join("");
          container.insertAdjacentHTML("beforeend", batchHtml);
          offset += CHUNK_SIZE;
          if (offset < list.length) {
            setTimeout(appendNext, 0);
          }
        };
        setTimeout(appendNext, 0);
      }

      this.updateStatusBanner();
    },

    promptVote: function (filmId) {
      const existingVote = localStorage.getItem("festival_voted_film_id");
      const isLt = this.currentLang === "lt";

      if (existingVote) {
        showToast(
          isLt
            ? "Jūs jau atidavėte savo festivalio balsą! Kiekvienas lankytojas gali balsuoti vieną kartą."
            : "You have already cast your single festival vote! Each visitor can vote once.",
          "error"
        );
        return;
      }

      const film = this.cachedFilms.find((f) => f.id === filmId);
      if (!film) return;

      this.pendingVoteFilmId = filmId;

      const modal = document.getElementById("voteConfirmModal");
      if (!modal) {
        // Direct vote if modal missing
        this.executeVote(filmId);
        return;
      }

      const directorName = formatParticipantName(film);
      document.getElementById("voteConfirmFilmTitle").textContent = film.filmTitle || (isLt ? "Filmas" : "Film");
      document.getElementById("voteConfirmDirector").textContent = directorName ? `${isLt ? "Režisierius" : "Director"}: ${directorName}` : "";
      document.getElementById("voteConfirmCategory").textContent = film.category ? `${film.category} • ${film.location || ""}` : "";

      modal.classList.add("active");
    },

    cancelVote: function () {
      this.pendingVoteFilmId = null;
      const modal = document.getElementById("voteConfirmModal");
      if (modal) modal.classList.remove("active");
    },

    confirmVote: async function () {
      if (!this.pendingVoteFilmId) return;
      const filmId = this.pendingVoteFilmId;
      this.cancelVote();
      await this.executeVote(filmId);
    },

    executeVote: async function (filmId) {
      const isLt = this.currentLang === "lt";
      const btn = document.getElementById("voteBtn_" + filmId);
      if (btn) btn.disabled = true;

      try {
        let uid = null;
        if (typeof firebase !== "undefined" && typeof firebase.auth === "function" && firebase.auth().currentUser) {
          uid = firebase.auth().currentUser.uid;
        } else {
          uid = localStorage.getItem("festival_voter_uid");
          if (!uid) {
            uid = "voter_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
            localStorage.setItem("festival_voter_uid", uid);
          }
        }

        let voteSucceeded = false;
        let finalVotesCount = null;

        // 1. Primary: Server-side vote handler (guaranteed persistent commit & audit)
        const hasServer = window.FestivalApi && typeof window.FestivalApi.hasServer === "function"
          ? await window.FestivalApi.hasServer().catch(() => false)
          : false;
        if (hasServer) {
          try {
            const apiResp = await fetch("/api/vote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filmId: filmId, voterUid: uid })
            });
            const result = await apiResp.json().catch(() => null);
            if (apiResp.ok && result && result.success) {
              voteSucceeded = true;
              finalVotesCount = result.votesCount;
            } else if (result && result.error === "already-voted") {
              throw new Error("already-voted");
            }
          } catch (apiErr) {
            if (apiErr.message === "already-voted") throw apiErr;
            console.warn("API vote endpoint fallback:", apiErr);
          }
        }

        // 2. Fallback: Client-side Firestore SDK
        if (!voteSucceeded) {
          const db = (typeof window !== "undefined" && window.db) || ((typeof firebase !== "undefined" && typeof firebase.firestore === "function") ? firebase.firestore() : null);
          if (db) {
            const filmRef = db.collection("submissions").doc(filmId);
            const hasSignedInUser = typeof firebase !== "undefined" && typeof firebase.auth === "function" && Boolean(firebase.auth().currentUser);
            const voteAuditRef = db.collection("submissions").doc(filmId).collection("votes").doc(uid);

            if (hasSignedInUser && typeof db.runTransaction === "function") {
              try {
                await db.runTransaction(async (transaction) => {
                  const voteDoc = await transaction.get(voteAuditRef);
                  if (voteDoc.exists) {
                    throw new Error("already-voted");
                  }
                  transaction.set(voteAuditRef, {
                    votedAt: firebase.firestore.FieldValue.serverTimestamp()
                  });
                  transaction.update(filmRef, {
                    votesCount: firebase.firestore.FieldValue.increment(1)
                  });
                });
                voteSucceeded = true;
              } catch (trxErr) {
                if (trxErr.message === "already-voted") throw trxErr;
                console.warn("Audit vote note:", trxErr.message);
              }
            }

            if (!voteSucceeded) {
              try {
                await filmRef.update({
                  votesCount: firebase.firestore.FieldValue.increment(1)
                });
                voteSucceeded = true;
              } catch (incErr) {
                console.warn("Vote update note:", incErr.message);
              }
            }
          }
        }

        if (!voteSucceeded && finalVotesCount === null) {
          throw new Error("Could not record vote");
        }

        localStorage.setItem("festival_voted_film_id", filmId);

        // Local pulse
        const countElem = document.getElementById("voteCount_" + filmId);
        if (countElem) {
          countElem.classList.add("pulse");
          setTimeout(() => countElem.classList.remove("pulse"), 800);
        }

        // Confetti celebration
        triggerFestivalConfetti();

        // Update cached film count & re-render
        const targetFilm = this.cachedFilms.find((f) => f.id === filmId);
        if (targetFilm) {
          targetFilm.votesCount = finalVotesCount !== null ? finalVotesCount : ((targetFilm.votesCount || 0) + 1);
        }
        this.render();

        showToast(
          isLt
            ? "Ačiū! Jūsų balsas sėkmingai įskaitytas. Žiūrovų simpatijų nugalėtojas bus apdovanotas ceremonijoje!"
            : "Thank you! Your official vote has been counted. The Audience Choice winner will be honored at the gala!"
        );
      } catch (err) {
        if (err.message === "already-voted") {
          localStorage.setItem("festival_voted_film_id", filmId);
          this.render();
          showToast(
            isLt
              ? "Jūs jau balsavote šiame festivalyje."
              : "You have already cast your vote in this festival.",
            "error"
          );
        } else {
          console.error(err);
          showToast(isLt ? "Balsavimo klaida. Bandykite vėliau." : "Voting error. Please try again later.", "error");
          if (btn) btn.disabled = false;
        }
      }
    },

    shareCampaign: function (filmId, platform) {
      const film = this.cachedFilms.find((f) => f.id === filmId);
      const title = film ? film.filmTitle : "Short Film";
      const director = formatParticipantName(film);
      const isLt = this.currentLang === "lt";

      const shareUrl = window.location.origin + window.location.pathname + "#competition";
      const text = isLt
        ? `Balsuokite už filmą „${title}“${director ? ` (autorius: ${director})` : ""} Tarptautiniame Ąžuolyno filmų festivalyje. Žiūrėti ir balsuoti čia: ${shareUrl}`
        : `Vote for the film "${title}"${director ? ` by ${director}` : ""} at the Ąžuolynas International Film Festival. Watch & vote here: ${shareUrl}`;

      if (platform === "whatsapp") {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
      } else if (platform === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, "_blank");
      } else {
        const copyFallback = () => {
          try {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            showToast(isLt ? "Kvietimas balsuoti nukopijuotas į iškarpinę!" : "Campaign link copied to clipboard!");
          } catch (_) {
            showToast(isLt ? "Nuoroda paruošta bendrinimui: " + shareUrl : "Share link ready: " + shareUrl);
          }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast(isLt ? "Kvietimas balsuoti nukopijuotas į iškarpinę!" : "Campaign link copied to clipboard!");
          }).catch(copyFallback);
        } else {
          copyFallback();
        }
      }
    },

    updateModalVoteBtn: function (filmId) {
      const strip = document.getElementById("modalVoteStrip");
      if (!strip) return;

      const isLt = this.currentLang === "lt";
      const film = this.cachedFilms.find((f) => f.id === filmId);
      if (!film) {
        strip.style.display = "none";
        return;
      }

      strip.style.display = "flex";
      const userVotedFilmId = localStorage.getItem("festival_voted_film_id");
      const isThisFilmVoted = userVotedFilmId === film.id;
      const isUserAlreadyVoted = Boolean(userVotedFilmId);

      const countSpan = document.getElementById("modalVoteCount");
      if (countSpan) countSpan.textContent = film.votesCount || 0;

      const btn = document.getElementById("modalVoteBtn");
      if (btn) {
        if (isThisFilmVoted) {
          btn.textContent = isLt ? "Jūsų balsas atiduotas" : "Your Vote Cast";
          btn.className = "btn-solid btn-voted";
          btn.disabled = true;
          btn.onclick = null;
        } else if (isUserAlreadyVoted) {
          btn.textContent = isLt ? "Balsas jau panaudotas" : "Vote already used";
          btn.className = "btn-outline";
          btn.disabled = true;
          btn.onclick = null;
        } else {
          btn.textContent = isLt ? "Balsuoti už šį filmą" : "Vote for this Film";
          btn.className = "btn-solid";
          btn.disabled = false;
          btn.onclick = function () {
            FestivalVoting.promptVote(filmId);
          };
        }
      }
    }
  };

  return {
    FestivalLaureates: FestivalLaureates,
    FestivalVoting: FestivalVoting,
    triggerFestivalConfetti: triggerFestivalConfetti
  };
});
