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
    const result = await FirebaseClient.request("invite", {
      method: "POST", body: { name, surname, email, role, canManageUsers, lang: emailLang }
    });
    const created = await result.json();
    activeVerificationCode = created.invitation.code;
    activeToken = created.invitation.token;

    const roleName = (ROLE_LABELS[role] && ROLE_LABELS[role][emailLang]) || role;
    showToast(`Pakvietimas įrašytas į siuntimo eilę: ${email} (Rolė: ${roleName}, Kodas: ${activeVerificationCode})!`, "success");

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
