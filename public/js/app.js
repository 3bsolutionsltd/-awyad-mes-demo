/**
 * Main Application Entry Point Module
 * 
 * Initializes the AWYAD MES application on page load.
 * Handles authentication checks, user session management, and navigation setup.
 * Provides global error handlers for uncaught errors and promise rejections.
 * 
 * @module app
 * @author AWYAD MES Team
 * @since 1.0.0
 * @version 2.0.0
 */

import { setupNavigation } from './navigation.js';
import { stateManager } from './stateManager.js';
import { initializeSecurity } from './security.js';
import { renderMonthlyTracking } from './monthly.js';

// Global year switcher function for monthly tracking - MUST be available immediately
window.switchMonthlyYear = async function(year) {
    console.log('Switching to year:', year);
    window.currentMonthlyYear = year;
    
    // Re-render the monthly tracking page directly
    const contentArea = document.getElementById('content-area');
    if (contentArea && window.location.hash === '#monthly') {
        await renderMonthlyTracking(contentArea);
    }
};

/**
 * Initialize the application on DOM ready
 * Checks authentication, loads user data, and sets up navigation
 * 
 * @listens DOMContentLoaded
 * @returns {Promise<void>}
 * 
 * @example
 * // Automatically runs when page loads:
 * // 1. Initializes security measures
 * // 2. Checks authentication
 * // 3. Loads user profile
 * // 4. Initializes navigation
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('AWYAD MES - Application starting...');
    
    // Initialize security measures
    initializeSecurity();

    try {
        // Check if authManager exists (from auth.js)
        if (typeof window.authManager === 'undefined') {
            console.warn('Auth manager not found - authentication disabled');
        } else {
            // Check authentication
            if (!window.authManager.isAuthenticated()) {
                console.log('User not authenticated, redirecting to login...');
                window.location.href = '/public/login.html';
                return;
            }

            // Get user info (async call)
            const user = await window.authManager.getCurrentUser();
            console.log('User authenticated:', user?.username || user?.email || 'Unknown');

            // Store user in state
            stateManager.setState({ user });

            // Update user display if element exists
            const userDisplay = document.getElementById('user-display');
            if (userDisplay && user) {
                userDisplay.textContent = window.authManager.getUserDisplayName() || user.username || user.email || 'User';
            }

            // Re-apply role-based nav visibility now that currentUser has
            // fresh roles from the API (fixes deployed-site timing issue).
            if (typeof window.applyRoleVisibility === 'function') {
                window.applyRoleVisibility();
            }
        }

        // Setup navigation
        setupNavigation();
        
        // Setup mobile menu
        setupMobileMenu();

        console.log('AWYAD MES - Application initialized successfully');

    } catch (error) {
        console.error('Application initialization error:', error);
        
        // Show error to user
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="alert alert-danger m-4">
                    <h4><i class="bi bi-exclamation-triangle"></i> Initialization Error</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reload Page
                    </button>
                </div>
            `;
        }
    }
});

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Show user-friendly error message
    const errorMessage = event.error?.message || 'An unexpected error occurred';
    
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong> ${errorMessage}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show user-friendly error message
    const errorMessage = event.reason?.message || 'An unexpected error occurred';
    
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 m-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong> ${errorMessage}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
});

/**
 * Export app version info
 */
export const APP_INFO = {
    name: 'AWYAD MES',
    version: '2.0.0',
    build: 'Enterprise',
    buildDate: new Date().toISOString().split('T')[0]
};

console.log(`${APP_INFO.name} v${APP_INFO.version} (${APP_INFO.build}) - Build: ${APP_INFO.buildDate}`);

/**
 * Setup mobile menu functionality
 * Handles hamburger menu toggle, sidebar overlay, and swipe gestures
 * 
 * @returns {void}
 */
function setupMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    let menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (!menuToggle) {
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.innerHTML = '<i class="bi bi-list"></i>';
        menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
        document.body.appendChild(menuToggle);
    }
    
    // Get sidebar element
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        console.warn('Sidebar not found - mobile menu disabled');
        return;
    }
    
    // Create backdrop overlay for mobile
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }
    
    // Toggle menu function
    const toggleMenu = () => {
        const isOpen = sidebar.classList.contains('show');
        
        if (isOpen) {
            // Close menu
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
            menuToggle.innerHTML = '<i class="bi bi-list"></i>';
            document.body.style.overflow = '';
        } else {
            // Open menu
            sidebar.classList.add('show');
            backdrop.classList.add('show');
            menuToggle.innerHTML = '<i class="bi bi-x"></i>';
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        }
    };
    
    // Menu toggle button click
    menuToggle.addEventListener('click', toggleMenu);
    
    // Backdrop click closes menu
    backdrop.addEventListener('click', toggleMenu);
    
    // Close menu when nav link clicked (mobile)
    const navLinks = sidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                toggleMenu();
            }
        });
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Auto-close menu on desktop
            if (window.innerWidth >= 992) {
                sidebar.classList.remove('show');
                backdrop.classList.remove('show');
                menuToggle.innerHTML = '<i class="bi bi-list"></i>';
                document.body.style.overflow = '';
            }
        }, 250);
    });
    
    // Swipe gestures for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        // Swipe right to open (from left edge)
        if (swipeDistance > swipeThreshold && touchStartX < 50) {
            if (!sidebar.classList.contains('show')) {
                toggleMenu();
            }
        }
        
        // Swipe left to close (when menu is open)
        if (swipeDistance < -swipeThreshold && sidebar.classList.contains('show')) {
            toggleMenu();
        }
    }
    
    console.log('Mobile menu initialized');
}
