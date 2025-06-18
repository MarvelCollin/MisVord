// Landing page main script - no WebSocket required
import { showToast } from './core/ui/toast.js';
import { MisVordAjax } from './core/ajax/ajax-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page initialized');

    // Make essential utilities available globally
    window.showToast = showToast;
    window.MisVordAjax = MisVordAjax;

    initLandingPageUI();
    
    window.dispatchEvent(new CustomEvent('LandingPageReady', {
        detail: {
            showToast,
            MisVordAjax
        }
    }));
});

function initLandingPageUI() {
    // Initialize dropdown functionality
    const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    if (dropdownTriggers.length) {
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', toggleDropdown);
        });
    }

    // Initialize textarea auto-resize
    const textareas = document.querySelectorAll('textarea[data-autosize]');
    if (textareas.length) {
        textareas.forEach(textarea => {
            textarea.addEventListener('input', autosizeTextarea);
            autosizeTextarea({ target: textarea });
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('[data-dropdown]') && !e.target.closest('.dropdown-menu')) {
            document.querySelectorAll('.dropdown-menu.block').forEach(dropdown => {
                dropdown.classList.remove('block');
                dropdown.classList.add('hidden');
            });
        }
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

    // Close other dropdowns
    document.querySelectorAll('.dropdown-menu.block').forEach(menu => {
        if (menu.id !== targetId) {
            menu.classList.remove('block');
            menu.classList.add('hidden');
        }
    });

    // Toggle current dropdown
    if (!isOpen) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('block');
    } else {
        dropdown.classList.remove('block');
        dropdown.classList.add('hidden');
    }
}

function autosizeTextarea(e) {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

// Export utilities for other scripts
export {
    showToast,
    toggleDropdown,
    autosizeTextarea
};
