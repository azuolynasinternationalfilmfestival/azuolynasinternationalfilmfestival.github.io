export function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function createMediaEmbed(url, title) {
  if (!url) {
    return `<div style="background:#020606; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-subtle); font-size:0.75rem;">Nėra nuorodos</div>`;
  }
  const cleanUrl = url.trim();
  if (typeof window !== "undefined" && window.FestivalYouTube && typeof window.FestivalYouTube.buildFacadeHTML === "function") {
    return window.FestivalYouTube.buildFacadeHTML(cleanUrl, title || "Festival Video");
  }
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    const safeTitle = String(title || "Festival Video").replace(/"/g, "&quot;");
    return `<button type="button" class="yt-facade-btn" data-yt-id="${id}" data-yt-title="${safeTitle}" aria-label="Play video: ${safeTitle}"><picture class="yt-facade-picture"><source srcset="https://i.ytimg.com/vi_webp/${id}/hqdefault.webp" type="image/webp"><img class="yt-facade-img" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${safeTitle}" width="480" height="360" loading="lazy" decoding="async"></picture><span class="yt-facade-play" aria-hidden="true"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#212121" fill-opacity="0.88"/><path d="M45 24 27 14v20" fill="#fff"/></svg></span></button>`;
  }
  return `<video src="${cleanUrl}" controls playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
}
