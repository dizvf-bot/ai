import { systemMessage, behaviorPresets, defaultSettings } from './config.js';
import { deleteChat } from './chat-operations.js';
import { getSystemMessage, formatAIResponse } from './ai-behavior.js';
import { extractMemoryFromMessage, addMemory, removeMemory, formatMemoriesForPrompt } from './memories.js';
import { handleMessageMemoryProcessing } from './memory-utils.js';
import { initializeMemorySystem } from './memory-utils.js';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.getElementById('new-chat-btn');
const chatList = document.getElementById('chat-list');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const themeToggle = document.getElementById('theme-toggle');
const themeSelect = document.getElementById('theme-select');
const fontSizeSelect = document.getElementById('font-size');
const assistantBehaviorSelect = document.getElementById('assistant-behavior');
const autoScrollToggle = document.getElementById('auto-scroll');
const syntaxHighlightToggle = document.getElementById('syntax-highlight');
const exportChatsBtn = document.getElementById('export-chats');
const clearChatsBtn = document.getElementById('clear-chats');
const memoriesList = document.getElementById('memories-list');
const memoryInput = document.getElementById('memory-input');
const addMemoryBtn = document.getElementById('add-memory-btn');

// State variables
let chats = [];
let currentChatId = null;
let conversationHistory = [];
let isProcessing = false;
let settings = { ...defaultSettings };

// Initialize the app
function init() {
    loadChats();
    loadSettings();
    applySettings();
    createNewChat();
    setupEventListeners();
    initializeMemorySystem(settings, saveSettings);
}

// Load chats from localStorage
function loadChats() {
    const savedChats = localStorage.getItem('ai-chats');
    if (savedChats) {
        chats = JSON.parse(savedChats);
        renderChatList();
    }
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('ai-chat-settings');
    if (savedSettings) {
        settings = { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
}

// Apply settings to UI
function applySettings() {
    // Apply theme
    if (settings.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', settings.theme);
    }
    
    // Apply font size
    document.body.className = `font-${settings.fontSize}`;
    
    // Update settings form
    themeSelect.value = settings.theme;
    fontSizeSelect.value = settings.fontSize;
    assistantBehaviorSelect.value = settings.assistantBehavior;
    autoScrollToggle.checked = settings.autoScroll;
    syntaxHighlightToggle.checked = settings.syntaxHighlight;
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('ai-chat-settings', JSON.stringify(settings));
}

// Create a new chat
function createNewChat() {
    const chatId = Date.now().toString();
    const newChat = {
        id: chatId,
        title: 'New Chat',
        messages: [{
            role: "assistant",
            content: "Hello! I'm your AI assistant. How can I help you today?"
        }]
    };
    
    chats.unshift(newChat);
    saveChats();
    renderChatList();
    switchToChat(chatId);
}

// Save chats to localStorage
function saveChats() {
    localStorage.setItem('ai-chats', JSON.stringify(chats));
}

// Render the chat list in the sidebar
function renderChatList() {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.id = chat.id;
        
        chatItem.innerHTML = `
            <div class="chat-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="chat-title">${chat.title}</div>
            <button class="delete-chat-btn" title="Delete chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-4 5v6m-4-6v6m-5-11v16a2 2 0 002 2h10a2 2 0 002-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        
        // Add click listener to chat item (not including the delete button)
        chatItem.addEventListener('click', (e) => {
            // If the click was on the delete button, don't switch chats
            if (!e.target.closest('.delete-chat-btn')) {
                switchToChat(chat.id);
            }
        });
        
        // Add specific click listener to the delete button
        const deleteBtn = chatItem.querySelector('.delete-chat-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the chat item click
            if (confirm('Are you sure you want to delete this chat?')) {
                deleteChat(
                    chat.id, 
                    chats, 
                    (newChatId) => { currentChatId = newChatId; }, 
                    saveChats, 
                    renderChatList, 
                    createNewChat
                );
            }
        });
        
        chatList.appendChild(chatItem);
    });
}

// Switch to a different chat
function switchToChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    // Update UI to show active chat
    renderChatList();
    
    // Clear chat messages and load selected chat
    chatMessages.innerHTML = '';
    conversationHistory = [...chat.messages];
    
    // Display messages
    chat.messages.forEach(msg => {
        addMessageToUI(msg.role, msg.content);
    });
}

// Update chat title based on first user message
function updateChatTitle(message) {
    const currentChat = chats.find(c => c.id === currentChatId);
    if (currentChat && currentChat.title === 'New Chat') {
        // Use first few words of the first message as title
        const words = message.split(' ');
        currentChat.title = words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
        saveChats();
        renderChatList();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120) ? this.scrollHeight + 'px' : '120px';
    });
    
    // Send message button
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter (without Shift)
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // New chat button
    newChatBtn.addEventListener('click', createNewChat);
    
    // Settings button
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    
    // Close settings button
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        settings.theme = newTheme;
        themeSelect.value = newTheme;
        saveSettings();
    });
    
    // Settings form inputs
    themeSelect.addEventListener('change', () => {
        settings.theme = themeSelect.value;
        applySettings();
        saveSettings();
    });
    
    fontSizeSelect.addEventListener('change', () => {
        settings.fontSize = fontSizeSelect.value;
        applySettings();
        saveSettings();
    });
    
    assistantBehaviorSelect.addEventListener('change', () => {
        settings.assistantBehavior = assistantBehaviorSelect.value;
        saveSettings();
    });
    
    autoScrollToggle.addEventListener('change', () => {
        settings.autoScroll = autoScrollToggle.checked;
        saveSettings();
    });
    
    syntaxHighlightToggle.addEventListener('change', () => {
        settings.syntaxHighlight = syntaxHighlightToggle.checked;
        saveSettings();
        
        // Re-render messages to apply or remove syntax highlighting
        if (currentChatId) {
            const chat = chats.find(c => c.id === currentChatId);
            chatMessages.innerHTML = '';
            chat.messages.forEach(msg => {
                addMessageToUI(msg.role, msg.content);
            });
        }
    });
    
    // Export chats
    exportChatsBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chats));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "ai-chat-export.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    });
    
    // Clear chats
    clearChatsBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
            chats = [];
            localStorage.removeItem('ai-chats');
            createNewChat();
        }
    });
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '' || isProcessing) return;

    // Disable input and show processing state
    isProcessing = true;
    sendButton.disabled = true;
    
    // Update chat title if this is the first message
    updateChatTitle(message);
    
    // Add user message to UI
    addMessageToUI('user', message);
    
    // Process message for potential memories
    handleMessageMemoryProcessing(message, settings, saveSettings);
    
    // Clear input field and reset height
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message assistant';
    typingIndicator.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatMessages.appendChild(typingIndicator);
    if (settings.autoScroll) scrollToBottom();

    try {
        // Add message to conversation history
        const newMessage = {
            role: "user",
            content: message
        };
        conversationHistory.push(newMessage);

        // Keep only the last 10 messages to avoid token limits
        const limitedHistory = conversationHistory.slice(-10);

        // Get AI response using the selected behavior
        const selectedBehavior = getSystemMessage(
            settings.assistantBehavior, 
            behaviorPresets, 
            systemMessage
        );
        
        // Add memories to the system message
        const systemMessageWithMemories = selectedBehavior + formatMemoriesForPrompt(settings.memories);

        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemMessageWithMemories
                },
                ...limitedHistory
            ]
        });

        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);

        // Process and format the AI response to ensure conciseness
        const response = formatAIResponse(completion.content);
        
        // Create message container but don't fill it yet
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        messageDiv.innerHTML = `<div class="message-content"><p></p></div>`;
        chatMessages.appendChild(messageDiv);
        
        // Simulate typing effect
        const messageParagraph = messageDiv.querySelector('p');
        let i = 0;
        const typingSpeed = 10; // milliseconds per character (lower = faster)
        
        function typeNextChar() {
            if (i < response.length) {
                messageParagraph.textContent += response.charAt(i);
                i++;
                if (settings.autoScroll) scrollToBottom();
                setTimeout(typeNextChar, typingSpeed);
            } else {
                // Apply formatting after typing is complete
                const formattedContent = formatMessageContent(response);
                messageDiv.querySelector('.message-content').innerHTML = formattedContent;
                
                // Apply syntax highlighting to code blocks if enabled
                if (settings.syntaxHighlight) {
                    messageDiv.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }
            }
        }
        
        typeNextChar();
        
        // Add AI response to conversation history
        conversationHistory.push(completion);
        
        // Update the current chat in the chats array
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
            currentChat.messages = [...conversationHistory];
            saveChats();
        }
        
    } catch (error) {
        // Remove typing indicator
        chatMessages.removeChild(typingIndicator);
        
        // Show error message
        addMessageToUI('assistant', "I'm sorry, I encountered an error. Please try again.");
        console.error("Error:", error);
    }

    // Re-enable input
    isProcessing = false;
    sendButton.disabled = false;
    userInput.focus();
}

// Function to format message content with code highlighting and markdown
function formatMessageContent(content) {
    let formattedContent = content;
    
    if (settings.syntaxHighlight) {
        // Match code blocks with triple backticks and language specification
        formattedContent = formattedContent.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-language">${lang}</span>
                    <button class="copy-button" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 15V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Copy
                    </button>
                </div>
                <div class="code-content">
                    <pre><code class="language-${lang}">${code.trim()}</code></pre>
                </div>
            </div>`;
        });
    } else {
        // Simple code block formatting without syntax highlighting
        formattedContent = formattedContent.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-language">Code</span>
                    <button class="copy-button" onclick="copyCode(this)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 15V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Copy
                    </button>
                </div>
                <div class="code-content">
                    <pre><code>${code.trim()}</code></pre>
                </div>
            </div>`;
        });
    }
    
    // Process inline code and other markdown formatting
    formattedContent = formattedContent
        .replace(/`([^`]+)`/g, '<code>$1</code>') // inline code
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // italic
        .replace(/\n/g, '<br>'); // line breaks
    
    return `<p>${formattedContent}</p>`;
}

function addMessageToUI(role, content) {
    if (role === 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content.replace(/\n/g, '<br>')}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        if (settings.autoScroll) scrollToBottom();
    } else {
        // For assistant messages that aren't using the typing effect
        // This is used for loading saved chats and error messages
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${formatMessageContent(content)}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Apply syntax highlighting to code blocks
        if (settings.syntaxHighlight) {
            messageDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
        
        if (settings.autoScroll) scrollToBottom();
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Copy code to clipboard
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copied!
        `;
        
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
};

// Initialize the app when the DOM is fully loaded
window.addEventListener('DOMContentLoaded', init);

// Focus input field on load
window.addEventListener('load', () => {
    userInput.focus();
});
