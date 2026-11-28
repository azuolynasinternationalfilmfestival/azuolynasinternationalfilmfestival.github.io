/**
 * content.js
 * Unified Admin Content Manager ("Turinys")
 * Replaces separate Editions, Albums, and Archive editors with a single Firestore `content`
 * collection (`content/home`, `content/2027`, `content/2026`, `content/2025`..., custom years).
 * Also maintains non-destructive mirror writes to `editions/{year}` and `settings/festival`
 * so legacy listeners and offline JSON fallbacks stay synchronized.
 */

import { db, storage, auth, DEFAULT_CONTENT } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

const DEFAULT_HERO_FALLBACK =
  "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b";
const COVER_6612 = "https://i.postimg.cc/vmKKp6m6/ceremonija-2026-03-6612.jpg";
const STATUETTE_URL =
  "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da";

const DEFAULT_ARCHIVE_VIDEOS = [
  { id: "fest_2025", title: "Fest 2025", label: "2025 m. įrašas", url: "https://www.youtube.com/watch?v=HIG7gGCQD7A" },
  { id: "fest_2024", title: "Fest 2024", label: "2024 m. įrašas", url: "https://www.youtube.com/watch?v=Wxr4L_o62dM" },
  { id: "fest_2023", title: "Fest 2023", label: "2023 m. įrašas", url: "https://www.youtube.com/watch?v=D0fC8jApAgk" },
  { id: "fest_2022", title: "Fest 2022", label: "2022 m. įrašas", url: "https://www.youtube.com/watch?v=2PhesUNKZQA" }
];

const DEFAULT_HOME_PHOTOS = [
  {
    id: "home_2025_1",
    url: DEFAULT_HERO_FALLBACK,
    caption: "Akimirkos iš 2025 m. festivalio ceremonijos Kauno tarptautinėje gimnazijoje",
    captionEn: "Moments from the 2025 Film Festival Ceremony at Kaunas International Gymnasium",
    album: "ceremony"
  },
  {
    id: "home_2025_2",
    url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3459.jpeg?alt=media&token=dfdda212-9ea6-433f-af80-8c5b5b57f361",
    caption: "Festivalio laureatai, svečiai ir komisijos nariai 2025 m.",
    captionEn: "Festival laureates, jury and attendees celebrating in 2025",
    album: "laureates"
  },
  {
    id: "home_2025_3",
    url: STATUETTE_URL,
    caption: "Oficialūs festivalio apdovanojimai, ąžuolo statulėlės ir laureatų diplomai",
    captionEn: "Official festival trophies, handcrafted oak awards, and laureate diplomas",
    album: "prizes"
  }
];

const DEFAULT_CONTENT_MAP = {
  home: {
    id: "home",
    year: "home",
    status: "active",
    title: "Ąžuolynas Film Festival — Pagrindinis",
    titleEn: "Ąžuolynas Film Festival — Home",
    date: "2027 m. balandžio 27 d.",
    dateEn: "April 27, 2027",
    subtitle: (DEFAULT_CONTENT && DEFAULT_CONTENT.lt && DEFAULT_CONTENT.lt.topic) || "Mano pašaukimas",
    subtitleEn: (DEFAULT_CONTENT && DEFAULT_CONTENT.en && DEFAULT_CONTENT.en.topic) || "MY PURPOSE",
    story: (DEFAULT_CONTENT && DEFAULT_CONTENT.lt && DEFAULT_CONTENT.lt.aboutText) || "",
    storyEn: (DEFAULT_CONTENT && DEFAULT_CONTENT.en && DEFAULT_CONTENT.en.aboutText) || "",
    heroImage: DEFAULT_HERO_FALLBACK,
    prizesPhotoUrl: STATUETTE_URL,
    videoUrl: "",
    archiveVideos: DEFAULT_ARCHIVE_VIDEOS.map((v) => ({ ...v })),
    photos: DEFAULT_HOME_PHOTOS.map((p) => ({ ...p })),
    seoTitle: "Ąžuolynas Film Fest 2027 | Tarptautinis mokinių filmų festivalis",
    seoTitleEn: "Ąžuolynas Film Festival 2027 | International Youth Film Festival",
    seoDescription: "7-asis tarptautinis mokinių trumpametražių filmų festivalis „Ąžuolynas“ Kaune. Tema: „Mano pašaukimas“. Filmų iki 3 min. priėmimas iki 2027 m. balandžio 5 d.",
    seoDescriptionEn: "The 7th International Student Smartphone Short Film Festival in Kaunas. Theme: 'MY PURPOSE'. Submit films up to 3 minutes by April 5, 2027."
  },
  "2027": {
    id: "2027",
    year: "2027",
    status: "upcoming",
    submissionDeadline: "2027-04-05",
    title: "FEST 2027",
    titleEn: "FEST 2027",
    date: "2027 m. balandžio 27 d.",
    dateEn: "April 27, 2027",
    subtitle: "Tema: „Mano pašaukimas“ (angl. MY PURPOSE)",
    subtitleEn: "Theme: 'MY PURPOSE' (Mano pašaukimas)",
    story:
      "Pasiruoškite 7-ajam tarptautiniam mokinių trumpametražių filmų festivaliui „Ąžuolynas FEST 2027“! Kviečiame moksleivius nuo 10 iki 18 metų kurti trumpametražius filmus iki 3 minučių naudojant tik išmaniuosius telefonus.\n\nPagrindinė 2027 m. tema: „Mano pašaukimas“ (angl. MY PURPOSE).\n\nParaiškos priimamos iki 2027 m. balandžio 5 d. Renginys vyks 2027 m. balandžio 27 d. Kauno tarptautinėje gimnazijoje (Vytauto pr. 50, Kaunas).",
    storyEn:
      "Prepare for the 7th International Youth Short Film Festival 'Ąžuolynas FEST 2027'! We invite students aged 10–18 to create short films up to 3 minutes using smartphone cameras only.\n\nThe main theme for 2027 is 'MY PURPOSE' (Mano pašaukimas).\n\nSubmissions are accepted until April 5, 2027. The festival takes place on April 27, 2027 at Kaunas International Gymnasium (Vytauto pr. 50, Kaunas, Lithuania).",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "",
    pageUrl: "azuolynas-fest-2027.html",
    pageUrlEn: "../en/azuolynas-fest-2027.html",
    seoTitle: "FEST 2027 | Ąžuolynas International Film Festival",
    seoTitleEn: "FEST 2027 | Ąžuolynas International Student Film Festival",
    seoDescription: "7-asis tarptautinis mokinių filmų festivalis FEST 2027 Kaune. Tema „Mano pašaukimas“, paraiškos iki balandžio 5 d., renginys balandžio 27 d.",
    seoDescriptionEn: "7th International Student Smartphone Short Film Festival FEST 2027 in Kaunas. Theme 'MY PURPOSE', submissions by April 5, ceremony April 27.",
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
        url: STATUETTE_URL,
        caption: "Ąžuolo statulėlės ir pagrindiniai apdovanojimai",
        captionEn: "Handcrafted oak statuettes and main festival awards",
        album: "prizes"
      }
    ]
  },
  "2026": {
    id: "2026",
    year: "2026",
    status: "completed",
    submissionDeadline: "2026-04-30",
    title: "FEST 2026",
    titleEn: "FEST 2026",
    date: "2026 m. balandžio 30 d.",
    dateEn: "April 30, 2026",
    theme: "What If",
    subtitle: "Tema: „What If“ • Kino šventė Kauno tarptautinėje gimnazijoje: net keturi žemynai viename ekrane!",
    subtitleEn: "Theme: 'What If' • Cinema Celebration at Kaunas International Gymnasium: Four Continents on One Screen!",
    story:
      "Jau šeštus metus iš eilės Kauno tarptautinė gimnazija (Vytauto pr. 50, Kaunas) tapo jaunimo kino meno centru. 2026 m. balandžio 30 d. mokykloje vyko tradicinis tarptautinis mokinių kino festivalis „Ąžuolynas“ (FEST 2026), kurio pagrindinė kūrybinė tema buvo „What If“.\n\nŠių metų festivalio mastas išties įspūdingas: kaip pastebėjo direktoriaus pavaduotoja ugdymui, atliekanti direktoriaus funkcijas, Marija Daunorienė, dalyvių geografija išsiplėtė net iki 4 žemynų — konkurse varžėsi jaunieji talentai iš Europos, Azijos, Šiaurės Amerikos ir Afrikos. Darbus vertino profesionali tarptautinė komisija iš Italijos, Serbų Respublikos ir Lietuvos.\n\nMūsų gimnazijos pergalės jaunesniojoje kategorijoje:\n• Dominikas Šuškevič (8c klasė) – I VIETA.\n• „Drama club“ kolektyvas (vad. Elena Dosė-Drelingienė) – III VIETA.\n\nTarptautinė programa ir specialūs prizai:\n• Vyresniųjų kategorija: I vieta – Armėnija, II vieta – Estija ir Kanada, III vieta – Kanada.\n• Specialūs festivalio prizai įteikti Vilniaus ir Kenijos komandoms.\n\nIškilmingą vakarą vainikavo 11 klasės teatro dalyko mokinių kūrybinis pasirodymas ant scenos, kuriame kartu su mokiniais pasirodė ir festivalio vadovė Karina Brdar.",
    storyEn:
      "For the sixth consecutive year, Kaunas International Gymnasium (Vytauto pr. 50, Kaunas) became a vibrant hub for youth cinematic art. On April 30, 2026, the school hosted the traditional international students film festival 'Ąžuolynas' (FEST 2026) under the creative theme 'What If'.\n\nThe scale of the 2026 edition was remarkable: as noted by Marija Daunorienė, Deputy Director for Education acting as Director, participation expanded across 4 continents — bringing together young filmmakers from Europe, Asia, North America, and Africa. Entries were evaluated by an international jury of television and international relations professionals from Italy, Republika Srpska, and Lithuania.\n\nSchool Victories (Junior Category):\n• Dominikas Šuškevič (Grade 8c) – 1ST PLACE.\n• 'Drama Club' troupe (directed by Elena Dosė-Drelingienė) – 3RD PLACE.\n\nInternational Awards & Special Honors:\n• Senior Category: 1st Place – Armenia, 2nd Place – Estonia & Canada, 3rd Place – Canada.\n• Special Jury Prizes were awarded to the Vilnius and Kenya teams.\n\nA memorable highlight of the gala evening was a theatrical stage performance by 11th-grade drama students, joined on stage by festival director Karina Brdar.",
    heroImage: COVER_6612,
    videoUrl: "",
    pageUrl: "azuolynas-fest-2026.html",
    pageUrlEn: "../en/azuolynas-fest-2026.html",
    seoTitle: "FEST 2026 | Ąžuolynas International Film Festival",
    seoTitleEn: "FEST 2026 | Ąžuolynas International Film Festival",
    seoDescription: "Tema: „What If“ • 2026 m. balandžio 30 d. Kauno tarptautinėje gimnazijoje vykusi kino šventė: keturi žemynai viename ekrane, laureatai ir galerija.",
    seoDescriptionEn: "Theme: 'What If' • Held on April 30, 2026 at Kaunas International Gymnasium: young filmmakers across four continents, winners, and photo gallery.",
    photos: [
      {
        id: "alb_2026_1",
        url: STATUETTE_URL,
        caption: "FEST 2026 oficialūs apdovanojimai, ąžuolo statulėlės ir diplomai",
        captionEn: "FEST 2026 Official Festival Awards and Trophies",
        album: "prizes"
      },
      {
        id: "alb_2026_2",
        url: COVER_6612,
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
  },
  "2025": {
    id: "2025",
    year: "2025",
    status: "completed",
    title: "FEST 2025",
    titleEn: "FEST 2025",
    date: "2025 m. pavasaris",
    dateEn: "Spring 2025",
    subtitle: "5-asis tarptautinis mokinių trumpametražių filmų festivalis",
    subtitleEn: "5th International Youth Short Film Festival",
    story: "Penktasis tarptautinis mokinių filmų festivalis suvienijo jaunuosius kūrėjus iš skirtingų šalių. Peržiūrėkite pilną ceremonijos įrašą ir renginio akimirkas.",
    storyEn: "The 5th International Student Film Festival brought together young creators across borders. Watch the ceremony replay and festival highlights.",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "https://www.youtube.com/watch?v=HIG7gGCQD7A",
    pageUrl: "edition.html?year=2025",
    pageUrlEn: "edition.html?year=2025",
    seoTitle: "FEST 2025 | Ąžuolynas Film Festival",
    seoTitleEn: "FEST 2025 | Ąžuolynas Film Festival",
    seoDescription: "FEST 2025 tarptautinis mokinių filmų festivalis — ceremonijos vaizdo įrašas ir nuotraukų archyvas.",
    seoDescriptionEn: "FEST 2025 International Student Film Festival — ceremony video and photo archive.",
    photos: []
  },
  "2024": {
    id: "2024",
    year: "2024",
    status: "completed",
    title: "FEST 2024",
    titleEn: "FEST 2024",
    date: "2024 m. pavasaris",
    dateEn: "Spring 2024",
    subtitle: "4-asis tarptautinis mokinių trumpametražių filmų festivalis",
    subtitleEn: "4th International Youth Short Film Festival",
    story: "Ketvirtasis „Ąžuolynas“ festivalis subūrė dešimtis originalių mokinių trumpametražių filmų, sukurtų išmaniaisiais telefonais.",
    storyEn: "The 4th edition of Ąžuolynas Film Festival showcased original student smartphone short films from Lithuania and abroad.",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "https://www.youtube.com/watch?v=Wxr4L_o62dM",
    pageUrl: "edition.html?year=2024",
    pageUrlEn: "edition.html?year=2024",
    seoTitle: "FEST 2024 | Ąžuolynas Film Festival",
    seoTitleEn: "FEST 2024 | Ąžuolynas Film Festival",
    seoDescription: "FEST 2024 — 4-ojo mokinių filmų festivalio retrospektyva ir vaizdo įrašas.",
    seoDescriptionEn: "FEST 2024 — 4th International Student Film Festival retrospective and video.",
    photos: []
  },
  "2023": {
    id: "2023",
    year: "2023",
    status: "completed",
    title: "FEST 2023",
    titleEn: "FEST 2023",
    date: "2023 m. pavasaris",
    dateEn: "Spring 2023",
    subtitle: "3-iasis tarptautinis mokinių filmų festivalis",
    subtitleEn: "3rd International Student Film Festival",
    story: "Trečiasis festivalis Kauno tarptautinėje gimnazijoje — jaunieji režisieriai ir pirmieji tarptautiniai laureatai.",
    storyEn: "The 3rd edition at Kaunas International Gymnasium celebrating young directors and international laureates.",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "https://www.youtube.com/watch?v=D0fC8jApAgk",
    pageUrl: "edition.html?year=2023",
    pageUrlEn: "edition.html?year=2023",
    seoTitle: "FEST 2023 | Ąžuolynas Film Festival",
    seoTitleEn: "FEST 2023 | Ąžuolynas Film Festival",
    seoDescription: "FEST 2023 — 3-iojo mokinių filmų festivalio archyvinis įrašas.",
    seoDescriptionEn: "FEST 2023 — 3rd International Student Film Festival archive recording.",
    photos: []
  },
  "2022": {
    id: "2022",
    year: "2022",
    status: "completed",
    title: "FEST 2022",
    titleEn: "FEST 2022",
    date: "2022 m. pavasaris",
    dateEn: "Spring 2022",
    subtitle: "2-asis tarptautinis mokinių filmų festivalis",
    subtitleEn: "2nd International Student Film Festival",
    story: "Antrasis „Ąžuolynas“ festivalis ir jo ryškiausios kūrybinės istorijos.",
    storyEn: "The 2nd edition of Ąžuolynas Film Festival and its defining student stories.",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "https://www.youtube.com/watch?v=2PhesUNKZQA",
    pageUrl: "edition.html?year=2022",
    pageUrlEn: "edition.html?year=2022",
    seoTitle: "FEST 2022 | Ąžuolynas Film Festival",
    seoTitleEn: "FEST 2022 | Ąžuolynas Film Festival",
    seoDescription: "FEST 2022 — 2-ojo mokinių filmų festivalio archyvinis įrašas.",
    seoDescriptionEn: "FEST 2022 — 2nd International Student Film Festival archive recording.",
    photos: []
  }
};

let contentCatalog = {};
let activeContentKey = "2027";
let activeLangTab = "lt";
let activePhotoFilter = "all";
let editingPhotos = [];
let editingArchiveVideos = [];
let unsubscribeContent = null;
let unsubscribeSettingsBridge = null;

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
      email: user?.email || null
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return new Error(errInfo.error);
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

function safeMediaUrl(raw, fallback = "") {
  const val = String(raw || "").trim();
  if (!val) return fallback;
  if (/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(val)) return val;
  if (/^https?:\/\//i.test(val) || val.startsWith("/") || val.startsWith("./") || val.startsWith("../")) {
    return val;
  }
  return fallback;
}

function sanitizeStoryHtml(raw) {
  const escaped = escapeHtml(raw || "");
  return escaped
    .replace(/&lt;(\/?(b|strong|i|em|blockquote|u))&gt;/gi, "<$1>")
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 10px 0;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function isLegacyOutdated2026(docData) {
  if (!docData) return false;
  const hero = String(docData.heroImage || "");
  const dt = String(docData.date || "");
  const dtEn = String(docData.dateEn || "");
  const updated = String(docData.updatedAt || "");
  return (
    (!updated || updated < "2026-11-23T09:00:00.000Z") &&
    (!hero || hero.includes("IMG_3458") || dt.includes("balandžio 17") || dtEn.includes("April 17"))
  );
}

function cloneDefaultCatalog() {
  const out = {};
  for (const [k, v] of Object.entries(DEFAULT_CONTENT_MAP)) {
    out[k] = {
      ...v,
      photos: Array.isArray(v.photos) ? v.photos.map((p) => ({ ...p })) : [],
      archiveVideos: Array.isArray(v.archiveVideos) ? v.archiveVideos.map((a) => ({ ...a })) : undefined
    };
  }
  return out;
}

async function hasBackendServer() {
  if (typeof window !== "undefined" && window.FestivalApi && typeof window.FestivalApi.hasServer === "function") {
    try {
      return await window.FestivalApi.hasServer();
    } catch {
      return false;
    }
  }
  return false;
}

function resolvePublicPreviewUrl(key, lang) {
  const cleanKey = String(key || "2027").trim();
  const prefix = lang === "en" ? "/en/" : "/lt/";
  if (cleanKey === "home") {
    return `${prefix}index.html`;
  }
  if (cleanKey === "2026" || cleanKey === "2027") {
    return `${prefix}azuolynas-fest-${cleanKey}.html`;
  }
  return `${prefix}edition.html?year=${encodeURIComponent(cleanKey)}`;
}

function normalizeEditionPayload(rawId, rawDoc) {
  const id = String(rawDoc?.year || rawId || "").trim();
  if (!id || id.endsWith("_en")) return null;

  if (id === "2026" && isLegacyOutdated2026(rawDoc)) {
    return { ...DEFAULT_CONTENT_MAP["2026"], photos: DEFAULT_CONTENT_MAP["2026"].photos.map((p) => ({ ...p })) };
  }

  const base = DEFAULT_CONTENT_MAP[id] || {
    id,
    year: id,
    status: "completed",
    title: `FEST ${id}`,
    titleEn: `FEST ${id}`,
    date: `${id} m.`,
    dateEn: id,
    subtitle: "",
    subtitleEn: "",
    story: "",
    storyEn: "",
    heroImage: DEFAULT_HERO_FALLBACK,
    videoUrl: "",
    pageUrl: `edition.html?year=${id}`,
    pageUrlEn: `edition.html?year=${id}`,
    photos: []
  };

  const rawVideoUrl = String(rawDoc?.videoUrl ?? base.videoUrl ?? "").trim();
  const cleanVideoUrl = /youtube\.com\/watch\?v=INGtv\b|listType=search/i.test(rawVideoUrl) ? "" : rawVideoUrl;

  return {
    ...base,
    ...rawDoc,
    id,
    year: id,
    videoUrl: cleanVideoUrl,
    photos: Array.isArray(rawDoc?.photos) ? rawDoc.photos : (base.photos || []),
    archiveVideos: id === "home"
      ? (Array.isArray(rawDoc?.archiveVideos) && rawDoc.archiveVideos.length > 0 ? rawDoc.archiveVideos : DEFAULT_ARCHIVE_VIDEOS.map((v) => ({ ...v })))
      : undefined
  };
}

function mergeIntoCatalog(sourceObj, { overrideExisting = false } = {}) {
  if (!sourceObj || typeof sourceObj !== "object") return;
  const item = normalizeEditionPayload(sourceObj.id || sourceObj.year, sourceObj);
  if (!item) return;

  const prev = contentCatalog[item.id];
  if (!prev) {
    contentCatalog[item.id] = item;
    return;
  }

  if (overrideExisting) {
    contentCatalog[item.id] = {
      ...prev,
      ...item,
      photos: Array.isArray(item.photos) && item.photos.length > 0 ? item.photos : prev.photos,
      archiveVideos: item.id === "home"
        ? (Array.isArray(item.archiveVideos) && item.archiveVideos.length > 0 ? item.archiveVideos : prev.archiveVideos)
        : undefined
    };
  } else {
    contentCatalog[item.id] = {
      ...item,
      ...prev,
      seoTitle: prev.seoTitle || item.seoTitle || "",
      seoTitleEn: prev.seoTitleEn || item.seoTitleEn || "",
      seoDescription: prev.seoDescription || item.seoDescription || "",
      seoDescriptionEn: prev.seoDescriptionEn || item.seoDescriptionEn || "",
      photos: Array.isArray(prev.photos) && prev.photos.length > 0 ? prev.photos : item.photos,
      archiveVideos: prev.id === "home"
        ? (Array.isArray(prev.archiveVideos) && prev.archiveVideos.length > 0 ? prev.archiveVideos : item.archiveVideos)
        : undefined
    };
  }
}

export function initContent() {
  contentCatalog = cloneDefaultCatalog();

  const yearTabsContainer = document.getElementById("contentYearTabs");
  if (yearTabsContainer) {
    yearTabsContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-content-key]");
      if (!btn) return;
      selectContentKey(btn.dataset.contentKey);
    });
  }

  const addYearBtn = document.getElementById("contentAddYearBtn");
  const newYearInput = document.getElementById("contentNewYearInput");
  if (addYearBtn && newYearInput) {
    const addYearHandler = () => {
      const yr = String(newYearInput.value || "").replace(/[^0-9]/g, "").slice(0, 4);
      if (!yr || yr.length !== 4) {
        showToast("Įveskite 4 skaitmenų metus (pvz. 2028).", "error");
        return;
      }
      if (!contentCatalog[yr]) {
        contentCatalog[yr] = {
          id: yr,
          year: yr,
          status: "upcoming",
          submissionDeadline: `${yr}-04-05`,
          title: `FEST ${yr}`,
          titleEn: `FEST ${yr}`,
          date: `${yr} m. balandžio d.`,
          dateEn: `April, ${yr}`,
          subtitle: "",
          subtitleEn: "",
          story: "",
          storyEn: "",
          heroImage: DEFAULT_HERO_FALLBACK,
          videoUrl: "",
          pageUrl: `edition.html?year=${yr}`,
          pageUrlEn: `edition.html?year=${yr}`,
          seoTitle: `FEST ${yr} | Ąžuolynas International Film Festival`,
          seoTitleEn: `FEST ${yr} | Ąžuolynas International Film Festival`,
          seoDescription: `Tarptautinis mokinių trumpametražių filmų festivalis FEST ${yr} Kaune.`,
          seoDescriptionEn: `International Student Short Film Festival FEST ${yr} in Kaunas.`,
          photos: []
        };
      }
      newYearInput.value = "";
      renderYearTabs();
      selectContentKey(yr);
      showToast(`Sukurtas ${yr} m. turinio įrašas — užpildykite laukus ir išsaugokite.`, "success");
    };
    addYearBtn.addEventListener("click", addYearHandler);
    newYearInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addYearHandler();
      }
    });
  }

  const deleteYearBtn = document.getElementById("contentDeleteYearBtn");
  if (deleteYearBtn) {
    deleteYearBtn.addEventListener("click", deleteCurrentContentKey);
  }

  // LT / EN Toggle
  const ltBtn = document.getElementById("contentLangToggleLt");
  const enBtn = document.getElementById("contentLangToggleEn");
  if (ltBtn) ltBtn.addEventListener("click", () => setContentLanguage("lt"));
  if (enBtn) enBtn.addEventListener("click", () => setContentLanguage("en"));

  // Formatting toolbar
  document.querySelectorAll("[data-content-format]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const format = btn.dataset.contentFormat;
      applyStoryFormatting(targetId, format);
    });
  });

  bindStoryPreviewToggle("cntStoryPreviewToggleBtn", "cntStory", "cntStoryPreview", "Peržiūra", "Redaguoti");
  bindStoryPreviewToggle("cntStoryEnPreviewToggleBtn", "cntStoryEn", "cntStoryEnPreview", "Preview", "Edit");

  // Hero & Prizes live previews + upload
  const heroInput = document.getElementById("cntHeroImage");
  const heroPreview = document.getElementById("cntHeroPreview");
  if (heroInput && heroPreview) {
    heroInput.addEventListener("input", () => {
      heroPreview.src = safeMediaUrl(heroInput.value, DEFAULT_HERO_FALLBACK);
    });
  }

  const heroFile = document.getElementById("cntHeroFile");
  if (heroFile) {
    heroFile.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        showToast("Įkeliama viršelio nuotrauka...", "success");
        const uploadedUrl = await uploadSingleImage(file, activeContentKey, 0);
        if (uploadedUrl) {
          if (heroInput) heroInput.value = uploadedUrl;
          if (heroPreview) heroPreview.src = uploadedUrl;
          showToast("Viršelio nuotrauka sėkmingai įkelta! Spauskite „Išsaugoti“.", "success");
        }
      } catch (err) {
        showToast("Nepavyko įkelti viršelio nuotraukos: " + (err.message || err), "error");
      } finally {
        heroFile.value = "";
      }
    });
  }

  const prizesInput = document.getElementById("cntPrizesPhotoUrl");
  const prizesPreview = document.getElementById("cntPrizesPreview");
  if (prizesInput && prizesPreview) {
    prizesInput.addEventListener("input", () => {
      prizesPreview.src = safeMediaUrl(prizesInput.value, STATUETTE_URL);
    });
  }

  // Archive videos management (home key)
  const addVideoBtn = document.getElementById("cntAddVideoBtn");
  if (addVideoBtn) {
    addVideoBtn.addEventListener("click", () => {
      const titleEl = document.getElementById("cntAddVideoTitle");
      const labelEl = document.getElementById("cntAddVideoLabel");
      const urlEl = document.getElementById("cntAddVideoUrl");
      const title = String(titleEl?.value || "").trim();
      const label = String(labelEl?.value || "").trim();
      const url = safeMediaUrl(urlEl?.value || "");
      if (!title || !url) {
        showToast("Įveskite vaizdo įrašo pavadinimą ir nuorodą (YouTube / MP4).", "error");
        return;
      }
      editingArchiveVideos.unshift({
        id: "vid_" + Date.now(),
        title,
        label: label || title,
        url
      });
      if (titleEl) titleEl.value = "";
      if (labelEl) labelEl.value = "";
      if (urlEl) urlEl.value = "";
      renderArchiveVideosList();
      showToast("Vaizdo įrašas pridėtas — nepamirškite paspausti „Išsaugoti“.", "success");
    });
  }

  const videosList = document.getElementById("contentVideosList");
  if (videosList) {
    videosList.addEventListener("click", (e) => {
      const delBtn = e.target.closest("button[data-video-del]");
      if (delBtn) {
        const idx = Number(delBtn.dataset.videoDel);
        editingArchiveVideos.splice(idx, 1);
        renderArchiveVideosList();
      }
    });
  }

  // Photo filter pills
  const filterTabs = document.getElementById("contentPhotoFilterTabs");
  if (filterTabs) {
    filterTabs.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-photo-filter]");
      if (!btn) return;
      activePhotoFilter = btn.dataset.photoFilter || "all";
      filterTabs.querySelectorAll("button[data-photo-filter]").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      renderPhotosGrid();
    });
  }

  // Batch multi-photo upload
  const selectFilesBtn = document.getElementById("contentSelectFilesBtn");
  const multiInput = document.getElementById("contentMultiPhotoInput");
  const dropzone = document.getElementById("contentBatchDropzone");
  if (selectFilesBtn && multiInput) {
    selectFilesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      multiInput.click();
    });
  }
  if (multiInput) {
    multiInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) handleBatchUploadFiles(files);
      multiInput.value = "";
    });
  }
  if (dropzone && multiInput) {
    dropzone.addEventListener("click", (e) => {
      if (e.target === selectFilesBtn || e.target.closest("#contentSelectFilesBtn")) return;
      multiInput.click();
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
      const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) handleBatchUploadFiles(files);
    });
  }

  // Manual URL add
  const addUrlBtn = document.getElementById("contentAddUrlBtn");
  const manualUrlInput = document.getElementById("contentManualUrlInput");
  if (addUrlBtn && manualUrlInput) {
    addUrlBtn.addEventListener("click", () => {
      const url = safeMediaUrl(manualUrlInput.value || "");
      if (!url) {
        showToast("Įveskite galiojančią nuotraukos https:// nuorodą.", "error");
        return;
      }
      const catEl = document.getElementById("contentBatchDefaultCategory");
      const album = catEl ? catEl.value : "ceremony";
      editingPhotos.unshift({
        id: "cnt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        url,
        caption: "",
        captionEn: "",
        album
      });
      manualUrlInput.value = "";
      renderPhotosGrid();
      showToast("Nuotrauka pridėta į sąrašą. Paspauskite „Išsaugoti“.", "success");
    });
  }

  // Photo grid delegation
  const grid = document.getElementById("contentPhotosGrid");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (btn) {
        const idx = Number(btn.dataset.idx);
        const action = btn.dataset.action;
        if (action === "delete") {
          editingPhotos.splice(idx, 1);
          renderPhotosGrid();
        } else if (action === "move-up" && idx > 0) {
          const [item] = editingPhotos.splice(idx, 1);
          editingPhotos.splice(idx - 1, 0, item);
          renderPhotosGrid();
        } else if (action === "move-down" && idx < editingPhotos.length - 1) {
          const [item] = editingPhotos.splice(idx, 1);
          editingPhotos.splice(idx + 1, 0, item);
          renderPhotosGrid();
        } else if (action === "set-hero" && editingPhotos[idx]) {
          const url = editingPhotos[idx].url;
          if (heroInput) heroInput.value = url;
          if (heroPreview) heroPreview.src = url;
          showToast("Nuotrauka priskirta pagrindiniam viršeliui. Išsaugokite!", "success");
        } else if (action === "preview" && editingPhotos[idx]) {
          openPhotoPreviewModal(editingPhotos[idx]);
        }
        return;
      }
      const img = e.target.closest("img[data-preview-idx]");
      if (img) {
        const p = editingPhotos[Number(img.dataset.previewIdx)];
        if (p) openPhotoPreviewModal(p);
      }
    });

    grid.addEventListener("input", (e) => {
      const target = e.target;
      const idx = Number(target.dataset.idx);
      if (!Number.isInteger(idx) || !editingPhotos[idx]) return;
      if (target.dataset.field === "caption") editingPhotos[idx].caption = target.value;
      if (target.dataset.field === "captionEn") editingPhotos[idx].captionEn = target.value;
    });

    grid.addEventListener("change", (e) => {
      const target = e.target;
      const idx = Number(target.dataset.idx);
      if (!Number.isInteger(idx) || !editingPhotos[idx]) return;
      if (target.dataset.field === "album") {
        editingPhotos[idx].album = target.value;
        updatePhotoCountBadge();
      }
    });
  }

  // Modal close
  const previewModal = document.getElementById("contentPreviewModal");
  const previewClose = document.getElementById("contentPreviewModalCloseBtn");
  if (previewClose && previewModal) {
    previewClose.addEventListener("click", () => previewModal.classList.add("d-none"));
    previewModal.addEventListener("click", (e) => {
      if (e.target === previewModal) previewModal.classList.add("d-none");
    });
  }

  // SEO character counters
  bindSeoCounters();

  // Save triggers
  const saveBtn = document.getElementById("saveContentBtn");
  const stickySaveBtn = document.getElementById("contentStickySaveBtn");
  if (saveBtn) saveBtn.addEventListener("click", () => saveCurrentContent(false));
  if (stickySaveBtn) stickySaveBtn.addEventListener("click", () => saveCurrentContent(false));

  // Sync home archive defaults when settings/festival loads
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("festival-settings-updated", (e) => {
      const d = e?.detail;
      if (!d || typeof d !== "object") return;
      const home = contentCatalog.home;
      if (!home) return;
      if (!home._fromContentDoc) {
        if (Array.isArray(d.archiveVideos) && d.archiveVideos.length > 0) {
          home.archiveVideos = d.archiveVideos.map((v) => ({ ...v }));
        }
        if (Array.isArray(d.archivePhotos) && d.archivePhotos.length > 0 && (!home.photos || home.photos.length === 0)) {
          home.photos = d.archivePhotos.map((p) => ({ ...p }));
        }
        if (d.prizesPhotoUrl) {
          home.prizesPhotoUrl = d.prizesPhotoUrl;
        }
        if (activeContentKey === "home") {
          loadFormFromKey("home");
        }
      }
    });
  }

  // Render initial UI and bootstrap JSON seed
  renderYearTabs();
  selectContentKey("2027");
  bootstrapJsonCatalog();
}

function bindSeoCounters() {
  const pairs = [
    ["cntSeoTitle", "cntSeoTitleCount", 65],
    ["cntSeoDescription", "cntSeoDescCount", 160],
    ["cntSeoTitleEn", "cntSeoTitleEnCount", 65],
    ["cntSeoDescriptionEn", "cntSeoDescEnCount", 160]
  ];
  for (const [inputId, counterId, max] of pairs) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) continue;
    const update = () => {
      const len = String(input.value || "").length;
      counter.textContent = `${len} / ${max}`;
      counter.classList.toggle("is-over", len > max);
    };
    input.addEventListener("input", update);
    update();
  }
}

function refreshSeoCounters() {
  for (const id of ["cntSeoTitle", "cntSeoDescription", "cntSeoTitleEn", "cntSeoDescEn"]) {
    const el = document.getElementById(id);
    if (el && typeof el.dispatchEvent === "function") {
      try {
        el.dispatchEvent(new Event("input"));
      } catch { /* ignore */ }
    }
  }
}

function setContentLanguage(lang) {
  activeLangTab = lang === "en" ? "en" : "lt";
  const ltBtn = document.getElementById("contentLangToggleLt");
  const enBtn = document.getElementById("contentLangToggleEn");
  const ltBox = document.getElementById("contentLtFields");
  const enBox = document.getElementById("contentEnFields");
  if (ltBtn) {
    ltBtn.classList.toggle("active", activeLangTab === "lt");
    ltBtn.setAttribute("aria-selected", activeLangTab === "lt" ? "true" : "false");
  }
  if (enBtn) {
    enBtn.classList.toggle("active", activeLangTab === "en");
    enBtn.setAttribute("aria-selected", activeLangTab === "en" ? "true" : "false");
  }
  if (ltBox) ltBox.classList.toggle("d-none", activeLangTab !== "lt");
  if (enBox) enBox.classList.toggle("d-none", activeLangTab !== "en");
}

function bindStoryPreviewToggle(btnId, textareaId, previewId, labelView, labelEdit) {
  const btn = document.getElementById(btnId);
  const ta = document.getElementById(textareaId);
  const pv = document.getElementById(previewId);
  if (!btn || !ta || !pv) return;
  btn.addEventListener("click", () => {
    const showPreview = pv.classList.contains("d-none");
    if (showPreview) {
      pv.innerHTML = sanitizeStoryHtml(ta.value);
      pv.classList.remove("d-none");
      ta.classList.add("d-none");
      btn.textContent = labelEdit;
    } else {
      pv.classList.add("d-none");
      ta.classList.remove("d-none");
      btn.textContent = labelView;
    }
  });
}

function applyStoryFormatting(targetId, format) {
  const ta = document.getElementById(targetId);
  if (!ta) return;
  const start = ta.selectionStart ?? ta.value.length;
  const end = ta.selectionEnd ?? ta.value.length;
  const selected = ta.value.slice(start, end) || "tekstas";
  let snippet = selected;
  if (format === "bold") snippet = `<b>${selected}</b>`;
  else if (format === "italic") snippet = `<i>${selected}</i>`;
  else if (format === "quote") snippet = `\n<blockquote>${selected}</blockquote>\n`;
  else if (format === "paragraph") snippet = `${selected}\n\n`;
  ta.value = ta.value.slice(0, start) + snippet + ta.value.slice(end);
  ta.focus();
  const nextPos = start + snippet.length;
  ta.setSelectionRange(nextPos, nextPos);
}

async function bootstrapJsonCatalog() {
  if (typeof fetch !== "function") return;
  try {
    const res = await fetch("../data/editions.json");
    if (!res || !res.ok) return;
    const ct = res.headers?.get?.("content-type") || "";
    if (!ct.includes("application/json")) return;
    const data = await res.json();
    if (Array.isArray(data?.editions)) {
      for (const ed of data.editions) {
        mergeIntoCatalog(ed, { overrideExisting: false });
      }
      renderYearTabs();
      loadFormFromKey(activeContentKey);
    }
  } catch { /* ignore static offline issues */ }
}

export function subscribeContent() {
  unsubscribeContentListener();

  if (!db || typeof db.collection !== "function") return;

  // 1. Primary unified `content` collection
  try {
    unsubscribeContent = db.collection("content").onSnapshot(
      (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data() || {};
          const key = String(doc.id || data.year || "").trim();
          if (!key) return;
          const normalized = normalizeEditionPayload(key, data);
          if (normalized) {
            normalized._fromContentDoc = true;
            contentCatalog[key] = normalized;
          }
        });
        renderYearTabs();
        loadFormFromKey(activeContentKey);
      },
      (err) => {
        console.warn("[Content] content listener notice:", err?.message || err);
      }
    );
  } catch (err) {
    console.warn("[Content] content listener setup error:", err?.message || err);
  }

  // 2. Non-destructive seed from legacy `editions` collection for any years not yet in `content`
  db.collection("editions")
    .get()
    .then((snap) => {
      snap.forEach((doc) => {
        const key = String(doc.id || "").trim();
        if (!key || key.endsWith("_en")) return;
        const existing = contentCatalog[key];
        if (!existing || !existing._fromContentDoc) {
          mergeIntoCatalog({ id: key, ...doc.data() }, { overrideExisting: false });
        }
      });
      renderYearTabs();
      if (!contentCatalog[activeContentKey]?._fromContentDoc) {
        loadFormFromKey(activeContentKey);
      }
    })
    .catch(() => {});
}

export function unsubscribeContentListener() {
  if (typeof unsubscribeContent === "function") {
    try { unsubscribeContent(); } catch { /* ignore */ }
    unsubscribeContent = null;
  }
  if (typeof unsubscribeSettingsBridge === "function") {
    try { unsubscribeSettingsBridge(); } catch { /* ignore */ }
    unsubscribeSettingsBridge = null;
  }
}

function getSortedContentKeys() {
  const keys = Object.keys(contentCatalog);
  const years = keys
    .filter((k) => k !== "home")
    .sort((a, b) => Number(b) - Number(a));
  return ["home", ...years];
}

function renderYearTabs() {
  const container = document.getElementById("contentYearTabs");
  if (!container) return;

  const keys = getSortedContentKeys();
  container.innerHTML = keys
    .map((key) => {
      const item = contentCatalog[key];
      const count = Array.isArray(item?.photos) ? item.photos.length : 0;
      const isSelected = key === activeContentKey;
      const label = key === "home" ? "Pagrindinis" : `${key} m.`;
      return `
        <button
          type="button"
          id="contentYearTab_${escapeHtml(key)}"
          role="tab"
          aria-selected="${isSelected ? "true" : "false"}"
          class="content-year-pill ${isSelected ? "active" : ""}"
          data-content-key="${escapeHtml(key)}"
        >
          <span>${escapeHtml(label)}</span>
          ${key !== "home" ? `<span class="content-year-count">${count}</span>` : ""}
        </button>
      `;
    })
    .join("");
}

export function selectContentKey(key) {
  const cleanKey = String(key || "2027").trim();
  if (!contentCatalog[cleanKey]) return;
  activeContentKey = cleanKey;

  const panel = document.getElementById("contentActivePanel");
  if (panel) panel.setAttribute("aria-labelledby", `contentYearTab_${cleanKey}`);

  renderYearTabs();
  loadFormFromKey(cleanKey);
}

function loadFormFromKey(key) {
  const item = contentCatalog[key] || DEFAULT_CONTENT_MAP["2027"];
  const isHome = key === "home";

  const heading = document.getElementById("contentActiveHeading");
  if (heading) {
    heading.textContent = isHome
      ? "Pagrindinio puslapio archyvas ir SEO"
      : `${item.year || key} m. leidinys ir galerija`;
  }

  const openLt = document.getElementById("contentOpenLtBtn");
  const openEn = document.getElementById("contentOpenEnBtn");
  if (openLt) openLt.href = resolvePublicPreviewUrl(key, "lt");
  if (openEn) openEn.href = resolvePublicPreviewUrl(key, "en");

  const delBtn = document.getElementById("contentDeleteYearBtn");
  if (delBtn) {
    const isProtected = key === "home" || key === "2026" || key === "2027" || key === "2025" || key === "2024" || key === "2023" || key === "2022";
    delBtn.classList.toggle("d-none", isProtected);
  }

  const edMetaSec = document.getElementById("contentEditionMetaSection");
  const homeSec = document.getElementById("contentHomeMediaSection");
  const videoWrap = document.getElementById("contentVideoUrlWrap");
  if (edMetaSec) edMetaSec.classList.toggle("d-none", isHome);
  if (homeSec) homeSec.classList.toggle("d-none", !isHome);
  if (videoWrap) videoWrap.classList.toggle("d-none", isHome);

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v || "";
  };

  setVal("cntStatus", item.status || "upcoming");
  setVal("cntDeadline", item.submissionDeadline || "");
  setVal("cntTitle", item.title || "");
  setVal("cntDate", item.date || "");
  setVal("cntSubtitle", item.subtitle || "");
  setVal("cntStory", item.story || "");
  setVal("cntTitleEn", item.titleEn || "");
  setVal("cntDateEn", item.dateEn || "");
  setVal("cntSubtitleEn", item.subtitleEn || "");
  setVal("cntStoryEn", item.storyEn || "");
  setVal("cntVideoUrl", item.videoUrl || "");
  setVal("cntSeoTitle", item.seoTitle || "");
  setVal("cntSeoDescription", item.seoDescription || "");
  setVal("cntSeoTitleEn", item.seoTitleEn || "");
  setVal("cntSeoDescriptionEn", item.seoDescriptionEn || "");

  const heroUrl = safeMediaUrl(item.heroImage, DEFAULT_HERO_FALLBACK);
  setVal("cntHeroImage", heroUrl);
  const heroPrev = document.getElementById("cntHeroPreview");
  if (heroPrev) heroPrev.src = heroUrl;

  if (isHome) {
    const prizesUrl = safeMediaUrl(item.prizesPhotoUrl, STATUETTE_URL);
    setVal("cntPrizesPhotoUrl", prizesUrl);
    const prizesPrev = document.getElementById("cntPrizesPreview");
    if (prizesPrev) prizesPrev.src = prizesUrl;
    editingArchiveVideos = Array.isArray(item.archiveVideos)
      ? item.archiveVideos.map((v) => ({ ...v }))
      : DEFAULT_ARCHIVE_VIDEOS.map((v) => ({ ...v }));
    renderArchiveVideosList();
  }

  editingPhotos = Array.isArray(item.photos) ? item.photos.map((p) => ({ ...p })) : [];
  renderPhotosGrid();
  refreshSeoCounters();
}

function renderArchiveVideosList() {
  const list = document.getElementById("contentVideosList");
  if (!list) return;
  if (!editingArchiveVideos.length) {
    list.innerHTML = `<div class="content-empty-note">Archyvo vaizdo įrašų dar nėra.</div>`;
    return;
  }
  list.innerHTML = editingArchiveVideos
    .map(
      (v, idx) => `
      <div class="content-video-row">
        <div class="content-video-meta">
          <strong>${escapeHtml(v.title || "Fest")}</strong>
          <span>${escapeHtml(v.label || "")}</span>
          <a href="${escapeHtml(safeMediaUrl(v.url, "#"))}" target="_blank" rel="noopener">${escapeHtml(v.url || "")}</a>
        </div>
        <button type="button" class="btn-delete btn-xs" data-video-del="${idx}">Pašalinti</button>
      </div>`
    )
    .join("");
}

function updatePhotoCountBadge() {
  const badge = document.getElementById("contentPhotosCountBadge");
  if (badge) badge.textContent = `${editingPhotos.length} nuotr.`;
}

function renderPhotosGrid() {
  const grid = document.getElementById("contentPhotosGrid");
  updatePhotoCountBadge();
  if (!grid) return;

  const indexed = editingPhotos
    .map((photo, idx) => ({ photo, idx }))
    .filter(({ photo }) => activePhotoFilter === "all" || (photo.album || "ceremony") === activePhotoFilter);

  if (indexed.length === 0) {
    grid.innerHTML = `<div class="content-empty-note">Šioje kategorijoje nuotraukų kol kas nėra. Įkelkite jas žemiau arba įklijuokite URL.</div>`;
    return;
  }

  grid.innerHTML = indexed
    .map(({ photo, idx }) => {
      const safeImg = safeMediaUrl(photo.url, DEFAULT_HERO_FALLBACK);
      const alb = photo.album || "ceremony";
      return `
        <div class="content-photo-card" data-photo-idx="${idx}">
          <div class="content-photo-thumb-wrap">
            <img src="${escapeHtml(safeImg)}" alt="${escapeHtml(photo.caption || photo.captionEn || "Festivalio nuotrauka")}" data-preview-idx="${idx}" loading="lazy">
            <div class="content-photo-actions">
              <button type="button" class="btn-outline btn-xs" data-action="move-up" data-idx="${idx}" title="Aukštyn">&#8593;</button>
              <button type="button" class="btn-outline btn-xs" data-action="move-down" data-idx="${idx}" title="Žemyn">&#8595;</button>
              <button type="button" class="btn-outline btn-xs" data-action="set-hero" data-idx="${idx}" title="Padaryti viršeliu">Viršelis</button>
              <button type="button" class="btn-outline btn-xs" data-action="preview" data-idx="${idx}" title="Peržiūrėti">Peržiūra</button>
              <button type="button" class="btn-delete btn-xs" data-action="delete" data-idx="${idx}" title="Pašalinti">Ištrinti</button>
            </div>
          </div>
          <div class="content-photo-fields">
            <select class="field" data-field="album" data-idx="${idx}" aria-label="Nuotraukos kategorija">
              <option value="ceremony" ${alb === "ceremony" ? "selected" : ""}>Ceremonija</option>
              <option value="laureates" ${alb === "laureates" ? "selected" : ""}>Laureatai ir svečiai</option>
              <option value="prizes" ${alb === "prizes" ? "selected" : ""}>Statulėlės ir prizai</option>
            </select>
            <input type="text" class="field" data-field="caption" data-idx="${idx}" placeholder="Aprašymas LT..." value="${escapeHtml(photo.caption || "")}">
            <input type="text" class="field" data-field="captionEn" data-idx="${idx}" placeholder="Caption EN..." value="${escapeHtml(photo.captionEn || "")}">
          </div>
        </div>
      `;
    })
    .join("");
}

function openPhotoPreviewModal(photo) {
  const modal = document.getElementById("contentPreviewModal");
  const img = document.getElementById("contentPreviewModalImg");
  const cap = document.getElementById("contentPreviewModalCaption");
  if (!modal || !img) return;
  img.src = safeMediaUrl(photo?.url, DEFAULT_HERO_FALLBACK);
  if (cap) cap.textContent = photo?.caption || photo?.captionEn || "";
  modal.classList.remove("d-none");
}

function compressFileToJpegDataUrl(file, maxWidth = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === "undefined") {
      reject(new Error("FileReader nepalaikomas"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Nepavyko nuskaityti failo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ""));
      img.onload = () => {
        try {
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx && typeof ctx.drawImage === "function") {
            ctx.drawImage(img, 0, 0, w, h);
          }
          const out = canvas.toDataURL("image/jpeg", quality);
          resolve(out || String(reader.result || ""));
        } catch {
          resolve(String(reader.result || ""));
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadSingleImage(file, key, idx = 0) {
  const safeKey = String(key || activeContentKey || "2027").replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanName = String(file?.name || "photo.jpg")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);

  // 1. Express backend server if running locally
  if (await hasBackendServer()) {
    const b64 = await compressFileToJpegDataUrl(file, 1600, 0.82);
    const res = await fetch("/api/admin/albums/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: safeKey, fileName: cleanName, dataUrl: b64 })
    });
    if (res && res.ok) {
      const json = await res.json();
      if (json?.url) return json.url;
    }
  }

  // 2. Static GitHub Pages path: Firebase Storage only (no base64 database fallback)
  if (!storage || typeof storage.ref !== "function") {
    throw new Error("Firebase Storage šiuo metu nepasiekiama. Perkraukite puslapį arba įklijuokite HTTPS nuotraukos nuorodą.");
  }

  try {
    const path = `content/${safeKey}/${Date.now()}_${idx}_${cleanName}`;
    const snap = await storage.ref(path).put(file, {
      contentType: file?.type || "image/jpeg"
    });
    const url = await snap.ref.getDownloadURL();
    if (!url) throw new Error("Negautas atsisiuntimo adresas iš saugyklos.");
    return url;
  } catch (storageErr) {
    const reason = storageErr?.code === "storage/unauthorized"
      ? "Nepakanka teisių įkelti į Firebase Storage. Patikrinkite prisijungimą."
      : (storageErr?.message || "Nepavyko įkelti nuotraukos į Firebase Storage.");
    throw new Error(reason);
  }
}

async function handleBatchUploadFiles(files) {
  const progressWrap = document.getElementById("contentBatchProgress");
  const progressFill = document.getElementById("contentBatchProgressFill");
  const progressLabel = document.getElementById("contentBatchProgressStatus");
  const catEl = document.getElementById("contentBatchDefaultCategory");
  const defaultAlbum = catEl ? catEl.value : "ceremony";

  if (progressWrap) progressWrap.classList.remove("d-none");

  let uploadedCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (progressLabel) {
      progressLabel.textContent = `Įkeliama ${i + 1} / ${files.length}: ${file.name}`;
    }
    if (progressFill) {
      progressFill.style.width = `${Math.round(((i + 0.3) / files.length) * 100)}%`;
    }
    try {
      const url = await uploadSingleImage(file, activeContentKey, i);
      if (url) {
        editingPhotos.unshift({
          id: "cnt_" + Date.now() + "_" + i,
          url,
          caption: "",
          captionEn: "",
          album: defaultAlbum
        });
        uploadedCount++;
      }
    } catch (err) {
      showToast(`Nepavyko įkelti ${file.name}: ${err.message || err}`, "error");
    }
    if (progressFill) {
      progressFill.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;
    }
  }

  renderPhotosGrid();
  renderYearTabs();
  if (progressLabel) {
    progressLabel.textContent = `Įkelta ${uploadedCount} iš ${files.length} nuotraukų.`;
  }
  setTimeout(() => {
    if (progressWrap) progressWrap.classList.add("d-none");
  }, 2400);

  if (uploadedCount > 0) {
    showToast(`Pridėta ${uploadedCount} nuotr. Paspauskite „Išsaugoti ir Paskelbti“!`, "success");
  }
}

export async function saveCurrentContent(isAutoSave = false) {
  const key = String(activeContentKey || "2027").trim();
  const isHome = key === "home";
  const saveBtn = document.getElementById("saveContentBtn");
  const stickyBtn = document.getElementById("contentStickySaveBtn");

  if (saveBtn) saveBtn.disabled = true;
  if (stickyBtn) stickyBtn.disabled = true;

  try {
    const val = (id) => String(document.getElementById(id)?.value || "").trim();
    const existing = contentCatalog[key] || DEFAULT_CONTENT_MAP[key] || {};

    const cleanPhotos = editingPhotos
      .filter((p) => p && safeMediaUrl(p.url))
      .map((p, idx) => ({
        id: String(p.id || `photo_${key}_${idx}`),
        url: safeMediaUrl(p.url),
        caption: String(p.caption || "").trim(),
        captionEn: String(p.captionEn || "").trim(),
        album: ["ceremony", "laureates", "prizes"].includes(p.album) ? p.album : "ceremony"
      }));

    const payload = {
      id: key,
      year: key,
      status: isHome ? "active" : (val("cntStatus") || "upcoming"),
      submissionDeadline: isHome ? "" : val("cntDeadline"),
      title: val("cntTitle") || existing.title || (isHome ? "Ąžuolynas Film Festival" : `FEST ${key}`),
      titleEn: val("cntTitleEn") || existing.titleEn || val("cntTitle") || (isHome ? "Ąžuolynas Film Festival" : `FEST ${key}`),
      date: val("cntDate") || existing.date || "",
      dateEn: val("cntDateEn") || existing.dateEn || val("cntDate") || "",
      subtitle: val("cntSubtitle"),
      subtitleEn: val("cntSubtitleEn"),
      story: val("cntStory"),
      storyEn: val("cntStoryEn"),
      heroImage: safeMediaUrl(val("cntHeroImage"), existing.heroImage || DEFAULT_HERO_FALLBACK),
      videoUrl: isHome ? "" : safeMediaUrl(val("cntVideoUrl")),
      pageUrl: isHome ? "index.html" : (key === "2026" || key === "2027" ? `azuolynas-fest-${key}.html` : `edition.html?year=${key}`),
      pageUrlEn: isHome ? "index.html" : (key === "2026" || key === "2027" ? `../en/azuolynas-fest-${key}.html` : `edition.html?year=${key}`),
      seoTitle: val("cntSeoTitle"),
      seoTitleEn: val("cntSeoTitleEn"),
      seoDescription: val("cntSeoDescription"),
      seoDescriptionEn: val("cntSeoDescriptionEn"),
      photos: cleanPhotos,
      updatedAt: new Date().toISOString()
    };

    if (isHome) {
      payload.prizesPhotoUrl = safeMediaUrl(val("cntPrizesPhotoUrl"), STATUETTE_URL);
      payload.archiveVideos = editingArchiveVideos
        .filter((v) => v && safeMediaUrl(v.url))
        .map((v, idx) => ({
          id: String(v.id || `vid_${idx}`),
          title: String(v.title || "Fest").trim(),
          label: String(v.label || "").trim(),
          url: safeMediaUrl(v.url)
        }));
    }

    const approxBytes = new Blob([JSON.stringify(payload)]).size;
    if (approxBytes > 920000) {
      throw new Error("Turinio įrašas viršija Firestore 920 KB ribą. Sumažinkite įkeltų DataURL nuotraukų skaičių arba naudokite Firebase Storage / nuorodas.");
    }

    let savedFirestore = false;
    if (db && typeof db.collection === "function") {
      try {
        await db.collection("content").doc(key).set(payload, { merge: true });
        if (isHome) {
          const settingsMirror = {
            archiveVideos: payload.archiveVideos,
            archivePhotos: cleanPhotos,
            prizesPhotoUrl: payload.prizesPhotoUrl,
            updatedAt: payload.updatedAt
          };
          await db.collection("settings").doc("festival").set(settingsMirror, { merge: true });
          await db.collection("settings").doc("global").set(settingsMirror, { merge: true });
        } else {
          await db.collection("editions").doc(key).set(payload, { merge: true });
        }
        savedFirestore = true;
      } catch (fsErr) {
        throw handleFirestoreError(fsErr, OperationType.WRITE, `content/${key}`);
      }
    }

    if (await hasBackendServer()) {
      try {
        await fetch("/api/admin/editions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch { /* benign */ }
    }

    contentCatalog[key] = { ...payload, _fromContentDoc: true };
    renderYearTabs();

    if (!isAutoSave && savedFirestore) {
      showToast(
        isHome
          ? "Pagrindinio puslapio archyvas ir SEO išsaugoti!"
          : `${key} m. turinys ir galerija sėkmingai išsaugoti!`,
        "success"
      );
    }
    try {
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("refresh-notifications"));
      }
    } catch { /* ignore */ }
    return true;
  } catch (err) {
    showToast("Klaida išsaugant turinį: " + (err?.message || String(err)), "error");
    return false;
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (stickyBtn) stickyBtn.disabled = false;
  }
}

async function deleteCurrentContentKey() {
  const key = activeContentKey;
  if (key === "home" || key === "2026" || key === "2027") {
    showToast("Šio pagrindinio įrašo pašalinti negalima.", "error");
    return;
  }
  if (db && typeof db.collection === "function") {
    try {
      await db.collection("content").doc(key).delete();
      await db.collection("editions").doc(key).delete().catch(() => {});
    } catch (err) {
      showToast("Klaida šalinant: " + (err?.message || err), "error");
      return;
    }
  }
  delete contentCatalog[key];
  selectContentKey("2027");
  showToast(`${key} m. įrašas pašalintas.`, "success");
}
