import { auth as defaultAuth, getFirebaseAuth, db, AUTHORIZED_ADMIN_EMAILS, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

export function initAuth({ onLoginSuccess, onLogout }) {
  const loginSection = document.getElementById("loginSection");
  const panelSection = document.getElementById("panelSection");
  const adminAuthForm = document.getElementById("adminAuthForm");
  const authErrMsg = document.getElementById("authErrMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const togglePassBtn = document.getElementById("togglePasswordVisibilityBtn");
  const loginPassword = document.getElementById("loginPassword");
  const loginEmail = document.getElementById("loginEmail");

  const loginFormWrapper = document.getElementById("loginFormWrapper");
  const forgotFormWrapper = document.getElementById("forgotFormWrapper");
  const showForgotBtn = document.getElementById("showForgotBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const sendResetLinkBtn = document.getElementById("sendResetLinkBtn");
  const resetEmail = document.getElementById("resetEmail");
  const resetErrMsg = document.getElementById("resetErrMsg");
  const resetSuccessMsg = document.getElementById("resetSuccessMsg");

  const auth = getFirebaseAuth() || defaultAuth;

  // Toggle Password Visibility
  if (togglePassBtn && loginPassword) {
    togglePassBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isPassword = loginPassword.type === "password";
      loginPassword.type = isPassword ? "text" : "password";
      togglePassBtn.textContent = isPassword ? "Slėpti slaptažodį" : "Rodyti slaptažodį";
    });
  }

  // Google Sign-In Handler
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      authErrMsg.classList.add("d-none");
      const originalContent = googleLoginBtn.innerHTML;
      googleLoginBtn.disabled = true;
      googleLoginBtn.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:8px;">
          Jungiamasi prie Google...
        </span>
      `;

      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (!activeAuth || typeof firebase === "undefined" || !firebase.auth) {
          throw new Error("Autentifikavimo sistema nepasiekiama. Perkraukite puslapį.");
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await activeAuth.signInWithPopup(provider);
        showToast("Sėkmingai prisijungta su Google paskyra!");
      } catch (err) {
        console.error("Google login error:", err);
        authErrMsg.classList.remove("d-none");
        if (err.code === "auth/popup-blocked") {
          authErrMsg.textContent = "Naršyklė užblokavo iškylantįjį langą. Leiskite „Pop-up“ langus šioje naršyklėje ir bandykite vėl.";
        } else if (err.code === "auth/popup-closed-by-user") {
          authErrMsg.textContent = "Google prisijungimo langas buvo uždarytas prieš užbaigiant veiksmą.";
        } else if (err.code === "auth/cancelled-popup-request") {
          authErrMsg.textContent = "Užklausa buvo atšaukta. Bandykite dar kartą.";
        } else {
          authErrMsg.textContent = "Klaida prisijungiant su Google: " + (err.message || err.code);
        }
      } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = originalContent;
      }
    });
  }

  if (auth && typeof auth.onAuthStateChanged === "function") {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const emailLower = (user.email || "").toLowerCase();
        const isSuperAdmin = emailLower === PRIMARY_SUPERADMIN_EMAIL.toLowerCase();

        // Check Firestore user doc for account status and assigned role
        let userDoc = null;
        if (db) {
          try {
            const docId = emailLower.replace(/[^a-zA-Z0-9_-]/g, "_");
            let docSnap = await db.collection("users").doc(docId).get();
            if (!docSnap.exists && user.uid) {
              docSnap = await db.collection("users").doc(user.uid).get();
            }
            if (docSnap.exists) {
              userDoc = docSnap.data();
            }
          } catch (err) {
            console.warn("User status check notice:", err);
          }
        }

        // Check if user is blocked / suspended
        if (userDoc && userDoc.status === "suspended" && !isSuperAdmin) {
          auth.signOut();
          loginSection.classList.remove("d-none");
          panelSection.classList.add("d-none");
          authErrMsg.classList.remove("d-none");
          authErrMsg.textContent = "Prieiga apribota: ši paskyra yra užblokuota administratoriaus.";
          return;
        }

        const isAuthorized =
          isSuperAdmin ||
          AUTHORIZED_ADMIN_EMAILS.includes(emailLower) ||
          (userDoc && (userDoc.role === "admin" || userDoc.role === "moderator" || userDoc.role === "judge" || userDoc.role === "accountant"));

        if (isAuthorized) {
          if (db && user.uid) {
            try {
              const assignedRole = isSuperAdmin ? "admin" : (userDoc?.role || "admin");
              await db.collection("users").doc(user.uid).set({
                email: emailLower,
                role: assignedRole,
                status: "active",
                lastLogin: new Date().toISOString(),
                uid: user.uid
              }, { merge: true });
            } catch (syncErr) {
              console.warn("UID doc sync notice:", syncErr.message);
            }
          }
          loginSection.classList.add("d-none");
          panelSection.classList.remove("d-none");
          authErrMsg.classList.add("d-none");
          onLoginSuccess(user);
        } else {
          auth.signOut();
          loginSection.classList.remove("d-none");
          panelSection.classList.add("d-none");
          authErrMsg.classList.remove("d-none");
          authErrMsg.textContent = `Prieiga apribota: vartotojui ${emailLower} nesuteiktos administratoriaus ar komandos teisės.`;
        }
      } else {
        loginSection.classList.remove("d-none");
        panelSection.classList.add("d-none");
        onLogout();
      }
    });
  }

  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      authErrMsg.classList.add("d-none");
      
      const email = (loginEmail ? loginEmail.value : document.getElementById("loginEmail").value || "").trim().toLowerCase();
      const pass = (loginPassword ? loginPassword.value : document.getElementById("loginPassword").value || "");

      if (!email || !pass) {
        authErrMsg.classList.remove("d-none");
        authErrMsg.textContent = "Įveskite el. pašto adresą ir slaptažodį.";
        return;
      }

      const activeAuth = getFirebaseAuth() || auth;
      if (!activeAuth) {
        authErrMsg.classList.remove("d-none");
        authErrMsg.textContent = "Autentifikavimo tarnyba kraunasi. Palaukite akimirką ir bandykite vėl.";
        return;
      }

      loginSubmitBtn.disabled = true;
      const originalSubmitText = loginSubmitBtn.innerHTML;
      loginSubmitBtn.innerHTML = `<span>Jungiamasi...</span>`;

      try {
        await activeAuth.signInWithEmailAndPassword(email, pass);
        showToast("Sėkmingai prisijungta!");
      } catch (err) {
        console.error("Sign-in error:", err);
        authErrMsg.classList.remove("d-none");
        
        const code = err.code || "";
        if (code === "auth/wrong-password" || code === "auth/invalid-login-credentials" || code === "auth/invalid-credential") {
          authErrMsg.textContent = "Neteisingas slaptažodis arba el. paštas. Jeigu pamiršote arba dar nenustatėte slaptažodžio, paspauskite „Nustatyti / Pamiršau slaptažodį“ žemiau arba prisijunkite su Google paskyra.";
        } else if (code === "auth/user-not-found") {
          authErrMsg.textContent = "Paskyra su šiuo el. pašto adresu nerasta. Spauskite „Nustatyti / Pamiršau slaptažodį“ arba prisijunkite su Google paskyra.";
        } else if (code === "auth/invalid-email") {
          authErrMsg.textContent = "Neteisingas el. pašto adreso formatas.";
        } else if (code === "auth/too-many-requests") {
          authErrMsg.textContent = "Per daug nesėkmingų bandymų. Saugumo sumetimais bandykite vėliau arba atstatykite slaptažodį.";
        } else if (code === "auth/network-request-failed") {
          authErrMsg.textContent = "Tinklo ryšio klaida. Patikrinkite interneto ryšį ir bandykite dar kartą.";
        } else {
          authErrMsg.textContent = err.message || "Nepavyko prisijungti. Patikrinkite duomenis.";
        }
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = originalSubmitText;
      }
    });
  }

  if (showForgotBtn && backToLoginBtn) {
    showForgotBtn.addEventListener("click", () => {
      loginFormWrapper.classList.add("d-none");
      forgotFormWrapper.classList.remove("d-none");
      resetErrMsg.classList.add("d-none");
      resetSuccessMsg.classList.add("d-none");
      if (loginEmail && resetEmail && loginEmail.value) {
        resetEmail.value = loginEmail.value.trim();
      }
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

      sendResetLinkBtn.disabled = true;
      const originalResetText = sendResetLinkBtn.innerHTML;
      sendResetLinkBtn.innerHTML = "<span>Siunčiama nuoroda...</span>";

      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (!activeAuth) throw new Error("Firebase Auth tarnyba nepasiekiama.");
        await activeAuth.sendPasswordResetEmail(email);
        resetSuccessMsg.classList.remove("d-none");
        resetSuccessMsg.textContent = `Nuoroda slaptažodžio nustatymui išsiųsta į ${email}. Pasitikrinkite savo pašto dėžutę!`;
        showToast("Slaptažodžio atstatymo nuoroda išsiųsta!");
      } catch (err) {
        resetErrMsg.classList.remove("d-none");
        if (err.code === "auth/user-not-found") {
          resetErrMsg.textContent = "Vartotojas dar nesukurtas Firebase sistemoje. Galite prisijungti su Google paskyra arba kreiptis į administratorių.";
        } else {
          resetErrMsg.textContent = "Nepavyko išsiųsti nuorodos: " + (err.message || err.code);
        }
      } finally {
        sendResetLinkBtn.disabled = false;
        sendResetLinkBtn.innerHTML = originalResetText;
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (activeAuth) await activeAuth.signOut();
        showToast("Sėkmingai atsijungta.");
      } catch (err) {
        showToast("Klaida atsijungiant: " + err.message, "error");
      }
    });
  }
}

export async function sendAdminInviteLink(targetEmail) {
  const activeAuth = getFirebaseAuth() || auth;
  const currentUser = activeAuth ? activeAuth.currentUser : null;
  if (!currentUser) {
    throw new Error("Privalote būti prisijungęs.");
  }

  if (currentUser.email.toLowerCase() !== PRIMARY_SUPERADMIN_EMAIL) {
    throw new Error("Tik pagrindinis administratorius turi teisę siųsti prieigos nuorodas.");
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Nurodykite el. pašto adresą.");
  }

  if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
    AUTHORIZED_ADMIN_EMAILS.push(cleanEmail);
  }

  try {
    await activeAuth.sendPasswordResetEmail(cleanEmail);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      throw new Error("Vartotojas " + cleanEmail + " dar nesukurtas Firebase Authentication skiltyje. Pirmiausia pridėkite jį Firebase Console -> Authentication -> Users.");
    }
    throw err;
  }
}