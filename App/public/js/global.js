document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollReveal();
    initTooltips();
    initDropdowns();
    initTextareaAutosize();
    initSocketConnection();
    
    document.addEventListener('click', function(e) {
        closeDropdowns(e);
    });
});

function initNavigation() {
    const nav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');

    if (nav) {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            if (currentScrollY > lastScrollY && currentScrollY > 500) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        });
    }

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        if (navToggle) navToggle.classList.remove('active');
                    }
                }
            }
        });
    });
}

function initScrollReveal() {
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

function createRippleEffect(event) {
    const button = event.currentTarget;

    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

function initSocketConnection() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;
    
    const userId = appContainer.dataset.userId;
    const username = appContainer.dataset.username;
    const socketUrl = appContainer.dataset.socketUrl;
    
    if (!userId || !socketUrl) return;
    
    try {
        const socket = io(socketUrl);
        
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            socket.emit('user-online', { userId, username });
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
        });
        
        window.misvordSocket = socket;
        
        window.addEventListener('beforeunload', () => {
            socket.emit('user-offline', { userId });
        });
    } catch (error) {
        console.error('Socket connection error:', error);
    }
}

function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', showTooltip);
        tooltip.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltip = e.currentTarget;
    const text = tooltip.dataset.tooltip;
    
    if (!text) return;
    
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'absolute z-50 bg-black text-white text-xs py-1 px-2 rounded pointer-events-none';
    tooltipEl.textContent = text;
    
    document.body.appendChild(tooltipEl);
    
    const rect = tooltip.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    
    tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
    tooltipEl.style.top = `${rect.top - tooltipRect.height - 8}px`;
    
    tooltip.dataset.tooltipId = Date.now();
    tooltipEl.dataset.for = tooltip.dataset.tooltipId;
}

function hideTooltip(e) {
    const tooltip = e.currentTarget;
    const tooltipId = tooltip.dataset.tooltipId;
    
    if (!tooltipId) return;
    
    const tooltipEl = document.querySelector(`[data-for="${tooltipId}"]`);
    if (tooltipEl) {
        tooltipEl.remove();
    }
    
    delete tooltip.dataset.tooltipId;
}

function initDropdowns() {
    const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', toggleDropdown);
    });
}

function toggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const trigger = e.currentTarget;
    const targetId = trigger.dataset.dropdown;
    const dropdown = document.getElementById(targetId);
    
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('block');
    
    closeAllDropdowns();
    
    if (!isOpen) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('block');
    }
}

function closeDropdowns(e) {
    if (e.target.closest('[data-dropdown]')) return;
    if (e.target.closest('.dropdown-menu')) return;
    
    closeAllDropdowns();
}

function closeAllDropdowns() {
    const openDropdowns = document.querySelectorAll('.dropdown-menu.block');
    openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('block');
        dropdown.classList.add('hidden');
    });
}

function initTextareaAutosize() {
    const textareas = document.querySelectorAll('textarea[data-autosize]');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', autosizeTextarea);
        autosizeTextarea({ target: textarea });
    });
}

function autosizeTextarea(e) {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}