import { db } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

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
  const yearInput = document.getElementById("edYearSelect");

  if (saveBtn) {
    saveBtn.addEventListener("click", saveCurrentEdition);
  }

  if (yearInput) {
    yearInput.addEventListener("change", () => loadEditionData(yearInput.value.trim()));
    loadEditionData(yearInput.value.trim() || "2026");
  }
}

async function loadEditionData(year) {
  if (!year) return;

  try {
    const doc = await db.collection("editions").doc(year).get();
    const data = doc.exists ? doc.data() : (year === "2026" ? DEFAULT_2026_EDITION : {});

    document.getElementById("edTitle").value = data.title || `FEST ${year}`;
    document.getElementById("edDate").value = data.date || "";
    document.getElementById("edSubtitle").value = data.subtitle || "";
    document.getElementById("edHeroImage").value = data.heroImage || "";
    document.getElementById("edStory").value = data.story || "";
    document.getElementById("edVideoUrl").value = data.videoUrl || "";
    document.getElementById("edPageUrl").value = data.pageUrl || `azuolynas-fest-${year}.html`;
  } catch (err) {
    showToast("Klaida kraunant ediciją: " + err.message, "error");
  }
}

async function saveCurrentEdition() {
  const year = document.getElementById("edYearSelect").value.trim();
  const btn = document.getElementById("saveEditionBtn");

  if (!year) {
    showToast("Įveskite metus!", "error");
    return;
  }

  btn.disabled = true;

  const payload = {
    year: year,
    title: document.getElementById("edTitle").value.trim(),
    date: document.getElementById("edDate").value.trim(),
    subtitle: document.getElementById("edSubtitle").value.trim(),
    heroImage: document.getElementById("edHeroImage").value.trim(),
    story: document.getElementById("edStory").value.trim(),
    videoUrl: document.getElementById("edVideoUrl").value.trim(),
    pageUrl: document.getElementById("edPageUrl").value.trim(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("editions").doc(year).set(payload, { merge: true });
    showToast(`Metų leidinio FEST ${year} informacija sėkmingai išsaugota!`);
  } catch (err) {
    showToast("Klaida išsaugant: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}