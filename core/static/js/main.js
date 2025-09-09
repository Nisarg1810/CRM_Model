// Loader functionality
// Get loader element
const loader = document.getElementById('loader');

// Hide loader after page loads
document.addEventListener('DOMContentLoaded', function() {
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 1000);
    }
});

// Function to show loader
function showLoader() {
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.remove('hidden');
    }
}

// Function to hide loader
function hideLoader() {
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// Custom JS for CRM 

// Global variables for tracking notifications and chat
let lastNotificationCount = 0;
let lastChatCount = 0;
let notificationSound = null;

// Initialize notification sound
function initNotificationSound() {
  try {
    notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Notification logic with enhanced features
function fetchNotifications() {
  fetch('/notifications/user/')
    .then(res => res.json())
    .then(data => {
      const notifList = document.getElementById('notif-list');
      const badge = document.getElementById('notif-unread-badge');
      if (!notifList || !badge) return;
      
      let unreadCount = 0;
      notifList.innerHTML = '';
      
      if (data.length === 0) {
        notifList.innerHTML = '<li class="px-3 py-2 text-center text-muted"><i class="bi bi-bell-slash"></i> No notifications</li>';
      } else {
        data.forEach(n => {
          const li = document.createElement('li');
          li.className = 'dropdown-item px-3 py-2 notification-item' + (n.is_read ? '' : ' unread');
          li.setAttribute('data-notification-id', n.id);
          
          const timeAgo = getTimeAgo(new Date(n.timestamp));
          const icon = getNotificationIcon(n.message);
          
          li.innerHTML = `
            <div class="d-flex align-items-start">
              <div class="me-2">${icon}</div>
              <div class="flex-grow-1">
                <div class="small">${n.message}</div>
                <small class="text-muted">${timeAgo}</small>
              </div>
            </div>
          `;
          
          // Add click handler to mark as read
          if (!n.is_read) {
            li.addEventListener('click', function() {
              markNotificationAsRead(n.id, li);
            });
          }
          
          notifList.appendChild(li);
          if (!n.is_read) unreadCount++;
        });
      }
      
      // Show/hide badge
      if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        
        // Play sound for new notifications
        if (unreadCount > lastNotificationCount && notificationSound) {
          notificationSound.play().catch(e => console.log('Audio play failed'));
        }
      } else {
        badge.style.display = 'none';
        badge.textContent = '';
      }
      
      lastNotificationCount = unreadCount;
    })
    .catch(error => {
      console.error('Error fetching notifications:', error);
    });
}

// Get appropriate icon for notification type
function getNotificationIcon(message) {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('task') && lowerMsg.includes('assigned')) {
    return '<i class="bi bi-clipboard-plus text-primary"></i>';
  } else if (lowerMsg.includes('completed')) {
    return '<i class="bi bi-check2-square text-success"></i>';
  } else if (lowerMsg.includes('approved')) {
    return '<i class="bi bi-patch-check text-success"></i>';
  } else if (lowerMsg.includes('chat') || lowerMsg.includes('message')) {
    return '<i class="bi bi-chat-dots text-info"></i>';
  } else if (lowerMsg.includes('feedback')) {
    return '<i class="bi bi-star text-warning"></i>';
  } else {
    return '<i class="bi bi-bell text-secondary"></i>';
  }
}

// Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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

// Mark individual notification as read
function markNotificationAsRead(notificationId, element) {
  const formData = new FormData();
  formData.append('notification_id', notificationId);
  
  fetch('/notifications/mark_read/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: formData,
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      element.classList.remove('unread');
      element.classList.add('read');
      fetchNotifications(); // Refresh the notification count
    }
  })
  .catch(error => {
    console.error('Error marking notification as read:', error);
  });
}

// Mark all as read
const markAllReadBtn = document.getElementById('markAllReadBtn');
if (markAllReadBtn) {
  markAllReadBtn.onclick = function() {
    // Mark all notifications as read
    fetch('/notifications/mark_read/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: '', // Empty body means mark all as read
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Hide the badge immediately
        const badge = document.getElementById('notif-unread-badge');
        if (badge) {
          badge.style.display = 'none';
          badge.textContent = '';
        }
        // Reset the last notification count
        lastNotificationCount = 0;
        // Refresh notifications to update the list
        fetchNotifications();
      }
    })
    .catch(error => {
      console.error('Error marking all notifications as read:', error);
    });
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
  fetch('/chat/unread_count?all=1')
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
          badge.textContent = '';
        }
        }
      }
    });
}
setInterval(pollSidebarUnreadBadges, 3000);

// --- Enhanced Chat unread badge logic without popup alerts ---
function pollNavbarChatBadge() {
  fetch('/chat/unread_count')
    .then(response => response.json())
    .then(data => {
      var badge = document.getElementById('chat-unread-badge');
      if (badge) {
        if (data.unread_count > 0) {
          badge.style.display = 'inline-block';
          badge.textContent = data.unread_count > 99 ? '99+' : data.unread_count;
        } else {
          badge.style.display = 'none';
          badge.textContent = '';
        }
      }
      lastChatCount = data.unread_count || 0;
    })
    .catch(error => {
      console.error('Error fetching chat count:', error);
    });
}

// Removed showChatPopup function - no more popup animations

setInterval(pollNavbarChatBadge, 3000);

// Mark chat messages as read when chat button is clicked
function markChatAsRead() {
  fetch('/chat/mark_read/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin'
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Hide the badge immediately
      const badge = document.getElementById('chat-unread-badge');
      if (badge) {
        badge.style.display = 'none';
        badge.textContent = '';
      }
      // Reset the last chat count to prevent popup
      lastChatCount = 0;
      
      // Remove any existing chat popups
      const existingPopups = document.querySelectorAll('.chat-popup');
      existingPopups.forEach(popup => popup.remove());
    }
  })
  .catch(error => {
    console.error('Error marking chat as read:', error);
  });
}

// Add click handler to chat button
function setupChatButtonHandler() {
  const chatButton = document.getElementById('chat-button');
  if (chatButton) {
    chatButton.addEventListener('click', function(e) {
      // Mark messages as read when button is clicked
      markChatAsRead();
    });
  }
}

// Initial load
window.onload = function() {
  // Initialize notification sound
  initNotificationSound();
  
  // Setup chat button handler
  setupChatButtonHandler();
  
  // Start polling functions
  if (typeof pollSidebarUnreadBadges === 'function') pollSidebarUnreadBadges();
  if (typeof pollNavbarChatBadge === 'function') pollNavbarChatBadge();
  
  // Fetch initial notifications
  fetchNotifications();
  
  // Request notification permission for better UX
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}; 