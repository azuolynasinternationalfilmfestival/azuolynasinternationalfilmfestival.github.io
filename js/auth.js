import { auth as defaultAuth, getFirebaseAuth, db, AUTHORIZED_ADMIN_EMAILS, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

async function hasBackendServer() {
  try {
    return Boolean(typeof window !== "undefined" && window.FestivalApi && typeof window.FestivalApi.hasServer === "function" && await window.FestivalApi.hasServer());
  } catch {
    return false;
  }
}

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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
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
        let inv = null;
        if (await hasBackendServer()) {
          const resp = await fetch(`/api/admin/invite-info?token=${encodeURIComponent(inviteToken)}`);
          const data = await resp.json();
          if (resp.ok && data.success && data.invitation) {
            inv = data.invitation;
          } else if (data && data.error) {
            displayAuthError(actErrMsg, data.error);
          }
        } else if (db) {
          const snap = await db.collection("invitations").doc(inviteToken).get();
          if (snap.exists) {
            const docData = snap.data() || {};
            if (docData.status === "accepted") {
              displayAuthError(actErrMsg, "Šis pakvietimas jau panaudotas.");
            } else if (docData.expiresAt && Date.parse(docData.expiresAt) < Date.now()) {
              displayAuthError(actErrMsg, "Šio pakvietimo galiojimas pasibaigė.");
            } else {
              inv = docData;
            }
          } else {
            displayAuthError(actErrMsg, "Pakvietimas nerastas arba nebegalioja.");
          }
        }

        if (inv) {
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
      const activeAuth = getFirebaseAuth() || auth;
      if (await hasBackendServer()) {
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
        if (activeAuth && email) {
          try {
            await activeAuth.signInWithEmailAndPassword(email, password);
            return;
          } catch (authErr) {
            console.info("Direct Firebase signin note after activation:", authErr.message);
          }
        }
      } else {
        if (!db || !activeAuth) {
          throw new Error("Autentifikacijos arba duomenų bazės tarnyba dar kraunasi.");
        }
        const invRef = db.collection("invitations").doc(token);
        const invSnap = await invRef.get();
        if (!invSnap.exists) {
          throw new Error("Pakvietimas nerastas arba jau nebegalioja.");
        }
        const inv = invSnap.data() || {};
        if (inv.status === "accepted") {
          throw new Error("Šis pakvietimas jau buvo aktyvuotas.");
        }
        if (String(inv.code || "").trim() !== code) {
          throw new Error("Neteisingas 6 skaitmenų patvirtinimo kodas.");
        }
        const targetEmail = (inv.email || email || "").trim().toLowerCase();
        if (!targetEmail) {
          throw new Error("Pakvietime nenurodytas el. pašto adresas.");
        }

        let userCred = null;
        try {
          userCred = await activeAuth.createUserWithEmailAndPassword(targetEmail, password);
        } catch (createErr) {
          if (createErr && createErr.code === "auth/email-already-in-use") {
            userCred = await activeAuth.signInWithEmailAndPassword(targetEmail, password);
          } else {
            throw createErr;
          }
        }
        const signedUid = userCred?.user?.uid || activeAuth.currentUser?.uid || "";
        await invRef.update({
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          uid: signedUid
        });
        showToast("Paskyra sėkmingai aktyvuota!", "success");
        return;
      }

      showToast("Paskyra sėkmingai aktyvuota!", "success");
      if (actSuccessMsg) {
        actSuccessMsg.classList.remove("d-none");
        actSuccessMsg.textContent = "Paskyra sėkmingai aktyvuota! Jungiamasi prie sistemos...";
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
      console.error("Firebase authentication failed:", err.code, err.message);
      displayAuthError(authErrMsg, err, "Nepavyko prisijungti prie sistemos");
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
        const emailLower = (user.email || "").trim().toLowerCase();
        const isSuperAdmin = emailLower === PRIMARY_SUPERADMIN_EMAIL.toLowerCase();
        const isWhitelistedAdmin = AUTHORIZED_ADMIN_EMAILS.includes(emailLower);

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
        if (userDoc && userDoc.status === "suspended" && !isWhitelistedAdmin) {
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
              const assignedRole = isWhitelistedAdmin ? "admin" : (userDoc?.role || "admin");
              await db.collection("users").doc(user.uid).set({
                email: emailLower,
                role: assignedRole,
                status: "active",
                lastLogin: new Date().toISOString(),
                uid: user.uid,
                ...(isWhitelistedAdmin ? { canManageUsers: true } : {})
              }, { merge: true });
            } catch (syncErr) {
              console.warn("UID doc sync notice:", syncErr.message);
            }
          }

          const activeRole = isWhitelistedAdmin ? "admin" : (userDoc?.role || "admin");
          sessionStorage.setItem("admin_user_email", emailLower);
          sessionStorage.setItem("admin_user_role", activeRole);

          // Only exchange session JWT when Node backend server is active; static pages use Firebase ID token directly
          if (await hasBackendServer()) {
            try {
              const idToken = await user.getIdToken();
              const tokenRes = await fetch("/api/admin/token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({ email: emailLower })
              });
              if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                if (tokenData && tokenData.token) {
                  sessionStorage.setItem("admin_jwt_token", tokenData.token);
                }
              }
            } catch (tErr) {
              console.warn("JWT exchange notice:", tErr.message);
            }
          }

          // Update user identity pill in sidebar/topbar
          if (currentUserBadge) {
            currentUserBadge.classList.remove("d-none");
            if (currentUserName) {
              if (isSuperAdmin) {
                currentUserName.textContent = "Pagrindinis Administratorius";
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
          sessionStorage.removeItem("admin_jwt_token");
          sessionStorage.removeItem("admin_user_email");
          sessionStorage.removeItem("admin_user_role");
          sessionStorage.removeItem("admin_user_name");
          if (currentUserBadge) currentUserBadge.classList.add("d-none");
          if (loginSection) loginSection.classList.remove("d-none");
          if (panelSection) panelSection.classList.add("d-none");
          displayAuthError(authErrMsg, `Prieiga apribota: vartotojui ${emailLower} nesuteiktos administratoriaus teisės.`);
        }
      } else {
        sessionStorage.removeItem("admin_jwt_token");
        sessionStorage.removeItem("admin_user_email");
        sessionStorage.removeItem("admin_user_role");
        sessionStorage.removeItem("admin_user_name");
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

  if (await hasBackendServer()) {
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

  if (!db) {
    throw new Error("Firestore šiuo metu nepasiekiamas.");
  }

  const nowIso = new Date().toISOString();
  const docId = cleanEmail.replace(/[^a-zA-Z0-9_-]/g, "_");
  const token = "inv_" + Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b => b.toString(16).padStart(2, "0")).join("");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const origin = (typeof window !== "undefined" && window.location && window.location.origin)
    ? window.location.origin
    : "https://www.azuolynasfilmfestival.lt";
  const inviteUrl = `${origin}/admin.html?invite=${encodeURIComponent(token)}`;

  const batch = db.batch();
  batch.set(db.collection("users").doc(docId), {
    uid: docId,
    email: cleanEmail,
    role: "admin",
    status: "active",
    canManageUsers: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    invitedBy: currentUser.email
  }, { merge: true });
  batch.set(db.collection("invitations").doc(token), {
    token,
    code,
    email: cleanEmail,
    role: "admin",
    status: "pending",
    canManageUsers: true,
    createdAt: nowIso,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invitedBy: currentUser.email
  });
  await batch.commit();

  if (window.MailClient && typeof window.MailClient.send === "function") {
    const html = typeof window.generateInviteEmailHtml === "function"
      ? window.generateInviteEmailHtml("lt", {
          name: cleanEmail.split("@")[0],
          email: cleanEmail,
          role: "admin",
          code,
          token,
          inviteUrl,
          invitedBy: currentUser.email
        })
      : `<p>Kvietimas į AISFF administravimo panelę. Aktyvavimo kodas: <b>${code}</b></p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`;
    await window.MailClient.send(db, {
      to: cleanEmail,
      subject: "AISFF | Kvietimas į administravimo panelę",
      html
    });
  }

  if (!AUTHORIZED_ADMIN_EMAILS.includes(cleanEmail)) {
    AUTHORIZED_ADMIN_EMAILS.push(cleanEmail);
  }

  return { success: true, queued: true, token };
}