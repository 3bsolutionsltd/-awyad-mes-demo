/**
 * State Manager Module
 * 
 * Centralized reactive state management for the AWYAD MES application.
 * Implements observer pattern for state updates with automatic listener notification.
 * Manages application data, loading states, and error handling.
 * 
 * @module stateManager
 * @author AWYAD MES Team
 * @since 1.0.0
 */

/**
 * StateManager class - Singleton state container with observer pattern
 * 
 * Manages application state and notifies subscribers of changes.
 * State includes user data, entities (projects, indicators, activities, cases),
 * and UI states (loading, errors).
 */
class StateManager {
    /**
     * Initialize state manager with default state and empty listener array
     * 
     * @constructor
     */
    constructor() {
        this.state = {
            user: null,
            projects: [],
            indicators: [],
            activities: [],
            cases: [],
            thematicAreas: [],
            loading: false,
            error: null
        };
        this.listeners = [];
        
        // Initialize cache with TTL (time-to-live) in milliseconds
        this.cache = new Map();
        this.cacheConfig = {
            ttl: 5 * 60 * 1000, // 5 minutes default TTL
            enabled: true
        };
    }

    /**
     * Get a shallow copy of the current state
     * Returns a copy to prevent direct state mutation
     * 
     * @returns {Object} Copy of current state object
     * 
     * @example
     * const currentState = stateManager.getState();
     * console.log(currentState.projects); // Array of projects
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state with new values and notify all listeners
     * Merges updates into current state, does not replace entirely
     * 
     * @param {Object} updates - Object with state properties to update
     * @returns {void}
     * 
     * @example
     * stateManager.setState({ loading: true });
     * stateManager.setState({ projects: newProjects, loading: false });
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    /**
     * Subscribe a listener function to state changes
     * Listener is called immediately on any state update
     * 
     * @param {Function} listener - Callback function that receives updated state
     * @returns {Function} Unsubscribe function to remove this listener
     * 
     * @example
     * const unsubscribe = stateManager.subscribe((state) => {
     *   console.log('Projects updated:', state.projects);
     * });
     * // Later, to stop listening:
     * unsubscribe();
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all subscribed listeners of state change
     * Called automatically by setState, should not be called directly
     * 
     * @private
     * @returns {void}
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    /**
     * Set loading state and clear any existing errors
     * 
     * @param {boolean} loading - Whether app is in loading state
     * @returns {void}
     * 
     * @example
     * stateManager.setLoading(true); // Show loading spinner
     * // ... fetch data ...
     * stateManager.setLoading(false); // Hide loading spinner
     */
    setLoading(loading) {
        this.setState({ loading, error: null });
    }

    /**
     * Set error state and clear loading flag
     * 
     * @param {string|Error} error - Error message or Error object
     * @returns {void}
     * 
     * @example
     * stateManager.setError('Failed to load projects');
     */
    setError(error) {
        this.setState({ error, loading: false });
    }

    /**
     * Clear current error state
     * 
     * @returns {void}
     * 
     * @example
     * stateManager.clearError(); // Remove error message from UI
     */
    clearError() {
        this.setState({ error: null });
    }

    /**
     * Set authenticated user data
     * 
     * @param {Object|null} user - User object with id, username, role, etc.
     * @returns {void}
     * 
     * @example
     * stateManager.setUser({ id: 1, username: 'admin', role: 'admin' });
     */
    setUser(user) {
        this.setState({ user });
    }

    /**
     * Set projects array in state
     * 
     * @param {Array<Object>} projects - Array of project objects
     * @returns {void}
     * 
     * @example
     * stateManager.setProjects([{ id: 1, name: 'Project A', ... }]);
     */
    setProjects(projects) {
        this.setState({ projects });
    }

    /**
     * Set indicators array in state
     * 
     * @param {Array<Object>} indicators - Array of indicator objects
     * @returns {void}
     * 
     * @example
     * stateManager.setIndicators([{ id: 1, code: 'IND-001', ... }]);
     */
    setIndicators(indicators) {
        this.setState({ indicators });
    }

    /**
     * Set activities array in state
     * 
     * @param {Array<Object>} activities - Array of activity objects
     * @returns {void}
     * 
     * @example
     * stateManager.setActivities([{ id: 1, name: 'Training', ... }]);
     */
    setActivities(activities) {
        this.setState({ activities });
    }

    /**
     * Set cases array in state
     * 
     * @param {Array<Object>} cases - Array of case objects
     * @returns {void}
     * 
     * @example
     * stateManager.setCases([{ id: 1, caseNumber: 'CASE-001', ... }]);
     */
    setCases(cases) {
        this.setState({ cases });
    }

    /**
     * Set thematic areas array in state
     * 
     * @param {Array<Object>} thematicAreas - Array of thematic area objects
     * @returns {void}
     * 
     * @example
     * stateManager.setThematicAreas([{ id: 1, name: 'GBV Response', ... }]);
     */
    setThematicAreas(thematicAreas) {
        this.setState({ thematicAreas });
    }

    /**
     * Find and return a project by its ID
     * 
     * @param {number} id - Project ID to find
     * @returns {Object|undefined} Project object if found, undefined otherwise
     * 
     * @example
     * const project = stateManager.getProjectById(1);
     * if (project) console.log(project.name);
     */
    getProjectById(id) {
        return this.state.projects.find(p => p.id === id);
    }

    /**
     * Find and return an indicator by its ID
     * 
     * @param {number} id - Indicator ID to find
     * @returns {Object|undefined} Indicator object if found, undefined otherwise
     * 
     * @example
     * const indicator = stateManager.getIndicatorById(1);
     */
    getIndicatorById(id) {
        return this.state.indicators.find(i => i.id === id);
    }

    /**
     * Find and return an activity by its ID
     * 
     * @param {number} id - Activity ID to find
     * @returns {Object|undefined} Activity object if found, undefined otherwise
     * 
     * @example
     * const activity = stateManager.getActivityById(1);
     */
    getActivityById(id) {
        return this.state.activities.find(a => a.id === id);
    }

    /**
     * Find and return a case by its ID
     * 
     * @param {number} id - Case ID to find
     * @returns {Object|undefined} Case object if found, undefined otherwise
     * 
     * @example
     * const caseItem = stateManager.getCaseById(1);
     */
    getCaseById(id) {
        return this.state.cases.find(c => c.id === id);
    }
    
    /**
     * Set or get cached data with automatic expiration
     * 
     * @param {string} key - Cache key
     * @param {*} data - Data to cache (omit to retrieve)
     * @param {number} ttl - Time-to-live in milliseconds (optional, defaults to config)
     * @returns {*} Cached data if retrieving, undefined if expired or not found
     * 
     * @example
     * // Store data in cache
     * stateManager.cache('projects-list', projects);
     * 
     * // Retrieve from cache
     * const cached = stateManager.cache('projects-list');
     * if (cached) {
     *   // Use cached data
     * }
     */
    cacheData(key, data = undefined, ttl = null) {
        // If data provided, store in cache
        if (data !== undefined) {
            const expiresAt = Date.now() + (ttl || this.cacheConfig.ttl);
            this.cache.set(key, {
                data,
                expiresAt
            });
            return data;
        }
        
        // Otherwise, retrieve from cache
        if (!this.cacheConfig.enabled) return undefined;
        
        const cached = this.cache.get(key);
        if (!cached) return undefined;
        
        // Check if expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        
        return cached.data;
    }
    
    /**
     * Clear specific cache entry or all cache
     * 
     * @param {string} key - Cache key to clear (omit to clear all)
     * 
     * @example
     * stateManager.clearCache('projects-list'); // Clear specific
     * stateManager.clearCache(); // Clear all
     */
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * Configure cache settings
     * 
     * @param {Object} config - Cache configuration {ttl, enabled}
     * 
     * @example
     * stateManager.configureCacheCache({ ttl: 10 * 60 * 1000, enabled: true });
     */
    configureCache(config) {
        this.cacheConfig = { ...this.cacheConfig, ...config };
    }
}

// Create singleton instance
export const stateManager = new StateManager();
