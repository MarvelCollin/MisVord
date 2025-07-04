document.addEventListener("DOMContentLoaded", function () {
  initFeaturedCards();
  initCursorParticles();
  initCardTiltEffect();
});

document.addEventListener('featuredCardsVisible', function() {
  const featuredSection = document.getElementById("featured-cards");
  if (featuredSection) {
    triggerCardAnimations();
  }
});

function initFeaturedCards() {
  const featuredSection = document.getElementById("featured-cards");
  if (!featuredSection) {
    return;
  }

  setupIntersectionObserver(featuredSection);
  setupCardInteractions();
}

function setupIntersectionObserver(featuredSection) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!featuredSection.dataset.observed) {
            featuredSection.dataset.observed = 'true';
            triggerSectionAnimation();
          }
        }
      });
    },
    { 
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    }
  );

  observer.observe(featuredSection);
}

function triggerSectionAnimation() {
  const title = document.querySelector('[data-animate="title"]');
  const subtitle = document.querySelector('[data-animate="subtitle"]');
  
  if (title) {
    setTimeout(() => {
      title.classList.add('revealed');
    }, 200);
  }
  
  if (subtitle) {
    setTimeout(() => {
      subtitle.classList.add('revealed');
    }, 600);
  }
  
  setTimeout(() => {
    triggerCardAnimations();
  }, 800);
}

function triggerCardAnimations() {
  const cards = document.querySelectorAll('.featured-card');
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    }, index * 150);
  });
}

function setupCardInteractions() {
  const cards = document.querySelectorAll('.featured-card');
  
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px) scale(0.9)';
    card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
    
    const primaryBtn = card.querySelector('.card-btn.primary');
    const secondaryBtn = card.querySelector('.card-btn.secondary');
    
    if (primaryBtn) {
      primaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createButtonRipple(e, primaryBtn);
      });
    }
    
    if (secondaryBtn) {
      secondaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createButtonRipple(e, secondaryBtn);
      });
    }
    
    card.addEventListener('mouseenter', () => {
      createCardSparkles(card);
    });
  });
}

function createButtonRipple(event, button) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement('div');
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.6s ease-out;
    pointer-events: none;
  `;
  
  button.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

function createCardSparkles(card) {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      const rect = card.getBoundingClientRect();
      const x = Math.random() * rect.width;
      const y = Math.random() * rect.height;
      
      sparkle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, #5865f2, #7289da);
        border-radius: 50%;
        pointer-events: none;
        animation: sparkle 1s ease-out forwards;
        z-index: 10;
      `;
      
      card.appendChild(sparkle);
      
      setTimeout(() => {
        sparkle.remove();
      }, 1000);
    }, i * 200);
  }
}

function initCardTiltEffect() {
  const cards = document.querySelectorAll('[data-tilt="true"]');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  });
}

function initCursorParticles() {
  const particleContainer = document.querySelector('.cursor-particles');
  if (!particleContainer) return;
  
  let lastParticleTime = 0;
  const particleInterval = 100;
  
  document.addEventListener('mousemove', (e) => {
    const currentTime = Date.now();
    if (currentTime - lastParticleTime < particleInterval) return;
    
    lastParticleTime = currentTime;
    
    if (e.target.closest('.featured-card')) {
      createCursorParticle(e.clientX, e.clientY, particleContainer);
    }
  });
}

function createCursorParticle(x, y, container) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  const offsetX = (Math.random() - 0.5) * 20;
  const offsetY = (Math.random() - 0.5) * 20;
  
  particle.style.left = (x + offsetX) + 'px';
  particle.style.top = (y + offsetY) + 'px';
  
  container.appendChild(particle);
  
  setTimeout(() => {
    particle.remove();
  }, 2000);
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

const style = document.createElement('style');
style.textContent = `
@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes sparkle {
  0% {
    opacity: 1;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(360deg);
  }
}
`;
document.head.appendChild(style);

window.featuredCardsAPI = {
  debounce,
  initCardTiltEffect,
  initCursorParticles
};


