class BirthdayCountdownApp {
    constructor() {
        this.totalDays = 20;
        this.letters = 'ABCDEFGHIJKLMNOPQRST';
        this.words = [
            'Adore', 'Beautiful', 'Cherish', 'Dream', 'Eternal',
            'Forever', 'Grace', 'Heart', 'Infinity', 'Joy',
            'Kiss', 'Love', 'Magic', 'Never-ending', 'Only',
            'Passion', 'Quiet', 'Romance', 'Sweet', 'Together'
        ];
        this.startDate = this.getStartDate();
        this.userCode = this.generateUserCode();
        
        this.init();
    }
    
    init() {
        this.setupServiceWorker();
        this.setupEventListeners();
        this.updateCountdown();
        this.renderDaysGrid();
        this.updateUserCode();
        this.checkInstallPrompt();
    }
    
    getStartDate() {
        // Get start date from localStorage or set to today
        let startDate = localStorage.getItem('countdown_start_date');
        if (!startDate) {
            startDate = new Date().toISOString().split('T')[0];
            localStorage.setItem('countdown_start_date', startDate);
        }
        return new Date(startDate);
    }
    
    generateUserCode() {
        let code = localStorage.getItem('user_code');
        if (!code) {
            code = Math.random().toString(36).substr(2, 8).toUpperCase();
            localStorage.setItem('user_code', code);
        }
        return code;
    }
    
    getCurrentDay() {
        const today = new Date();
        const diffTime = today - this.startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diffDays + 1, 1), this.totalDays + 1);
    }
    
    isDayUnlocked(dayNumber) {
        return dayNumber <= this.getCurrentDay();
    }
    
    updateCountdown() {
        const currentDay = this.getCurrentDay();
        const daysLeft = Math.max(this.totalDays - currentDay + 1, 0);
        const nextLetter = currentDay <= this.totalDays ? this.letters[currentDay - 1] : '🎉';
        
        document.getElementById('currentDay').textContent = currentDay;
        document.getElementById('daysLeft').textContent = daysLeft;
        document.getElementById('nextLetter').textContent = nextLetter;
    }
    
    renderDaysGrid() {
        const container = document.getElementById('daysContainer');
        container.innerHTML = '';
        
        for (let i = 1; i <= this.totalDays; i++) {
            const day = this.createDayCard(i);
            container.appendChild(day);
        }
        
        // Add birthday card
        const birthdayCard = this.createBirthdayCard();
        container.appendChild(birthdayCard);
    }
    
    createDayCard(dayNumber) {
        const isUnlocked = this.isDayUnlocked(dayNumber);
        const letter = this.letters[dayNumber - 1];
        const word = this.words[dayNumber - 1];
        
        const card = document.createElement('div');
        card.className = `day-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="day-header">
                <div class="day-number">Day ${dayNumber}</div>
                <div class="day-letter">${letter}</div>
                <div class="day-word">${word}</div>
            </div>
            <div class="day-content">
                <p>A romantic message about how ${word.toLowerCase()} describes our love...</p>
            </div>
            ${!isUnlocked ? `
                <div class="lock-overlay">
                    <i class="fas fa-lock"></i>
                    <p>Unlocks in ${dayNumber - this.getCurrentDay()} days</p>
                </div>
            ` : ''}
        `;
        
        if (isUnlocked) {
            card.addEventListener('click', () => this.openDayPage(dayNumber));
        }
        
        return card;
    }
    
    createBirthdayCard() {
        const isUnlocked = this.getCurrentDay() > this.totalDays;
        
        const card = document.createElement('div');
        card.className = `day-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="day-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);">
                <div class="day-number">🎉 Birthday! 🎉</div>
                <div class="day-letter">❤️</div>
                <div class="day-word">Happy Birthday!</div>
            </div>
            <div class="day-content">
                <p>The grand finale with special surprises!</p>
            </div>
            ${!isUnlocked ? `
                <div class="lock-overlay">
                    <i class="fas fa-gift"></i>
                    <p>Unlocks on your birthday!</p>
                </div>
            ` : ''}
        `;
        
        if (isUnlocked) {
            card.addEventListener('click', () => this.openBirthdayPage());
        }
        
        return card;
    }
    
    openDayPage(dayNumber) {
        const dayContent = this.getDayContent(dayNumber);
        const page = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Day ${dayNumber}: ${dayContent.word}</title>
                <link rel="stylesheet" href="../styles.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="container day-page">
                    <button class="back-button" onclick="window.history.back()">
                        <i class="fas fa-arrow-left"></i> Back to Countdown
                    </button>
                    
                    <div class="day-header-full">
                        <h1>Day ${dayNumber}</h1>
                        <div class="day-letter" style="font-size: 4rem;">${dayContent.letter}</div>
                        <h2 style="font-size: 2.5rem; margin: 20px 0;">is for ${dayContent.word}</h2>
                        <p style="opacity: 0.9; font-size: 1.2rem;">${dayContent.date}</p>
                    </div>
                    
                    <div class="message-content">
                        <h3><i class="fas fa-quote-left"></i> My Message to You</h3>
                        <p style="font-size: 1.1rem; line-height: 1.8; background: var(--light-pink); padding: 30px; border-radius: 15px;">
                            ${dayContent.message}
                        </p>
                    </div>
                    
                    <div class="day-media">
                        <div class="media-placeholder">
                            <i class="fas fa-image"></i>
                            <h4>Romantic Image</h4>
                            <p>Placeholder for Day ${dayNumber}'s special image</p>
                            <small>Upload your own image in the images/day-${dayNumber}.jpg</small>
                        </div>
                        
                        <div class="media-placeholder">
                            <i class="fas fa-video"></i>
                            <h4>Romantic Video</h4>
                            <p>Placeholder for Day ${dayNumber}'s video message</p>
                            <small>Upload your video in videos/day-${dayNumber}.mp4</small>
                        </div>
                    </div>
                </div>
                
                <script src="../app.js"></script>
            </body>
            </html>
        `;
        
        const newWindow = window.open();
        newWindow.document.write(page);
    }
    
    openBirthdayPage() {
        const page = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🎉 Happy Birthday! 🎉</title>
                <link rel="stylesheet" href="../styles.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="container day-page">
                    <button class="back-button" onclick="window.history.back()">
                        <i class="fas fa-arrow-left"></i> Back to Countdown
                    </button>
                    
                    <div class="day-header-full" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);">
                        <h1 style="font-size: 4rem;">🎂 HAPPY BIRTHDAY! 🎂</h1>
                        <div style="font-size: 3rem; margin: 30px 0;">❤️</div>
                        <p style="font-size: 1.5rem; opacity: 0.9;">The grand finale of our 20-day journey!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <button id="confettiBtn" class="btn-primary" style="font-size: 1.2rem; padding: 15px 30px;">
                            <i class="fas fa-birthday-cake"></i> Launch Confetti!
                        </button>
                    </div>
                    
                    <div style="background: var(--light-pink); padding: 40px; border-radius: 20px; margin: 40px 0;">
                        <h3 style="text-align: center; margin-bottom: 30px;"><i class="fas fa-heart"></i> My Final Message</h3>
                        <p style="font-size: 1.3rem; line-height: 1.8; text-align: center;">
                            Happy Birthday, my love! These 20 days were just a small reminder of how much you mean to me.
                            Every letter, every word, every day was filled with thoughts of you. I hope this countdown
                            brought a smile to your face each day, just like you bring sunshine to my life every single day.
                            Here's to celebrating you today and always! 🥂❤️
                        </p>
                    </div>
                    
                    <div class="day-media">
                        <div class="media-placeholder">
                            <i class="fas fa-images"></i>
                            <h4>Memory Gallery</h4>
                            <p>Placeholder for your birthday photo gallery</p>
                        </div>
                        
                        <div class="media-placeholder">
                            <i class="fas fa-film"></i>
                            <h4>Birthday Video</h4>
                            <p>Placeholder for special birthday video message</p>
                        </div>
                    </div>
                </div>
                
                <script src="../app.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
                <script>
                    document.getElementById('confettiBtn').addEventListener('click', function() {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                        
                        setTimeout(() => {
                            confetti({
                                particleCount: 100,
                                angle: 60,
                                spread: 55,
                                origin: { x: 0 }
                            });
                        }, 250);
                        
                        setTimeout(() => {
                            confetti({
                                particleCount: 100,
                                angle: 120,
                                spread: 55,
                                origin: { x: 1 }
                            });
                        }, 400);
                    });
                    
                    // Auto confetti on page load
                    setTimeout(() => {
                        confetti({
                            particleCount: 50,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }, 1000);
                </script>
            </body>
            </html>
        `;
        
        const newWindow = window.open();
        newWindow.document.write(page);
    }
    
    getDayContent(dayNumber) {
        const letter = this.letters[dayNumber - 1];
        const word = this.words[dayNumber - 1];
        const date = new Date(this.startDate);
        date.setDate(date.getDate() + dayNumber - 1);
        
        const messages = [
            `My love, you are absolutely ${word.toLowerCase()}. Every moment with you feels like a dream come true.`,
            `To me, you embody ${word.toLowerCase()} in every way. Your presence lights up my world.`,
            `${word} - that's what you are to me. The very definition of it in human form.`,
            `Thinking of you fills me with ${word.toLowerCase()}. You complete me in ways I never imagined.`,
            `Your ${word.toLowerCase()} nature is what drew me to you and keeps me captivated every day.`,
            `In your eyes, I see ${word.toLowerCase()}. In your smile, I find home.`,
            `You make everything ${word.toLowerCase()}. Life was ordinary before you, extraordinary after.`,
            `The ${word.toLowerCase()} you bring to my life is the greatest gift I've ever received.`,
            `Every day, I discover new layers of ${word.toLowerCase()} in you. You're my endless adventure.`,
            `Your ${word.toLowerCase()} touches everything around you. You make the world a better place.`,
            `I ${word.toLowerCase()} you more with each passing day. My love for you grows endlessly.`,
            `The ${word.toLowerCase()} we share is the most precious thing in my life.`,
            `You have a ${word.toLowerCase()} way of making everything right. You're my peace.`,
            `Our ${word.toLowerCase()} journey together is my favorite story.`,
            `Your ${word.toLowerCase()} is the melody of my heart.`,
            `In ${word.toLowerCase()}, I find you. In you, I find everything.`,
            `The ${word.toLowerCase()} in your soul is what makes you uniquely you.`,
            `Every ${word.toLowerCase()} moment with you is a treasure I hold dear.`,
            `Your ${word.toLowerCase()} spirit inspires me to be better every day.`,
            `Through ${word.toLowerCase()}, we've built something eternal.`
        ];
        
        return {
            day: dayNumber,
            letter: letter,
            word: word,
            date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            message: messages[dayNumber - 1] || `You are ${word.toLowerCase()} to me in every way. Today and always.`
        };
    }
    
    updateUserCode() {
        document.getElementById('userCode').textContent = this.userCode;
    }
    
    setupEventListeners() {
        // Install button
        document.getElementById('installBtn').addEventListener('click', () => {
            this.promptInstall();
        });
        
        // Notifications button
        document.getElementById('notifyBtn').addEventListener('click', () => {
            this.showNotificationModal();
        });
        
        // Copy code button
        document.getElementById('copyCode').addEventListener('click', () => {
            navigator.clipboard.writeText(this.userCode);
            alert('Code copied to clipboard!');
        });
        
        // Modal close
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('notificationModal').style.display = 'none';
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('notificationModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Daily update check
        setInterval(() => {
            this.updateCountdown();
            this.renderDaysGrid();
        }, 60000); // Check every minute
    }
    
    showNotificationModal() {
        document.getElementById('notificationModal').style.display = 'block';
    }
    
    promptInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted install');
                }
                this.deferredPrompt = null;
            });
        } else {
            alert('Installation is already available in your browser menu or has been completed.');
        }
    }
    
    checkInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'flex';
        });
    }
    
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registered:', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BirthdayCountdownApp();
});