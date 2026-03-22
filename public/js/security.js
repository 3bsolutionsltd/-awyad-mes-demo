/**
 * Security Utilities Module
 * 
 * Provides client-side security measures including input sanitization,
 * XSS prevention, and secure data handling for the AWYAD MES application.
 * 
 * @module security
 * @author AWYAD MES Team
 * @since 2.3.0
 */

/**
 * HTML entities map for escaping
 * @private
 */
const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * 
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML rendering
 * 
 * @example
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHtml(userInput);
 * // safe === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"'\/]/g, char => HTML_ENTITIES[char]);
}

/**
 * Sanitize user input by removing potentially dangerous content
 * Removes scripts, event handlers, and potentially malicious HTML
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string
 * 
 * @example
 * const unsafe = '<img src=x onerror="alert(1)">';
 * const safe = sanitizeInput(unsafe);
 * // safe === '<img src=x >'
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers (onclick, onerror, onload, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');
    
    // Escape remaining HTML
    return escapeHtml(sanitized);
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing entire API response or form data objects
 * 
 * @param {Object|Array} obj - Object or array to sanitize
 * @param {Array<string>} excludeKeys - Keys to skip sanitization (e.g., 'password')
 * @returns {Object|Array} Sanitized object
 * 
 * @example
 * const data = {
 *   name: '<script>alert(1)</script>John',
 *   comment: 'Hello <b>world</b>'
 * };
 * const safe = sanitizeObject(data);
 */
export function sanitizeObject(obj, excludeKeys = []) {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, excludeKeys));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (excludeKeys.includes(key)) {
                sanitized[key] = value; // Don't sanitize excluded keys
            } else if (typeof value === 'string') {
                sanitized[key] = sanitizeInput(value);
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value, excludeKeys);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    
    return obj;
}

/**
 * Validate email format
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 * 
 * @example
 * isValidEmail('user@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format (international or local)
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 * 
 * @example
 * isValidPhone('+249123456789'); // true
 * isValidPhone('123-456-7890'); // true
 */
export function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
export function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Generate a simple CSRF token for client-side forms
 * Note: This is a basic implementation. For production, use server-generated tokens.
 * 
 * @returns {string} Random CSRF token
 * 
 * @example
 * const token = generateCsrfToken();
 * // Store in session or add to form
 */
export function generateCsrfToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in sessionStorage
 * 
 * @param {string} token - CSRF token to store
 */
export function storeCsrfToken(token) {
    try {
        sessionStorage.setItem('csrf_token', token);
    } catch (error) {
        console.error('Failed to store CSRF token:', error);
    }
}

/**
 * Retrieve CSRF token from sessionStorage
 * 
 * @returns {string|null} CSRF token or null if not found
 */
export function getCsrfToken() {
    try {
        return sessionStorage.getItem('csrf_token');
    } catch (error) {
        console.error('Failed to retrieve CSRF token:', error);
        return null;
    }
}

/**
 * Rate limiter class for preventing abuse of API calls or actions
 * Uses token bucket algorithm for rate limiting
 */
export class RateLimiter {
    /**
     * Create a rate limiter
     * 
     * @param {number} maxTokens - Maximum number of tokens (requests)
     * @param {number} refillRate - Tokens to add per second
     */
    constructor(maxTokens = 10, refillRate = 1) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
    }
    
    /**
     * Refill tokens based on time elapsed
     * @private
     */
    refill() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
        const tokensToAdd = timePassed * this.refillRate;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
    
    /**
     * Try to consume a token (allow an action)
     * 
     * @returns {boolean} True if action is allowed, false if rate limited
     * 
     * @example
     * const limiter = new RateLimiter(5, 1); // 5 requests, refill 1/sec
     * if (limiter.tryConsume()) {
     *   // Perform action
     * } else {
     *   // Show rate limit error
     * }
     */
    tryConsume() {
        this.refill();
        
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get time until next token is available (in seconds)
     * 
     * @returns {number} Seconds until next token
     */
    getWaitTime() {
        if (this.tokens >= 1) return 0;
        return (1 - this.tokens) / this.refillRate;
    }
}

/**
 * Create rate limiter for login attempts
 * Limits to 5 attempts per minute
 */
export const loginRateLimiter = new RateLimiter(5, 5 / 60);

/**
 * Create rate limiter for API calls
 * Limits to 30 calls per minute
 */
export const apiRateLimiter = new RateLimiter(30, 30 / 60);

/**
 * Secure localStorage wrapper with encryption (basic XOR encryption)
 * Note: For production, use proper encryption libraries
 * 
 * @param {string} key - Storage key
 * @param {string} value - Value to store (omit to retrieve)
 * @returns {string|null} Retrieved value or null
 * 
 * @example
 * secureStorage('user-prefs', JSON.stringify(prefs)); // Store
 * const prefs = JSON.parse(secureStorage('user-prefs') || '{}'); // Retrieve
 */
export function secureStorage(key, value = undefined) {
    const SECRET = 'AWYAD_MES_2024'; // In production, use environment variable
    
    /**
     * Simple XOR encryption/decryption
     * @private
     */
    function xorCipher(str, secret) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
        }
        return result;
    }
    
    try {
        if (value !== undefined) {
            // Store encrypted value
            const encrypted = btoa(xorCipher(value, SECRET));
            localStorage.setItem(key, encrypted);
            return value;
        } else {
            // Retrieve and decrypt value
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            
            const decrypted = xorCipher(atob(encrypted), SECRET);
            return decrypted;
        }
    } catch (error) {
        console.error('Secure storage error:', error);
        return null;
    }
}

/**
 * Clear all secure storage
 * Useful for logout or session cleanup
 */
export function clearSecureStorage() {
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch (error) {
        console.error('Failed to clear storage:', error);
    }
}

/**
 * Validate and sanitize form data before submission
 * 
 * @param {FormData|Object} formData - Form data to validate
 * @param {Object} rules - Validation rules {field: {required, type, maxLength}}
 * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
 * 
 * @example
 * const result = validateFormData(formData, {
 *   email: { required: true, type: 'email' },
 *   name: { required: true, maxLength: 100 }
 * });
 * if (result.valid) {
 *   // Submit result.sanitized
 * } else {
 *   // Show result.errors
 * }
 */
export function validateFormData(formData, rules) {
    const errors = {};
    const sanitized = {};
    let valid = true;
    
    // Convert FormData to object if needed
    const data = formData instanceof FormData
        ? Object.fromEntries(formData.entries())
        : formData;
    
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        
        // Check required
        if (fieldRules.required && (!value || value.trim() === '')) {
            errors[field] = `${field} is required`;
            valid = false;
            continue;
        }
        
        // Skip validation if field is empty and not required
        if (!value) {
            sanitized[field] = '';
            continue;
        }
        
        // Sanitize value
        let sanitizedValue = sanitizeInput(value);
        
        // Check type
        if (fieldRules.type === 'email' && !isValidEmail(sanitizedValue)) {
            errors[field] = `Invalid email format`;
            valid = false;
        } else if (fieldRules.type === 'phone' && !isValidPhone(sanitizedValue)) {
            errors[field] = `Invalid phone format`;
            valid = false;
        } else if (fieldRules.type === 'url' && !isValidUrl(sanitizedValue)) {
            errors[field] = `Invalid URL format`;
            valid = false;
        } else if (fieldRules.type === 'number') {
            const num = parseFloat(sanitizedValue);
            if (isNaN(num)) {
                errors[field] = `${field} must be a number`;
                valid = false;
            } else {
                sanitizedValue = num;
            }
        }
        
        // Check max length
        if (fieldRules.maxLength && sanitizedValue.length > fieldRules.maxLength) {
            errors[field] = `${field} must be less than ${fieldRules.maxLength} characters`;
            valid = false;
        }
        
        sanitized[field] = sanitizedValue;
    }
    
    return { valid, errors, sanitized };
}

/**
 * Content Security Policy helper
 * Generate CSP meta tag content for enhanced security
 * 
 * @returns {string} CSP policy string
 */
export function generateCSP() {
    return `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.sheetjs.com;
        style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
        img-src 'self' data: https:;
        font-src 'self' https://cdn.jsdelivr.net;
        connect-src 'self' http://localhost:3001 https://cdn.jsdelivr.net https://cdn.sheetjs.com;
        frame-src 'none';
        object-src 'none';
    `.replace(/\s+/g, ' ').trim();
}

/**
 * Initialize security measures on page load
 * Call this function when the application initializes
 * 
 * @example
 * initializeSecurity();
 */
export function initializeSecurity() {
    // Generate and store CSRF token if not exists
    if (!getCsrfToken()) {
        const token = generateCsrfToken();
        storeCsrfToken(token);
    }
    
    // Add CSP meta tag if not exists
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = generateCSP();
        document.head.appendChild(meta);
    }
    
    console.log('Security measures initialized');
}
