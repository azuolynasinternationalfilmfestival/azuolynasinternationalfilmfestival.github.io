/**
 * Festival Photo Album & Pro Lightbox System
 * Features:
 * - Album filtering (All, 2025 Ceremony, Laureates & Guests, Awards & Trophies)
 * - Fullscreen toggle, zoom in/out with drag pan & double-click reset
 * - Auto-play slideshow with play/pause and progress bar
 * - Thumbnail strip with active indicator and scroll-into-view
 * - High-res image download and copy photo link
 * - Social sharing (Facebook, Instagram helper, direct copy)
 * - Keyboard navigation (Left, Right, Esc, Space, +, -, F)
 * - Touch swipe gestures for mobile & pinch-to-zoom prevention/handling
 */

(function () {
  const i18n = {
    lt: {
      allAlbums: "Visos nuotraukos",
      ceremonyAlbum: "Fest 2025 Ceremonija",
      laureatesAlbum: "Laureatai ir svečiai",
      prizesAlbum: "Taurės ir apdovanojimai",
      playSlideshow: "Paleisti demonstraciją (Tarpas)",
      pauseSlideshow: "Pristabdyti demonstraciją (Tarpas)",
      fullscreen: "Visas ekranas (F)",
      exitFullscreen: "Išeiti iš viso ekrano (F)",
      zoomIn: "Priartinti (+)",
      zoomOut: "Nutolinti (-)",
      resetZoom: "Atstatyti dydį (0)",
      download: "Atsisiųsti nuotrauką",
      share: "Dalintis",
      close: "Uždaryti (Esc)",
      prev: "Ankstesnė nuotrauka (Kairėn)",
      next: "Kita nuotrauka (Dešinėn)",
      photoCopied: "Nuotraukos nuoroda nukopijuota!",
      viewFull: "Peržiūrėti albumą",
      photoOf: "iš"
    },
    en: {
      allAlbums: "All Photos",
      ceremonyAlbum: "Fest 2025 Ceremony",
      laureatesAlbum: "Laureates & Guests",
      prizesAlbum: "Trophies & Honors",
      playSlideshow: "Play slideshow (Space)",
      pauseSlideshow: "Pause slideshow (Space)",
      fullscreen: "Fullscreen (F)",
      exitFullscreen: "Exit fullscreen (F)",
      zoomIn: "Zoom in (+)",
      zoomOut: "Zoom out (-)",
      resetZoom: "Reset zoom (0)",
      download: "Download photo",
      share: "Share",
      close: "Close (Esc)",
      prev: "Previous photo (Left arrow)",
      next: "Next photo (Right arrow)",
      photoCopied: "Photo link copied!",
      viewFull: "View in Lightbox",
      photoOf: "of"
    }
  };

  class FestivalPhotoLightbox {
    constructor() {
      this.photos = [];
      this.filteredPhotos = [];
      this.currentIdx = 0;
      this.currentAlbum = "all";
      this.lang = "en";
      this.isPlaying = false;
      this.slideshowTimer = null;
      this.slideshowDuration = 4000;
      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      this.isDragging = false;
      this.dragStartX = 0;
      this.dragStartY = 0;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.initialized = false;
    }

    init(photos, lang = "en") {
      this.lang = lang === "lt" ? "lt" : "en";
      this.photos = this.normalizePhotos(photos);
      this.filterByAlbum(this.currentAlbum);
      this.renderAlbumTabs();
      this.renderGalleryGrid();
      this.setupDOM();
      this.bindGlobalKeys();
    }

    normalizePhotos(list) {
      if (!Array.isArray(list) || list.length === 0) {
        return [
          {
            id: "ph_1",
            caption: this.lang === "lt" ? "Akimirkos iš 2025 m. festivalio ceremonijos Kauno tarptautinėje gimnazijoje" : "Moments from the 2025 Film Festival Ceremony at Kaunas International Gymnasium",
            url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b",
            album: "ceremony"
          },
          {
            id: "ph_2",
            caption: this.lang === "lt" ? "Festivalio laureatai, svečiai ir komisijos nariai 2025 m." : "Festival laureates, jury and attendees celebrating in 2025",
            url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3459.jpeg?alt=media&token=dfdda212-9ea6-433f-af80-8c5b5b57f361",
            album: "laureates"
          },
          {
            id: "ph_3",
            caption: this.lang === "lt" ? "Oficialūs festivalio apdovanojimai, ąžuolo statulėlės ir laureatų diplomai" : "Official festival trophies, handcrafted oak awards, and laureate diplomas",
            url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da",
            album: "prizes"
          }
        ];
      }

      return list.map((p, idx) => {
        let album = p.album || "ceremony";
        const cap = (p.caption || "").toLowerCase();
        if (cap.includes("priz") || cap.includes("award") || cap.includes("troph") || cap.includes("taur")) {
          album = "prizes";
        } else if (cap.includes("laureat") || cap.includes("nugalėtoj") || cap.includes("dalyv") || cap.includes("guest") || cap.includes("winner")) {
          album = "laureates";
        }
        return {
          id: p.id || `photo_${idx}`,
          caption: p.caption || (this.lang === "lt" ? `Festivalio nuotrauka #${idx + 1}` : `Festival Photo #${idx + 1}`),
          url: p.url,
          album: album
        };
      });
    }

    filterByAlbum(albumKey) {
      this.currentAlbum = albumKey;
      if (albumKey === "all") {
        this.filteredPhotos = [...this.photos];
      } else {
        this.filteredPhotos = this.photos.filter((p) => p.album === albumKey);
        if (this.filteredPhotos.length === 0) {
          this.filteredPhotos = [...this.photos];
        }
      }
    }

    openAlbum(albumKey) {
      this.filterByAlbum(albumKey);
      this.renderAlbumTabs();
      this.renderGalleryGrid();
      if (this.filteredPhotos.length > 0) {
        this.open(0);
      }
    }

    startSlideshowForAlbum(albumKey) {
      this.filterByAlbum(albumKey);
      this.renderAlbumTabs();
      this.renderGalleryGrid();
      if (this.filteredPhotos.length > 0) {
        this.open(0);
        if (!this.isPlaying) {
          this.toggleSlideshow();
        }
      }
    }

    renderAlbumTabs() {
      const container = document.getElementById("photoAlbumTabs");
      if (!container) return;

      const t = i18n[this.lang];
      const tabs = [
        { key: "all", label: t.allAlbums, count: this.photos.length },
        { key: "ceremony", label: t.ceremonyAlbum, count: this.photos.filter((p) => p.album === "ceremony").length },
        { key: "laureates", label: t.laureatesAlbum, count: this.photos.filter((p) => p.album === "laureates").length },
        { key: "prizes", label: t.prizesAlbum, count: this.photos.filter((p) => p.album === "prizes").length }
      ].filter((tab) => tab.key === "all" || tab.count > 0);

      container.innerHTML = tabs.map((tab) => `
        <button type="button" class="album-filter-pill ${this.currentAlbum === tab.key ? 'active' : ''}" data-album="${tab.key}">
          <span>${tab.label}</span>
          <span class="album-pill-count">${tab.count}</span>
        </button>
      `).join("");

      container.querySelectorAll(".album-filter-pill").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll(".album-filter-pill").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          this.filterByAlbum(btn.dataset.album);
          this.renderGalleryGrid();
        });
      });
    }

    renderGalleryGrid() {
      const container = document.getElementById("archivePhotosContainer");
      if (!container) return;

      if (this.filteredPhotos.length === 0) {
        container.innerHTML = `
          <div class="empty-state-notice" style="grid-column: 1 / -1;">
            ${this.lang === "lt" ? "Šiame albume šiuo metu nėra nuotraukų." : "There are currently no photos in this album."}
          </div>
        `;
        return;
      }

      const t = i18n[this.lang];

      container.innerHTML = this.filteredPhotos.map((p, idx) => `
        <div class="gallery-item-pro" data-idx="${idx}" role="button" tabindex="0" aria-label="${p.caption}">
          <div class="gallery-item-media-pro">
            <img src="${p.url}" alt="${p.caption}" loading="lazy" decoding="async">
            <div class="gallery-overlay-badge">${p.album ? p.album.toUpperCase() : "PHOTO"}</div>
            <div class="gallery-hover-actions">
              <span class="gallery-view-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                ${t.viewFull}
              </span>
            </div>
          </div>
          <div class="gallery-caption-pro">
            <p class="gallery-caption-text">${p.caption}</p>
            <div class="gallery-caption-footer">
              <span class="gallery-photo-num">#${idx + 1}</span>
              <button type="button" class="btn-quick-zoom" title="${t.zoomIn}" onclick="event.stopPropagation(); window.FestivalLightbox.open(${idx});">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
              </button>
            </div>
          </div>
        </div>
      `).join("");

      container.querySelectorAll(".gallery-item-pro").forEach((el) => {
        el.addEventListener("click", () => {
          const idx = parseInt(el.dataset.idx, 10);
          this.open(idx);
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const idx = parseInt(el.dataset.idx, 10);
            this.open(idx);
          }
        });
      });
    }

    setupDOM() {
      if (document.getElementById("proLightboxModal")) return;

      const t = i18n[this.lang];
      const markup = `
        <div id="proLightboxModal" class="pro-lightbox" role="dialog" aria-modal="true" aria-label="Photo album viewer" tabindex="-1">
          <div class="pro-lightbox-backdrop" id="proLightboxBackdrop"></div>
          
          <!-- Top Control Header Bar -->
          <div class="pro-lightbox-topbar">
            <div class="pro-lightbox-info">
              <span class="pro-lightbox-title" id="proLbAlbumTitle">ĄŽUOLYNAS FESTIVAL</span>
              <span class="pro-lightbox-divider">•</span>
              <span class="pro-lightbox-counter" id="proLbCounter">1 / 1</span>
            </div>
            
            <div class="pro-lightbox-tools">
              <!-- Slideshow Toggle -->
              <button type="button" class="pro-tool-btn" id="proLbPlayBtn" title="${t.playSlideshow}" aria-label="${t.playSlideshow}">
                <svg id="proLbPlayIcon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <svg id="proLbPauseIcon" class="d-none" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              </button>

              <!-- Zoom Controls -->
              <button type="button" class="pro-tool-btn" id="proLbZoomInBtn" title="${t.zoomIn}" aria-label="${t.zoomIn}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
              </button>
              <button type="button" class="pro-tool-btn" id="proLbZoomOutBtn" title="${t.zoomOut}" aria-label="${t.zoomOut}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/></svg>
              </button>
              <button type="button" class="pro-tool-btn" id="proLbZoomResetBtn" title="${t.resetZoom}" aria-label="${t.resetZoom}">
                <span class="pro-zoom-ratio" id="proLbZoomRatio">100%</span>
              </button>

              <!-- Fullscreen Toggle -->
              <button type="button" class="pro-tool-btn" id="proLbFullscreenBtn" title="${t.fullscreen}" aria-label="${t.fullscreen}">
                <svg id="proLbFsEnterIcon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                <svg id="proLbFsExitIcon" class="d-none" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
              </button>

              <!-- Download Button -->
              <a id="proLbDownloadBtn" class="pro-tool-btn" href="#" target="_blank" download="azuolynas_photo.jpg" title="${t.download}" aria-label="${t.download}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>

              <!-- Share Menu Dropdown Button -->
              <div class="pro-share-dropdown-wrap">
                <button type="button" class="pro-tool-btn" id="proLbShareBtn" title="${t.share}" aria-label="${t.share}">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <div class="pro-share-menu" id="proLbShareMenu">
                  <button type="button" class="pro-share-item" id="proLbShareFb">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Facebook</span>
                  </button>
                  <button type="button" class="pro-share-item" id="proLbShareCopy">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <span>${this.lang === "lt" ? "Kopijuoti nuorodą" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              <!-- Close Button -->
              <button type="button" class="pro-tool-btn pro-close-btn" id="proLbCloseBtn" title="${t.close}" aria-label="${t.close}">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          <!-- Slideshow Progress Bar -->
          <div class="pro-slideshow-progress" id="proLbProgress"><div class="pro-slideshow-bar" id="proLbProgressBar"></div></div>

          <!-- Main Stage Viewport -->
          <div class="pro-lightbox-stage" id="proLbStage">
            <button type="button" class="pro-nav-arrow pro-nav-prev" id="proLbPrevBtn" title="${t.prev}" aria-label="${t.prev}">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div class="pro-viewport-canvas" id="proLbCanvas">
              <div class="pro-image-wrapper" id="proLbImageWrapper">
                <img id="proLbMainImg" class="pro-lightbox-img" src="" alt="Festival photo preview" draggable="false">
                <div class="pro-img-spinner" id="proLbSpinner"></div>
              </div>
            </div>

            <button type="button" class="pro-nav-arrow pro-nav-next" id="proLbNextBtn" title="${t.next}" aria-label="${t.next}">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <!-- Caption & Description Strip -->
          <div class="pro-lightbox-bottombar">
            <div class="pro-caption-content">
              <p class="pro-caption-title" id="proLbCaptionText"></p>
              <div class="pro-keyboard-hints">
                <span><kbd>&larr;</kbd> <kbd>&rarr;</kbd> ${this.lang === "lt" ? "Naršyti" : "Navigate"}</span>
                <span><kbd>Space</kbd> ${this.lang === "lt" ? "Skaidrės" : "Slideshow"}</span>
                <span><kbd>+</kbd> <kbd>-</kbd> ${this.lang === "lt" ? "Didinti/Mažinti" : "Zoom"}</span>
                <span><kbd>F</kbd> ${this.lang === "lt" ? "Pilnas ekranas" : "Fullscreen"}</span>
                <span><kbd>Esc</kbd> ${this.lang === "lt" ? "Užverti" : "Close"}</span>
              </div>
            </div>

            <!-- Thumbnail Strip Row -->
            <div class="pro-thumbnail-track" id="proLbThumbnailTrack" role="tablist" aria-label="Photo thumbnails"></div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", markup);
      this.bindLightboxEvents();
    }

    bindLightboxEvents() {
      const modal = document.getElementById("proLightboxModal");
      const backdrop = document.getElementById("proLightboxBackdrop");
      const closeBtn = document.getElementById("proLbCloseBtn");
      const prevBtn = document.getElementById("proLbPrevBtn");
      const nextBtn = document.getElementById("proLbNextBtn");
      const playBtn = document.getElementById("proLbPlayBtn");
      const zoomInBtn = document.getElementById("proLbZoomInBtn");
      const zoomOutBtn = document.getElementById("proLbZoomOutBtn");
      const zoomResetBtn = document.getElementById("proLbZoomResetBtn");
      const fsBtn = document.getElementById("proLbFullscreenBtn");
      const shareBtn = document.getElementById("proLbShareBtn");
      const shareMenu = document.getElementById("proLbShareMenu");
      const shareFb = document.getElementById("proLbShareFb");
      const shareCopy = document.getElementById("proLbShareCopy");
      const img = document.getElementById("proLbMainImg");
      const canvas = document.getElementById("proLbCanvas");

      backdrop.addEventListener("click", () => this.close());
      closeBtn.addEventListener("click", () => this.close());
      prevBtn.addEventListener("click", () => this.step(-1));
      nextBtn.addEventListener("click", () => this.step(1));
      playBtn.addEventListener("click", () => this.toggleSlideshow());
      zoomInBtn.addEventListener("click", () => this.setZoom(this.scale + 0.35));
      zoomOutBtn.addEventListener("click", () => this.setZoom(this.scale - 0.35));
      zoomResetBtn.addEventListener("click", () => this.resetTransform());
      fsBtn.addEventListener("click", () => this.toggleFullscreen());

      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        shareMenu.classList.toggle("active");
      });

      document.addEventListener("click", () => {
        shareMenu.classList.remove("active");
      });

      shareFb.addEventListener("click", () => {
        const photo = this.filteredPhotos[this.currentIdx];
        if (!photo) return;
        const shareUrl = encodeURIComponent(photo.url);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, "_blank", "width=640,height=520");
      });

      shareCopy.addEventListener("click", () => {
        const photo = this.filteredPhotos[this.currentIdx];
        if (!photo) return;
        navigator.clipboard.writeText(photo.url).then(() => {
          if (window.showToast) {
            window.showToast(i18n[this.lang].photoCopied);
          }
          shareMenu.classList.remove("active");
        });
      });

      // Double click image to zoom in/reset
      img.addEventListener("dblclick", (e) => {
        e.preventDefault();
        if (this.scale > 1) {
          this.resetTransform();
        } else {
          this.setZoom(2.2);
        }
      });

      // Mouse wheel zoom
      canvas.addEventListener("wheel", (e) => {
        if (!modal.classList.contains("active")) return;
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        this.setZoom(this.scale + delta);
      }, { passive: false });

      // Pan dragging when zoomed
      canvas.addEventListener("mousedown", (e) => {
        if (this.scale <= 1) return;
        this.isDragging = true;
        this.dragStartX = e.clientX - this.panX;
        this.dragStartY = e.clientY - this.panY;
        canvas.style.cursor = "grabbing";
      });

      window.addEventListener("mousemove", (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        this.panX = e.clientX - this.dragStartX;
        this.panY = e.clientY - this.dragStartY;
        this.applyTransform();
      });

      window.addEventListener("mouseup", () => {
        if (this.isDragging) {
          this.isDragging = false;
          canvas.style.cursor = this.scale > 1 ? "grab" : "default";
        }
      });

      // Touch gestures for mobile: swipe prev/next & pan
      canvas.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          if (this.scale > 1) {
            this.isDragging = true;
            this.dragStartX = e.touches[0].clientX - this.panX;
            this.dragStartY = e.touches[0].clientY - this.panY;
          }
        }
      }, { passive: true });

      canvas.addEventListener("touchmove", (e) => {
        if (this.isDragging && e.touches.length === 1) {
          this.panX = e.touches[0].clientX - this.dragStartX;
          this.panY = e.touches[0].clientY - this.dragStartY;
          this.applyTransform();
        }
      }, { passive: true });

      canvas.addEventListener("touchend", (e) => {
        if (this.isDragging) {
          this.isDragging = false;
          return;
        }
        if (e.changedTouches.length === 1 && this.scale <= 1) {
          const deltaX = e.changedTouches[0].clientX - this.touchStartX;
          const deltaY = e.changedTouches[0].clientY - this.touchStartY;
          if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 60) {
            if (deltaX < 0) this.step(1);
            else this.step(-1);
          }
        }
      }, { passive: true });
    }

    bindGlobalKeys() {
      document.addEventListener("keydown", (e) => {
        const modal = document.getElementById("proLightboxModal");
        if (!modal || !modal.classList.contains("active")) return;

        if (e.key === "Escape") {
          e.preventDefault();
          this.close();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.step(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.step(1);
        } else if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          this.toggleSlideshow();
        } else if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          this.setZoom(this.scale + 0.35);
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          this.setZoom(this.scale - 0.35);
        } else if (e.key === "0") {
          e.preventDefault();
          this.resetTransform();
        } else if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          this.toggleFullscreen();
        }
      });
    }

    open(idx = 0) {
      if (!this.filteredPhotos || this.filteredPhotos.length === 0) return;
      this.currentIdx = (idx + this.filteredPhotos.length) % this.filteredPhotos.length;

      const modal = document.getElementById("proLightboxModal");
      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      this.resetTransform();
      this.renderThumbnails();
      this.loadImage();
    }

    close() {
      const modal = document.getElementById("proLightboxModal");
      if (!modal) return;
      modal.classList.remove("active");
      document.body.style.overflow = "";

      this.stopSlideshow();
      this.resetTransform();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }

    step(direction) {
      if (this.filteredPhotos.length <= 1) return;
      this.currentIdx = (this.currentIdx + direction + this.filteredPhotos.length) % this.filteredPhotos.length;
      this.resetTransform();
      this.loadImage();
      this.updateThumbnailActive();

      if (this.isPlaying) {
        this.restartSlideshowTimer();
      }
    }

    goTo(idx) {
      if (idx === this.currentIdx) return;
      this.currentIdx = idx;
      this.resetTransform();
      this.loadImage();
      this.updateThumbnailActive();

      if (this.isPlaying) {
        this.restartSlideshowTimer();
      }
    }

    loadImage() {
      const photo = this.filteredPhotos[this.currentIdx];
      if (!photo) return;

      const img = document.getElementById("proLbMainImg");
      const spinner = document.getElementById("proLbSpinner");
      const caption = document.getElementById("proLbCaptionText");
      const counter = document.getElementById("proLbCounter");
      const albumTitle = document.getElementById("proLbAlbumTitle");
      const dlBtn = document.getElementById("proLbDownloadBtn");

      spinner.classList.remove("d-none");
      img.style.opacity = "0.2";

      const preloader = new Image();
      preloader.src = photo.url;
      preloader.onload = () => {
        img.src = photo.url;
        img.alt = photo.caption || "Festival photo";
        img.style.opacity = "1";
        spinner.classList.add("d-none");
      };
      preloader.onerror = () => {
        img.src = photo.url;
        img.style.opacity = "1";
        spinner.classList.add("d-none");
      };

      caption.textContent = photo.caption || "";
      counter.textContent = `${this.currentIdx + 1} ${i18n[this.lang].photoOf} ${this.filteredPhotos.length}`;
      albumTitle.textContent = photo.album ? `FESTIVAL • ${photo.album.toUpperCase()}` : "ĄŽUOLYNAS FESTIVAL";
      dlBtn.href = photo.url;
    }

    renderThumbnails() {
      const track = document.getElementById("proLbThumbnailTrack");
      if (!track) return;

      track.innerHTML = this.filteredPhotos.map((p, idx) => `
        <button type="button" class="pro-thumb-item ${idx === this.currentIdx ? 'active' : ''}" data-idx="${idx}" title="${p.caption}">
          <img src="${p.url}" alt="Thumbnail #${idx + 1}" loading="lazy">
        </button>
      `).join("");

      track.querySelectorAll(".pro-thumb-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.idx, 10);
          this.goTo(idx);
        });
      });

      this.scrollThumbIntoView();
    }

    updateThumbnailActive() {
      const track = document.getElementById("proLbThumbnailTrack");
      if (!track) return;
      track.querySelectorAll(".pro-thumb-item").forEach((btn, idx) => {
        if (idx === this.currentIdx) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      this.scrollThumbIntoView();
    }

    scrollThumbIntoView() {
      const track = document.getElementById("proLbThumbnailTrack");
      if (!track) return;
      const activeThumb = track.children[this.currentIdx];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }

    setZoom(targetScale) {
      this.scale = Math.min(Math.max(targetScale, 1), 4);
      if (this.scale === 1) {
        this.panX = 0;
        this.panY = 0;
      }
      this.applyTransform();
    }

    resetTransform() {
      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      this.applyTransform();
    }

    applyTransform() {
      const wrapper = document.getElementById("proLbImageWrapper");
      const ratio = document.getElementById("proLbZoomRatio");
      const canvas = document.getElementById("proLbCanvas");
      if (!wrapper) return;

      wrapper.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.scale})`;
      if (ratio) {
        ratio.textContent = `${Math.round(this.scale * 100)}%`;
      }
      if (canvas) {
        canvas.style.cursor = this.scale > 1 ? "grab" : "default";
      }
    }

    toggleFullscreen() {
      const modal = document.getElementById("proLightboxModal");
      const enterIcon = document.getElementById("proLbFsEnterIcon");
      const exitIcon = document.getElementById("proLbFsExitIcon");

      if (!document.fullscreenElement) {
        modal.requestFullscreen().then(() => {
          enterIcon.classList.add("d-none");
          exitIcon.classList.remove("d-none");
        }).catch(() => {});
      } else {
        document.exitFullscreen().then(() => {
          enterIcon.classList.remove("d-none");
          exitIcon.classList.add("d-none");
        }).catch(() => {});
      }
    }

    toggleSlideshow() {
      if (this.isPlaying) {
        this.stopSlideshow();
      } else {
        this.startSlideshow();
      }
    }

    startSlideshow() {
      this.isPlaying = true;
      document.getElementById("proLbPlayIcon")?.classList.add("d-none");
      document.getElementById("proLbPauseIcon")?.classList.remove("d-none");
      document.getElementById("proLbProgress")?.classList.add("active");
      this.restartSlideshowTimer();
    }

    stopSlideshow() {
      this.isPlaying = false;
      document.getElementById("proLbPlayIcon")?.classList.remove("d-none");
      document.getElementById("proLbPauseIcon")?.classList.add("d-none");
      document.getElementById("proLbProgress")?.classList.remove("active");
      if (this.slideshowTimer) {
        clearTimeout(this.slideshowTimer);
        this.slideshowTimer = null;
      }
      const bar = document.getElementById("proLbProgressBar");
      if (bar) {
        bar.style.transition = "none";
        bar.style.width = "0%";
      }
    }

    restartSlideshowTimer() {
      if (this.slideshowTimer) clearTimeout(this.slideshowTimer);
      const bar = document.getElementById("proLbProgressBar");
      if (bar) {
        bar.style.transition = "none";
        bar.style.width = "0%";
        setTimeout(() => {
          bar.style.transition = `width ${this.slideshowDuration}ms linear`;
          bar.style.width = "100%";
        }, 30);
      }

      this.slideshowTimer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.step(1);
      }, this.slideshowDuration);
    }
  }

  window.FestivalLightbox = new FestivalPhotoLightbox();

  // Legacy API compatibility
  window.openLightbox = function (idx) {
    window.FestivalLightbox.open(idx);
  };

  window.openLightboxFromSrc = function (src, caption) {
    const list = window.FestivalLightbox.filteredPhotos.length ? window.FestivalLightbox.filteredPhotos : [{ url: src, caption: caption, album: "prizes" }];
    const existingIdx = list.findIndex((p) => p.url === src);
    if (existingIdx !== -1) {
      window.FestivalLightbox.open(existingIdx);
    } else {
      window.FestivalLightbox.photos.unshift({ url: src, caption: caption, album: "prizes" });
      window.FestivalLightbox.filterByAlbum(window.FestivalLightbox.currentAlbum);
      window.FestivalLightbox.open(0);
    }
  };

  window.closeLightbox = function () {
    window.FestivalLightbox.close();
  };

  window.stepLightbox = function (dir) {
    window.FestivalLightbox.step(dir);
  };
})();
