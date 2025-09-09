// Employee Chat JavaScript
class EmployeeChat {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.typingTimer = null;
        this.autoRefreshInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.scrollToBottom();
        this.focusInput();
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Handle form submission
        this.chatForm.addEventListener('submit', (e) => {
            this.handleFormSubmission(e);
        });
        
        // Handle Enter key (send on Enter, new line on Shift+Enter)
        this.messageInput.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // Typing indicator
        this.messageInput.addEventListener('input', () => {
            this.showTypingIndicator();
        });
        
        // Focus input on page load
        this.messageInput.focus();
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
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
        this.sendButton.disabled = true;
        this.sendButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';
        
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
            
            // Clear input and reset height immediately
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            
            const response = await fetch('/chat/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify({
                    content: messageContent,
                    receiver_username: window.adminUsername || 'admin' // Employee always chats with admin
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update unread count
                this.updateUnreadCount();
                
                // Force immediate refresh to show any new messages from admin
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
            this.sendButton.disabled = false;
            this.sendButton.innerHTML = '<i class="bi bi-send"></i> Send';
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
    
    showTypingIndicator() {
        clearTimeout(this.typingTimer);
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
        }
        
        this.typingTimer = setTimeout(() => {
            this.hideTypingIndicator();
        }, 1000);
    }
    
    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }
    
    startAutoRefresh() {
        // Auto-refresh messages every 2 seconds for faster real-time updates
        this.autoRefreshInterval = setInterval(() => {
            this.refreshMessages();
        }, 2000);
    }
    
    async refreshMessages() {
        try {
            const adminUsername = window.adminUsername || 'admin';
            console.log('Refreshing messages for admin:', adminUsername);
            const response = await fetch(`/chat/get_messages/?username=${adminUsername}`);
            const data = await response.json();
            
            console.log('Messages response:', data);
            if (data.success) {
                this.updateMessages(data.messages);
            } else {
                console.error('Failed to get messages:', data.error);
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
                <h4 style="margin: 0 0 8px 0; font-size: 16px;">No messages yet</h4>
                <p style="margin: 0; font-size: 13px;">Start the conversation by sending a message to the admin!</p>
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
    

    
    // Utility methods
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
        this.chatMessages.appendChild(messageElement);
        
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
    
    // Cleanup method
    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
    }
}

// Initialize chat when page loads
let chat;
document.addEventListener('DOMContentLoaded', function() {
    chat = new EmployeeChat();
});

// Make chat instance globally available for onclick handlers
window.chat = chat;



// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmployeeChat;
}
