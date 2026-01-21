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
            `SO today we gonna talk about the reasons I am with you because you toh are with me because of my biceps only ik :( 
So I am with you because you dont let me feel the distance bw us. Because you can crack jokes even on serious situations and make me laugh. Because you make good white pasta. Because you don’t treat me like a 19 year old (iykyk). Because you click good pictures. Because you can lift me one hand. Because you get me flowers every time I came to Jaipur. And the last reason is… now I have become so much into you that I don’t need a reason to be with you. I am going to be with you no matter what!
Issi baat pe HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my bebuuu, today I just wanna thank you. Thankyou for taking care of me like a spoiled baby. Thankyou for letting me know that true feelings do exist. Thankyou for making me realise I am not the only one who is a lil psycho. Thankyou for making me catch the feels of romantic songs. Thanks for feeding me with your hands. Thankyou for listening to all my yapping even when your eyes were screaming SLEEP. Thankyou for being less mature in front of me just to match my thinking. Thankyou for not dulling my spark. Thankyou for being my personal chatgpt, uber driver, coolie, tutor and what not. Thankyou for making every cringe couple reel with me. And lastly, thankyou so much for understanding me. I have noticed that I don’t need to explain everything to you. Things just flow. Our late night deep conversations work like therapy to me now, thanks for being my unpaid therapist too.
Baaki my favourite THANKYOU for being in my life.
HAPPY BIRTHDAY IN ADVANCE.
`,
            ` To my bebuu, today I am gonna tell you what I feel about you. So I feel that you have a very pretty girlfriend. Acha thik h thik h, I feel that you have quietly become someone I think about during random moments of the day. I am not being dramatic but I have fallen bhot zor se in your love that you live in my mind rent free and whenever I think about you randomly in a day , there is always a  big smile on my face. I didn’t plan that to happen but it just happened because I feel you complete me. I feel that you have added value in my life. I feel that without talking to you, my day feels incomplete. I feel without your goodnight text, my sleep feels insomnia. And lastly, I feel that your love made me feel things. I feel that I am falling for you each day harder.
And right now I am feeling to say THANKYOU for coming into my life.
HAPPY BIRTHDAY IN ADVANCE.
`,
            `TODAY WE WILL TALK ABOUT ALL OUR MEMORIES
Ahm! Okay so we had spend almost 214 days together and it is our 7 month anniversary! Babe itna tolerate krliya mne aapko? But honestly, it feels like forever! I kid you not I still remember our first meet and it feels like it was just yesterday. Aur tabse ab tak we have made so much memories together. And I am pretty sure this video made you recall all the memories we had and many more to go( I have saved many reels already). And  now we gonna talk about our favourite memory in this seven months of togetherness but sch btau toh ek memory choose krna is very tough kyuki every memory is unforgettable but my personal favourite memory is the day when we went out to MAHIMA to eat gol gappe and it was our first outing date and I know exactly why out of all the memories that one is my fav because I think that day I felt that yes , I am in right hands. If I am with this guy I don’t have to think or worry about the things, this guy can handle everything. I felt the way I have never felt before with anyone. There is smthng comforting knowing that you are there. I didn’t have to pretend , I was ME. Toh that day made me also realise that ,with you even golgappe tastes better and I can eat ice cream in a messy way cus you r always there to wipe that off. :)
HAPPY SEVEN MONTHS MY CUTUUU & HAPPY BIRTHDAY IN ADVANCE!
`,
            `So my cutie we have spent almost 214 days together and it is our 7 month anniversary! Babe itna tolerate krliya mne aapko? Anyways , so on this 26th day of the month and for your 26th bday I am starting a series of “ABCD of my boyfriend” that means I am gonna use all 26 letters of alphabets to DESCRIBE my love(you).
To the person who is really “ADDICTIVE” ! bebu your presence , your vibe , the whole you…..these are the things I am really addicted to. I mean you really make every room enlighten with your aura and your jokes ofc. I don’t know since when I have become so lucky mne toh somvaar ke vrat bhi nahi rakhe? Hehe jokes apart… I might not have said it directly to you but today I am saying … I am really grateful to have you in my life! Please don’t change yourself and be mine always ;)
HAPPY SEVEN MONTHS CUTUU & HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my “ BRAVE BABY” Brave because you stay calm in tough situations and Baby because obviously you are ! and yes, this is the official day when didi agreed and approved for our relationship mtlb han starting m thoda unbelievable laga but then ofc it was YOU, the OG , Ishaan, who can make things work in every way. So, I am really glad that I met you because after meeting you I realised life can be fun too. It is always about the people not the place. And I found the best person with whom I can vibe on everything and everywhere. Trust me when I say this ,you are the coolest and funniest person I have ever met. Lekin sabke sath funny hone ki jarurt nahi h thik h 😊 I love your personality and more than that I love your inner child. And this child is gonna turn 26 in few days. So,
HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my “CRAZY” (about me) bebu, I really love the way how you drive me crazy everytime. For example, you will drive me crazy when I am on my periods😊. You will crazily give me kisses. You will do crazy stuffs with me like hanging me down from the terrace. You will crazily sleep every night without texting me. But on top of that, I also know that how crazy you are about this relationship. And that’s what make me crazy about you. Toh dono crazy milke kaagi crazy krege in future.
So wishing you crazily HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my “DEDICATED” baby, another thing I like about you is that you are really dedicated about the things you actually want to get happen. This relationship is the perfect example. You never gave up on us( asking for break doesn’t count though). You fought for us. You convinced didi. You never thought of getting teased by the tag ‘ paedophile’ lol. Your dedication towards your goals and your career also fascinates me. You are a ambitious person which makes you more sexier. Han mtlb sometimes yeh dedication get defeated by your sleep but thik hai kabhi kabhi toh chalta hai ( I said kabhi kabhi).
Cheers to your dedication cus your bday month just started.
19 days to go!
`,
            `To my “ENCOURAGING” baby, by saying encouraging I don’t mean,you encouraging yourself to go to gym. I mean …that you encouraging me to chase my dreams and never settle for less. You encouraging me to explore the world. You encouraging me to believe in the destiny. You encouraging me to study for my CFA. You encouraging me to achieve my daily goals. You encouraging me that even I could have opted science. Just like you are encouraging me in this video to do crunches . So, thanks for encouraging me always.
One more day down.
HAPPY BIRTHDAY IN ADVANCE.
`,
            `To the “FIXER” ( of my moods), I think you already know why I call you that! Because of course, you know how to lighten my mood after a bad day. I still remember that day when I was crying like a crocodile because I watched amovie and kept saying I have no friends. And you stayed on the call until I stopped crying and after hanging up the call with you I had a big smile on my face. And also’ I cant stay mad at you for longer because you just have to count till 5 secs and I laugh. So you obviously fix my mood but you also know how to ruin it by going on a date with your sleep!
But thanks for fixing my life too.
HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my very “GENTLE” person…i think everyone know this fact like every person in your life would know that you are a gentle person. because  you are! The first time we went to central park and I fell down you legit touched my feet to check kahi meko jyada toh nahi lagi. You are gentle with me in many ways ( I cant write it down but yk already). You were gentle with my friend when you dropped her all the way to her home. You were gentle with me when you came to Ajmer for me.
I am so much Glad to have this Gentleman in my life.
HAPPY BIRTHDAY IN ADVANCE.
`,
            `Dear kuchupuchuuuu,
I hope this message finds you well, because I find you really “HOT”. Even, the most handsome man ever! ( meri nazro se dekho). You are the most funniest and cool person I have ever met. Shyad isliye aapse ab ladne ka bhi mann nahi krta because I know somewhere YOU WILL MAKE ME LAUGH IN THE MIDDLE OF THE ARGUMENT. This is the second most thing I like about you that you know how to handle me whenever I m feeling low, angry or nervous and the first most thing I like about you is that YOU HAVE A GORGOEUS GIRLFRIEND! Hehe kidding! I like everything about you just not those stickers from your screenshots! On a serious note, I wanna say tht you are the best thing happened to me as I always say this , so please, now you are stuck with me.
Wouh only 15 days left!
HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my “IN MY PRAYERS” person, I would be lying if I say you were never my 11:11 wish. Everytime, clock strikes 11:11 , I only manifest to be with you ASAP! I believe the real love is when you pray for each other. And I know you do too!. I have prayed each day to be with you when there was no chance of us being together. I have prayed to god to give me his best thing in the world and god gave me you ( jyada khush mt ho reel pe dekhi thi yeh line). All I am gonna say is May god bless you with everthing you want in your life. All the happiness of the world because you deserve it my love!
HAPPY BIRTHDAY IN ADVANCE.
`,
            `To my “JUST RIGHT” person, ugh! I never thought I would say this but yeah , you have always been right about the things! Be it didi se chupke milna, movie theatre m dusri movie dekhna, you are just right about every situation. Shyd isliye you got the right gurl for you..hehe ;) even I got the right guy without swiping right. See, I don’t know about the future but I know that being with you is always a right decision. Meeting you was the right destiny. Spending whole night talking to you was the right moment. Everything feels right when it comes to you, Right?
HAPPY BIRTHDAY IN ADVANCE SUGARBOO!
`,
            `To my “KEEPER” person, see you are the person I will always hold onto. Lemme explain it in a simpler way baby gurl. A keeper is the one who stays when things are not cute, who chooses you even on bad days. A person who makes love feel safe instead of stressful. Basically, keeper is not someone who just know how to love, he is someone whom you trust your future with. With whom you can share everything without being judged.
Because some people are too special to let go of !
HAPPPY BIRTHDAY IN ADVANCE MY SECRET KEEPER.
`,
            `To the “LUCKY”(me) person, ofc you are the lucky person to have me in your life..hmhmhmhmhmhm. okay so I am also very lucky because out of 8 billion people my heart found you. ( again you are lucky in this statement bcus my heart chose you). Okay so , I am genuinely lucky not because life is perfect but bcus you are in it. Being lucky is waking up knowing someone genuinely chooses you. It’s feeling grateful for the random moments like random laughs,late talks , cute kalesh,and etc. loving you make me realise that luck doesn’t happen by accidents, it is the situation when a person feels right, safe and meant for you.
So am lucky because having you by my side feels like winning at life.
AHH! 10 days to go.
HAPPY BITHDAY IN ADVANCE.
`
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