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
      if (bar) {
        const btns = bar.querySelectorAll(".results-filter-btn");
        btns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
      }
      if (btnElem) {
        btnElem.classList.add("active");
        btnElem.setAttribute("aria-selected", "true");
      }
      this.render();
    },

    render: function (films, lang) {
      if (films) this.cachedWinners = films.filter((f) => f.isWinner === true);
      if (lang) this.currentLang = lang;

      const container = document.getElementById("winnersListContainer");
      if (!container) return;

      const isLt = this.currentLang === "lt";
      const winners = this.cachedWinners;

      if (!winners || winners.length === 0) {
        container.innerHTML = `
          <div class="winner-deliberation-box">
            <div class="winner-deliberation-icon">🏆</div>
            <h3 class="winner-deliberation-title">
              ${isLt ? "Festivalio Laureatų Skelbimas" : "Official Laureates Reveal"}
            </h3>
            <p class="winner-deliberation-text">
              ${isLt
                ? "Tarptautinė vertinimo komisija šiuo metu vertina konkursinius darbus. Oficialūs festivalio nugalėtojai, Grand Prix laureatai ir nominacijų nugalėtojai bus paskelbti iškilmingos apdovanojimų ceremonijos metu Kauno „Ąžuolyno“ gimnazijoje 2026 m. balandžio 17 d.!"
                : "The international festival jury is currently evaluating all competing entries. Official festival laureates, the Grand Prix winner, and special jury mentions will be unveiled during the grand award gala at Kaunas 'Ąžuolynas' International Gymnasium on April 17, 2026!"}
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

      container.innerHTML = filtered.map((w) => {
        const award = w.awardTitle || (isLt ? "Laureatas" : "Laureate");
        const isTop =
          award.toLowerCase().includes("grand") ||
          award.toLowerCase().includes("1-oji") ||
          award.toLowerCase().includes("1st") ||
          award.toLowerCase().includes("pirmoji");

        const durationText = w.videoDurationSeconds ? `${w.videoDurationSeconds}s` : "";
        const synopsis = w.synopsis || "";

        return `
          <div class="winner-card ${isTop ? "top-honor" : ""}" id="winner-${w.id}">
            <div>
              <div class="winner-laurel-wrap">
                ${LAUREL_BRANCH_SVG}
                <div class="winner-badge">
                  <span>${isTop ? "🏆" : "🌟"} ${award}</span>
                </div>
                ${LAUREL_BRANCH_SVG}
              </div>

              <h3 class="winner-title">${w.filmTitle || (isLt ? "Bevardis filmas" : "Untitled Film")}</h3>

              <div class="winner-thumb-box" onclick="openPublicModal('${w.id}')" title="${isLt ? "Žiūrėti filmą" : "Watch film"}">
                <video src="${w.videoUrl || ""}" preload="metadata" muted playsinline></video>
                <div class="winner-thumb-play-overlay">
                  <div class="winner-play-btn-circle">▶</div>
                </div>
                ${durationText ? `<span class="winner-duration-pill">⏱ ${durationText}</span>` : ""}
              </div>

              <div class="winner-meta">
                <div class="winner-director-line">
                  <span>🎬</span>
                  <strong>${w.name || (isLt ? "Autorius" : "Filmmaker")}</strong>
                </div>
                <div>${w.institution ? `${w.institution} • ` : ""}${w.location || ""}</div>
                <div class="winner-tags-row">
                  <span class="winner-tag-pill">${w.category || (isLt ? "Konkursas" : "Competition")}</span>
                  ${w.deviceModel ? `<span class="winner-tag-pill">📱 ${w.deviceModel}</span>` : ""}
                </div>
                ${synopsis ? `<div class="winner-synopsis-teaser">“${synopsis}”</div>` : ""}
              </div>
            </div>

            <div class="winner-actions-col">
              <button class="btn-solid btn-full" onclick="openPublicModal('${w.id}')">
                ▶ ${isLt ? "ŽIŪRĖTI LAUREATO FILMĄ" : "WATCH AWARD-WINNING FILM"}
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
      this.render();
      this.updateStatusBanner();
    },

    setCategory: function (cat, btnElem) {
      this.activeCategory = cat;
      const group = document.getElementById("votingTabsGroup");
      if (group) {
        const btns = group.querySelectorAll(".voting-tab-btn");
        btns.forEach((b) => b.classList.remove("active"));
      }
      if (btnElem) btnElem.classList.add("active");
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
            ★ ${isLt ? "Jūsų oficialus festivalio balsas atiduotas už:" : "You have officially cast your festival vote for:"} 
            <strong class="status-highlight">“${title}”</strong>. ${isLt ? "Ačiū už jaunimo kino palaikymą!" : "Thank you for supporting youth cinema!"}
          </span>
          <button type="button" class="btn-campaign-link" onclick="FestivalVoting.shareCampaign('${votedFilmId}', 'copy')">
            🔗 ${isLt ? "Kviesti draugus balsuoti" : "Invite friends to vote"}
          </button>
        `;
      } else {
        banner.className = "voter-status-banner";
        banner.innerHTML = `
          <span>
            💡 <strong>${isLt ? "Žiūrovų Simpatijų Balsavimas:" : "Audience Choice Award Voting:"}</strong> 
            ${isLt ? "Kiekvienas festivalio lankytojas turi 1 oficialų balsą. Peržiūrėkite filmus ir palaikykite geriausią jaunąjį kūrėją!" : "Each festival visitor receives 1 official vote. Watch student films and vote for your favorite young director!"}
          </span>
          <span class="status-highlight">${this.cachedFilms.length} ${isLt ? "konkursiniai filmai" : "contending films"}</span>
        `;
      }
    },

    render: function (films, lang) {
      if (films) this.cachedFilms = films.filter((f) => f.inVoting === true);
      if (lang) this.currentLang = lang;

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

      container.innerHTML = list.map((film, index) => {
        const votes = film.votesCount || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const isThisFilmVoted = userVotedFilmId === film.id;
        const isUserAlreadyVoted = Boolean(userVotedFilmId);

        let voteBtnText = isLt ? "Balsuoti už šį filmą" : "Vote for this Film";
        let voteBtnClass = "btn-vote btn-vote-active";
        let voteBtnDisabled = false;

        if (isThisFilmVoted) {
          voteBtnText = isLt ? "★ Jūsų balsas atiduotas" : "★ Your Official Vote Cast";
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
            rankBadgeHtml = `<span class="film-rank-badge rank-1">🏆 #1 ${isLt ? "Lyderis" : "Favorite"}</span>`;
          } else if (index === 1 && votes > 0) {
            rankBadgeHtml = `<span class="film-rank-badge rank-2">🥈 #2 ${isLt ? "Vieta" : "Runner-up"}</span>`;
          } else if (index === 2 && votes > 0) {
            rankBadgeHtml = `<span class="film-rank-badge rank-3">🥉 #3 ${isLt ? "Vieta" : "Contender"}</span>`;
          } else {
            rankBadgeHtml = `<span class="film-rank-badge rank-other">#${index + 1}</span>`;
          }
        }

        const duration = film.videoDurationSeconds ? `${film.videoDurationSeconds}s` : "";

        return `
          <div class="film-card ${isThisFilmVoted ? "voted-card" : ""}" id="film-card-${film.id}">
            ${rankBadgeHtml}
            ${isThisFilmVoted ? `<div class="film-card-voted-stamp">★ ${isLt ? "JŪSŲ BALSAS" : "VOTED"}</div>` : ""}

            <div>
              <div class="film-card-thumb" onclick="openPublicModal('${film.id}')" style="cursor: pointer;" title="${isLt ? "Žiūrėti filmą" : "Watch film"}">
                <video src="${film.videoUrl || ""}" preload="metadata" muted playsinline></video>
                <div class="winner-thumb-play-overlay">
                  <div class="winner-play-btn-circle">▶</div>
                </div>
                ${duration ? `<span class="winner-duration-pill">⏱ ${duration}</span>` : ""}
              </div>

              <div class="film-card-title">${film.filmTitle || (isLt ? "Bevardis filmas" : "Untitled Film")}</div>
              <div class="film-card-meta">
                <strong style="color:var(--text-color);">${film.name || ""}</strong><br>
                <span>${film.category || ""} • ${film.location || ""}</span>
                ${film.institution ? `<br><small style="color:var(--text-subtle);">${film.institution}</small>` : ""}
              </div>
            </div>

            <div>
              <button class="btn-preview" onclick="openPublicModal('${film.id}')">
                ▶ ${isLt ? "ŽIŪRĖTI FILMĄ" : "WATCH FILM"}
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
                      🔗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join("");

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

      document.getElementById("voteConfirmFilmTitle").textContent = film.filmTitle || (isLt ? "Filmas" : "Film");
      document.getElementById("voteConfirmDirector").textContent = film.name ? `${isLt ? "Režisierius" : "Director"}: ${film.name}` : "";
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
        const user = firebase.auth().currentUser || (await firebase.auth().signInAnonymously()).user;
        const uid = user.uid;

        const db = firebase.firestore();
        const filmRef = db.collection("submissions").doc(filmId);
        const voteAuditRef = db.collection("submissions").doc(filmId).collection("votes").doc(uid);

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

        localStorage.setItem("festival_voted_film_id", filmId);

        // Local pulse
        const countElem = document.getElementById("voteCount_" + filmId);
        if (countElem) {
          countElem.classList.add("pulse");
          setTimeout(() => countElem.classList.remove("pulse"), 800);
        }

        // Confetti celebration
        triggerFestivalConfetti();

        // Re-render
        const targetFilm = this.cachedFilms.find((f) => f.id === filmId);
        if (targetFilm) {
          targetFilm.votesCount = (targetFilm.votesCount || 0) + 1;
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
      const director = film ? film.name : "";
      const isLt = this.currentLang === "lt";

      const shareUrl = window.location.origin + window.location.pathname + "#competition";
      const text = isLt
        ? `Balsuokite už filmą „${title}“${director ? ` (autorius: ${director})` : ""} Tarptautiniame Ąžuolyno filmų festivalyje! 🎬 Žiūrėti ir balsuoti čia: ${shareUrl}`
        : `Vote for the film "${title}"${director ? ` by ${director}` : ""} at the Ąžuolynas International Film Festival! 🎬 Watch & vote here: ${shareUrl}`;

      if (platform === "whatsapp") {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
      } else if (platform === "facebook") {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`, "_blank");
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast(isLt ? "Kvietimas balsuoti nukopijuotas į iškarpinę!" : "Campaign link copied to clipboard!");
          }).catch(() => {
            prompt(isLt ? "Nukopijuokite nuorodą:" : "Copy link:", text);
          });
        } else {
          prompt(isLt ? "Nukopijuokite nuorodą:" : "Copy link:", text);
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
          btn.textContent = isLt ? "★ Jūsų balsas atiduotas" : "★ Your Vote Cast";
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
