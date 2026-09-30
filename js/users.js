import { db, auth, PRIMARY_SUPERADMIN_EMAIL, AUTHORIZED_ADMIN_EMAILS } from "./firebase-init.js";
import { showToast } from "./ui-feedback.js";
import { openInviteModal } from "./invite-modal.js";

const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write",
};

function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  return errInfo;
}

let unsubscribeUsers = null;
let allUsersList = [];
let pendingDeleteUserId = null;
let pendingDeleteUserEmail = null;

const ROLE_LABELS = {
  admin: "Administratorius",
  moderator: "Moderatorius",
  judge: "Teisėjas (Komisija)",
  accountant: "Buhalteris",
  viewer: "Žiūrovas (Tik peržiūra)",
};

const DEFAULT_SEED_USERS = [
  {
    email: "azuolynasfilmfestival@gmail.com",
    name: "Vyr.",
    surname: "Administratorius",
    role: "admin",
    status: "active",
    createdAt: "2026-01-10T10:00:00.000Z",
    invitedBy: "Sistemos Pagrindas",
  },
  {
    email: "karina.brdar@gmail.com",
    name: "Karina",
    surname: "Brdar",
    role: "admin",
    status: "active",
    createdAt: "2026-01-15T12:00:00.000Z",
    invitedBy: "azuolynasfilmfestival@gmail.com",
  },
  {
    email: "dominikphotofficial.t@gmail.com",
    name: "Dominik",
    surname: "Photo",
    role: "moderator",
    status: "active",
    createdAt: "2026-02-01T14:30:00.000Z",
    invitedBy: "azuolynasfilmfestival@gmail.com",
  },
  {
    email: "dominikphotofficial.lt@gmail.com",
    name: "Dominik",
    surname: "Oficialus",
    role: "judge",
    status: "active",
    createdAt: "2026-02-10T09:15:00.000Z",
    invitedBy: "azuolynasfilmfestival@gmail.com",
  },
];

export function initUsers() {
  const searchInput = document.getElementById("filterUserSearch");
  const roleSelect = document.getElementById("filterUserRole");
  const statusSelect = document.getElementById("filterUserStatus");
  const refreshBtn = document.getElementById("btnRefreshUsers");
  const openInviteModalBtn = document.getElementById("btnOpenInviteModal");
  const inviteForm = document.getElementById("userInviteForm");
  const inviteModal = document.getElementById("userInviteModal");
  const closeInviteModalBtn = document.getElementById("closeInviteModalBtn");
  const cancelInviteBtn = document.getElementById("cancelInviteBtn");

  const deleteModal = document.getElementById("userDeleteModal");
  const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  if (searchInput) {
    searchInput.addEventListener("input", renderUsersTable);
  }
  if (roleSelect) {
    roleSelect.addEventListener("change", renderUsersTable);
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", renderUsersTable);
  }
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinamas vartotojų sąrašas...");
      subscribeUsers();
    });
  }

  // Invite Modal (Delegated to reusable invite-modal.js)
  if (openInviteModalBtn) {
    openInviteModalBtn.addEventListener("click", () => {
      openInviteModal({ defaultRole: "moderator" });
    });
  }

  // Delete Confirmation Modal
  const hideDeleteModal = () => {
    if (deleteModal) deleteModal.classList.add("d-none");
    pendingDeleteUserId = null;
    pendingDeleteUserEmail = null;
  };

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", hideDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!pendingDeleteUserId) return;
      confirmDeleteBtn.disabled = true;
      try {
        await executeDeleteUser(pendingDeleteUserId, pendingDeleteUserEmail);
        hideDeleteModal();
      } finally {
        confirmDeleteBtn.disabled = false;
      }
    });
  }
}

export function subscribeUsers() {
  if (!db) return;

  if (unsubscribeUsers) {
    unsubscribeUsers();
  }

  const loadingElem = document.getElementById("usersLoadingState");
  if (loadingElem) loadingElem.classList.remove("d-none");

  try {
    unsubscribeUsers = db.collection("users").onSnapshot(
      async (snapshot) => {
        if (loadingElem) loadingElem.classList.add("d-none");

        // If collection is completely empty, bootstrap initial accounts to guarantee data presence
        if (snapshot.empty) {
          console.info("Users collection empty. Initializing baseline staff accounts in Firestore...");
          await bootstrapDefaultUsers();
          return;
        }

        allUsersList = [];
        snapshot.forEach((doc) => {
          allUsersList.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Sort by role (admins first) and then createdAt
        allUsersList.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (b.role === "admin" && a.role !== "admin") return 1;
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        updateUserMetrics();
        renderUsersTable();
      },
      (err) => {
        if (loadingElem) loadingElem.classList.add("d-none");
        handleFirestoreError(err, OperationType.LIST, "users");
        showToast("Klaida nuskaitant vartotojus: " + err.message, "error");
      }
    );
  } catch (err) {
    if (loadingElem) loadingElem.classList.add("d-none");
    handleFirestoreError(err, OperationType.LIST, "users");
  }
}

export function unsubscribeUsersListener() {
  if (unsubscribeUsers) {
    unsubscribeUsers();
    unsubscribeUsers = null;
  }
}

async function bootstrapDefaultUsers() {
  const batch = db.batch();
  DEFAULT_SEED_USERS.forEach((usr) => {
    const docId = sanitizeEmailToDocId(usr.email);
    const ref = db.collection("users").doc(docId);
    batch.set(ref, {
      ...usr,
      uid: docId,
      createdAt: usr.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  try {
    await batch.commit();
    showToast("Pradiniai vartotojai sėkmingai sukurti Firestore duomenų bazėje!");
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "users");
  }
}

function sanitizeEmailToDocId(email) {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
}

function updateUserMetrics() {
  const total = allUsersList.length;
  const active = allUsersList.filter((u) => u.status === "active").length;
  const blocked = allUsersList.filter((u) => u.status === "suspended").length;
  const admins = allUsersList.filter((u) => u.role === "admin").length;

  const statTotal = document.getElementById("statUsersTotal");
  const statActive = document.getElementById("statUsersActive");
  const statBlocked = document.getElementById("statUsersBlocked");
  const statAdmins = document.getElementById("statUsersAdmins");

  if (statTotal) statTotal.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statBlocked) statBlocked.textContent = blocked;
  if (statAdmins) statAdmins.textContent = admins;
}

function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  const emptyState = document.getElementById("usersEmptyState");
  if (!tbody) return;

  const searchVal = document.getElementById("filterUserSearch")?.value.trim().toLowerCase() || "";
  const roleVal = document.getElementById("filterUserRole")?.value || "all";
  const statusVal = document.getElementById("filterUserStatus")?.value || "all";

  const filtered = allUsersList.filter((user) => {
    const fullName = `${user.name || ""} ${user.surname || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const matchesSearch = !searchVal || fullName.includes(searchVal) || email.includes(searchVal);
    const matchesRole = roleVal === "all" || user.role === roleVal;
    const matchesStatus = statusVal === "all" || user.status === statusVal;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  tbody.innerHTML = filtered
    .map((user) => {
      const isSuperAdmin = (user.email || "").toLowerCase() === PRIMARY_SUPERADMIN_EMAIL.toLowerCase();
      const isActive = user.status === "active";
      const initials = getInitials(user.name, user.surname, user.email);
      const formattedDate = user.createdAt ? formatDateShort(user.createdAt) : "—";
      const userFullName = escapeHtml(`${user.name || ""} ${user.surname || ""}`.trim() || "Nenurodytas");

      // Status pill configuration
      let statusClass = "status-accepted";
      let statusLabel = "Aktyvus";
      if (user.status === "suspended") {
        statusClass = "status-rejected";
        statusLabel = "Blokuotas";
      } else if (user.status === "pending") {
        statusClass = "status-semifinal";
        statusLabel = "Laukiama";
      }

      return `
        <tr data-user-id="${escapeHtml(user.id)}">
          <td>
            <div class="user-cell-meta">
              <div class="user-avatar-badge ${user.role === "admin" ? "admin" : ""}">
                ${initials}
              </div>
              <div>
                <div class="user-name-title">${userFullName} ${isSuperAdmin ? `<span class="badge badge-winner" style="font-size:0.68rem; margin-left:4px;">Vyr. Admin</span>` : ""}</div>
                <div class="user-name-sub">Sukurta: ${formattedDate} ${user.invitedBy ? `&bull; Pakvietė: ${escapeHtml(user.invitedBy)}` : ""}</div>
              </div>
            </div>
          </td>
          <td>
            <div class="user-email-wrap">
              <a href="mailto:${escapeHtml(user.email)}" title="Rašyti laišką">${escapeHtml(user.email)}</a>
              <button type="button" class="btn-icon-copy" title="Kopijuoti el. paštą" data-copy-email="${escapeHtml(user.email)}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </td>
          <td>
            <select class="table-role-select" data-user-role-id="${escapeHtml(user.id)}" ${isSuperAdmin ? "disabled title='Vyr. administratoriaus rolė negali būti keičiama'" : ""}>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administratorius</option>
              <option value="moderator" ${user.role === "moderator" ? "selected" : ""}>Moderatorius</option>
              <option value="judge" ${user.role === "judge" ? "selected" : ""}>Teisėjas / Komisija</option>
              <option value="accountant" ${user.role === "accountant" ? "selected" : ""}>Buhalteris</option>
              <option value="viewer" ${user.role === "viewer" ? "selected" : ""}>Žiūrovas</option>
            </select>
          </td>
          <td>
            <span class="status-pill ${statusClass}">
              <span class="status-dot"></span>
              ${statusLabel}
            </span>
          </td>
          <td>
            <label class="table-toggle-switch" title="${isSuperAdmin ? "Pagrindinis administratorius negali būti blokuojamas" : isActive ? "Spustelėkite, norėdami užblokuoti prieigą" : "Spustelėkite, norėdami atblokuoti prieigą"}">
              <input type="checkbox" class="toggle-status-input" data-user-id="${escapeHtml(user.id)}" data-user-email="${escapeHtml(user.email)}" ${isActive ? "checked" : ""} ${isSuperAdmin ? "disabled" : ""}>
              <span class="table-toggle-track"></span>
              <span class="table-toggle-text">${isActive ? "Prieiga leista" : "Užblokuotas"}</span>
            </label>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <button type="button" class="btn-action-delete" data-delete-user-id="${escapeHtml(user.id)}" data-delete-email="${escapeHtml(user.email)}" ${isSuperAdmin ? "disabled title='Pagrindinis vyr. administratorius negali būti pašalintas'" : "title='Ištrinti paskyrą ir atšaukti teises'"}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Ištrinti
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  attachTableEventHandlers();
}

function attachTableEventHandlers() {
  // Toggle Block/Unblock status
  document.querySelectorAll(".toggle-status-input").forEach((checkbox) => {
    checkbox.addEventListener("change", async (e) => {
      const input = e.target;
      const userId = input.dataset.userId;
      const userEmail = input.dataset.userEmail;
      const newActive = input.checked;
      const newStatus = newActive ? "active" : "suspended";

      input.disabled = true;

      try {
        await db.collection("users").doc(userId).update({
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        if (newActive) {
          showToast(`Vartotojas ${userEmail} sėkmingai atblokuotas (Prieiga aktyvi).`);
        } else {
          showToast(`Vartotojas ${userEmail} užblokuotas (Prieiga sustabdyta).`, "warning");
        }
      } catch (err) {
        input.checked = !newActive; // revert
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        showToast("Nepavyko pakeisti prieigos būsenos: " + err.message, "error");
      } finally {
        input.disabled = false;
      }
    });
  });

  // Change Role Dropdown
  document.querySelectorAll(".table-role-select").forEach((select) => {
    select.addEventListener("change", async (e) => {
      const target = e.target;
      const userId = target.dataset.userRoleId;
      const newRole = target.value;
      const roleName = ROLE_LABELS[newRole] || newRole;

      target.disabled = true;

      try {
        await db.collection("users").doc(userId).update({
          role: newRole,
          updatedAt: new Date().toISOString(),
        });
        showToast(`Rolė sėkmingai pakeista į: ${roleName}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
        showToast("Nepavyko atnaujinti rolės: " + err.message, "error");
      } finally {
        target.disabled = false;
      }
    });
  });

  // Delete User button
  document.querySelectorAll(".btn-action-delete").forEach((btn) => {
    btn.addEventListener("click", () => {
      const userId = btn.dataset.deleteUserId;
      const email = btn.dataset.deleteEmail;
      promptDeleteUser(userId, email);
    });
  });

  // Copy email button
  document.querySelectorAll(".btn-icon-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.dataset.copyEmail;
      if (email && navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
          showToast(`El. paštas nukopijuotas: ${email}`);
        });
      }
    });
  });
}

function promptDeleteUser(userId, email) {
  if (email.toLowerCase() === PRIMARY_SUPERADMIN_EMAIL.toLowerCase()) {
    showToast("Pagrindinis administratorius negali būti pašalintas!", "error");
    return;
  }

  pendingDeleteUserId = userId;
  pendingDeleteUserEmail = email;

  const modal = document.getElementById("userDeleteModal");
  const label = document.getElementById("deleteUserTargetLabel");
  if (label) label.textContent = `${email} (${userId})`;
  if (modal) modal.classList.remove("d-none");
}

async function executeDeleteUser(userId, email) {
  try {
    await db.collection("users").doc(userId).delete();
    showToast(`Vartotojas ${email} sėkmingai pašalintas iš sistemos.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    showToast("Nepavyko pašalinti vartotojo: " + err.message, "error");
  }
}

function getInitials(name, surname, email) {
  if (name && surname) {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }
  if (name) {
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "NA";
}

function formatDateShort(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch (e) {
    return isoString;
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

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
