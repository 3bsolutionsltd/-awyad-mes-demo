/**
 * Enhanced Case Form
 * 
 * CRITICAL: NO NAME FIELD for confidentiality
 * Features: Case types/categories, referral tracking, dynamic tagging
 */

class CaseFormEnhanced {
  constructor(apiService) {
    this.apiService = apiService;
    this.caseTypes = [];
    this.categories = [];
    this.projects = [];
    this.currentCase = null;
  }

  /**
   * Initialize form
   */
  async initialize() {
    await this.loadDropdownData();
    this.setupEventListeners();
  }

  /**
   * Load data for dropdowns
   */
  async loadDropdownData() {
    try {
      const [typesRes, projectsRes] = await Promise.all([
        this.apiService.get('/cases/types/active'),
        this.apiService.get('/projects')
      ]);

      this.caseTypes = typesRes.data;
      this.projects = projectsRes.data?.projects || projectsRes.data || [];
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
      this.showError('Failed to load form data');
    }
  }

  /**
   * Render case form (NO NAME FIELD)
   */
  renderForm(caseData = null) {
    this.currentCase = caseData;
    
    const isEdit = !!caseData;
    const formTitle = isEdit ? 'Edit Case' : 'New Case';

    return `
      <div class="case-form-container">
        <h2>${formTitle}</h2>
        <p class="confidentiality-notice">
          <strong>⚠️ CONFIDENTIAL:</strong> No names are collected for case confidentiality.
        </p>

        <form id="caseForm" class="case-form">
          
          <!-- A. Case Information -->
          <div class="form-section">
            <h3>Case Information</h3>
            
            ${isEdit ? `
              <div class="form-group">
                <label>Case Number</label>
                <input type="text" value="${caseData.case_number}" readonly class="readonly-field">
              </div>
            ` : ''}

            <div class="form-row">
              <div class="form-group">
                <label>Status <span class="required">*</span></label>
                <select name="status" required>
                  <option value="Open" ${!isEdit || caseData.status === 'Open' ? 'selected' : ''}>Open</option>
                  <option value="In Progress" ${caseData?.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Closed" ${caseData?.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
              </div>

              <div class="form-group">
                <label>Date Reported <span class="required">*</span></label>
                <input type="date" name="date_reported" 
                  value="${caseData?.date_reported ? new Date(caseData.date_reported).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}" 
                  required>
              </div>
            </div>
          </div>

          <!-- B. Case Classification -->
          <div class="form-section">
            <h3>Case Classification</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Case Type <span class="required">*</span></label>
                <select name="case_type_id" id="caseTypeSelect" required>
                  <option value="">-- Select Case Type --</option>
                  ${this.caseTypes.map(type => `
                    <option value="${type.id}" ${caseData?.case_type_id === type.id ? 'selected' : ''}>
                      ${type.name}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Case Category <span class="required">*</span></label>
                <select name="case_category_id" id="caseCategorySelect" required ${!caseData ? 'disabled' : ''}>
                  <option value="">-- Select Type First --</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Tags</label>
              <div id="tagsContainer" class="tags-container">
                <input type="text" id="tagInput" placeholder="Type tag and press Enter">
                <div id="tagsList" class="tags-list">
                  ${(caseData?.tracking_tags || []).map(tag => `
                    <span class="tag">
                      ${tag}
                      <button type="button" class="remove-tag" data-tag="${tag}">×</button>
                    </span>
                  `).join('')}
                </div>
              </div>
              <div id="suggestedTags" class="suggested-tags"></div>
            </div>
          </div>

          <!-- C. Demographics (NO NAME) -->
          <div class="form-section">
            <h3>Demographics</h3>
            <p class="info-text">🔒 No names collected for confidentiality</p>
            
            <div class="form-row">
              <div class="form-group">
                <label>Age Group <span class="required">*</span></label>
                <select name="age_group" required>
                  <option value="">-- Select Age Group --</option>
                  <option value="0-4" ${caseData?.age_group === '0-4' ? 'selected' : ''}>0-4 years</option>
                  <option value="5-17" ${caseData?.age_group === '5-17' ? 'selected' : ''}>5-17 years</option>
                  <option value="18-49" ${caseData?.age_group === '18-49' ? 'selected' : ''}>18-49 years</option>
                  <option value="50+" ${caseData?.age_group === '50+' ? 'selected' : ''}>50+ years</option>
                </select>
              </div>

              <div class="form-group">
                <label>Gender <span class="required">*</span></label>
                <select name="gender" required>
                  <option value="">-- Select Gender --</option>
                  <option value="Male" ${caseData?.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option value="Female" ${caseData?.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option value="Other" ${caseData?.gender === 'Other' ? 'selected' : ''}>Other</option>
                  <option value="Prefer not to say" ${caseData?.gender === 'Prefer not to say' ? 'selected' : ''}>Prefer not to say</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Nationality</label>
              <input type="text" name="nationality" 
                value="${caseData?.nationality || ''}" 
                placeholder="e.g., Sudanese Refugee, Host Community, etc.">
            </div>

            <div class="form-group">
              <label>Disability Status</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" name="has_disability" value="false" 
                    ${!caseData || !caseData.has_disability ? 'checked' : ''}> No
                </label>
                <label class="radio-label">
                  <input type="radio" name="has_disability" value="true" 
                    ${caseData?.has_disability ? 'checked' : ''}> Yes
                </label>
              </div>
            </div>

            <div class="form-group" id="disabilityDetailsGroup" style="display: ${caseData?.has_disability ? 'block' : 'none'}">
              <label>Disability Details</label>
              <textarea name="disability_status" rows="3" 
                placeholder="Describe the type of disability...">${caseData?.disability_status || ''}</textarea>
            </div>
          </div>

          <!-- D. Location -->
          <div class="form-section">
            <h3>Location</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Project</label>
                <select name="project_id">
                  <option value="">-- Select Project --</option>
                  ${this.projects.map(project => `
                    <option value="${project.id}" ${caseData?.project_id === project.id ? 'selected' : ''}>
                      ${project.name}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label>Location</label>
                <input type="text" name="location" 
                  value="${caseData?.location || ''}" 
                  placeholder="e.g., Adjumani, Kampala, etc.">
              </div>
            </div>
          </div>

          <!-- E. Referral Information -->
          <div class="form-section">
            <h3>Referral Information</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Referred From</label>
                <input type="text" name="referred_from" 
                  value="${caseData?.referred_from || ''}" 
                  placeholder="Organization/partner who referred this case">
              </div>

              <div class="form-group">
                <label>Referred To</label>
                <input type="text" name="referred_to" 
                  value="${caseData?.referred_to || ''}" 
                  placeholder="Organization/partner we referred to">
              </div>
            </div>

            <div class="form-group">
              <label>Referral Date</label>
              <input type="date" name="referral_date" 
                value="${caseData?.referral_date ? new Date(caseData.referral_date).toISOString().split('T')[0] : ''}">
            </div>
          </div>

          <!-- F. Service Information -->
          <div class="form-section">
            <h3>Service Information</h3>
            
            <div class="form-group">
              <label>Support Offered <span class="required">*</span></label>
              <textarea name="support_offered" rows="6" required 
                minlength="50"
                placeholder="Describe the support/services offered to this case... (minimum 50 characters)">${caseData?.support_offered || ''}</textarea>
              <div class="char-count">
                <span id="supportCharCount">0</span> / 50 minimum
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Case Worker</label>
                <input type="text" name="case_worker" 
                  value="${caseData?.case_worker || ''}" 
                  placeholder="Assigned case worker">
              </div>

              <div class="form-group">
                <label>Follow-up Date</label>
                <input type="date" name="follow_up_date" 
                  value="${caseData?.follow_up_date ? new Date(caseData.follow_up_date).toISOString().split('T')[0] : ''}">
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Update Case' : 'Create Case'}
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.history.back()">
              Cancel
            </button>
          </div>

        </form>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Case type change - load categories
    document.body.addEventListener('change', async (e) => {
      if (e.target.id === 'caseTypeSelect') {
        await this.loadCategories(e.target.value);
        await this.loadSuggestedTags(e.target.value);
      }
    });

    // Category change - update suggested tags
    document.body.addEventListener('change', async (e) => {
      if (e.target.id === 'caseCategorySelect') {
        const typeId = document.getElementById('caseTypeSelect')?.value;
        if (typeId) {
          await this.loadSuggestedTags(typeId, e.target.value);
        }
      }
    });

    // Disability toggle
    document.body.addEventListener('change', (e) => {
      if (e.target.name === 'has_disability') {
        const detailsGroup = document.getElementById('disabilityDetailsGroup');
        if (detailsGroup) {
          detailsGroup.style.display = e.target.value === 'true' ? 'block' : 'none';
        }
      }
    });

    // Tag input
    document.body.addEventListener('keypress', (e) => {
      if (e.target.id === 'tagInput' && e.key === 'Enter') {
        e.preventDefault();
        this.addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    // Remove tag
    document.body.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-tag')) {
        this.removeTag(e.target.dataset.tag);
      }
    });

    // Support offered character count
    document.body.addEventListener('input', (e) => {
      if (e.target.name === 'support_offered') {
        const countEl = document.getElementById('supportCharCount');
        if (countEl) {
          countEl.textContent = e.target.value.length;
          countEl.style.color = e.target.value.length >= 50 ? 'green' : 'red';
        }
      }
    });

    // Form submission
    document.body.addEventListener('submit', async (e) => {
      if (e.target.id === 'caseForm') {
        e.preventDefault();
        await this.handleSubmit(e.target);
      }
    });

    // Initial character count
    setTimeout(() => {
      const supportField = document.querySelector('[name="support_offered"]');
      if (supportField) {
        const countEl = document.getElementById('supportCharCount');
        if (countEl) {
          countEl.textContent = supportField.value.length;
          countEl.style.color = supportField.value.length >= 50 ? 'green' : 'red';
        }
      }
    }, 100);

    // Load categories if editing
    if (this.currentCase?.case_type_id) {
      this.loadCategories(this.currentCase.case_type_id);
    }
  }

  /**
   * Load categories for selected type
   */
  async loadCategories(typeId) {
    if (!typeId) {
      const categorySelect = document.getElementById('caseCategorySelect');
      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">-- Select Type First --</option>';
        categorySelect.disabled = true;
      }
      return;
    }

    try {
      const response = await this.apiService.get(`/cases/categories/type/${typeId}`);
      this.categories = response.data;

      const categorySelect = document.getElementById('caseCategorySelect');
      if (categorySelect) {
        categorySelect.innerHTML = `
          <option value="">-- Select Category --</option>
          ${this.categories.map(cat => `
            <option value="${cat.id}" 
              ${this.currentCase?.case_category_id === cat.id ? 'selected' : ''}>
              ${cat.name}
            </option>
          `).join('')}
        `;
        categorySelect.disabled = false;
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }

  /**
   * Load suggested tags
   */
  async loadSuggestedTags(typeId, categoryId = null) {
    try {
      const url = `/cases/tags/suggestions?case_type_id=${typeId}${categoryId ? `&case_category_id=${categoryId}` : ''}`;
      const response = await this.apiService.get(url);
      const tags = response.data;

      const suggestedEl = document.getElementById('suggestedTags');
      if (suggestedEl && tags.length > 0) {
        suggestedEl.innerHTML = `
          <div class="suggested-tags-label">Suggested:</div>
          ${tags.map(tag => `
            <span class="tag-suggestion" onclick="window.caseForm.addTag('${tag}')">${tag}</span>
          `).join('')}
        `;
 }
    } catch (error) {
      console.error('Failed to load suggested tags:', error);
    }
  }

  /**
   * Add tag
   */
  addTag(tag) {
    if (!tag) return;

    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    // Check if tag already exists
    const existingTags = Array.from(tagsList.querySelectorAll('.tag')).map(el => 
      el.textContent.trim().replace('×', '').trim()
    );
    if (existingTags.includes(tag)) return;

    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `
      ${tag}
      <button type="button" class="remove-tag" data-tag="${tag}">×</button>
    `;
    tagsList.appendChild(tagEl);
  }

  /**
   * Remove tag
   */
  removeTag(tag) {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    const tagEls = Array.from(tagsList.querySelectorAll('.tag'));
    tagEls.forEach(el => {
      if (el.textContent.trim().replace('×', '').trim() === tag) {
        el.remove();
      }
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit(form) {
    try {
      const formData = new FormData(form);
      const data = {};

      // Build data object
      for (const [key, value] = formData.entries()) {
        if (value !== '' && value !== null) {
          // Convert boolean strings
          if (key === 'has_disability') {
            data[key] = value === 'true';
          } else if (key !== 'case_number') {
            data[key] = value || null;
          }
        }
      }

      // Collect tags
      const tagsList = document.getElementById('tagsList');
      if (tagsList) {
        data.tracking_tags = Array.from(tagsList.querySelectorAll('.tag')).map(el =>
          el.textContent.trim().replace('×', '').trim()
        );
      }

      // Validate CRITICAL: NO NAME FIELDS
      if (data.beneficiary_name || data.client_name || data.name) {
        this.showError('Name fields are not allowed for confidentiality!');
        return;
      }

      // Submit
      let response;
      if (this.currentCase) {
        response = await this.apiService.put(`/cases/${this.currentCase.id}`, data);
      } else {
        response = await this.apiService.post('/cases', data);
      }

      if (response.success) {
        this.showSuccess(`Case ${this.currentCase ? 'updated' : 'created'} successfully!`);
        setTimeout(() => {
          window.location.href = '/cases.html';
        }, 1500);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showError(error.message || 'Failed to save case');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Implement your notification system
    alert('❌ ' + message);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Implement your notification system
    alert('✅ ' + message);
  }
}

//Export for use
window.CaseFormEnhanced = CaseFormEnhanced;
