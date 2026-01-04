// Service Worker para la extensión WhatsApp Tag Groups

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['tagGroups'], (result) => {
    if (!result.tagGroups) {
      chrome.storage.local.set({ tagGroups: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_GROUPS') {
    chrome.storage.local.get(['tagGroups'], (result) => {
      sendResponse({ groups: result.tagGroups || [] });
    });
    return true;
  }
  
  if (message.type === 'ADD_MEMBER_TO_GROUP') {
    chrome.storage.local.get(['tagGroups'], (result) => {
      const groups = result.tagGroups || [];
      const group = groups.find(g => g.id === message.groupId);
      
      if (group) {
        const exists = group.members.some(m => m.id === message.member.id);
        if (!exists) {
          group.members.push(message.member);
          chrome.storage.local.set({ tagGroups: groups }, () => {
            sendResponse({ success: true });
            chrome.runtime.sendMessage({ type: 'MEMBER_ADDED' }).catch(() => {});
          });
        } else {
          sendResponse({ success: false, error: 'El miembro ya existe en este grupo' });
        }
      } else {
        sendResponse({ success: false, error: 'Grupo no encontrado' });
      }
    });
    return true;
  }
  
  if (message.type === 'REMOVE_MEMBER_FROM_GROUP') {
    chrome.storage.local.get(['tagGroups'], (result) => {
      const groups = result.tagGroups || [];
      const group = groups.find(g => g.id === message.groupId);
      
      if (group) {
        group.members = group.members.filter(m => m.id !== message.memberId);
        chrome.storage.local.set({ tagGroups: groups }, () => {
          sendResponse({ success: true });
        });
      }
    });
    return true;
  }
});
