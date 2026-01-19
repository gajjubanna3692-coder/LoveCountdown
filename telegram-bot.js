// This script runs as a GitHub Action via scheduled cron
// It uses the Telegram Bot API to send daily notifications

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GITHUB_PAGES_URL = process.env.GITHUB_PAGES_URL || 'https://your-username.github.io/birthday-countdown';

// Sample data - in reality, you'd store this in a database
// For GitHub Pages, we'll use a JSON file in the repo
const subscribers = require('./subscribers.json');

async function sendTelegramNotification(chatId, day, letter, word) {
    const url = `${GITHUB_PAGES_URL}/?day=${day}`;
    const message = `🎉 *Day ${day} Unlocked!*\n\n*${letter}* is for *${word}*\n\nA new romantic message awaits you! 💝\n\n[Open Day ${day}](${url})`;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: `📖 Open Day ${day}`,
                        url: url
                    }
                ]]
            }
        })
    });
    
    return response.json();
}

function getCurrentDay() {
    // Calculate current day based on start date
    // For demo, we'll use a fixed start date
    const startDate = new Date('2024-01-01');
    const today = new Date();
    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(Math.max(diffDays + 1, 1), 20);
}

function getDayContent(day) {
    const letters = 'ABCDEFGHIJKLMNOPQRST';
    const words = [
        'Adore', 'Beautiful', 'Cherish', 'Dream', 'Eternal',
        'Forever', 'Grace', 'Heart', 'Infinity', 'Joy',
        'Kiss', 'Love', 'Magic', 'Never-ending', 'Only',
        'Passion', 'Quiet', 'Romance', 'Sweet', 'Together'
    ];
    
    return {
        day: day,
        letter: letters[day - 1],
        word: words[day - 1]
    };
}

async function sendDailyNotifications() {
    const currentDay = getCurrentDay();
    const dayContent = getDayContent(currentDay);
    
    console.log(`Sending notifications for Day ${currentDay}: ${dayContent.letter} - ${dayContent.word}`);
    
    // Send to all subscribers
    for (const subscriber of subscribers) {
        try {
            const result = await sendTelegramNotification(
                subscriber.chatId,
                dayContent.day,
                dayContent.letter,
                dayContent.word
            );
            
            if (result.ok) {
                console.log(`Notification sent to ${subscriber.username || subscriber.chatId}`);
            } else {
                console.error(`Failed to send to ${subscriber.username}:`, result.description);
            }
            
            // Delay to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error sending to ${subscriber.username}:`, error);
        }
    }
}

// For local testing
if (require.main === module) {
    require('dotenv').config();
    
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN environment variable is required');
        process.exit(1);
    }
    
    sendDailyNotifications().catch(console.error);
}

module.exports = { sendDailyNotifications };