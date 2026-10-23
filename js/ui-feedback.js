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

export function createMediaEmbed(url) {
  if (!url) {
    return `<div style="background:#020606; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-subtle); font-size:0.75rem;">Nėra nuorodos</div>`;
  }
  const cleanUrl = url.trim();
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}" title="Festival Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
  }
  return `<video src="${cleanUrl}" controls playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
}
