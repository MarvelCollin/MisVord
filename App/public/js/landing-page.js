document.addEventListener('DOMContentLoaded', function() {

    initNavigation();
    initScrollAnimations();
    initHeroAnimations();
    initMockupAnimations();
    initLiveChatSimulation();
    initInteractiveElements();

    setTimeout(() => {
        initScrambleText();
    }, 300); 
});

function initNavigation() {
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Simple scroll-based navbar styling
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // Mobile menu toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            
            // Update active state
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mark active section based on scroll position
    window.addEventListener('scroll', () => {
        // This is simplified and only marks the current section based on scroll position
        const sections = document.querySelectorAll('section[id]');
        let scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            if (section.offsetTop <= scrollPosition && 
                (section.offsetTop + section.offsetHeight > scrollPosition)) {
                const id = section.getAttribute('id');
                document.querySelector(`.nav-link[href="#${id}"]`)?.classList.add('active');
            } else {
                const id = section.getAttribute('id');
                document.querySelector(`.nav-link[href="#${id}"]`)?.classList.remove('active');
            }
        });
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(element => {
        observer.observe(element);
    });
}

function initHeroAnimations() {

    const floatingElements = document.querySelectorAll('.floating-element');

    floatingElements.forEach((element, index) => {

        element.style.animationDelay = `${index * 0.5}s`;
        element.style.animationDuration = `${6 + index * 2}s`;

        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.2) translateY(-10px)';
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
            element.style.transition = '';
        });
    });
}

function initMockupAnimations() {
    const mockup = document.querySelector('.discord-mockup');

    if (!mockup) return;

    mockup.addEventListener('mousemove', (e) => {
        const rect = mockup.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        const rotateX = deltaY * -10; 
        const rotateY = deltaX * 10;

        mockup.style.transform = `
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            translateZ(0)
        `;
    });

    mockup.addEventListener('mouseleave', () => {
        mockup.style.transform = '';
        mockup.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            mockup.style.transition = '';
        }, 500);
    });
}

function initScrambleText() {
    const scrambleElements = document.querySelectorAll('.scramble-text');

    scrambleElements.forEach(element => {
        const originalText = element.dataset.text || element.textContent;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?▓▒░█▄▀◤◥◢◣";

        element.style.color = 'transparent';
        element.style.opacity = '0';
        element.innerHTML = '';

        const spans = [];

        for (let i = 0; i < originalText.length; i++) {
            const span = document.createElement('span');
            span.className = 'char';
            span.style.color = 'transparent';
            span.style.opacity = '0';
            span.style.animationDelay = `${i * 0.05}s`;

            if (originalText[i] === ' ') {
                span.innerHTML = '&nbsp;';
                span.classList.add('space');
                span.style.opacity = '1'; 
            } else {
                span.textContent = originalText[i];
                span.dataset.finalChar = originalText[i];
                span.dataset.charIndex = i;
            }

            element.appendChild(span);
            spans.push(span);
        }

        element.classList.add('initialized');
        element.style.opacity = '1';

        setTimeout(() => {
            startEnhancedScrambleAnimation(spans, chars, originalText);
        }, 800);
    });
}

function startEnhancedScrambleAnimation(spans, chars, originalText) {
    let counter = 0;
    const totalDuration = 1500; 
    const interval = 50; 
    const totalSteps = totalDuration / interval;

    const scrambleInterval = setInterval(() => {
        counter++;
        const progress = counter / totalSteps;
        const revealCount = Math.floor(progress * spans.length);

        spans.forEach((span, index) => {
            if (span.classList.contains('space')) return;

            if (index < revealCount && !span.classList.contains('revealed')) {

                span.textContent = span.dataset.finalChar;
                span.classList.remove('scrambling');
                span.classList.add('revealed');
                span.style.color = 'var(--discord-white)';
                span.style.opacity = '1';
                span.style.transform = '';

                if (index % 3 === 0) { 
                    createSimpleSparkle(span);
                }

            } else if (index >= revealCount) {

                if (counter % 3 === 0) { 
                    const randomChar = chars[Math.floor(Math.random() * chars.length)];
                    span.textContent = randomChar;
                    span.classList.add('scrambling');
                    span.style.opacity = '1';

                    const hue = (index * 30 + counter * 5) % 360;
                    span.style.color = `hsl(${hue}, 70%, 60%)`;

                    const scale = 0.95 + Math.sin(counter * 0.3 + index) * 0.1;
                    span.style.transform = `scale(${scale})`;
                }
            }
        });

        if (progress >= 1) {
            clearInterval(scrambleInterval);

            spans.forEach((span, index) => {
                if (!span.classList.contains('space')) {
                    span.textContent = span.dataset.finalChar;
                    span.style.color = 'var(--discord-white)';
                    span.style.opacity = '1';
                    span.style.transform = '';
                    span.classList.remove('scrambling');
                    span.classList.add('floating');

                    setTimeout(() => {
                        span.style.animation = `charFloat 6s ease-in-out infinite`;
                        span.style.animationDelay = `${index * 0.1}s`;
                    }, index * 50); 
                }
            });

            setTimeout(() => {
                initAdvancedHoverEffects(spans, chars);
            }, 500); 

            setTimeout(() => {
                initRandomCharacterScrambling(spans, chars);
            }, 3000); 
        }
    }, interval);
}

function createSimpleSparkle(element) {
    const sparkle = document.createElement('div');
    const size = 1 + Math.random() * 2; 
    const colors = ['var(--discord-blue)', 'var(--discord-green)'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    sparkle.style.cssText = `
        position: absolute;
        top: ${40 + Math.random() * 20}%;
        left: ${40 + Math.random() * 20}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        animation: simpleSparkleEffect 0.4s ease-out; 
        z-index: 100;
    `;

    element.style.position = 'relative';
    element.appendChild(sparkle);

    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.remove();
        }
    }, 400);
}

function initRandomCharacterScrambling(spans, chars) {
    const nonSpaceSpans = spans.filter(span => !span.classList.contains('space'));

    function scrambleRandomCharacter() {
        if (nonSpaceSpans.length === 0) return;

        const randomIndex = Math.floor(Math.random() * nonSpaceSpans.length);
        const targetSpan = nonSpaceSpans[randomIndex];

        if (targetSpan._isAnimating || targetSpan.matches(':hover')) {
            scheduleNextRandomScramble();
            return;
        }

        const originalChar = targetSpan.dataset.finalChar;
        let scrambleCount = 0;
        const maxScrambles = 1 + Math.floor(Math.random() * 2); 

        targetSpan._isAnimating = true;
        targetSpan.classList.add('random-scramble');

        const randomScrambleInterval = setInterval(() => {
            if (scrambleCount < maxScrambles) {
                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                targetSpan.textContent = randomChar;

                const colors = ['var(--discord-blue)', 'var(--discord-green)'];
                targetSpan.style.color = colors[scrambleCount % colors.length];

                const scale = 1 + (scrambleCount / maxScrambles) * 0.1; 
                targetSpan.style.transform = `scale(${scale})`;

                scrambleCount++;
            } else {
                clearInterval(randomScrambleInterval);

                targetSpan.textContent = originalChar;
                targetSpan.style.color = 'var(--discord-white)';
                targetSpan.style.transform = '';
                targetSpan.classList.remove('random-scramble');
                targetSpan._isAnimating = false;
            }
        }, 150); 

        scheduleNextRandomScramble();
    }

    function scheduleNextRandomScramble() {

        const nextDelay = 5000 + Math.random() * 7000;
        setTimeout(scrambleRandomCharacter, nextDelay);
    }

    scheduleNextRandomScramble();
}

function initAdvancedHoverEffects(spans, chars) {
    spans.forEach((span, index) => {
        if (span.classList.contains('space')) return;

        span.addEventListener('mouseenter', function() {
            if (this._isAnimating) return;
            this._isAnimating = true;

            const originalChar = this.dataset.finalChar;
            let scrambleCount = 0;
            const maxScrambles = 2; 

            this.style.animationPlayState = 'paused';

            const hoverScramble = setInterval(() => {
                if (scrambleCount < maxScrambles) {
                    const hoverChars = chars + '★☆';
                    this.textContent = hoverChars[Math.floor(Math.random() * hoverChars.length)];

                    const hue = 120 + (scrambleCount / maxScrambles) * 60; 
                    this.style.color = `hsl(${hue}, 80%, 60%)`;

                    const scale = 1.05 + scrambleCount * 0.05; 
                    this.style.transform = `scale(${scale})`;

                    scrambleCount++;
                } else {
                    clearInterval(hoverScramble);
                    this.textContent = originalChar;
                    this.style.color = 'var(--discord-white)';
                    this.style.transform = '';
                    this.style.animationPlayState = 'running';
                    this._isAnimating = false;
                }
            }, 100); 
        });
    });
}

function initLiveChatSimulation() {
    const chatContainer = document.getElementById('chatContainer');
    const typingIndicator = document.querySelector('.typing-indicator');
    const memberCount = document.querySelector('.member-count');
    const userInput = document.getElementById('userMessageInput');
    const sendBtn = document.getElementById('sendMessageBtn');

    if (!chatContainer) return;

    const chatMessages = [
        {
            avatar: 'linear-gradient(135deg, #5865F2, #7289DA)',
            author: 'Alex',
            time: 'Today at 2:30 PM',
            text: 'Hey everyone! Just finished our project presentation. Thanks for all the help! 🎉',
            reactions: [{ emoji: '🎉', count: 3 }, { emoji: '👏', count: 5 }]
        },
        {
            avatar: 'linear-gradient(135deg, #57F287, #43B581)',
            author: 'Sarah',
            time: 'Today at 2:32 PM',
            text: 'Congratulations! Your hard work paid off 💪',
            reactions: [{ emoji: '💪', count: 2 }]
        },
        {
            avatar: 'linear-gradient(135deg, #FEE75C, #F1C40F)',
            author: 'Mike',
            time: 'Today at 2:35 PM',
            text: 'Anyone up for a gaming session tonight? 🎮',
            reactions: [{ emoji: '🎮', count: 4 }]
        },
        {
            avatar: 'linear-gradient(135deg, #ED4245, #C73E6B)',
            author: 'Emma',
            time: 'Today at 2:38 PM',
            text: 'Count me in! What game are we playing?',
            reactions: []
        },
        {
            avatar: 'linear-gradient(135deg, #9B59B6, #8E44AD)',
            author: 'David',
            time: 'Today at 2:40 PM',
            text: 'How about some Valorant? I just hit Diamond! 💎',
            reactions: [{ emoji: '💎', count: 6 }, { emoji: '🔥', count: 2 }]
        },
        {
            avatar: 'linear-gradient(135deg, #3498DB, #2980B9)',
            author: 'Lisa',
            time: 'Today at 2:42 PM',
            text: 'Nice! I\'m still stuck in Gold 😅 Can you help me climb?',
            reactions: [{ emoji: '😅', count: 1 }]
        }
    ];

    let currentMessageIndex = 0;
    let isTyping = false;
    let chatCompleted = false;
    let userMessageCount = 0;
    let lastUserMessageTime = 0;

    function showTypingIndicator(username = 'Someone') {
        if (isTyping) return;
        isTyping = true;
        if (typingIndicator) {
            const typingText = typingIndicator.querySelector('.typing-text');
            if (typingText) {
                typingText.textContent = `${username} is typing...`;
            }
            typingIndicator.classList.remove('hidden');
        }
    }

    function hideTypingIndicator() {
        isTyping = false;
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }

    function handleUserMessage() {
        if (!userInput || !sendBtn || userInput.disabled) return;

        const message = userInput.value.trim();
        if (!message) return;

        const now = Date.now();
        const timeSinceLastMessage = now - lastUserMessageTime;

        if (timeSinceLastMessage < 1500 && userMessageCount > 0) {
            userMessageCount++;
            if (userMessageCount >= 3) {
                addSpamWarning();
                userInput.value = '';
                return;
            }
        } else {
            userMessageCount = 1;
        }

        lastUserMessageTime = now;

        addUserMessage(message);
        userInput.value = '';

        setTimeout(() => {
            addBotResponse(message);
        }, Math.random() * 2000 + 1000);
    }

    function addUserMessage(text) {
        const messageElement = createChatMessage({
            avatar: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
            author: 'You',
            time: formatCurrentTime(),
            text: text,
            reactions: [],
            isUser: true
        });

        chatContainer.appendChild(messageElement);
        setTimeout(() => messageElement.classList.add('visible'), 100);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        if (Math.random() > 0.7) {
            setTimeout(() => {
                addReactionToMessage(messageElement);
            }, Math.random() * 3000 + 1000);
        }
    }

    function addBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = '';
        let author = '';
        let avatar = '';

        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            response = 'Hello there! Welcome to MiscVord! 👋';
            author = 'WelcomeBot';
            avatar = 'linear-gradient(135deg, #00D2FF, #3A7BD5)';
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
            response = 'I\'m here to help! What would you like to know about MiscVord? 🤔';
            author = 'HelpBot';
            avatar = 'linear-gradient(135deg, #667eea, #764ba2)';
        } else if (lowerMessage.includes('game') || lowerMessage.includes('gaming') || lowerMessage.includes('play')) {
            response = 'Gaming is awesome! What\'s your favorite game? 🎮';
            author = 'GameBot';
            avatar = 'linear-gradient(135deg, #f093fb, #f5576c)';
        } else if (lowerMessage.includes('awesome') || lowerMessage.includes('cool') || lowerMessage.includes('nice')) {
            response = 'Thanks! We\'re glad you\'re enjoying MiscVord! ✨';
            author = 'Community';
            avatar = 'linear-gradient(135deg, #4facfe, #00f2fe)';
        } else if (lowerMessage.includes('music') || lowerMessage.includes('song')) {
            response = 'Love music! Check out our music channels! 🎵';
            author = 'MusicBot';
            avatar = 'linear-gradient(135deg, #fa709a, #fee140)';
        } else {
            const responses = [
                { text: 'That\'s really interesting! 💭', author: 'Alex', avatar: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
                { text: 'Great point! Thanks for sharing! 👍', author: 'Jordan', avatar: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
                { text: 'I love hearing different perspectives! 🌟', author: 'Sam', avatar: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
                { text: 'You\'ve got some great ideas there! 💡', author: 'Casey', avatar: 'linear-gradient(135deg, #a8e6cf, #dcedc8)' }
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            response = randomResponse.text;
            author = randomResponse.author;
            avatar = randomResponse.avatar;
        }

        showTypingIndicator(author);

        setTimeout(() => {
            hideTypingIndicator();
            addBotMessage(response, author, avatar);
        }, Math.random() * 2000 + 1000);
    }

    function addSpamWarning() {
        addBotMessage('🛑 Stop spam! Please wait before sending another message.', 'AutoMod', 'linear-gradient(135deg, #FF416C, #FF4B2B)');

        if (userInput && sendBtn) {
            userInput.disabled = true;
            sendBtn.disabled = true;
            userInput.placeholder = 'Rate limited... please wait';

            let countdown = 3;
            const countdownInterval = setInterval(() => {
                userInput.placeholder = `Rate limited... wait ${countdown}s`;
                countdown--;

                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    userInput.disabled = false;
                    sendBtn.disabled = false;
                    userInput.placeholder = 'Message #general';
                    userMessageCount = 0;
                }
            }, 1000);
        }
    }

    function addBotMessage(text, authorName, avatarGradient) {
        const messageElement = createChatMessage({
            avatar: avatarGradient,
            author: authorName,
            time: formatCurrentTime(),
            text: text,
            reactions: []
        });

        chatContainer.appendChild(messageElement);
        setTimeout(() => messageElement.classList.add('visible'), 100);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function addReactionToMessage(messageElement) {
        const reactions = ['👍', '❤️', '😄', '🎉', '👏', '🔥'];
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        const count = Math.floor(Math.random() * 5) + 1;

        const messageContent = messageElement.querySelector('.message-content');
        let reactionsContainer = messageElement.querySelector('.message-reactions');

        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions';
            messageContent.appendChild(reactionsContainer);
        }

        const reactionElement = document.createElement('div');
        reactionElement.className = 'reaction';
        reactionElement.innerHTML = `${randomReaction} ${count}`;
        reactionElement.onclick = () => animateReaction(reactionElement);

        reactionsContainer.appendChild(reactionElement);

        reactionElement.style.transform = 'scale(0)';
        reactionElement.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        setTimeout(() => {
            reactionElement.style.transform = 'scale(1)';
        }, 100);
    }

    function formatCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `Today at ${displayHours}:${minutes} ${period}`;
    }

    function createChatMessage(messageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';

        if (messageData.isUser) {
            messageDiv.classList.add('user-message');
        }

        const reactionsHTML = messageData.reactions && messageData.reactions.length > 0 
            ? `<div class="message-reactions">${messageData.reactions.map(r => 
                `<div class="reaction" onclick="animateReaction(this)">${r.emoji} ${r.count}</div>`
              ).join('')}</div>`
            : '';

        messageDiv.innerHTML = `
            <div class="message-avatar" style="background: ${messageData.avatar};"></div>
            <div class="message-content">
                <div class="message-author">${messageData.author} <span class="message-timestamp">${messageData.time}</span></div>
                <div class="message-text">${messageData.text}</div>
                ${reactionsHTML}
            </div>
        `;

        return messageDiv;
    }

    if (userInput && sendBtn) {
        sendBtn.addEventListener('click', handleUserMessage);

        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserMessage();
            }
        });

        let typingTimeout;
        userInput.addEventListener('input', () => {
            if (userInput.value.trim() && !userInput.disabled) {
                showTypingIndicator('You');

                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    hideTypingIndicator();
                }, 1000);
            } else {
                hideTypingIndicator();
            }
        });

        userInput.addEventListener('blur', () => {
            hideTypingIndicator();
        });
    }

    function addMessage() {
        if (currentMessageIndex >= chatMessages.length) {
            chatCompleted = true;
            setTimeout(() => {
                addBotMessage('Chat demo completed! Feel free to send your own messages! 💬', 'System', 'linear-gradient(135deg, #667eea, #764ba2)');
            }, 2000);
            return;
        }

        const messageData = chatMessages[currentMessageIndex];

        showTypingIndicator(messageData.author);

        setTimeout(() => {
            hideTypingIndicator();

            const messageElement = createChatMessage(messageData);
            chatContainer.appendChild(messageElement);

            setTimeout(() => {
                messageElement.classList.add('visible');
            }, 100);

            chatContainer.scrollTop = chatContainer.scrollHeight;
            currentMessageIndex++;

            if (currentMessageIndex < chatMessages.length) {
                const nextDelay = Math.random() * 3000 + 2000;
                setTimeout(addMessage, nextDelay);
            }

        }, Math.random() * 2000 + 1500);
    }

    setTimeout(addMessage, 1000);

    function animateMemberCount() {
        if (!memberCount) return;

        const baseCount = 15847;
        const variation = Math.floor(Math.random() * 50) - 25;
        const newCount = baseCount + variation;

        memberCount.textContent = newCount.toLocaleString();

        setTimeout(animateMemberCount, Math.random() * 8000 + 5000);
    }

    setTimeout(animateMemberCount, 3000);
}

window.animateReaction = function(element) {
    if (!element) return;

    element.style.transform = 'scale(1.3) rotate(10deg)';
    element.style.transition = 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    setTimeout(() => {
        element.style.transform = 'scale(1.1)';
    }, 200);

    setTimeout(() => {
        element.style.transform = '';
    }, 400);
};

function initInteractiveElements() {

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const background = document.querySelector('.landing-background');

        if (background) {

            const speed1 = scrollY * 0.5; 
            const speed2 = scrollY * 0.3; 
            const speed3 = scrollY * 0.7; 

            background.style.transform = `translateY(${speed1}px)`;

            background.style.setProperty('--parallax-before', `${speed2}px`);
            background.style.setProperty('--parallax-after', `${speed3}px`);

            const scrollPercent = scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const hue = scrollPercent * 20; 
            background.style.filter = `hue-rotate(${hue}deg) brightness(${1 + scrollPercent * 0.05})`;
        }
    });

    window.addEventListener('mousemove', (e) => {
        const mouseX = (e.clientX / window.innerWidth - 0.5) * 2; 
        const mouseY = (e.clientY / window.innerHeight - 0.5) * 2; 

        const background = document.querySelector('.landing-background');
        if (background) {
            const moveX = mouseX * 20; 
            const moveY = mouseY * 20;

            const scrollY = window.pageYOffset;
            const scrollTransform = `translateY(${scrollY * 0.5}px)`;
            const mouseTransform = `translate(${moveX}px, ${moveY}px)`;

            background.style.transform = `${scrollTransform} ${mouseTransform}`;
        }

        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.3; 
            const x = mouseX * speed * 10;
            const y = mouseY * speed * 10;

            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            const gamma = e.gamma / 90; 
            const beta = e.beta / 90; 

            const background = document.querySelector('.landing-background');
            if (background) {
                const moveX = gamma * 15;
                const moveY = beta * 15;

                const scrollY = window.pageYOffset;
                const scrollTransform = `translateY(${scrollY * 0.5}px)`;
                const orientationTransform = `translate(${moveX}px, ${moveY}px)`;

                background.style.transform = `${scrollTransform} ${orientationTransform}`;
            }
        });
    }

    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta, .footer-cta');

    buttons.forEach(button => {
        button.addEventListener('mouseenter', (e) => {
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');

            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                width: 0;
                height: 0;
                left: ${e.clientX - rect.left}px;
                top: ${e.clientY - rect.top}px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
                z-index: 1;
            `;

            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);

            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '/':
                    e.preventDefault();
                    const searchInput = document.getElementById('userMessageInput');
                    if (searchInput) {
                        searchInput.focus();
                    }
                    break;
                case 'k':
                    e.preventDefault();
                    const navLinks = document.querySelector('.nav-links');
                    if (navLinks) {
                        const firstLink = navLinks.querySelector('.nav-link');
                        if (firstLink) firstLink.focus();
                    }
                    break;
            }
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedFloatingMove = debounce((e) => {
    const floatingElements = document.querySelectorAll('.floating-element');
    if (floatingElements.length === 0) return;

    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    floatingElements.forEach((element, index) => {
        if (element) {
            const speed = (index + 1) * 0.5;
            const x = (mouseX - 0.5) * speed * 20;
            const y = (mouseY - 0.5) * speed * 20;

            if (!element.closest('.hero-section')) {
                element.style.transform = `translate(${x}px, ${y}px)`;
            }
        }
    });
}, 16); 

const enhancedAnimationStyles = document.createElement('style');
enhancedAnimationStyles.textContent = `
    @keyframes enhancedSparkleEffect {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
        }
        100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
        }
    }

    @keyframes miniSparkleEffect {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
        }
        30% {
            transform: scale(1.2) rotate(90deg);
            opacity: 1;
        }
        70% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
        }
        100% {
            transform: scale(0) rotate(270deg);
            opacity: 0;
        }
    }

    @keyframes enhancedExplosionParticle {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        50% {
            transform: translate(calc(-50% + var(--x) * 0.5), calc(-50% + var(--y) * 0.5)) scale(1.2);
            opacity: 0.8;
        }
        100% {
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0);
            opacity: 0;
        }
    }

    @keyframes glitchFlicker {
        0%, 100% { opacity: 0; transform: translate(2px, -1px); }
        10% { opacity: 0.8; transform: translate(-1px, 2px); }
        20% { opacity: 0.5; transform: translate(1px, -1px); }
        30% { opacity: 0.9; transform: translate(-2px, 1px); }
        40% { opacity: 0.3; transform: translate(2px, 2px); }
        50% { opacity: 0.7; transform: translate(-1px, -2px); }
        60% { opacity: 0.6; transform: translate(1px, 1px); }
        70% { opacity: 0.8; transform: translate(-2px, -1px); }
        80% { opacity: 0.4; transform: translate(2px, -1px); }
        90% { opacity: 0.9; transform: translate(-1px, 1px); }
    }

    @keyframes ripple {
        0% {
            width: 0;
            height: 0;
            opacity: 1;
        }
        100% {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }

    @keyframes charFloat {
        0%, 100% {
            transform: translateY(0px) scale(1);
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        25% {
            transform: translateY(-3px) scale(1.02);
            text-shadow: 0 0 15px rgba(88, 101, 242, 0.4);
        }
        50% {
            transform: translateY(-1px) scale(1.01);
            text-shadow: 0 0 12px rgba(87, 242, 135, 0.4);
        }
        75% {
            transform: translateY(-2px) scale(1.015);
            text-shadow: 0 0 8px rgba(254, 231, 92, 0.3);
        }
    }

    .scramble-text .char.floating {
        animation: charFloat 6s ease-in-out infinite;
        color: var(--discord-white) !important;
        opacity: 1 !important;
        transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        will-change: transform;
    }

    .scramble-text .char.floating:hover {
        animation-play-state: paused;
        transform: translateY(-5px) scale(1.1);
        text-shadow: 
            0 0 20px rgba(88, 101, 242, 0.8),
            0 0 30px rgba(87, 242, 135, 0.6);
        color: var(--discord-blue) !important;
        transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .scramble-text .char {
        position: relative;
        display: inline-block;
    }

    .scramble-text .char.floating:nth-child(odd) {
        animation-direction: alternate;
    }

    .scramble-text .char.floating:nth-child(even) {
        animation-direction: alternate-reverse;
    }
`;

if (document.head) {
    document.head.appendChild(enhancedAnimationStyles);
}

const chatEnhancementStyles = document.createElement('style');
chatEnhancementStyles.textContent = `

    @media (max-width: 768px) {
        .nav-links {
            position: fixed;
            top: 80px;
            left: 0;
            right: 0;
            background: rgba(30, 33, 36, 0.95);
            backdrop-filter: blur(20px);
            flex-direction: column;
            padding: var(--space-xl);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
        }

        .nav-links.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
        }

        .nav-toggle.active svg {
            transform: rotate(90deg);
        }

        .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .discord-mockup {
            max-width: 400px;
            margin: 0 auto;
        }

        .chat-input-box {
            flex-direction: row;
            padding: var(--space-xs);
        }

        .chat-input-box input {
            padding: var(--space-sm) var(--space-md);
            font-size: 0.8rem;
        }

        .chat-input-box button {
            min-width: 40px;
            min-height: 40px;
            padding: var(--space-sm);
        }

        .user-message {
            max-width: 95%;
        }
    }

    .char {
        display: inline-block;
        position: relative;
    }

    .floating-element {
        pointer-events: none;
        will-change: transform;
    }

    .message-avatar {
        will-change: transform;
    }

    .chat-input-box input::-webkit-input-placeholder {
        color: rgba(255, 255, 255, 0.5);
    }

    .chat-input-box input::-moz-placeholder {
        color: rgba(255, 255, 255, 0.5);
        opacity: 1;
    }

    .chat-input-box input:-ms-input-placeholder {
        color: rgba(255, 255, 255, 0.5);
    }

    .chat-input-box input::placeholder {
        color: rgba(255, 255, 255, 0.5);
    }
`;

if (document.head) {
    document.head.appendChild(chatEnhancementStyles);
}

const parallaxStyles = document.createElement('style');
parallaxStyles.textContent = `
    .landing-background::before {
        transform: translateY(var(--parallax-before, 0px));
    }

    .landing-background::after {
        transform: translateY(var(--parallax-after, 0px));
    }

    .landing-background,
    .landing-background::before,
    .landing-background::after,
    .floating-element {
        backface-visibility: hidden;
        perspective: 1000px;
        transform-style: preserve-3d;
    }
`;

if (document.head) {
    document.head.appendChild(parallaxStyles);
}

window.addEventListener('load', () => {
    try {
        if (document.body) {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease-in-out';

            setTimeout(() => {
                if (document.body) {
                    document.body.style.opacity = '1';
                }
            }, 100);
        }
    } catch (error) {
        console.warn('Loading animation failed:', error);

        if (document.body) {
            document.body.style.opacity = '1';
        }
    }
});

window.addEventListener('beforeunload', () => {

    try {

        const highestTimeoutId = setTimeout(() => {});
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
    } catch (error) {
        console.warn('Cleanup warning:', error);
    }
});