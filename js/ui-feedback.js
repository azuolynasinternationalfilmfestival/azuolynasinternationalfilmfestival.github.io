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
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
    let embed = cleanUrl;
    if (cleanUrl.includes("watch?v=")) embed = cleanUrl.replace("watch?v=", "embed/");
    else if (cleanUrl.includes("youtu.be/")) embed = cleanUrl.replace("youtu.be/", "www.youtube.com/embed/");
    return `<iframe src="${embed}" allowfullscreen style="width:100%; height:100%; border:none;"></iframe>`;
  }
  return `<video src="${cleanUrl}" controls playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
}
