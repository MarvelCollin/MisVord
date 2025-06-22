/**
 * User Settings Page Javascript
 */
(function() {
    'use strict';

    // Check if we're on the settings page
    if (!document.querySelector('.settings-page')) {
        return;
    }

    if (typeof window.logger !== 'undefined') {
        window.logger.debug('settings', 'Initializing user settings page');
    }

    const settingsPage = {
        init: function() {
            this.bindEvents();
            this.setupTabNavigation();
            this.setupCloseButton();
            this.setupSettingsNavigation();
            this.setupEmailReveal();
            this.handleEditButtons();
        },

        bindEvents: function() {
            // Add Escape key listener to close the settings page
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    window.history.back();
                }
            });
        },

        setupTabNavigation: function() {
            const tabs = document.querySelectorAll('.settings-content .border-b button');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs
                    tabs.forEach(t => {
                        t.className = 'text-discord-lighter hover:text-white py-2 px-4 font-medium';
                    });
                    
                    // Add active class to clicked tab
                    this.className = 'text-discord-blue border-b-2 border-discord-blue py-2 px-4 font-medium';
                    
                    // Here you would also handle showing the correct tab content
                });
            });
        },

        setupCloseButton: function() {
            const closeButton = document.querySelector('.settings-content button[onclick="window.history.back()"]');
            
            if (closeButton) {
                closeButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.history.back();
                });
                
                // Add tooltip text
                const tooltip = document.createElement('div');
                tooltip.className = 'absolute -bottom-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity';
                tooltip.textContent = 'ESC';
                closeButton.appendChild(tooltip);
                
                closeButton.addEventListener('mouseenter', function() {
                    tooltip.style.opacity = '1';
                });
                
                closeButton.addEventListener('mouseleave', function() {
                    tooltip.style.opacity = '0';
                });
            }
        },

        setupSettingsNavigation: function() {
            const settingsItems = document.querySelectorAll('.settings-item');
            
            settingsItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    
                    // If it's just a tab change within the same page, prevent default
                    if (href.startsWith('#')) {
                        e.preventDefault();
                        
                        // Remove selected class from all items
                        settingsItems.forEach(i => i.classList.remove('bg-discord-selected'));
                        
                        // Add selected class to clicked item
                        this.classList.add('bg-discord-selected');
                    }
                });
            });
        },

        setupEmailReveal: function() {
            const emailRevealButton = document.querySelector('.text-blue-500.hover\\:underline');
            const emailElement = emailRevealButton?.previousElementSibling;
            
            if (emailRevealButton && emailElement) {
                const hiddenEmail = emailElement.textContent;
                
                emailRevealButton.addEventListener('click', function() {
                    // In a real app, this would probably fetch the real email from an API
                    // Here we're simulating it
                    const realEmail = hiddenEmail.replace(/\*+/, 'real.email');
                    emailElement.textContent = realEmail;
                    emailRevealButton.style.display = 'none';
                });
            }
        },

        handleEditButtons: function() {
            const editButtons = document.querySelectorAll('.settings-content button:not([onclick="window.history.back()"])');
            
            editButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const buttonText = this.textContent.trim();
                    
                    if (buttonText === 'Edit User Profile') {
                        this.textContent = 'Save';
                        // Here you would handle showing profile edit options
                    }
                    else if (buttonText === 'Edit') {
                        const parentSection = this.closest('div');
                        const label = parentSection.querySelector('h3').textContent;
                        const currentValue = parentSection.querySelector('p').textContent;
                        
                        // Create an input field
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = currentValue;
                        input.className = 'w-full bg-discord-dark text-white border-none rounded p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-discord-blue';
                        
                        // Replace the paragraph with the input
                        parentSection.querySelector('p').replaceWith(input);
                        
                        // Change button text
                        this.textContent = 'Save';
                    }
                    else if (buttonText === 'Save') {
                        this.textContent = 'Edit';
                        // Here you would handle saving the edits
                    }
                });
            });
        }
    };

    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            settingsPage.init();
        });
    } else {
        settingsPage.init();
    }
})();
