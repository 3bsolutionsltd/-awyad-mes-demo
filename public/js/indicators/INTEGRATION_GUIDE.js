/**
 * Indicator System Integration Guide
 * 
 * This file provides instructions for integrating the enhanced indicator system
 * into the main AWYAD MES application.
 */

// ============================================================================
// STEP 1: Import the New Modules
// ============================================================================

// Add these imports to your main app.js or indicators module
import { renderIndicatorList } from './indicators/indicatorListEnhanced.js';
import { showCreateIndicatorModal, showEditIndicatorModal } from './indicators/indicatorFormEnhanced.js';
import { showIndicatorMappingModal } from './indicators/indicatorMapping.js';
import * as indicatorUtils from './utils/indicatorUtils.js';

// ============================================================================
// STEP 2: Replace Old Indicator Functions with New Ones
// ============================================================================

// Replace the old renderIndicators function with this:
export async function renderIndicators(contentArea) {
    // Use the enhanced list component
    await renderIndicatorList(contentArea);
}

// Replace window.createIndicator with enhanced version:
window.createIndicator = () => {
    showCreateIndicatorModal(() => {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            renderIndicatorList(contentArea);
        }
    });
};

// Add new global functions for easy access:
window.showIndicatorMappingModal = showIndicatorMappingModal;
window.showEditIndicatorModal = showEditIndicatorModal;
window.renderIndicatorList = renderIndicatorList;

// ============================================================================
// STEP 3: Update Navigation Handler
// ============================================================================

// In your navigation setup, ensure indicators route uses the new function:
function setupNavigation() {
    // ... other routes ...
    
    if (page === 'indicators') {
        const contentArea = document.getElementById('content-area');
        await renderIndicatorList(contentArea);
    }
    
    // ... other routes ...
}

// ============================================================================
// STEP 4: Update app.js Main Rendering Logic
// ============================================================================

// Find your main rendering function (usually in app.js) and update:

async function renderPage(page) {
    const contentArea = document.getElementById('content-area');
    
    switch (page) {
        case 'dashboard':
            await renderDashboard(contentArea);
            break;
        
        case 'indicators':
            // NEW: Use enhanced indicator list
            await renderIndicatorList(contentArea);
            break;
        
        case 'projects':
            await renderProjects(contentArea);
            break;
        
        // ... other cases ...
        
        default:
            contentArea.innerHTML = '<h2>Page Not Found</h2>';
    }
}

// ============================================================================
// STEP 5: Optional - Add to Project Dashboard
// ============================================================================

// To show project-specific indicators on a project detail page:
export async function renderProjectDashboard(projectId, contentArea) {
    // ... existing project dashboard code ...
    
    // Add section for project indicators
    const indicatorSection = document.createElement('div');
    indicatorSection.className = 'mt-4';
    indicatorSection.innerHTML = '<h4>Project Indicators</h4>';
    
    const indicatorContainer = document.createElement('div');
    indicatorSection.appendChild(indicatorContainer);
    contentArea.appendChild(indicatorSection);
    
    // Render filtered indicator list for this project
    await renderIndicatorList(indicatorContainer, {
        indicator_scope: 'project',
        project_id: projectId
    });
}

// ============================================================================
// STEP 6: Optional - Add to Strategic Dashboard
// ============================================================================

// To show AWYAD indicators on the strategic dashboard:
export async function renderStrategicDashboard(contentArea) {
    // ... existing strategic dashboard code ...
    
    // Add section for AWYAD indicators
    const awyadSection = document.createElement('div');
    awyadSection.className = 'mt-4';
    awyadSection.innerHTML = '<h4>AWYAD Strategic Indicators</h4>';
    
    const awyadContainer = document.createElement('div');
    awyadSection.appendChild(awyadContainer);
    contentArea.appendChild(awyadSection);
    
    // Render filtered indicator list for AWYAD indicators only
    await renderIndicatorList(awyadContainer, {
        indicator_scope: 'awyad'
    });
}

// ============================================================================
// STEP 7: Optional - Add Dashboard Summary Cards
// ============================================================================

// Add indicator summary cards to main dashboard:
export async function addIndicatorSummaryCards() {
    try {
        const response = await apiService.get('/indicators?limit=1000');
        const indicators = response.data?.indicators || response.data || [];
        
        const awyadCount = indicators.filter(i => i.indicator_scope === 'awyad').length;
        const projectCount = indicators.filter(i => i.indicator_scope === 'project').length;
        const onTrack = indicators.filter(i => {
            const pct = i.annual_target > 0 ? (i.achieved / i.annual_target) * 100 : 0;
            return pct >= 70;
        }).length;
        
        const summaryHTML = `
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">AWYAD Indicators</h5>
                            <h2>${awyadCount}</h2>
                            <p class="mb-0">Strategic indicators</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">Project Indicators</h5>
                            <h2>${projectCount}</h2>
                            <p class="mb-0">Project-specific indicators</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">On Track</h5>
                            <h2>${onTrack}</h2>
                            <p class="mb-0">Indicators ≥70% achieved</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return summaryHTML;
    } catch (error) {
        console.error('Error loading indicator summary:', error);
        return '';
    }
}

// ============================================================================
// STEP 8: Testing the Integration
// ============================================================================

// After integration, test these scenarios:

async function testIndicatorSystem() {
    console.log('Testing Indicator System...');
    
    // Test 1: Create AWYAD Indicator
    console.log('Test 1: Creating AWYAD indicator...');
    showCreateIndicatorModal(() => {
        console.log('✓ AWYAD indicator created');
    });
    
    // Test 2: Create Project Indicator
    console.log('Test 2: Creating project indicator...');
    showCreateIndicatorModal(() => {
        console.log('✓ Project indicator created');
    });
    
    // Test 3: List all indicators
    console.log('Test 3: Listing all indicators...');
    const container = document.getElementById('test-container');
    await renderIndicatorList(container);
    console.log('✓ Indicator list rendered');
    
    // Test 4: List AWYAD indicators only
    console.log('Test 4: Listing AWYAD indicators...');
    await renderIndicatorList(container, { indicator_scope: 'awyad' });
    console.log('✓ AWYAD indicators filtered');
    
    // Test 5: Open mapping interface (requires an AWYAD indicator ID)
    console.log('Test 5: Opening mapping interface...');
    // showIndicatorMappingModal('awyad-indicator-id', () => {
    //     console.log('✓ Mapping interface works');
    // });
    
    console.log('All tests completed!');
}

// ============================================================================
// STEP 9: Error Handling
// ============================================================================

// Add global error handler for indicator operations:
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('indicator')) {
        console.error('Indicator system error:', event.error);
        // Show user-friendly error message
        const notificationEl = document.getElementById('notification-area');
        if (notificationEl) {
            notificationEl.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show">
                    <strong>Error:</strong> ${event.error.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        }
    }
});

// ============================================================================
// STEP 10: Documentation
// ============================================================================

/**
 * USAGE EXAMPLES
 * 
 * 1. Show all indicators:
 *    const container = document.getElementById('content-area');
 *    renderIndicatorList(container);
 * 
 * 2. Show AWYAD indicators only:
 *    renderIndicatorList(container, { indicator_scope: 'awyad' });
 * 
 * 3. Show project indicators for a specific project:
 *    renderIndicatorList(container, { 
 *        indicator_scope: 'project',
 *        project_id: 'project-uuid-here'
 *    });
 * 
 * 4. Create new indicator:
 *    showCreateIndicatorModal(() => {
 *        console.log('Indicator created!');
 *        renderIndicatorList(container);
 *    });
 * 
 * 5. Edit indicator:
 *    showEditIndicatorModal('indicator-id', () => {
 *        console.log('Indicator updated!');
 *        renderIndicatorList(container);
 *    });
 * 
 * 6. Manage mappings for AWYAD indicator:
 *    showIndicatorMappingModal('awyad-indicator-id', () => {
 *        console.log('Mappings updated!');
 *        renderIndicatorList(container);
 *    });
 * 
 * 7. Filter by multiple criteria:
 *    renderIndicatorList(container, {
 *        indicator_scope: 'project',
 *        indicator_level: 'Output',
 *        project_id: 'project-uuid'
 *    });
 */

export default {
    renderIndicators,
    renderIndicatorList,
    showCreateIndicatorModal,
    showEditIndicatorModal,
    showIndicatorMappingModal,
    testIndicatorSystem
};
