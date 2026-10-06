import { db, auth, PRIMARY_SUPERADMIN_EMAIL } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";

const ROLE_LABELS = {
  accountant: { lt: "Buhalteris (Sąskaitos & Finansai)", en: "Accountant (Finance & Awards)" },
  editor: { lt: "Redaktorius (Metų leidiniai, tekstai & turinys)", en: "Editor (Editions, Texts & Content)" },
  moderator: { lt: "Moderatorius (Paraiškos & Turinys)", en: "Moderator (Submissions & Review)" },
  judge: { lt: "Teisėjas (Vertinimo komisijos narys)", en: "Judge (Jury & Scoring)" },
  admin: { lt: "Administratorius (Pilnos teisės)", en: "Administrator (Full Access)" },
  viewer: { lt: "Žiūrovas (Tik peržiūra)", en: "Viewer (Read Only)" }
};

let modalElement = null;
let formElement = null;
let onUserInvitedCallback = null;

export function initInviteModal(options = {}) {
  modalElement = document.getElementById("userInviteModal");
  formElement = document.getElementById("userInviteForm");
  onUserInvitedCallback = options.onUserInvited || null;

  if (!modalElement || !formElement) return;

  // Bind close buttons
  const closeBtn = document.getElementById("closeInviteModalBtn");
  const cancelBtn = document.getElementById("cancelInviteBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeInviteModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeInviteModal);

  // Close on backdrop click
  modalElement.addEventListener("click", (e) => {
    if (e.target === modalElement) {
      closeInviteModal();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalElement && !modalElement.classList.contains("d-none") && modalElement.classList.contains("active")) {
      closeInviteModal();
    }
  });

  // Bind form submission
  formElement.addEventListener("submit", handleInviteSubmit);

  // Bind all trigger buttons with data-open-invite-modal
  document.querySelectorAll("[data-open-invite-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const defaultRole = btn.dataset.defaultRole || "moderator";
      openInviteModal({ defaultRole });
    });
  });

  // Global trigger function on window for universal reusability
  window.openInviteUserModal = openInviteModal;
  window.closeInviteUserModal = closeInviteModal;
}

export function openInviteModal({ defaultRole = "moderator", email = "", name = "", surname = "" } = {}) {
  if (!modalElement) {
    modalElement = document.getElementById("userInviteModal");
    formElement = document.getElementById("userInviteForm");
  }
  if (!modalElement || !formElement) return;

  formElement.reset();

  const nameInput = document.getElementById("inviteUserName");
  const surnameInput = document.getElementById("inviteUserSurname");
  const emailInput = document.getElementById("inviteUserEmail");
  const roleSelect = document.getElementById("inviteUserRole");
  const canManageWrap = document.getElementById("inviteCanManageUsersWrap");
  const canManageCheck = document.getElementById("inviteCanManageUsers");

  if (nameInput && name) nameInput.value = name;
  if (surnameInput && surname) surnameInput.value = surname;
  if (emailInput && email) emailInput.value = email;
  if (roleSelect && defaultRole) roleSelect.value = defaultRole;

  const currentEmail = (auth && auth.currentUser && auth.currentUser.email ? auth.currentUser.email : "").toLowerCase();
  const isSuperAdmin = currentEmail === PRIMARY_SUPERADMIN_EMAIL.toLowerCase();
  if (canManageWrap) {
    canManageWrap.style.display = isSuperAdmin ? "block" : "none";
  }
  if (canManageCheck) {
    canManageCheck.checked = false;
  }

  modalElement.classList.remove("d-none");
  modalElement.classList.add("active");

  setTimeout(() => {
    if (nameInput && !name) {
      nameInput.focus();
    } else if (emailInput && !email) {
      emailInput.focus();
    }
  }, 50);
}

export function closeInviteModal() {
  if (!modalElement) {
    modalElement = document.getElementById("userInviteModal");
  }
  if (modalElement) {
    modalElement.classList.remove("active");
    modalElement.classList.add("d-none");
  }
  if (formElement) {
    formElement.reset();
  }
}

async function handleInviteSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("inviteUserName");
  const surnameInput = document.getElementById("inviteUserSurname");
  const emailInput = document.getElementById("inviteUserEmail");
  const roleSelect = document.getElementById("inviteUserRole");
  const langSelect = document.getElementById("inviteUserLang");
  const submitBtn = document.getElementById("submitInviteBtn");

  const name = (nameInput?.value || "").trim();
  const surname = (surnameInput?.value || "").trim();
  const email = (emailInput?.value || "").trim().toLowerCase();
  const role = roleSelect?.value || "moderator";
  const emailLang = langSelect?.value || "lt";
  const canManageUsers = document.getElementById("inviteCanManageUsers")?.checked === true;

  if (!email || !name) {
    showToast("Užpildykite privalomus laukus (Vardą ir El. paštą)!", "error");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    showToast("Nurodykite teisingą el. pašto adresą!", "error");
    return;
  }

  // Set loading state on button
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      <span>Siunčiama per Cloud Functions...</span>
    `;
  }

  const docId = email.replace(/[^a-zA-Z0-9_-]/g, "_");
  const nowIso = new Date().toISOString();
  const currentAdminEmail = (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL;
  const token = generateSecureToken();
  const verificationCode = generateVerificationCode();
  const baseUrl = (typeof window !== "undefined" && window.location && window.location.origin)
    ? window.location.origin
    : "https://azuolynasinternationalfilmfestival.github.io";
  const inviteUrl = `${baseUrl}/admin.html?invite=${token}`;

  let createdSuccessfully = false;
  let activeVerificationCode = verificationCode;
  let activeToken = token;

  try {
    // 1. Call backend /api/admin/invite endpoint
    // This creates the invitation and user in server data, syncs to Firestore via admin credentials,
    // and records administrative activity log
    try {
      const jwtToken = sessionStorage.getItem("admin_jwt_token");
      const headers = { "Content-Type": "application/json" };
      if (jwtToken) headers["Authorization"] = `Bearer ${jwtToken}`;

      const resp = await fetch("/api/admin/invite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          surname,
          email,
          role,
          canManageUsers,
          lang: emailLang,
          adminEmail: currentAdminEmail
        })
      });
      if (resp.ok) {
        const apiData = await resp.json();
        if (apiData && apiData.invitation) {
          activeVerificationCode = apiData.invitation.code || activeVerificationCode;
          activeToken = apiData.invitation.token || activeToken;
        }
        createdSuccessfully = true;
      }
    } catch (apiErr) {
      console.warn("Backend API invite notice:", apiErr.message);
    }

    // 2. Also write directly to Firestore collections 'users' and 'invitations' via client SDK
    if (db) {
      try {
        await db.collection("users").doc(docId).set({
          uid: docId,
          name,
          surname,
          email,
          role,
          status: "active",
          canManageUsers,
          createdAt: nowIso,
          updatedAt: nowIso,
          invitedBy: currentAdminEmail
        }, { merge: true });
        createdSuccessfully = true;
      } catch (fErr) {
        console.warn("Firestore client write users notice:", fErr.message);
      }

      try {
        await db.collection("invitations").doc(activeToken).set({
          token: activeToken,
          code: activeVerificationCode,
          name,
          surname,
          email,
          role,
          status: "pending",
          canManageUsers,
          createdAt: nowIso,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invitedBy: currentAdminEmail
        });
        createdSuccessfully = true;
      } catch (fErr) {
        console.warn("Firestore client write invitations notice:", fErr.message);
      }
    }

    if (!createdSuccessfully) {
      throw new Error("Nepavyko užregistruoti pakvietimo nei per serverio API, nei per Firestore.");
    }

    // 3. Trigger automated email dispatch via Firebase Cloud Functions
    try {
      await dispatchInvitationViaFirebaseCloudFunctions({
        name,
        surname,
        email,
        role,
        code: activeVerificationCode,
        token: activeToken,
        inviteUrl: `${baseUrl}/admin.html?invite=${activeToken}`,
        lang: emailLang,
        invitedBy: currentAdminEmail
      });
    } catch (cfErr) {
      console.warn("Cloud functions email dispatch notice:", cfErr.message);
    }

    // 4. Try triggering Firebase Auth password setup email
    if (auth && typeof auth.sendPasswordResetEmail === "function") {
      try {
        await auth.sendPasswordResetEmail(email);
      } catch (authErr) {
        console.info("Firebase Auth reset email notice (expected for newly invited non-auth accounts):", authErr.code);
      }
    }

    const roleName = (ROLE_LABELS[role] && ROLE_LABELS[role][emailLang]) || role;
    showToast(`Pakvietimas sėkmingai išsiųstas į ${email} (Rolė: ${roleName}, Kodas: ${activeVerificationCode})!`, "success");

    closeInviteModal();

    // Trigger callbacks & events so users table and other modules update immediately
    if (typeof onUserInvitedCallback === "function") {
      onUserInvitedCallback({ email, name, surname, role, code: activeVerificationCode, token: activeToken, canManageUsers });
    }
    window.dispatchEvent(new CustomEvent("user-invited", {
      detail: {
        email,
        name,
        surname,
        role,
        canManageUsers,
        code: activeVerificationCode,
        token: activeToken,
        createdAt: nowIso
      }
    }));

  } catch (err) {
    console.error("Error dispatching user invitation:", err);
    showToast("Klaida siunčiant pakvietimą: " + err.message, "error");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span>Pakviesti / Invite</span>
      `;
    }
  }
}

/**
 * Executes multi-tier Firebase Cloud Functions email dispatch:
 * 1. Firebase Callable Cloud Function (sendUserInvitationEmail)
 * 2. Firestore 'mail' collection queue (triggers Firebase Cloud Function firestore-send-email)
 */
async function dispatchInvitationViaFirebaseCloudFunctions({
  name,
  surname,
  email,
  role,
  code,
  token,
  inviteUrl,
  lang,
  invitedBy
}) {
  let callableSucceeded = false;

  // Tier 1: Callable Cloud Function
  if (typeof firebase !== "undefined" && typeof firebase.functions === "function") {
    try {
      const sendInviteCallable = firebase.functions("europe-west1").httpsCallable("sendUserInvitationEmail");
      const result = await sendInviteCallable({
        name,
        surname,
        email,
        role,
        code,
        token,
        inviteUrl,
        lang,
        invitedBy,
        institution: "Kauno Tarptautinė Gimnazija"
      });
      console.info("Firebase Cloud Function 'sendUserInvitationEmail' result:", result);
      callableSucceeded = true;
    } catch (cfError) {
      console.warn("Firebase Callable Cloud Function note (triggering Firestore queue):", cfError.message);
    }
  }

  // Tier 2: Trigger via Firestore 'mail' collection for Cloud Functions email extension
  if (db) {
    try {
      const fullName = `${name} ${surname}`.trim();
      let htmlContent = "";

      if (typeof window !== "undefined" && typeof window.generateInviteEmailHtml === "function") {
        htmlContent = window.generateInviteEmailHtml(lang, {
          name: fullName,
          email,
          role,
          code,
          token,
          inviteUrl,
          invitedBy
        });
      } else {
        htmlContent = `
          <div style="background:#051512; color:#F8FAF7; padding:24px; font-family:sans-serif; border-radius:8px;">
            <h2 style="color:#6FA58A;">Kvietimas prisijungti prie Kauno Tarptautinės Gimnazijos kino festivalio komandos</h2>
            <p>Sveiki, <b>${fullName}</b>!</p>
            <p>Jums suteikta prieiga prie festivalio valdymo platformos su role: <b>${role.toUpperCase()}</b>.</p>
            <div style="background:#0C241F; border:1px solid #D4AF37; padding:16px; border-radius:6px; margin:16px 0; text-align:center;">
              <p style="margin:0; font-size:12px; color:#D4AF37; text-transform:uppercase;">Aktyvavimo patvirtinimo kodas:</p>
              <h1 style="margin:8px 0; font-size:32px; letter-spacing:6px; color:#ffffff;">${code}</h1>
            </div>
            <p><a href="${inviteUrl}" style="display:inline-block; background:#17453B; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:4px; font-weight:bold;">Aktyvuoti paskyrą &rarr;</a></p>
          </div>
        `;
      }

      await db.collection("mail").add({
        to: email,
        template: "userInvite",
        message: {
          subject: lang === "en"
            ? "Ąžuolynas Film Fest | Staff Team Invitation (Kaunas International Gymnasium)"
            : "Ąžuolynas Film Fest | Kvietimas prisijungti prie komandos (Kauno Tarptautinė Gimnazija)",
          html: htmlContent
        },
        data: {
          name: fullName,
          role,
          code,
          token,
          inviteUrl,
          lang,
          institution: "Kauno Tarptautinė Gimnazija"
        },
        status: "queued",
        createdAt: new Date().toISOString()
      });
    } catch (mailErr) {
      console.warn("Firestore mail queue notice:", mailErr.message);
    }
  }

  return { success: true, callableSucceeded };
}

function generateSecureToken() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "inv_";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
