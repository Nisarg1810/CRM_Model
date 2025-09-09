// Admin Chat JavaScript
class AdminChat {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.scrollToBottom();
        this.focusInput();
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        // Handle form submission
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (e) => {
                this.handleFormSubmission(e);
            });
        }
        
        // Handle Enter key (send on Enter)
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
        }
        
        // Focus input on page load
        this.focusInput();
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    focusInput() {
        if (this.messageInput) {
            this.messageInput.focus();
        }
    }
    
    handleFormSubmission(e) {
        e.preventDefault();
        const content = this.messageInput.value.trim();
        if (!content) {
            return;
        }
        
        // Disable send button and show loading state
        if (this.sendButton) {
            this.sendButton.disabled = true;
            this.sendButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';
        }
        
        // Send message via AJAX
        this.sendMessage(content);
    }
    
    async sendMessage(content) {
        try {
            // Store the message content for immediate display
            const messageContent = content;
            const currentTime = new Date();
            
            // Add message to chat immediately for instant feedback
            this.addMessage(messageContent, true, currentTime);
            
            // Clear input immediately
            if (this.messageInput) {
                this.messageInput.value = '';
            }
            
            // Get the developer username from the URL or window variable
            const pathParts = window.location.pathname.split('/');
            const developerUsername = pathParts[pathParts.length - 2] || window.developerUsername; // admin_chat/<username>/
            console.log('Developer username for chat:', developerUsername);
            console.log('Sending message to:', developerUsername);
            
            const response = await fetch('/chat/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    content: messageContent,
                    receiver_username: developerUsername
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update unread count
                this.updateUnreadCount();
                
                // Force immediate refresh to show any new messages from employee
                this.refreshMessages();
            } else {
                console.error('Error sending message:', data.error);
                alert('Error sending message: ' + data.error);
                
                // Remove the message if it failed to send
                this.removeLastMessage();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
            
            // Remove the message if it failed to send
            this.removeLastMessage();
        } finally {
            // Re-enable send button
            if (this.sendButton) {
                this.sendButton.disabled = false;
                this.sendButton.innerHTML = '<i class="bi bi-send"></i> Send';
            }
        }
    }
    
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
               document.querySelector('meta[name=csrf-token]')?.content;
    }
    
    updateUnreadCount() {
        // Update the chat unread count badge
        const chatBadge = document.getElementById('chat-unread-badge');
        if (chatBadge) {
            chatBadge.style.display = 'none';
        }
    }
    
    removeLastMessage() {
        if (this.chatMessages && this.chatMessages.children.length > 0) {
            const lastMessage = this.chatMessages.lastElementChild;
            if (lastMessage && lastMessage.classList.contains('sent')) {
                lastMessage.remove();
            }
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Call handleFormSubmission directly instead of form.submit()
            this.handleFormSubmission(e);
        } else if (e.key === 'Enter' && e.shiftKey) {
            // Allow Shift+Enter for new lines
            // Don't prevent default, let it create a new line
        }
    }
    
    // Public methods for external use
    addMessage(content, isSent = true, timestamp = new Date()) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        messageContent.innerHTML = `
            ${content}
            <div class="message-time">${this.formatTimestamp(timestamp)}</div>
        `;
        
        messageElement.appendChild(messageContent);
        if (this.chatMessages) {
            this.chatMessages.appendChild(messageElement);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
        
        return messageElement;
    }
    
    formatTimestamp(timestamp) {
        if (timestamp instanceof Date) {
            return timestamp.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        return timestamp;
    }
    
    startAutoRefresh() {
        // Auto-refresh messages every 2 seconds for faster real-time updates
        this.autoRefreshInterval = setInterval(() => {
            this.refreshMessages();
        }, 2000);
    }
    
    async refreshMessages() {
        try {
            // Get the developer username from the URL or window variable
            const pathParts = window.location.pathname.split('/');
            const developerUsername = pathParts[pathParts.length - 2] || window.developerUsername;
            
            console.log('Admin refreshing messages for employee:', developerUsername);
            const response = await fetch(`/chat/get_messages/?username=${developerUsername}`);
            const data = await response.json();
            
            console.log('Admin messages response:', data);
            if (data.success) {
                this.updateMessages(data.messages);
            } else {
                console.error('Admin failed to get messages:', data.error);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }
    
    updateMessages(messages) {
        if (!this.chatMessages) return;
        
        // Clear existing messages
        this.chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            // Show no messages
            const noMessages = document.createElement('div');
            noMessages.className = 'no-messages';
            noMessages.innerHTML = `
                <i class="bi bi-chat-dots"></i>
                <h4>No messages yet</h4>
                <p>Start the conversation by sending a message!</p>
            `;
            this.chatMessages.appendChild(noMessages);
        } else {
            // Add all messages
            messages.forEach(msg => {
                this.addMessage(msg.content, msg.is_sent, new Date(msg.timestamp));
            });
        }
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    // Cleanup method
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }
}

// Initialize chat when page loads
let adminChat;
document.addEventListener('DOMContentLoaded', function() {
    adminChat = new AdminChat();
});

// Make chat instance globally available
window.adminChat = adminChat;
