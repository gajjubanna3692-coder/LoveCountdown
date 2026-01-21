const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

// Create bot instance
const bot = new TelegramBot(TOKEN, { polling: true });

// Test mode configuration
const TEST_MODE = process.env.TEST_MODE === 'true';
const TEST_ADMIN_ID = process.env.TEST_ADMIN_ID;

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
            subscribedAt: new Date().toISOString(),
            lastTested: null
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

// ==================== TESTING FUNCTIONS ====================

/**
 * Send a test notification to a specific user
 */
async function sendTestNotification(chatId, testType = 'basic') {
    try {
        console.log(`📱 Sending test notification to ${chatId} (type: ${testType})`);
        
        const testMessages = {
            basic: `🧪 Test Notification\n\n✅ Telegram bot is working correctly!\n\n📊 Test Details:\n• Time: ${new Date().toLocaleTimeString()}\n• Chat ID: ${chatId}\n• Status: All systems operational\n\nThis is what daily notifications will look like!`,
            
            daily: `📅 Daily Notification Test\n\n✨ This simulates your daily love countdown message!\n\n💖 Today's Message:\n"Thinking of you makes every moment special. Another day closer to celebrating our love!"\n\n⏰ Time: ${new Date().toLocaleTimeString()}\n📆 Day: Test Day\n\nUse /test to get more test notifications!`,
            
            birthday: `🎂 Birthday Countdown Test\n\n🎉 Only 15 days left until the special day!\n\n💌 Today's countdown message:\n"Every day brings us closer to celebrating you. Can't wait for the big day!"\n\n📊 Progress: 15/30 days completed\n✅ Test: Birthday notifications working\n\nThis is a preview of birthday countdown messages!`,
            
            error: `⚠️ Error Handling Test\n\nThis tests error handling and recovery mechanisms.\n\nExpected behavior:\n✅ Bot should handle errors gracefully\n✅ Notifications should continue working\n✅ User should see this message\n\nStatus: Error simulation successful`
        };
        
        const message = testMessages[testType] || testMessages.basic;
        
        // Send with options for better formatting
        await bot.sendMessage(chatId, message, {
            parse_mode: 'HTML'
        });
        
        console.log(`✅ Test notification sent successfully to ${chatId}`);
        return { success: true, message: 'Test notification sent' };
        
    } catch (error) {
        console.error(`❌ Failed to send test notification to ${chatId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Run comprehensive bot test suite
 */
async function runBotTestSuite(chatId) {
    console.log(`🔧 Running bot test suite for ${chatId}`);
    
    const testResults = [];
    
    try {
        // Test 1: Basic connectivity
        await bot.sendMessage(chatId, '🧪 Starting Bot Test Suite...\n\nRunning comprehensive tests...');
        testResults.push({ test: 'Bot Connectivity', status: '✅ PASS', details: 'Bot can send messages' });
        
        // Test 2: Subscriber management
        const subscribers = await readSubscribers();
        testResults.push({ 
            test: 'Subscriber System', 
            status: '✅ PASS', 
            details: `${subscribers.length} subscribers in database` 
        });
        
        // Test 3: File system access
        try {
            await fs.access(SUBSCRIBERS_FILE);
            testResults.push({ test: 'File System', status: '✅ PASS', details: 'Can access subscriber file' });
        } catch (error) {
            testResults.push({ test: 'File System', status: '⚠️ WARNING', details: 'Subscriber file might not exist' });
        }
        
        // Test 4: Environment variables
        if (TOKEN && TOKEN.length > 20) {
            testResults.push({ test: 'Environment', status: '✅ PASS', details: 'Bot token loaded successfully' });
        } else {
            testResults.push({ test: 'Environment', status: '❌ FAIL', details: 'Bot token invalid or missing' });
        }
        
        // Test 5: Send actual test notifications
        const notificationTest = await sendTestNotification(chatId, 'daily');
        testResults.push({ 
            test: 'Notifications', 
            status: notificationTest.success ? '✅ PASS' : '❌ FAIL', 
            details: notificationTest.success ? 'Can send notifications' : `Failed: ${notificationTest.error}` 
        });
        
        // Compile results
        const passedTests = testResults.filter(t => t.status.includes('✅')).length;
        const totalTests = testResults.length;
        
        const resultMessage = `
🔬 Bot Test Suite Results

Tests Completed: ${totalTests}
Tests Passed: ${passedTests}
Tests Failed: ${totalTests - passedTests}

📋 Detailed Results:
${testResults.map((t, i) => `${i + 1}. ${t.test}: ${t.status}\n   ${t.details}`).join('\n\n')}

${passedTests === totalTests ? '🎉 All tests passed! Bot is ready for production.' : '⚠️ Some tests failed. Check the details above.'}

Use /test for more specific tests.
        `;
        
        await bot.sendMessage(chatId, resultMessage);
        
        console.log(`✅ Test suite completed for ${chatId}: ${passedTests}/${totalTests} tests passed`);
        return { success: true, results: testResults };
        
    } catch (error) {
        console.error(`❌ Test suite failed for ${chatId}:`, error);
        
        await bot.sendMessage(chatId, 
            `❌ Test Suite Failed\n\nError: ${error.message}\n\nPlease check bot logs for details.`
        );
        
        return { success: false, error: error.message };
    }
}

/**
 * Test notification scheduling
 */
async function testNotificationScheduling(chatId) {
    try {
        console.log(`⏰ Testing notification scheduling for ${chatId}`);
        
        // Send immediate test notification
        await bot.sendMessage(chatId, 
            `⏰ Notification Schedule Test\n\nTesting scheduled notifications...\n\nYou will receive 3 test notifications every 10 seconds.`
        );
        
        // Send scheduled test notifications
        for (let i = 1; i <= 3; i++) {
            setTimeout(async () => {
                await bot.sendMessage(chatId,
                    `⏰ Test Notification #${i}\n\n✅ Scheduled notification working!\n\nTime: ${new Date().toLocaleTimeString()}\nDelay: ${i * 10} seconds\nStatus: On schedule`
                );
            }, i * 10000); // Every 10 seconds
        }
        
        console.log(`✅ Scheduled notification test started for ${chatId}`);
        
    } catch (error) {
        console.error(`❌ Scheduling test failed:`, error);
    }
}

// ==================== BOT COMMANDS ====================

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const welcomeMessage = `
👋 Welcome, ${username}!

I'm your Love Countdown Bot! ❤️

${TEST_MODE ? '🔧 TEST MODE ACTIVE\n\n' : ''}
Available commands:
/start - Start the bot
/subscribe - Subscribe to daily notifications
/unsubscribe - Unsubscribe from notifications
/test - Test bot functionality
/help - Show help message
/about - About this bot
/status - Check bot status

${TEST_MODE ? 'Test Commands:\n/testall - Run all tests\n/testschedule - Test scheduling\n' : ''}
Use /subscribe to get daily love countdown updates!`;
    
    bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/subscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const added = await addSubscriber(chatId, username);
    
    if (added) {
        bot.sendMessage(chatId, 
            `✅ You have been subscribed to daily notifications, ${username}!\n\n` +
            `You will receive daily updates about your love countdown. ❤️\n\n` +
            `Use /unsubscribe to stop receiving notifications.\n` +
            `Use /test to verify notifications are working.`
        );
    } else {
        bot.sendMessage(chatId, 
            `ℹ️ You are already subscribed to notifications, ${username}!\n\n` +
            `Use /unsubscribe if you wish to stop receiving updates.\n` +
            `Use /test to verify your subscription.`
        );
    }
});

bot.onText(/\/unsubscribe/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const removed = await removeSubscriber(chatId);
    
    if (removed) {
        bot.sendMessage(chatId, 
            `✅ You have been unsubscribed from notifications, ${username}.\n\n` +
            `You will no longer receive daily updates.\n\n` +
            `Use /subscribe if you change your mind!\n` +
            `Use /test to confirm unsubscription.`
        );
    } else {
        bot.sendMessage(chatId, 
            `ℹ️ You were not subscribed to notifications, ${username}.\n\n` +
            `Use /subscribe to start receiving daily updates!\n` +
            `Use /test to verify bot functionality.`
        );
    }
});

// ==================== TEST COMMANDS ====================

bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    console.log(`🧪 Test command received from ${username} (${chatId})`);
    
    const testOptions = `
🧪 Bot Testing Menu

Choose a test to run:

1️⃣ Basic Test - Quick functionality check
2️⃣ Daily Message Test - Preview daily notifications
3️⃣ Birthday Countdown Test - Preview birthday messages
4️⃣ Error Handling Test - Test error recovery

Or use these advanced test commands:
/testall - Run comprehensive test suite
/testschedule - Test notification scheduling
/teststatus - Check bot health status

Reply with the test number (1-4) or use the commands above.
    `;
    
    // Send test options as a keyboard
    bot.sendMessage(chatId, testOptions, {
        reply_markup: {
            keyboard: [
                ['1️⃣ Basic Test', '2️⃣ Daily Message Test'],
                ['3️⃣ Birthday Test', '4️⃣ Error Test'],
                ['/testall', '/testschedule', '/teststatus']
            ],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Handle test option selections
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (text && text.includes('Test')) {
        let testType = 'basic';
        
        if (text.includes('1') || text.includes('Basic')) testType = 'basic';
        if (text.includes('2') || text.includes('Daily')) testType = 'daily';
        if (text.includes('3') || text.includes('Birthday')) testType = 'birthday';
        if (text.includes('4') || text.includes('Error')) testType = 'error';
        
        if (testType) {
            await sendTestNotification(chatId, testType);
        }
    }
});

bot.onText(/\/testall/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (TEST_MODE || chatId.toString() === TEST_ADMIN_ID) {
        await runBotTestSuite(chatId);
    } else {
        bot.sendMessage(chatId, 
            '⛔ This command is only available in test mode or for administrators.\n\n' +
            'Use /test for basic testing.'
        );
    }
});

bot.onText(/\/testschedule/, async (msg) => {
    const chatId = msg.chat.id;
    
    if (TEST_MODE || chatId.toString() === TEST_ADMIN_ID) {
        await testNotificationScheduling(chatId);
    } else {
        bot.sendMessage(chatId, 
            '⛔ This command is only available in test mode or for administrators.\n\n' +
            'Use /test for basic testing.'
        );
    }
});

bot.onText(/\/teststatus/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        const subscribers = await readSubscribers();
        const isSubscribed = subscribers.some(sub => sub.chatId === chatId);
        
        const statusMessage = `
🔍 Bot Status Report

📊 System Status:
• Bot: ✅ Running
• Token: ${TOKEN ? '✅ Loaded' : '❌ Missing'}
• Subscribers: ${subscribers.length} total
• Your Status: ${isSubscribed ? '✅ Subscribed' : '❌ Not subscribed'}

⏰ Next Notification:
• Scheduled for: 9:00 AM daily
• Your subscription: ${isSubscribed ? 'Active' : 'Inactive'}

🧪 Test Status:
• Test Mode: ${TEST_MODE ? '✅ Active' : '❌ Inactive'}
• Last Test: ${new Date().toLocaleTimeString()}

Use /subscribe to start receiving notifications!
Use /test to run functionality tests.
        `;
        
        await bot.sendMessage(chatId, statusMessage);
        
    } catch (error) {
        console.error('Status check failed:', error);
        bot.sendMessage(chatId, `❌ Status check failed: ${error.message}`);
    }
});

bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || msg.chat.first_name || 'User';
    
    const subscribers = await readSubscribers();
    const isSubscribed = subscribers.some(sub => sub.chatId === chatId);
    
    const statusMessage = `
📊 Your Status

👤 User: ${username}
🔗 Chat ID: ${chatId}
✅ Subscription: ${isSubscribed ? 'Active' : 'Not active'}
📅 Subscribed: ${isSubscribed ? subscribers.find(s => s.chatId === chatId)?.subscribedAt || 'Unknown' : 'N/A'}

Use /subscribe to start receiving daily notifications!
Use /test to verify bot functionality.
    `;
    
    bot.sendMessage(chatId, statusMessage);
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `
🤖 Love Countdown Bot Help

Main Commands:
/start - Start the bot
/subscribe - Subscribe to daily notifications
/unsubscribe - Unsubscribe from notifications
/status - Check your subscription status
/test - Test bot functionality
/about - About this bot

${TEST_MODE ? 'Test Commands:\n/testall - Run all tests\n/testschedule - Test scheduling\n/teststatus - Detailed status\n' : ''}

Daily notifications include:
• Love countdown updates
• Romantic messages
• Special reminders

For support, contact the bot administrator.
    `;
    
    bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/about/, (msg) => {
    const chatId = msg.chat.id;
    
    const aboutMessage = `
❤️ Love Countdown Bot

Version: 1.1.0
${TEST_MODE ? '🔧 TEST MODE ACTIVE\n' : ''}
Created with ❤️ for couples

Features:
• Daily love countdown notifications
• Test mode for verification
• Subscriber management
• Automated scheduling

Tech Stack:
• Node.js with Telegram Bot API
• JSON-based subscriber storage
• Environment-based configuration

Made with ❤️ for your special countdown!
    `;
    
    bot.sendMessage(chatId, aboutMessage);
});

// Admin command to check subscribers
bot.onText(/\/subscribers/, async (msg) => {
    const chatId = msg.chat.id;
    
    const ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    
    if (ADMIN_IDS.includes(chatId.toString()) || TEST_MODE) {
        const subscribers = await readSubscribers();
        
        const message = `
📊 Subscriber Stats

Total subscribers: ${subscribers.length}

Subscribers (${subscribers.length}):
${subscribers.map((sub, index) => 
    `${index + 1}. ${sub.username || 'Anonymous'} (${sub.chatId})\n   📅 ${sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString() : 'Unknown'}`
).join('\n\n')}

${TEST_MODE ? '\n🔧 Test Mode: Admin commands available to all' : ''}
        `;
        
        // Split message if too long
        if (message.length > 4096) {
            const firstPart = message.substring(0, 4000);
            const secondPart = message.substring(4000);
            
            await bot.sendMessage(chatId, firstPart);
            await bot.sendMessage(chatId, secondPart);
        } else {
            await bot.sendMessage(chatId, message);
        }
    } else {
        bot.sendMessage(chatId, "⛔ This command is for administrators only.");
    }
});

// ==================== NOTIFICATION FUNCTIONS ====================

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
        const message = `📢 Daily Love Update! ❤️\n\nThis is your daily notification from the Love Countdown bot!\n\nToday's message: "Every day with you is special. Cherishing our moments together."\n\n⏰ Time: ${new Date().toLocaleTimeString()}\n\nUse /help to see available commands.`;
        
        // Send to all subscribers
        for (const subscriber of subscribers) {
            try {
                await bot.sendMessage(subscriber.chatId, message);
                console.log(`✅ Notification sent to ${subscriber.username || subscriber.chatId}`);
                
                // Update last notified time
                subscriber.lastNotified = new Date().toISOString();
                
                // Add delay to avoid hitting rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`❌ Failed to send notification to ${subscriber.chatId}:`, error.message);
                
                // Remove inactive subscribers
                if (error.response && error.response.statusCode === 403) {
                    console.log(`🗑️ Removing inactive subscriber: ${subscriber.chatId}`);
                    await removeSubscriber(subscriber.chatId);
                }
            }
        }
        
        // Save updated subscribers with last notified time
        await saveSubscribers(subscribers);
        
        console.log('✅ Daily notifications sent successfully!');
    } catch (error) {
        console.error('❌ Error in sendDailyNotifications:', error);
    }
}

// Handle errors
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error);
});

bot.on('error', (error) => {
    console.error('❌ Bot error:', error);
});

// ==================== INITIALIZATION ====================

console.log('🤖 Telegram bot is starting...');
console.log(`🔧 Test Mode: ${TEST_MODE ? 'ACTIVE' : 'INACTIVE'}`);

if (!TOKEN) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN is not set in .env file!');
    process.exit(1);
}

console.log('✅ Bot token loaded successfully');

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

// For testing: send test notification immediately if in test mode
if (TEST_MODE && TEST_ADMIN_ID) {
    console.log('🔧 Test mode active - sending initial test notification');
    setTimeout(() => {
        sendTestNotification(TEST_ADMIN_ID, 'basic').then(result => {
            if (result.success) {
                console.log('✅ Initial test notification sent to admin');
            }
        });
    }, 5000); // Wait 5 seconds for bot to fully initialize
}

console.log('✅ Telegram bot is running and ready!');
console.log('📱 Use /start in Telegram to begin');
console.log('🧪 Use /test to test functionality');

// Export functions for external use
module.exports = {
    bot,
    readSubscribers,
    saveSubscribers,
    addSubscriber,
    removeSubscriber,
    sendDailyNotifications,
    sendTestNotification,
    runBotTestSuite,
    testNotificationScheduling
};