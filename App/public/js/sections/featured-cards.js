document.addEventListener('DOMContentLoaded', function() {
    initFeaturedCards();
});

function initFeaturedCards() {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;

    const cards = featuredSection.querySelectorAll('.feature-card');
    const sectionTitle = featuredSection.querySelector('.section-title');
    const sectionSubtitle = featuredSection.querySelector('.section-subtitle');

    if (sectionTitle) sectionTitle.classList.add('revealed');
    if (sectionSubtitle) sectionSubtitle.classList.add('revealed');

    cards.forEach((card, index) => {
        card.setAttribute('data-card-index', index);
        card._isHovered = false;
    });

    setTimeout(() => {
        cards.forEach((card, index) => {
            card.classList.add('revealed');
            card.style.opacity = '1';

            if (window.innerWidth > 768) {
                const vShapeTransform = getVShapeTransform(index);
                card.style.transform = vShapeTransform;
            }
        });
    }, 200);

    if (window.innerWidth > 768) {
        initDesktopInteractions(cards);
    } else {
        initMobileInteractions(cards);
    }

    window.addEventListener('resize', debounce(() => {
        handleResponsiveLayout(cards);
    }, 200));
}

function getVShapeTransform(index) {
    const spacing = Math.min(window.innerWidth / 8, 100);

    if (window.innerWidth >= 1400) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 2}px) translateY(60px) rotateY(-15deg) rotateX(5deg)`;
            case 1:
                return `translateX(-${spacing}px) translateY(30px) rotateY(-8deg) rotateX(3deg)`;
            case 2:
                return 'translateX(0) translateY(0) rotateY(0) rotateX(0) scale(1.1)';
            case 3:
                return `translateX(${spacing}px) translateY(30px) rotateY(8deg) rotateX(3deg)`;
            case 4:
                return `translateX(${spacing * 2}px) translateY(60px) rotateY(15deg) rotateX(5deg)`;
            default:
                return '';
        }
    } else if (window.innerWidth >= 1200) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 1.6}px) translateY(25px) rotateY(-10deg) rotateX(1deg)`;
            case 1:
                return `translateX(-${spacing * 0.8}px) translateY(12px) rotateY(-5deg) rotateX(0.5deg)`;
            case 2:
                return 'translateX(0) translateY(-3px) rotateY(0) rotateX(0) scale(1.04)';
            case 3:
                return `translateX(${spacing * 0.8}px) translateY(12px) rotateY(5deg) rotateX(0.5deg)`;
            case 4:
                return `translateX(${spacing * 1.6}px) translateY(25px) rotateY(10deg) rotateX(1deg)`;
            default:
                return '';
        }
    } else if (window.innerWidth >= 768) {
        switch (index) {
            case 0:
                return `translateX(-${spacing * 1.2}px) translateY(20px) rotateY(-8deg) rotateX(0.5deg)`;
            case 1:
                return `translateX(-${spacing * 0.6}px) translateY(10px) rotateY(-4deg) rotateX(0.2deg)`;
            case 2:
                return 'translateX(0) translateY(0px) rotateY(0) rotateX(0) scale(1.01)';
            case 3:
                return `translateX(${spacing * 0.6}px) translateY(10px) rotateY(4deg) rotateX(0.2deg)`;
            case 4:
                return `translateX(${spacing * 1.2}px) translateY(20px) rotateY(8deg) rotateX(0.5deg)`;
            default:
                return '';
        }
    } else {
        return 'translateX(0) translateY(0) rotateY(0) rotateX(0)';
    }
}

function initDesktopInteractions(cards) {
    cards.forEach((card, index) => {
        let hoverTimeout;

        card.addEventListener('mouseenter', (e) => {
            card._isHovered = true;
            showTooltip(card, e);

            hoverTimeout = setTimeout(() => {
                if (!card._isHovered) return;

                const currentlyFlipped = document.querySelector('.feature-card.flipped');
                if (currentlyFlipped && currentlyFlipped !== card) {
                    currentlyFlipped.classList.remove('flipped');
                }

                card.classList.add('flipped');
                card.style.zIndex = '100';
            }, 600);
        });

        card.addEventListener('mouseleave', () => {
            card._isHovered = false;
            clearTimeout(hoverTimeout);
            hideTooltip();

            if (card.classList.contains('flipped')) {
                card.classList.remove('flipped');
                setTimeout(() => {
                    card.style.zIndex = getCardZIndex(index);
                    if (window.innerWidth > 768) {
                        card.style.transform = getVShapeTransform(index);
                    }
                }, 300);
            }
        });

        card.addEventListener('mousemove', (e) => {
            if (card._isHovered) {
                updateTooltipPosition(e);
            }
        });
    });
}

function initMobileInteractions(cards) {
    cards.forEach((card, index) => {
        card.addEventListener('click', (event) => {
            const isFlipped = card.classList.contains('flipped');

            cards.forEach(c => c.classList.remove('flipped'));

            if (!isFlipped) {
                card.classList.add('flipped');
            }
        });
    });
}

function showTooltip(card, event) {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip) return;

    const text = card.getAttribute('data-tooltip');
    if (!text) return;

    const content = tooltip.querySelector('.modern-tooltip-content');
    if (content) {
        content.textContent = text;
    }

    tooltip.classList.add('show');
    updateTooltipPosition(event);

    if (card.getAttribute('data-tooltip-locked') !== 'true') {
        card.setAttribute('data-tooltip-locked', 'true');
        document.body._tooltipCard = card;
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip) return;

    tooltip.classList.remove('show');
    tooltip.style.visibility = 'hidden';

    if (document.body._tooltipCard) {
        document.body._tooltipCard.setAttribute('data-tooltip-locked', 'false');
        document.body._tooltipCard = null;
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('modern-tooltip');
    if (!tooltip || !tooltip.classList.contains('show')) return;

    const viewportWidth = window.innerWidth;

    const x = Math.round(event.clientX);
    const y = Math.round(event.clientY);

    tooltip.style.visibility = 'visible';

    const rect = tooltip.getBoundingClientRect();
    const tooltipWidth = rect.width;
    const tooltipHeight = rect.height;

    let left = x - tooltipWidth / 2;
    let top = y - tooltipHeight - 15;

    if (left < 20) left = 20;
    if (left + tooltipWidth > viewportWidth - 20) left = viewportWidth - tooltipWidth - 20;

    if (top < 20) {
        top = y + 15;
        const arrow = tooltip.querySelector('.modern-tooltip-arrow');
        if (arrow) {
            arrow.style.top = '-8px';
            arrow.style.bottom = 'auto';
            arrow.style.borderTop = 'none';
            arrow.style.borderBottom = '8px solid rgba(0, 0, 0, 0.95)';
        }
    } else {
        const arrow = tooltip.querySelector('.modern-tooltip-arrow');
        if (arrow) {
            arrow.style.top = 'auto';
            arrow.style.bottom = '-8px';
            arrow.style.borderTop = '8px solid rgba(0, 0, 0, 0.95)';
            arrow.style.borderBottom = 'none';
        }
    }

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
}

function getCardZIndex(index) {
    switch(index) {
        case 2: return "7";
        case 1:
        case 3: return "6";
        case 0:
        case 4: return "5";
        default: return "5";
    }
}

function handleResponsiveLayout(cards) {
    const featuredSection = document.getElementById('featured-cards');
    if (!featuredSection) return;

    const isMobile = window.innerWidth <= 768;

    cards.forEach((card, index) => {
        clearTimeout(card._stabilizeTimeout);
        card.classList.remove('hover-locked');

        if (isMobile) {
            card.style.transform = 'none';
            card.style.zIndex = '10';
            card.classList.remove('flipped');
            card.style.filter = 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4))';
        } else {
            const vShapeTransform = getVShapeTransform(index);
            card.style.transform = vShapeTransform;
            card.style.zIndex = getCardZIndex(index);
            card.style.filter = 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4))';
        }

        card.style.transition = 'transform 0.3s ease, filter 0.3s ease';
    });
}

function resetCardPosition(card, index) {
    if (!card) return;

    if (card._isHovered ||
        card.classList.contains('flipped') ||
        card.classList.contains('hover-locked')) {
        return;
    }

    if (window.innerWidth < 768) {
        card.style.transform = 'translateX(0) translateY(0)';
        return;
    }

    stabilizeCard(card, index);
}

function stabilizeCard(card, index) {
    if (card._isHovered || card.classList.contains('flipped')) return;

    const vShapeTransform = getVShapeTransform(index);
    card.style.transform = vShapeTransform;
    card.style.filter = 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4))';
    card.style.transition = 'transform 0.3s ease, filter 0.3s ease';
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

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

document.addEventListener('keydown', function(event) {
    if (event.key.toLowerCase() === 'd') {
        const featuredSection = document.getElementById('featured-cards');
        if (featuredSection) {
            console.log("Debug mode toggled");
            featuredSection.classList.toggle('debug-visible');

            if (featuredSection.classList.contains('debug-visible')) {
                const cards = featuredSection.querySelectorAll('.feature-card');
                cards.forEach((card, i) => {
                    console.log(`Card ${i} - revealed: ${card.classList.contains('revealed')}, opacity: ${card.style.opacity}, transform: ${card.style.transform}`);
                });
            }
        }
    }
});

console.log('Enhanced Featured Cards loaded at ' + new Date().toISOString());