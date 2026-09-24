import { db, storage } from "./firebase-init.js";
import { showToast, createMediaEmbed } from "./ui-feedback.js";

let archiveVideos = [];
let archivePhotos = [];
let selectedArcVidFile = null;
let selectedArcImgFile = null;

let adminPhotoFilterAlbum = "all";
let adminPhotoSearchQuery = "";
let adminPhotoSortDesc = true;

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
      const delBtn = e.target.closest("button[data-delete-photo]");
      if (delBtn) {
        removeArchivePhoto(delBtn.dataset.deletePhoto);
        return;
      }
      const editBtn = e.target.closest("button[data-edit-photo]");
      if (editBtn) {
        openEditPhotoModal(editBtn.dataset.editPhoto);
        return;
      }
      const prevBtn = e.target.closest("button[data-preview-photo]");
      if (prevBtn) {
        const photo = archivePhotos.find((p) => p.id === prevBtn.dataset.previewPhoto);
        if (photo) window.open(photo.url, "_blank");
      }
    });
  }

  // Photo Search Filter
  const photoSearch = document.getElementById("adminPhotoSearch");
  if (photoSearch) {
    photoSearch.addEventListener("input", (e) => {
      adminPhotoSearchQuery = e.target.value.toLowerCase().trim();
      renderPhotosList();
    });
  }

  // Photo Album Filter Pills
  const albumTabs = document.getElementById("adminPhotoAlbumTabs");
  if (albumTabs) {
    albumTabs.addEventListener("click", (e) => {
      const pill = e.target.closest(".admin-photo-pill");
      if (!pill) return;
      albumTabs.querySelectorAll(".admin-photo-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      adminPhotoFilterAlbum = pill.dataset.album;
      renderPhotosList();
    });
  }

  // Photo Sort Button
  const sortBtn = document.getElementById("adminPhotoSortBtn");
  const sortLabel = document.getElementById("adminPhotoSortLabel");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      adminPhotoSortDesc = !adminPhotoSortDesc;
      if (sortLabel) {
        sortLabel.textContent = adminPhotoSortDesc ? "Naujausios priekyje" : "Seniausios priekyje";
      }
      renderPhotosList();
    });
  }

  // Edit Photo Modal
  const modalCloseBtn = document.getElementById("adminPhotoModalCloseBtn");
  const modalCancelBtn = document.getElementById("adminPhotoModalCancelBtn");
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAdminPhotoModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeAdminPhotoModal);

  const saveEditedPhotoBtn = document.getElementById("saveEditedPhotoBtn");
  if (saveEditedPhotoBtn) saveEditedPhotoBtn.addEventListener("click", saveEditedPhoto);
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
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3458.jpeg?alt=media&token=224af1bd-25ff-494e-8136-fbf330d3ad5b",
      album: "ceremony"
    },
    {
      id: "default_img_2025_2",
      caption: "Festivalio laureatai ir dalyviai 2025 m.",
      url: "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3459.jpeg?alt=media&token=dfdda212-9ea6-433f-af80-8c5b5b57f361",
      album: "laureates"
    }
  ];

  const prizesInput = document.getElementById("arcPrizesUrl");
  if (prizesInput) {
    prizesInput.value = settingsData.prizesPhotoUrl || "https://firebasestorage.googleapis.com/v0/b/azuolynas-film-fest.firebasestorage.app/o/IMG_3463.jpeg?alt=media&token=af7892ca-e78e-4198-b686-e0181472e8da";
  }

  renderArchiveUI();
}

function renderArchiveUI() {
  renderVideosList();
  renderPhotosList();
}

function renderVideosList() {
  const vidsContainer = document.getElementById("adminArchiveVideosList");
  if (!vidsContainer) return;

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

function renderPhotosList() {
  const photosContainer = document.getElementById("adminArchivePhotosList");
  if (!photosContainer) return;

  // Update Dynamic Stats Chips
  const statsChips = document.getElementById("adminPhotoStatsChips");
  if (statsChips) {
    const total = archivePhotos.length;
    const ceremonyCount = archivePhotos.filter((p) => (p.album || "ceremony") === "ceremony").length;
    const laureatesCount = archivePhotos.filter((p) => p.album === "laureates").length;
    const prizesCount = archivePhotos.filter((p) => p.album === "prizes").length;

    statsChips.innerHTML = `
      <span class="badge" style="background:rgba(18,55,47,0.7); color:var(--accent-light); font-size:0.74rem; padding:4px 10px; border-radius:12px; border:1px solid rgba(111,165,138,0.3);">Viso: <strong>${total}</strong></span>
      <span class="badge" style="background:rgba(18,55,47,0.7); color:var(--text-color); font-size:0.74rem; padding:4px 10px; border-radius:12px; border:1px solid rgba(111,165,138,0.25);">Ceremonija: <strong>${ceremonyCount}</strong></span>
      <span class="badge" style="background:rgba(18,55,47,0.7); color:var(--text-color); font-size:0.74rem; padding:4px 10px; border-radius:12px; border:1px solid rgba(111,165,138,0.25);">Laureatai: <strong>${laureatesCount}</strong></span>
      <span class="badge" style="background:rgba(18,55,47,0.7); color:var(--text-color); font-size:0.74rem; padding:4px 10px; border-radius:12px; border:1px solid rgba(111,165,138,0.25);">Prizai: <strong>${prizesCount}</strong></span>
    `;
  }

  // Filter & Search
  let filtered = [...archivePhotos];
  if (adminPhotoFilterAlbum !== "all") {
    filtered = filtered.filter((p) => (p.album || "ceremony") === adminPhotoFilterAlbum);
  }
  if (adminPhotoSearchQuery) {
    filtered = filtered.filter((p) => {
      const cap = (p.caption || "").toLowerCase();
      const alb = (p.album || "").toLowerCase();
      return cap.includes(adminPhotoSearchQuery) || alb.includes(adminPhotoSearchQuery);
    });
  }

  // Sort
  filtered.sort((a, b) => {
    return adminPhotoSortDesc ? -1 : 1;
  });

  if (filtered.length === 0) {
    photosContainer.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 36px 20px; text-align: center; color: var(--text-muted); background: var(--surface-color); border: 1px dashed var(--border-color); border-radius: var(--radius-card);">
        <p style="margin:0; font-size: 0.95rem;">Nuotraukų nerasta pagal pasirinktą filtrą ar paieškos frazę.</p>
      </div>
    `;
    return;
  }

  const albumNames = {
    ceremony: "Fest Ceremonija",
    laureates: "Laureatai ir svečiai",
    prizes: "Taurės ir apdovanojimai"
  };

  photosContainer.innerHTML = filtered.map((p) => {
    const albKey = p.album || "ceremony";
    const albName = albumNames[albKey] || albKey;
    return `
      <div class="admin-media-card">
        <div>
          <div class="admin-media-thumb" style="position:relative; aspect-ratio:16/9; background:#000; border-radius:6px; overflow:hidden;">
            <img src="${p.url}" alt="${p.caption || 'Foto'}" class="admin-media-img" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
            <span style="position:absolute; top:6px; left:6px; background:rgba(7,28,24,0.9); color:var(--accent-light); font-size:0.68rem; font-weight:700; padding:2px 7px; border-radius:3px; border:1px solid rgba(111,165,138,0.35); text-transform:uppercase; letter-spacing:0.04em;">
              ${albName}
            </span>
          </div>
          <div class="admin-media-caption" style="margin:10px 0 6px 0; font-size:0.86rem; color:var(--text-color); font-weight:500; line-height:1.4;">
            ${p.caption || 'Be paraštės'}
          </div>
        </div>
        <div class="admin-photo-actions-row">
          <button type="button" class="btn-admin-action" data-edit-photo="${p.id}" title="Redaguoti paraštę ir albumą">
            <svg class="icon-svg-crisp" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Redaguoti</span>
          </button>
          <button type="button" class="btn-admin-action" data-preview-photo="${p.id}" title="Atverti originalią nuotrauką">
            <svg class="icon-svg-crisp" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Peržiūra</span>
          </button>
          <button type="button" class="btn-admin-action btn-action-delete" data-delete-photo="${p.id}" title="Pašalinti nuotrauką">
            <svg class="icon-svg-crisp" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Trinti</span>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function openEditPhotoModal(id) {
  const photo = archivePhotos.find((p) => p.id === id);
  if (!photo) return;

  const idInput = document.getElementById("editPhotoId");
  const prevImg = document.getElementById("editPhotoPreview");
  const capInput = document.getElementById("editPhotoCaption");
  const albSelect = document.getElementById("editPhotoAlbum");

  if (idInput) idInput.value = photo.id;
  if (prevImg) prevImg.src = photo.url;
  if (capInput) capInput.value = photo.caption || "";
  if (albSelect) albSelect.value = photo.album || "ceremony";

  const modal = document.getElementById("adminPhotoModal");
  if (modal) modal.classList.add("active");
}

function closeAdminPhotoModal() {
  const modal = document.getElementById("adminPhotoModal");
  if (modal) modal.classList.remove("active");
}

async function saveEditedPhoto() {
  const idInput = document.getElementById("editPhotoId");
  const capInput = document.getElementById("editPhotoCaption");
  const albSelect = document.getElementById("editPhotoAlbum");
  const btn = document.getElementById("saveEditedPhotoBtn");

  if (!idInput || !capInput || !albSelect) return;
  const id = idInput.value;
  const newCaption = capInput.value.trim();
  const newAlbum = albSelect.value;

  if (!newCaption) {
    showToast("Įveskite nuotraukos aprašymą!", "error");
    return;
  }

  if (btn) btn.disabled = true;

  try {
    const updatedPhotos = archivePhotos.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          caption: newCaption,
          album: newAlbum
        };
      }
      return p;
    });

    await db.collection("settings").doc("festival").set({
      archivePhotos: updatedPhotos
    }, { merge: true });

    archivePhotos = updatedPhotos;
    closeAdminPhotoModal();
    renderPhotosList();
    showToast("Nuotraukos informacija sėkmingai atnaujinta!");
  } catch (err) {
    showToast("Klaida išsaugant pakeitimus: " + err.message, "error");
  } finally {
    if (btn) btn.disabled = false;
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
  const albumSelect = document.getElementById("arcImgAlbum");
  const album = albumSelect ? albumSelect.value : "ceremony";
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
        url,
        album
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
