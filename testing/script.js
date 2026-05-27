async function loadData() {
  try {
    const response = await fetch("./data.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Failed to load data.json: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();
    initApp(rawData);
  } catch (err) {
    console.error("Error loading occupation data:", err);

    const detailPanel = document.getElementById("detailPanel");
    const occupationList = document.getElementById("occupationList");
    const occupationPage = document.getElementById("occupationPage");

    if (occupationList) {
      occupationList.innerHTML = `
        <div class="card static-card">
          <h3>Data failed to load</h3>
          <p class="muted">Check that <code>data.json</code> exists, is valid JSON, and is being served from the same directory.</p>
        </div>
      `;
    }

    if (detailPanel) {
      detailPanel.classList.add("empty-state");
      detailPanel.innerHTML = `
        <h3>Unable to load occupations</h3>
        <p>Please verify the path and format of <code>data.json</code>.</p>
      `;
    }

    if (occupationPage) {
      occupationPage.innerHTML = `
        <div class="detail-panel occupation-page-panel">
          <h2>Unable to load occupations</h2>
          <p class="muted">Please verify the path and format of <code>data.json</code>.</p>
          <p><a class="full-page-link" href="index.html">Return to explorer</a></p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", loadData);