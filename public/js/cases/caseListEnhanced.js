/**
 * Enhanced Case List
 * 
 * CRITICAL: NO NAME COLUMN for confidentiality
 * Features: Advanced filtering, export without names
 */

class CaseListEnhanced {
  constructor(apiService) {
    this.apiService = apiService;
    this.cases = [];
    this.filters = {};
    this.pagination = { page: 1, limit: 50, total: 0 };
    this.caseTypes = [];
    this.categories = [];
    this.projects = [];
  }

  /**
   * Initialize list
   */
  async initialize() {
    await this.loadFilterData();
    await this.loadCases();
    this.render();
    this.setupEventListeners();
  }

  /**
   * Load data for filters
   */
  async loadFilterData() {
    try {
      const [typesRes, projectsRes] = await Promise.all([
        this.apiService.get('/cases/types/active'),
        this.apiService.get('/projects')
      ]);

      this.caseTypes = typesRes.data;
      this.projects = projectsRes.data?.projects || projectsRes.data || [];
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  }

  /**
   * Load cases with filters
   */
  async loadCases() {
    try {
      const params = new URLSearchParams({
        page: this.pagination.page,
        limit: this.pagination.limit,
        ...this.filters
      });

      const response = await this.apiService.get(`/cases?${params}`);
      this.cases = response.data.cases;
      this.pagination = response.data.pagination;
    } catch (error) {
      console.error('Failed to load cases:', error);
      this.showError('Failed to load cases');
    }
  }

  /**
   * Render case list (NO NAME COLUMN)
   */
  render() {
    const container = document.getElementById('caseListContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="case-list-enhanced">
        <!-- Header -->
        <div class="list-header">
          <h2>Cases (Confidential)</h2>
          <div class="header-actions">
            <button class="btn btn-primary" onclick="window.location.href='/case-form.html'">
              <i class="icon-plus"></i> New Case
            </button>
            <button class="btn btn-secondary" onclick="window.caseList.toggleFilters()">
              <i class="icon-filter"></i> Filters
              ${Object.keys(this.filters).length > 0 ? `<span class="badge">${Object.keys(this.filters).length}</span>` : ''}
            </button>
            <button class="btn btn-secondary" onclick="window.caseList.exportCases()">
              <i class="icon-download"></i> Export
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div id="filtersPanel" class="filters-panel" style="display: none;">
          ${this.renderFilters()}
        </div>

        <!-- Active Filters Display -->
        ${Object.keys(this.filters).length > 0 ? this.renderActiveFilters() : ''}

        <!-- Cases Table (NO NAME COLUMN) -->
        <div class="table-container">
          <table class="cases-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Type</th>
                <th>Category</th>
                <th>Date Reported</th>
                <th>Status</th>
                <th>Location</th>
                <th>Demographics</th>
                <th>Case Worker</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.cases.length > 0 ? this.renderCaseRows() : this.renderNoResults()}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        ${this.renderPagination()}
      </div>
    `;
  }

  /**
   * Render filters panel
   */
  renderFilters() {
    return `
      <div class="filters-content">
        <h3>Advanced Filters</h3>
        
        <div class="filter-grid">
          <!-- Project -->
          <div class="filter-group">
            <label>Project</label>
            <select id="filterProject" multiple size="3">
              ${this.projects.map(p => `
                <option value="${p.id}">${p.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Case Type -->
          <div class="filter-group">
            <label>Case Type</label>
            <select id="filterCaseType">
              <option value="">All Types</option>
              ${this.caseTypes.map(t => `
                <option value="${t.id}">${t.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Status -->
          <div class="filter-group">
            <label>Status</label>
            <select id="filterStatus">
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <!-- Location -->
          <div class="filter-group">
            <label>Location</label>
            <input type="text" id="filterLocation" placeholder="Search location...">
          </div>

          <!-- Age Group -->
          <div class="filter-group">
            <label>Age Group</label>
            <select id="filterAgeGroup">
              <option value="">All Ages</option>
              <option value="0-4">0-4 years</option>
              <option value="5-17">5-17 years</option>
              <option value="18-49">18-49 years</option>
              <option value="50+">50+ years</option>
            </select>
          </div>

          <!-- Gender -->
          <div class="filter-group">
            <label>Gender</label>
            <select id="filterGender">
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Disability -->
          <div class="filter-group">
            <label>Disability Status</label>
            <select id="filterDisability">
              <option value="">All</option>
              <option value="true">With Disability</option>
              <option value="false">Without Disability</option>
            </select>
          </div>

          <!-- Date Range -->
          <div class="filter-group">
            <label>Date From</label>
            <input type="date" id="filterDateFrom">
          </div>

          <div class="filter-group">
            <label>Date To</label>
            <input type="date" id="filterDateTo">
          </div>

          <!-- Referral -->
          <div class="filter-group">
            <label>Referred From</label>
            <input type="text" id="filterReferredFrom" placeholder="Partner name...">
          </div>

          <div class="filter-group">
            <label>Referred To</label>
            <input type="text" id="filterReferredTo" placeholder="Partner name...">
          </div>
        </div>

        <div class="filter-actions">
          <button class="btn btn-primary" onclick="window.caseList.applyFilters()">
            Apply Filters
          </button>
          <button class="btn btn-secondary" onclick="window.caseList.clearFilters()">
            Clear All
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render active filters
   */
  renderActiveFilters() {
    const filterLabels = {
      status: 'Status',
      case_type_id: 'Type',
      location: 'Location',
      age_group: 'Age',
      gender: 'Gender',
      has_disability: 'Disability',
      date_from: 'From',
      date_to: 'To',
      referred_from: 'Referred From',
      referred_to: 'Referred To'
    };

    return `
      <div class="active-filters">
        <strong>Active Filters:</strong>
        ${Object.entries(this.filters).map(([key, value]) => `
          <span class="filter-badge">
            ${filterLabels[key] || key}: ${value}
            <button onclick="window.caseList.removeFilter('${key}')" class="remove-filter">×</button>
          </span>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render case rows (NO NAME)
   */
  renderCaseRows() {
    return this.cases.map(caseItem => `
      <tr>
        <td>
          <a href="/case-view.html?id=${caseItem.id}" class="case-number-link">
            ${caseItem.case_number}
          </a>
        </td>
        <td>${caseItem.case_type_name || '-'}</td>
        <td>${caseItem.case_category_name || '-'}</td>
        <td>${this.formatDate(caseItem.date_reported)}</td>
        <td>${this.getStatusBadge(caseItem.status)}</td>
        <td>${caseItem.location || '-'}</td>
        <td>${this.formatDemographics(caseItem)}</td>
        <td>${caseItem.case_worker || '-'}</td>
        <td class="actions-cell">
          <button class="btn-icon" onclick="window.caseList.viewCase('${caseItem.id}')" title="View">
            <i class="icon-eye"></i>
          </button>
          <button class="btn-icon" onclick="window.caseList.editCase('${caseItem.id}')" title="Edit">
            <i class="icon-edit"></i>
          </button>
          <button class="btn-icon btn-danger" onclick="window.caseList.deleteCase('${caseItem.id}')" title="Delete">
            <i class="icon-delete"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Render no results
   */
  renderNoResults() {
    return `
      <tr>
        <td colspan="9" class="no-results">
          <p>No cases found</p>
          ${Object.keys(this.filters).length > 0 ? '<p>Try adjusting your filters</p>' : ''}
        </td>
      </tr>
    `;
  }

  /**
   * Render pagination
   */
  renderPagination() {
    if (this.pagination.totalPages <= 1) return '';

    const pages = [];
    const currentPage = this.pagination.page;
    const totalPages = this.pagination.totalPages;

    // Previous button
    pages.push(`
      <button class="page-btn" 
        ${currentPage === 1 ? 'disabled' : ''} 
        onclick="window.caseList.goToPage(${currentPage - 1})">
        « Previous
      </button>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(`
          <button class="page-btn ${i === currentPage ? 'active' : ''}" 
            onclick="window.caseList.goToPage(${i})">
            ${i}
          </button>
        `);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages.push('<span class="page-ellipsis">...</span>');
      }
    }

    // Next button
    pages.push(`
      <button class="page-btn" 
        ${currentPage === totalPages ? 'disabled' : ''} 
        onclick="window.caseList.goToPage(${currentPage + 1})">
        Next »
      </button>
    `);

    return `
      <div class="pagination">
        <div class="pagination-info">
          Showing ${(currentPage - 1) * this.pagination.limit + 1} to 
          ${Math.min(currentPage * this.pagination.limit, this.pagination.total)} of 
          ${this.pagination.total} cases
        </div>
        <div class="pagination-controls">
          ${pages.join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format demographics (age/gender only, NO NAMES)
   */
  formatDemographics(caseItem) {
    const parts = [];
    if (caseItem.age_group) parts.push(caseItem.age_group);
    if (caseItem.gender) parts.push(caseItem.gender);
    if (caseItem.has_disability) parts.push('PWD');
    return parts.length > 0 ? parts.join(', ') : '-';
  }

  /**
   * Get status badge with color
   */
  getStatusBadge(status) {
    const badges = {
      'Open': '<span class="badge badge-blue">Open</span>',
      'In Progress': '<span class="badge badge-yellow">In Progress</span>',
      'Closed': '<span class="badge badge-green">Closed</span>'
    };
    return badges[status] || status;
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Case type change - load categories
    document.body.addEventListener('change', async (e) => {
      if (e.target.id === 'filterCaseType') {
        const categoryContainer = document.getElementById('filterCategoryContainer');
        if (e.target.value && categoryContainer) {
          await this.loadCategoriesForFilter(e.target.value);
        }
      }
    });
  }

  /**
   * Toggle filters panel
   */
  toggleFilters() {
    const panel = document.getElementById('filtersPanel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * Apply filters
   */
  async applyFilters() {
    this.filters = {};

    const filterFields = {
      status: 'filterStatus',
      case_type_id: 'filterCaseType',
      location: 'filterLocation',
      age_group: 'filterAgeGroup',
      gender: 'filterGender',
      has_disability: 'filterDisability',
      date_from: 'filterDateFrom',
      date_to: 'filterDateTo',
      referred_from: 'filterReferredFrom',
      referred_to: 'filterReferredTo'
    };

    for (const [key, id] of Object.entries(filterFields)) {
      const el = document.getElementById(id);
      if (el && el.value) {
        this.filters[key] = el.value;
      }
    }

    this.pagination.page = 1;
    await this.loadCases();
    this.render();
    this.toggleFilters();
  }

  /**
   * Clear filters
   */
  async clearFilters() {
    this.filters = {};
    this.pagination.page = 1;
    await this.loadCases();
    this.render();
  }

  /**
   * Remove single filter
   */
  async removeFilter(key) {
    delete this.filters[key];
    this.pagination.page = 1;
    await this.loadCases();
    this.render();
  }

  /**
   * Go to page
   */
  async goToPage(page) {
    this.pagination.page = page;
    await this.loadCases();
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * View case
   */
  viewCase(id) {
    window.location.href = `/case-view.html?id=${id}`;
  }

  /**
   * Edit case
   */
  editCase(id) {
    window.location.href = `/case-form.html?id=${id}`;
  }

  /**
   * Delete case
   */
  async deleteCase(id) {
    if (!confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }

    try {
      await this.apiService.delete(`/cases/${id}`);
      this.showSuccess('Case deleted successfully');
      await this.loadCases();
      this.render();
    } catch (error) {
      console.error('Failed to delete case:', error);
      this.showError('Failed to delete case');
    }
  }

  /**
   * Export cases (NO NAMES)
   */
  async exportCases() {
    try {
      const params = new URLSearchParams(this.filters);
      const response = await this.apiService.get(`/cases/statistics/export?${params}`);
      
      // Convert to CSV (NO NAMES)
      const headers = [
        'Case Number', 'Type', 'Category', 'Date Reported', 'Status',
        'Project', 'Location', 'Age Group', 'Gender', 'Disability',
        'Case Worker'
      ];

      const csv = [
        headers.join(','),
        ...response.data.map(c => [
          c.case_number,
          c.case_type,
          c.case_category,
          this.formatDate(c.date_reported),
          c.status,
          c.project || '',
          c.location || '',
          c.age_group || '',
          c.gender || '',
          c.has_disability ? 'Yes' : 'No',
          c.case_worker || ''
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cases_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      this.showSuccess('Cases exported successfully (NO NAMES)');
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Failed to export cases');
    }
  }

  /**
   * Show error
   */
  showError(message) {
    alert('❌ ' + message);
  }

  /**
   * Show success
   */
  showSuccess(message) {
    alert('✅ ' + message);
  }
}

// Export for use
window.CaseListEnhanced = CaseListEnhanced;
