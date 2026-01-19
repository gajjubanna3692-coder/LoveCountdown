// Updated telegram-bot.js for GitHub Actions
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GITHUB_PAGES_URL = process.env.GITHUB_PAGES_URL || 'https://gajjubanna3692-coder.github.io/LoveCountdown/';

// Use GitHub Pages URL for web app links
const WEB_APP_URL = GITHUB_PAGES_URL;

// For storing subscribers (using a JSON file in the repo)
const SUBSCRIBERS_FILE = 'subscribers.json';

async function sendDailyNotifications() {
    try {
        // Read subscribers from file
        const subscribers = await readSubscribers();
        
        const currentDay = calculateCurrentDay();
        const dayContent = getDayContent(currentDay);
        
        console.log(`📱 Sending Day ${currentDay} notifications to ${subscribers.length} subscribers`);
        
        // Send to each subscriber
        for (const subscriber of subscribers) {
            await sendNotification(subscriber, dayContent);
            await delay(100); // Avoid rate limiting
        }
        
        console.log('✅ All notifications sent successfully');
        
    } catch (error) {
        console.error('❌ Error sending notifications:', error);
        process.exit(1); // Fail the workflow
    }
}

// Helper function to avoid rate limits
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main execution
if (require.main === module) {
    // Check for required environment variables
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN is not set!');
        console.error('   Please add it to GitHub Secrets');
        process.exit(1);
    }
    
    sendDailyNotifications();
}
