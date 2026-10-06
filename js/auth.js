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
      humanExplanation = "Neteisingas el. paštas arba slaptažodis.";
      break;
    case "auth/user-not-found":
      humanExplanation = "Vartotojas nerastas. Patikrinkite el. paštą.";
      break;
    case "auth/invalid-email":
      humanExplanation = "Neteisingas el. pašto adreso formatas.";
      break;
    case "auth/too-many-requests":
      humanExplanation = "Per daug bandymų. Prašome pabandyti vėliau.";
      break;
    case "auth/network-request-failed":
      humanExplanation = "Tinklo ryšio sutrikimas. Patikrinkite internetą.";
      break;
    case "auth/popup-blocked":
      humanExplanation = "Naršyklė užblokavo iškylantįjį langą.";
      break;
    case "auth/popup-closed-by-user":
      humanExplanation = "Prisijungimo langas buvo uždarytas.";
      break;
    case "auth/cancelled-popup-request":
      humanExplanation = "Prisijungimas atšauktas.";
      break;
    case "auth/user-disabled":
      humanExplanation = "Paskyra yra deaktyvuota administratoriaus.";
      break;
    case "auth/operation-not-allowed":
      humanExplanation = "Prisijungimo būdas laikinai nepasiekiamas.";
      break;
    default:
      humanExplanation = rawMessage || defaultMsg;
  }

  // Display short, concise toast popup
  showToast(humanExplanation, "error");

  // Display clean concise inline alert
  if (targetElement) {
    targetElement.classList.remove("d-none");
    targetElement.style.display = "block";
    targetElement.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-weight:500;">
        <span style="font-size:1rem; line-height:1;">⚠️</span>
        <span style="flex:1;">${escapeHtml(humanExplanation)}</span>
      </div>
    `;
  }
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
  const activationFormWrapper = document.getElementById("activationFormWrapper");
  const showForgotBtn = document.getElementById("showForgotBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const sendResetLinkBtn = document.getElementById("sendResetLinkBtn");
  const resetEmail = document.getElementById("resetEmail");
  const resetErrMsg = document.getElementById("resetErrMsg");
  const resetSuccessMsg = document.getElementById("resetSuccessMsg");

  // Account Activation Elements
  const activationForm = document.getElementById("activationForm");
  const actTokenInput = document.getElementById("actToken");
  const actEmailInput = document.getElementById("actEmail");
  const actCodeInput = document.getElementById("actCode");
  const actNameInput = document.getElementById("actName");
  const actSurnameInput = document.getElementById("actSurname");
  const actPasswordInput = document.getElementById("actPassword");
  const actRoleLabel = document.getElementById("actRoleLabel");
  const actErrMsg = document.getElementById("actErrMsg");
  const actSuccessMsg = document.getElementById("actSuccessMsg");
  const submitActivationBtn = document.getElementById("submitActivationBtn");
  const backToLoginFromActBtn = document.getElementById("backToLoginFromActBtn");

  const currentUserBadge = document.getElementById("currentUserBadge");
  const currentUserName = document.getElementById("currentUserName");
  const currentUserRole = document.getElementById("currentUserRole");

  const auth = getFirebaseAuth() || defaultAuth;

  // 1. Check for Invitation Token in URL (?invite=... or ?token=...)
  const checkInviteInUrl = async () => {
    if (typeof window === "undefined" || !window.location) return;
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get("invite") || urlParams.get("invite_token") || urlParams.get("token");
    const prefillCode = urlParams.get("code");

    if (inviteToken && activationFormWrapper) {
      if (loginFormWrapper) loginFormWrapper.classList.add("d-none");
      if (forgotFormWrapper) forgotFormWrapper.classList.add("d-none");
      activationFormWrapper.classList.remove("d-none");

      if (actTokenInput) actTokenInput.value = inviteToken;
      if (prefillCode && actCodeInput) actCodeInput.value = prefillCode;

      try {
        const resp = await fetch(`/api/admin/invite-info?token=${encodeURIComponent(inviteToken)}`);
        const data = await resp.json();
        if (resp.ok && data.success && data.invitation) {
          const inv = data.invitation;
          if (actEmailInput) actEmailInput.value = inv.email || "";
          if (actNameInput && inv.name) actNameInput.value = inv.name;
          if (actSurnameInput && inv.surname) actSurnameInput.value = inv.surname;
          if (inv.code && actCodeInput && !actCodeInput.value) actCodeInput.value = inv.code;
          if (actRoleLabel) {
            const roleLabels = {
              admin: "Administratorius (Pilna prieiga)",
              moderator: "Moderatorius (Paraiškos ir turinys)",
              judge: "Teisėjas / Komisijos narys",
              accountant: "Buhalteris",
              viewer: "Žiūrovas (Peržiūra)"
            };
            actRoleLabel.textContent = `Priskirta rolė: ${roleLabels[inv.role] || inv.role}`;
          }
        } else if (data && data.error) {
          displayAuthError(actErrMsg, data.error);
        }
      } catch (err) {
        console.warn("Could not retrieve invite info:", err);
      }
    }
  };

  checkInviteInUrl();

  // 2. Account Activation Submission
  const doActivateAccount = async () => {
    clearAuthError(actErrMsg);
    if (actSuccessMsg) {
      actSuccessMsg.classList.add("d-none");
      actSuccessMsg.textContent = "";
    }

    const token = (actTokenInput ? actTokenInput.value : "").trim();
    const code = (actCodeInput ? actCodeInput.value : "").trim();
    const password = (actPasswordInput ? actPasswordInput.value : "").trim();
    const name = (actNameInput ? actNameInput.value : "").trim();
    const surname = (actSurnameInput ? actSurnameInput.value : "").trim();
    const email = (actEmailInput ? actEmailInput.value : "").trim();

    if (!token) {
      displayAuthError(actErrMsg, "Trūksta pakvietimo žetono.");
      return;
    }
    if (!code || code.length < 4) {
      displayAuthError(actErrMsg, "Įveskite 6 skaitmenų patvirtinimo kodą iš el. laiško.");
      return;
    }
    if (!password || password.length < 6) {
      displayAuthError(actErrMsg, "Slaptažodis turi būti bent 6 simbolių ilgio.");
      return;
    }

    const btn = submitActivationBtn;
    const origHtml = btn ? btn.innerHTML : "";
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>Aktyvuojama...</span>`;
    }

    try {
      const resp = await fetch("/api/admin/activate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code, password, name, surname })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || "Nepavyko aktyvuoti paskyros.");
      }

      if (data.token) {
        sessionStorage.setItem("admin_jwt_token", data.token);
      }

      showToast("Paskyra sėkmingai aktyvuota!", "success");
      if (actSuccessMsg) {
        actSuccessMsg.classList.remove("d-none");
        actSuccessMsg.textContent = "Paskyra sėkmingai aktyvuota! Jungiamasi prie sistemos...";
      }

      // Try logging in via Firebase Auth if client account exists or prompt login
      const activeAuth = getFirebaseAuth() || auth;
      if (activeAuth && email) {
        try {
          await activeAuth.signInWithEmailAndPassword(email, password);
          return;
        } catch (authErr) {
          // If Firebase Auth user was just provisioned on backend
          console.info("Direct Firebase signin note after activation:", authErr.message);
        }
      }

      // Switch back to login form with prefilled email
      setTimeout(() => {
        if (activationFormWrapper) activationFormWrapper.classList.add("d-none");
        if (loginFormWrapper) loginFormWrapper.classList.remove("d-none");
        if (loginEmail) loginEmail.value = email;
        if (loginPassword) loginPassword.value = password;
        showToast("Įveskite ką tik sukurtą slaptažodį ir prisijunkite.");
      }, 1500);

    } catch (err) {
      console.error("Account activation error:", err);
      displayAuthError(actErrMsg, err.message || "Nepavyko aktyvuoti paskyros.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  };

  if (submitActivationBtn) {
    submitActivationBtn.onclick = (e) => {
      if (e) e.preventDefault();
      doActivateAccount();
    };
  }
  if (activationForm) {
    activationForm.onsubmit = (e) => {
      if (e) e.preventDefault();
      doActivateAccount();
      return false;
    };
  }
  if (backToLoginFromActBtn) {
    backToLoginFromActBtn.onclick = (e) => {
      if (e) e.preventDefault();
      if (activationFormWrapper) activationFormWrapper.classList.add("d-none");
      if (loginFormWrapper) loginFormWrapper.classList.remove("d-none");
      clearAuthError(authErrMsg);
    };
  }

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
      displayAuthError(authErrMsg, "Autentifikavimo tarnyba kraunasi. Palaukite akimirką.");
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
      console.warn("Direct Firebase auth attempt, checking token session fallback:", err.message);
      try {
        const res = await fetch("/api/admin/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok && data.success && data.token) {
          sessionStorage.setItem("admin_jwt_token", data.token);
          sessionStorage.setItem("admin_user_email", data.user.email);
          sessionStorage.setItem("admin_user_role", data.user.role);
          sessionStorage.setItem("admin_user_name", (data.user.name ? `${data.user.name} ${data.user.surname || ''}` : data.user.email).trim());

          if (loginSection) loginSection.classList.add("d-none");
          if (panelSection) panelSection.classList.remove("d-none");
          if (currentUserBadge) currentUserBadge.classList.remove("d-none");
          if (currentUserName) currentUserName.textContent = data.user.name ? `${data.user.name} ${data.user.surname || ''}`.trim() : data.user.email;
          if (currentUserRole) {
            const roleLabels = {
              admin: data.user.isSuperAdmin ? "Vyr. Administratorius" : "Administratorius",
              editor: "Redaktorius",
              judge: "Teisėjas (Komisija)",
              moderator: "Moderatorius",
              accountant: "Buhalteris",
              viewer: "Žiūrovas"
            };
            currentUserRole.textContent = roleLabels[data.user.role] || data.user.role;
          }
          clearAuthError(authErrMsg);
          showToast(`Sėkmingai prisijungta kaip ${data.user.name || data.user.email}!`, "success");
          currentOnLoginSuccess(data.user);
          return;
        }
      } catch (fallbackErr) {
        console.warn("Token fallback error:", fallbackErr);
      }
      displayAuthError(authErrMsg, err, "Nepavyko prisijungti prie valdymo skydo");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Prisijungti</span>`;
      }
    }
  };

  // Quick Demo Login Bindings for Smooth Role Testing
  const bindQuickLogin = (btnId, emailVal, passVal) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.onclick = (e) => {
        if (e) e.preventDefault();
        const emInput = loginEmail || document.getElementById("loginEmail");
        const pwInput = loginPassword || document.getElementById("loginPassword");
        if (emInput) emInput.value = emailVal;
        if (pwInput) pwInput.value = passVal;
        doLogin();
      };
    }
  };

  bindQuickLogin("quickLoginSuper", "azuolynasfilmfestival@gmail.com", "Festivalis2026!");
  bindQuickLogin("quickLoginKarina", "karina.brdar@gmail.com", "Festivalis2026!");
  bindQuickLogin("quickLoginEditor", "redaktorius@azuolynasfest.lt", "Festivalis2026!");
  bindQuickLogin("quickLoginJudge", "teisejas.komisija@gmail.com", "Festivalis2026!");

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
      if (activationFormWrapper) activationFormWrapper.classList.add("d-none");
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
      if (activationFormWrapper) activationFormWrapper.classList.add("d-none");
      if (loginFormWrapper) loginFormWrapper.classList.remove("d-none");
      clearAuthError(authErrMsg);
    };
  }

  // 7. Send Password Reset Link Handler
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

  // 8. Logout Handler
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

  // 9. Listen to Auth State Changes
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
          if (currentUserBadge) currentUserBadge.classList.add("d-none");
          if (loginSection) loginSection.classList.remove("d-none");
          if (panelSection) panelSection.classList.add("d-none");
          displayAuthError(authErrMsg, "Prieiga apribota: ši paskyra yra užblokuota administratoriaus.");
          return;
        }

        const isAuthorized =
          isSuperAdmin ||
          AUTHORIZED_ADMIN_EMAILS.includes(emailLower) ||
          (userDoc && (userDoc.role === "admin" || userDoc.role === "editor" || userDoc.role === "moderator" || userDoc.role === "judge" || userDoc.role === "accountant"));

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

          const activeRole = isSuperAdmin ? "admin" : (userDoc?.role || "admin");
          sessionStorage.setItem("admin_user_email", emailLower);
          sessionStorage.setItem("admin_user_role", activeRole);

          // Update user identity pill in sidebar/topbar
          if (currentUserBadge) {
            currentUserBadge.classList.remove("d-none");
            if (currentUserName) {
              if (isSuperAdmin) {
                currentUserName.textContent = "Pagrindinis Administratorius";
              } else if (emailLower === "karina.brdar@gmail.com") {
                currentUserName.textContent = "Karina Brdar";
              } else if (userDoc && (userDoc.name || userDoc.surname)) {
                currentUserName.textContent = `${userDoc.name || ""} ${userDoc.surname || ""}`.trim();
              } else {
                currentUserName.textContent = user.displayName || emailLower.split("@")[0];
              }
            }
            if (currentUserRole) {
              const roleDisplayMap = {
                admin: isSuperAdmin ? "Vyr. Administratorius" : "Administratorius",
                editor: "Redaktorius",
                judge: "Teisėjas (Komisija)",
                moderator: "Moderatorius",
                accountant: "Buhalteris",
                viewer: "Žiūrovas"
              };
              currentUserRole.textContent = roleDisplayMap[activeRole] || activeRole;
            }
          }

          // If judge logs in, auto switch to voting & judging tab
          if (activeRole === "judge") {
            setTimeout(() => {
              const votingBtn = document.getElementById("tabVotingBtn");
              if (votingBtn) votingBtn.click();
            }, 100);
          }

          if (loginSection) loginSection.classList.add("d-none");
          if (panelSection) panelSection.classList.remove("d-none");
          clearAuthError(authErrMsg);
          currentOnLoginSuccess(user);
        } else {
          auth.signOut();
          if (currentUserBadge) currentUserBadge.classList.add("d-none");
          if (loginSection) loginSection.classList.remove("d-none");
          if (panelSection) panelSection.classList.add("d-none");
          displayAuthError(authErrMsg, `Prieiga apribota: vartotojui ${emailLower} nesuteiktos administratoriaus teisės.`);
        }
      } else {
        if (currentUserBadge) currentUserBadge.classList.add("d-none");
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
    throw new Error("Privalote būti prisijungęs administratoriaus teisėmis.");
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Nurodykite el. pašto adresą.");
  }

  const jwtToken = sessionStorage.getItem("admin_jwt_token");
  const headers = {
    "Content-Type": "application/json",
    "x-admin-email": currentUser.email
  };
  if (jwtToken) {
    headers["Authorization"] = `Bearer ${jwtToken}`;
  }

  const res = await fetch("/api/admin/send-access-link", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: cleanEmail,
      role: "admin",
      adminEmail: currentUser.email
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Nepavyko išsiųsti prieigos nuorodos.");
  }

  if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
    AUTHORIZED_ADMIN_EMAILS.push(cleanEmail);
  }

  return data;
}