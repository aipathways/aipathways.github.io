async function loadData() {
  const response = await fetch("./data.json");
  if (!response.ok) {
    throw new Error(`Failed to load data.json: ${response.status}`);
  }

  const occupationData = await response.json();
  console.log(occupationData);

  initApp(occupationData);
}

function initApp(occupationData) {
  // all your existing rendering/filter/search code goes here
  // use occupationData instead of a global variable
}

loadData().catch(err => {
  console.error("Error loading occupation data:", err);
});