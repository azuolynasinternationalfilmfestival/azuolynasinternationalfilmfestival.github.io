/**
 * editions.js
 * Festival Annual Editions Management with Bilingual (LT/EN) Support & 2027 Edition Tools
 * Ąžuolynas International Film Festival
 */

import { db } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

let allEditionsList = [];
let unsubscribeEditions = null;

const DEFAULT_2027_EDITION = {
  year: "2027",
  status: "upcoming",
  title: "FEST 2027",
  titleEn: "FEST 2027",
  date: "2027 m. balandžio 16 d.",
  dateEn: "April 16, 2027",
  subtitle: "Kino horizontai Kauno tarptautinėje gimnazijoje: jaunųjų talentų balsas pasauliui",
  subtitleEn: "Cinematic Horizons at Kaunas International Gymnasium: Youth Talents to the World",
  story: "Pasiruoškite 7-ajam tarptautiniam mokinių trumpametražių filmų festivaliui „Ąžuolynas FEST 2027“! Kviečiame moksleivius nuo 10 iki 18 metų kurti trumpametražius filmus iki 3 minučių naudojant tik išmaniuosius telefonus. Pagrindinė 2027 m. tema: „Ateities kadrai – mūsų bendra istorija“. Laukia iškilminga apdovanojimų ceremonija, tarptautinė kino profesionalų žiuri ir vertingi prizai bei statulėlės.",
  storyEn: "Prepare for the 7th International Youth Short Film Festival 'Ąžuolynas FEST 2027'! We invite students aged 10-18 to create short films up to 3 minutes using smartphone cameras only. The main theme for 2027 is 'Future Frames – Our Shared Story'. Experience a grand award ceremony, international jury evaluation, and prestigious festival trophies.",
  heroImage: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b",
  videoUrl: "https://www.youtube.com/watch?v=INGtv",
  pageUrl: "azuolynas-fest-2027.html",
  pageUrlEn: "../en/azuolynas-fest-2027.html",
  submissionDeadline: "2027-03-20",
  votingStartDate: "2027-04-01",
  votingEndDate: "2027-04-14",
  categories: "I Kategorija (10-13 m.), II Kategorija (14-18 m.)",
  categoriesEn: "Category I (10-13 yrs), Category II (14-18 yrs)"
};

const DEFAULT_2026_EDITION = {
  year: "2026",
  status: "completed",
  title: "FEST 2026",
  titleEn: "FEST 2026",
  date: "2026 m. balandžio 17 d.",
  dateEn: "April 17, 2026",
  subtitle: "Kino šventė Kauno tarptautinėje gimnazijoje: net keturi žemynai viename ekrane!",
  subtitleEn: "Cinema Celebration at Kaunas International Gymnasium: Four Continents on One Screen!",
  story: "Jau šeštus metus iš eilės mūsų gimnazija tampa jaunimo kino meno centru. Mokykloje vyko tradicinis tarptautinis mokinių kino festivalis „Ąžuolynas“. Šių metų festivalio mastas išties stulbinantis: kaip pastebėjo direktoriaus pavaduotoja ugdymui atliekanti direktoriaus funkcijas Marija Daunorienė, dalyvių geografija išsiplėtė net iki 4 žemynų. Konkurse varžėsi jaunieji talentai iš Europos, Azijos, Šiaurės Amerikos ir net Afrikos!",
  storyEn: "For the sixth consecutive year, our gymnasium has become a youth cinema art center. The traditional international student film festival 'Ąžuolynas' expanded to 4 continents.",
  heroImage: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b",
  videoUrl: "https://www.youtube.com/watch?v=INGtv",
  pageUrl: "azuolynas-fest-2026.html",
  pageUrlEn: "../en/azuolynas-fest-2026.html"
};

export function initEditions() {
  const saveBtn = document.getElementById("saveEditionBtn");
  const resetBtn = document.getElementById("resetEditionFormBtn");
  const preset2027Btn = document.getElementById("preset2027Btn");
  const preset2026Btn = document.getElementById("preset2026Btn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCurrentEdition);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", clearEditionForm);
  }

  if (preset2027Btn) {
    preset2027Btn.addEventListener("click", () => {
      applyEditionPreset(DEFAULT_2027_EDITION);
      showToast("Užpildytas FEST 2027 šablonas su LT ir EN tekstais!", "info");
    });
  }

  if (preset2026Btn) {
    preset2026Btn.addEventListener("click", () => {
      applyEditionPreset(DEFAULT_2026_EDITION);
      showToast("Užpildytas FEST 2026 šablonas!", "info");
    });
  }

  const listContainer = document.getElementById("adminEditionsList");
  if (listContainer) {
    listContainer.addEventListener("click", async (e) => {
      const editBtn = e.target.closest("button[data-action='edit-edition']");
      const deleteBtn = e.target.closest("button[data-action='delete-edition']");

      if (editBtn) {
        loadEditionIntoForm(editBtn.dataset.id);
      } else if (deleteBtn) {
        await deleteEdition(deleteBtn.dataset.id);
      }
    });
  }
}

export function subscribeEditions() {
  if (unsubscribeEditions) {
    unsubscribeEditions();
  }

  if (db && typeof db.collection === "function") {
    try {
      unsubscribeEditions = db.collection("editions")
        .orderBy("year", "desc")
        .onSnapshot((snapshot) => {
          allEditionsList = [];
          snapshot.forEach((doc) => {
            allEditionsList.push({ id: doc.id, ...doc.data() });
          });

          if (allEditionsList.length === 0) {
            loadEditionsFromApi();
          } else {
            renderAdminEditionsList();
          }
        }, () => {
          loadEditionsFromApi();
        });
      return;
    } catch (e) {
      console.warn("Firestore listener fallback to API:", e);
    }
  }

  loadEditionsFromApi();
}

async function loadEditionsFromApi() {
  try {
    const res = await fetch("/api/editions");
    if (res.ok) {
      const data = await res.json();
      allEditionsList = data.editions || [DEFAULT_2027_EDITION, DEFAULT_2026_EDITION];
      renderAdminEditionsList();
    }
  } catch (err) {
    allEditionsList = [DEFAULT_2027_EDITION, DEFAULT_2026_EDITION];
    renderAdminEditionsList();
  }
}

export function unsubscribeEditionsListener() {
  if (unsubscribeEditions) {
    unsubscribeEditions();
    unsubscribeEditions = null;
  }
}

function renderAdminEditionsList() {
  const container = document.getElementById("adminEditionsList");
  if (!container) return;

  container.innerHTML = allEditionsList.map((ed) => {
    const bgImage = ed.heroImage || "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b";
    const pageUrl = ed.pageUrl || `azuolynas-fest-${ed.year || '2027'}.html`;
    const isUpcoming = ed.status === "upcoming" || ed.year === "2027";

    return `
      <div class="admin-media-card" style="border:1px solid ${isUpcoming ? 'rgba(212,175,55,0.4)' : 'var(--border-color)'};">
        <div>
          <div class="admin-media-frame" style="position:relative; background-image:url('${bgImage}'); background-size:cover; background-position:center; height:150px;">
            <div style="position:absolute; inset:0; background:rgba(7,28,24,0.7); display:flex; flex-direction:column; justify-content:flex-end; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span class="badge ${isUpcoming ? 'badge-winner' : 'badge-accepted'}">${ed.year || 'Metai'}</span>
                ${isUpcoming ? '<span class="badge" style="background:#134e4a; color:#5eead4; font-size:0.68rem;">Naujas leidinys (2027)</span>' : ''}
              </div>
              <strong style="color:var(--text-color); font-family:var(--font-cinema); font-size:1.15rem;">${ed.title || ('FEST ' + ed.year)}</strong>
            </div>
          </div>
          <div style="padding:10px 0 4px 0;">
            <div style="font-size:0.8rem; color:var(--accent-light); margin-bottom:4px;">📅 ${ed.date || ''} ${ed.dateEn ? `(${ed.dateEn})` : ''}</div>
            <div class="admin-media-caption" style="line-height:1.4;">${ed.subtitle || ''}</div>
            ${ed.submissionDeadline ? `
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                Terminas: <strong>${ed.submissionDeadline}</strong>
              </div>
            ` : ''}
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-solid btn-xs" style="flex:1;" data-action="edit-edition" data-id="${ed.year || ed.id}">Redaguoti (LT/EN)</button>
            <a href="${pageUrl}" target="_blank" class="btn-outline btn-xs" style="display:inline-flex; align-items:center; justify-content:center;">Atverti</a>
          </div>
          <button type="button" class="btn-delete btn-xs" style="width:100%; justify-content:center;" data-action="delete-edition" data-id="${ed.year || ed.id}">Ištrinti leidinį</button>
        </div>
      </div>
    `;
  }).join("");
}

function applyEditionPreset(data) {
  document.getElementById("edYearSelect").value = data.year || "";
  document.getElementById("edStatus").value = data.status || "upcoming";
  document.getElementById("edTitle").value = data.title || "";
  document.getElementById("edTitleEn").value = data.titleEn || "";
  document.getElementById("edDate").value = data.date || "";
  document.getElementById("edDateEn").value = data.dateEn || "";
  document.getElementById("edHeroImage").value = data.heroImage || "";
  document.getElementById("edSubtitle").value = data.subtitle || "";
  document.getElementById("edSubtitleEn").value = data.subtitleEn || "";
  document.getElementById("edStory").value = data.story || "";
  document.getElementById("edStoryEn").value = data.storyEn || "";
  document.getElementById("edDeadline").value = data.submissionDeadline || "";
  document.getElementById("edVideoUrl").value = data.videoUrl || "";
  document.getElementById("edPageUrl").value = data.pageUrl || `azuolynas-fest-${data.year}.html`;

  document.getElementById("editionFormHeading").textContent = `Naujas leidinys: ${data.title}`;
}

function loadEditionIntoForm(yearId) {
  const edition = allEditionsList.find((x) => String(x.year) === String(yearId) || x.id === yearId);
  if (!edition) return;

  document.getElementById("edYearSelect").value = edition.year || "";
  document.getElementById("edStatus").value = edition.status || "completed";
  document.getElementById("edTitle").value = edition.title || "";
  document.getElementById("edTitleEn").value = edition.titleEn || edition.title || "";
  document.getElementById("edDate").value = edition.date || "";
  document.getElementById("edDateEn").value = edition.dateEn || "";
  document.getElementById("edHeroImage").value = edition.heroImage || "";
  document.getElementById("edSubtitle").value = edition.subtitle || "";
  document.getElementById("edSubtitleEn").value = edition.subtitleEn || "";
  document.getElementById("edStory").value = edition.story || "";
  document.getElementById("edStoryEn").value = edition.storyEn || "";
  document.getElementById("edDeadline").value = edition.submissionDeadline || "";
  document.getElementById("edVideoUrl").value = edition.videoUrl || "";
  document.getElementById("edPageUrl").value = edition.pageUrl || `azuolynas-fest-${edition.year}.html`;

  document.getElementById("editionFormHeading").textContent = `Redaguojamas: ${edition.title || ('FEST ' + edition.year)}`;

  const anchor = document.getElementById("editionFormAnchor");
  if (anchor) anchor.scrollIntoView({ behavior: "smooth" });

  showToast(`Užkrauti ${edition.title || edition.year} duomenys redagavimui.`);
}

function clearEditionForm() {
  document.getElementById("edYearSelect").value = "";
  document.getElementById("edStatus").value = "upcoming";
  document.getElementById("edTitle").value = "";
  document.getElementById("edTitleEn").value = "";
  document.getElementById("edDate").value = "";
  document.getElementById("edDateEn").value = "";
  document.getElementById("edHeroImage").value = "";
  document.getElementById("edSubtitle").value = "";
  document.getElementById("edSubtitleEn").value = "";
  document.getElementById("edStory").value = "";
  document.getElementById("edStoryEn").value = "";
  document.getElementById("edDeadline").value = "";
  document.getElementById("edVideoUrl").value = "";
  document.getElementById("edPageUrl").value = "";

  document.getElementById("editionFormHeading").textContent = "Kurti Naują Metų Leidinį (FEST)";
  document.getElementById("edYearSelect").focus();
}

async function saveCurrentEdition() {
  const year = document.getElementById("edYearSelect").value.trim();
  const btn = document.getElementById("saveEditionBtn");

  if (!year) {
    showToast("Įveskite metus (identifikatorių, pvz. 2027)!", "error");
    return;
  }

  btn.disabled = true;

  const payload = {
    year: year,
    status: document.getElementById("edStatus")?.value || "upcoming",
    title: document.getElementById("edTitle").value.trim() || `FEST ${year}`,
    titleEn: document.getElementById("edTitleEn").value.trim() || `FEST ${year}`,
    date: document.getElementById("edDate").value.trim(),
    dateEn: document.getElementById("edDateEn").value.trim(),
    subtitle: document.getElementById("edSubtitle").value.trim(),
    subtitleEn: document.getElementById("edSubtitleEn").value.trim(),
    heroImage: document.getElementById("edHeroImage").value.trim(),
    story: document.getElementById("edStory").value.trim(),
    storyEn: document.getElementById("edStoryEn").value.trim(),
    submissionDeadline: document.getElementById("edDeadline")?.value.trim() || "",
    videoUrl: document.getElementById("edVideoUrl").value.trim(),
    pageUrl: document.getElementById("edPageUrl").value.trim() || `azuolynas-fest-${year}.html`,
    adminEmail: sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com"
  };

  try {
    // 1. Save to server backend API
    const res = await fetch("/api/admin/editions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // 2. Also sync to Firestore if db is available
    if (db && typeof db.collection === "function") {
      try {
        await db.collection("editions").doc(year).set({
          ...payload,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (fsErr) {
        console.warn("Firestore edition sync notice:", fsErr.message);
      }
    }

    showToast(`Metų leidinio FEST ${year} duomenys sėkmingai išsaugoti!`, "success");
    await loadEditionsFromApi();
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
  } catch (err) {
    showToast("Klaida išsaugant leidinį: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

async function deleteEdition(yearId) {
  if (!confirm(`Ar tikrai norite ištrinti festivalio leidinį ${yearId}?`)) return;

  const callerEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";

  try {
    await fetch("/api/admin/editions/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: yearId, adminEmail: callerEmail })
    });

    if (db && typeof db.collection === "function") {
      try {
        await db.collection("editions").doc(String(yearId)).delete();
      } catch (e) {
        console.warn(e);
      }
    }

    showToast(`Leidinys ${yearId} pašalintas.`);
    await loadEditionsFromApi();
    window.dispatchEvent(new CustomEvent("refresh-notifications"));
  } catch (err) {
    showToast("Klaida trinant leidinį: " + err.message, "error");
  }
}
