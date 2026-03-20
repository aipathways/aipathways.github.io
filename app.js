const occupationList = document.getElementById('occupationList');
const detailPanel = document.getElementById('detailPanel');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultCount = document.getElementById('resultCount');
const chips = Array.from(document.querySelectorAll('.chip'));

let activeFilter = 'ALL';
let activeOccupationId = null;

function getOccupationById(id) {
  return occupations.find(o => o.id === id);
}

function renderOccupationCards() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = occupations.filter(o => {
    const matchesSearch = !query ||
      o.title.toLowerCase().includes(query) ||
      o.soc.toLowerCase().includes(query) ||
      o.summary.toLowerCase().includes(query);

    const matchesExposure = activeFilter === 'ALL' || o.exposure === activeFilter;
    return matchesSearch && matchesExposure;
  });

  resultCount.textContent = `${filtered.length} occupation${filtered.length === 1 ? '' : 's'}`;

  if (!filtered.length) {
    occupationList.innerHTML = `
      <div class="card">
        <h3>No occupations found</h3>
        <p class="muted">Try a different search term or exposure filter.</p>
      </div>
    `;
    return;
  }

  occupationList.innerHTML = filtered.map(o => `
    <article class="card" data-id="${o.id}">
      <div class="inline-row">
        <span class="badge ${o.exposure}">${o.exposure} AI Exposure</span>
        <span class="badge Blue">SOC ${o.soc}</span>
      </div>
      <h3>${o.title}</h3>
      <p>${o.summary}</p>
      <p class="muted"><strong>Median wage:</strong> ${o.laborMarket.medianWage}</p>
      <p class="muted"><strong>Employment:</strong> ${o.laborMarket.employment}</p>
    </article>
  `).join('');

  document.querySelectorAll('.card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      activeOccupationId = card.dataset.id;
      renderDetail(activeOccupationId);
    });
  });
}

function renderRelatedOccupations(occupation) {
  if (occupation.exposure !== 'High') {
    return `
      <div class="subsection">
        <h3>Transition pathways</h3>
        <p class="muted">Lower-exposure transition options are highlighted when a high-exposure occupation is selected.</p>
      </div>
    `;
  }

  const related = occupation.relatedOccupationIds.map(getOccupationById).filter(Boolean);
  if (!related.length) {
    return `
      <div class="subsection">
        <h3>Transition pathways</h3>
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
              <span class="badge ${item.exposure}">${item.exposure} Exposure</span>
              <span class="badge Blue">SOC ${item.soc}</span>
            </div>
            <h4>${item.title}</h4>
            <p class="muted">${item.summary}</p>
            <p><strong>Median wage:</strong> ${item.laborMarket.medianWage} · <strong>Openings:</strong> ${item.laborMarket.annualOpenings}</p>
            <button class="action-btn" onclick="renderDetail('${item.id}')">View occupation</button>
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
            <h4>${t.program}</h4>
            <p><strong>Provider:</strong> ${t.provider}</p>
            <p><strong>Award:</strong> ${t.award}</p>
            <p><strong>CIP:</strong> ${t.cip}</p>
            <p><strong>Location:</strong> ${t.location}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDetail(id) {
  const o = getOccupationById(id);
  if (!o) return;

  activeOccupationId = id;
  detailPanel.classList.remove('empty-state');
  detailPanel.innerHTML = `
    <div class="inline-row">
      <span class="badge ${o.exposure}">${o.exposure} AI Exposure</span>
      <span class="badge Blue">SOC ${o.soc}</span>
    </div>
    <h2>${o.title}</h2>
    <p>${o.summary}</p>

    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Median wage</div>
        <div class="metric-value">${o.laborMarket.medianWage}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Annual openings</div>
        <div class="metric-value">${o.laborMarket.annualOpenings}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Employment</div>
        <div class="metric-value">${o.laborMarket.employment}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Projected growth</div>
        <div class="metric-value">${o.laborMarket.projectedGrowth}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Typical education</div>
        <div class="metric-value">${o.laborMarket.typicalEducation}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Use case</div>
        <div class="metric-value">Transition planning</div>
      </div>
    </div>

    ${renderRelatedOccupations(o)}
    ${renderTraining(o)}
  `;
}

searchInput.addEventListener('input', renderOccupationCards);
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'ALL';
  chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'ALL'));
  renderOccupationCards();
});

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    activeFilter = chip.dataset.filter;
    chips.forEach(c => c.classList.toggle('active', c === chip));
    renderOccupationCards();
  });
});

renderOccupationCards();
