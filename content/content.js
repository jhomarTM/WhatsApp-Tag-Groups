// WhatsApp Tag Groups - Content Script
// Extensión para etiquetar grupos de personas en WhatsApp Web

(function() {
  'use strict';

  let tagGroups = [];
  let isInitialized = false;

  // Inicialización
  function init() {
    if (isInitialized) return;
    loadGroups();
    observeChat();
    chrome.runtime.onMessage.addListener(handleMessage);
    isInitialized = true;
  }

  // Cargar grupos desde storage
  async function loadGroups() {
    try {
      const result = await chrome.storage.local.get(['tagGroups']);
      tagGroups = result.tagGroups || [];
    } catch (error) {
      console.error('[TagGroups] Error cargando grupos:', error);
    }
  }

  // Manejar mensajes
  function handleMessage(message, sender, sendResponse) {
    if (message.type === 'GROUPS_UPDATED') {
      tagGroups = message.groups;
    }
  }

  // Botón flotante
  let floatingContainer = null;
  let positionInterval = null;
  
  function injectComposeButton() {
    const footer = document.querySelector('footer');
    const mainPanel = document.querySelector('#main');
    
    if (!footer || !mainPanel) {
      if (floatingContainer) floatingContainer.style.display = 'none';
      return;
    }
    
    if (floatingContainer && document.body.contains(floatingContainer)) {
      floatingContainer.style.display = 'flex';
      positionButton();
      return;
    }
    
    floatingContainer = document.createElement('div');
    floatingContainer.id = 'tag-floating-container';
    
    const tagBtn = document.createElement('button');
    tagBtn.id = 'tag-floating-btn';
    tagBtn.setAttribute('aria-label', 'Tag mentions');
    tagBtn.title = 'Insertar menciones de grupo';
    tagBtn.innerHTML = `
      <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
      </svg>
    `;
    
    const dropdown = document.createElement('div');
    dropdown.id = 'tag-floating-dropdown';
    
    floatingContainer.appendChild(tagBtn);
    floatingContainer.appendChild(dropdown);
    document.body.appendChild(floatingContainer);
    
    positionButton();
    
    if (positionInterval) clearInterval(positionInterval);
    positionInterval = setInterval(positionButton, 500);
    window.addEventListener('resize', positionButton);
    
    tagBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const isVisible = dropdown.style.display === 'block';
      if (!isVisible) {
        renderFloatingDropdown();
        dropdown.style.display = 'block';
      } else {
        dropdown.style.display = 'none';
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!floatingContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
  
  function positionButton() {
    if (!floatingContainer) return;
    
    const footer = document.querySelector('footer');
    const mainPanel = document.querySelector('#main');
    
    if (!footer || !mainPanel) {
      floatingContainer.style.display = 'none';
      return;
    }
    
    floatingContainer.style.display = 'flex';
    const footerRect = footer.getBoundingClientRect();
    const mainRect = mainPanel.getBoundingClientRect();
    
    floatingContainer.style.left = (mainRect.left + 12) + 'px';
    floatingContainer.style.bottom = (window.innerHeight - footerRect.top + 8) + 'px';
  }
  
  function renderFloatingDropdown() {
    const dropdown = document.getElementById('tag-floating-dropdown');
    if (!dropdown) return;
    
    let content = '';
    
    if (tagGroups.length === 0) {
      content = `
        <div class="tg-empty">
          No hay grupos.<br>Crea uno desde la extensión.
        </div>
      `;
    } else {
      const items = tagGroups.map(group => `
        <div class="tg-item" data-group-id="${group.id}">
          <span class="tg-item-name">${escapeHtml(group.name)}</span>
          <span class="tg-item-count">${group.members.length}</span>
        </div>
      `).join('');
      
      content = `
        <div class="tg-header">Insertar menciones grupales</div>
        <div class="tg-list">${items}</div>
      `;
    }
    
    dropdown.innerHTML = content;
    
    dropdown.querySelectorAll('.tg-item').forEach(item => {
      item.addEventListener('click', () => {
        const groupId = item.dataset.groupId;
        insertGroupMentions(groupId);
        dropdown.style.display = 'none';
      });
    });
  }
  
  // Botón en header para agregar contacto
  function injectHeaderButton() {
    if (document.querySelector('.tag-header-btn')) return;
    
    const mainPanel = document.querySelector('#main');
    if (!mainPanel) return;
    
    const header = mainPanel.querySelector('header');
    if (!header) return;
    
    let contactName = '';
    const infoSection = header.querySelector('div[role="button"][data-tab="6"]');
    
    if (infoSection) {
      const nameSpan = infoSection.querySelector('span[dir="auto"]');
      if (nameSpan) {
        contactName = '';
        for (const node of nameSpan.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            contactName += node.textContent;
          }
        }
        contactName = contactName.trim();
      }
    }
    
    if (!contactName) {
      const spans = header.querySelectorAll('span[dir="auto"]');
      for (const span of spans) {
        let text = '';
        for (const node of span.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
          }
        }
        text = text.trim();
        
        const excludedTexts = ['profile details', 'click', 'search', 'video', 'call', 'menu', 'more', 'back', 'type a message'];
        const isExcluded = excludedTexts.some(ex => text.toLowerCase() === ex.toLowerCase());
        
        if (text.length > 1 && !isExcluded && !text.match(/^[\d\s,]+$/) && !text.includes(',')) {
          contactName = text;
          break;
        }
      }
    }
    
    if (!contactName || contactName.length < 1) return;
    
    const addBtn = document.createElement('button');
    addBtn.className = 'tag-header-btn';
    addBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <circle cx="7" cy="7" r="1" fill="currentColor"/>
      </svg>
      <span>Agregar a grupo</span>
    `;
    addBtn.title = `Agregar "${contactName}" a un grupo de menciones`;
    
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showAddToGroupModal(contactName, addBtn);
    });
    
    header.style.position = 'relative';
    header.appendChild(addBtn);
  }

  // Observar cambios en el DOM
  function observeChat() {
    const observer = new MutationObserver(() => {
      injectHeaderButton();
      injectComposeButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      injectHeaderButton();
      injectComposeButton();
    }, 1000);
  }

  // Insertar menciones del grupo
  async function insertGroupMentions(groupId) {
    const group = tagGroups.find(g => g.id === groupId);
    if (!group || group.members.length === 0) {
      showNotification('Grupo vacío - agrega miembros primero', 'error');
      return;
    }

    const messageInput = document.querySelector('footer [contenteditable="true"][data-tab="10"]') ||
                         document.querySelector('footer [contenteditable="true"]');
    
    if (!messageInput) {
      showNotification('No se encontró el chat', 'error');
      return;
    }

    let successCount = 0;
    const notFound = [];
    
    for (const member of group.members) {
      const success = await insertRealMention(messageInput, member.name);
      if (success) {
        successCount++;
      } else {
        notFound.push(member.name);
      }
      await sleep(40);
    }
    
    if (successCount > 0 && notFound.length === 0) {
      showNotification(`${successCount} menciones insertadas`);
    } else if (successCount > 0 && notFound.length > 0) {
      showNotification(`${successCount} insertadas. No encontrados: ${notFound.join(', ')}`, 'warning');
    } else {
      showNotification(`No encontrados en este grupo: ${notFound.join(', ')}`, 'error');
    }
  }
  
  // Normalizar texto para búsqueda
  function normalizeForSearch(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'n');
  }
  
  // Extraer nombre de elemento del dropdown
  function getContactNameFromElement(element) {
    const spans = element.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent.trim();
      if (text.length > 0 && text.length < 40 && !text.includes('~') && !text.includes('Contact')) {
        return text;
      }
    }
    return element.textContent.trim().split('\n')[0].substring(0, 40);
  }
  
  // Insertar una mención real
  async function insertRealMention(input, contactName) {
    return new Promise(async (resolve) => {
      try {
        input.focus();
        await sleep(20);
        
        const normalizedName = normalizeForSearch(contactName);
        const searchText = '@' + normalizedName;
        document.execCommand('insertText', false, searchText);
        await sleep(250);
        
        const popoverBucket = document.querySelector('#wa-popovers-bucket');
        const hasDropdown = popoverBucket && popoverBucket.innerHTML.length > 100;
        
        if (!hasDropdown) {
          document.execCommand('insertText', false, ' ');
          resolve(false);
          return;
        }
        
        // Buscar items del dropdown
        const items = [];
        const allDivs = popoverBucket.querySelectorAll('div');
        
        for (const div of allDivs) {
          const text = div.textContent.trim();
          const hasAvatar = div.querySelector('img, svg, [data-icon], span[data-icon]');
          const hasTabindex = div.hasAttribute('tabindex') || div.closest('[tabindex]');
          const rightSize = div.offsetHeight > 40 && div.offsetHeight < 150;
          const hasText = text.length > 0 && text.length < 100;
          
          const isContactItem = hasText && rightSize && (hasAvatar || hasTabindex);
          
          if (isContactItem) {
            const isDuplicate = items.some(i => i.element.contains(div) || div.contains(i.element));
            if (!isDuplicate) {
              const name = getContactNameFromElement(div);
              if (name.length > 0 && !name.toLowerCase().includes('contact')) {
                items.push({ element: div, name: name });
              }
            }
          }
        }
        
        if (items.length === 0) {
          // Fallback: buscar por nombre directo
          const searchLower = contactName.toLowerCase().trim();
          const allElements = popoverBucket.querySelectorAll('span, div');
          
          let foundElement = null;
          
          for (const el of allElements) {
            const text = (el.textContent || '').trim();
            const textLower = text.toLowerCase();
            
            if (text.length === 0 || text.length > 50) continue;
            
            const isExact = textLower === searchLower;
            const startsWith = textLower.startsWith(searchLower);
            const contains = textLower.includes(searchLower);
            
            if (isExact || startsWith) {
              foundElement = el;
              break;
            } else if (contains && !foundElement) {
              foundElement = el;
            }
          }
          
          if (foundElement) {
            const clickable = foundElement.closest('[tabindex]') || 
                             foundElement.closest('div') || 
                             foundElement.parentElement?.parentElement ||
                             foundElement;
            
            clickable.click();
            await sleep(150);
            
            document.execCommand('insertText', false, ' ');
            resolve(true);
            return;
          }
          
          document.execCommand('insertText', false, ' ');
          resolve(false);
          return;
        }
        
        // Buscar mejor match
        const searchLower = contactName.toLowerCase().trim();
        let bestItem = null;
        let bestScore = 0;
        
        for (const item of items) {
          const nameLower = item.name.toLowerCase().trim();
          let score = 0;
          
          if (nameLower === searchLower) {
            score = 100;
          } else if (nameLower.startsWith(searchLower + ' ') || nameLower.startsWith(searchLower)) {
            score = 70;
          } else if (nameLower.includes(' ' + searchLower) || nameLower.includes(searchLower + ' ')) {
            score = 30;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestItem = item;
          }
        }
        
        if (bestItem && bestScore >= 50) {
          bestItem.element.click();
          await sleep(120);
          
          const stillOpen = document.querySelector('#wa-popovers-bucket')?.innerHTML.length > 100;
          if (stillOpen) {
            const innerClickable = bestItem.element.querySelector('[tabindex], button, [role="button"]');
            if (innerClickable) {
              innerClickable.click();
              await sleep(80);
            }
          }
          
          document.execCommand('insertText', false, ' ');
          resolve(true);
          return;
        } else {
          document.execCommand('insertText', false, ' ');
          resolve(false);
          return;
        }
        
      } catch (error) {
        console.error('[TagGroups] Error:', error);
        document.execCommand('insertText', false, ' ');
        resolve(false);
      }
    });
  }
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Modal para agregar a grupo
  function showAddToGroupModal(contactName, referenceElement) {
    const existingModal = document.getElementById('tag-add-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'tag-add-modal';
    modal.className = 'tag-add-modal';
    
    const groupOptions = tagGroups.length > 0
      ? tagGroups.map(g => `
          <div class="modal-group-item" data-group-id="${g.id}">
            ${escapeHtml(g.name)}
            <span class="modal-group-count">(${g.members.length})</span>
          </div>
        `).join('')
      : '<div class="modal-empty">No hay grupos. Crea uno desde la extensión.</div>';

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          Agregar "${escapeHtml(contactName)}" a:
        </div>
        <div class="modal-body">
          ${groupOptions}
        </div>
        <button class="modal-close">×</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelectorAll('.modal-group-item').forEach(item => {
      item.addEventListener('click', async () => {
        const groupId = item.dataset.groupId;
        await addMemberToGroup(groupId, contactName);
        modal.remove();
      });
    });
  }

  // Agregar miembro a grupo
  async function addMemberToGroup(groupId, contactName) {
    const member = {
      id: generateId(),
      name: contactName
    };

    const group = tagGroups.find(g => g.id === groupId);
    const groupName = group?.name || 'grupo';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_MEMBER_TO_GROUP',
        groupId: groupId,
        member: member
      });

      if (response.success) {
        showNotification(`"${contactName}" agregado a "${groupName}"`);
        await loadGroups();
      } else {
        showNotification(response.error || 'Error al agregar', 'error');
      }
    } catch (error) {
      console.error('[TagGroups] Error:', error);
      showNotification('Error al agregar miembro', 'error');
    }
  }

  // Mostrar notificación
  function showNotification(message, type = 'success') {
    const existing = document.querySelector('.tag-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `tag-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    const duration = Math.max(3000, message.length * 50);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, duration);
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

  // Iniciar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 2000);
  }

})();
