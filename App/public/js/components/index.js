export * from "./auth/auth.js";
export * from "./servers/server-manager.js";
export * from "./servers/server-sidebar.js";
export * from "./servers/server-dropdown.js";

export * from "./channels/channel-manager.js";
export * from "./channels/channel-drag.js";
export * from "./channels/channel-loader.js";


import './auth/auth.js';
import './servers/server-sidebar.js';
import './servers/server-manager.js';
import './servers/channel-redirect.js';
import './channels/channel-manager.js';


if (!document.body.classList.contains('settings-page') &&
    !document.location.pathname.includes('/settings') && 
    !document.location.pathname.includes('/app/friends') && 
    !document.location.pathname.includes('/home')) {
    import('./messaging/chat-section.js').catch(err => {
        console.debug('Chat section not loaded: ', err.message);
    });
    import('./messaging/emoji.js').catch(err => {
        console.debug('Emoji component not loaded: ', err.message);
    });
}

import './common/user-detail.js';


document.addEventListener('DOMContentLoaded', function () {

    const tooltips = document.querySelectorAll('[data-tooltip]');
    if (tooltips.length > 0) {
        tooltips.forEach(tooltip => {
            const tooltipText = tooltip.getAttribute('data-tooltip');
            const tooltipPosition = tooltip.getAttribute('data-tooltip-position') || 'top';

            tooltip.addEventListener('mouseenter', function () {
                const tooltipEl = document.createElement('div');
                tooltipEl.className = `tooltip tooltip-${tooltipPosition}`;
                tooltipEl.textContent = tooltipText;
                document.body.appendChild(tooltipEl);

                const rect = tooltip.getBoundingClientRect();
                const tooltipRect = tooltipEl.getBoundingClientRect();

                let top, left;

                switch (tooltipPosition) {
                    case 'top':
                        top = rect.top - tooltipRect.height - 5;
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        break;
                    case 'bottom':
                        top = rect.bottom + 5;
                        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                        break;
                    case 'left':
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        left = rect.left - tooltipRect.width - 5;
                        break;
                    case 'right':
                        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                        left = rect.right + 5;
                        break;
                }

                tooltipEl.style.top = `${top}px`;
                tooltipEl.style.left = `${left}px`;
                tooltipEl.classList.add('visible');
            });

            tooltip.addEventListener('mouseleave', function () {
                const tooltipEl = document.querySelector('.tooltip');
                if (tooltipEl) {
                    tooltipEl.remove();
                }
            });
        });
    }
});
