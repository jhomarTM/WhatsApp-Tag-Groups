// Estado de la aplicación
let groups = [];
let editingGroupId = null;

// Elementos del DOM
const mainView = document.getElementById('main-view');
const groupForm = document.getElementById('group-form');
const groupsList = document.getElementById('groups-list');
const btnAddGroup = document.getElementById('btn-add-group');
const btnBack = document.getElementById('btn-back');
const btnSaveGroup = document.getElementById('btn-save-group');
const btnDeleteGroup = document.getElementById('btn-delete-group');
const groupNameInput = document.getElementById('group-name');
const membersList = document.getElementById('members-list');
const membersCount = document.getElementById('members-count');
const formTitle = document.getElementById('form-title');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadGroups();
  setupEventListeners();
});

function setupEventListeners() {
  btnAddGroup.addEventListener('click', () => showGroupForm());
  btnBack.addEventListener('click', () => showMainView());
  btnSaveGroup.addEventListener('click', saveGroup);
  btnDeleteGroup.addEventListener('click', deleteGroup);
}

// Cargar grupos desde storage
async function loadGroups() {
  try {
    const result = await chrome.storage.local.get(['tagGroups']);
    groups = result.tagGroups || [];
    renderGroups();
  } catch (error) {
    groups = [];
    renderGroups();
  }
}

// Guardar grupos en storage
async function saveGroupsToStorage() {
  try {
    await chrome.storage.local.set({ tagGroups: groups });
    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'GROUPS_UPDATED', groups });
    });
  } catch (error) {
    // Silent fail
  }
}

// Renderizar lista de grupos
function renderGroups() {
  if (groups.length === 0) {
    groupsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">👥</div>
        <p>No tienes grupos creados.<br>Crea uno para empezar a etiquetar personas rápidamente.</p>
      </div>
    `;
    return;
  }

  groupsList.innerHTML = groups.map(group => `
    <div class="group-item" data-id="${group.id}">
      <div class="group-info">
        <span class="group-name">${escapeHtml(group.name)}</span>
        <span class="group-count">${group.members.length} miembro${group.members.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="group-actions">
        <button class="btn-edit" data-id="${group.id}">Editar</button>
      </div>
    </div>
  `).join('');

  groupsList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.id;
      showGroupForm(groupId);
    });
  });
}

// Mostrar formulario de grupo
function showGroupForm(groupId = null) {
  editingGroupId = groupId;
  
  if (groupId) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      formTitle.textContent = 'Editar grupo';
      groupNameInput.value = group.name;
      btnDeleteGroup.classList.remove('hidden');
      renderMembers(group.members);
    }
  } else {
    formTitle.textContent = 'Nuevo grupo';
    groupNameInput.value = '';
    btnDeleteGroup.classList.add('hidden');
    renderMembers([]);
  }

  mainView.classList.add('hidden');
  groupForm.classList.remove('hidden');
  groupNameInput.focus();
}

// Mostrar vista principal
function showMainView() {
  groupForm.classList.add('hidden');
  mainView.classList.remove('hidden');
  editingGroupId = null;
}

// Renderizar miembros
function renderMembers(members) {
  membersCount.textContent = `(${members.length})`;
  
  if (members.length === 0) {
    membersList.innerHTML = '<p class="empty-members">Sin miembros</p>';
    return;
  }

  membersList.innerHTML = members.map((member, index) => `
    <div class="member-item">
      <span class="member-name">${escapeHtml(member.name)}</span>
      <button class="btn-remove-member" data-index="${index}">×</button>
    </div>
  `).join('');

  membersList.querySelectorAll('.btn-remove-member').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      removeMember(index);
    });
  });
}

// Eliminar miembro
function removeMember(index) {
  if (editingGroupId) {
    const group = groups.find(g => g.id === editingGroupId);
    if (group) {
      group.members.splice(index, 1);
      renderMembers(group.members);
    }
  }
}

// Guardar grupo
async function saveGroup() {
  const name = groupNameInput.value.trim();
  
  if (!name) {
    groupNameInput.focus();
    return;
  }

  if (editingGroupId) {
    const group = groups.find(g => g.id === editingGroupId);
    if (group) {
      group.name = name;
    }
  } else {
    const newGroup = {
      id: generateId(),
      name: name,
      members: []
    };
    groups.push(newGroup);
  }

  await saveGroupsToStorage();
  renderGroups();
  showMainView();
}

// Eliminar grupo
async function deleteGroup() {
  if (!editingGroupId) return;
  
  if (confirm('¿Eliminar este grupo?')) {
    groups = groups.filter(g => g.id !== editingGroupId);
    await saveGroupsToStorage();
    renderGroups();
    showMainView();
  }
}

// Utilidades
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escuchar mensajes del content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEMBER_ADDED') {
    loadGroups();
  }
});
