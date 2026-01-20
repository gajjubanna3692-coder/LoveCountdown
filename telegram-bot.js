const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

// Create bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Subscriber management functions
async function readSubscribers() {
    try {
        const data = await fs.readFile(SUBSCRIBERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return empty array
        return [];
    }
}

async function saveSubscribers(subscribers) {
    await fs.writeFile(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
}

async function addSubscriber(chatId, username) {
    const subscribers = await readSubscribers();
    
    // Check if already subscribed
    const existingIndex = subscribers.findIndex(sub => sub.chatId === chatId);
    
    if (existingIndex === -1) {
        subscribers.push({
            chatId: chatId,
            username: username,
            subscribedAt: new Date().toISOString()
        });
        await saveSubscribers(subscribers);
        return true; // New subscriber added
    }
    
    return false; // Already subscribed
}

async function removeSubscriber(chatId) {
    const subscribers = await readSubscribers();
    const initialLength = subscribers.length;
    
    const filteredSubscribers = subscribers.filter(sub => sub.chatId !== chatId);
    
    if (filteredSubscribers.length < initialLength) {
        await saveSubscribers(filteredSubscribers);
        return true; // Subscriber removed
    }
    
    return false; // Subscriber not found
}

// Send notifications to all subscribers
async function sendDailyNotifications() {
    try {
        console.log('Reading subscribers for notifications...');
        const subscribers = await readSubscribers();
        
        if (subscribers.length === 0) {
            console.log('No subscribers to notify');
            return;
        }
        
        console.log(`Sending notifications to ${subscribers.length} subscribers...`);
        
        // Example message - customize this based on your needs
        const message = "📢 Daily Update!\n\nThis is your daily notification from the Love Countdown bot! ❤️\n\nUse /help to see available commands.";
        
        // Send to all subscribers
        for (const subscriber of subscribers) {
            try {
                await bot.sendMessage(subscriber.chatId, message);
                console.log(`Notification sent to ${subscriber.username || subscriber.chatId}`);
                // Add delay to avoid hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to send notification to ${subscriber.chatId}:`, error.message);
                // Remove inactive subscribers
                if (error.response && error.response.statusCode === 403) {
                    console.log(`Removing inactive subscriber: ${subscriber.chatId}`);
                    await removeSubscriber(subscriber.chatId);
                }
            }
        }
        
        console.log('Daily notifications sent successfully!');
    } catch (error) {
        console.error('Error in sendDailyNotifications:', error);
    }
}

// Bot commands
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const welcomeMessage = `
👋 Welcome, ${username}!

I'm your Love Countdown Bot! ❤️

Available commands:
/start - Start the bot
/subscribe - Subscribe to daily notifications
/unsubscribe - Unsubscribe from notifications
/help - Show this help message
/about - About this bot

Use /subscribe to get daily love countdown updates!`;
    
    bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/subscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const added = await addSubscriber(chatId, username);
    
    if (added) {
        bot.sendMessage(chatId, `✅ You have been subscribed to daily notifications, ${username}!\n\nYou will receive daily updates about your love countdown. ❤️\n\nUse /unsubscribe to stop receiving notifications.`);
    } else {
        bot.sendMessage(chatId, `ℹ️ You are already subscribed to notifications, ${username}!\n\nUse /unsubscribe if you wish to stop receiving updates.`);
    }
});

bot.onText(/\/unsubscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const removed = await removeSubscriber(chatId);
    
    if (removed) {
        bot.sendMessage(chatId, `✅ You have been unsubscribed from notifications, ${username}.\n\nYou will no longer receive daily updates.\n\nUse /subscribe if you change your mind!`);
    } else {
        bot.sendMessage(chatId, `ℹ️ You were not subscribed to notifications, ${username}.\n\nUse /subscribe to start receiving daily updates!`);
    }
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🤖 Love Countdown Bot Help

Available commands:
/start - Start the bot
/subscribe - Subscribe to daily love countdown notifications
/unsubscribe - Unsubscribe from notifications
/help - Show this help message
/about - About this bot
/subscribers - Show subscriber count (admin only)

Daily notifications include:
• Love countdown updates
• Romantic messages
• Relationship tips
• Special date reminders

For support, contact the bot administrator.`;
    
    bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/about/, (msg) => {
    const chatId = msg.chat.id;
    
    const aboutMessage = `
❤️ Love Countdown Bot

Version: 1.0.0
Created with ❤️ for couples

This bot helps you:
• Track important relationship dates
• Count down to special occasions
• Receive daily romantic messages
• Celebrate love milestones

Made with node-telegram-bot-api
Open source on GitHub`;
    
    bot.sendMessage(chatId, aboutMessage);
});

// Admin command to check subscribers
bot.onText(/\/subscribers/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Simple admin check (you might want to implement proper admin checking)
    const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    
    if (ADMIN_IDS.includes(chatId.toString())) {
        const subscribers = await readSubscribers();
        bot.sendMessage(chatId, `📊 Subscriber Stats:\n\nTotal subscribers: ${subscribers.length}\n\nSubscribers list:\n${subscribers.map((sub, index) => `${index + 1}. ${sub.username || 'Anonymous'} (${sub.chatId})`).join('\n')}`);
    } else {
        bot.sendMessage(chatId, "⛔ This command is for administrators only.");
    }
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Initialize the bot
console.log('🤖 Telegram bot is running...');

// Set up daily notifications (runs at 9 AM every day)
function scheduleDailyNotifications() {
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(9, 0, 0, 0); // 9 AM
    
    // If it's already past 9 AM today, schedule for tomorrow
    if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeUntilTarget = targetTime.getTime() - now.getTime();
    
    setTimeout(() => {
        sendDailyNotifications();
        // Schedule again for next day
        setInterval(sendDailyNotifications, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilTarget);
    
    console.log(`⏰ Next notification scheduled for: ${targetTime.toLocaleString()}`);
}

// Start scheduling notifications
scheduleDailyNotifications();

// For testing: send notifications immediately on start (optional)
// Uncomment if you want to test notifications on bot restart
// sendDailyNotifications();

// Export functions for external use
module.exports = {
    bot,
    readSubscribers,
    saveSubscribers,
    addSubscriber,
    removeSubscriber,
    sendDailyNotifications
};
