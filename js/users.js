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

export const ROLE_LABELS = {
  admin: "Administratorius (Pilna prieiga)",
  editor: "Turinio redaktorius",
  judge: "Komisijos narys (Teisėjas)",
  moderator: "Žiūrovų prižiūrėtojas / Moderatorius",
  accountant: "Buhalteris (Finansai & Prizai)",
  viewer: "Žiūrovas (Tik peržiūra)",
};

export const ROLE_PERMISSION_DEFAULTS = {
  admin: {
    submissions: { read: true, edit: true, delete: true },
    voting: { read: true, edit: true, delete: true },
    editions: { read: true, edit: true, delete: true },
    archive: { read: true, edit: true, delete: true },
    tasks: { read: true, edit: true, delete: true },
    settings: { read: true, edit: true },
    logs: { read: true },
    manageStream: true,
    manageUsers: true
  },
  editor: {
    submissions: { read: true, edit: true, delete: false },
    voting: { read: true, edit: false, delete: false },
    editions: { read: true, edit: true, delete: false },
    archive: { read: true, edit: true, delete: false },
    tasks: { read: true, edit: true, delete: false },
    settings: { read: false, edit: false },
    logs: { read: false },
    manageStream: false,
    manageUsers: false
  },
  judge: {
    submissions: { read: true, edit: false, delete: false },
    voting: { read: true, edit: true, delete: false },
    editions: { read: true, edit: false, delete: false },
    archive: { read: true, edit: false, delete: false },
    tasks: { read: true, edit: true, delete: false },
    settings: { read: false, edit: false },
    logs: { read: false },
    manageStream: false,
    manageUsers: false
  },
  moderator: {
    submissions: { read: true, edit: true, delete: false },
    voting: { read: true, edit: false, delete: false },
    editions: { read: false, edit: false, delete: false },
    archive: { read: false, edit: false, delete: false },
    tasks: { read: true, edit: true, delete: false },
    settings: { read: false, edit: false },
    logs: { read: false },
    manageStream: true,
    manageUsers: false
  },
  accountant: {
    submissions: { read: true, edit: false, delete: false },
    voting: { read: true, edit: false, delete: false },
    editions: { read: true, edit: false, delete: false },
    archive: { read: true, edit: false, delete: false },
    tasks: { read: true, edit: true, delete: false },
    settings: { read: false, edit: false },
    logs: { read: false },
    manageStream: false,
    manageUsers: false
  },
  viewer: {
    submissions: { read: true, edit: false, delete: false },
    voting: { read: true, edit: false, delete: false },
    editions: { read: true, edit: false, delete: false },
    archive: { read: true, edit: false, delete: false },
    tasks: { read: false, edit: false, delete: false },
    settings: { read: false, edit: false },
    logs: { read: false },
    manageStream: false,
    manageUsers: false
  }
};

const TRUSTED_MANAGEMENT_EMAILS = [
  "azuolynasfilmfestival@gmail.com",
  "karina.brdar@gmail.com"
];

export function initUsers() {
  const searchInput = document.getElementById("filterUserSearch");
  const roleSelect = document.getElementById("filterUserRole");
  const statusSelect = document.getElementById("filterUserStatus");
  const refreshBtn = document.getElementById("btnRefreshUsers");
  const openInviteModalBtn = document.getElementById("btnOpenInviteModal");

  const deleteModal = document.getElementById("userDeleteModal");
  const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  if (searchInput) searchInput.addEventListener("input", renderUsersTable);
  if (roleSelect) roleSelect.addEventListener("change", renderUsersTable);
  if (statusSelect) statusSelect.addEventListener("change", renderUsersTable);

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast("Atnaujinamas vartotojų sąrašas...");
      subscribeUsers();
    });
  }

  if (openInviteModalBtn) {
    openInviteModalBtn.onclick = (e) => {
      e.preventDefault();
      openInviteModal({ defaultRole: "moderator" });
    };
  }

  // Setup user edit modal
  initUserEditModal();

  // Setup password reset modal
  initPasswordResetModal();

  // Listen to user-invited event from invite-modal.js
  window.addEventListener("user-invited", (e) => {
    const newUser = e.detail;
    if (!newUser || !newUser.email) return;

    const emailSanitized = newUser.email.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
    const existingIdx = allUsersList.findIndex((u) => (u.email || "").toLowerCase() === newUser.email.toLowerCase());

    const item = {
      id: emailSanitized,
      uid: emailSanitized,
      name: newUser.name || "",
      surname: newUser.surname || "",
      email: newUser.email,
      phone: newUser.phone || "",
      role: newUser.role || "moderator",
      status: "active",
      emailVerified: true,
      canManageUsers: newUser.canManageUsers === true,
      permissions: ROLE_PERMISSION_DEFAULTS[newUser.role] || ROLE_PERMISSION_DEFAULTS.moderator,
      createdAt: newUser.createdAt || new Date().toISOString(),
      invitedBy: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
    };

    if (existingIdx >= 0) {
      allUsersList[existingIdx] = { ...allUsersList[existingIdx], ...item };
    } else {
      allUsersList.unshift(item);
    }
    updateUserMetrics();
    renderUsersTable();
  });

  // Delete Confirmation Modal
  const hideDeleteModal = () => {
    if (deleteModal) {
      deleteModal.classList.remove("active");
      deleteModal.classList.add("d-none");
    }
    pendingDeleteUserId = null;
    pendingDeleteUserEmail = null;
  };

  if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener("click", hideDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideDeleteModal);

  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) hideDeleteModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && deleteModal && deleteModal.classList.contains("active")) {
      hideDeleteModal();
    }
  });

  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = async (e) => {
      e.preventDefault();
      if (!pendingDeleteUserId && !pendingDeleteUserEmail) return;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Šalinama...";
      try {
        await executeDeleteUser(pendingDeleteUserId, pendingDeleteUserEmail);
        hideDeleteModal();
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Taip, Pašalinti Vartotoją";
      }
    };
  }
}

export async function evaluateUserManagementAccess(user) {
  const tabUsersBtn = document.getElementById("tabUsersBtn");
  const usersTab = document.getElementById("usersTab");
  if (!tabUsersBtn) return false;

  if (!user || !user.email) {
    tabUsersBtn.classList.add("d-none");
    if (usersTab) usersTab.classList.add("d-none");
    return false;
  }

  const emailLower = (user.email || "").trim().toLowerCase();
  const hasAccess = TRUSTED_MANAGEMENT_EMAILS.map(e => e.toLowerCase()).includes(emailLower);

  if (hasAccess) {
    tabUsersBtn.classList.remove("d-none");
  } else {
    tabUsersBtn.classList.add("d-none");
    if (usersTab) usersTab.classList.add("d-none");
    const submissionsBtn = document.getElementById("tabSubmissionsBtn");
    const submissionsTab = document.getElementById("submissionsTab");
    if (tabUsersBtn.classList.contains("active") && submissionsBtn && submissionsTab) {
      tabUsersBtn.classList.remove("active");
      submissionsBtn.classList.add("active");
      submissionsTab.classList.remove("d-none");
    }
  }

  return hasAccess;
}

export async function loadUsersFallback() {
  try {
    const resp = await fetch("/api/admin/users");
    if (resp.ok) {
      const data = await resp.json();
      if (data && Array.isArray(data.users) && data.users.length) {
        allUsersList = data.users.map((u) => ({
          id: u.uid || u.id || (u.email ? u.email.replace(/[^a-zA-Z0-9_-]/g, "_") : "usr_" + Math.random().toString(36).substring(2)),
          emailVerified: u.emailVerified !== undefined ? u.emailVerified : true,
          permissions: u.permissions || ROLE_PERMISSION_DEFAULTS[u.role] || ROLE_PERMISSION_DEFAULTS.viewer,
          ...u,
        }));

        allUsersList.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (b.role === "admin" && a.role !== "admin") return 1;
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        updateUserMetrics();
        renderUsersTable();
      }
    }
  } catch (err) {
    console.warn("Fallback load users notice:", err);
  }
}

export function subscribeUsers() {
  const loadingElem = document.getElementById("usersLoadingState");
  if (loadingElem) loadingElem.classList.remove("d-none");

  loadUsersFallback();

  if (!db) {
    if (loadingElem) loadingElem.classList.add("d-none");
    return;
  }

  if (unsubscribeUsers) {
    unsubscribeUsers();
  }

  try {
    unsubscribeUsers = db.collection("users").onSnapshot(
      async (snapshot) => {
        if (loadingElem) loadingElem.classList.add("d-none");

        if (snapshot.empty) {
          return;
        }

        allUsersList = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          allUsersList.push({
            id: doc.id,
            emailVerified: d.emailVerified !== undefined ? d.emailVerified : true,
            permissions: d.permissions || ROLE_PERMISSION_DEFAULTS[d.role] || ROLE_PERMISSION_DEFAULTS.viewer,
            ...d,
          });
        });

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
        loadUsersFallback();
      }
    );
  } catch (err) {
    if (loadingElem) loadingElem.classList.add("d-none");
    handleFirestoreError(err, OperationType.LIST, "users");
    loadUsersFallback();
  }
}

export function unsubscribeUsersListener() {
  if (unsubscribeUsers) {
    unsubscribeUsers();
    unsubscribeUsers = null;
  }
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
    const phone = (user.phone || "").toLowerCase();
    const matchesSearch = !searchVal || fullName.includes(searchVal) || email.includes(searchVal) || phone.includes(searchVal);
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
      const userPhone = user.phone ? escapeHtml(user.phone) : "";

      // Email verification badge
      const isVerified = user.emailVerified === true;
      const verifiedBadge = isVerified
        ? `<span class="badge-verified" title="El. paštas patvirtintas">
             <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             <span>Patvirtintas</span>
           </span>`
        : `<span class="badge-unverified" title="El. paštas nepatvirtintas">
             <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             <span>Nepatvirtintas</span>
           </span>`;

      // Permissions overview text
      const perms = user.permissions || ROLE_PERMISSION_DEFAULTS[user.role] || {};
      let permSummary = "Standartinė";
      if (user.role === "admin" || isSuperAdmin) {
        permSummary = "Pilna prieiga (Visi moduliai)";
      } else {
        const canStream = perms.manageStream ? "+ Transliacija" : "";
        const canUsers = perms.manageUsers ? "+ Vartotojai" : "";
        permSummary = `${ROLE_LABELS[user.role] || user.role} ${canStream} ${canUsers}`.trim();
      }

      return `
        <tr data-user-id="${escapeHtml(user.id)}">
          <td>
            <div class="user-cell-meta">
              <div class="user-avatar-badge ${user.role === "admin" ? "admin" : ""}">
                ${initials}
              </div>
              <div>
                <div class="user-name-title">
                  ${userFullName} 
                  ${isSuperAdmin ? `<span class="badge badge-winner" style="font-size:0.68rem; margin-left:4px;">Vyr. Admin</span>` : ""}
                </div>
                <div class="user-name-sub">
                  ${userPhone ? `📞 ${userPhone} &bull; ` : ""}Sukurta: ${formattedDate}
                </div>
              </div>
            </div>
          </td>
          <td>
            <div class="user-email-wrap">
              <a href="mailto:${escapeHtml(user.email)}" title="Rašyti laišką">${escapeHtml(user.email)}</a>
              <button type="button" class="btn-icon-copy" title="Kopijuoti el. paštą" data-copy-email="${escapeHtml(user.email)}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
          </td>
          <td>
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-color);">
              ${ROLE_LABELS[user.role] || user.role}
            </div>
            <div style="font-size:0.73rem; color:var(--text-muted); margin-top:2px;">
              ${escapeHtml(permSummary)}
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              ${verifiedBadge}
              <button type="button" class="btn-icon-copy btn-resend-verify" data-user-email="${escapeHtml(user.email)}" title="Atsiųsti el. pašto patvirtinimo laišką iš naujo" style="color:var(--accent-light);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </button>
            </div>
          </td>
          <td>
            <label class="table-toggle-switch" title="${isSuperAdmin ? "Pagrindinis administratorius negali būti blokuojamas" : isActive ? "Spustelėkite, norėdami užblokuoti prieigą" : "Spustelėkite, norėdami atblokuoti prieigą"}">
              <input type="checkbox" class="toggle-status-input" data-user-id="${escapeHtml(user.id)}" data-user-email="${escapeHtml(user.email)}" ${isActive ? "checked" : ""} ${isSuperAdmin ? "disabled" : ""}>
              <span class="table-toggle-track"></span>
              <span class="table-toggle-text">${isActive ? "Aktyvus" : "Užblokuotas"}</span>
            </label>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <!-- Edit Profile & RBAC Permissions Button -->
              <button type="button" class="btn-action-edit btn-open-user-edit" data-user-email="${escapeHtml(user.email)}" title="Redaguoti el. paštą, vardą, kontaktus ir prieigos teises">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Redaguoti</span>
              </button>

              <!-- Password Reset Options Button -->
              <button type="button" class="btn-action-reset btn-open-pwd-reset" data-user-email="${escapeHtml(user.email)}" title="Atsiųsti slaptažodžio atstatymo nuorodą arba sugeneruoti vienkartinį linką">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span>Slaptažodis</span>
              </button>

              <!-- Delete Button -->
              <button type="button" class="btn-action-delete" data-delete-user-id="${escapeHtml(user.id)}" data-delete-email="${escapeHtml(user.email)}" ${isSuperAdmin ? "disabled title='Pagrindinis vyr. administratorius negali būti pašalintas'" : "title='Ištrinti paskyrą ir atšaukti teises'"}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    checkbox.onchange = async (e) => {
      const input = e.target;
      const userId = input.dataset.userId;
      const userEmail = input.dataset.userEmail;
      const newActive = input.checked;
      const newStatus = newActive ? "active" : "suspended";

      input.disabled = true;

      try {
        const resp = await fetch("/api/admin/users/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            status: newStatus,
            adminEmail: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
          })
        });

        if (resp.ok) {
          const u = allUsersList.find((x) => x.id === userId || (userEmail && (x.email || "").toLowerCase() === userEmail.toLowerCase()));
          if (u) u.status = newStatus;
          updateUserMetrics();
          renderUsersTable();
          showToast(`Vartotojas ${userEmail} ${newActive ? 'atblokuotas' : 'užblokuotas'}.`, "success");
        } else {
          input.checked = !newActive;
          showToast("Nepavyko pakeisti prieigos būsenos", "error");
        }
      } catch (err) {
        input.checked = !newActive;
        showToast("Ryšio klaida", "error");
      } finally {
        input.disabled = false;
      }
    };
  });

  // Open Edit Profile & RBAC Modal
  document.querySelectorAll(".btn-open-user-edit").forEach((btn) => {
    btn.onclick = () => {
      const email = btn.dataset.userEmail;
      const user = allUsersList.find(u => (u.email || "").toLowerCase() === (email || "").toLowerCase());
      if (user) openUserEditModal(user);
    };
  });

  // Open Password Reset Modal
  document.querySelectorAll(".btn-open-pwd-reset").forEach((btn) => {
    btn.onclick = () => {
      const email = btn.dataset.userEmail;
      const user = allUsersList.find(u => (u.email || "").toLowerCase() === (email || "").toLowerCase());
      if (user) openPasswordResetModal(user);
    };
  });

  // Resend email verification
  document.querySelectorAll(".btn-resend-verify").forEach((btn) => {
    btn.onclick = async () => {
      const email = btn.dataset.userEmail;
      if (!email) return;
      btn.disabled = true;
      try {
        showToast("Siunčiamas el. pašto patvirtinimo laiškas...");
        const res = await fetch("/api/admin/users/resend-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (res.ok) {
          showToast(`Patvirtinimo laiškas sėkmingai išsiųstas į ${email}!`, "success");
        } else {
          showToast("Nepavyko išsiųsti patvirtinimo laiško", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      } finally {
        btn.disabled = false;
      }
    };
  });

  // Delete user buttons
  document.querySelectorAll(".btn-action-delete").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      const userId = btn.dataset.deleteUserId;
      const email = btn.dataset.deleteEmail;
      promptDeleteUser(userId, email);
    };
  });

  // Copy email button
  document.querySelectorAll(".btn-icon-copy:not(.btn-resend-verify)").forEach((btn) => {
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
  if (email && email.toLowerCase() === PRIMARY_SUPERADMIN_EMAIL.toLowerCase()) {
    showToast("Pagrindinis administratorius negali būti pašalintas!", "error");
    return;
  }

  pendingDeleteUserId = userId;
  pendingDeleteUserEmail = email;

  const modal = document.getElementById("userDeleteModal");
  const label = document.getElementById("deleteUserTargetLabel");
  if (label) label.textContent = `${email || "Nenurodytas"} (ID: ${userId})`;
  if (modal) {
    modal.classList.remove("d-none");
    modal.classList.add("active");
  }
}

async function executeDeleteUser(userId, email) {
  try {
    const resp = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        email,
        adminEmail: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
      })
    });
    if (resp.ok) {
      allUsersList = allUsersList.filter((u) => u.id !== userId && (!email || (u.email || "").toLowerCase() !== email.toLowerCase()));
      updateUserMetrics();
      renderUsersTable();
      showToast(`Vartotojas ${email || userId} sėkmingai pašalintas iš sistemos.`, "success");
    } else {
      showToast("Nepavyko pašalinti vartotojo.", "error");
    }
  } catch (apiErr) {
    showToast("Ryšio klaida šalinant vartotoją.", "error");
  }
}

// ============================================================================
// USER EDIT & RBAC PERMISSIONS MODAL LOGIC
// ============================================================================
function initUserEditModal() {
  const modal = document.getElementById("userEditModal");
  const closeBtn = document.getElementById("closeUserEditModalBtn");
  const cancelBtn = document.getElementById("cancelUserEditBtn");
  const form = document.getElementById("userEditForm");
  const roleSelect = document.getElementById("editUserRole");

  const hideModal = () => {
    if (modal) {
      modal.classList.remove("active");
      modal.classList.add("d-none");
    }
  };

  if (closeBtn) closeBtn.onclick = hideModal;
  if (cancelBtn) cancelBtn.onclick = hideModal;

  if (roleSelect) {
    roleSelect.onchange = () => {
      const selectedRole = roleSelect.value;
      const defaults = ROLE_PERMISSION_DEFAULTS[selectedRole] || ROLE_PERMISSION_DEFAULTS.viewer;
      applyPermissionsToCheckboxes(defaults);
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById("saveUserEditBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Išsaugoma...";
      }

      try {
        const uid = document.getElementById("editUserUid")?.value;
        const oldEmail = document.getElementById("editUserOldEmail")?.value;
        const email = document.getElementById("editUserEmail")?.value.trim();
        const name = document.getElementById("editUserName")?.value.trim();
        const surname = document.getElementById("editUserSurname")?.value.trim();
        const phone = document.getElementById("editUserPhone")?.value.trim();
        const role = document.getElementById("editUserRole")?.value;
        const emailVerified = document.getElementById("editUserEmailVerified")?.checked === true;

        const permissions = extractPermissionsFromCheckboxes();

        const res = await fetch("/api/admin/users/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            oldEmail,
            email,
            name,
            surname,
            phone,
            role,
            permissions,
            emailVerified,
            adminEmail: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
          })
        });

        if (res.ok) {
          const data = await res.json();
          showToast("Vartotojo profilis ir teisės sėkmingai atnaujinti!", "success");
          hideModal();
          await loadUsersFallback();
        } else {
          const err = await res.json();
          showToast(err.error || "Nepavyko išsaugoti profilio", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Išsaugoti Pakeitimus";
        }
      }
    };
  }
}

function openUserEditModal(user) {
  const modal = document.getElementById("userEditModal");
  if (!modal) return;

  document.getElementById("editUserUid").value = user.uid || user.id || "";
  document.getElementById("editUserOldEmail").value = user.email || "";
  document.getElementById("editUserEmail").value = user.email || "";
  document.getElementById("editUserName").value = user.name || "";
  document.getElementById("editUserSurname").value = user.surname || "";
  document.getElementById("editUserPhone").value = user.phone || "";
  
  const roleSelect = document.getElementById("editUserRole");
  if (roleSelect) roleSelect.value = user.role || "moderator";

  const verifyCheckbox = document.getElementById("editUserEmailVerified");
  if (verifyCheckbox) verifyCheckbox.checked = user.emailVerified === true;

  const perms = user.permissions || ROLE_PERMISSION_DEFAULTS[user.role] || ROLE_PERMISSION_DEFAULTS.viewer;
  applyPermissionsToCheckboxes(perms);

  modal.classList.remove("d-none");
  modal.classList.add("active");
}

function applyPermissionsToCheckboxes(p) {
  setCheck("perm_subs_read", p?.submissions?.read);
  setCheck("perm_subs_edit", p?.submissions?.edit);
  setCheck("perm_subs_delete", p?.submissions?.delete);

  setCheck("perm_vote_read", p?.voting?.read);
  setCheck("perm_vote_edit", p?.voting?.edit);
  setCheck("perm_vote_delete", p?.voting?.delete);

  setCheck("perm_editions_read", p?.editions?.read);
  setCheck("perm_editions_edit", p?.editions?.edit);
  setCheck("perm_editions_delete", p?.editions?.delete);

  setCheck("perm_archive_read", p?.archive?.read);
  setCheck("perm_archive_edit", p?.archive?.edit);
  setCheck("perm_archive_delete", p?.archive?.delete);

  setCheck("perm_tasks_read", p?.tasks?.read);
  setCheck("perm_tasks_edit", p?.tasks?.edit);
  setCheck("perm_tasks_delete", p?.tasks?.delete);

  setCheck("perm_settings_read", p?.settings?.read);
  setCheck("perm_settings_edit", p?.settings?.edit);

  setCheck("perm_logs_read", p?.logs?.read);

  setCheck("perm_manage_stream", p?.manageStream === true);
  setCheck("perm_manage_users", p?.manageUsers === true);
}

function extractPermissionsFromCheckboxes() {
  return {
    submissions: {
      read: getCheck("perm_subs_read"),
      edit: getCheck("perm_subs_edit"),
      delete: getCheck("perm_subs_delete")
    },
    voting: {
      read: getCheck("perm_vote_read"),
      edit: getCheck("perm_vote_edit"),
      delete: getCheck("perm_vote_delete")
    },
    editions: {
      read: getCheck("perm_editions_read"),
      edit: getCheck("perm_editions_edit"),
      delete: getCheck("perm_editions_delete")
    },
    archive: {
      read: getCheck("perm_archive_read"),
      edit: getCheck("perm_archive_edit"),
      delete: getCheck("perm_archive_delete")
    },
    tasks: {
      read: getCheck("perm_tasks_read"),
      edit: getCheck("perm_tasks_edit"),
      delete: getCheck("perm_tasks_delete")
    },
    settings: {
      read: getCheck("perm_settings_read"),
      edit: getCheck("perm_settings_edit")
    },
    logs: {
      read: getCheck("perm_logs_read")
    },
    manageStream: getCheck("perm_manage_stream"),
    manageUsers: getCheck("perm_manage_users")
  };
}

function setCheck(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = val === true;
}

function getCheck(id) {
  const el = document.getElementById(id);
  return el ? el.checked === true : false;
}

// ============================================================================
// PASSWORD RESET MODAL LOGIC
// ============================================================================
function initPasswordResetModal() {
  const modal = document.getElementById("passwordResetModal");
  const closeBtn = document.getElementById("closePasswordResetModalBtn");
  const cancelBtn = document.getElementById("cancelPasswordResetBtn");
  const btnSendEmail = document.getElementById("btnSendResetEmailAction");
  const btnGenerateDirect = document.getElementById("btnGenerateDirectLinkAction");
  const btnCopyResetLink = document.getElementById("btnCopyDirectResetLink");

  const hideModal = () => {
    if (modal) {
      modal.classList.remove("active");
      modal.classList.add("d-none");
    }
  };

  if (closeBtn) closeBtn.onclick = hideModal;
  if (cancelBtn) cancelBtn.onclick = hideModal;

  if (btnSendEmail) {
    btnSendEmail.onclick = async () => {
      const email = document.getElementById("pwdResetTargetEmail")?.value;
      if (!email) return;

      btnSendEmail.disabled = true;
      btnSendEmail.textContent = "Siunčiama...";

      try {
        const res = await fetch("/api/admin/users/send-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            adminEmail: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
          })
        });
        if (res.ok) {
          const data = await res.json();
          showToast(`Slaptažodžio atstatymo nuoroda sėkmingai išsiųsta į ${email}!`, "success");
          if (data.resetUrl) {
            const container = document.getElementById("pwdResetDirectLinkContainer");
            const input = document.getElementById("pwdResetDirectLinkInput");
            if (container && input) {
              input.value = data.resetUrl;
              container.classList.remove("d-none");
            }
          }
        } else {
          const err = await res.json();
          showToast(err.error || "Nepavyko išsiųsti nuorodos", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      } finally {
        btnSendEmail.disabled = false;
        btnSendEmail.textContent = "Atsiųsti Nuorodą El. Paštu";
      }
    };
  }

  if (btnGenerateDirect) {
    btnGenerateDirect.onclick = async () => {
      const email = document.getElementById("pwdResetTargetEmail")?.value;
      if (!email) return;

      btnGenerateDirect.disabled = true;
      btnGenerateDirect.textContent = "Generuojama...";

      try {
        const res = await fetch("/api/admin/users/generate-reset-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            adminEmail: (auth && auth.currentUser) ? auth.currentUser.email : PRIMARY_SUPERADMIN_EMAIL
          })
        });
        if (res.ok) {
          const data = await res.json();
          const container = document.getElementById("pwdResetDirectLinkContainer");
          const input = document.getElementById("pwdResetDirectLinkInput");
          if (container && input) {
            input.value = data.resetUrl;
            container.classList.remove("d-none");
          }
          showToast("Vienkartinė slaptažodžio keitimo nuoroda sėkmingai sugeneruota!", "success");
        } else {
          const err = await res.json();
          showToast(err.error || "Klaida generuojant nuorodą", "error");
        }
      } catch (err) {
        showToast("Ryšio klaida", "error");
      } finally {
        btnGenerateDirect.disabled = false;
        btnGenerateDirect.textContent = "Generuoti Vienkartinį Linką Tiesiogiai";
      }
    };
  }

  if (btnCopyResetLink) {
    btnCopyResetLink.onclick = () => {
      const input = document.getElementById("pwdResetDirectLinkInput");
      if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
          showToast("Slaptažodžio atstatymo nuoroda nukopijuota į iškarpinę!", "success");
        });
      }
    };
  }
}

function openPasswordResetModal(user) {
  const modal = document.getElementById("passwordResetModal");
  if (!modal) return;

  const emailField = document.getElementById("pwdResetTargetEmail");
  const userLabel = document.getElementById("pwdResetTargetUserLabel");
  const container = document.getElementById("pwdResetDirectLinkContainer");
  const input = document.getElementById("pwdResetDirectLinkInput");

  if (emailField) emailField.value = user.email || "";
  if (userLabel) userLabel.textContent = `${user.name || ''} ${user.surname || ''} (${user.email})`.trim();
  if (container) container.classList.add("d-none");
  if (input) input.value = "";

  modal.classList.remove("d-none");
  modal.classList.add("active");
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

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
