import { auth, AUTHORIZED_ADMIN_EMAILS } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

export function initAuth({ onLoginSuccess, onLogout }) {
  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authErrMsg = document.getElementById("authErrMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  auth.onAuthStateChanged((user) => {
    if (user && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      loginSection.style.display = "none";
      panelSection.style.display = "flex";
      authErrMsg.style.display = "none";
      onLoginSuccess(user);
    } else if (user) {
      auth.signOut();
      authErrMsg.style.display = "block";
      authErrMsg.textContent = "Prieiga apribota: paskyrai nesuteiktos administratoriaus teisės.";
    } else {
      loginSection.style.display = "flex";
      panelSection.style.display = "none";
      onLogout();
    }
  });

  adminAuthForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authErrMsg.style.display = "none";
    loginSubmitBtn.disabled = true;

    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      showToast("Sėkmingai prisijungta!");
    } catch (err) {
      authErrMsg.style.display = "block";
      authErrMsg.textContent = "Neteisingi prisijungimo duomenys arba paskyra neegzistuoja.";
    } finally {
      loginSubmitBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      showToast("Sėkmingai atsijungta.");
    } catch (err) {
      showToast("Klaida atsijungiant: " + err.message, "error");
    }
  });
}
