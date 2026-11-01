(() => {
  const endpoint = "https://api.github.com/repos/Shix-0/fabric-launcher-1.21.1/contents/mods?ref=main";
  const grid = document.getElementById("mod-grid");
  const count = document.getElementById("mod-count");
  const search = document.getElementById("mod-search");
  let mods = [];

  function render() {
    const query = search.value.trim().toLowerCase();
    const visible = mods.filter(mod => mod.name.toLowerCase().includes(query));
    count.textContent = `${visible.length} ${visible.length === 1 ? "mod" : "mods"}`;
    grid.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "mod-state";
      empty.textContent = query ? "No mods match your search." : "No mods are listed yet.";
      grid.append(empty);
      return;
    }
    visible.forEach(mod => {
      const card = document.createElement("article");
      card.className = "mod-item";
      const link = document.createElement("a");
      link.href = mod.html_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = mod.name;
      const detail = document.createElement("small");
      detail.textContent = `${(mod.size / 1048576).toFixed(2)} MB · GitHub`;
      card.append(link, detail);
      grid.append(card);
    });
  }

  async function load() {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
      const files = await response.json();
      mods = files.filter(file => file.type === "file" && file.name.toLowerCase().endsWith(".jar"));
      mods.sort((a, b) => a.name.localeCompare(b.name));
      render();
    } catch (error) {
      count.textContent = "Could not load the list";
      grid.replaceChildren();
      const message = document.createElement("div");
      message.className = "mod-state";
      message.textContent = "The GitHub mod list could not be reached. Try again later or browse the mods repository directly.";
      const link = document.createElement("a");
      link.href = "https://github.com/Shix-0/fabric-launcher-1.21.1/tree/main/mods";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Open mod repository ↗";
      link.style.color = "#ffc27f";
      message.append(document.createElement("br"), link);
      grid.append(message);
      console.warn("BDSMP mod list lookup failed:", error);
    }
  }

  search.addEventListener("input", render);
  load();
})();
