import { processMessageForMemories, showMemoryNotification, renderMemoriesList } from './memory-handlers.js';
import { addMemory, removeMemory, createMemory } from './memories.js';

/**
 * Handler for memory management system initialization
 * @param {Object} settings - App settings object
 * @param {Function} saveSettingsCallback - Function to save settings
 */
export function initializeMemorySystem(settings, saveSettingsCallback) {
    // Initialize memories array if needed
    if (!Array.isArray(settings.memories)) {
        settings.memories = [];
        if (typeof saveSettingsCallback === 'function') {
            saveSettingsCallback();
        }
    }
    
    // Get DOM elements
    const memoriesList = document.getElementById('memories-list');
    const memoryInput = document.getElementById('memory-input');
    const addMemoryBtn = document.getElementById('add-memory-btn');
    const clearMemoriesBtn = document.getElementById('clear-memories-btn');
    
    // Initialize UI
    renderMemoriesList(memoriesList, settings.memories);
    
    // Set up event listeners
    if (addMemoryBtn && memoryInput) {
        addMemoryBtn.addEventListener('click', () => {
            addCustomMemory(memoryInput, settings, saveSettingsCallback);
        });
        
        memoryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addCustomMemory(memoryInput, settings, saveSettingsCallback);
            }
        });
    }
    
    if (clearMemoriesBtn) {
        clearMemoriesBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all memories?')) {
                settings.memories = [];
                if (typeof saveSettingsCallback === 'function') {
                    saveSettingsCallback();
                }
                renderMemoriesList(memoriesList, settings.memories);
            }
        });
    }
    
    // Add event delegation for delete buttons
    if (memoriesList) {
        memoriesList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-memory-btn');
            if (deleteBtn) {
                const memoryItem = deleteBtn.closest('.memory-item');
                if (memoryItem) {
                    const memoryId = memoryItem.getAttribute('data-memory-id');
                    settings.memories = removeMemory(settings.memories, memoryId);
                    if (typeof saveSettingsCallback === 'function') {
                        saveSettingsCallback();
                    }
                    renderMemoriesList(memoriesList, settings.memories);
                }
            }
        });
    }
}

/**
 * Process a user message for any potential memories and handle UI updates
 * @param {string} message - User message
 * @param {object} settings - App settings
 * @param {function} saveSettings - Function to save settings
 */
export function handleMessageMemoryProcessing(message, settings, saveSettings) {
    // Check for potential memory in the message
    const potentialMemory = processMessageForMemories(message, settings, saveSettings);
    
    // If we found a memory, show notification
    if (potentialMemory) {
        showMemoryNotification(potentialMemory);
        return true;
    }
    
    return false;
}

/**
 * Add a custom memory from input field
 * @param {Element} memoryInput - Input element
 * @param {Object} settings - App settings
 * @param {Function} saveSettings - Function to save settings
 */
function addCustomMemory(memoryInput, settings, saveSettings) {
    const memoryText = memoryInput.value.trim();
    if (memoryText) {
        // Create new memory
        const newMemory = createMemory('custom', memoryText, memoryText);
        
        // Initialize memories array if needed
        if (!Array.isArray(settings.memories)) {
            settings.memories = [];
        }
        
        // Add to settings
        settings.memories = addMemory(settings.memories, newMemory);
        
        // Save settings
        if (typeof saveSettings === 'function') {
            saveSettings();
        }
        
        // Update UI
        renderMemoriesList(document.getElementById('memories-list'), settings.memories);
        
        // Show notification
        showMemoryNotification(newMemory);
        
        // Clear input
        memoryInput.value = '';
    }
}
