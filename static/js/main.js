// Custom JS for CRM 

// Notification logic
function fetchNotifications() {
  fetch('/notifications/user/')
    .then(res => res.json())
    .then(data => {
      const notifList = document.getElementById('notif-list');
      const badge = document.getElementById('notif-unread-badge');
      if (!notifList || !badge) return;
      notifList.innerHTML = '';
      let unreadCount = 0;
      if (data.length === 0) {
        notifList.innerHTML = '<li class="text-center text-muted">No notifications</li>';
      } else {
        data.forEach(n => {
          const li = document.createElement('li');
          li.className = 'dropdown-item' + (n.is_read ? '' : ' bg-light fw-bold');
          li.innerHTML = `<div><span>${n.message}</span></div><small class='text-muted'>${new Date(n.timestamp).toLocaleString()}</small>`;
          notifList.appendChild(li);
          if (!n.is_read) unreadCount++;
        });
      }
      if (unreadCount > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    });
}

function iconForType(type) {
  switch(type) {
    case 'task_assigned': return '<i class="bi bi-clipboard-plus text-primary"></i>';
    case 'task_completed': return '<i class="bi bi-check2-square text-warning"></i>';
    case 'task_approved': return '<i class="bi bi-patch-check text-success"></i>';
    default: return '<i class="bi bi-info-circle"></i>';
  }
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Mark all as read (already patched for CSRF)
const markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
  markAllReadBtn.onclick = function() {
    fetch('/notifications/mark_read/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    .then(() => fetchNotifications());
  };
}

// Fetch notifications when dropdown is opened
const notifDropdown = document.getElementById('notifDropdown');
if (notifDropdown) {
  notifDropdown.addEventListener('click', fetchNotifications);
}

// Poll notifications every 30s
setInterval(fetchNotifications, 30000);

// --- Chat unread badge logic (admin sidebar) ---
function pollSidebarUnreadBadges() {
  fetch('/dashboard/chat/unread_count?all=1')
    .then(response => response.json())
    .then(data => {
      for (const [dev, count] of Object.entries(data.unread_counts || {})) {
        var badge = document.getElementById('unread-badge-' + dev);
        if (badge) {
          if (count > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = count;
          } else {
            badge.style.display = 'none';
          }
        }
      }
    });
}
setInterval(pollSidebarUnreadBadges, 3000);

// --- Chat unread badge logic (developer navbar) ---
function pollNavbarChatBadge() {
  fetch('/dashboard/chat/unread_count')
    .then(response => response.json())
    .then(data => {
      var badge = document.getElementById('chat-unread-badge');
      if (badge) {
        if (data.unread_count > 0) {
          badge.style.display = 'inline-block';
          badge.textContent = data.unread_count;
        } else {
          badge.style.display = 'none';
        }
      }
    });
}
setInterval(pollNavbarChatBadge, 3000);

// Initial load
window.onload = function() {
  if (typeof pollSidebarUnreadBadges === 'function') pollSidebarUnreadBadges();
  if (typeof pollNavbarChatBadge === 'function') pollNavbarChatBadge();
  fetchNotifications();
}; 