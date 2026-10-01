import { auth as defaultAuth, getFirebaseAuth, db, AUTHORIZED_ADMIN_EMAILS, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayAuthError(targetElement, err, defaultMsg = "Autentifikavimo klaida") {
  if (!targetElement) return;
  targetElement.classList.remove("d-none");
  targetElement.style.display = "block";

  let errorCode = "";
  let rawMessage = "";

  if (typeof err === "string") {
    rawMessage = err;
  } else if (err && typeof err === "object") {
    errorCode = err.code || "";
    rawMessage = err.message || String(err);
  } else {
    rawMessage = defaultMsg;
  }

  let humanExplanation = "";
  switch (errorCode) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
      humanExplanation = "Neteisingas slaptažodis arba el. pašto adresas. Jeigu pamiršote arba dar nesukūrėte slaptažodžio, pasinaudokite mygtuku „Nustatyti / Pamiršau slaptažodį“ žemiau arba prisijunkite su Google paskyra.";
      break;
    case "auth/user-not-found":
      humanExplanation = "Paskyra su šiuo el. pašto adresu nerasta Firebase sistemoje. Galite prisijungti su Google paskyra arba paspausti „Nustatyti / Pamiršau slaptažodį“.";
      break;
    case "auth/invalid-email":
      humanExplanation = "Neteisingas el. pašto adreso formatas. Patikrinkite įvestą adresą.";
      break;
    case "auth/too-many-requests":
      humanExplanation = "Prieiga laikinai užblokuota dėl per didelio nesėkmingų bandymų skaičiaus. Bandykite vėliau arba atkurkite slaptažodį.";
      break;
    case "auth/network-request-failed":
      humanExplanation = "Tinklo ryšio klaida. Patikrinkite interneto ryšį ir bandykite vėl.";
      break;
    case "auth/popup-blocked":
      humanExplanation = "Naršyklė užblokavo Google iškylantįjį langą. Leiskite iškylančius langus („Pop-up“) šiam puslapiui arba bandykite dar kartą.";
      break;
    case "auth/popup-closed-by-user":
      humanExplanation = "Google prisijungimo langas buvo uždarytas prieš užbaigiant veiksmą.";
      break;
    case "auth/cancelled-popup-request":
      humanExplanation = "Prisijungimo užklausa buvo atšaukta.";
      break;
    case "auth/user-disabled":
      humanExplanation = "Ši paskyra yra deaktyvuota administratoriaus.";
      break;
    case "auth/operation-not-allowed":
      humanExplanation = "Šis prisijungimo būdas nėra įjungtas Firebase Console valdymo skyde.";
      break;
    default:
      humanExplanation = rawMessage || defaultMsg;
  }

  targetElement.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:8px;">
      <span style="font-size:1.1rem; line-height:1.2;">⚠️</span>
      <div style="flex:1;">
        <div style="font-weight:600; margin-bottom:3px;">${escapeHtml(humanExplanation)}</div>
        ${errorCode ? `<div style="font-size:0.75rem; opacity:0.85; font-family:monospace; margin-top:3px;">Sistemos kodas: ${escapeHtml(errorCode)}</div>` : ""}
        ${rawMessage && rawMessage !== humanExplanation ? `<div style="font-size:0.75rem; opacity:0.75; margin-top:2px;">${escapeHtml(rawMessage)}</div>` : ""}
      </div>
    </div>
  `;
}

function clearAuthError(targetElement) {
  if (!targetElement) return;
  targetElement.classList.add("d-none");
  targetElement.style.display = "none";
  targetElement.innerHTML = "";
}

let currentOnLoginSuccess = () => {};
let currentOnLogout = () => {};
let isAuthStateListenerAttached = false;

export function initAuth(options = {}) {
  if (typeof options.onLoginSuccess === "function") {
    currentOnLoginSuccess = options.onLoginSuccess;
  }
  if (typeof options.onLogout === "function") {
    currentOnLogout = options.onLogout;
  }

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

  // 1. Password Visibility Toggle
  if (togglePassBtn && loginPassword) {
    togglePassBtn.onclick = (e) => {
      if (e) e.preventDefault();
      const isPassword = loginPassword.type === "password";
      loginPassword.type = isPassword ? "text" : "password";
      togglePassBtn.textContent = isPassword ? "Slėpti slaptažodį" : "Rodyti slaptažodį";
    };
  }

  // 2. Google Sign-In Handler
  if (googleLoginBtn) {
    googleLoginBtn.onclick = async (e) => {
      if (e) e.preventDefault();
      clearAuthError(authErrMsg);
      const originalContent = googleLoginBtn.innerHTML;
      googleLoginBtn.disabled = true;
      googleLoginBtn.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:16px; height:16px; border:2px solid rgba(111,165,138,0.3); border-top-color:var(--accent-light); border-radius:50%; animation:spin 0.8s linear infinite;"></span>
          <span>Jungiamasi prie Google...</span>
        </span>
      `;

      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (!activeAuth || typeof firebase === "undefined" || !firebase.auth) {
          throw new Error("Autentifikavimo sistema nepasiekiama. Perkraukite puslapį.");
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        try {
          await activeAuth.signInWithPopup(provider);
        } catch (popupErr) {
          if (popupErr.code === "auth/popup-blocked") {
            await activeAuth.signInWithRedirect(provider);
            return;
          }
          throw popupErr;
        }
        showToast("Sėkmingai prisijungta su Google paskyra!");
      } catch (err) {
        console.error("Google sign-in error:", err);
        displayAuthError(authErrMsg, err, "Nepavyko prisijungti su Google");
      } finally {
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = originalContent;
      }
    };
  }

  // 3. Email & Password Sign-in logic
  const doLogin = async () => {
    clearAuthError(authErrMsg);

    const emailElem = loginEmail || document.getElementById("loginEmail");
    const passElem = loginPassword || document.getElementById("loginPassword");
    const submitBtn = loginSubmitBtn || document.getElementById("loginSubmitBtn");

    const email = (emailElem ? emailElem.value : "").trim().toLowerCase();
    const pass = passElem ? passElem.value : "";

    if (!email || !pass) {
      displayAuthError(authErrMsg, "Įveskite el. pašto adresą ir slaptažodį.");
      return;
    }

    const activeAuth = getFirebaseAuth() || auth;
    if (!activeAuth) {
      displayAuthError(authErrMsg, "Autentifikavimo tarnyba kraunasi. Palaukite akimirką ir bandykite vėl.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
          <span>Jungiamasi...</span>
        </span>
      `;
    }

    try {
      await activeAuth.signInWithEmailAndPassword(email, pass);
      showToast("Sėkmingai prisijungta!");
    } catch (err) {
      console.error("Email sign-in error:", err);
      displayAuthError(authErrMsg, err, "Nepavyko prisijungti prie valdymo skydo");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Prisijungti</span>`;
      }
    }
  };

  // Bind Submit Button & Enter keys
  if (loginSubmitBtn) {
    loginSubmitBtn.onclick = (e) => {
      if (e) e.preventDefault();
      doLogin();
    };
  }

  if (adminAuthForm) {
    adminAuthForm.onsubmit = (e) => {
      if (e) e.preventDefault();
      doLogin();
      return false;
    };
  }

  if (loginEmail) {
    loginEmail.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doLogin();
      }
    };
  }

  if (loginPassword) {
    loginPassword.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doLogin();
      }
    };
  }

  // 4. Toggle Forgot Password Views
  if (showForgotBtn) {
    showForgotBtn.onclick = (e) => {
      if (e) e.preventDefault();
      if (loginFormWrapper) loginFormWrapper.classList.add("d-none");
      if (forgotFormWrapper) forgotFormWrapper.classList.remove("d-none");
      clearAuthError(resetErrMsg);
      if (resetSuccessMsg) {
        resetSuccessMsg.classList.add("d-none");
        resetSuccessMsg.style.display = "none";
        resetSuccessMsg.textContent = "";
      }
      if (loginEmail && resetEmail && loginEmail.value) {
        resetEmail.value = loginEmail.value.trim();
      }
    };
  }

  if (backToLoginBtn) {
    backToLoginBtn.onclick = (e) => {
      if (e) e.preventDefault();
      if (forgotFormWrapper) forgotFormWrapper.classList.add("d-none");
      if (loginFormWrapper) loginFormWrapper.classList.remove("d-none");
      clearAuthError(authErrMsg);
    };
  }

  // 5. Send Password Reset Link Handler
  if (sendResetLinkBtn) {
    sendResetLinkBtn.onclick = async (e) => {
      if (e) e.preventDefault();
      const email = (resetEmail ? resetEmail.value : document.getElementById("resetEmail")?.value || "").trim().toLowerCase();
      clearAuthError(resetErrMsg);
      if (resetSuccessMsg) {
        resetSuccessMsg.classList.add("d-none");
        resetSuccessMsg.style.display = "none";
        resetSuccessMsg.textContent = "";
      }

      if (!email) {
        displayAuthError(resetErrMsg, "Įveskite autorizuotą el. pašto adresą.");
        return;
      }

      sendResetLinkBtn.disabled = true;
      const originalResetText = sendResetLinkBtn.innerHTML;
      sendResetLinkBtn.innerHTML = `
        <span style="display:inline-flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
          <span>Siunčiama nuoroda...</span>
        </span>
      `;

      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (!activeAuth) throw new Error("Firebase Auth tarnyba nepasiekiama.");
        await activeAuth.sendPasswordResetEmail(email);
        if (resetSuccessMsg) {
          resetSuccessMsg.classList.remove("d-none");
          resetSuccessMsg.style.display = "block";
          resetSuccessMsg.textContent = `Nuoroda slaptažodžio nustatymui išsiųsta į ${email}. Pasitikrinkite savo pašto dėžutę!`;
        }
        showToast("Slaptažodžio atstatymo nuoroda išsiųsta!");
      } catch (err) {
        console.error("Password reset error:", err);
        displayAuthError(resetErrMsg, err, "Nepavyko išsiųsti nuorodos");
      } finally {
        sendResetLinkBtn.disabled = false;
        sendResetLinkBtn.innerHTML = originalResetText;
      }
    };
  }

  // 6. Logout Handler
  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      if (e) e.preventDefault();
      try {
        const activeAuth = getFirebaseAuth() || auth;
        if (activeAuth) await activeAuth.signOut();
        showToast("Sėkmingai atsijungta.");
      } catch (err) {
        showToast("Klaida atsijungiant: " + err.message, "error");
      }
    };
  }

  // 7. Listen to Auth State Changes
  if (!isAuthStateListenerAttached && auth && typeof auth.onAuthStateChanged === "function") {
    isAuthStateListenerAttached = true;
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
          if (loginSection) loginSection.classList.remove("d-none");
          if (panelSection) panelSection.classList.add("d-none");
          displayAuthError(authErrMsg, "Prieiga apribota: ši paskyra yra užblokuota administratoriaus.");
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
          if (loginSection) loginSection.classList.add("d-none");
          if (panelSection) panelSection.classList.remove("d-none");
          clearAuthError(authErrMsg);
          currentOnLoginSuccess(user);
        } else {
          auth.signOut();
          if (loginSection) loginSection.classList.remove("d-none");
          if (panelSection) panelSection.classList.add("d-none");
          displayAuthError(authErrMsg, `Prieiga apribota: vartotojui ${emailLower} nesuteiktos administratoriaus ar komandos teisės.`);
        }
      } else {
        if (loginSection) loginSection.classList.remove("d-none");
        if (panelSection) panelSection.classList.add("d-none");
        currentOnLogout();
      }
    });
  }
}

// Auto-bind auth triggers as soon as the DOM is available
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initAuth();
    });
  } else {
    initAuth();
  }
}

export async function sendAdminInviteLink(targetEmail) {
  const activeAuth = getFirebaseAuth() || defaultAuth;
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