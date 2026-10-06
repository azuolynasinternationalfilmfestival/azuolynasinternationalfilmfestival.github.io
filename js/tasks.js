/**
 * tasks.js
 * Festival Team Task Management System (Užduočių Valdymas Redaktoriams ir Teisėjams)
 * Ąžuolynas International Film Festival
 */

import { showToast } from "./ui-feedback.js";

let allTasksList = [];
let currentFilterStatus = "all";
let currentFilterRole = "all";

export function initTasks() {
  const addTaskBtn = document.getElementById("btnOpenAddTaskModal");
  const saveTaskBtn = document.getElementById("saveTaskBtn");
  const cancelTaskBtn = document.getElementById("cancelTaskBtn");
  const taskModal = document.getElementById("taskModal");
  const closeTaskModalBtn = document.getElementById("closeTaskModalBtn");

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      openTaskModal();
    });
  }

  if (closeTaskModalBtn && taskModal) {
    closeTaskModalBtn.addEventListener("click", () => {
      taskModal.classList.add("d-none");
    });
  }

  if (cancelTaskBtn && taskModal) {
    cancelTaskBtn.addEventListener("click", () => {
      taskModal.classList.add("d-none");
    });
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener("click", handleSaveTask);
  }

  const filterStatusSelect = document.getElementById("filterTaskStatus");
  if (filterStatusSelect) {
    filterStatusSelect.addEventListener("change", (e) => {
      currentFilterStatus = e.target.value;
      renderTasksList();
    });
  }

  const filterRoleSelect = document.getElementById("filterTaskRole");
  if (filterRoleSelect) {
    filterRoleSelect.addEventListener("change", (e) => {
      currentFilterRole = e.target.value;
      renderTasksList();
    });
  }

  const searchInput = document.getElementById("filterTaskSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderTasksList();
    });
  }

  loadTasks();
}

export async function loadTasks() {
  try {
    const res = await fetch("/api/admin/tasks");
    if (res.ok) {
      const data = await res.json();
      allTasksList = data.tasks || [];
      renderTasksList();
    }
  } catch (err) {
    console.warn("Failed to load tasks:", err);
  }
}

function openTaskModal() {
  const modal = document.getElementById("taskModal");
  if (!modal) return;

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("taskAssignedRole").value = "editor";
  document.getElementById("taskAssignedEmail").value = "redaktorius@azuolynasfest.lt";
  document.getElementById("taskAssignedName").value = "Lukas (Redaktorius)";

  modal.classList.remove("d-none");
  document.getElementById("taskTitle").focus();
}

async function handleSaveTask() {
  const title = (document.getElementById("taskTitle").value || "").trim();
  const description = (document.getElementById("taskDescription").value || "").trim();
  const priority = document.getElementById("taskPriority").value;
  const assignedRole = document.getElementById("taskAssignedRole").value;
  const assignedTo = (document.getElementById("taskAssignedEmail").value || "").trim();
  const assignedName = (document.getElementById("taskAssignedName").value || "").trim();
  const deadline = document.getElementById("taskDeadline").value;

  if (!title) {
    showToast("Įveskite užduoties pavadinimą!", "error");
    return;
  }

  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";

  try {
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        assignedRole,
        assignedTo,
        assignedName: assignedName || assignedTo,
        deadline,
        adminEmail: currentUserEmail
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast("Užduotis sėkmingai sukurta!", "success");
      document.getElementById("taskModal").classList.add("d-none");
      await loadTasks();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } else {
      showToast("Nepavyko sukurti užduoties: " + (data.error || "Klaida"), "error");
    }
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  }
}

export function renderTasksList() {
  const container = document.getElementById("tasksContainer");
  if (!container) return;

  const searchVal = (document.getElementById("filterTaskSearch")?.value || "").toLowerCase().trim();

  const filtered = allTasksList.filter(t => {
    if (currentFilterStatus !== "all" && t.status !== currentFilterStatus) return false;
    if (currentFilterRole !== "all" && t.assignedRole !== currentFilterRole) return false;
    if (searchVal) {
      const matchTitle = (t.title || "").toLowerCase().includes(searchVal);
      const matchDesc = (t.description || "").toLowerCase().includes(searchVal);
      const matchAssignee = (t.assignedName || t.assignedTo || "").toLowerCase().includes(searchVal);
      if (!matchTitle && !matchDesc && !matchAssignee) return false;
    }
    return true;
  });

  const countPending = allTasksList.filter(t => t.status === "pending").length;
  const countInProgress = allTasksList.filter(t => t.status === "in_progress").length;
  const countCompleted = allTasksList.filter(t => t.status === "completed").length;

  const statPending = document.getElementById("taskStatPending");
  const statInProgress = document.getElementById("taskStatInProgress");
  const statCompleted = document.getElementById("taskStatCompleted");
  if (statPending) statPending.textContent = countPending;
  if (statInProgress) statInProgress.textContent = countInProgress;
  if (statCompleted) statCompleted.textContent = countCompleted;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 20px; color:var(--text-muted); background:var(--surface-card); border-radius:var(--site-radius); border:1px solid var(--border-color);">
        <div style="font-size:2rem; margin-bottom:8px;">📋</div>
        <strong>Užduočių nerasta</strong>
        <p style="font-size:0.85rem; margin-top:4px;">Pagal pasirinktus filtrus užduočių nėra arba galite sukurti naują.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isCompleted = t.status === "completed";
    const isInProgress = t.status === "in_progress";
    
    let statusBadge = `<span class="badge" style="background:rgba(212,175,55,0.2); color:#F3E5AB;">Laukiama</span>`;
    if (isInProgress) {
      statusBadge = `<span class="badge" style="background:rgba(96,165,250,0.2); color:#93c5fd;">Vykdoma</span>`;
    } else if (isCompleted) {
      statusBadge = `<span class="badge" style="background:rgba(74,222,128,0.2); color:#4ade80;">Atlikta</span>`;
    }

    let priorityBadge = `<span class="badge" style="background:rgba(255,255,255,0.1); color:var(--text-muted);">Žemas</span>`;
    if (t.priority === "high") {
      priorityBadge = `<span class="badge" style="background:rgba(239,68,68,0.2); color:#fca5a5;">Aukštas</span>`;
    } else if (t.priority === "medium") {
      priorityBadge = `<span class="badge" style="background:rgba(245,158,11,0.2); color:#fde68a;">Vidutinis</span>`;
    }

    const roleMap = {
      editor: "Redaktorius",
      judge: "Teisėjas",
      admin: "Administratorius",
      moderator: "Moderatorius"
    };

    return `
      <div class="task-card ${isCompleted ? 'task-done' : ''}" data-task-id="${t.id}" style="background:var(--surface-card); border:1px solid ${isCompleted ? 'rgba(74,222,128,0.3)' : 'var(--border-color)'}; border-radius:var(--site-radius); padding:18px 20px; display:flex; flex-direction:column; gap:12px; transition:all 0.2s ease;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:8px;">
            ${statusBadge}
            ${priorityBadge}
            <span style="font-size:0.75rem; color:var(--text-muted);">Terminas: <strong>${t.deadline || 'Nenurodytas'}</strong></span>
          </div>
          <div style="display:flex; gap:6px;">
            ${!isCompleted ? `
              <button type="button" class="btn-outline btn-xs btn-task-progress" data-task-id="${t.id}" data-next-status="${isInProgress ? 'completed' : 'in_progress'}" style="color:${isInProgress ? '#4ade80' : 'var(--accent-light)'};">
                ${isInProgress ? '✓ Pažymėti atlikta' : '▶ Pradėti vykdyti'}
              </button>
            ` : `
              <button type="button" class="btn-outline btn-xs btn-task-progress" data-task-id="${t.id}" data-next-status="pending" style="color:var(--text-muted);">
                ↩ Grąžinti
              </button>
            `}
            <button type="button" class="btn-outline btn-xs btn-task-delete" data-task-id="${t.id}" style="color:#f87171;" title="Ištrinti užduotį">
              ✕
            </button>
          </div>
        </div>

        <div>
          <h4 style="margin:0 0 6px 0; color:var(--text-color); font-size:1.02rem; text-decoration:${isCompleted ? 'line-through' : 'none'};">
            ${escapeHtml(t.title)}
          </h4>
          <p style="margin:0; font-size:0.86rem; color:var(--text-muted); line-height:1.5;">
            ${escapeHtml(t.description || 'Nėra išsamaus aprašymo')}
          </p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(111,165,138,0.15); padding-top:10px; font-size:0.78rem; color:var(--text-muted);">
          <div>
            Vykdytojas: <strong style="color:var(--accent-light);">${escapeHtml(t.assignedName || t.assignedTo || 'Nenurodyta')}</strong> 
            <span style="font-size:0.72rem; opacity:0.8;">(${roleMap[t.assignedRole] || t.assignedRole})</span>
          </div>
          <div>
            Sukurta: ${formatRelativeTime(t.createdAt)}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Attach status change and delete handlers
  container.querySelectorAll(".btn-task-progress").forEach(btn => {
    btn.addEventListener("click", async () => {
      const taskId = btn.dataset.taskId;
      const nextStatus = btn.dataset.nextStatus;
      await updateTaskStatus(taskId, nextStatus);
    });
  });

  container.querySelectorAll(".btn-task-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const taskId = btn.dataset.taskId;
      if (confirm("Ar tikrai norite pašalinti šią užduotį?")) {
        await deleteTask(taskId);
      }
    });
  });
}

async function updateTaskStatus(taskId, status) {
  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
  try {
    const res = await fetch("/api/admin/tasks/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status, adminEmail: currentUserEmail })
    });
    if (res.ok) {
      showToast(`Užduoties būsena atnaujinta!`, "success");
      await loadTasks();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    }
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  }
}

async function deleteTask(taskId) {
  const currentUserEmail = sessionStorage.getItem("admin_user_email") || "azuolynasfilmfestival@gmail.com";
  try {
    const res = await fetch("/api/admin/tasks/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, adminEmail: currentUserEmail })
    });
    if (res.ok) {
      showToast("Užduotis pašalinta.", "info");
      await loadTasks();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    }
  } catch (err) {
    showToast("Klaida: " + err.message, "error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("lt-LT", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
