/**
 * Search and Filter Utility Module
 * 
 * Provides client-side search, filtering, and pagination functionality for all data tables.
 * Implements debounced search, date range filters, and efficient pagination.
 * 
 * @module searchFilter
 * @author AWYAD MES Team
 * @since 2.2.0
 */

/**
 * Debounce function to limit how often a function is called
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create search input component with debouncing
 * 
 * @param {string} placeholder - Search input placeholder text
 * @param {Function} onSearch - Callback function to execute on search (receives search term)
 * @param {string} id - Unique ID for the search input
 * @returns {string} HTML for search component
 */
export function createSearchInput(placeholder, onSearch, id = 'search-input') {
    // Store callback in window for access from inline handlers
    window[`searchCallback_${id}`] = debounce((value) => {
        onSearch(value.toLowerCase().trim());
    }, 300);
    
    return `
        <div class="input-group">
            <span class="input-group-text">
                <i class="bi bi-search"></i>
            </span>
            <input 
                type="text" 
                class="form-control" 
                id="${id}"
                placeholder="${placeholder}"
                oninput="window.searchCallback_${id}(this.value)"
            >
            <button 
                class="btn btn-outline-secondary" 
                type="button"
                onclick="document.getElementById('${id}').value=''; window.searchCallback_${id}('');"
                title="Clear search"
            >
                <i class="bi bi-x-circle"></i>
            </button>
        </div>
    `;
}

/**
 * Create date range filter component
 * 
 * @param {Function} onFilter - Callback function (receives {startDate, endDate})
 * @param {string} id - Unique ID prefix for date inputs
 * @returns {string} HTML for date range filter
 */
export function createDateRangeFilter(onFilter, id = 'date-filter') {
    // Store callback in window
    window[`dateFilterCallback_${id}`] = () => {
        const startDate = document.getElementById(`${id}-start`).value;
        const endDate = document.getElementById(`${id}-end`).value;
        onFilter({ startDate, endDate });
    };
    
    return `
        <div class="row g-2 align-items-center">
            <div class="col-auto">
                <label class="col-form-label"><i class="bi bi-calendar-range"></i> From:</label>
            </div>
            <div class="col-auto">
                <input 
                    type="date" 
                    class="form-control" 
                    id="${id}-start"
                    onchange="window.dateFilterCallback_${id}()"
                >
            </div>
            <div class="col-auto">
                <label class="col-form-label">To:</label>
            </div>
            <div class="col-auto">
                <input 
                    type="date" 
                    class="form-control" 
                    id="${id}-end"
                    onchange="window.dateFilterCallback_${id}()"
                >
            </div>
            <div class="col-auto">
                <button 
                    class="btn btn-outline-secondary btn-sm" 
                    type="button"
                    onclick="document.getElementById('${id}-start').value=''; document.getElementById('${id}-end').value=''; window.dateFilterCallback_${id}();"
                    title="Clear dates"
                >
                    <i class="bi bi-x-circle"></i> Clear
                </button>
            </div>
        </div>
    `;
}

/**
 * Create status filter dropdown
 * 
 * @param {Array<string>} statuses - Array of status options
 * @param {Function} onFilter - Callback function (receives selected status)
 * @param {string} id - Unique ID for select element
 * @returns {string} HTML for status filter
 */
export function createStatusFilter(statuses, onFilter, id = 'status-filter') {
    window[`statusFilterCallback_${id}`] = (value) => {
        onFilter(value);
    };
    
    return `
        <div class="input-group">
            <span class="input-group-text">
                <i class="bi bi-funnel"></i>
            </span>
            <select 
                class="form-select" 
                id="${id}"
                onchange="window.statusFilterCallback_${id}(this.value)"
            >
                <option value="">All Statuses</option>
                ${statuses.map(status => `<option value="${status}">${status}</option>`).join('')}
            </select>
        </div>
    `;
}

/**
 * Filter data by search term (searches across multiple fields)
 * 
 * @param {Array<Object>} data - Array of data objects
 * @param {string} searchTerm - Search term (case-insensitive)
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Array<Object>} Filtered data
 */
export function filterBySearch(data, searchTerm, searchFields) {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
        return searchFields.some(field => {
            const value = getNestedValue(item, field);
            return value && String(value).toLowerCase().includes(term);
        });
    });
}

/**
 * Filter data by date range
 * 
 * @param {Array<Object>} data - Array of data objects
 * @param {string} dateField - Field name containing date
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array<Object>} Filtered data
 */
export function filterByDateRange(data, dateField, startDate, endDate) {
    if (!startDate && !endDate) return data;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return data.filter(item => {
        const itemDate = new Date(getNestedValue(item, dateField));
        if (isNaN(itemDate)) return false;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
    });
}

/**
 * Filter data by status
 * 
 * @param {Array<Object>} data - Array of data objects
 * @param {string} statusField - Field name containing status
 * @param {string} status - Status value to filter by
 * @returns {Array<Object>} Filtered data
 */
export function filterByStatus(data, statusField, status) {
    if (!status) return data;
    
    return data.filter(item => {
        const itemStatus = getNestedValue(item, statusField);
        return itemStatus && String(itemStatus).toLowerCase() === status.toLowerCase();
    });
}

/**
 * Get nested object value by dot notation path
 * 
 * @private
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {*} Value at path or undefined
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Paginate data array
 * 
 * @param {Array<Object>} data - Full data array
 * @param {number} page - Current page (1-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Object} Pagination result {data, page, totalPages, totalItems, hasNext, hasPrev}
 */
export function paginate(data, page = 1, pageSize = 50) {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    return {
        data: data.slice(startIndex, endIndex),
        page: currentPage,
        pageSize,
        totalPages,
        totalItems,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        startIndex: startIndex + 1,
        endIndex
    };
}

/**
 * Create pagination controls UI
 * 
 * @param {Object} paginationInfo - Result from paginate() function
 * @param {Function} onPageChange - Callback function (receives new page number)
 * @param {string} id - Unique ID for pagination controls
 * @returns {string} HTML for pagination controls
 */
export function createPaginationControls(paginationInfo, onPageChange, id = 'pagination') {
    const { page, totalPages, totalItems, hasNext, hasPrev, startIndex, endIndex } = paginationInfo;
    
    if (totalPages <= 1) return ''; // No pagination needed
    
    // Store callback
    window[`paginationCallback_${id}`] = onPageChange;
    
    // Generate page buttons (show current +/- 2 pages)
    const pageButtons = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const active = i === page ? 'active' : '';
        pageButtons.push(`
            <li class="page-item ${active}">
                <button class="page-link" onclick="window.paginationCallback_${id}(${i})">${i}</button>
            </li>
        `);
    }
    
    return `
        <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted">
                Showing ${startIndex} to ${endIndex} of ${totalItems} items
            </div>
            <nav aria-label="Page navigation">
                <ul class="pagination mb-0">
                    <li class="page-item ${!hasPrev ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.paginationCallback_${id}(1)" ${!hasPrev ? 'disabled' : ''}>
                            <i class="bi bi-chevron-double-left"></i>
                        </button>
                    </li>
                    <li class="page-item ${!hasPrev ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.paginationCallback_${id}(${page - 1})" ${!hasPrev ? 'disabled' : ''}>
                            <i class="bi bi-chevron-left"></i>
                        </button>
                    </li>
                    ${startPage > 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
                    ${pageButtons.join('')}
                    ${endPage < totalPages ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
                    <li class="page-item ${!hasNext ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.paginationCallback_${id}(${page + 1})" ${!hasNext ? 'disabled' : ''}>
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </li>
                    <li class="page-item ${!hasNext ? 'disabled' : ''}">
                        <button class="page-link" onclick="window.paginationCallback_${id}(${totalPages})" ${!hasNext ? 'disabled' : ''}>
                            <i class="bi bi-chevron-double-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

/**
 * Apply all filters and pagination to data
 * 
 * @param {Array<Object>} data - Full data array
 * @param {Object} filters - Filter options {search, dateRange, status, etc.}
 * @param {Object} config - Configuration {searchFields, dateField, statusField}
 * @param {number} page - Current page
 * @param {number} pageSize - Items per page
 * @returns {Object} {paginatedData, paginationInfo, filteredCount}
 */
export function applyFiltersAndPagination(data, filters, config, page = 1, pageSize = 50) {
    let filtered = data;
    
    // Apply search filter
    if (filters.search && config.searchFields) {
        filtered = filterBySearch(filtered, filters.search, config.searchFields);
    }
    
    // Apply date range filter
    if ((filters.startDate || filters.endDate) && config.dateField) {
        filtered = filterByDateRange(filtered, config.dateField, filters.startDate, filters.endDate);
    }
    
    // Apply status filter
    if (filters.status && config.statusField) {
        filtered = filterByStatus(filtered, config.statusField, filters.status);
    }
    
    const filteredCount = filtered.length;
    const paginationInfo = paginate(filtered, page, pageSize);
    
    return {
        paginatedData: paginationInfo.data,
        paginationInfo,
        filteredCount
    };
}

/**
 * Create filter toolbar with search, date range, and status filters
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onSearch - Search callback
 * @param {Function} options.onDateFilter - Date filter callback
 * @param {Function} options.onStatusFilter - Status filter callback
 * @param {Array<string>} options.statuses - Available statuses
 * @param {string} options.searchPlaceholder - Search input placeholder
 * @param {string} options.id - Unique ID prefix
 * @returns {string} HTML for filter toolbar
 */
export function createFilterToolbar(options) {
    const {
        onSearch,
        onDateFilter,
        onStatusFilter,
        statuses = [],
        searchPlaceholder = 'Search...',
        id = 'filter'
    } = options;
    
    const searchHtml = onSearch ? createSearchInput(searchPlaceholder, onSearch, `${id}-search`) : '';
    const dateHtml = onDateFilter ? createDateRangeFilter(onDateFilter, `${id}-date`) : '';
    const statusHtml = onStatusFilter && statuses.length > 0 ? createStatusFilter(statuses, onStatusFilter, `${id}-status`) : '';
    
    return `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    ${searchHtml ? `<div class="col-md-4">${searchHtml}</div>` : ''}
                    ${dateHtml ? `<div class="col-md-5">${dateHtml}</div>` : ''}
                    ${statusHtml ? `<div class="col-md-3">${statusHtml}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}
