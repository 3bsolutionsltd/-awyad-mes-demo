/**
 * Application State Management
 * Simple centralized state management with observer pattern
 */

class AppState {
  constructor() {
    this.state = {
      currentPage: 'dashboard',
      data: {
        thematicAreas: [],
        projects: [],
        indicators: [],
        activities: [],
        cases: [],
      },
      dashboardStats: null,
      loading: false,
      error: null,
    };

    this.observers = [];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  /**
   * Notify all observers of state change
   */
  notify() {
    this.observers.forEach(observer => observer(this.state));
  }

  /**
   * Update state
   */
  setState(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.notify();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set current page
   */
  setCurrentPage(page) {
    this.setState({ currentPage: page });
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.setState({ loading });
  }

  /**
   * Set error state
   */
  setError(error) {
    this.setState({ error });
  }

  /**
   * Clear error
   */
  clearError() {
    this.setState({ error: null });
  }

  /**
   * Update data
   */
  setData(dataKey, data) {
    this.setState({
      data: {
        ...this.state.data,
        [dataKey]: data,
      },
    });
  }

  /**
   * Set dashboard stats
   */
  setDashboardStats(stats) {
    this.setState({ dashboardStats: stats });
  }
}

// Create singleton instance
const appState = new AppState();

export default appState;
