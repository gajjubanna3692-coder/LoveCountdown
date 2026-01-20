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
        
        // Fixed media paths - users cannot change these
        this.mediaConfig = {
            baseImagePath: 'images/day-',
            baseVideoPath: 'videos/day-',
            imageExtension: '.jpg',
            videoExtension: '.mp4',
            fallbackImage: 'images/placeholder.jpg',
            fallbackVideo: 'videos/placeholder.mp4'
        };

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

        const birthdayCard = this.createBirthdayCard();
        container.appendChild(birthdayCard);
    }

    createDayCard(dayNumber) {
        const isUnlocked = this.isDayUnlocked(dayNumber);
        const letter = this.letters[dayNumber - 1];
        const word = this.words[dayNumber - 1];
        
        // Try to load the image for thumbnail
        const imagePath = this.getImagePath(dayNumber);
        const hasCustomImage = this.imageExists(imagePath);

        const card = document.createElement('div');
        card.className = `day-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="card-header">
                <div class="day-number">Day ${dayNumber}</div>
                <div class="day-letter">${letter}</div>
                <div class="day-word">${word}</div>
            </div>
            <div class="day-content">
                ${hasCustomImage ? 
                    `<div class="day-thumbnail" style="
                        background-image: url('${imagePath}');
                        background-size: cover;
                        background-position: center;
                        height: 120px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                    "></div>` 
                    : ''
                }
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
            <div class="card-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);">
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
        const imagePath = this.getImagePath(dayNumber);
        const videoPath = this.getVideoPath(dayNumber);
        
        const page = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Day ${dayNumber}: ${dayContent.word}</title>
                <link rel="stylesheet" href="./styles.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
                <style>
                    .day-header-section {
                        --day-color: ${this.getDayColor(dayNumber)};
                        --day-secondary: ${this.getDaySecondaryColor(dayNumber)};
                    }
                </style>
            </head>
            <body class="day-page">
                <div class="day-page-container">
                    <div class="day-content-wrapper">
                        
                        <!-- Navigation -->
                        <nav class="day-nav">
                            <button class="back-button" onclick="window.history.back()">
                                <i class="fas fa-arrow-left"></i> Back to Countdown
                            </button>
                            <div class="day-navigation">
                                <button class="nav-button prev-day" onclick="goToPreviousDay(${dayNumber})" ${dayNumber <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="nav-button next-day" onclick="goToNextDay(${dayNumber})" ${dayNumber >= this.totalDays ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </nav>
                        
                        <!-- Day Header -->
                        <section class="day-header-section">
                            <div class="heart-decoration heart-1">❤️</div>
                            <div class="heart-decoration heart-2">💝</div>
                            <div class="heart-decoration heart-3">💖</div>
                            <div class="heart-decoration heart-4">💗</div>
                            
                            <div class="day-header-content">
                                <div class="day-indicator">Day ${dayNumber} of 20</div>
                                <div class="day-letter-display">${dayContent.letter}</div>
                                <h1 class="day-word-title">is for ${dayContent.word}</h1>
                                <div class="day-date">${dayContent.date}</div>
                            </div>
                        </section>
                        
                        <!-- Message Section -->
                        <section class="message-section">
                            <div class="message-header">
                                <i class="fas fa-heart"></i>
                                <h3>My Message to You</h3>
                            </div>
                            
                            <div class="message-content">
                                <div class="love-note">
                                    <p>${dayContent.message}</p>
                                </div>
                                <div class="message-signature">With all my love ❤️</div>
                            </div>
                        </section>
                        
                        <!-- Media Section -->
                        <section class="media-section">
                            <h3 class="media-header">
                                <i class="fas fa-images"></i>
                                Today's Special Surprise
                            </h3>
                            
                            <div class="media-grid">
                                <!-- Image Card -->
                                <div class="media-card">
                                    <div class="media-card-header">
                                        <i class="fas fa-image"></i>
                                        <h4>Your Special Image</h4>
                                    </div>
                                    <div class="media-placeholder" id="image-placeholder-${dayNumber}">
                                        ${this.getImageHtml(dayNumber)}
                                    </div>
                                </div>
                                
                                <!-- Video Card -->
                                <div class="media-card">
                                    <div class="media-card-header">
                                        <i class="fas fa-video"></i>
                                        <h4>Your Video Message</h4>
                                    </div>
                                    <div class="media-placeholder" id="video-placeholder-${dayNumber}">
                                        ${this.getVideoHtml(dayNumber)}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Media Info -->
                            <div class="media-info" style="
                                background: #f8f9fa;
                                padding: 15px;
                                border-radius: 10px;
                                margin-top: 20px;
                                text-align: center;
                                color: #666;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-info-circle"></i> 
                                This special content is just for you. Enjoy today's surprise!
                            </div>
                        </section>
                        
                        <!-- Progress Section -->
                        <section class="progress-section">
                            <h3 class="progress-header">Countdown Progress</h3>
                            <div class="day-progress">
                                <div class="progress-circle">
                                    <svg class="progress-ring" width="100" height="100">
                                        <circle class="progress-ring-circle" 
                                                stroke="#ffe6ea" 
                                                stroke-width="8" 
                                                fill="transparent" 
                                                r="40" 
                                                cx="50" 
                                                cy="50"/>
                                        <circle class="progress-ring-circle" 
                                                stroke="#ff69b4" 
                                                stroke-width="8" 
                                                fill="transparent" 
                                                r="40" 
                                                cx="50" 
                                                cy="50"
                                                stroke-dasharray="251.2"
                                                stroke-dashoffset="${251.2 - (251.2 * (dayNumber / 20))}"/>
                                    </svg>
                                    <div class="progress-text">${Math.round((dayNumber / 20) * 100)}%</div>
                                </div>
                                <div class="progress-info">
                                    <div>
                                        <strong>Day ${dayNumber} of 20</strong><br>
                                        <small>${20 - dayNumber} days to birthday</small>
                                    </div>
                                    <div>
                                        <strong>Next:</strong> ${dayNumber < 20 ? `Day ${dayNumber + 1} - ${this.words[dayNumber]}` : 'Birthday!'}<br>
                                        <small>${dayNumber < 20 ? 'Unlocks tomorrow' : 'Final day!'}</small>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                
                <script>
                    // Navigation functions
                    function goToPreviousDay(currentDay) {
                        if (currentDay > 1) {
                            window.location.href = '?day=' + (currentDay - 1);
                        }
                    }
                    
                    function goToNextDay(currentDay) {
                        if (currentDay < 20) {
                            window.location.href = '?day=' + (currentDay + 1);
                        }
                    }
                    
                    // Check if day is unlocked
                    function checkDayUnlocked() {
                        const urlParams = new URLSearchParams(window.location.search);
                        const dayNumber = parseInt(urlParams.get('day')) || 1;
                        
                        // Get unlocked days from localStorage
                        const startDate = localStorage.getItem('countdown_start_date');
                        if (!startDate) return false;
                        
                        const start = new Date(startDate);
                        const today = new Date();
                        const diffTime = today - start;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const currentDay = Math.min(Math.max(diffDays + 1, 1), 21);
                        
                        if (dayNumber > currentDay) {
                            window.location.href = './index.html';
                            return false;
                        }
                        
                        // Add unlock animation
                        if (!localStorage.getItem('day' + dayNumber + '-animated')) {
                            const letterDisplay = document.querySelector('.day-letter-display');
                            if (letterDisplay) {
                                letterDisplay.classList.add('unlock-animation');
                                localStorage.setItem('day' + dayNumber + '-animated', 'true');
                                
                                setTimeout(() => {
                                    letterDisplay.classList.remove('unlock-animation');
                                }, 1000);
                            }
                        }
                        
                        return true;
                    }
                    
                    // Initialize
                    document.addEventListener('DOMContentLoaded', function() {
                        checkDayUnlocked();
                    });
                </script>
            </body>
            </html>
        `;

        // Open in new window or update current page
        if (window.location.pathname.includes('index.html')) {
            const newWindow = window.open();
            newWindow.document.write(page);
            newWindow.document.close();
        } else {
            // If we're already on a day page, update it
            document.open();
            document.write(page);
            document.close();
        }
    }

    openBirthdayPage() {
        const page = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🎉 Happy Birthday! 🎉</title>
                <link rel="stylesheet" href="./styles.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
            </head>
            <body class="birthday-page">
                <div class="day-page-container">
                    <div class="day-content-wrapper">
                        
                        <nav class="day-nav">
                            <button class="back-button" onclick="window.history.back()">
                                <i class="fas fa-arrow-left"></i> Back to Countdown
                            </button>
                        </nav>
                        
                        <section class="day-header-section">
                            <div class="day-header-content">
                                <div class="day-indicator">🎉 The Final Day! 🎉</div>
                                <div class="day-letter-display">🎂</div>
                                <h1 class="day-word-title">Happy Birthday!</h1>
                                <div class="day-date">Today is your special day!</div>
                                
                                <button class="confetti-button" onclick="launchConfetti()">
                                    <i class="fas fa-birthday-cake"></i> Launch Confetti!
                                </button>
                            </div>
                        </section>
                        
                        <section class="message-section">
                            <div class="message-header">
                                <i class="fas fa-gift"></i>
                                <h3>My Final Birthday Message</h3>
                            </div>
                            
                            <div class="message-content">
                                <p class="message-text">
                                    Happy Birthday, my love! 🎉<br><br>
                                    
                                    These 20 days were just a small reminder of how much you mean to me. 
                                    Every letter, every word, every day was filled with thoughts of you and 
                                    the incredible person you are.<br><br>
                                    
                                    From A to T, from Adore to Together, each day represented a different 
                                    aspect of my love for you. But today, on your birthday, I want to say 
                                    that you are ALL of those things and so much more.<br><br>
                                    
                                    You are my beginning, my middle, and my endless. You are my dream come 
                                    true, my happy place, and my forever home. Watching you grow and thrive 
                                    brings me more joy than you can imagine, and I'm so excited to see what 
                                    this new year brings for you.<br><br>
                                    
                                    May this birthday be filled with all the love, laughter, and happiness 
                                    you deserve. May all your dreams come true, and may our love continue 
                                    to grow stronger with each passing year.<br><br>
                                    
                                    Thank you for being you. Thank you for loving me. Thank you for making 
                                    every day special.<br><br>
                                    
                                    Here's to celebrating you today and always! 🥂
                                </p>
                                
                                <div class="love-note">
                                    <p>
                                        "You don't get older, you get better. And you were already perfect 
                                        to begin with."
                                    </p>
                                </div>
                                
                                <div class="message-signature">Forever yours, with all my love ❤️🎂</div>
                            </div>
                        </section>
                        
                        <!-- Birthday Gallery with Pre-Placed Images -->
                        <section class="media-section">
                            <h3 class="media-header">
                                <i class="fas fa-images"></i>
                                Our Birthday Memories
                            </h3>
                            
                            <div class="photo-gallery">
                                ${this.getBirthdayGalleryHtml()}
                            </div>
                            
                            <div class="media-info" style="
                                background: #f8f9fa;
                                padding: 15px;
                                border-radius: 10px;
                                margin-top: 20px;
                                text-align: center;
                                color: #666;
                                font-size: 0.9rem;
                            ">
                                <i class="fas fa-heart"></i> 
                                These memories are forever cherished. Happy Birthday!
                            </div>
                        </section>
                        
                        <!-- Birthday Video -->
                        <section class="memory-section">
                            <div class="memory-header">
                                <i class="fas fa-video"></i>
                                <h3>Special Birthday Video</h3>
                            </div>
                            
                            <div class="media-placeholder" id="birthday-video">
                                ${this.getBirthdayVideoHtml()}
                            </div>
                        </section>
                        
                        <section class="progress-section">
                            <h3 class="progress-header">Countdown Complete! 🎉</h3>
                            <div class="day-progress">
                                <div class="progress-circle">
                                    <svg class="progress-ring" width="100" height="100">
                                        <circle class="progress-ring-circle" 
                                                stroke="#ffe6ea" 
                                                stroke-width="8" 
                                                fill="transparent" 
                                                r="40" 
                                                cx="50" 
                                                cy="50"/>
                                        <circle class="progress-ring-circle" 
                                                stroke="#ff6b6b" 
                                                stroke-width="8" 
                                                fill="transparent" 
                                                r="40" 
                                                cx="50" 
                                                cy="50"
                                                stroke-dasharray="251.2"
                                                stroke-dashoffset="0"/>
                                    </svg>
                                    <div class="progress-text">100%</div>
                                </div>
                                <div class="progress-info">
                                    <div>
                                        <strong>🎉 All 20 Days Unlocked!</strong><br>
                                        <small>The romantic journey is complete</small>
                                    </div>
                                    <div>
                                        <strong>🎂 Happy Birthday!</strong><br>
                                        <small>Enjoy your special day!</small>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                
                <div id="confetti-container"></div>
                
                <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
                <script>
                    function launchConfetti() {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                        
                        setTimeout(() => confetti({
                            particleCount: 100,
                            angle: 60,
                            spread: 55,
                            origin: { x: 0 }
                        }), 250);
                        
                        setTimeout(() => confetti({
                            particleCount: 100,
                            angle: 120,
                            spread: 55,
                            origin: { x: 1 }
                        }), 400);
                    }
                    
                    // Auto-confetti on page load
                    document.addEventListener('DOMContentLoaded', function() {
                        setTimeout(launchConfetti, 1000);
                    });
                </script>
            </body>
            </html>
        `;

        const newWindow = window.open();
        newWindow.document.write(page);
        newWindow.document.close();
    }

    // Helper methods for media handling
    getImagePath(dayNumber) {
        return `${this.mediaConfig.baseImagePath}${dayNumber}${this.mediaConfig.imageExtension}`;
    }

    getVideoPath(dayNumber) {
        return `${this.mediaConfig.baseVideoPath}${dayNumber}${this.mediaConfig.videoExtension}`;
    }

    getImageHtml(dayNumber) {
        const imagePath = this.getImagePath(dayNumber);
        return `
            <div style="position: relative; width: 100%; height: 100%;">
                <img src="${imagePath}" 
                     style="width:100%;height:100%;object-fit:cover;border-radius:10px;" 
                     alt="Day ${dayNumber} image"
                     onerror="this.onerror=null; this.src='${this.mediaConfig.fallbackImage}'; this.nextElementSibling.style.display='block';">
                <div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 105, 180, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    display: none;
                ">Day ${dayNumber}</div>
            </div>
        `;
    }

    getVideoHtml(dayNumber) {
        const videoPath = this.getVideoPath(dayNumber);
        return `
            <div style="position: relative; width: 100%; height: 100%;">
                <video controls 
                       style="width:100%;height:100%;object-fit:cover;border-radius:10px;"
                       poster="${this.getImagePath(dayNumber)}"
                       onerror="this.onerror=null; this.innerHTML='<p style=\\'padding:20px;text-align:center;color:#db7093;\\'><i class=\\'fas fa-video-slash\\'></i><br>Video loading...</p>';">
                    <source src="${videoPath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 105, 180, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                ">Day ${dayNumber}</div>
            </div>
        `;
    }

    imageExists(url) {
        // This is a simple check - in production you'd want to use fetch or similar
        return true; // Assume images exist for now
    }

    getDayColor(dayNumber) {
        const colors = [
            '#FF6B8B', '#FF8E6B', '#FFB86B', '#FFD76B', '#FFF06B',
            '#E1FF6B', '#B8FF6B', '#8EFF6B', '#6BFF8E', '#6BFFB8',
            '#6BFFD7', '#6BFFF0', '#6BE1FF', '#6BB8FF', '#6B8EFF',
            '#8E6BFF', '#B86BFF', '#D76BFF', '#F06BFF', '#FF6BE1'
        ];
        return colors[dayNumber - 1] || '#ff69b4';
    }

    getDaySecondaryColor(dayNumber) {
        const colors = [
            '#FF8EC6', '#FFB18C', '#FFD18C', '#FFE98C', '#FFF98C',
            '#EBFF8C', '#D1FF8C', '#A8FF8C', '#8CFFA8', '#8CFFD1',
            '#8CFFE9', '#8CFFF9', '#8CEBFF', '#8CD1FF', '#8CA8FF',
            '#A88CFF', '#D18CFF', '#E98CFF', '#F98CFF', '#FF8CEB'
        ];
        return colors[dayNumber - 1] || '#ffb6c1';
    }

    getBirthdayGalleryHtml() {
        // Create 6 photo slots for birthday
        let html = '';
        for (let i = 1; i <= 6; i++) {
            const birthdayImagePath = `images/birthday-${i}.jpg`;
            html += `
                <div class="photo-item">
                    <img src="${birthdayImagePath}" 
                         alt="Birthday memory ${i}"
                         onerror="this.onerror=null; this.src='${this.mediaConfig.fallbackImage}'; this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-heart\\'></i>';">
                </div>
            `;
        }
        return html;
    }

    getBirthdayVideoHtml() {
        const birthdayVideoPath = 'videos/birthday.mp4';
        return `
            <video controls 
                   style="width:100%;height:100%;object-fit:cover;border-radius:15px;"
                   poster="images/birthday-poster.jpg"
                   onerror="this.onerror=null; this.innerHTML='<div style=\\'padding:40px;text-align:center;color:#db7093;\\'><i class=\\'fas fa-birthday-cake\\' style=\\'font-size:3rem;\\'></i><br><p>Birthday video coming soon!</p></div>';">
                <source src="${birthdayVideoPath}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }

    getDayContent(dayNumber) {
        const letter = this.letters[dayNumber - 1];
        const word = this.words[dayNumber - 1];
        const date = new Date(this.startDate);
        date.setDate(date.getDate() + dayNumber - 1);

        const messages = [
            `Hey bebuu! So, only one month to go han. So you must be thinking how did I manage to make a website for your bday countdown? Toh aapko toh pata hi hai I am a quick learner hehe! And also I thought that I should start early , because one day is not enough to celebrate someone's bday who means so much to me. 
So now just thank yourself for dating me and wait for every short message daily through this till your birthday.
And yes,
HAPPY BIRTHDAY IN ADVANCE.`,
            `HMHMHMHM….aagye na itni jaldi ..nahi raha gya na mere bina…kyuki mujhse bhi nahi raha jaara!I really miss you. I miss the way YOU tease me. I miss YOU cooking for me. I miss US sitting in the balcony for hours. I miss US playing UNO ( humesha mai hi jeeti thi). I miss doing YOUR makeup. I miss US creating reels. I miss YOUR fragrance. I MISS THE WHOLE YOU. Because with you ,things feel lighter and even silence feels comfortable! I have never thought that someone can be this amazing and I still want to ask your mumma ki kya khake paida kiya tha aapko!
Baaki this is day 2 of me saying THANKS FOR BEING IN MY LIFE.
HAPPY BIRTHDAY IN ADVANCE.`,
            `Your ${word.toLowerCase()} nature is what drew me to you and keeps me captivated every day.`,
            `Thinking of you fills me with ${word.toLowerCase()}. You complete me in ways I never imagined.`,
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
        document.getElementById('installBtn').addEventListener('click', () => {
            this.promptInstall();
        });

        document.getElementById('notifyBtn').addEventListener('click', () => {
            this.showNotificationModal();
        });

        document.getElementById('copyCode').addEventListener('click', () => {
            navigator.clipboard.writeText(this.userCode);
            alert('Code copied to clipboard!');
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('notificationModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('notificationModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        setInterval(() => {
            this.updateCountdown();
            this.renderDaysGrid();
        }, 60000);
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BirthdayCountdownApp();
});