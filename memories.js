// Memory management utility functions

/**
 * Creates a new memory object
 * @param {string} type - Type of memory (name, location, etc)
 * @param {string} value - The memory value
 * @param {string} text - Human-readable text description
 * @returns {object} New memory object
 */
export function createMemory(type, value, text) {
    return {
        id: Date.now().toString(), // Unique ID for each memory
        type,
        value,
        text: text || value,
        timestamp: Date.now()
    };
}

/**
 * Extracts potential memory information from user messages
 * @param {string} message - User message to analyze
 * @returns {object|null} Memory object if found, null otherwise
 */
export function extractMemoryFromMessage(message) {
    // Pattern for "my name is X" or "I am X" or "I'm X"
    const namePatterns = [
        /my name is (\w+)/i,
        /i am (\w+)/i,
        /i'm (\w+)/i,
        /call me (\w+)/i
    ];
    
    // Check for name patterns
    for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            if (name.length > 0 && !/^(a|an|the)$/i.test(name)) {
                return createMemory(
                    'name',
                    name,
                    `User's name is ${name}`
                );
            }
        }
    }
    
    // Location patterns (e.g., I live in X, I'm from X)
    const locationPatterns = [
        /i live in ([\w\s,]+)/i,
        /i'm from ([\w\s,]+)/i,
        /i am from ([\w\s,]+)/i,
        /my location is ([\w\s,]+)/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            const location = match[1].trim();
            if (location.length > 0) {
                return createMemory(
                    'location',
                    location,
                    `User lives in ${location}`
                );
            }
        }
    }
    
    // Age patterns (e.g., I am X years old, I'm X years old)
    const agePatterns = [
        /i am (\d+) years old/i,
        /i'm (\d+) years old/i,
        /my age is (\d+)/i
    ];
    
    for (const pattern of agePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return createMemory(
                'age',
                match[1],
                `User is ${match[1]} years old`
            );
        }
    }
    
    // Preference patterns (e.g., I like X, I love X)
    const preferencePatterns = [
        /i (?:like|love) ([\w\s]+)/i,
        /my favorite ([\w\s]+) is ([\w\s]+)/i
    ];
    
    for (const pattern of preferencePatterns) {
        const match = message.match(pattern);
        if (match) {
            if (match[2]) { // For "my favorite X is Y" pattern
                return createMemory(
                    'preference',
                    match[2].trim(),
                    `User's favorite ${match[1].trim()} is ${match[2].trim()}`
                );
            } else if (match[1]) { // For "I like/love X" pattern
                return createMemory(
                    'preference',
                    match[1].trim(),
                    `User likes ${match[1].trim()}`
                );
            }
        }
    }
    
    // Job/occupation patterns
    const occupationPatterns = [
        /i (?:work as|am) (?:an?|the) ([\w\s]+)/i,
        /my job is (?:an?|the) ([\w\s]+)/i,
        /my profession is ([\w\s]+)/i
    ];
    
    for (const pattern of occupationPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            return createMemory(
                'occupation',
                match[1].trim(),
                `User works as ${match[1].trim()}`
            );
        }
    }
    
    return null;
}

/**
 * Add a memory to the memories array
 * @param {Array} memories - Current memories array
 * @param {object} memory - Memory object to add
 * @returns {Array} Updated memories array
 */
export function addMemory(memories, memory) {
    const memoryArray = Array.isArray(memories) ? memories : [];
    return [...memoryArray, memory];
}

/**
 * Remove a memory from the memories array by ID
 * @param {Array} memories - Current memories array
 * @param {string} memoryId - ID of memory to remove
 * @returns {Array} Updated memories array
 */
export function removeMemory(memories, memoryId) {
    return memories.filter(memory => memory.id !== memoryId);
}

/**
 * Format memories for inclusion in system message
 * @param {Array} memories - Memories array
 * @returns {string} Formatted memories for system message
 */
export function formatMemoriesForPrompt(memories) {
    if (!memories || memories.length === 0) return '';
    
    return `\n\nUser information:\n${memories.map(m => `- ${m.text}`).join('\n')}`;
}
