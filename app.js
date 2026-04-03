function initApp(occupations) {
  const occupationList = document.getElementById('occupationList');
  const detailPanel = document.getElementById('detailPanel');
  const searchInput = document.getElementById('searchInput');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const globalSearchForm = document.getElementById('globalSearchForm');
  const clearBtn = document.getElementById('clearBtn');
  const resultCount = document.getElementById('resultCount');
  const chips = Array.from(document.querySelectorAll('.chip'));
  const occupationPage = document.getElementById('occupationPage');

  let activeFilter = 'ALL';
  let activeOccupationId = null;
  const MAX_VISIBLE_OCCUPATIONS = 6;

  function getOccupationById(id) {
    return occupations.find(o => o.id === id);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fullOccupationLink(id) {
    return `occupation.html?id=${encodeURIComponent(id)}`;
  }

  function getSearchValue() {
    if (searchInput) return searchInput.value.trim().toLowerCase();
    if (globalSearchInput) return globalSearchInput.value.trim().toLowerCase();
    return '';
  }

  function setSearchValue(value) {
    if (searchInput) searchInput.value = value;
    if (globalSearchInput) globalSearchInput.value = value;
  }

  function initSearchFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    if (q) setSearchValue(q);
  }

  function getFilteredOccupations() {
    const query = getSearchValue();

    return occupations.filter(o => {
      const matchesSearch = !query ||
        (o.title || '').toLowerCase().includes(query) ||
        (o.soc || '').toLowerCase().includes(query) ||
        (o.summary || '').toLowerCase().includes(query);

      const matchesExposure = activeFilter === 'ALL' || o.exposure === activeFilter;
      return matchesSearch && matchesExposure;
    });
  }

  function emptyDetailPanel() {
    if (!detailPanel) return;
    detailPanel.classList.add('empty-state');
    detailPanel.innerHTML = `
      <h3>Select an occupation</h3>
      <p>
        Click an occupation card to view AI exposure, labor market data, and up to two
        related lower-exposure occupations. Use the full occupation page for all details,
        including Arizona training opportunities.
      </p>
    `;
  }

  function renderOccupationCards() {
    if (!occupationList) return;

    const filtered = getFilteredOccupations();
    const visible = filtered.slice(0, MAX_VISIBLE_OCCUPATIONS);

    if (resultCount) {
      resultCount.textContent = filtered.length > MAX_VISIBLE_OCCUPATIONS
        ? `Showing ${visible.length} of ${filtered.length} occupations`
        : `${filtered.length} occupation${filtered.length === 1 ? '' : 's'}`;
    }

    if (!filtered.length) {
      occupationList.innerHTML = `
        <div class="card static-card">
          <h3>No occupations found</h3>
          <p class="muted">Try a different search term or exposure filter.</p>
        </div>
      `;
      emptyDetailPanel();
      return;
    }

    occupationList.innerHTML = visible.map(o => `
      <article class="card" data-id="${escapeHtml(o.id)}">
        <div class="inline-row">
          <span class="badge ${escapeHtml(o.exposure)}">${escapeHtml(o.exposure)} AI Exposure</span>
          <span class="badge Blue">SOC ${escapeHtml(o.soc)}</span>
        </div>
        <h3>${escapeHtml(o.title)}</h3>
        <p>${escapeHtml(o.summary)}</p>
        <p class="muted"><strong>Median wage:</strong> ${escapeHtml(o.laborMarket?.medianWage)}</p>
        <p class="muted"><strong>Employment:</strong> ${escapeHtml(o.laborMarket?.employment)}</p>
      </article>
    `).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        activeOccupationId = card.dataset.id;
        renderDetail(activeOccupationId);
      });
    });
  }

  function renderRelatedOccupations(occupation, limit = null, includeLinks = false) {
    if (!["High", "Very High"].includes(occupation.exposure)) {
      return `
        <div class="subsection">
          <h3>Related lower-exposure occupations</h3>
          <p class="muted">Lower-exposure transition options are highlighted when a high-exposure occupation is selected.</p>
        </div>
      `;
    }

    let related = (occupation.relatedOccupationIds || []).map(getOccupationById).filter(Boolean);
    if (typeof limit === 'number') {
      related = related.slice(0, limit);
    }

    if (!related.length) {
      return `
        <div class="subsection">
          <h3>Related lower-exposure occupations</h3>
          <p class="muted">No related lower-exposure occupations are currently mapped for this role.</p>
        </div>
      `;
    }

    return `
      <div class="subsection">
        <h3>Related lower-exposure occupations</h3>
        <div class="related-list">
          ${related.map(item => `
            <div class="mini-card">
              <div class="inline-row">
                <span class="badge ${escapeHtml(item.exposure)}">${escapeHtml(item.exposure)} Exposure</span>
                <span class="badge Blue">SOC ${escapeHtml(item.soc)}</span>
              </div>
              <h4>${escapeHtml(item.title)}</h4>
              <p class="muted">${escapeHtml(item.summary)}</p>
              <p><strong>Median wage:</strong> ${escapeHtml(item.laborMarket?.medianWage)} · <strong>Openings:</strong> ${escapeHtml(item.laborMarket?.annualOpenings)}</p>
              <div class="button-row">
                <button class="action-btn" type="button" data-related-id="${escapeHtml(item.id)}">View here</button>
                ${includeLinks ? `<a class="action-btn action-link" href="${fullOccupationLink(item.id)}">Open full page</a>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTraining(occupation) {
    if (!occupation.training || !occupation.training.length) {
      return `
        <div class="subsection">
          <h3>Arizona training opportunities</h3>
          <p class="muted">No Arizona training programs are currently attached to this occupation in the seeded demo data.</p>
        </div>
      `;
    }

    return `
      <div class="subsection">
        <h3>Arizona training opportunities</h3>
        <div class="training-list">
          ${occupation.training.map(t => `
            <div class="mini-card">
              <h4>${escapeHtml(t.program)}</h4>
              <p><strong>Provider:</strong> ${escapeHtml(t.provider)}</p>
              <p><strong>Award:</strong> ${escapeHtml(t.award)}</p>
              <p><strong>CIP:</strong> ${escapeHtml(t.cip)}</p>
              <p><strong>Location:</strong> ${escapeHtml(t.location)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function detailMarkup(o) {
    return `
      <div class="inline-row">
        <span class="badge ${escapeHtml(o.exposure)}">${escapeHtml(o.exposure)} AI Exposure</span>
        <span class="badge Blue">SOC ${escapeHtml(o.soc)}</span>
      </div>
      <h2>${escapeHtml(o.title)}</h2>
      <p>${escapeHtml(o.summary)}</p>

      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Median wage</div>
          <div class="metric-value">${escapeHtml(o.laborMarket?.medianWage)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Annual openings</div>
          <div class="metric-value">${escapeHtml(o.laborMarket?.annualOpenings)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Employment</div>
          <div class="metric-value">${escapeHtml(o.laborMarket?.employment)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Projected growth</div>
          <div class="metric-value">${escapeHtml(o.laborMarket?.projectedGrowth)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Typical education</div>
          <div class="metric-value">${escapeHtml(o.laborMarket?.typicalEducation)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Use case</div>
          <div class="metric-value">Transition planning</div>
        </div>
      </div>
    `;
  }

  function renderDetail(id) {
    if (!detailPanel) return;
    const o = getOccupationById(id);
    if (!o) return;

    activeOccupationId = id;
    detailPanel.classList.remove('empty-state');
    detailPanel.innerHTML = `
      ${detailMarkup(o)}
      <div class="subsection">
        <a class="full-page-link" href="${fullOccupationLink(o.id)}">Open full occupation page</a>
      </div>
      ${renderRelatedOccupations(o, 2, true)}
    `;

    detailPanel.querySelectorAll('[data-related-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        renderDetail(btn.dataset.relatedId);
      });
    });
  }

  function renderOccupationPage() {
    if (!occupationPage) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const occupation = getOccupationById(id);

    if (!occupation) {
      occupationPage.innerHTML = `
        <div class="detail-panel occupation-page-panel">
          <h2>Occupation not found</h2>
          <p class="muted">The requested occupation could not be found in the current demo dataset.</p>
          <p><a class="full-page-link" href="index.html">Return to explorer</a></p>
        </div>
      `;
      return;
    }

    document.title = `${occupation.title} | Arizona AI Transition Pathways`;
    occupationPage.innerHTML = `
      <div class="detail-panel occupation-page-panel">
        ${detailMarkup(occupation)}
        ${renderRelatedOccupations(occupation, null, true)}
        ${renderTraining(occupation)}
      </div>
    `;
  }

  if (globalSearchForm) {
    globalSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = (searchInput ? searchInput.value : '').trim();
      window.location.href = `index.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderOccupationCards();
      if (activeOccupationId) {
        const stillVisible = getFilteredOccupations().some(o => o.id === activeOccupationId);
        if (!stillVisible) {
          activeOccupationId = null;
          emptyDetailPanel();
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      setSearchValue('');
      activeFilter = 'ALL';
      activeOccupationId = null;
      chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'ALL'));
      renderOccupationCards();
      emptyDetailPanel();
      window.history.replaceState({}, '', 'index.html');
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      chips.forEach(c => c.classList.toggle('active', c === chip));
      renderOccupationCards();
      if (activeOccupationId) {
        const stillVisible = getFilteredOccupations().some(o => o.id === activeOccupationId);
        if (!stillVisible) {
          activeOccupationId = null;
          emptyDetailPanel();
        }
      }
    });
  });

  initSearchFromUrl();
  renderOccupationCards();
  renderOccupationPage();
}