// manage-subscribers.js - Manual subscriber management
const fs = require('fs');

function addSubscriber(chatId, username, userCode) {
    const subscribers = JSON.parse(fs.readFileSync('subscribers.json', 'utf8'));
    
    // Check if already exists
    if (subscribers.find(s => s.chatId === chatId)) {
        console.log('⚠️  Subscriber already exists');
        return;
    }
    
    subscribers.push({
        chatId,
        username,
        userCode,
        subscribedAt: new Date().toISOString()
    });
    
    fs.writeFileSync('subscribers.json', JSON.stringify(subscribers, null, 2));
    console.log('✅ Subscriber added successfully');
}

// Example usage
addSubscriber('123456789', 'your_partner', 'LOVE2024');