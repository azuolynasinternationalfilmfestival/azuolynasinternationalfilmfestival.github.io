import { db } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

let allEditionsList = [];
let unsubscribeEditions = null;

const DEFAULT_2026_EDITION = {
  year: "2026",
  title: "FEST 2026",
  date: "2026 m. balandžio 17 d.",
  subtitle: "Kino šventė Kauno tarptautinėje gimnazijoje: net keturi žemynai viename ekrane!",
  heroImage: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b",
  story: "Jau šeštus metus iš eilės mūsų gimnazija tampa jaunimo kino meno centru. Mokykloje vyko tradicinis tarptautinis mokinių kino festivalis „Ąžuolynas“. Šių metų festivalio mastas išties stulbinantis: kaip pastebėjo direktoriaus pavaduotoja ugdymui atliekanti direktoriaus funkcijas Marija Daunorienė, dalyvių geografija išsiplėtė net iki 4 žemynų. Konkurse varžėsi jaunieji talentai iš Europos, Azijos, Šiaurės Amerikos ir net Afrikos! Dalyvių meistriškumą vertino profesionali komisija, kurią sudarė televizijos ir tarptautinių santykių ekspertai iš Italijos, Serbų Respublikos ir Lietuvos.\n\nMūsų pergalės:\nDominikas Šuškevič (8c klasė) – I VIETA.\n„Drama club“ kolektyvas (vad. Elena Dosė-Drelingienė) – III VIETA.\n\nNugalėtojai:\nI vieta (vyresnieji) – Armėnija. II vieta – Estija ir Kanada. III vieta – Kanada. Specialūs prizai – Vilniaus ir Kenijos komandoms.\n\nViena ryškiausių dalių – 11 kl. teatro pasirodymas su festivalio vadove Karina Brdar. Ceremonijos įrašą rasite INGtv „YouTube“ kanale.",
  videoUrl: "https://www.youtube.com/watch?v=INGtv",
  pageUrl: "azuolynas-fest-2026.html"
};

export function initEditions() {
  const saveBtn = document.getElementById("saveEditionBtn");
  const resetBtn = document.getElementById("resetEditionFormBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCurrentEdition);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", clearEditionForm);
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

  unsubscribeEditions = db.collection("editions")
    .orderBy("year", "desc")
    .onSnapshot((snapshot) => {
      allEditionsList = [];
      snapshot.forEach((doc) => {
        allEditionsList.push({ id: doc.id, ...doc.data() });
      });

      if (allEditionsList.length === 0) {
        allEditionsList = [DEFAULT_2026_EDITION];
      }

      renderAdminEditionsList();
    }, (err) => {
      showToast("Klaida gaunant leidinių sąrašą: " + err.message, "error");
    });
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
    const pageUrl = ed.pageUrl || `azuolynas-fest-${ed.year || '2026'}.html`;

    return `
      <div class="admin-media-card">
        <div>
          <div class="admin-media-frame" style="position:relative; background-image:url('${bgImage}'); background-size:cover; background-position:center;">
            <div style="position:absolute; inset:0; background:rgba(7,28,24,0.65); display:flex; flex-direction:column; justify-content:flex-end; padding:12px;">
              <span class="badge badge-accepted" style="align-self:flex-start; margin-bottom:4px;">${ed.year || 'Metai'}</span>
              <strong style="color:var(--text-color); font-family:var(--font-cinema); font-size:1.15rem;">${ed.title || 'FEST'}</strong>
            </div>
          </div>
          <div style="font-size:0.8rem; color:var(--accent-light); margin-bottom:4px;">${ed.date || ''}</div>
          <div class="admin-media-caption">${ed.subtitle || ''}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-solid btn-xs" style="flex:1;" data-action="edit-edition" data-id="${ed.year || ed.id}">Redaguoti</button>
            <a href="${pageUrl}" target="_blank" class="btn-outline btn-xs" style="display:inline-flex; align-items:center; justify-content:center;">Atverti</a>
          </div>
          <button type="button" class="btn-delete btn-xs" style="width:100%; justify-content:center;" data-action="delete-edition" data-id="${ed.year || ed.id}">Ištrinti puslapį</button>
        </div>
      </div>
    `;
  }).join("");
}

function loadEditionIntoForm(yearId) {
  const edition = allEditionsList.find((x) => String(x.year) === String(yearId) || x.id === yearId);
  if (!edition) return;

  document.getElementById("edYearSelect").value = edition.year || "";
  document.getElementById("edTitle").value = edition.title || "";
  document.getElementById("edDate").value = edition.date || "";
  document.getElementById("edHeroImage").value = edition.heroImage || "";
  document.getElementById("edSubtitle").value = edition.subtitle || "";
  document.getElementById("edStory").value = edition.story || "";
  document.getElementById("edVideoUrl").value = edition.videoUrl || "";
  document.getElementById("edPageUrl").value = edition.pageUrl || `azuolynas-fest-${edition.year}.html`;

  document.getElementById("editionFormHeading").textContent = `Redaguojamas: ${edition.title || ('FEST ' + edition.year)}`;

  const anchor = document.getElementById("editionFormAnchor");
  if (anchor) anchor.scrollIntoView({ behavior: "smooth" });

  showToast(`Užkrauti ${edition.title || edition.year} duomenys redagavimui.`);
}

function clearEditionForm() {
  document.getElementById("edYearSelect").value = "";
  document.getElementById("edTitle").value = "";
  document.getElementById("edDate").value = "";
  document.getElementById("edHeroImage").value = "";
  document.getElementById("edSubtitle").value = "";
  document.getElementById("edStory").value = "";
  document.getElementById("edVideoUrl").value = "";
  document.getElementById("edPageUrl").value = "";

  document.getElementById("editionFormHeading").textContent = "Kurti Naują Metų Leidinį";
  document.getElementById("edYearSelect").focus();
}

async function saveCurrentEdition() {
  const year = document.getElementById("edYearSelect").value.trim();
  const btn = document.getElementById("saveEditionBtn");

  if (!year) {
    showToast("Įveskite metus (identifikatorių)!", "error");
    return;
  }

  btn.disabled = true;

  const payload = {
    year: year,
    title: document.getElementById("edTitle").value.trim() || `FEST ${year}`,
    date: document.getElementById("edDate").value.trim(),
    subtitle: document.getElementById("edSubtitle").value.trim(),
    heroImage: document.getElementById("edHeroImage").value.trim(),
    story: document.getElementById("edStory").value.trim(),
    videoUrl: document.getElementById("edVideoUrl").value.trim(),
    pageUrl: document.getElementById("edPageUrl").value.trim() || `azuolynas-fest-${year}.html`,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("editions").doc(year).set(payload, { merge: true });
    showToast(`Metų leidinio ${payload.title} duomenys sėkmingai išsaugoti!`);
  } catch (err) {
    showToast("Klaida išsaugant: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

async function deleteEdition(yearId) {
  if (!confirm(`Ar tikrai norite ištrinti leidinį ${yearId}?`)) return;

  try {
    await db.collection("editions").doc(String(yearId)).delete();
    showToast(`Leidinys ${yearId} pašalintas.`);
    clearEditionForm();
  } catch (err) {
    showToast("Klaida trinant leidinį: " + err.message, "error");
  }
}
