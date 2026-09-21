import { auth, AUTHORIZED_ADMIN_EMAILS } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

export function initAuth({ onLoginSuccess, onLogout }) {
  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authErrMsg = document.getElementById("authErrMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");

  const loginFormWrapper = document.getElementById("loginFormWrapper");
  const forgotFormWrapper = document.getElementById("forgotFormWrapper");
  const showForgotBtn = document.getElementById("showForgotBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const sendResetLinkBtn = document.getElementById("sendResetLinkBtn");
  const resetEmail = document.getElementById("resetEmail");
  const resetErrMsg = document.getElementById("resetErrMsg");
  const resetSuccessMsg = document.getElementById("resetSuccessMsg");

  auth.onAuthStateChanged((user) => {
    if (user && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      loginSection.classList.add("d-none");
      panelSection.classList.remove("d-none");
      authErrMsg.classList.add("d-none");
      onLoginSuccess(user);
    } else if (user) {
      auth.signOut();
      authErrMsg.classList.remove("d-none");
      authErrMsg.textContent = "Prieiga apribota: paskyrai nesuteiktos administratoriaus teisės.";
    } else {
      loginSection.classList.remove("d-none");
      panelSection.classList.add("d-none");
      onLogout();
    }
  });

  adminAuthForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authErrMsg.classList.add("d-none");
    loginSubmitBtn.disabled = true;

    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      showToast("Sėkmingai prisijungta!");
    } catch (err) {
      authErrMsg.classList.remove("d-none");
      authErrMsg.textContent = "Neteisingi prisijungimo duomenys arba paskyra neegzistuoja.";
    } finally {
      loginSubmitBtn.disabled = false;
    }
  });

  if (showForgotBtn && backToLoginBtn) {
    showForgotBtn.addEventListener("click", () => {
      loginFormWrapper.classList.add("d-none");
      forgotFormWrapper.classList.remove("d-none");
      resetErrMsg.classList.add("d-none");
      resetSuccessMsg.classList.add("d-none");
    });

    backToLoginBtn.addEventListener("click", () => {
      forgotFormWrapper.classList.add("d-none");
      loginFormWrapper.classList.remove("d-none");
    });
  }

  if (sendResetLinkBtn) {
    sendResetLinkBtn.addEventListener("click", async () => {
      const email = resetEmail.value.trim().toLowerCase();
      resetErrMsg.classList.add("d-none");
      resetSuccessMsg.classList.add("d-none");

      if (!email) {
        resetErrMsg.classList.remove("d-none");
        resetErrMsg.textContent = "Įveskite el. pašto adresą.";
        return;
      }

      if (!AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        resetErrMsg.classList.remove("d-none");
        resetErrMsg.textContent = "Šis el. pašto adresas nėra autorizuotas administratoriaus skydelyje.";
        return;
      }

      sendResetLinkBtn.disabled = true;

      try {
        await auth.sendPasswordResetEmail(email);
        resetSuccessMsg.classList.remove("d-none");
        resetSuccessMsg.textContent = `Nuoroda slaptažodžio nustatymui išsiųsta į ${email}. Pasitikrinkite savo paštą!`;
        showToast("Nuoroda sėkmingai išsiųsta!");
      } catch (err) {
        resetErrMsg.classList.remove("d-none");
        resetErrMsg.textContent = "Nepavyko išsiųsti nuorodos: " + err.message;
      } finally {
        sendResetLinkBtn.disabled = false;
      }
    });
  }

  logoutBtn.addEventListener("click", async () => {
    try {
      await auth.signOut();
      showToast("Sėkmingai atsijungta.");
    } catch (err) {
      showToast("Klaida atsijungiant: " + err.message, "error");
    }
  });
}

export async function sendAdminInviteLink(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Nurodykite el. pašto adresą.");
  }
  if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
    throw new Error("Šis el. paštas nėra administratoriaus teisių sąraše.");
  }
  await auth.sendPasswordResetEmail(cleanEmail);
}