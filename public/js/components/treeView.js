/**
 * Tree View Component
 * Generic hierarchical tree with expand/collapse, search, and filtering
 * 
 * @module components/treeView
 * @author AWYAD MES Team - Stream 6
 */

/**
 * Create a tree view from hierarchical data
 * @param {Array} data - Hierarchical data array
 * @param {Object} options - Configuration options
 * @returns {string} HTML string
 */
export function createTreeView(data, options = {}) {
    const defaults = {
        containerId: 'tree-view',
        childrenKey: 'children',
        labelKey: 'name',
        idKey: 'id',
        iconKey: 'icon',
        showSearch: true,
        showExpandAll: true,
        onNodeClick: null,
        nodeRenderer: null,
        depth: 0,
        expandedByDefault: false
    };
    
    const config = { ...defaults, ...options };
    
    return `
        <div class="tree-view-container" id="${config.containerId}">
            ${config.showSearch || config.showExpandAll ? `
                <div class="tree-controls mb-3">
                    ${config.showSearch ? `
                        <div class="input-group mb-2">
                            <span class="input-group-text">
                                <i class="bi bi-search"></i>
                            </span>
                            <input type="text" 
                                   class="form-control" 
                                   id="${config.containerId}-search" 
                                   placeholder="Search tree..."
                                   oninput="filterTree('${config.containerId}', this.value)">
                        </div>
                    ` : ''}
                    ${config.showExpandAll ? `
                        <div class="btn-group btn-group-sm w-100" role="group">
                            <button class="btn btn-outline-secondary" onclick="expandAllNodes('${config.containerId}')">
                                <i class="bi bi-arrows-expand"></i> Expand All
                            </button>
                            <button class="btn btn-outline-secondary" onclick="collapseAllNodes('${config.containerId}')">
                                <i class="bi bi-arrows-collapse"></i> Collapse All
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="tree-nodes">
                ${renderNodes(data, config)}
            </div>
        </div>
    `;
}

/**
 * Render tree nodes recursively
 * @private
 */
function renderNodes(nodes, config, depth = 0) {
    if (!nodes || nodes.length === 0) {
        return depth === 0 ? '<div class="alert alert-info">No data to display</div>' : '';
    }
    
    return nodes.map(node => {
        const hasChildren = node[config.childrenKey] && node[config.childrenKey].length > 0;
        const nodeId = node[config.idKey];
        const label = node[config.labelKey];
        const icon = node[config.iconKey] || (hasChildren ? 'bi-folder' : 'bi-file-earmark');
        const indentStyle = `padding-left: ${depth * 24}px`;
        const collapseClass = config.expandedByDefault ? 'show' : '';
        const iconClass = hasChildren ? (config.expandedByDefault ? 'bi-caret-down-fill' : 'bi-caret-right-fill') : '';
        
        // Custom renderer if provided
        const nodeContent = config.nodeRenderer 
            ? config.nodeRenderer(node, depth) 
            : label;
        
        return `
            <div class="tree-node" data-node-id="${nodeId}" data-depth="${depth}">
                <div class="tree-node-content" style="${indentStyle}">
                    ${hasChildren ? `
                        <i class="bi ${iconClass} node-toggle me-2" 
                           id="toggle-${nodeId}"
                           onclick="toggleTreeNode('${config.containerId}', '${nodeId}')"
                           style="cursor: pointer;"></i>
                    ` : '<span class="node-spacer me-3"></span>'}
                    <i class="bi ${icon} me-2"></i>
                    <span class="node-label" 
                          onclick="${config.onNodeClick ? `handleNodeClick('${nodeId}')` : ''}"
                          ${config.onNodeClick ? 'style="cursor: pointer;"' : ''}>
                        ${nodeContent}
                    </span>
                    ${node.badge ? `
                        <span class="badge bg-secondary ms-2">${node.badge}</span>
                    ` : ''}
                </div>
                ${hasChildren ? `
                    <div class="tree-children collapse ${collapseClass}" id="children-${nodeId}">
                        ${renderNodes(node[config.childrenKey], config, depth + 1)}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Toggle tree node expansion
 */
window.toggleTreeNode = function(containerId, nodeId) {
    const childrenDiv = document.getElementById(`children-${nodeId}`);
    const toggleIcon = document.getElementById(`toggle-${nodeId}`);
    
    if (childrenDiv && toggleIcon) {
        const bsCollapse = new bootstrap.Collapse(childrenDiv, { toggle: true });
        
        setTimeout(() => {
            if (childrenDiv.classList.contains('show')) {
                toggleIcon.className = 'bi bi-caret-down-fill node-toggle me-2';
            } else {
                toggleIcon.className = 'bi bi-caret-right-fill node-toggle me-2';
            }
        }, 50);
    }
};

/**
 * Expand all nodes in tree
 */
window.expandAllNodes = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const allCollapses = container.querySelectorAll('.tree-children');
    allCollapses.forEach(collapse => {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse);
        bsCollapse.show();
    });
    
    // Update all icons
    const allIcons = container.querySelectorAll('.node-toggle');
    allIcons.forEach(icon => {
        icon.className = 'bi bi-caret-down-fill node-toggle me-2';
    });
};

/**
 * Collapse all nodes in tree
 */
window.collapseAllNodes = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const allCollapses = container.querySelectorAll('.tree-children');
    allCollapses.forEach(collapse => {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapse);
        bsCollapse.hide();
    });
    
    // Update all icons
    const allIcons = container.querySelectorAll('.node-toggle');
    allIcons.forEach(icon => {
        icon.className = 'bi bi-caret-right-fill node-toggle me-2';
    });
};

/**
 * Filter tree nodes by search query
 */
window.filterTree = function(containerId, query) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
        // Show all nodes
        container.querySelectorAll('.tree-node').forEach(node => {
            node.style.display = '';
        });
        return;
    }
    
    // Filter nodes
    const allNodes = container.querySelectorAll('.tree-node');
    allNodes.forEach(node => {
        const label = node.querySelector('.node-label')?.textContent.toLowerCase() || '';
        const matches = label.includes(normalizedQuery);
        
        if (matches) {
            node.style.display = '';
            // Show all parents
            let parent = node.parentElement;
            while (parent && parent.classList.contains('tree-children')) {
                parent.style.display = '';
                const parentNode = parent.closest('.tree-node');
                if (parentNode) {
                    parentNode.style.display = '';
                    // Expand parent
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(parent);
                    bsCollapse.show();
                }
                parent = parentNode?.parentElement;
            }
        } else {
            node.style.display = 'none';
        }
    });
};

/**
 * Handle node click (if callback provided)
 */
window.handleNodeClick = function(nodeId) {
    // This will be overridden when tree is created with onNodeClick callback
    console.log('Node clicked:', nodeId);
};
