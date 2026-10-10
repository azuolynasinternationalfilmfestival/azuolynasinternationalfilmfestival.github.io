/**
 * js/broadcast-graphics.js
 * Ąžuolyno Tarptautinio Kino Festivalio (AZUOLYNAS) Broadcast Graphics Admin Panel
 * OBS Studio Browser Source & H2R Graphics Animated Overlays Engine
 */

import { showToast } from "./ui-feedback.js";

// Festival Brand Constants
const BRAND = {
  name: "AZUOLYNAS",
  font: "Inter",
  bgPrimary: "#0A221D",
  darkGreen: "#113939",
  accentBorder: "#6FA58A",
  secondaryText: "#9BC4AE",
  primaryText: "#F1F3EE",
  goldAccent: "#D4AF37",
  alertRed: "#ef4444",
  logoUrl: "https://i.postimg.cc/GpCY4wPT/Logo-film-fest.webp",
  borderRadius: 6
};

// 13 Official Broadcast Templates
export const BROADCAST_TEMPLATES = [
  {
    type: "junior-category",
    name: "Jaunųjų kategorija (10–13 metų)",
    badge: "KATEGORIJA I (10–13 M.)",
    title: "JAUNŲJŲ KŪRĖJŲ KATEGORIJA",
    subtitle: "5–8 klasių moksleivių autoriniai filmai telefonu",
    category: "Jaunieji",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 620,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.6,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 52,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "senior-category",
    name: "Vyresniųjų kategorija (14–18 metų)",
    badge: "KATEGORIJA II (14–18 M.)",
    title: "VYRESNIŲJŲ KŪRĖJŲ KATEGORIJA",
    subtitle: "9–12 klasių gimnazistų trumpametražis kinas",
    category: "Vyresnieji",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 620,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.6,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 52,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "place-1",
    name: "Pirmosios vietos apdovanojimas (I Vieta)",
    badge: "🏆 I VIETOS LAUREATAS",
    title: "AUKSINIS ĄŽUOLAS",
    subtitle: "Aukščiausias festivalio žiuri komisijos įvertinimas",
    category: "Laureatas",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 640,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.95,
    borderColor: "#D4AF37",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#D4AF37",
    subtextColor: "#F3E5AB",
    fontFamily: "Inter",
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 1,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.7,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 56,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "place-2",
    name: "Antrosios vietos apdovanojimas (II Vieta)",
    badge: "🥈 II VIETOS LAUREATAS",
    title: "SIDABRINIS ĄŽUOLAS",
    subtitle: "Kinematografinis meistriškumas ir vizualinė dramaturgija",
    category: "Laureatas",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 640,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#C0C0C0",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#E0E0E0",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: 0.8,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.65,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 54,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "place-3",
    name: "Trečiosios vietos apdovanojimas (III Vieta)",
    badge: "🥉 III VIETOS LAUREATAS",
    title: "BRONZINIS ĄŽUOLAS",
    subtitle: "Originali režisūrinė idėja ir kūrybinis debiutas",
    category: "Laureatas",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 640,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#CD7F32",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#E29548",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: 0.8,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.65,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 54,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "film-title",
    name: "Filmo pavadinimas ir kūrėjas (Lower Third)",
    badge: "KONKURSINIS FILMAS",
    title: "VILTIES ŠVIESA",
    subtitle: "Autorius: Mantas Petraitis • Kauno Tarptautinė Gimnazija",
    category: "Filmas",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 640,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-left",
    duration: 0.6,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 52,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "participant",
    name: "Dalyvio vardas ir pavardė",
    badge: "FESTIVALIO AUTORIUS",
    title: "DOMINIKAS ŠUŠKEVIČ",
    subtitle: "Kauno Tarptautinė Gimnazija (8c klasė)",
    category: "Dalyvis",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 560,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-left",
    duration: 0.55,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 48,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "live",
    name: "„TIESIOGIAI“ žyma (Live Bug)",
    badge: "LIVE TRANSLIACIA",
    title: "TIESIOGIAI",
    subtitle: "Ąžuolyno Film Festivalis",
    category: "Žyma",
    position: "top-right",
    offsetX: 60,
    offsetY: 48,
    width: 270,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#ef4444",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 1,
    lineHeight: 1.2,
    animation: "fade",
    duration: 0.5,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 34,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: false
  },
  {
    type: "countdown",
    name: "Atbulinės atskaitos laikmatis",
    badge: "TRANSLIACIJOS PRADŽIA",
    title: "PRADŽIA PO:",
    subtitle: "Ąžuolyno Tarptautinis Mokinių Filmų Festivalis",
    category: "Laikmatis",
    timerMinutes: 5,
    timerSeconds: 0,
    timerFinishMsg: "FESTIVALIS PRASIDEDA!",
    interactive: false,
    position: "center",
    offsetX: 0,
    offsetY: 0,
    width: 640,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.95,
    borderColor: "#6FA58A",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#D4AF37",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 1,
    lineHeight: 1.2,
    animation: "scale",
    duration: 0.7,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 64,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "intro",
    name: "Festivalio pradžios ekranas",
    badge: "AZUOLYNAS FEST",
    title: "ĄŽUOLYNO TARPTAUTINIS KINO FESTIVALIS",
    subtitle: "Apdovanojimų ir Laureatų Ceremonija • Kauno Tarptautinė Gimnazija",
    category: "Ekranas",
    position: "center",
    offsetX: 0,
    offsetY: 0,
    width: 880,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.96,
    borderColor: "#6FA58A",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: 1.2,
    lineHeight: 1.2,
    animation: "scale",
    duration: 0.8,
    delay: 0.1,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 84,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "outro",
    name: "Festivalio pabaigos ekranas",
    badge: "AZUOLYNAS PABAIGA",
    title: "AČIŪ, KAD BUVOTE KARTU!",
    subtitle: "Sveikiname visus laureatus ir dalyvius. Iki susitikimo kitais metais!",
    category: "Ekranas",
    position: "center",
    offsetX: 0,
    offsetY: 0,
    width: 820,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.96,
    borderColor: "#6FA58A",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 1,
    lineHeight: 1.2,
    animation: "fade",
    duration: 0.8,
    delay: 0.1,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 76,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "notice",
    name: "Pranešimo arba klaidos baneris",
    badge: "BŪSENOS PRANEŠIMAS",
    title: "NETRUKUS TĘSIME TRANSLIACIJĄ",
    subtitle: "Signalizavimo atnaujinimas • Ačiū už jūsų kantrybę",
    category: "Pranešimas",
    position: "bottom-center",
    offsetX: 0,
    offsetY: 60,
    width: 680,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.96,
    borderColor: "#6FA58A",
    borderWidth: 1.5,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#D4AF37",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.6,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 50,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  },
  {
    type: "custom",
    name: "Individualus baneris (Laisvas dizainas)",
    badge: "AZUOLYNAS GRAFIKA",
    title: "INDIVIDUALUS TRANSLIACIJOS BANERIS",
    subtitle: "Redaguokite visus parametrus, spalvas, animacijas ir šriftus",
    category: "Laisvas",
    position: "bottom-left",
    offsetX: 60,
    offsetY: 60,
    width: 580,
    height: "auto",
    bgColor: "#0A221D",
    bgOpacity: 0.94,
    borderColor: "#6FA58A",
    borderWidth: 1,
    borderRadius: 6,
    textColor: "#F1F3EE",
    accentColor: "#6FA58A",
    subtextColor: "#9BC4AE",
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.25,
    animation: "slide-up",
    duration: 0.6,
    delay: 0,
    showLogo: true,
    logoUrl: BRAND.logoUrl,
    logoSize: 52,
    showBadge: true,
    showSubtitle: true,
    showAccentBar: true
  }
];

// App State
let projectsList = [];
let activeItem = null;
let currentSubtab = "dashboard";
let previewZoom = 0.55;
let isCheckerboardBg = false;
let codeEditorRevisions = [];
let customHtmlCode = "";
let customCssCode = "";
let customJsCode = "";
let countdownTimerRunning = false;
let countdownRemainingSeconds = 300;
let countdownTimerInterval = null;

export function initBroadcastGraphics() {
  initSubnavTabs();
  initTemplateGallery();
  initVisualEditorInputs();
  initCountdownEditor();
  initNoticeTemplates();
  initCodeEditor();
  initPreviewControls();
  initExportHandlers();
  initProjectLibraryControls();

  // Load projects from server or localStorage
  loadBroadcastProjects();
}

function initSubnavTabs() {
  const subnavBtns = document.querySelectorAll(".bg-subnav-btn");
  subnavBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      switchSubtab(target);
    });
  });
}

export function switchSubtab(tabName) {
  currentSubtab = tabName;
  document.querySelectorAll(".bg-subnav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.target === tabName);
  });
  document.querySelectorAll(".bg-section-panel").forEach((p) => {
    p.classList.toggle("d-none", p.id !== `bgPanel_${tabName}`);
  });

  if (tabName === "preview" || tabName === "editor") {
    renderLivePreview();
  }
  if (tabName === "code") {
    syncActiveItemToCodeEditor();
  }
  if (tabName === "dashboard") {
    updateDashboardStats();
    renderRecentProjectsGrid();
  }
}

// ---------------------------------------------------------------------------
// DATA PERSISTENCE
// ---------------------------------------------------------------------------
export async function loadBroadcastProjects() {
  try {
    const res = await fetch("/api/broadcast/projects");
    if (res.ok) {
      const data = await res.json();
      projectsList = data.projects || [];
    }
  } catch (err) {
    console.warn("Could not load from /api/broadcast/projects, checking localStorage:", err);
  }

  if (!projectsList || projectsList.length === 0) {
    const local = localStorage.getItem("azuolynas_broadcast_projects");
    if (local) {
      try {
        projectsList = JSON.parse(local);
      } catch (e) {}
    }
  }

  if (!projectsList || projectsList.length === 0) {
    projectsList = BROADCAST_TEMPLATES.map((tpl, i) => ({
      ...tpl,
      id: `proj_${tpl.type}`,
      updatedAt: new Date(Date.now() - (i * 3600000)).toISOString()
    }));
    saveBroadcastProjectsToStorage();
  }

  // Set default active item
  if (!activeItem && projectsList.length > 0) {
    activeItem = JSON.parse(JSON.stringify(projectsList[0]));
    populateEditorFields(activeItem);
  }

  updateDashboardStats();
  renderRecentProjectsGrid();
  renderProjectLibraryList();
  renderExportCheckboxes();
  renderLivePreview();
}

export async function saveCurrentProject() {
  if (!activeItem) return;

  activeItem.updatedAt = new Date().toISOString();

  // Save to projectsList array
  const idx = projectsList.findIndex((p) => p.id === activeItem.id);
  if (idx >= 0) {
    projectsList[idx] = JSON.parse(JSON.stringify(activeItem));
  } else {
    projectsList.unshift(JSON.parse(JSON.stringify(activeItem)));
  }

  saveBroadcastProjectsToStorage();

  // Sync to backend API
  try {
    await fetch("/api/broadcast/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activeItem)
    });
  } catch (err) {
    console.warn("Server sync note:", err);
  }

  showToast(`Projektas „${activeItem.name || 'Baneris'}“ sėkmingai išsaugotas!`, "success");
  updateDashboardStats();
  renderRecentProjectsGrid();
  renderProjectLibraryList();
}

function saveBroadcastProjectsToStorage() {
  try {
    localStorage.setItem("azuolynas_broadcast_projects", JSON.stringify(projectsList));
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
function updateDashboardStats() {
  const statTotal = document.getElementById("bgStatTotalTemplates");
  const statProjects = document.getElementById("bgStatTotalProjects");
  const statObsLinks = document.getElementById("bgStatObsReady");

  if (statTotal) statTotal.textContent = BROADCAST_TEMPLATES.length;
  if (statProjects) statProjects.textContent = projectsList.length;
  if (statObsLinks) statObsLinks.textContent = projectsList.length;
}

function renderRecentProjectsGrid() {
  const grid = document.getElementById("bgRecentProjectsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const recent = [...projectsList].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 6);

  recent.forEach((item) => {
    const card = document.createElement("div");
    card.className = "bg-project-card";
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("lt-LT", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

    card.innerHTML = `
      <div class="bg-card-header">
        <span class="bg-card-badge">${item.badge || item.category || 'AZUOLYNAS'}</span>
        <span class="bg-card-date">${dateStr}</span>
      </div>
      <div class="bg-card-preview-thumb">
        <div class="bg-thumb-title">${item.title || item.name}</div>
        <div class="bg-thumb-sub">${item.subtitle || ''}</div>
      </div>
      <h4 class="bg-card-name">${item.name}</h4>
      <div class="bg-card-actions">
        <button type="button" class="btn-solid btn-xs" data-action="edit-proj" data-id="${item.id}">
          <span>Redaguoti</span>
        </button>
        <button type="button" class="btn-outline btn-xs" data-action="preview-proj" data-id="${item.id}">
          <span>Peržiūra</span>
        </button>
        <button type="button" class="btn-outline btn-xs" data-action="copy-obs-url" data-id="${item.id}" title="Kopijuoti OBS Browser Source nuorodą">
          <span>OBS URL</span>
        </button>
      </div>
    `;

    card.querySelector('[data-action="edit-proj"]').addEventListener("click", () => {
      selectProjectForEditing(item.id);
      switchSubtab("editor");
    });
    card.querySelector('[data-action="preview-proj"]').addEventListener("click", () => {
      selectProjectForEditing(item.id);
      switchSubtab("preview");
    });
    card.querySelector('[data-action="copy-obs-url"]').addEventListener("click", () => {
      copyObsUrlForId(item.id);
    });

    grid.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// TEMPLATE GALLERY
// ---------------------------------------------------------------------------
function initTemplateGallery() {
  const container = document.getElementById("bgTemplateGalleryGrid");
  if (!container) return;
  container.innerHTML = "";

  BROADCAST_TEMPLATES.forEach((tpl) => {
    const card = document.createElement("div");
    card.className = "bg-template-card";
    card.innerHTML = `
      <div class="bg-template-header">
        <span class="bg-template-badge">${tpl.badge || tpl.category}</span>
        <span class="bg-template-tag">${tpl.position}</span>
      </div>
      <div class="bg-template-preview-box" style="background:${tpl.bgColor}; border:1px solid ${tpl.borderColor};">
        <div style="color:${tpl.accentColor}; font-size:0.75rem; font-weight:700; margin-bottom:2px;">${tpl.badge}</div>
        <div style="color:${tpl.textColor}; font-size:1.05rem; font-weight:800; line-height:1.2;">${tpl.title}</div>
        <div style="color:${tpl.subtextColor}; font-size:0.75rem; margin-top:2px;">${tpl.subtitle}</div>
      </div>
      <h4 class="bg-template-title">${tpl.name}</h4>
      <div class="bg-template-footer">
        <button type="button" class="btn-solid btn-sm btn-full" data-action="use-template">
          <span>Pasirinkti & Redaguoti</span>
        </button>
      </div>
    `;

    card.querySelector('[data-action="use-template"]').addEventListener("click", () => {
      createProjectFromTemplate(tpl);
    });

    container.appendChild(card);
  });
}

function createProjectFromTemplate(tpl) {
  const newProj = {
    ...JSON.parse(JSON.stringify(tpl)),
    id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${tpl.name} (Naujas)`,
    updatedAt: new Date().toISOString()
  };

  projectsList.unshift(newProj);
  saveBroadcastProjectsToStorage();
  activeItem = newProj;
  populateEditorFields(activeItem);
  switchSubtab("editor");
  showToast(`Sukurtas naujas baneris pagal šabloną: „${tpl.name}“`, "success");
}

function selectProjectForEditing(id) {
  const found = projectsList.find((p) => p.id === id);
  if (found) {
    activeItem = JSON.parse(JSON.stringify(found));
    populateEditorFields(activeItem);
    renderLivePreview();
  }
}

// ---------------------------------------------------------------------------
// VISUAL EDITOR
// ---------------------------------------------------------------------------
function initVisualEditorInputs() {
  const bind = (id, prop, isNumber = false, isFloat = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", (e) => {
      if (!activeItem) return;
      if (el.type === "checkbox") {
        activeItem[prop] = el.checked;
      } else if (isFloat) {
        activeItem[prop] = parseFloat(e.target.value) || 0;
      } else if (isNumber) {
        activeItem[prop] = parseInt(e.target.value, 10) || 0;
      } else {
        activeItem[prop] = e.target.value;
      }
      renderLivePreview();
    });
  };

  // Content
  bind("bgInputProjName", "name");
  bind("bgInputTitle", "title");
  bind("bgInputSubtitle", "subtitle");
  bind("bgInputBadge", "badge");

  // Typography
  bind("bgInputFontFamily", "fontFamily");
  bind("bgInputFontSize", "fontSize", true);
  bind("bgInputFontWeight", "fontWeight", true);
  bind("bgInputLetterSpacing", "letterSpacing", false, true);
  bind("bgInputLineHeight", "lineHeight", false, true);

  // Colors
  bind("bgInputTextColor", "textColor");
  bind("bgInputAccentColor", "accentColor");
  bind("bgInputSubtextColor", "subtextColor");
  bind("bgInputBgColor", "bgColor");
  bind("bgInputBgOpacity", "bgOpacity", false, true);
  bind("bgInputBorderColor", "borderColor");
  bind("bgInputBorderWidth", "borderWidth", true);
  bind("bgInputBorderRadius", "borderRadius", true);

  // Layout & Positioning
  bind("bgInputWidth", "width", true);
  bind("bgInputPosition", "position");
  bind("bgInputOffsetX", "offsetX", true);
  bind("bgInputOffsetY", "offsetY", true);

  // Logo & Extras
  bind("bgInputShowLogo", "showLogo");
  bind("bgInputLogoUrl", "logoUrl");
  bind("bgInputLogoSize", "logoSize", true);
  bind("bgInputShowBadge", "showBadge");
  bind("bgInputShowSubtitle", "showSubtitle");
  bind("bgInputShowAccentBar", "showAccentBar");

  // Animation
  bind("bgInputAnimation", "animation");
  bind("bgInputDuration", "duration", false, true);
  bind("bgInputDelay", "delay", false, true);

  // Editor Actions
  const btnSave = document.getElementById("bgBtnSaveProject");
  if (btnSave) btnSave.addEventListener("click", saveCurrentProject);

  const btnDuplicate = document.getElementById("bgBtnDuplicateProject");
  if (btnDuplicate) {
    btnDuplicate.addEventListener("click", () => {
      if (!activeItem) return;
      const dup = {
        ...JSON.parse(JSON.stringify(activeItem)),
        id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        name: `${activeItem.name} (Kopija)`,
        updatedAt: new Date().toISOString()
      };
      projectsList.unshift(dup);
      saveBroadcastProjectsToStorage();
      activeItem = dup;
      populateEditorFields(activeItem);
      showToast("Projektas sėkmingai nukopijuotas!", "success");
      updateDashboardStats();
    });
  }

  const btnReset = document.getElementById("bgBtnResetToTemplate");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (!activeItem) return;
      const original = BROADCAST_TEMPLATES.find((t) => t.type === activeItem.type) || BROADCAST_TEMPLATES[0];
      activeItem = {
        ...JSON.parse(JSON.stringify(original)),
        id: activeItem.id,
        name: activeItem.name
      };
      populateEditorFields(activeItem);
      renderLivePreview();
      showToast("Nustatymai atstatyti į numatytąjį šabloną.", "info");
    });
  }
}

function populateEditorFields(item) {
  if (!item) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "checkbox") {
      el.checked = !!val;
    } else {
      el.value = val !== undefined ? val : "";
    }
  };

  setVal("bgInputProjName", item.name);
  setVal("bgInputTitle", item.title);
  setVal("bgInputSubtitle", item.subtitle);
  setVal("bgInputBadge", item.badge);

  setVal("bgInputFontFamily", item.fontFamily || "Inter");
  setVal("bgInputFontSize", item.fontSize || 24);
  setVal("bgInputFontWeight", item.fontWeight || 700);
  setVal("bgInputLetterSpacing", item.letterSpacing || 0.5);
  setVal("bgInputLineHeight", item.lineHeight || 1.25);

  setVal("bgInputTextColor", item.textColor || BRAND.primaryText);
  setVal("bgInputAccentColor", item.accentColor || BRAND.accentBorder);
  setVal("bgInputSubtextColor", item.subtextColor || BRAND.secondaryText);
  setVal("bgInputBgColor", item.bgColor || BRAND.bgPrimary);
  setVal("bgInputBgOpacity", item.bgOpacity !== undefined ? item.bgOpacity : 0.94);
  setVal("bgInputBorderColor", item.borderColor || BRAND.accentBorder);
  setVal("bgInputBorderWidth", item.borderWidth !== undefined ? item.borderWidth : 1);
  setVal("bgInputBorderRadius", item.borderRadius !== undefined ? item.borderRadius : 6);

  setVal("bgInputWidth", item.width || 600);
  setVal("bgInputPosition", item.position || "bottom-left");
  setVal("bgInputOffsetX", item.offsetX !== undefined ? item.offsetX : 60);
  setVal("bgInputOffsetY", item.offsetY !== undefined ? item.offsetY : 60);

  setVal("bgInputShowLogo", item.showLogo !== false);
  setVal("bgInputLogoUrl", item.logoUrl || BRAND.logoUrl);
  setVal("bgInputLogoSize", item.logoSize || 52);
  setVal("bgInputShowBadge", item.showBadge !== false);
  setVal("bgInputShowSubtitle", item.showSubtitle !== false);
  setVal("bgInputShowAccentBar", item.showAccentBar !== false);

  setVal("bgInputAnimation", item.animation || "slide-up");
  setVal("bgInputDuration", item.duration !== undefined ? item.duration : 0.6);
  setVal("bgInputDelay", item.delay !== undefined ? item.delay : 0);
}

// ---------------------------------------------------------------------------
// LIVE PREVIEW ENGINE (1920x1080 Viewport)
// ---------------------------------------------------------------------------
function initPreviewControls() {
  const zoomBtns = document.querySelectorAll("[data-bg-zoom]");
  zoomBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const z = parseFloat(btn.dataset.bgZoom);
      setPreviewZoom(z);
      zoomBtns.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  const btnCheckerboard = document.getElementById("bgBtnToggleCheckerboard");
  if (btnCheckerboard) {
    btnCheckerboard.addEventListener("click", () => {
      isCheckerboardBg = !isCheckerboardBg;
      btnCheckerboard.classList.toggle("active", isCheckerboardBg);
      const stage = document.getElementById("bgPreviewStage");
      if (stage) stage.classList.toggle("checkerboard-bg", isCheckerboardBg);
    });
  }

  const btnReplay = document.getElementById("bgBtnReplayAnim");
  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      renderLivePreview(true);
    });
  }

  const btnCopyObs = document.getElementById("bgBtnCopyObsUrl");
  if (btnCopyObs) {
    btnCopyObs.addEventListener("click", () => {
      if (!activeItem) return;
      copyObsUrlForId(activeItem.id);
    });
  }

  const btnOpenObs = document.getElementById("bgBtnOpenObsNewTab");
  if (btnOpenObs) {
    btnOpenObs.addEventListener("click", () => {
      if (!activeItem) return;
      window.open(`/api/broadcast/overlay/${activeItem.id}`, "_blank");
    });
  }
}

function setPreviewZoom(z) {
  previewZoom = z;
  const stage = document.getElementById("bgPreviewStage");
  if (stage) {
    stage.style.transform = `scale(${previewZoom})`;
  }
  const lbl = document.getElementById("bgPreviewZoomLabel");
  if (lbl) lbl.textContent = `${Math.round(previewZoom * 100)}%`;
}

function renderLivePreview(forceReplay = false) {
  const container = document.getElementById("bgPreviewBannerContainer");
  if (!container || !activeItem) return;

  const item = activeItem;
  const pos = item.position || "bottom-left";
  const ox = item.offsetX !== undefined ? item.offsetX : 60;
  const oy = item.offsetY !== undefined ? item.offsetY : 60;
  const w = item.width || 600;
  const radius = item.borderRadius !== undefined ? item.borderRadius : 6;
  const bwidth = item.borderWidth !== undefined ? item.borderWidth : 1;
  const bcolor = item.borderColor || BRAND.accentBorder;
  const textColor = item.textColor || BRAND.primaryText;
  const accentColor = item.accentColor || BRAND.accentBorder;
  const subColor = item.subtextColor || BRAND.secondaryText;
  const fontSize = item.fontSize || 24;
  const fontWeight = item.fontWeight || 700;
  const fontFam = item.fontFamily || "Inter";
  const anim = item.animation || "slide-up";
  const dur = item.duration || 0.6;
  const del = item.delay || 0;

  let r = 10, g = 34, b = 29;
  if (item.bgColor && item.bgColor.startsWith("#") && item.bgColor.length >= 7) {
    r = parseInt(item.bgColor.slice(1, 3), 16) || 10;
    g = parseInt(item.bgColor.slice(3, 5), 16) || 34;
    b = parseInt(item.bgColor.slice(5, 7), 16) || 29;
  }
  const bgOpacity = item.bgOpacity !== undefined ? item.bgOpacity : 0.94;
  const rgbaBg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;

  let posStyle = "";
  if (pos === "bottom-left") posStyle = `bottom:${oy}px; left:${ox}px;`;
  else if (pos === "bottom-center") posStyle = `bottom:${oy}px; left:50%; transform:translateX(-50%);`;
  else if (pos === "bottom-right") posStyle = `bottom:${oy}px; right:${ox}px;`;
  else if (pos === "top-left") posStyle = `top:${oy}px; left:${ox}px;`;
  else if (pos === "top-center") posStyle = `top:${oy}px; left:50%; transform:translateX(-50%);`;
  else if (pos === "top-right") posStyle = `top:${oy}px; right:${ox}px;`;
  else if (pos === "center") posStyle = `top:50%; left:50%; transform:translate(-50%, -50%);`;

  container.innerHTML = `
    <div class="bg-rendered-banner ${forceReplay ? 'anim-replay' : ''}" style="
      ${posStyle}
      width: ${w}px;
      background: ${rgbaBg};
      border: ${bwidth}px solid ${bcolor};
      border-radius: ${radius}px;
      font-family: '${fontFam}', sans-serif;
      animation: anim-${anim} ${dur}s cubic-bezier(0.16, 1, 0.3, 1) ${del}s both;
    ">
      ${item.showAccentBar !== false ? `<div class="bg-banner-accent-bar" style="background:${accentColor};"></div>` : ''}
      ${item.showLogo !== false ? `<img src="${item.logoUrl || BRAND.logoUrl}" class="bg-banner-logo" style="width:${item.logoSize || 52}px; height:${item.logoSize || 52}px;" alt="Logo" onerror="this.style.display='none';">` : ''}
      <div class="bg-banner-body">
        ${item.showBadge !== false && item.badge ? `
          <div class="bg-banner-badge-row">
            <span class="bg-banner-badge" style="border-color:${accentColor}; color:${accentColor};">
              ${item.type === 'live' ? '<span class="bg-live-dot"></span>' : ''}
              ${item.badge}
            </span>
          </div>` : ''}
        <div class="bg-banner-title" style="color:${textColor}; font-size:${fontSize}px; font-weight:${fontWeight}; letter-spacing:${item.letterSpacing || 0.5}px; line-height:${item.lineHeight || 1.25};">
          ${item.title || 'AZUOLYNAS'}
        </div>
        ${item.showSubtitle !== false && item.subtitle ? `
          <div class="bg-banner-sub" style="color:${subColor}; font-size:${Math.max(13, Math.round(fontSize * 0.58))}px;">
            ${item.subtitle}
          </div>` : ''}
        ${item.type === 'countdown' ? `
          <div class="bg-countdown-digits" style="color:${accentColor}; font-size:${Math.round(fontSize * 1.6)}px;">
            <span id="previewCountdownText">05:00</span>
          </div>` : ''}
      </div>
    </div>
  `;

  // Update OBS URL label
  const obsUrlInput = document.getElementById("bgObsUrlDisplay");
  if (obsUrlInput) {
    const origin = window.location.origin;
    obsUrlInput.value = `${origin}/api/broadcast/overlay/${item.id}`;
  }
}

function copyObsUrlForId(id) {
  const origin = window.location.origin;
  const url = `${origin}/api/broadcast/overlay/${id}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast("OBS Browser Source nuoroda nukopijuota į iškarpinę!", "success");
  }).catch(() => {
    showToast(`OBS Nuoroda: ${url}`, "info");
  });
}

// ---------------------------------------------------------------------------
// COUNTDOWN TIMER DEDICATED EDITOR
// ---------------------------------------------------------------------------
function initCountdownEditor() {
  const btnStart = document.getElementById("bgBtnCountdownStart");
  const btnPause = document.getElementById("bgBtnCountdownPause");
  const btnReset = document.getElementById("bgBtnCountdownReset");
  const minInput = document.getElementById("bgInputCountdownMins");
  const secInput = document.getElementById("bgInputCountdownSecs");
  const finishInput = document.getElementById("bgInputCountdownFinishMsg");

  // Preset buttons (05:00, 10:00, 15:00, 01:00)
  document.querySelectorAll("[data-countdown-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mins = parseInt(btn.dataset.countdownPreset, 10) || 5;
      if (minInput) minInput.value = mins;
      if (secInput) secInput.value = 0;
      countdownRemainingSeconds = mins * 60;
      updateCountdownDisplay();
    });
  });

  if (btnStart) {
    btnStart.addEventListener("click", () => {
      if (countdownTimerRunning) return;
      countdownTimerRunning = true;
      if (countdownRemainingSeconds <= 0) {
        const m = parseInt(minInput ? minInput.value : 5, 10) || 5;
        const s = parseInt(secInput ? secInput.value : 0, 10) || 0;
        countdownRemainingSeconds = (m * 60) + s;
      }
      countdownTimerInterval = setInterval(() => {
        if (countdownRemainingSeconds > 0) {
          countdownRemainingSeconds--;
          updateCountdownDisplay();
        } else {
          clearInterval(countdownTimerInterval);
          countdownTimerRunning = false;
          showToast(finishInput ? finishInput.value : "FESTIVALIS PRASIDEDA!", "success");
        }
      }, 1000);
      showToast("Atbulinės atskaitos laikmatis paleistas!");
    });
  }

  if (btnPause) {
    btnPause.addEventListener("click", () => {
      countdownTimerRunning = false;
      if (countdownTimerInterval) clearInterval(countdownTimerInterval);
      showToast("Laikmatis pristabdytas.");
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      countdownTimerRunning = false;
      if (countdownTimerInterval) clearInterval(countdownTimerInterval);
      const m = parseInt(minInput ? minInput.value : 5, 10) || 5;
      const s = parseInt(secInput ? secInput.value : 0, 10) || 0;
      countdownRemainingSeconds = (m * 60) + s;
      updateCountdownDisplay();
      showToast("Laikmatis atstatytas.");
    });
  }

  const btnApplyToActive = document.getElementById("bgBtnApplyCountdownToActive");
  if (btnApplyToActive) {
    btnApplyToActive.addEventListener("click", () => {
      if (!activeItem) return;
      activeItem.type = "countdown";
      activeItem.timerMinutes = parseInt(minInput ? minInput.value : 5, 10) || 5;
      activeItem.timerSeconds = parseInt(secInput ? secInput.value : 0, 10) || 0;
      activeItem.timerFinishMsg = finishInput ? finishInput.value : "FESTIVALIS PRASIDEDA!";
      activeItem.title = "TRANSLIACIJOS PRADŽIA PO:";
      activeItem.badge = "LAIKMATIS";
      populateEditorFields(activeItem);
      renderLivePreview();
      showToast("Laikmatis sėkmingai pritaikytas aktyviam baneriui!", "success");
    });
  }
}

function updateCountdownDisplay() {
  const display = document.getElementById("bgCountdownDisplayLarge");
  const prevDisplay = document.getElementById("previewCountdownText");
  const m = Math.floor(countdownRemainingSeconds / 60);
  const s = countdownRemainingSeconds % 60;
  const timeStr = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  if (display) display.textContent = timeStr;
  if (prevDisplay) prevDisplay.textContent = timeStr;
}

// ---------------------------------------------------------------------------
// NOTICE & ERROR TEMPLATES
// ---------------------------------------------------------------------------
function initNoticeTemplates() {
  const templates = [
    {
      title: "ĮVYKO TECHNINĖ KLAIDA",
      sub: "Atsiprašome už nepatogumus. Problema sprendžiama.",
      badge: "KLAIDA",
      accent: "#ef4444"
    },
    {
      title: "NETRUKUS TĘSIME TRANSLIACIJĄ",
      sub: "Signalizavimo ir vaizdo atnaujinimas. Ačiū už kantrybę.",
      badge: "PAUZA",
      accent: "#D4AF37"
    },
    {
      title: "SIGNALAS LAIKINAI NEPASIEKIAMAS",
      sub: "Ryšys su transliacijos pultu atstatomas.",
      badge: "RYŠIO KLAIDA",
      accent: "#ef4444"
    },
    {
      title: "AČIŪ, KAD LAUKIATE",
      sub: "Ąžuolyno filmų festivalio ceremonija netrukus bus tęsiama.",
      badge: "INFORMACIJA",
      accent: "#6FA58A"
    }
  ];

  const container = document.getElementById("bgNoticeTemplatesList");
  if (!container) return;
  container.innerHTML = "";

  templates.forEach((t) => {
    const item = document.createElement("div");
    item.className = "bg-notice-preset-card";
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span class="bg-banner-badge" style="border-color:${t.accent}; color:${t.accent};">${t.badge}</span>
      </div>
      <h4 style="margin:0 0 4px 0; color:#F1F3EE; font-size:1rem;">${t.title}</h4>
      <p style="margin:0 0 12px 0; color:#9BC4AE; font-size:0.82rem;">${t.sub}</p>
      <button type="button" class="btn-solid btn-xs btn-full" data-action="apply-notice">
        <span>Taikyti Šį Pranešimą</span>
      </button>
    `;

    item.querySelector('[data-action="apply-notice"]').addEventListener("click", () => {
      if (!activeItem) return;
      activeItem.type = "notice";
      activeItem.title = t.title;
      activeItem.subtitle = t.sub;
      activeItem.badge = t.badge;
      activeItem.accentColor = t.accent;
      activeItem.position = "bottom-center";
      populateEditorFields(activeItem);
      renderLivePreview();
      showToast(`Pritaikytas pranešimas: „${t.title}“`, "success");
      switchSubtab("editor");
    });

    container.appendChild(item);
  });
}

// ---------------------------------------------------------------------------
// CODE EDITOR (HTML, CSS, JS)
// ---------------------------------------------------------------------------
function initCodeEditor() {
  const tabs = document.querySelectorAll(".bg-code-tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.lang;
      document.querySelectorAll(".bg-code-area").forEach((a) => {
        a.classList.toggle("d-none", a.id !== `bgCode_${target}`);
      });
    });
  });

  const btnPreview = document.getElementById("bgBtnCodePreview");
  if (btnPreview) {
    btnPreview.addEventListener("click", () => {
      readCodeEditorValues();
      renderCustomCodeInPreview();
      showToast("Kodo peržiūra atnaujinta tiesioginiame lange.");
    });
  }

  const btnSaveCode = document.getElementById("bgBtnCodeSave");
  if (btnSaveCode) {
    btnSaveCode.addEventListener("click", () => {
      readCodeEditorValues();
      // Record version in history
      codeEditorRevisions.unshift({
        timestamp: new Date().toISOString(),
        html: customHtmlCode,
        css: customCssCode,
        js: customJsCode
      });
      renderRevisionsList();
      showToast("Kodo pakeitimai sėkmingai išsaugoti!", "success");
    });
  }

  const btnRestore = document.getElementById("bgBtnCodeRestore");
  if (btnRestore) {
    btnRestore.addEventListener("click", () => {
      const modal = document.getElementById("bgRevisionsModal");
      if (modal) modal.classList.add("active");
    });
  }

  const modalClose = document.getElementById("bgRevisionsModalClose");
  if (modalClose) {
    modalClose.addEventListener("click", () => {
      const modal = document.getElementById("bgRevisionsModal");
      if (modal) modal.classList.remove("active");
    });
  }
}

function syncActiveItemToCodeEditor() {
  if (!activeItem) return;

  const item = activeItem;
  customHtmlCode = `<div class="azuolynas-overlay-banner" id="broadcastBanner">
  <div class="banner-accent-bar"></div>
  ${item.showLogo !== false ? `<img src="${item.logoUrl || BRAND.logoUrl}" alt="Logo" class="banner-logo">` : ''}
  <div class="banner-body">
    ${item.badge ? `<div class="banner-badge-row"><span class="banner-badge">${item.badge}</span></div>` : ''}
    <div class="banner-title">${item.title || 'AZUOLYNAS'}</div>
    ${item.subtitle ? `<div class="banner-subtitle">${item.subtitle}</div>` : ''}
  </div>
</div>`;

  customCssCode = `/* AZUOLYNAS Broadcast Custom CSS */
.azuolynas-overlay-banner {
  background: ${item.bgColor || BRAND.bgPrimary};
  border: ${item.borderWidth || 1}px solid ${item.borderColor || BRAND.accentBorder};
  border-radius: ${item.borderRadius || 6}px;
  color: ${item.textColor || BRAND.primaryText};
  padding: 18px 24px;
}
.banner-title {
  font-family: '${item.fontFamily || BRAND.font}', sans-serif;
  font-size: ${item.fontSize || 24}px;
  font-weight: ${item.fontWeight || 700};
}`;

  customJsCode = `// AZUOLYNAS Broadcast Custom JS
console.log("AZUOLYNAS Broadcast Overlay Loaded");
window.addEventListener("message", (e) => {
  // Remote trigger handler
});`;

  const htmlArea = document.getElementById("bgCode_html");
  const cssArea = document.getElementById("bgCode_css");
  const jsArea = document.getElementById("bgCode_js");

  if (htmlArea) htmlArea.value = customHtmlCode;
  if (cssArea) cssArea.value = customCssCode;
  if (jsArea) jsArea.value = customJsCode;
}

function readCodeEditorValues() {
  const htmlArea = document.getElementById("bgCode_html");
  const cssArea = document.getElementById("bgCode_css");
  const jsArea = document.getElementById("bgCode_js");

  if (htmlArea) customHtmlCode = htmlArea.value;
  if (cssArea) customCssCode = cssArea.value;
  if (jsArea) customJsCode = jsArea.value;
}

function renderCustomCodeInPreview() {
  const container = document.getElementById("bgPreviewBannerContainer");
  if (!container) return;

  container.innerHTML = `
    <style>${customCssCode}</style>
    ${customHtmlCode}
  `;
}

function renderRevisionsList() {
  const list = document.getElementById("bgRevisionsList");
  if (!list) return;
  list.innerHTML = "";

  if (codeEditorRevisions.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">Ankstesnių išsaugotų versijų dar nėra.</p>`;
    return;
  }

  codeEditorRevisions.forEach((rev, idx) => {
    const item = document.createElement("div");
    item.className = "bg-revision-item";
    const dateStr = new Date(rev.timestamp).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    item.innerHTML = `
      <div>
        <strong>Versija #${codeEditorRevisions.length - idx}</strong>
        <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px;">${dateStr}</span>
      </div>
      <button type="button" class="btn-solid btn-xs" data-rev-idx="${idx}">Atkurti</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      customHtmlCode = rev.html;
      customCssCode = rev.css;
      customJsCode = rev.js;
      const htmlArea = document.getElementById("bgCode_html");
      const cssArea = document.getElementById("bgCode_css");
      const jsArea = document.getElementById("bgCode_js");
      if (htmlArea) htmlArea.value = customHtmlCode;
      if (cssArea) cssArea.value = customCssCode;
      if (jsArea) jsArea.value = customJsCode;

      const modal = document.getElementById("bgRevisionsModal");
      if (modal) modal.classList.remove("active");
      showToast(`Versija #${codeEditorRevisions.length - idx} sėkmingai atkurta!`, "success");
    });
    list.appendChild(item);
  });
}

// ---------------------------------------------------------------------------
// EXPORTING: STANDALONE HTML & ZIP PACKAGES
// ---------------------------------------------------------------------------
function initExportHandlers() {
  const btnExportSingle = document.getElementById("bgBtnExportSingleHtml");
  if (btnExportSingle) {
    btnExportSingle.addEventListener("click", exportSingleHtmlFile);
  }

  const btnExportZip = document.getElementById("bgBtnExportZipPackage");
  if (btnExportZip) {
    btnExportZip.addEventListener("click", exportZipPackage);
  }

  const selectAll = document.getElementById("bgExportSelectAll");
  if (selectAll) {
    selectAll.addEventListener("change", (e) => {
      document.querySelectorAll(".bg-export-checkbox").forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });
  }
}

function renderExportCheckboxes() {
  const container = document.getElementById("bgExportCheckboxesContainer");
  if (!container) return;
  container.innerHTML = "";

  projectsList.forEach((item) => {
    const label = document.createElement("label");
    label.className = "bg-export-checkbox-row";
    label.innerHTML = `
      <input type="checkbox" class="bg-export-checkbox" value="${item.id}" checked>
      <span><strong>${item.name}</strong> <small style="color:var(--accent-light);">(${item.type})</small></span>
    `;
    container.appendChild(label);
  });
}

export function buildStandaloneHtmlString(item) {
  const title = item.title || "AZUOLYNAS FEST";
  const subtitle = item.subtitle || "";
  const badge = item.badge || "";
  const position = item.position || "bottom-left";
  const offsetX = item.offsetX !== undefined ? item.offsetX : 60;
  const offsetY = item.offsetY !== undefined ? item.offsetY : 60;
  const width = item.width || 600;
  const bgColor = item.bgColor || BRAND.bgPrimary;
  const bgOpacity = item.bgOpacity !== undefined ? item.bgOpacity : 0.94;
  const borderColor = item.borderColor || BRAND.accentBorder;
  const borderWidth = item.borderWidth !== undefined ? item.borderWidth : 1;
  const borderRadius = item.borderRadius !== undefined ? item.borderRadius : 6;
  const textColor = item.textColor || BRAND.primaryText;
  const accentColor = item.accentColor || BRAND.accentBorder;
  const subtextColor = item.subtextColor || BRAND.secondaryText;
  const fontFamily = item.fontFamily || "Inter";
  const fontSize = item.fontSize || 24;
  const fontWeight = item.fontWeight || 700;
  const animation = item.animation || "slide-up";
  const duration = item.duration || 0.6;
  const delay = item.delay || 0;
  const showLogo = item.showLogo !== false;
  const logoUrl = item.logoUrl || BRAND.logoUrl;
  const logoSize = item.logoSize || 52;
  const isCountdown = item.type === "countdown";
  const timerMins = item.timerMinutes || 5;
  const timerSecs = item.timerSeconds || 0;
  const timerFinishMsg = item.timerFinishMsg || "FESTIVALIS PRASIDEDA!";

  let posStyle = "";
  if (position === "bottom-left") posStyle = `bottom: ${offsetY}px; left: ${offsetX}px;`;
  else if (position === "bottom-center") posStyle = `bottom: ${offsetY}px; left: 50%; transform: translateX(-50%);`;
  else if (position === "bottom-right") posStyle = `bottom: ${offsetY}px; right: ${offsetX}px;`;
  else if (position === "top-left") posStyle = `top: ${offsetY}px; left: ${offsetX}px;`;
  else if (position === "top-center") posStyle = `top: ${offsetY}px; left: 50%; transform: translateX(-50%);`;
  else if (position === "top-right") posStyle = `top: ${offsetY}px; right: ${offsetX}px;`;
  else if (position === "center") posStyle = `top: 50%; left: 50%; transform: translate(-50%, -50%);`;

  let r = 10, g = 34, b = 29;
  if (bgColor.startsWith("#") && bgColor.length >= 7) {
    r = parseInt(bgColor.slice(1, 3), 16) || 10;
    g = parseInt(bgColor.slice(3, 5), 16) || 34;
    b = parseInt(bgColor.slice(5, 7), 16) || 29;
  }
  const rgbaBg = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;

  return `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1920, height=1080, initial-scale=1.0">
  <title>${item.name || 'OBS Overlay'} | AZUOLYNAS Broadcast</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body, html {
      width: 1920px;
      height: 1080px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent !important;
      font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .broadcast-stage {
      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      pointer-events: none;
    }
    .azuolynas-overlay-banner {
      position: absolute;
      ${posStyle}
      width: ${width}px;
      max-width: calc(100% - 60px);
      background: ${rgbaBg};
      border: ${borderWidth}px solid ${borderColor};
      border-radius: ${borderRadius}px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      gap: 18px;
      color: ${textColor};
      animation: anim-${animation} ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both;
      pointer-events: auto;
    }
    .banner-logo {
      width: ${logoSize}px;
      height: ${logoSize}px;
      object-fit: contain;
      flex-shrink: 0;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
    }
    .banner-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .banner-badge-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    .banner-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 4px;
      background: rgba(111, 165, 138, 0.2);
      border: 1px solid ${accentColor};
      color: ${accentColor};
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
      animation: pulse-live 1.2s infinite ease-in-out;
    }
    @keyframes pulse-live {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .banner-title {
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      line-height: 1.2;
      color: ${textColor};
      letter-spacing: 0.02em;
      text-transform: uppercase;
      word-break: break-word;
    }
    .banner-subtitle {
      font-size: ${Math.max(13, Math.round(fontSize * 0.58))}px;
      color: ${subtextColor};
      line-height: 1.35;
      font-weight: 500;
    }
    .banner-accent-bar {
      position: absolute;
      left: 0;
      top: 10px;
      bottom: 10px;
      width: 3px;
      background: ${accentColor};
      border-radius: 2px;
    }
    .countdown-display {
      font-family: 'Inter', monospace;
      font-size: ${Math.round(fontSize * 1.6)}px;
      font-weight: 900;
      letter-spacing: 0.05em;
      color: ${accentColor};
      text-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
      margin: 8px 0;
      display: inline-block;
    }
    .countdown-controls {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }
    .countdown-btn {
      background: rgba(111, 165, 138, 0.25);
      border: 1px solid ${accentColor};
      color: ${textColor};
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    /* Animations */
    @keyframes anim-slide-up {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes anim-slide-left {
      from { opacity: 0; transform: translateX(-40px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes anim-slide-right {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes anim-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes anim-scale {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes anim-cinematic {
      0% { opacity: 0; transform: translateY(20px) scale(0.96); filter: blur(6px); }
      100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
    }
  </style>
</head>
<body>
  <div class="broadcast-stage">
    <div class="azuolynas-overlay-banner" id="broadcastBanner">
      <div class="banner-accent-bar"></div>
      ${showLogo ? `<img src="${logoUrl}" alt="AZUOLYNAS" class="banner-logo" onerror="this.style.display='none';">` : ''}
      <div class="banner-body">
        ${badge ? `
        <div class="banner-badge-row">
          <span class="banner-badge">
            ${item.type === 'live' ? '<span class="live-dot"></span>' : ''}
            ${badge}
          </span>
        </div>` : ''}
        <div class="banner-title" id="bannerTitle">${title}</div>
        ${subtitle ? `<div class="banner-subtitle" id="bannerSubtitle">${subtitle}</div>` : ''}
        ${isCountdown ? `
        <div>
          <div class="countdown-display" id="countdownNumbers">--:--</div>
          ${item.interactive ? `
          <div class="countdown-controls">
            <button class="countdown-btn" onclick="startTimer()">Start</button>
            <button class="countdown-btn" onclick="pauseTimer()">Pause</button>
            <button class="countdown-btn" onclick="resetTimer()">Reset</button>
          </div>` : ''}
        </div>` : ''}
      </div>
    </div>
  </div>

  <script>
    ${isCountdown ? `
    let totalSeconds = (${timerMins} * 60) + ${timerSecs};
    const initialSeconds = totalSeconds;
    let timerInterval = null;
    let isRunning = true;

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function updateTimerUI() {
      const el = document.getElementById('countdownNumbers');
      if (!el) return;
      if (totalSeconds <= 0) {
        el.textContent = "00:00";
        const sub = document.getElementById('bannerSubtitle');
        if (sub) sub.textContent = "${timerFinishMsg.replace(/"/g, '\\"')}";
        clearInterval(timerInterval);
        return;
      }
      el.textContent = formatTime(totalSeconds);
    }

    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      isRunning = true;
      timerInterval = setInterval(() => {
        if (totalSeconds > 0) {
          totalSeconds--;
          updateTimerUI();
        } else {
          clearInterval(timerInterval);
        }
      }, 1000);
    }

    function pauseTimer() {
      isRunning = false;
      if (timerInterval) clearInterval(timerInterval);
    }

    function resetTimer() {
      pauseTimer();
      totalSeconds = initialSeconds;
      updateTimerUI();
    }

    updateTimerUI();
    startTimer();
    ` : ''}

    window.addEventListener('message', (e) => {
      try {
        const msg = (typeof e.data === 'string') ? JSON.parse(e.data) : e.data;
        if (!msg) return;
        if (msg.action === 'UPDATE_TEXT') {
          if (msg.title) document.getElementById('bannerTitle').textContent = msg.title;
          if (msg.subtitle) {
            const sub = document.getElementById('bannerSubtitle');
            if (sub) sub.textContent = msg.subtitle;
          }
        } else if (msg.action === 'HIDE') {
          const banner = document.getElementById('broadcastBanner');
          if (banner) banner.style.opacity = '0';
        } else if (msg.action === 'SHOW') {
          const banner = document.getElementById('broadcastBanner');
          if (banner) banner.style.opacity = '1';
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;
}

function exportSingleHtmlFile() {
  if (!activeItem) {
    showToast("Nėra pasirinkto aktyvaus banerio!", "error");
    return;
  }

  const htmlContent = buildStandaloneHtmlString(activeItem);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const filename = `azuolynas_${activeItem.type || 'overlay'}.html`;

  downloadBlob(blob, filename);
  showToast(`Failas „${filename}“ sėkmingai sugeneruotas ir atsisiųstas!`, "success");
}

async function exportZipPackage() {
  const selectedCbs = document.querySelectorAll(".bg-export-checkbox:checked");
  if (selectedCbs.length === 0) {
    showToast("Pasirinkite bent vieną banerį archyvo eksportui!", "error");
    return;
  }

  const JSZipLib = window.JSZip || (typeof JSZip !== "undefined" ? JSZip : null);
  if (!JSZipLib) {
    showToast("JSZip biblioteka kraunama, bandykite dar kartą...", "info");
    await loadJSZipDynamically();
  }

  const zip = new (window.JSZip || JSZip)();
  const selectedIds = Array.from(selectedCbs).map((cb) => cb.value);
  const itemsToInclude = projectsList.filter((p) => selectedIds.includes(p.id));

  // 1. overlays folder
  const overlaysFolder = zip.folder("overlays");
  itemsToInclude.forEach((item) => {
    const html = buildStandaloneHtmlString(item);
    const fname = `${item.type || item.id}.html`;
    overlaysFolder.file(fname, html);
  });

  // 2. index.html showcase
  const indexHtml = generatePackIndexHtml(itemsToInclude);
  zip.file("index.html", indexHtml);

  // 3. README.txt
  const readmeText = `AZUOLYNAS BROADCAST GRAPHICS PACK
==================================================
Ąžuolyno Tarptautinis Mokinių Filmų Festivalis
Profesionalūs animuoti HTML grafikos elementai (OBS Studio & H2R Graphics)

TURINYS ARCHYVE:
--------------------------------------------------
1. index.html - Pradinis puslapis su visų banerių peržiūros sąrašu
2. overlays/ - Atskiri savarankiški HTML grafikos failai (1920x1080)
   - overlays/junior-category.html
   - overlays/senior-category.html
   - overlays/place-1.html
   - overlays/place-2.html
   - overlays/place-3.html
   - overlays/countdown.html
   - overlays/live.html
   - overlays/film-title.html
   - overlays/participant.html
   - overlays/intro.html
   - overlays/outro.html
   - overlays/notice.html
   - overlays/custom.html
3. README.txt - Ši instrukcija

NAUDOJIMAS OBS STUDIO:
--------------------------------------------------
1. Atidarykite OBS Studio programą.
2. Šaltinių (Sources) sąraše paspauskite „+“ ir pasirinkite „Browser“ (Naršyklė).
3. Įveskite šaltinio pavadinimą (pvz. „Azuolynas Lower Third“).
4. Pažymėkite varnele „Local file“ (Vietinis failas) ir nurodykite norimą failą iš „overlays/“ aplanko.
   (ARBA naudokite tiesioginį URL iš festivalio administratoriaus panelės).
5. Nustatykite matmenis:
   - Width (Plotis): 1920
   - Height (Aukštis): 1080
6. Pažymėkite varneles:
   - „Shutdown source when not visible“ (Išjungti šaltinį kai nematomas)
   - „Refresh browser when scene becomes active“ (Atnaujinti perjungus sceną)
7. Paspauskite „OK“. Grafika bus rodoma su permatomu fonu ir sklandžia animacija!

NAUDOJIMAS H2R GRAPHICS:
--------------------------------------------------
1. Paleiskite H2R Graphics.
2. Pridėkite naują „Custom HTML“ elementą.
3. Įkelkite atitinkamo overlay failo turinį arba nurodykite jo vietinį kelią / URL.
4. Nustatykite skiriamąją gebą 1920x1080.

OFICIALUS PREKĖS ŽENKLAS:
- Pavadinimas: AZUOLYNAS
- Šriftas: Inter
- Spalvų paletė: #0A221D, #113939, #6FA58A, #9BC4AE, #F1F3EE, #D4AF37
- Logotipas: https://i.postimg.cc/GpCY4wPT/Logo-film-fest.webp
`;
  zip.file("README.txt", readmeText);

  // Generate ZIP
  showToast("Generuojamas AZUOLYNAS_BROADCAST_PACK.zip archyvas...");
  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, "AZUOLYNAS_BROADCAST_PACK.zip");
    showToast("AZUOLYNAS_BROADCAST_PACK.zip sėkmingai sugeneruotas ir atsisiųstas!", "success");
  } catch (err) {
    showToast("Klaida kuriant ZIP archyvą: " + err.message, "error");
  }
}

function generatePackIndexHtml(items) {
  return `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AZUOLYNAS Broadcast Pack | Apžvalga</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      background: #0A221D;
      color: #F1F3EE;
      font-family: 'Inter', sans-serif;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    header {
      border-bottom: 1px solid #6FA58A;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 {
      color: #F1F3EE;
      margin: 0 0 8px 0;
      font-size: 2rem;
    }
    p {
      color: #9BC4AE;
      margin: 0;
      line-height: 1.6;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .card {
      background: #113939;
      border: 1px solid #6FA58A;
      border-radius: 6px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #D4AF37;
      text-transform: uppercase;
      margin-bottom: 8px;
      display: inline-block;
    }
    h3 {
      margin: 0 0 6px 0;
      font-size: 1.15rem;
      color: #F1F3EE;
    }
    .sub {
      font-size: 0.85rem;
      color: #9BC4AE;
      margin-bottom: 18px;
    }
    .btn {
      display: inline-block;
      background: #6FA58A;
      color: #0A221D;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.85rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Ąžuolynas Broadcast Graphics Pack</h1>
      <p>Oficialūs transliacijos grafikos elementai OBS Studio Browser Source ir H2R Graphics sistemoms.</p>
    </header>
    <div class="grid">
      ${items.map(it => `
        <div class="card">
          <div>
            <span class="badge">${it.badge || it.category || 'AZUOLYNAS'}</span>
            <h3>${it.name}</h3>
            <div class="sub">${it.subtitle || ''}</div>
          </div>
          <a href="overlays/${it.type || it.id}.html" target="_blank" class="btn">Atverti Overlay (1920x1080)</a>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadJSZipDynamically() {
  if (window.JSZip) return;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "/js/vendor/jszip.min.js";
    s.onload = () => resolve();
    s.onerror = () => {
      // CDN fallback
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s2.onload = () => resolve();
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  });
}

// ---------------------------------------------------------------------------
// PROJECT LIBRARY
// ---------------------------------------------------------------------------
function initProjectLibraryControls() {
  const btnExportJson = document.getElementById("bgBtnExportLibraryJson");
  if (btnExportJson) {
    btnExportJson.addEventListener("click", () => {
      const jsonStr = JSON.stringify(projectsList, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      downloadBlob(blob, "azuolynas_broadcast_projects.json");
      showToast("Projektų biblioteka eksportuota JSON formatu!");
    });
  }

  const fileInput = document.getElementById("bgFileInputImportJson");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed) && parsed.length > 0) {
            projectsList = parsed;
            saveBroadcastProjectsToStorage();
            renderProjectLibraryList();
            renderRecentProjectsGrid();
            renderExportCheckboxes();
            showToast(`Sėkmingai importuota ${parsed.length} projektų!`, "success");
          } else {
            showToast("Neteisingas JSON failo formatas.", "error");
          }
        } catch (err) {
          showToast("Klaida skaitant JSON failą: " + err.message, "error");
        }
      };
      reader.readAsText(file);
    });
  }
}

function renderProjectLibraryList() {
  const container = document.getElementById("bgProjectLibraryList");
  if (!container) return;
  container.innerHTML = "";

  if (projectsList.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); padding:16px;">Išsaugotų projektų bibliotekoje nėra.</p>`;
    return;
  }

  projectsList.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bg-library-row";
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("lt-LT", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

    row.innerHTML = `
      <div class="bg-library-info">
        <strong>${item.name}</strong>
        <span class="bg-library-meta">${item.badge || item.category || 'AZUOLYNAS'} &bull; Atnaujinta: ${dateStr}</span>
      </div>
      <div class="bg-library-actions">
        <button type="button" class="btn-solid btn-xs" data-action="load">Redaguoti</button>
        <button type="button" class="btn-outline btn-xs" data-action="obs">OBS URL</button>
        <button type="button" class="btn-delete btn-xs" data-action="del">Trinti</button>
      </div>
    `;

    row.querySelector('[data-action="load"]').addEventListener("click", () => {
      selectProjectForEditing(item.id);
      switchSubtab("editor");
    });
    row.querySelector('[data-action="obs"]').addEventListener("click", () => {
      copyObsUrlForId(item.id);
    });
    row.querySelector('[data-action="del"]').addEventListener("click", () => {
      deleteProjectById(item.id);
    });

    container.appendChild(row);
  });
}

function deleteProjectById(id) {
  if (!confirm("Ar tikrai norite ištrinti šį transliacijos banerio projektą?")) return;

  projectsList = projectsList.filter((p) => p.id !== id);
  saveBroadcastProjectsToStorage();

  // Also call backend delete API
  fetch(`/api/broadcast/projects/${id}`, { method: "DELETE" }).catch(() => {});

  if (activeItem && activeItem.id === id) {
    activeItem = projectsList[0] || null;
    if (activeItem) populateEditorFields(activeItem);
  }

  updateDashboardStats();
  renderRecentProjectsGrid();
  renderProjectLibraryList();
  renderExportCheckboxes();
  renderLivePreview();
  showToast("Projektas sėkmingai pašalintas.", "info");
}
