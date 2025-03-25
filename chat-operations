// Chat operations to handle chat manipulation
export function deleteChat(chatId, chats, setCurrentChatId, saveChats, renderChatList, createNewChat) {
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return;
    
    // Remove the chat
    chats.splice(chatIndex, 1);
    
    // If we deleted the current chat or the last chat, create a new one
    if (chats.length === 0 || chatId === setCurrentChatId) {
        createNewChat();
    } else {
        // Otherwise, switch to the first chat
        setCurrentChatId(chats[0].id);
        renderChatList();
    }
    
    // Save the updated chats
    saveChats();
}
