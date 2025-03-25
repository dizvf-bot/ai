import { extractMemoryFromMessage, addMemory, removeMemory, createMemory } from './memories.js';

/**
 * Process a user message for potential memories
 * @param {string} message - The user message
 * @param {object} settings - Current settings object
 * @param {function} saveSettings - Function to save settings
 * @returns {object|null} The extracted memory if found, null otherwise
 */
export function processMessageForMemories(message, settings, saveSettings) {
    // Check if message contains memory information
    const potentialMemory = extractMemoryFromMessage(message);
    
    if (potentialMemory && typeof saveSettings === 'function') {
        // Initialize memories array if it doesn't exist
        if (!Array.isArray(settings.memories)) {
            settings.memories = [];
        }
        
        // Add to memories
        settings.memories = addMemory(settings.memories, potentialMemory);
        saveSettings();
        
        // Update UI
        const memoriesList = document.getElementById('memories-list');
        if (memoriesList) {
            renderMemoriesList(memoriesList, settings.memories);
        }
        
        return potentialMemory;
    }
    
    return null;
}

/**
 * Display memory notification in the UI
 * @param {object} memory - The memory object
 */
export function showMemoryNotification(memory) {
    const notification = document.createElement('div');
    notification.className = 'memory-notification';
    notification.textContent = `Added to memories: ${memory.text}`;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

/**
 * Render the memories list in the settings panel
 * @param {Element} memoriesList - The DOM element to render memories into
 * @param {Array} memories - The array of memories
 */
export function renderMemoriesList(memoriesList, memories) {
    if (!memoriesList) return;
    
    memoriesList.innerHTML = '';
    
    if (!memories || memories.length === 0) {
        memoriesList.innerHTML = '<div class="empty-memories-msg">No memories stored yet.</div>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    memories.forEach((memory) => {
        const memoryItem = document.createElement('div');
        memoryItem.className = 'memory-item';
        memoryItem.setAttribute('data-memory-id', memory.id);
        
        memoryItem.innerHTML = `
            <div class="memory-text">${memory.text}</div>
            <button class="delete-memory-btn" title="Delete memory">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        fragment.appendChild(memoryItem);
    });
    
    memoriesList.appendChild(fragment);
}
