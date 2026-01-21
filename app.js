class BirthdayCountdownApp {
    constructor() {
        // Configuration
        this.startDate = new Date('2026-01-22'); // Fixed start date: Jan 22, 2026
        this.birthdayDate = new Date('2026-02-20'); // Fixed birthday date: Feb 20, 2026
        this.totalDays = 30; // Jan 22 to Feb 20 inclusive = 30 days

        // Days 1-4: Numbered days with special messages
        // Days 5-30: Alphabet days A-Z (26 letters)
        this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Words for each alphabet day (A-Z)
        this.alphabetWords = [
            'Adore', 'Beautiful', 'Cherish', 'Dream', 'Eternal',
            'Forever', 'Grace', 'Heart', 'Infinity', 'Joy',
            'Kiss', 'Love', 'Magic', 'Never-ending', 'Only',
            'Passion', 'Quiet', 'Romance', 'Sweet', 'Together',
            'Unique', 'Valentine', 'Wonderful', 'XOXO', 'You', 'Zest'
        ];

        // For the numbered days (Day 1-4), use special titles
        this.numberedDayTitles = [
            'The Beginning',
            'Missing You',
            'Special Day 3',
            'Special Day 4'
        ];

        this.userCode = this.generateUserCode();

        // Media configuration
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
        // Always use the fixed start date
        return this.startDate;
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

        // Reset both dates to midnight for accurate calculation
        const start = new Date(this.startDate);
        start.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate days difference
        const diffTime = today - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Return day 1-30, or 31 for birthday
        return Math.min(Math.max(diffDays + 1, 1), this.totalDays + 1);
    }

    isDayUnlocked(dayNumber) {
        return dayNumber <= this.getCurrentDay();
    }

    updateCountdown() {
        const currentDay = this.getCurrentDay();
        const daysLeft = Math.max(this.totalDays - currentDay + 1, 0);

        // Determine what to show for "next letter"
        let nextLetter = '🎉';
        if (currentDay <= 4) {
            // Still in numbered days
            nextLetter = currentDay === 4 ? 'A' : (currentDay + 1).toString();
        } else if (currentDay <= this.totalDays) {
            // In alphabet days
            const alphabetIndex = currentDay - 5;
            if (alphabetIndex < this.letters.length) {
                nextLetter = this.letters[alphabetIndex];
            }
        }

        document.getElementById('currentDay').textContent = currentDay;
        document.getElementById('daysLeft').textContent = daysLeft;
        document.getElementById('nextLetter').textContent = nextLetter;

        // Update dates display
        document.getElementById('startDate').textContent = this.startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('birthdayDate').textContent = this.birthdayDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    renderDaysGrid() {
        const container = document.getElementById('daysContainer');
        container.innerHTML = '';

        // Create all 30 days
        for (let i = 1; i <= this.totalDays; i++) {
            const day = this.createDayCard(i);
            container.appendChild(day);
        }

        // Add birthday card (Day 31)
        const birthdayCard = this.createBirthdayCard();
        container.appendChild(birthdayCard);
    }

    createDayCard(dayNumber) {
        const isUnlocked = this.isDayUnlocked(dayNumber);
        let cardTitle, cardSubtitle, cardType;

        if (dayNumber <= 4) {
            // Numbered days (1-4)
            cardType = 'numbered';
            cardTitle = `Day ${dayNumber}`;
            cardSubtitle = this.numberedDayTitles[dayNumber - 1] || `Day ${dayNumber}`;
        } else if (dayNumber <= this.totalDays) {
            // Alphabet days (A-Z)
            const alphabetIndex = dayNumber - 5;
            if (alphabetIndex < this.letters.length) {
                cardType = 'alphabet';
                cardTitle = this.letters[alphabetIndex];
                cardSubtitle = this.alphabetWords[alphabetIndex] || `Day ${dayNumber}`;
            } else {
                cardType = 'extra';
                cardTitle = `Day ${dayNumber}`;
                cardSubtitle = 'Special Day';
            }
        } else {
            cardType = 'extra';
            cardTitle = `Day ${dayNumber}`;
            cardSubtitle = 'Special Day';
        }

        const card = document.createElement('div');
        card.className = `day-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="card-header ${cardType === 'alphabet' ? 'alphabet-day' : ''}">
                <div class="day-number">${cardType === 'alphabet' ? 'Letter' : 'Day'} ${cardType === 'alphabet' ? cardTitle : dayNumber}</div>
                <div class="day-letter">${cardTitle}</div>
                <div class="day-word">${cardSubtitle}</div>
            </div>
            <div class="day-content">
                <p>${this.getDayPreview(dayNumber)}</p>
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
        const today = new Date();
        const birthday = new Date(this.birthdayDate);

        // Check if today is birthday
        const isBirthday = today.getDate() === birthday.getDate() &&
            today.getMonth() === birthday.getMonth() &&
            today.getFullYear() === birthday.getFullYear();

        const card = document.createElement('div');
        card.className = `day-card ${isUnlocked || isBirthday ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="card-header" style="background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);">
                <div class="day-number">🎉 Birthday! 🎉</div>
                <div class="day-letter">❤️</div>
                <div class="day-word">Happy Birthday!</div>
            </div>
            <div class="day-content">
                <p>The grand finale with special surprises!</p>
                <small>${this.birthdayDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</small>
            </div>
            ${!(isUnlocked || isBirthday) ? `
                <div class="lock-overlay">
                    <i class="fas fa-gift"></i>
                    <p>Unlocks on your birthday!</p>
                </div>
            ` : ''}
        `;

        if (isUnlocked || isBirthday) {
            card.addEventListener('click', () => this.openBirthdayPage());
        }

        return card;
    }

    getDayPreview(dayNumber) {
        if (dayNumber === 1) {
            return "Hey bebuu! So, only one month to go...";
        } else if (dayNumber === 2) {
            return "I really miss you. I miss the way YOU tease me...";
        } else if (dayNumber <= 4) {
            return "A special message waiting for you...";
        } else if (dayNumber <= this.totalDays) {
            const alphabetIndex = dayNumber - 5;
            if (alphabetIndex < this.alphabetWords.length) {
                return `${this.letters[alphabetIndex]} is for ${this.alphabetWords[alphabetIndex]}`;
            }
        }
        return "A romantic surprise waiting for you...";
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
                <title>${dayContent.title}</title>
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
            <body>
                <div class="day-page-container">
                    <div class="day-content-wrapper">
                        
                        <!-- Navigation -->
                        <nav class="day-nav">
                            <a href="./index.html" class="back-button">
                                <i class="fas fa-arrow-left"></i> Back to Countdown
                            </a>
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
                                ${dayContent.isAlphabet ?
                `<div class="day-indicator">Letter ${dayContent.letter} of 26</div>
                 <div class="day-letter-display">${dayContent.letter}</div>
                 <h1 class="day-word-title">is for ${dayContent.word}</h1>` 
                :
                `<div class="day-indicator">Day ${dayNumber} of ${this.totalDays}</div>
                 <div class="day-letter-display" style="font-size: 5rem;">${dayNumber}</div>
                 <h1 class="day-word-title">${dayContent.title}</h1>`
            }
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
                            <div class="media-header">
                                <i class="fas fa-images"></i>
                                <h3>Today's Special Surprise</h3>
                            </div>
                            
                            <div class="media-grid">
                                <!-- Image Card -->
                                <div class="media-card">
                                    <div class="media-card-header">
                                        <i class="fas fa-image"></i>
                                        <h4>Your Special Image</h4>
                                    </div>
                                    <div class="media-placeholder">
                                        ${this.getImageHtml(dayNumber)}
                                    </div>
                                </div>
                                
                                <!-- Video Card -->
                                <div class="media-card">
                                    <div class="media-card-header">
                                        <i class="fas fa-video"></i>
                                        <h4>Your Video Message</h4>
                                    </div>
                                    <div class="media-placeholder">
                                        ${this.getVideoHtml(dayNumber)}
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Progress Section -->
                        <section class="progress-section">
                            <div class="progress-header">
                                <i class="fas fa-chart-line"></i>
                                <h3>Countdown Progress</h3>
                            </div>
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
                                                stroke-dashoffset="${251.2 - (251.2 * (dayNumber / this.totalDays))}"/>
                                    </svg>
                                    <div class="progress-text">${Math.round((dayNumber / this.totalDays) * 100)}%</div>
                                </div>
                                <div class="progress-info">
                                    <div>
                                        <strong>Day ${dayNumber} of ${this.totalDays}</strong><br>
                                        <small>${this.totalDays - dayNumber} days to birthday</small>
                                    </div>
                                    <div>
                                        <strong>Next:</strong> ${this.getNextDayPreview(dayNumber)}<br>
                                        <small>${dayNumber < this.totalDays ? 'Unlocks tomorrow' : 'Birthday tomorrow!'}</small>
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
                        if (currentDay < ${this.totalDays}) {
                            window.location.href = '?day=' + (currentDay + 1);
                        }
                    }
                    
                    // Check if day is unlocked
                    function checkDayUnlocked() {
                        const urlParams = new URLSearchParams(window.location.search);
                        const dayNumber = parseInt(urlParams.get('day')) || 1;
                        
                        // Get current day from fixed dates
                        const startDate = new Date('2026-01-22');
                        const today = new Date();
                        
                        // Reset to midnight
                        startDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        
                        const diffTime = today - startDate;
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        const currentDay = Math.min(Math.max(diffDays + 1, 1), ${this.totalDays + 1});
                        
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

        if (window.location.pathname.includes('index.html')) {
            const newWindow = window.open();
            newWindow.document.write(page);
            newWindow.document.close();
        } else {
            document.open();
            document.write(page);
            document.close();
        }
    }

        getNextDayPreview(dayNumber) {
        if (dayNumber < 4) {
            return `Day ${dayNumber + 1}`;
        } else if (dayNumber === 4) {
            return 'Letter A - Addictive';
        } else if (dayNumber < this.totalDays) {
            const nextAlphabetIndex = dayNumber - 4;
            if (nextAlphabetIndex < this.letters.length) {
                const nextLetter = this.letters[nextAlphabetIndex];
                const nextWord = this.alphabetWords[nextAlphabetIndex];
                return `Letter ${nextLetter} - ${nextWord}`;
            }
        }
        return 'Birthday!';
    }

    getDayContent(dayNumber) {
        const startDate = new Date('2026-01-22');
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayNumber - 1);

        let title, message, isAlphabet = false, letter = '', word = '';

        if (dayNumber === 1) {
            title = 'The Beginning';
            message = `Hey bebuu! So, only one month to go han. So you must be thinking how did I manage to make a website for your bday countdown? Toh aapko toh pata hi hai I am a quick learner hehe! And also I thought that I should start early , because one day is not enough to celebrate someone's bday who means so much to me. 
So now just thank yourself for dating me and wait for every short message daily through this till your birthday.
And yes,
HAPPY BIRTHDAY IN ADVANCE.`;
        } else if (dayNumber === 2) {
            title = 'Missing You';
            message = `HMHMHMHM….aagye na itni jaldi ..nahi raha gya na mere bina…kyuki mujhse bhi nahi raha jaara!I really miss you. I miss the way YOU tease me. I miss YOU cooking for me. I miss US sitting in the balcony for hours. I miss US playing UNO ( humesha mai hi jeeti thi). I miss doing YOUR makeup. I miss US creating reels. I miss YOUR fragrance. I MISS THE WHOLE YOU. Because with you ,things feel lighter and even silence feels comfortable! I have never thought that someone can be this amazing and I still want to ask your mumma ki kya khake paida kiya tha aapko!
Baaki this is day 2 of me saying THANKS FOR BEING IN MY LIFE.
HAPPY BIRTHDAY IN ADVANCE.`;
        } else if (dayNumber == 3) {
            title = `Special Day ${dayNumber}`;
            message = `This is day ${dayNumber} of our countdown. SO today we gonna talk about the reasons I am with you because you toh are with me because of my biceps only ik :( 
So I am with you because you dont let me feel the distance bw us. Because you can crack jokes even on serious situations and make me laugh. Because you make good white pasta. Because you don’t treat me like a 19 year old (iykyk). Because you click good pictures. Because you can lift me one hand. Because you get me flowers every time I came to Jaipur. And the last reason is… now I have become so much into you that I don’t need a reason to be with you. I am going to be with you no matter what!
Issi baat pe HAPPY BIRTHDAY IN ADVANCE.`;
        } else if (dayNumber == 4) {
            title = `Special Day ${dayNumber}`;
            message = `This is day ${dayNumber} of our countdown. To my bebuuu, today I just wanna thank you. Thankyou for taking care of me like a spoiled baby. Thankyou for letting me know that true feelings do exist. Thankyou for making me realise I am not the only one who is a lil psycho. Thankyou for making me catch the feels of romantic songs. Thanks for feeding me with your hands. Thankyou for listening to all my yapping even when your eyes were screaming SLEEP. Thankyou for being less mature in front of me just to match my thinking. Thankyou for not dulling my spark. Thankyou for being my personal chatgpt, uber driver, coolie, tutor and what not. Thankyou for making every cringe couple reel with me. And lastly, thankyou so much for understanding me. I have noticed that I don’t need to explain everything to you. Things just flow. Our late night deep conversations work like therapy to me now, thanks for being my unpaid therapist too.
Baaki my favourite THANKYOU for being in my life.
HAPPY BIRTHDAY IN ADVANCE.`;
        }
        else if (dayNumber <= this.totalDays) {
            // Alphabet days (A-Z)
            const alphabetIndex = dayNumber - 5;
            if (alphabetIndex < this.letters.length) {
                isAlphabet = true;
                letter = this.letters[alphabetIndex];
                word = this.alphabetWords[alphabetIndex];
                title = `Letter ${letter}`;

                // Alphabet messages
                const alphabetMessages = [
                    `So my cutie we have spent almost 214 days together and it is our 7 month anniversary! Babe itna tolerate krliya mne aapko? Anyways , so on this 26th day of the month and for your 26th bday I am starting a series of “ABCD of my boyfriend” that means I am gonna use all 26 letters of alphabets to DESCRIBE my love(you).
To the person who is really “ADDICTIVE” ! bebu your presence , your vibe , the whole you…..these are the things I am really addicted to. I mean you really make every room enlighten with your aura and your jokes ofc. I don’t know since when I have become so lucky mne toh somvaar ke vrat bhi nahi rakhe? Hehe jokes apart… I might not have said it directly to you but today I am saying … I am really grateful to have you in my life! Please don’t change yourself and be mine always ;)
HAPPY SEVEN MONTHS CUTUU & HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “ BRAVE BABY” Brave because you stay calm in tough situations and Baby because obviously you are ! and yes, this is the official day when didi agreed and approved for our relationship mtlb han starting m thoda unbelievable laga but then ofc it was YOU, the OG , Ishaan, who can make things work in every way. So, I am really glad that I met you because after meeting you I realised life can be fun too. It is always about the people not the place. And I found the best person with whom I can vibe on everything and everywhere. Trust me when I say this ,you are the coolest and funniest person I have ever met. Lekin sabke sath funny hone ki jarurt nahi h thik h 😊 I love your personality and more than that I love your inner child. And this child is gonna turn 26 in few days. So,
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “CRAZY” (about me) bebu, I really love the way how you drive me crazy everytime. For example, you will drive me crazy when I am on my periods😊. You will crazily give me kisses. You will do crazy stuffs with me like hanging me down from the terrace. You will crazily sleep every night without texting me. But on top of that, I also know that how crazy you are about this relationship. And that’s what make me crazy about you. Toh dono crazy milke kaagi crazy krege in future.
So wishing you crazily HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “DEDICATED” baby, another thing I like about you is that you are really dedicated about the things you actually want to get happen. This relationship is the perfect example. You never gave up on us( asking for break doesn’t count though). You fought for us. You convinced didi. You never thought of getting teased by the tag ‘ paedophile’ lol. Your dedication towards your goals and your career also fascinates me. You are a ambitious person which makes you more sexier. Han mtlb sometimes yeh dedication get defeated by your sleep but thik hai kabhi kabhi toh chalta hai ( I said kabhi kabhi).
Cheers to your dedication cus your bday month just started.
19 days to go!`,
                    `To my “ENCOURAGING” baby, by saying encouraging I don’t mean,you encouraging yourself to go to gym. I mean …that you encouraging me to chase my dreams and never settle for less. You encouraging me to explore the world. You encouraging me to believe in the destiny. You encouraging me to study for my CFA. You encouraging me to achieve my daily goals. You encouraging me that even I could have opted science. Just like you are encouraging me in this video to do crunches . So, thanks for encouraging me always.
One more day down.
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To the “FIXER” ( of my moods), I think you already know why I call you that! Because of course, you know how to lighten my mood after a bad day. I still remember that day when I was crying like a crocodile because I watched amovie and kept saying I have no friends. And you stayed on the call until I stopped crying and after hanging up the call with you I had a big smile on my face. And also’ I cant stay mad at you for longer because you just have to count till 5 secs and I laugh. So you obviously fix my mood but you also know how to ruin it by going on a date with your sleep!
But thanks for fixing my life too.
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my very “GENTLE” person…i think everyone know this fact like every person in your life would know that you are a gentle person. because  you are! The first time we went to central park and I fell down you legit touched my feet to check kahi meko jyada toh nahi lagi. You are gentle with me in many ways ( I cant write it down but yk already). You were gentle with my friend when you dropped her all the way to her home. You were gentle with me when you came to Ajmer for me.
I am so much Glad to have this Gentleman in my life.
HAPPY BIRTHDAY IN ADVANCE.`,
                    `Dear kuchupuchuuuu,
I hope this message finds you well, because I find you really “HOT”. Even, the most handsome man ever! ( meri nazro se dekho). You are the most funniest and cool person I have ever met. Shyad isliye aapse ab ladne ka bhi mann nahi krta because I know somewhere YOU WILL MAKE ME LAUGH IN THE MIDDLE OF THE ARGUMENT. This is the second most thing I like about you that you know how to handle me whenever I m feeling low, angry or nervous and the first most thing I like about you is that YOU HAVE A GORGOEUS GIRLFRIEND! Hehe kidding! I like everything about you just not those stickers from your screenshots! On a serious note, I wanna say tht you are the best thing happened to me as I always say this , so please, now you are stuck with me.
Wouh only 15 days left!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “IN MY PRAYERS” person, I would be lying if I say you were never my 11:11 wish. Everytime, clock strikes 11:11 , I only manifest to be with you ASAP! I believe the real love is when you pray for each other. And I know you do too!. I have prayed each day to be with you when there was no chance of us being together. I have prayed to god to give me his best thing in the world and god gave me you ( jyada khush mt ho reel pe dekhi thi yeh line). All I am gonna say is May god bless you with everthing you want in your life. All the happiness of the world because you deserve it my love!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “JUST RIGHT” person, ugh! I never thought I would say this but yeah , you have always been right about the things! Be it didi se chupke milna, movie theatre m dusri movie dekhna, you are just right about every situation. Shyd isliye you got the right gurl for you..hehe ;) even I got the right guy without swiping right. See, I don’t know about the future but I know that being with you is always a right decision. Meeting you was the right destiny. Spending whole night talking to you was the right moment. Everything feels right when it comes to you, Right?
HAPPY BIRTHDAY IN ADVANCE SUGARBOO!`,
                    `To my “KEEPER” person, see you are the person I will always hold onto. Lemme explain it in a simpler way baby gurl. A keeper is the one who stays when things are not cute, who chooses you even on bad days. A person who makes love feel safe instead of stressful. Basically, keeper is not someone who just know how to love, he is someone whom you trust your future with. With whom you can share everything without being judged.
Because some people are too special to let go of !
HAPPPY BIRTHDAY IN ADVANCE MY SECRET KEEPER.`,
                    `To the “LUCKY”(me) person, ofc you are the lucky person to have me in your life..hmhmhmhmhmhm. okay so I am also very lucky because out of 8 billion people my heart found you. ( again you are lucky in this statement bcus my heart chose you). Okay so , I am genuinely lucky not because life is perfect but bcus you are in it. Being lucky is waking up knowing someone genuinely chooses you. It’s feeling grateful for the random moments like random laughs,late talks , cute kalesh,and etc. loving you make me realise that luck doesn’t happen by accidents, it is the situation when a person feels right, safe and meant for you.
So am lucky because having you by my side feels like winning at life.
AHH! 10 days to go.`,
                    `To my “MATURE” boyfriend, so I asked chatgpt to describe me how a mature boyfriend is and it told me thst a mature bf is someone who understands the value of respect, communication and boundaries. He listens without judging you and takes responsibility for his and his partner’s actions as well. He knows how to handle challenges calmly instead of reacting too soon. His maturity shows in the way he supports growth ,both his own amd his partner’s. He tells you everything .

Sounds like you na? so my 25 yo Mature boyfriend …how does it feel to date a 19 yo a lil bit immature kiddo? Ofc it feels great ik. I like you when it comes to your maturity and masculinity. Thanks for being mature and understanding me .
Damn ! one more day down.
HAPPY BIRTHDAY IN ADVANVCE.`,
                    `To my “NOT-SO-MATURE” BOYFRIEND, okay toh humne ek 25yo soon to be turned 26 grown up man ki baat toh krli, now its time to talk about a 10 yo old Ishaan inside you. Bro please, even you know you are too cool to be called a 25 year old grown up because mentally you are still that naughty backbencher jisse har teacher pareshan rehta hai. I am writing this on 15th January I hope you remember what you did! You again slept without talking to me. You stole my ugly bchpn ke photos from my phone. You screenrecorded my sit ups and even worse you kept my ugliest picture as my contact photo in your phone! I mean who does that? I think the person who loves you the most. No matter how mature you act in front of me ,but I will still love this childish behaviour of yours.
To my childish and naughty baby, one more day down!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “OG” boyfriend, and when I say OG I mean –Oh GOD! This guy!......acha thik hai baba you are the OG person because you never faked your feelings to me. You have always stayed original to me. Itne original that you have said “ki m bangs m bhot chutiya lagti thi” straight on my face. I mean yeah I like the originality(only sometimes). But yes I am glad that you were real to me and still are! You proved that statement wrong that “ relationship banta sach se hai lekin chalta jhooth se hai”. Lastly, I w’d like to say that thanks for being real to me always.
A small REALity check- 10 days to go!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “PERFECT” BOYFRIEND, today, we are going to talk about YOU. What qualities you have that make you a perfect boyfriend and make me fall for you more. It is going to be my 8 mark answer.
You are the kind of boyfriend who somehow manages to be my safe place and my biggest headache at the same time which requires a lots of talent , hence you are very talented. You can make me laugh and irritated at the most faltu stuff every day in different ways, which needs creativity , hence you are creative too. You listen to my yapping like it is sort of a TEDtalks and remember every small details about me but still pretend to not know why I am mad at you ( which you absolutely know) – hence you are smart as well. You are supportive without being clingy, you are protective without being controlling but you are also “I will ragebait you more” person when I am in my “ don’t talk to me” mood, thus you are sensible too. You love your sleep more than me butstill treat me like I am your favourite person (which I am ik). So basically , you are the definition of a man can be funny,caring and dependable and still drive you crazy in a most creative way…. And that’s make you a perfect boyfriend.
So HAPPY BIRTHDAY IN ADVANCE MY PERFECT BOYFRIEND.`,
                    `To my ‘QUEEN LEVEL TREATMENT GIVER” boyfriend, I had to think about a lot for this word kyuki queen jesa treatment dene ke liye aapko bhi toh king hona pdegaaaa.,….. hihihihi bhai I am so funny! Okay so am just kidding, you are the kind of boyfriend who doesn’t even need a crown himself to be the king. Because you are my king! You play 8 ball pool far better than me .. king behaviour. And you keep me like your queen when it comes to the game! You let me win! You give me all the money by losing the game… king behaviour. You support my dreams , you spoil me by dropping me at the station everytime, you did sabki fielding set just to celebrate our special day, you came itni thand m itni subh just to see me at the station …..you ofc treat me like a queen which is somewhere raising my standards.huhuhuhuh!
So , HAPPY BIRTHDAY IN ADVANCE MY KING.`,
                    `To my ‘RARE’ boyfriend, you are rare because men like you are not easy to found , they are discovered by the most lucky and intelligent women like me hehe. You are that kind of rare that makes people say “where did you find him?”. Good communication, high sense of humour and an engineer? Sir, that’s a limited and deadliest combination ever! If being rare was a crime , congratulations, you would surely be arrested my love. You re rare in the way you care ( bhai shayar bhi ban gyi m toh aapke liye likhte likhte).
So last line is, you are rare because finding you is like finding 100 rupee note on the road or giving extra two papdis from gol gappe wale bhaiya.
HAPPY BIRTHDAY IN ADVANCE MY RAREST BEAUTY.`,
                    `To my “SAME AS ME” person…. From sharing same birth date to liking same amount of dahi. From liking same girl in splitsvilla to having the problem of not drinking enough water in a day.. we both share the same bond.i feel that you are same to me because no matter what what mood im in or what phase it is… you stay the same person with me ..umm sometimes rude but most of the times the cute lil mood fixer boyfriend. Same care, same loyalty, same efforts , same sleeping power and same “ I am here’” energy. So, in a world full of mixed signals, being with you feels secured. Same you , same us, same every day.
But not as same as your age cus you are going to turn 26 in a week wouhhooo!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “TEACHER” boyfriend , toh bebu kya haal chaal hai apke? I mean abhi tk toh ache hi hoge if you have asked me to be your VALENTINE. I know you and I both have not celebrated this thing ever in our life and we also don’t need to because we don’t need a specific day to celebrate each other. (wow kya mature line boldi) Anyways ,
Toh today, im gonna tell you what you have taught me this 7 months. So, Mr. Ishaan you’ve taught me that care don’t always need a grand gesture . Sometimes, its in the small everyday things, you know! Like when I came in December , I wanted to have white pasta and you made it, despite the danger (didi). You chopped fruits for me when I had fast. You showed up everytime when I came to Jaipur even if it is for 10 minutes. You planned everything on our 6 month anniversary better than the director of kaabil movie! And many more , cant write all of them .jyda tareef hojayegi aapki. In a nutshell, I wanna thank you to show up everytime and taking care of me. `,
                    `To my “UNSTOPPABLE” Baby, by unstoppable I mean , you are unstoppable when it comes to tease me or annoy me or when you have to sleep! But in general, you are unstoppable because you are strong even on tough times. You are the one who decides once then no one can distract you, not even my unnecessarily overthinking. When you want smthng you go after it with this steady confidence that makes me believe everything will work out,even when I m having doubts. You don’t rush , you don’t panic, you just move forward  and honestly being with someone like you feeliks like standing with a force that cant be shaken. Just be this unstoppable and unbreakable person because loving you not just feel safe, it also feels that you are unstoppable in choosing us.`,
                    `To my “VALUABLE” baby, you are valuable in ways money could never measure han han I am saying that you are priceless. Umm not because what you do but what you are, like the calm you give me, the way you support me, the way you feed me, everything makes you stand out of everyone. You value people, you value emotions and you value us and that alone makes you so special. Honestly, if love had aprice tag ..you would be priceless and I am smart enough to know the what a valuable thing looks like when I have it.
Damn .. only 4 days to go!
HAPPY BIRTHDAY IN ADVANCE.`,
                    `To my “ you are WORTH IT” baby,  every late night talk , every kalesh ,every ticket to Jaipur, even spending hours and losing my sleep to make this website for you.. is worth it. Bebu, loving you never felt like a burden , it is a choice I can make everyday without hesitation. Even on hard days, when we fight or you sleep without talking to me, you still feel the right place to come back to. You are worth fighting for with my sister and you know whwenever someone asks me why did I stay , the answer would be simple- because you are worth every fight , always.
So, HAPPY BIRTHDAY IN ADVANCE CUTIE.`,
                    `To my “ X -TRA FUNNY” baby,  like , unintentionally comedian level. Half the time you’re not even trying, and I’m still laughing because of the faces you make, the random comments you drop, or the absolute confidence with which you say the most nonsense things. You have this talent of turning boring moments into jokes and serious conversations into “wait why am I laughing?” situations. Honestly, life with you feels like a comedy show where I never know the script, but I know I’m going to laugh. And yes, you’re the reason my smile muscles get their daily workout and my dimples get to smile too. 😏
DAMN! TWO MORE DAYS TO GO.
So, HAPPY BIRTHDAY IN ADVANCE.`,
                    `You know whats crazy? Read the first word. And also that tomorrow is your Birthday but tonight is as special to me because YOU exist. So, Y is for YOU -IDIOT because honestly everything somehow comes back to you — and idiot because you act clueless even when you know exactly what you’re doing. You annoy me, you tease me, you pretend to be innocent after saying the most unhinged things, and then you smile like you’ve done nothing wrong. You can solve an argument without saying SORRY . You’re dramatic without trying, funny without effort, and somehow still lovable even when you’re being peak-level stupid. It’s unfair, really. But yeah… you’re my kind of idiot, and I wouldn’t trade you for anything. Whatever you do is what makes you really ATTRACTIVE and I cant take a chance to lose you now because you also get another Y in your life which is me-Y for YASHIKA. Hehe
HAPPY BIRTHDAY EVE CUTIE!`,
                    `To my “ ZINDA BOYFRIEND” , Han bass itna hi likhugi aaj ke din 29 din kam padd gye kya tareef sunne hue jo aaj bhi aagye! Acha fine , here I am not gonna say anything now , I am done with all the expressed love by words now its time for some ACTIONS. BUT 2 shabd bol hi deti hu that….
 On your birthday, I don’t just wish you happiness; I wish you growth, peace, success, and everything your heart quietly hopes for. You deserve all the good things this world has to offer and a little extra—just because you’re you and you have ME.
So finally 
HAPPY BIRTHDAY!!!!!`
                ];

                message = alphabetMessages[alphabetIndex] || `${letter} is for ${word} - You are ${word.toLowerCase()} to me in every way. Today and always.`;
            } else {
                title = `Day ${dayNumber}`;
                message = `Day ${dayNumber} brings us closer to your birthday. Each day of this countdown is a reminder of how special you are and how much you mean to me. I can't wait to celebrate you!`;
            }
        } else {
            title = `Day ${dayNumber}`;
            message = `A special message for a special day as we count down to your birthday!`;
        }

        return {
            day: dayNumber,
            title: title,
            message: message,
            date: currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            isAlphabet: isAlphabet,
            letter: letter,
            word: word
        };
    }

    // Keep all the other helper methods (getImagePath, getVideoPath, etc.) the same
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

    getDayColor(dayNumber) {
        const colors = [
            '#FF6B8B', '#FF8E6B', '#FFB86B', '#FFD76B', '#FFF06B',
            '#E1FF6B', '#B8FF6B', '#8EFF6B', '#6BFF8E', '#6BFFB8',
            '#6BFFD7', '#6BFFF0', '#6BE1FF', '#6BB8FF', '#6B8EFF',
            '#8E6BFF', '#B86BFF', '#D76BFF', '#F06BFF', '#FF6BE1',
            '#FF6BFF', '#D76BFF', '#B86BFF', '#8E6BFF', '#6B8EFF',
            '#6BB8FF', '#6BE1FF', '#6BFFF0', '#6BFFD7', '#6BFFB8'
        ];
        return colors[(dayNumber - 1) % colors.length] || '#ff69b4';
    }

    getDaySecondaryColor(dayNumber) {
        const colors = [
            '#FF8EC6', '#FFB18C', '#FFD18C', '#FFE98C', '#FFF98C',
            '#EBFF8C', '#D1FF8C', '#A8FF8C', '#8CFFA8', '#8CFFD1',
            '#8CFFE9', '#8CFFF9', '#8CEBFF', '#8CD1FF', '#8CA8FF',
            '#A88CFF', '#D18CFF', '#E98CFF', '#F98CFF', '#FF8CEB',
            '#FF8CFF', '#E98CFF', '#D18CFF', '#A88CFF', '#8CA8FF',
            '#8CD1FF', '#8CEBFF', '#8CFFF9', '#8CFFE9', '#8CFFD1'
        ];
        return colors[(dayNumber - 1) % colors.length] || '#ffb6c1';
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