import { db, storage } from "./firebase-init.js";
import { showToast, createMediaEmbed } from "./ui-feedback.js";

let archiveVideos = [];
let archivePhotos = [];
let selectedArcVidFile = null;
let selectedArcImgFile = null;

export function initArchive() {
  const arcVidFileInput = document.getElementById("arcVidFile");
  const arcVidFileStatus = document.getElementById("arcVidFileStatus");
  const arcImgFileInput = document.getElementById("arcImgFile");
  const arcImgFileStatus = document.getElementById("arcImgFileStatus");

  if (arcVidFileInput) {
    arcVidFileInput.addEventListener("change", (e) => {
      selectedArcVidFile = e.target.files[0] || null;
      if (arcVidFileStatus) {
        arcVidFileStatus.textContent = selectedArcVidFile ? `Pasirinktas failas: ${selectedArcVidFile.name}` : "";
      }
    });
  }

  if (arcImgFileInput) {
    arcImgFileInput.addEventListener("change", (e) => {
      selectedArcImgFile = e.target.files[0] || null;
      if (arcImgFileStatus) {
        arcImgFileStatus.textContent = selectedArcImgFile ? `Pasirinkta nuotrauka: ${selectedArcImgFile.name}` : "";
      }
    });
  }

  const arcVidSaveBtn = document.getElementById("arcVidSaveBtn");
  if (arcVidSaveBtn) arcVidSaveBtn.addEventListener("click", saveArchiveVideo);

  const arcImgSaveBtn = document.getElementById("arcImgSaveBtn");
  if (arcImgSaveBtn) arcImgSaveBtn.addEventListener("click", saveArchivePhoto);

  const arcPrizesSaveBtn = document.getElementById("arcPrizesSaveBtn");
  if (arcPrizesSaveBtn) arcPrizesSaveBtn.addEventListener("click", savePrizesPhoto);

  const vidsList = document.getElementById("adminArchiveVideosList");
  if (vidsList) {
    vidsList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-delete-video]");
      if (btn) removeArchiveVideo(btn.dataset.deleteVideo);
    });
  }

  const photosList = document.getElementById("adminArchivePhotosList");
  if (photosList) {
    photosList.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-delete-photo]");
      if (btn) removeArchivePhoto(btn.dataset.deletePhoto);
    });
  }
}

export function syncArchiveState(settingsData) {
  archiveVideos = Array.isArray(settingsData.archiveVideos) ? settingsData.archiveVideos : [
    {
      id: "default_2025",
      title: "Fest 2025",
      label: "2025 m. įrašas",
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/A%CC%A8z%CC%8Cuolynas%20International%20Film%20Festival%202025.mp4?alt=media&token=f62b9379-1600-456c-8d17-6f4e1f062017"
    },
    {
      id: "default_2024",
      title: "Fest 2024",
      label: "2024 m. įrašas",
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/The%20A%CC%A8z%CC%8Cuolynas%20Film%20Festival%202024.mp4?alt=media&token=cf0417c4-0ffd-4d70-b318-3f9a5e2c81f0"
    }
  ];

  archivePhotos = Array.isArray(settingsData.archivePhotos) ? settingsData.archivePhotos : [
    {
      id: "default_img_2025_1",
      caption: "Akimirkos iš 2025 m. festivalio ceremonijos",
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b"
    },
    {
      id: "default_img_2025_2",
      caption: "Festivalio laureatai ir dalyviai 2025 m.",
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3459.jpeg?alt=media&token=dfdda212-9ea6-433f-af80-8c5b5b57f361"
    }
  ];

  const prizesInput = document.getElementById("arcPrizesUrl");
  if (prizesInput) {
    prizesInput.value = settingsData.prizesPhotoUrl || "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da";
  }

  renderArchiveUI();
}

function renderArchiveUI() {
  const vidsContainer = document.getElementById("adminArchiveVideosList");
  const photosContainer = document.getElementById("adminArchivePhotosList");

  if (vidsContainer) {
    vidsContainer.innerHTML = archiveVideos.map((v) => `
      <div class="admin-media-card">
        <div>
          <strong style="color:var(--text-color); font-family:var(--font-cinema); font-size:1.05rem;">${v.title}</strong>
          <div style="font-size:0.78rem; color:var(--accent-light); margin:4px 0 8px 0;">${v.label || ''}</div>
          <div class="admin-media-frame">
            ${createMediaEmbed(v.url)}
          </div>
        </div>
        <button class="btn-delete btn-full" data-delete-video="${v.id}">Pašalinti iš svetainės</button>
      </div>
    `).join("");
  }

  if (photosContainer) {
    photosContainer.innerHTML = archivePhotos.map((p) => `
      <div class="admin-media-card">
        <div>
          <div class="admin-media-thumb">
            <img src="${p.url}" alt="Foto" class="admin-media-img">
          </div>
          <div class="admin-media-caption">${p.caption || ''}</div>
        </div>
        <button class="btn-delete btn-full" data-delete-photo="${p.id}">Pašalinti nuotrauką</button>
      </div>
    `).join("");
  }
}

async function saveArchiveVideo() {
  const btn = document.getElementById("arcVidSaveBtn");
  const title = document.getElementById("arcVidTitle").value.trim();
  const label = document.getElementById("arcVidLabel").value.trim();
  let url = document.getElementById("arcVidUrl").value.trim();

  if (!title) {
    showToast("Įveskite vaizdo įrašo pavadinimą!", "error");
    return;
  }
  if (!url && !selectedArcVidFile) {
    showToast("Įveskite vaizdo įrašo URL arba pasirinkite failą!", "error");
    return;
  }

  btn.disabled = true;

  try {
    if (selectedArcVidFile) {
      const prContainer = document.getElementById("arcVidProgressContainer");
      const prFill = document.getElementById("arcVidProgressFill");
      const prStatus = document.getElementById("arcVidProgressStatus");
      if (prContainer) prContainer.classList.add("active");

      const ext = selectedArcVidFile.name.split('.').pop() || 'mp4';
      const path = `archive_videos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const task = storage.ref(path).put(selectedArcVidFile);

      await new Promise((resolve, reject) => {
        task.on("state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            if (prFill) prFill.style.width = pct + "%";
            if (prStatus) prStatus.textContent = pct + "%";
          },
          reject,
          async () => {
            url = await task.snapshot.ref.getDownloadURL();
            resolve();
          }
        );
      });
      if (prContainer) prContainer.classList.remove("active");
    }

    const updatedVideos = [
      {
        id: "arc_vid_" + Date.now(),
        title,
        label,
        url
      },
      ...archiveVideos
    ];

    await db.collection("settings").doc("festival").set({
      archiveVideos: updatedVideos
    }, { merge: true });

    document.getElementById("arcVidTitle").value = "";
    document.getElementById("arcVidLabel").value = "";
    document.getElementById("arcVidUrl").value = "";
    selectedArcVidFile = null;
    const fileInput = document.getElementById("arcVidFile");
    if (fileInput) fileInput.value = "";
    const fileStatus = document.getElementById("arcVidFileStatus");
    if (fileStatus) fileStatus.textContent = "";

    showToast("Vaizdo įrašas sėkmingai pridėtas į archyvą!");
  } catch (err) {
    showToast("Klaida keliant vaizdo įrašą: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

async function removeArchiveVideo(id) {
  if (!confirm("Ar tikrai norite pašalinti šį vaizdo įrašą?")) return;
  const filtered = archiveVideos.filter((v) => v.id !== id);
  try {
    await db.collection("settings").doc("festival").set({
      archiveVideos: filtered
    }, { merge: true });
    showToast("Vaizdo įrašas pašalintas.");
  } catch (err) {
    showToast("Klaida trinant vaizdo įrašą: " + err.message, "error");
  }
}

async function saveArchivePhoto() {
  const btn = document.getElementById("arcImgSaveBtn");
  const caption = document.getElementById("arcImgCaption").value.trim();
  let url = document.getElementById("arcImgUrl").value.trim();

  if (!caption) {
    showToast("Įveskite nuotraukos aprašymą!", "error");
    return;
  }
  if (!url && !selectedArcImgFile) {
    showToast("Įveskite nuotraukos URL arba pasirinkite failą!", "error");
    return;
  }

  btn.disabled = true;

  try {
    if (selectedArcImgFile) {
      const prContainer = document.getElementById("arcImgProgressContainer");
      const prFill = document.getElementById("arcImgProgressFill");
      const prStatus = document.getElementById("arcImgProgressStatus");
      if (prContainer) prContainer.classList.add("active");

      const ext = selectedArcImgFile.name.split('.').pop() || 'jpg';
      const path = `archive_photos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const task = storage.ref(path).put(selectedArcImgFile);

      await new Promise((resolve, reject) => {
        task.on("state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            if (prFill) prFill.style.width = pct + "%";
            if (prStatus) prStatus.textContent = pct + "%";
          },
          reject,
          async () => {
            url = await task.snapshot.ref.getDownloadURL();
            resolve();
          }
        );
      });
      if (prContainer) prContainer.classList.remove("active");
    }

    const updatedPhotos = [
      ...archivePhotos,
      {
        id: "arc_photo_" + Date.now(),
        caption,
        url
      }
    ];

    await db.collection("settings").doc("festival").set({
      archivePhotos: updatedPhotos
    }, { merge: true });

    document.getElementById("arcImgCaption").value = "";
    document.getElementById("arcImgUrl").value = "";
    selectedArcImgFile = null;
    const fileInput = document.getElementById("arcImgFile");
    if (fileInput) fileInput.value = "";
    const fileStatus = document.getElementById("arcImgFileStatus");
    if (fileStatus) fileStatus.textContent = "";

    showToast("Nuotrauka sėkmingai pridėta!");
  } catch (err) {
    showToast("Klaida keliant nuotrauką: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

async function removeArchivePhoto(id) {
  if (!confirm("Ar tikrai norite pašalinti šią nuotrauką?")) return;
  const filtered = archivePhotos.filter((p) => p.id !== id);
  try {
    await db.collection("settings").doc("festival").set({
      archivePhotos: filtered
    }, { merge: true });
    showToast("Nuotrauka pašalinta.");
  } catch (err) {
    showToast("Klaida trinant nuotrauką: " + err.message, "error");
  }
}

async function savePrizesPhoto() {
  const btn = document.getElementById("arcPrizesSaveBtn");
  const url = document.getElementById("arcPrizesUrl").value.trim();
  if (!url) {
    showToast("Įveskite prizų nuotraukos URL!", "error");
    return;
  }

  btn.disabled = true;
  try {
    await db.collection("settings").doc("festival").set({
      prizesPhotoUrl: url
    }, { merge: true });
    showToast("Oficiali prizų nuotrauka atnaujinta!");
  } catch (err) {
    showToast("Klaida atnaujinant prizų nuotrauką: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
}
