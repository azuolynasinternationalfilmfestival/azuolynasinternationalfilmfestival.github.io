/**
 * albums.js
 * Separate Album & Year Content Editor (2026, 2027, ...)
 * Supports bilingual editorial text with formatting toolbar, batch multi-photo upload,
 * per-photo captions (LT & EN), reordering, cover selection, and live publishing.
 */

import { db, storage, auth } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

const DEFAULT_HERO_FALLBACK =
  "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b";

const DEFAULT_EDITIONS_MAP = {
  "2027": {
    year: "2027",
    status: "upcoming",
    title: "FEST 2027",
    titleEn: "FEST 2027",
    date: "2027 m. balandžio 27 d.",
    dateEn: "April 27, 2027",
    subtitle: "Tema: „Mano pašaukimas“ (angl. My Purpose)",
    subtitleEn: "Theme: 'My Purpose' (Mano pašaukimas)",
    story:
      "Pasiruoškite 7-ajam tarptautiniam mokinių trumpametražių filmų festivaliui „Ąžuolynas FEST 2027“! Kviečiame moksleivius nuo 10 iki 18 metų kurti trumpametražius filmus iki 3 minučių naudojant tik išmaniuosius telefonus.\n\nPagrindinė 2027 m. tema: „Mano pašaukimas“ (angl. My Purpose).\n\nParaiškos priimamos iki 2027 m. balandžio 5 d. Renginys vyks 2027 m. balandžio 27 d. Kauno tarptautinėje gimnazijoje.",
    storyEn:
      "Prepare for the 7th International Youth Short Film Festival 'Ąžuolynas FEST 2027'! We invite students aged 10–18 to create short films up to 3 minutes using smartphone cameras only.\n\nThe main theme for 2027 is 'My Purpose' (Mano pašaukimas).\n\nSubmissions are accepted until April 5, 2027. The festival takes place on April 27, 2027 at Kaunas International Gymnasium.",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "https://www.youtube.com/watch?v=INGtv",
    pageUrl: "azuolynas-fest-2027.html",
    pageUrlEn: "../en/azuolynas-fest-2027.html",
    submissionDeadline: "2027-04-05",
    photos: [
      {
        id: "alb_2027_1",
        url: DEFAULT_HERO_FALLBACK,
        caption: "Pasirengimas 7-ajam festivaliui Kauno tarptautinėje gimnazijoje",
        captionEn: "Preparing for the 7th festival edition at Kaunas International Gymnasium",
        album: "ceremony"
      },
      {
        id: "alb_2027_2",
        url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3462.jpeg?alt=media&token=f03ee32c-74f8-450f-a39e-26f50b9ebfd7",
        caption: "Tarptautinė žiuri ir renginio vedėjai scenoje",
        captionEn: "International jury and ceremony hosts on stage",
        album: "laureates"
      },
      {
        id: "alb_2027_3",
        url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da",
        caption: "Ąžuolo statulėlės ir pagrindiniai apdovanojimai",
        captionEn: "Handcrafted oak statuettes and main festival awards",
        album: "prizes"
      }
    ]
  },
  "2026": {
    year: "2026",
    status: "completed",
    title: "FEST 2026",
    titleEn: "FEST 2026",
    date: "2026 m. balandžio 30 d.",
    dateEn: "April 30, 2026",
    theme: "What If",
    subtitle: "Tema: „What If“ • Kino šventė Kauno tarptautinėje gimnazijoje: net keturi žemynai viename ekrane!",
    subtitleEn: "Theme: 'What If' • Cinema Celebration at Kaunas International Gymnasium: Four Continents on One Screen!",
    story:
      "Jau šeštus metus iš eilės mūsų gimnazija tampa jaunimo kino meno centru. 2026 m. balandžio 30 d. mokykloje vyko tradicinis tarptautinis mokinių kino festivalis „Ąžuolynas“, kurio tema buvo „What If“. Dalyvių geografija išsiplėtė net iki 4 žemynų — varžėsi jaunieji talentai iš Europos, Azijos, Šiaurės Amerikos ir Afrikos!",
    storyEn:
      "For the sixth consecutive year, Kaunas International Gymnasium became a vibrant hub of youth cinema on April 30, 2026, celebrating the theme 'What If' and welcoming young filmmakers across 4 continents — Europe, Asia, North America, and Africa.",
    heroImage: "https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg",
    videoUrl: "https://www.youtube.com/watch?v=INGtv",
    pageUrl: "azuolynas-fest-2026.html",
    pageUrlEn: "../en/azuolynas-fest-2026.html",
    photos: [
      {
        id: "alb_2026_1",
        url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da",
        caption: "FEST 2026 oficialūs apdovanojimai, ąžuolo statulėlės ir diplomai",
        captionEn: "FEST 2026 Official Festival Awards and Trophies",
        album: "prizes"
      },
      {
        id: "alb_2026_2",
        url: "https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg",
        caption: "FEST 2026 iškilmingos ceremonijos akimirka Kauno tarptautinėje gimnazijoje",
        captionEn: "FEST 2026 Gala Ceremony at Kaunas International Gymnasium",
        album: "ceremony"
      },
      {
        id: "alb_2026_3",
        url: "https://i.postimg.cc/5trrZFtv/ceremonija-2026-02.jpg",
        caption: "Tarptautinio mokinių filmų festivalio ceremonijos pradžia ir svečiai",
        captionEn: "Opening of the international student film festival ceremony and guests",
        album: "ceremony"
      },
      {
        id: "alb_2026_4",
        url: "https://i.postimg.cc/25ttPB5n/ceremonija-2026-04-30-01.jpg",
        caption: "Festivalio renginio atmosfera ir bendruomenės susibūrimas salėje",
        captionEn: "Festival celebration atmosphere and school community gathering",
        album: "ceremony"
      },
      {
        id: "alb_2026_5",
        url: "https://i.postimg.cc/jj11GJjD/ceremonija-2026-04-30-02.jpg",
        caption: "Kino šventės programa ir dalyvių prisistatymai ant scenos",
        captionEn: "Cinema program and participant presentations on stage",
        album: "ceremony"
      },
      {
        id: "alb_2026_6",
        url: "https://i.postimg.cc/25ttPB5q/laureatai-2026-04-30-01.jpg",
        caption: "FEST 2026 laureatų apdovanojimas ir sveikinimai",
        captionEn: "FEST 2026 laureate award ceremony and congratulations",
        album: "laureates"
      },
      {
        id: "alb_2026_7",
        url: "https://i.postimg.cc/vmKKp6mV/laureatai-2026-04-30-02.jpg",
        caption: "Jaunieji kūrėjai ir nugalėtojai su festivalio diplomais",
        captionEn: "Young filmmakers and winners with festival diplomas",
        album: "laureates"
      },
      {
        id: "alb_2026_8",
        url: "https://i.postimg.cc/tgccLVgZ/laureatai-2026-04-30-03.jpg",
        caption: "Tarptautinės komisijos įvertinti laureatai ir prizininkai",
        captionEn: "International jury award recipients and prizewinners",
        album: "laureates"
      }
    ]
  }
};

let albumsCatalog = {};
let activeAlbumYear = "2027";
let editingPhotos = [];
let unsubscribeAlbums = null;

const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write"
};

function handleFirestoreError(error, operationType, path) {
  const user = auth?.currentUser || null;
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified ?? null,
      isAnonymous: user?.isAnonymous ?? null,
      tenantId: user?.tenantId || null,
      providerInfo: Array.isArray(user?.providerData)
        ? user.providerData.map((p) => ({ providerId: p.providerId, email: p.email }))
        : []
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return new Error(errInfo.error);
}

async function testFirestoreConnection() {
  if (!db || typeof db.collection !== "function") return;
  try {
    await db.collection("settings").doc("festival").get({ source: "server" });
  } catch (err) {
    if (err && typeof err.message === "string" && err.message.includes("the client is offline")) {
      console.error("Firestore connection check: client is offline. Verify Firebase configuration.");
    }
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeStoryHtml(raw) {
  const escaped = escapeHtml(raw || "");
  return escaped
    .replace(/&lt;(\/?(b|strong|i|em|blockquote|u))&gt;/gi, "<$1>")
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 12px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

async function getAdminAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const adminEmail =
    auth?.currentUser?.email ||
    sessionStorage.getItem("admin_user_email") ||
    "";
  if (adminEmail) {
    headers["x-admin-email"] = adminEmail;
  }
  const sessionToken =
    sessionStorage.getItem("admin_jwt_token") ||
    sessionStorage.getItem("admin_session_token");
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }
  try {
    if (auth && auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      if (idToken) {
        if (!headers["Authorization"]) {
          headers["Authorization"] = `Bearer ${idToken}`;
        }
        headers["x-firebase-id-token"] = idToken;
      }
    }
  } catch (e) {}
  return headers;
}

export function initAlbums() {
  testFirestoreConnection();

  const yearTabsContainer = document.getElementById("albumYearTabs");
  if (yearTabsContainer) {
    yearTabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-album-year]");
      if (!btn) return;
      selectAlbumYear(btn.dataset.albumYear);
    });
  }

  const addYearBtn = document.getElementById("albumAddYearBtn");
  const newYearInput = document.getElementById("albumNewYearInput");
  if (addYearBtn && newYearInput) {
    const addYearHandler = () => {
      const yr = newYearInput.value.replace(/[^0-9]/g, "").slice(0, 4);
      if (!yr || yr.length !== 4) {
        showToast("Įveskite 4 skaitmenų metus (pvz. 2028).", "error");
        return;
      }
      if (!albumsCatalog[yr]) {
        albumsCatalog[yr] = {
          year: yr,
          status: Number(yr) >= 2027 ? "upcoming" : "completed",
          title: `FEST ${yr}`,
          titleEn: `FEST ${yr}`,
          date: "",
          dateEn: "",
          subtitle: "",
          subtitleEn: "",
          story: "",
          storyEn: "",
          heroImage: DEFAULT_HERO_FALLBACK,
          videoUrl: "",
          pageUrl: `azuolynas-fest-${yr}.html`,
          pageUrlEn: `../en/azuolynas-fest-${yr}.html`,
          photos: []
        };
      }
      newYearInput.value = "";
      selectAlbumYear(yr);
      showToast(`Sukurtas arba atidarytas ${yr} m. albumas. Nepamirškite paspausti „Išsaugoti ir Paskelbti Albumą“.`, "success");
    };
    addYearBtn.addEventListener("click", addYearHandler);
    newYearInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addYearHandler();
      }
    });
  }

  const deleteYearBtn = document.getElementById("albumDeleteYearBtn");
  if (deleteYearBtn) {
    deleteYearBtn.addEventListener("click", () => deleteCustomAlbumYear(activeAlbumYear));
  }

  // Formatting toolbar buttons (LT & EN story)
  const albumsTabEl = document.getElementById("albumsTab");
  if (albumsTabEl) {
    albumsTabEl.addEventListener("click", (e) => {
      const fmtBtn = e.target.closest("button[data-album-format]");
      if (fmtBtn) {
        applyFormatToTextarea(fmtBtn.dataset.target, fmtBtn.dataset.albumFormat);
      }
    });
  }

  const previewLtBtn = document.getElementById("albStoryPreviewToggleBtn");
  if (previewLtBtn) {
    previewLtBtn.addEventListener("click", () => {
      toggleStoryPreview("albStory", "albStoryPreview", previewLtBtn);
    });
  }

  const previewEnBtn = document.getElementById("albStoryEnPreviewToggleBtn");
  if (previewEnBtn) {
    previewEnBtn.addEventListener("click", () => {
      toggleStoryPreview("albStoryEn", "albStoryEnPreview", previewEnBtn);
    });
  }

  const heroInput = document.getElementById("albHeroImage");
  const heroPreview = document.getElementById("albHeroPreview");
  if (heroInput && heroPreview) {
    heroInput.addEventListener("input", () => {
      heroPreview.src = heroInput.value.trim() || DEFAULT_HERO_FALLBACK;
    });
  }

  const heroFileInput = document.getElementById("albHeroFile");
  if (heroFileInput) {
    heroFileInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      heroFileInput.disabled = true;
      try {
        const url = await uploadSingleImage(file, activeAlbumYear, 0);
        if (heroInput) heroInput.value = url;
        if (heroPreview) heroPreview.src = url;
        showToast("Viršelio nuotrauka sėkmingai įkelta!", "success");
      } catch (err) {
        showToast("Nepavyko įkelti viršelio nuotraukos: " + err.message, "error");
      } finally {
        heroFileInput.disabled = false;
        heroFileInput.value = "";
      }
    });
  }

  // Batch Multi-Photo Input + File Picker Button + Drag & Drop
  const multiInput = document.getElementById("albumMultiPhotoInput");
  const dropzone = document.getElementById("albumBatchDropzone");
  const selectFilesBtn = document.getElementById("albumSelectFilesBtn");

  if (selectFilesBtn && multiInput) {
    selectFilesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      multiInput.click();
    });
  }

  if (dropzone && multiInput) {
    dropzone.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT" && e.target !== selectFilesBtn) {
        multiInput.click();
      }
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("is-dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("is-dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-dragover");
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) handleBatchUpload(files);
    });

    multiInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) handleBatchUpload(files);
      multiInput.value = "";
    });
  }

  // Add photo by URL
  const addUrlBtn = document.getElementById("albumAddUrlBtn");
  if (addUrlBtn) {
    addUrlBtn.addEventListener("click", () => {
      const urlField = document.getElementById("albumManualUrlInput");
      const catField = document.getElementById("albumBatchDefaultCategory");
      const url = (urlField?.value || "").trim();
      if (!url) {
        showToast("Įveskite nuotraukos URL nuorodą.", "error");
        return;
      }
      editingPhotos.push({
        id: `alb_${activeAlbumYear}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url,
        caption: `${activeAlbumYear} m. festivalio akimirka`,
        captionEn: `FEST ${activeAlbumYear} highlight`,
        album: catField?.value || "ceremony",
        uploadedAt: new Date().toISOString()
      });
      if (urlField) urlField.value = "";
      renderAlbumPhotosGrid();
      showToast("Nuotrauka pridėta į albumą. Nepamirškite paskelbti pakeitimų!", "info");
    });
  }

  // Per-Photo Card Actions (delegated)
  const photosGrid = document.getElementById("albumPhotosGrid");
  if (photosGrid) {
    photosGrid.addEventListener("input", (e) => {
      const card = e.target.closest("[data-photo-index]");
      if (!card) return;
      const idx = Number(card.dataset.photoIndex);
      if (Number.isNaN(idx) || !editingPhotos[idx]) return;

      if (e.target.dataset.field === "caption") {
        editingPhotos[idx].caption = e.target.value;
      } else if (e.target.dataset.field === "captionEn") {
        editingPhotos[idx].captionEn = e.target.value;
      } else if (e.target.dataset.field === "album") {
        editingPhotos[idx].album = e.target.value;
      }
    });

    photosGrid.addEventListener("change", (e) => {
      const card = e.target.closest("[data-photo-index]");
      if (!card) return;
      const idx = Number(card.dataset.photoIndex);
      if (Number.isNaN(idx) || !editingPhotos[idx]) return;

      if (e.target.dataset.field === "album") {
        editingPhotos[idx].album = e.target.value;
      }
    });

    photosGrid.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-photo-action]");
      if (!btn) return;
      const card = btn.closest("[data-photo-index]");
      if (!card) return;
      const idx = Number(card.dataset.photoIndex);
      const photo = editingPhotos[idx];
      if (!photo) return;

      const action = btn.dataset.photoAction;
      if (action === "move-up" && idx > 0) {
        [editingPhotos[idx - 1], editingPhotos[idx]] = [editingPhotos[idx], editingPhotos[idx - 1]];
        renderAlbumPhotosGrid();
      } else if (action === "move-down" && idx < editingPhotos.length - 1) {
        [editingPhotos[idx + 1], editingPhotos[idx]] = [editingPhotos[idx], editingPhotos[idx + 1]];
        renderAlbumPhotosGrid();
      } else if (action === "set-hero") {
        const heroField = document.getElementById("albHeroImage");
        const heroPreviewEl = document.getElementById("albHeroPreview");
        if (heroField) heroField.value = photo.url;
        if (heroPreviewEl) heroPreviewEl.src = photo.url;
        renderAlbumPhotosGrid();
        showToast("Nustatyta kaip albumo pagrindinė viršelio nuotrauka!", "success");
      } else if (action === "preview") {
        openAlbumPhotoPreview(photo);
      } else if (action === "delete") {
        if (!confirm("Pašalinti šią nuotrauką iš albumo?")) return;
        editingPhotos.splice(idx, 1);
        renderAlbumPhotosGrid();
        showToast("Nuotrauka pašalinta iš sąrašo.", "info");
      }
    });
  }

  // Modal close for album photo preview
  const previewModalClose = document.getElementById("albumPreviewModalCloseBtn");
  const previewModalBackdrop = document.getElementById("albumPreviewModal");
  if (previewModalClose && previewModalBackdrop) {
    previewModalClose.addEventListener("click", () => previewModalBackdrop.classList.add("d-none"));
    previewModalBackdrop.addEventListener("click", (e) => {
      if (e.target === previewModalBackdrop) previewModalBackdrop.classList.add("d-none");
    });
  }

  const saveBtn = document.getElementById("saveAlbumBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => saveCurrentAlbum(false));
  }
}

export function subscribeAlbums() {
  if (unsubscribeAlbums) unsubscribeAlbums();
  loadAlbumsFromApi();

  if (db && typeof db.collection === "function") {
    try {
      unsubscribeAlbums = db.collection("editions").onSnapshot(
        (snapshot) => {
          snapshot.forEach((doc) => {
            const id = String(doc.id);
            if (id.endsWith("_en")) return;
            const data = doc.data() || {};
            const year = String(data.year || id).trim();
            if (!year) return;
            const base = albumsCatalog[year] || DEFAULT_EDITIONS_MAP[year] || {};
            const isLegacy2026 =
              year === "2026" &&
              (!data.updatedAt || String(data.updatedAt) < "2026-11-23T09:00:00.000Z") &&
              (!data.heroImage || String(data.heroImage).includes("IMG_3458") || String(data.date || "").includes("balandžio 17"));
            albumsCatalog[year] = {
              ...base,
              ...data,
              year,
              date: isLegacy2026 ? DEFAULT_EDITIONS_MAP["2026"].date : (data.date || base.date),
              dateEn: isLegacy2026 ? DEFAULT_EDITIONS_MAP["2026"].dateEn : (data.dateEn || base.dateEn),
              subtitle: isLegacy2026 ? DEFAULT_EDITIONS_MAP["2026"].subtitle : (data.subtitle || base.subtitle),
              subtitleEn: isLegacy2026 ? DEFAULT_EDITIONS_MAP["2026"].subtitleEn : (data.subtitleEn || base.subtitleEn),
              heroImage: isLegacy2026 ? DEFAULT_EDITIONS_MAP["2026"].heroImage : (data.heroImage || base.heroImage),
              photos: isLegacy2026
                ? DEFAULT_EDITIONS_MAP["2026"].photos
                : (Array.isArray(data.photos) && data.photos.length > 0 ? data.photos : (base.photos || []))
            };
          });
          ensureCoreYearsExist();
          renderYearPills();
          if (!document.getElementById("albTitle")?.value) {
            selectAlbumYear(activeAlbumYear);
          } else {
            // Keep editingPhotos in sync only if user hasn't loaded yet
            updateOpenPageButtons();
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, "editions");
          loadAlbumsFromApi();
        }
      );
    } catch (e) {
      console.warn("Albums Firestore listener fallback:", e);
    }
  }
}

export function unsubscribeAlbumsListener() {
  if (unsubscribeAlbums) {
    unsubscribeAlbums();
    unsubscribeAlbums = null;
  }
}

async function loadAlbumsFromApi() {
  try {
    const res = await fetch("/api/editions");
    const contentType = res.headers?.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const payload = await res.json();
      const list = Array.isArray(payload.editions) ? payload.editions : [];
      list.forEach((ed) => {
        const year = String(ed.year || ed.id || "").trim();
        if (!year) return;
        const existing = albumsCatalog[year] || {};
        const fallback = DEFAULT_EDITIONS_MAP[year] || {};
        albumsCatalog[year] = {
          ...fallback,
          ...ed,
          ...existing,
          year,
          photos:
            Array.isArray(existing.photos) && existing.photos.length > 0
              ? existing.photos
              : Array.isArray(ed.photos) && ed.photos.length > 0
                ? ed.photos
                : (fallback.photos || [])
        };
      });
    }
  } catch (e) {
    console.warn("Albums API fetch fallback:", e.message);
  }
  ensureCoreYearsExist();
  renderYearPills();
  selectAlbumYear(activeAlbumYear);
}

function ensureCoreYearsExist() {
  if (!albumsCatalog["2026"]) albumsCatalog["2026"] = { ...DEFAULT_EDITIONS_MAP["2026"] };
  if (!albumsCatalog["2027"]) albumsCatalog["2027"] = { ...DEFAULT_EDITIONS_MAP["2027"] };
}

function renderYearPills() {
  const container = document.getElementById("albumYearTabs");
  const panel = document.getElementById("albumActivePanel");
  if (!container) return;

  const years = Object.keys(albumsCatalog).sort((a, b) => Number(a) - Number(b));
  container.innerHTML = years
    .map((yr) => {
      const ed = albumsCatalog[yr];
      const count = Array.isArray(ed?.photos) ? ed.photos.length : 0;
      const isActive = yr === activeAlbumYear;
      const safeYr = escapeHtml(yr);
      return `
        <button type="button" id="albumYearTab_${safeYr}" role="tab" aria-selected="${isActive ? "true" : "false"}" aria-controls="albumActivePanel" tabindex="${isActive ? "0" : "-1"}" class="album-year-pill ${isActive ? "active" : ""}" data-album-year="${safeYr}">
          ${safeYr} m.
          <span class="album-year-count" aria-hidden="true">${count} nuotr.</span>
        </button>
      `;
    })
    .join("");

  if (panel && typeof panel.setAttribute === "function") {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", `albumYearTab_${activeAlbumYear}`);
  }

  const tabs = typeof container.querySelectorAll === "function"
    ? Array.from(container.querySelectorAll('[role="tab"]'))
    : [];
  tabs.forEach((btn, idx) => {
    btn.addEventListener("keydown", (e) => {
      let nextIdx = null;
      if (e.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;
      else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") nextIdx = 0;
      else if (e.key === "End") nextIdx = tabs.length - 1;
      if (nextIdx !== null) {
        e.preventDefault();
        const nextBtn = tabs[nextIdx];
        if (nextBtn) {
          selectAlbumYear(nextBtn.dataset.albumYear);
          document.getElementById(`albumYearTab_${nextBtn.dataset.albumYear}`)?.focus();
        }
      }
    });
  });
}

function updateOpenPageButtons() {
  const ltBtn = document.getElementById("albumOpenLtBtn");
  const enBtn = document.getElementById("albumOpenEnBtn");
  const delBtn = document.getElementById("albumDeleteYearBtn");
  const isKnownYear = activeAlbumYear === "2026" || activeAlbumYear === "2027";
  const ltHref = isKnownYear ? `/lt/azuolynas-fest-${activeAlbumYear}.html` : "/lt/index.html#editions";
  const enHref = isKnownYear ? `/en/azuolynas-fest-${activeAlbumYear}.html` : "/en/index.html#editions";
  if (ltBtn) ltBtn.href = ltHref;
  if (enBtn) enBtn.href = enHref;
  if (delBtn) delBtn.classList.toggle("d-none", isKnownYear);
}

function selectAlbumYear(year) {
  ensureCoreYearsExist();
  activeAlbumYear = String(year || "2027");
  const ed = albumsCatalog[activeAlbumYear] || DEFAULT_EDITIONS_MAP[activeAlbumYear] || {
    year: activeAlbumYear,
    title: `FEST ${activeAlbumYear}`,
    titleEn: `FEST ${activeAlbumYear}`,
    photos: []
  };

  renderYearPills();
  updateOpenPageButtons();

  const heading = document.getElementById("albumActiveYearHeading");
  if (heading) heading.textContent = `Albumo redaktorius — ${activeAlbumYear} m.`;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };

  setVal("albStatus", ed.status || (activeAlbumYear === "2027" ? "upcoming" : "completed"));
  setVal("albDeadline", ed.submissionDeadline || "");
  setVal("albTitle", ed.title || `FEST ${activeAlbumYear}`);
  setVal("albTitleEn", ed.titleEn || `FEST ${activeAlbumYear}`);
  setVal("albDate", ed.date || "");
  setVal("albDateEn", ed.dateEn || "");
  setVal("albSubtitle", ed.subtitle || "");
  setVal("albSubtitleEn", ed.subtitleEn || "");
  setVal("albStory", ed.story || "");
  setVal("albStoryEn", ed.storyEn || "");
  setVal("albHeroImage", ed.heroImage || DEFAULT_HERO_FALLBACK);
  setVal("albVideoUrl", ed.videoUrl || "");

  const heroPreview = document.getElementById("albHeroPreview");
  if (heroPreview) heroPreview.src = ed.heroImage || DEFAULT_HERO_FALLBACK;

  // Hide previews when switching years so editor stays focused
  document.getElementById("albStoryPreview")?.classList.add("d-none");
  document.getElementById("albStoryEnPreview")?.classList.add("d-none");

  editingPhotos = Array.isArray(ed.photos)
    ? ed.photos.map((p, idx) => ({
        id: p.id || `alb_${activeAlbumYear}_${idx}`,
        url: p.url || "",
        caption: p.caption || "",
        captionEn: p.captionEn || "",
        album: p.album || "ceremony",
        uploadedAt: p.uploadedAt || new Date().toISOString()
      }))
    : [];

  renderAlbumPhotosGrid();
}

function applyFormatToTextarea(textareaId, formatType) {
  const ta = document.getElementById(textareaId);
  if (!ta) return;

  const start = ta.selectionStart || 0;
  const end = ta.selectionEnd || 0;
  const selected = ta.value.slice(start, end);
  let replacement = "";

  if (formatType === "bold") {
    replacement = `<b>${selected || "paryškintas tekstas"}</b>`;
  } else if (formatType === "italic") {
    replacement = `<i>${selected || "kursyvas"}</i>`;
  } else if (formatType === "quote") {
    replacement = `<blockquote>${selected || "Citata arba svarbi pastaba"}</blockquote>`;
  } else if (formatType === "paragraph") {
    replacement = selected ? `\n\n${selected}\n\n` : `\n\nNauja pastraipa...\n\n`;
  }

  ta.value = ta.value.slice(0, start) + replacement + ta.value.slice(end);
  ta.focus();
  ta.selectionStart = start;
  ta.selectionEnd = start + replacement.length;

  const previewId = textareaId === "albStory" ? "albStoryPreview" : "albStoryEnPreview";
  const previewEl = document.getElementById(previewId);
  if (previewEl && !previewEl.classList.contains("d-none")) {
    previewEl.innerHTML = sanitizeStoryHtml(ta.value);
  }
}

function toggleStoryPreview(textareaId, previewId, btn) {
  const ta = document.getElementById(textareaId);
  const previewEl = document.getElementById(previewId);
  if (!ta || !previewEl) return;

  const isHidden = previewEl.classList.contains("d-none");
  if (isHidden) {
    previewEl.innerHTML = sanitizeStoryHtml(ta.value);
    previewEl.classList.remove("d-none");
    if (btn) btn.classList.add("active");
  } else {
    previewEl.classList.add("d-none");
    if (btn) btn.classList.remove("active");
  }
}

function renderAlbumPhotosGrid() {
  const grid = document.getElementById("albumPhotosGrid");
  const countBadge = document.getElementById("albumPhotosCountBadge");
  const heroUrl = (document.getElementById("albHeroImage")?.value || "").trim();

  if (countBadge) {
    countBadge.textContent = `${editingPhotos.length} nuotr.`;
  }
  if (!grid) return;

  if (editingPhotos.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 32px 20px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 2px;">
        Šiame albume dar nėra nuotraukų. Įkelkite kelias nuotraukas vienu metu aukščiau!
      </div>
    `;
    return;
  }

  grid.innerHTML = editingPhotos
    .map((photo, idx) => {
      const isHero = heroUrl && photo.url === heroUrl;
      const cat = photo.album || "ceremony";
      return `
        <div class="album-photo-card" data-photo-index="${idx}">
          <div class="album-photo-thumb">
            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption || `Foto ${idx + 1}`)}" width="1200" height="800" loading="lazy" decoding="async">
            ${isHero ? '<span class="album-cover-badge">Viršelis</span>' : ""}
            <span class="album-photo-index">#${idx + 1}</span>
          </div>
          <div class="album-photo-fields">
            <div>
              <label>Aprašymas (LT)</label>
              <input type="text" class="field" data-field="caption" value="${escapeHtml(photo.caption || "")}" placeholder="Nuotraukos aprašymas lietuviškai...">
            </div>
            <div>
              <label>Caption (EN)</label>
              <input type="text" class="field" data-field="captionEn" value="${escapeHtml(photo.captionEn || "")}" placeholder="Photo caption in English...">
            </div>
            <div>
              <label>Kategorija</label>
              <select class="field" data-field="album">
                <option value="ceremony" ${cat === "ceremony" ? "selected" : ""}>Ceremonija (Ceremony)</option>
                <option value="laureates" ${cat === "laureates" ? "selected" : ""}>Laureatai ir svečiai (Laureates)</option>
                <option value="prizes" ${cat === "prizes" ? "selected" : ""}>Statulėlės ir prizai (Prizes)</option>
              </select>
            </div>
          </div>
          <div class="album-photo-actions">
            <button type="button" class="btn-outline btn-xs" data-photo-action="move-up" ${idx === 0 ? "disabled" : ""} title="Perkelti aukščiau">&larr;</button>
            <button type="button" class="btn-outline btn-xs" data-photo-action="move-down" ${idx === editingPhotos.length - 1 ? "disabled" : ""} title="Perkelti žemiau">&rarr;</button>
            <button type="button" class="btn-outline btn-xs" data-photo-action="set-hero" title="Nustatyti kaip viršelį">Viršelis</button>
            <button type="button" class="btn-outline btn-xs" data-photo-action="preview" title="Peržiūrėti">Didinti</button>
            <button type="button" class="btn-delete btn-xs" data-photo-action="delete" title="Pašalinti">&times;</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function openAlbumPhotoPreview(photo) {
  const modal = document.getElementById("albumPreviewModal");
  const img = document.getElementById("albumPreviewModalImg");
  const cap = document.getElementById("albumPreviewModalCaption");
  if (!modal || !img) return;
  img.src = photo.url;
  if (cap) {
    cap.textContent = [photo.caption, photo.captionEn].filter(Boolean).join(" / ") || `FEST ${activeAlbumYear}`;
  }
  modal.classList.remove("d-none");
}

function compressImageDataUrl(file, maxDim = 1400, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nepavyko perskaityti failo"));
    reader.onload = () => {
      const rawUrl = String(reader.result || "");
      const img = new Image();
      img.onerror = () => resolve(rawUrl);
      img.onload = () => {
        const longest = Math.max(img.width || 1, img.height || 1);
        const scale = Math.min(1, maxDim / longest);
        if (scale >= 1 && file.size <= 350 * 1024) {
          resolve(rawUrl);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadSingleImage(file, year, idx) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  // 1. Try Firebase Storage first
  if (storage && typeof storage.ref === "function") {
    try {
      const storagePath = `archive_photos/albums_${year}/${Date.now()}_${idx}_${safeName}`;
      const task = storage.ref(storagePath).put(file);
      const url = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Storage timeout")), 15000);
        task.on(
          "state_changed",
          null,
          (err) => {
            clearTimeout(timer);
            reject(err);
          },
          async () => {
            clearTimeout(timer);
            try {
              const dl = await task.snapshot.ref.getDownloadURL();
              resolve(dl);
            } catch (e) {
              reject(e);
            }
          }
        );
      });
      if (url) return url;
    } catch (storageErr) {
      console.warn("Firebase Storage fallback notice:", storageErr.message);
    }
  }

  // 2. Try backend local upload endpoint when Node server is available
  const dataUrl = await compressImageDataUrl(file, 1600, 0.84);
  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch("/api/admin/albums/upload", {
      method: "POST",
      headers,
      body: JSON.stringify({
        year,
        filename: safeName,
        dataUrl
      })
    });
    const contentType = res.headers?.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json().catch(() => ({}));
      if (data.url) return data.url;
    }
    if (![404, 405].includes(res.status) && contentType.includes("application/json")) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) throw new Error(errData.error);
    }
  } catch (apiErr) {
    if (apiErr && apiErr.message && !apiErr.message.includes("Failed to fetch")) {
      console.warn("Server upload fallback notice:", apiErr.message);
    }
  }

  // 3. Static-hosting fallback: compact JPEG Data URL stored cleanly within Firestore doc
  return compressImageDataUrl(file, 1080, 0.72);
}

async function handleBatchUpload(rawFiles) {
  const imageFiles = rawFiles.filter((f) => f.type && f.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    showToast("Pasirinkite paveikslėlių failus (JPG, PNG, WEBP).", "error");
    return;
  }

  const progWrap = document.getElementById("albumBatchProgress");
  const progFill = document.getElementById("albumBatchProgressFill");
  const progStatus = document.getElementById("albumBatchProgressStatus");
  const defaultCat = document.getElementById("albumBatchDefaultCategory")?.value || "ceremony";

  if (progWrap) progWrap.classList.remove("d-none");
  let uploadedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    if (progStatus) progStatus.textContent = `Įkeliama ${i + 1} / ${imageFiles.length}: ${file.name}`;
    if (progFill) progFill.style.width = `${Math.round((i / imageFiles.length) * 100)}%`;

    try {
      const url = await uploadSingleImage(file, activeAlbumYear, i);
      const baseCaption = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      editingPhotos.push({
        id: `alb_${activeAlbumYear}_${Date.now()}_${i}`,
        url,
        caption: baseCaption || `FEST ${activeAlbumYear} akimirka`,
        captionEn: baseCaption || `FEST ${activeAlbumYear} moment`,
        album: defaultCat,
        uploadedAt: new Date().toISOString()
      });
      uploadedCount++;
    } catch (err) {
      failedCount++;
      console.error(`Failed uploading ${file.name}:`, err);
    }
  }

  if (progFill) progFill.style.width = "100%";
  if (progStatus) {
    progStatus.textContent = `Baigta: įkelta ${uploadedCount} iš ${imageFiles.length}` + (failedCount ? ` (nepavyko: ${failedCount})` : "");
  }

  renderAlbumPhotosGrid();

  if (uploadedCount > 0) {
    const saved = await saveCurrentAlbum(true);
    if (saved) {
      showToast(`Sėkmingai įkelta ir išsaugota ${uploadedCount} nuotr. į ${activeAlbumYear} m. albumą!`, "success");
    }
  } else {
    showToast("Nepavyko įkelti pasirinktų nuotraukų.", "error");
  }
}

async function deleteCustomAlbumYear(year) {
  const cleanYear = String(year || "").trim();
  if (!cleanYear || cleanYear === "2026" || cleanYear === "2027") {
    showToast("Pagrindinių 2026 ir 2027 m. albumų ištrinti negalima.", "error");
    return;
  }
  if (!confirm(`Ar tikrai norite pašalinti ${cleanYear} m. albumą?`)) return;

  let deletedFirestore = false;
  let deletedServer = false;
  const callerEmail = (auth?.currentUser?.email || sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com").toLowerCase();

  if (db && typeof db.collection === "function") {
    try {
      await db.collection("editions").doc(cleanYear).delete();
      deletedFirestore = true;
    } catch (fsErr) {
      handleFirestoreError(fsErr, OperationType.DELETE, `editions/${cleanYear}`);
    }
  }

  try {
    const headers = await getAdminAuthHeaders();
    const res = await fetch("/api/admin/editions/delete", {
      method: "POST",
      headers,
      body: JSON.stringify({ year: cleanYear, adminEmail: callerEmail })
    });
    if (res.ok) deletedServer = true;
  } catch (e) {}

  if (!deletedFirestore && !deletedServer && albumsCatalog[cleanYear]?.updatedAt) {
    showToast("Nepavyko ištrinti albumo iš duomenų bazės. Patikrinkite administratoriaus teises.", "error");
    return;
  }

  delete albumsCatalog[cleanYear];
  selectAlbumYear("2027");
  showToast(`${cleanYear} m. albumas pašalintas.`);
}

async function saveCurrentAlbum(isAutoSave = false) {
  const btn = document.getElementById("saveAlbumBtn");
  if (btn && !isAutoSave) btn.disabled = true;

  const year = activeAlbumYear;
  const getVal = (id) => (document.getElementById(id)?.value || "").trim();

  const existing = albumsCatalog[year] || DEFAULT_EDITIONS_MAP[year] || {};
  const callerEmail = (auth?.currentUser?.email || sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com").toLowerCase();

  const payload = {
    ...existing,
    id: year,
    year,
    status: getVal("albStatus") || existing.status || (year === "2027" ? "upcoming" : "completed"),
    submissionDeadline: getVal("albDeadline"),
    title: getVal("albTitle") || `FEST ${year}`,
    titleEn: getVal("albTitleEn") || `FEST ${year}`,
    date: getVal("albDate"),
    dateEn: getVal("albDateEn"),
    subtitle: getVal("albSubtitle"),
    subtitleEn: getVal("albSubtitleEn"),
    story: getVal("albStory"),
    storyEn: getVal("albStoryEn"),
    heroImage: getVal("albHeroImage") || DEFAULT_HERO_FALLBACK,
    videoUrl: getVal("albVideoUrl"),
    pageUrl: existing.pageUrl || `azuolynas-fest-${year}.html`,
    pageUrlEn: existing.pageUrlEn || `../en/azuolynas-fest-${year}.html`,
    photos: editingPhotos.map((p, idx) => ({
      id: p.id || `alb_${year}_${idx}`,
      url: p.url,
      caption: String(p.caption || "").trim(),
      captionEn: String(p.captionEn || "").trim(),
      album: p.album || "ceremony",
      uploadedAt: p.uploadedAt || new Date().toISOString()
    })),
    updatedAt: new Date().toISOString(),
    updatedBy: callerEmail,
    adminEmail: callerEmail
  };

  let savedToFirestore = false;
  let savedToServer = false;
  let lastError = null;

  try {
    // 1. Primary on static/Firebase Hosting: Save directly to Firestore
    if (db && typeof db.collection === "function") {
      const approxBytes = new Blob([JSON.stringify(payload)]).size;
      if (approxBytes > 950000) {
        throw new Error(
          "Albumo dydis viršija Firestore 1 MB ribą dėl įterptų nuotraukų. Sumažinkite nuotraukų kiekį arba pridėkite jas per URL nuorodą."
        );
      }
      try {
        await db.collection("editions").doc(year).set(
          {
            ...payload,
            updatedAtServer: firebase.firestore.FieldValue.serverTimestamp()
          },
          { merge: true }
        );
        savedToFirestore = true;
      } catch (fsErr) {
        lastError = handleFirestoreError(fsErr, OperationType.WRITE, `editions/${year}`);
      }
    }

    // 2. Mirror to Node backend when running with server routes (silently skip 404/405 static hosting responses)
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/admin/editions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const contentType = res.headers?.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        savedToServer = true;
      } else if (![404, 405].includes(res.status) && contentType.includes("application/json")) {
        const errData = await res.json().catch(() => ({}));
        if (!savedToFirestore) {
          lastError = new Error(errData.error || `HTTP ${res.status}`);
        }
      }
    } catch (apiErr) {
      if (!savedToFirestore && !lastError) {
        lastError = apiErr;
      }
    }

    if (!savedToFirestore && !savedToServer) {
      if (!auth?.currentUser) {
        throw new Error("Prisijunkite iš naujo su Google arba administratoriaus paskyra, kad galėtumėte išsaugoti į Firestore.");
      }
      throw lastError || new Error("Nepavyko išsaugoti albumo duomenų bazėje.");
    }

    albumsCatalog[year] = payload;
    renderYearPills();
    if (!isAutoSave) {
      showToast(`Albumas ${year} m. (${editingPhotos.length} nuotr.) sėkmingai išsaugotas!`, "success");
    }
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
    return true;
  } catch (err) {
    showToast("Klaida išsaugant albumą: " + err.message, "error");
    return false;
  } finally {
    if (btn && !isAutoSave) btn.disabled = false;
  }
}
