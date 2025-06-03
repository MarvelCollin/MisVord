import { showToast } from './core/toast.js';
import { MisVordAjax } from './core/ajax-handler.js';

import * as Components from './components/index.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('MisVord application initialized');

    initGlobalUI();

    initPageSpecificComponents();
});

function initGlobalUI() {

    const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    if (dropdownTriggers.length) {
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', toggleDropdown);
        });
    }

    const textareas = document.querySelectorAll('textarea[data-autosize]');
    if (textareas.length) {
        textareas.forEach(textarea => {
            textarea.addEventListener('input', autosizeTextarea);

            autosizeTextarea({ target: textarea });
        });
    }
}

function initPageSpecificComponents() {
    const path = window.location.pathname;

    if (path === '/login' || path === '/register' || path === '/forgot-password') {

    }

    else if (path === '/app' || path === '/home') {

    }

    else if (path.includes('/server/')) {

    }

    else if (path === '/explore') {

    }
}

function toggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();

    const trigger = e.currentTarget;
    const targetId = trigger.dataset.dropdown;
    const dropdown = document.getElementById(targetId);

    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('block');

    document.querySelectorAll('.dropdown-menu.block').forEach(menu => {
        if (menu.id !== targetId) {
            menu.classList.remove('block');
            menu.classList.add('hidden');
        }
    });

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

document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-dropdown]') && !e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu.block').forEach(dropdown => {
            dropdown.classList.remove('block');
            dropdown.classList.add('hidden');
        });
    }
});

window.misvord = {
    showToast,
    toggleDropdown,
    autosizeTextarea
};

export {
    showToast,
    toggleDropdown,
    autosizeTextarea
};