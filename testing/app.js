function initApp(rawData) {
  const occupationList = document.getElementById("occupationList");
  const detailPanel = document.getElementById("detailPanel");
  const occupationPage = document.getElementById("occupationPage");
  const searchInput = document.getElementById("searchInput");
  const globalSearchInput = document.getElementById("globalSearchInput");
  const globalSearchForm = document.getElementById("globalSearchForm");
  const clearBtn = document.getElementById("clearBtn");
  const resultCount = document.getElementById("resultCount");
  const showMoreOccupationsBtn = document.getElementById("showMoreOccupationsBtn");
  const chips = Array.from(document.querySelectorAll(".chip"));

  let activeFilter = "ALL";
  let activeOccupationId = null;
  let occupationPageRelatedExpanded = false;
  let visibleOccupationLimit = 20;

  const OCCUPATION_INCREMENT = 20;
  const MAX_VISIBLE_OCCUPATIONS = 100;
  const SANKEY_PAGE_PATH = "assets/sankey.html";
  const SANKEY_SOURCE_EXPOSURES = new Set(["High", "Very High"]);

  const occupations = normalizeData(rawData);
  const occupationsById = new Map(occupations.map(o => [o.id, o]));

  function normalizeData(data) {
    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.occupations)
        ? data.occupations
        : [];

    return rows
      .map((item, index) => normalizeOccupation(item, index))
      .filter(Boolean);
  }

  function normalizeOccupation(item, index) {
    if (!item || typeof item !== "object") return null;

    const title = item.title ?? item.occupationTitle ?? item.name ?? "";
    const soc = item.soc ?? item.socCode ?? item.code ?? "";
    const exposure = normalizeExposure(item.exposure ?? item.aiExposure ?? item.exposureLevel ?? "Unknown");
    const summary = item.summary ?? item.description ?? "";

    const laborMarketSource = item.laborMarket ?? item.lmi ?? {};

    return {
      id: item.id ?? makeId(title || soc || `occupation-${index}`),
      title: String(title || "Untitled occupation"),
      soc: String(soc || ""),
      exposure,
      summary: String(summary || ""),
      laborMarket: {
        medianWage: laborMarketSource.medianWage ?? item.medianWage ?? "N/A",
        annualOpenings: laborMarketSource.annualOpenings ?? item.annualOpenings ?? "N/A",
        employment: laborMarketSource.employment ?? item.employment ?? "N/A",
        projectedGrowth: laborMarketSource.projectedGrowth ?? item.projectedGrowth ?? "N/A",
        typicalEducation: laborMarketSource.typicalEducation ?? item.typicalEducation ?? "N/A"
      },
      relatedOccupationIds: Array.isArray(item.relatedOccupationIds)
        ? item.relatedOccupationIds
        : Array.isArray(item.relatedOccupations)
          ? item.relatedOccupations.map(x => typeof x === "string" ? x : x?.id).filter(Boolean)
          : [],
      training: Array.isArray(item.training) ? item.training : []
    };
  }

  function normalizeExposure(value) {
    const v = String(value ?? "").trim().toLowerCase();
    if (v === "very high") return "Very High";
    if (v === "high") return "High";
    if (v === "medium") return "Medium";
    if (v === "low") return "Low";
    if (v === "very low") return "Very Low";
    return String(value ?? "Unknown");
  }

  function cssExposureClass(exposure) {
    return String(exposure || "").trim().replace(/\s+/g, "-");
  }

  function makeId(value) {
    return String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "occupation";
  }

  function getOccupationById(id) {
    return occupationsById.get(id) || null;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fullOccupationLink(id) {
    return `occupation.html?id=${encodeURIComponent(id)}`;
  }

  function getActiveSearchInput() {
    return searchInput || globalSearchInput || null;
  }

  function getSearchValue() {
    const input = getActiveSearchInput();
    return input ? input.value.trim().toLowerCase() : "";
  }

  function setSearchValue(value) {
    if (searchInput) searchInput.value = value;
    if (globalSearchInput) globalSearchInput.value = value;
  }

  function initSearchFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    if (q) setSearchValue(q);
  }

  function updateUrlQuery() {
    const params = new URLSearchParams(window.location.search);
    const q = getActiveSearchInput()?.value.trim() || "";

    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }

  function getFilteredOccupations() {
    const query = getSearchValue();

    return occupations.filter(o => {
      const matchesSearch =
        !query ||
        String(o.title || "").toLowerCase().includes(query) ||
        String(o.soc || "").toLowerCase().includes(query) ||
        String(o.summary || "").toLowerCase().includes(query);

      const matchesExposure = activeFilter === "ALL" || o.exposure === activeFilter;
      return matchesSearch && matchesExposure;
    });
  }

  function emptyDetailPanel() {
    if (!detailPanel) return;

    detailPanel.classList.add("empty-state");
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
    const visible = filtered.slice(0, visibleOccupationLimit);

    if (resultCount) {
      const cappedTotal = Math.min(filtered.length, MAX_VISIBLE_OCCUPATIONS);

      resultCount.textContent =
        filtered.length > visible.length
          ? `Showing ${visible.length} of ${cappedTotal} occupations`
          : `${visible.length} occupation${visible.length === 1 ? "" : "s"}`;

      if (filtered.length > MAX_VISIBLE_OCCUPATIONS) {
        resultCount.textContent += `, capped at ${MAX_VISIBLE_OCCUPATIONS}`;
      }
    }

    if (showMoreOccupationsBtn) {
      const canShowMore =
        filtered.length > visible.length &&
        visibleOccupationLimit < MAX_VISIBLE_OCCUPATIONS;

      showMoreOccupationsBtn.hidden = !canShowMore;

      const remainingBeforeCap = Math.min(
        OCCUPATION_INCREMENT,
        MAX_VISIBLE_OCCUPATIONS - visibleOccupationLimit,
        filtered.length - visible.length
      );

      showMoreOccupationsBtn.textContent =
        remainingBeforeCap > 0
          ? `Show ${remainingBeforeCap} more occupations`
          : "Show more occupations";
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
          <span class="badge ${escapeHtml(cssExposureClass(o.exposure))}">${escapeHtml(o.exposure)} AI Exposure</span>
          <span class="badge Blue">SOC ${escapeHtml(o.soc || "N/A")}</span>
        </div>
        <h3>${escapeHtml(o.title)}</h3>
        <p>${escapeHtml(o.summary || "No summary available.")}</p>
        <p class="muted"><strong>Median wage:</strong> ${escapeHtml(o.laborMarket?.medianWage)}</p>
        <p class="muted"><strong>Employment:</strong> ${escapeHtml(o.laborMarket?.employment)}</p>
      </article>
    `).join("");

    occupationList.querySelectorAll(".card[data-id]").forEach(card => {
      card.addEventListener("click", () => {
        activeOccupationId = card.dataset.id;
        renderDetail(activeOccupationId);
      });
    });
  }

function renderRelatedOccupations(
  occupation,
  limit = null,
  includeLinks = false,
  options = {}
) {
  const { showToggle = false, expanded = false, showViewHere = true } = options;

  if (!["High", "Very High"].includes(occupation.exposure)) {
    return `
      <div class="subsection">
        <h3>Related lower-exposure occupations</h3>
        <p class="muted">Lower-exposure transition options are highlighted when a high-exposure occupation is selected.</p>
      </div>
    `;
  }

  const allRelated = (occupation.relatedOccupationIds || [])
    .map(getOccupationById)
    .filter(Boolean);

  const toggleLimit = 3;
  const shouldShowToggle = showToggle && allRelated.length > toggleLimit;

  let related = allRelated;

  if (shouldShowToggle && !expanded) {
    related = allRelated.slice(0, toggleLimit);
  } else if (typeof limit === "number") {
    related = allRelated.slice(0, limit);
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
              <span class="badge ${escapeHtml(cssExposureClass(item.exposure))}">${escapeHtml(item.exposure)} Exposure</span>
              <span class="badge Blue">SOC ${escapeHtml(item.soc || "N/A")}</span>
            </div>
            <h4>${escapeHtml(item.title)}</h4>
            <p class="muted">${escapeHtml(item.summary || "No summary available.")}</p>
            <p><strong>Median wage:</strong> ${escapeHtml(item.laborMarket?.medianWage)} · <strong>Openings:</strong> ${escapeHtml(item.laborMarket?.annualOpenings)}</p>
            <div class="button-row">
              ${showViewHere ? `<button class="action-btn" type="button" data-related-id="${escapeHtml(item.id)}">View here</button>` : ""}
              ${includeLinks ? `<a class="action-btn action-link" href="${fullOccupationLink(item.id)}">Open full page</a>` : ""}
            </div>
          </div>
        `).join("")}
      </div>

      ${shouldShowToggle ? `
        <div class="related-toggle-row">
          <button
            class="text-link related-toggle"
            type="button"
            data-related-toggle="${expanded ? "less" : "more"}"
          >
            ${expanded ? "Show less" : `Show more (${allRelated.length - toggleLimit} more)`}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

  function renderSankeySection(occupation) {
    const soc = String(occupation?.soc || "").trim();

    if (!soc || !SANKEY_SOURCE_EXPOSURES.has(occupation.exposure)) {
      return "";
    }

    const sankeyUrl = `${SANKEY_PAGE_PATH}?id=${encodeURIComponent(occupation.id)}`;
    const title = `AI transition pathway Sankey diagram for ${occupation.title} (${soc})`;

    return `
      <div class="subsection sankey-section">
        <div class="sankey-section-head">
          <h3>Transition pathway diagram</h3>
          <p class="sankey-note muted">
            Compare direct and intermediary pathways from this high-exposure occupation to related lower-exposure roles.
          </p>
        </div>
        <iframe
          class="sankey-frame"
          src="${escapeHtml(sankeyUrl)}"
          title="${escapeHtml(title)}"
          loading="lazy"
        ></iframe>
      </div>
    `;
  }

  function renderTraining(occupation) {
    if (!occupation.training || !occupation.training.length) {
      return `
        <div class="subsection">
          <h3>Arizona training opportunities</h3>
          <p class="muted">No Arizona training programs are currently attached to this occupation in the dataset.</p>
        </div>
      `;
    }

    return `
      <div class="subsection">
        <h3>Arizona training opportunities</h3>
        <div class="training-list">
          ${occupation.training.map(t => `
            <div class="mini-card">
              <h4>${escapeHtml(t.program || "Untitled program")}</h4>
              <p><strong>Provider:</strong> ${escapeHtml(t.provider || "N/A")}</p>
              <p><strong>Award:</strong> ${escapeHtml(t.award || "N/A")}</p>
              <p><strong>CIP:</strong> ${escapeHtml(t.cip || "N/A")}</p>
              <p><strong>Location:</strong> ${escapeHtml(t.location || "N/A")}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function detailMarkup(o) {
    return `
      <div class="inline-row">
        <span class="badge ${escapeHtml(cssExposureClass(o.exposure))}">${escapeHtml(o.exposure)} AI Exposure</span>
        <span class="badge Blue">SOC ${escapeHtml(o.soc || "N/A")}</span>
      </div>
      <h2>${escapeHtml(o.title)}</h2>
      <p>${escapeHtml(o.summary || "No summary available.")}</p>

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

    const occupation = getOccupationById(id);

    if (!occupation) {
      emptyDetailPanel();
      return;
    }

    activeOccupationId = id;
    detailPanel.classList.remove("empty-state");
    detailPanel.innerHTML = `
      ${detailMarkup(occupation)}
      <div class="subsection">
        <a class="full-page-link" href="${fullOccupationLink(occupation.id)}">Open full occupation page</a>
      </div>
      ${renderRelatedOccupations(occupation, 2, true)}
    `;

    detailPanel.querySelectorAll("[data-related-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        renderDetail(btn.dataset.relatedId);
      });
    });
  }

function renderOccupationPage() {
  if (!occupationPage) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const occupation = getOccupationById(id);

  if (!occupation) {
    occupationPage.innerHTML = `
      <div class="detail-panel occupation-page-panel">
        <h2>Occupation not found</h2>
        <p class="muted">The requested occupation could not be found in the current dataset.</p>
        <p><a class="full-page-link" href="index.html">Return to explorer</a></p>
      </div>
    `;
    return;
  }

  document.title = `${occupation.title} | Arizona AI Transition Pathways`;

  occupationPage.innerHTML = `
    <div class="detail-panel occupation-page-panel">
      ${detailMarkup(occupation)}
      ${renderSankeySection(occupation)}
      ${renderRelatedOccupations(occupation, null, true, {
        showToggle: true,
        expanded: occupationPageRelatedExpanded,
        showViewHere: false
      })}
      ${renderTraining(occupation)}
    </div>
  `;

  occupationPage.querySelectorAll("[data-related-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      occupationPageRelatedExpanded = btn.dataset.relatedToggle === "more";
      renderOccupationPage();
    });
  });
}

  function syncSearchInputs(changedInput) {
    const value = changedInput.value;
    if (searchInput && changedInput !== searchInput) searchInput.value = value;
    if (globalSearchInput && changedInput !== globalSearchInput) globalSearchInput.value = value;
  }

  function rerenderExplorer() {
    renderOccupationCards();

    if (activeOccupationId) {
      const stillVisible = getFilteredOccupations().some(o => o.id === activeOccupationId);
      if (stillVisible) {
        renderDetail(activeOccupationId);
      } else {
        activeOccupationId = null;
        emptyDetailPanel();
      }
    } else if (detailPanel) {
      emptyDetailPanel();
    }
  }

  if (globalSearchForm) {
    globalSearchForm.addEventListener("submit", event => {
      event.preventDefault();
      const query = (globalSearchInput?.value || searchInput?.value || "").trim();
      window.location.href = `index.html${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    });
  }

  [searchInput, globalSearchInput].filter(Boolean).forEach(input => {
    input.addEventListener("input", () => {
      syncSearchInputs(input);
      updateUrlQuery();
      visibleOccupationLimit = OCCUPATION_INCREMENT;

      if (occupationList) {
        rerenderExplorer();
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      setSearchValue("");
      activeFilter = "ALL";
      activeOccupationId = null;
      visibleOccupationLimit = OCCUPATION_INCREMENT;

      chips.forEach(chip => {
        chip.classList.toggle("active", chip.dataset.filter === "ALL");
      });

      renderOccupationCards();
      emptyDetailPanel();
      window.history.replaceState({}, "", "index.html");
    });
  }

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter || "ALL";
      visibleOccupationLimit = OCCUPATION_INCREMENT;

      chips.forEach(c => {
        c.classList.toggle("active", c === chip);
      });

      renderOccupationCards();

      if (activeOccupationId) {
        const stillVisible = getFilteredOccupations().some(o => o.id === activeOccupationId);
        if (stillVisible) {
          renderDetail(activeOccupationId);
        } else {
          activeOccupationId = null;
          emptyDetailPanel();
        }
      }
    });
  });

  if (showMoreOccupationsBtn) {
    showMoreOccupationsBtn.addEventListener("click", () => {
      visibleOccupationLimit = Math.min(
        visibleOccupationLimit + OCCUPATION_INCREMENT,
        MAX_VISIBLE_OCCUPATIONS
      );

      renderOccupationCards();
    });
  }

  initSearchFromUrl();

  if (occupationList && detailPanel) {
    renderOccupationCards();
    emptyDetailPanel();
  }

  if (occupationPage) {
    renderOccupationPage();
  }
}
