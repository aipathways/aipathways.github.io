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
  const cleanSoc = value => String(value || "").trim();

  const rows = (window.pathwaysData || [])
  .filter(row => cleanSoc(row.source_soc) === cleanSoc(occupation.soc))
  .sort((a, b) => Number(a.rank) - Number(b.rank));

  if (!["High", "Very High"].includes(occupation.exposure)) {
    return `
      <div class="subsection">
        <h3>Ranked transition options</h3>
        <p class="muted">Transition options are shown for High and Very High AI exposure occupations.</p>
      </div>
    `;
  }

  if (!rows.length) {
    return `
      <div class="subsection">
        <h3>Ranked transition options</h3>
        <p class="muted">No ranked transition options are currently mapped for this role.</p>
      </div>
    `;
  }

  const shownRows = typeof limit === "number" ? rows.slice(0, limit) : rows;
  if (options.compact) {
  return `
    <div class="subsection">
      <h3>Ranked transition options</h3>
      <div class="related-list">
        ${shownRows.map(row => `
          <div class="mini-card">
            <div class="inline-row">
              <span class="badge ${escapeHtml(cssExposureClass(row.ai_exposure))}">${escapeHtml(row.ai_exposure)} Exposure</span>
              <span class="badge Blue">SOC ${escapeHtml(row.soc || "N/A")}</span>
            </div>
            <h4>${escapeHtml(row.occupation)}</h4>
            <p><strong>Pathway:</strong> ${escapeHtml(row.pathway || "N/A")}</p>
            <p><strong>Median wage:</strong> ${escapeHtml(row.median_wage || "N/A")} · <strong>Openings:</strong> ${escapeHtml(row.openings || "N/A")}</p>
            <p><strong>Wage diff.:</strong> ${escapeHtml(row.wage_diff || "N/A")} · <strong>Growth:</strong> ${escapeHtml(row.growth || "N/A")}</p>
            <div class="button-row">
              <a class="action-btn action-link" href="${escapeHtml(row.link)}">Open full page</a>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

  return `
    <div class="subsection">
      <h3>Ranked transition options</h3>
      <div class="ranked-table-wrap">
        <table class="ranked-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Occupation</th>
              <th>Pathway</th>
              <th>AI Exposure</th>
              <th>Median Wage</th>
              <th>Wage Diff.</th>
              <th>Openings</th>
              <th>Growth</th>
              <th>Destination</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${shownRows.map(row => `
              <tr>
                <td>${escapeHtml(row.rank)}</td>
                <td><strong>${escapeHtml(row.occupation)}</strong><br><span class="muted">SOC ${escapeHtml(row.soc || "N/A")}</span></td>
                <td>${escapeHtml(row.pathway || "N/A")}</td>
                <td>
                <span class="badge ${escapeHtml(cssExposureClass(row.ai_exposure))}">
                 ${escapeHtml(row.ai_exposure)}
                  </span>
                  </td>
                <td>${escapeHtml(row.median_wage || "N/A")}</td>
                <td>${escapeHtml(row.wage_diff || "N/A")}</td>
                <td>${escapeHtml(row.openings || "N/A")}</td>
                <td>${escapeHtml(row.growth || "N/A")}</td>
                <td>${escapeHtml(row.destination_education || "N/A")}</td>
                <td><a class="action-link" href="${escapeHtml(row.link)}">Open full page</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
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

    if (
        occupation.exposure === "Very High" ||
        occupation.exposure === "High"
    ) {
        return `
            <div class="subsection">
                <h3>Arizona training opportunities</h3>

                <p class="muted">
                    Training programs are available for lower-exposure destination occupations. Select a transition option below to explore related Arizona education and training pathways.
                </p>
            </div>
        `;
    }

    return `
        <div class="subsection">
            <h3>Arizona training opportunities</h3>

            <a class="action-btn action-link"
               href="transitions.html?soc=${encodeURIComponent(occupation.soc)}">
               View related training programs
            </a>
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
      ${renderRelatedOccupations(occupation, 2, true, { compact: true })}
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

Promise.all([
  fetch("data.json").then(response => response.json()),
  fetch("pathways.json").then(response => response.json())
])
  .then(([data, pathways]) => {
    window.pathwaysData = pathways;
    initApp(data);
  })
  .catch(error => {
    console.error("Error loading website data:", error);
  });