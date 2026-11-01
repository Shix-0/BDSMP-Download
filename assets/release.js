(() => {
  const releasesUrl = "https://api.github.com/repos/Shix-0/fabric-launcher-1.21.1/releases?per_page=100";
  const releaseListUrl = "https://github.com/Shix-0/fabric-launcher-1.21.1/releases";
  const downloadButton = document.getElementById("download-button");
  const heroDownload = document.getElementById("hero-download");
  const status = document.getElementById("release-status");
  const version = document.getElementById("release-version");
  const size = document.getElementById("release-size");
  const error = document.getElementById("release-error");

  const isInstaller = asset => typeof asset.name === "string" &&
    /^BDSMP-Installer(?:-v[0-9]+)?\.exe$/i.test(asset.name);

  function showUnavailable(message) {
    status.className = "release-status failed";
    status.innerHTML = "<i></i> Installer unavailable";
    version.textContent = "No BDSMP installer found";
    size.textContent = "Check GitHub Releases";
    downloadButton.textContent = "View releases ↗";
    downloadButton.href = releaseListUrl;
    downloadButton.setAttribute("aria-disabled", "false");
    heroDownload.href = releaseListUrl;
    if (message) {
      error.hidden = false;
      error.textContent = message;
    }
  }

  async function loadLatestRelease() {
    try {
      const response = await fetch(releasesUrl, {
        headers: { Accept: "application/vnd.github+json" }, cache: "no-store"
      });
      if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
      const releases = await response.json();
      const release = releases.find(item => !item.draft && Array.isArray(item.assets) && item.assets.some(isInstaller));
      if (!release) return showUnavailable("No published BDSMP installer is available yet.");

      const executable = release.assets.filter(isInstaller).sort((a, b) => (b.size || 0) - (a.size || 0))[0];
      if (!executable || executable.size < 50000 || !executable.browser_download_url) {
        return showUnavailable("The release does not contain a complete BDSMP installer.");
      }
      const url = new URL(executable.browser_download_url);
      if (url.protocol !== "https:" || url.hostname !== "github.com" || !url.pathname.includes("/releases/download/")) {
        return showUnavailable("GitHub returned an invalid installer link.");
      }

      downloadButton.href = url.href;
      downloadButton.setAttribute("aria-disabled", "false");
      downloadButton.innerHTML = `Download installer · ${(executable.size / 1048576).toFixed(1)} MB <span aria-hidden="true">↓</span>`;
      heroDownload.href = url.href;
      status.className = "release-status ready";
      status.innerHTML = "<i></i> Latest installer ready";
      version.textContent = release.name || release.tag_name || "Latest release";
      size.textContent = `${(executable.size / 1048576).toFixed(1)} MB`;
    } catch (cause) {
      showUnavailable("Could not reach GitHub Releases. Check your connection or open the releases page directly.");
      console.warn("BDSMP release lookup failed:", cause);
    }
  }

  downloadButton.addEventListener("click", event => {
    if (downloadButton.getAttribute("aria-disabled") === "true") event.preventDefault();
  });
  heroDownload.addEventListener("click", event => {
    if (heroDownload.href.endsWith("#download")) event.preventDefault();
  });
  loadLatestRelease();
})();
