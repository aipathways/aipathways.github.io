async function loadData() {
  const response = await fetch("./data.json");
  if (!response.ok) {
    throw new Error(`Failed to load data.json: ${response.status}`);
  }

  const occupationData = await response.json();
  initApp(occupationData);
}

loadData().catch(err => {
  console.error("Error loading occupation data:", err);

  const detailPanel = document.getElementById("detailPanel");
  const occupationList = document.getElementById("occupationList");

  if (occupationList) {
    occupationList.innerHTML = `
      <div class="card static-card">
        <h3>Data failed to load</h3>
        <p class="muted">Check that <code>data.json</code> exists and contains valid JSON.</p>
      </div>
    `;
  }

  if (detailPanel) {
    detailPanel.classList.add("empty-state");
    detailPanel.innerHTML = `
      <h3>Unable to load occupations</h3>
      <p>Please verify the format and path for <code>data.json</code>.</p>
    `;
  }
});