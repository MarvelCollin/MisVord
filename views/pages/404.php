<?php
$error_code = $_GET['code'] ?? 404;
$error_message = $_GET['message'] ?? 'Page Not Found';

if ($error_code == 403) {
    $page_title = 'MisVord - Access Denied';
    $error_title = '403';
    $error_heading = 'Access Denied';
    $error_description = urldecode($_GET['message'] ?? 'You are not a member of this server');
} else {
    $page_title = 'MisVord - Page Not Found';
    $error_title = '404';
    $error_heading = 'Page Not Found';
    $error_description = 'The page you were looking for doesn\'t exist or you may not have permission to view it.';
}

$body_class = 'bg-discord-dark text-white flex flex-col h-screen overflow-hidden';
ob_start();
?>
<style>
.particle-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: linear-gradient(135deg, #1e2124 0%, #2c2f33 50%, #36393f 100%);
}

.particle {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(114, 137, 218, 0.8) 0%, rgba(88, 101, 242, 0.4) 100%);
    will-change: transform, opacity;
    pointer-events: none;
}

.particle:nth-child(3n) {
    background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(153, 170, 181, 0.3) 100%);
}

.particle:nth-child(3n+1) {
    background: radial-gradient(circle, rgba(88, 101, 242, 0.7) 0%, rgba(114, 137, 218, 0.3) 100%);
}

.error-container {
    position: relative;
    z-index: 10;
    backdrop-filter: blur(15px) saturate(180%);
    background: rgba(54, 57, 63, 0.85);
    border: 1px solid rgba(114, 137, 218, 0.2);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
    transform: translateZ(0);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-container:hover {
    box-shadow: 0 35px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(114, 137, 218, 0.1);
    transform: translateY(-2px) translateZ(0);
}

.glow-effect {
    text-shadow: 0 0 30px rgba(114, 137, 218, 0.6), 0 0 60px rgba(114, 137, 218, 0.3);
    animation: textGlow 3s ease-in-out infinite alternate;
}

@keyframes textGlow {
    from { text-shadow: 0 0 30px rgba(114, 137, 218, 0.6), 0 0 60px rgba(114, 137, 218, 0.3); }
    to { text-shadow: 0 0 40px rgba(114, 137, 218, 0.8), 0 0 80px rgba(114, 137, 218, 0.5); }
}

.pulse-icon {
    animation: smoothPulse 2.5s ease-in-out infinite;
    filter: drop-shadow(0 0 15px rgba(114, 137, 218, 0.4));
}

@keyframes smoothPulse {
    0%, 100% {
        transform: scale(1) rotate(0deg);
        opacity: 0.8;
        filter: drop-shadow(0 0 15px rgba(114, 137, 218, 0.4));
    }
    50% {
        transform: scale(1.15) rotate(5deg);
        opacity: 1;
        filter: drop-shadow(0 0 25px rgba(114, 137, 218, 0.7));
    }
}

.btn-glow {
    background: linear-gradient(45deg, #5865f2, #7289da);
    box-shadow: 0 4px 15px rgba(88, 101, 242, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.btn-glow::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.btn-glow:hover::before {
    left: 100%;
}

.btn-glow:hover {
    box-shadow: 0 8px 25px rgba(88, 101, 242, 0.5);
    transform: translateY(-3px);
    background: linear-gradient(45deg, #4752c4, #5865f2);
}

.floating {
    animation: floating 6s ease-in-out infinite;
}

@keyframes floating {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}
</style>

<div class="particle-bg" id="particleContainer"></div>

<div class="flex-1 flex items-center justify-center flex-col px-4 relative z-10">
    <div class="error-container p-8 rounded-xl max-w-lg w-full text-center floating">
        <h1 class="text-6xl font-bold mb-4 glow-effect"><?php echo $error_title; ?></h1>
        <h2 class="text-2xl font-semibold mb-6 text-gray-200"><?php echo $error_heading; ?></h2>
        <p class="mb-8 text-discord-lighter leading-relaxed"><?php echo htmlspecialchars($error_description); ?></p>
        <div class="mb-8">
            <?php if ($error_code == 403): ?>
                <i class="fas fa-lock text-7xl text-red-400 pulse-icon"></i>
            <?php else: ?>
                <i class="fas fa-ghost text-7xl text-discord-primary pulse-icon"></i>
            <?php endif; ?>
        </div>
        <a href="/" class="inline-block text-white py-3 px-8 rounded-lg font-medium btn-glow">
            Return to Home
        </a>
    </div>
</div>

<script>
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.container = document.getElementById('particleContainer');
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    createParticles() {
        const particleCount = 35;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                element: document.createElement('div'),
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 6 + 2,
                opacity: Math.random() * 0.8 + 0.2,
                life: Math.random() * 0.02 + 0.005
            };

            particle.element.className = 'particle';
            particle.element.style.width = particle.size + 'px';
            particle.element.style.height = particle.size + 'px';
            particle.element.style.opacity = particle.opacity;
            
            this.container.appendChild(particle.element);
            this.particles.push(particle);
        }
    }

    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('resize', () => {
            this.particles.forEach(particle => {
                if (particle.x > window.innerWidth) particle.x = window.innerWidth;
                if (particle.y > window.innerHeight) particle.y = window.innerHeight;
            });
        });
    }

    updateParticle(particle) {
        const mouseDistance = Math.sqrt(
            Math.pow(particle.x - this.mouseX, 2) + Math.pow(particle.y - this.mouseY, 2)
        );
        
        if (mouseDistance < 100) {
            const force = (100 - mouseDistance) / 100;
            const angle = Math.atan2(particle.y - this.mouseY, particle.x - this.mouseX);
            particle.vx += Math.cos(angle) * force * 0.01;
            particle.vy += Math.sin(angle) * force * 0.01;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vx *= 0.99;
        particle.vy *= 0.99;

        if (particle.x < 0) {
            particle.x = 0;
            particle.vx *= -0.8;
        }
        if (particle.x > window.innerWidth) {
            particle.x = window.innerWidth;
            particle.vx *= -0.8;
        }
        if (particle.y < 0) {
            particle.y = 0;
            particle.vy *= -0.8;
        }
        if (particle.y > window.innerHeight) {
            particle.y = window.innerHeight;
            particle.vy *= -0.8;
        }

        particle.opacity += Math.sin(Date.now() * particle.life) * 0.01;
        particle.opacity = Math.max(0.1, Math.min(0.8, particle.opacity));

        particle.element.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`;
        particle.element.style.opacity = particle.opacity;
    }

    animate() {
        this.particles.forEach(particle => this.updateParticle(particle));
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem();
});
</script>

<?php
$content = ob_get_clean();
include dirname(__DIR__) . '/layout/main-app.php';
?>

