(() => {
  const releasesUrl = "https://api.github.com/repos/Shix-0/fabric-launcher-1.21.1/releases";
  const releaseListUrl = "https://github.com/Shix-0/fabric-launcher-1.21.1/releases";
  // Set this to the GitHub total at the moment you want the visible counter to restart.
  const DOWNLOAD_COUNT_BASELINE = 0;
  const downloadButton = document.getElementById("download-button");
  const heroDownload = document.getElementById("hero-download");
  const status = document.getElementById("release-status");
  const version = document.getElementById("release-version");
  const size = document.getElementById("release-size");
  const downloadCount = document.getElementById("download-count");
  const error = document.getElementById("release-error");
  let currentGlobalDownloadCount = null;

  const isInstaller = asset => typeof asset.name === "string" &&
    asset.name.toLowerCase().endsWith(".exe") && /installer/i.test(asset.name);

  async function loadAllReleases() {
    const allReleases = [];
    for (let page = 1; ; page += 1) {
      const response = await fetch(releasesUrl + "?per_page=100&page=" + page, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("GitHub returned HTTP " + response.status + ".");
      const pageReleases = await response.json();
      allReleases.push(...pageReleases);
      if (pageReleases.length < 100) return allReleases;
    }
  }

  function totalInstallerDownloads(releases) {
    return releases
      .filter(item => !item.draft && Array.isArray(item.assets))
      .flatMap(item => item.assets.filter(isInstaller))
      .reduce((total, asset) => total + (Number.isFinite(asset.download_count) ? asset.download_count : 0), 0);
  }

  function showDownloadCount(total) {
    currentGlobalDownloadCount = Math.max(0, total - DOWNLOAD_COUNT_BASELINE);
    downloadCount.textContent = new Intl.NumberFormat("en-US").format(currentGlobalDownloadCount) + " global downloads";
  }

  async function refreshDownloadCount() {
    try {
      showDownloadCount(totalInstallerDownloads(await loadAllReleases()));
    } catch (cause) {
      console.warn("ShiroNeko download count refresh failed:", cause);
    }
  }

  function refreshCountAfterDownloadClick() {
    if (currentGlobalDownloadCount === null) return;
    downloadCount.textContent = new Intl.NumberFormat("en-US").format(currentGlobalDownloadCount) + " global downloads · syncing";
    window.setTimeout(refreshDownloadCount, 2500);
  }

  function showUnavailable(message) {
    status.className = "release-status failed";
    status.innerHTML = "<i></i> Release unavailable";
    version.textContent = "No Windows installer found";
    size.textContent = "Check GitHub Releases";
    downloadCount.textContent = "Download count unavailable";
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
      const releases = await loadAllReleases();
      showDownloadCount(totalInstallerDownloads(releases));
      const release = releases.find(item => !item.draft && Array.isArray(item.assets) &&
        item.assets.some(isInstaller));
      if (!release) return showUnavailable("No published release includes a Windows installer yet.");

      const executable = release.assets
        .filter(isInstaller)
        .sort((a, b) => (b.size || 0) - (a.size || 0))[0];
      if (!executable || executable.size < 50000 || !executable.browser_download_url) {
        return showUnavailable("The release does not contain a complete Windows installer.");
      }
      const url = new URL(executable.browser_download_url);
      if (url.protocol !== "https:" || url.hostname !== "github.com" || !url.pathname.includes("/releases/download/")) {
        return showUnavailable("GitHub returned an invalid download link.");
      }

      downloadButton.href = url.href;
      downloadButton.setAttribute("aria-disabled", "false");
      downloadButton.innerHTML = "Download installer · " + (executable.size / 1048576).toFixed(1) + " MB <span aria-hidden="true">↓</span>";
      heroDownload.href = url.href;
      status.className = "release-status ready";
      status.innerHTML = "<i></i> Latest installer ready";
      version.textContent = release.name || release.tag_name || "Latest release";
      size.textContent = (executable.size / 1048576).toFixed(1) + " MB";
      const published = release.published_at ? new Date(release.published_at) : null;
      if (published && !Number.isNaN(published.valueOf())) {
        const date = document.createElement("span");
        date.className = "detail-dot";
        date.textContent = "·";
        const dateLabel = document.createElement("span");
        dateLabel.textContent = "Updated " + published.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        document.querySelector(".release-details").append(date, dateLabel);
      }
    } catch (cause) {
      showUnavailable("Could not reach GitHub Releases. Check your connection or open the releases page directly.");
      console.warn("ShiroNeko release lookup failed:", cause);
    }
  }

  downloadButton.addEventListener("click", event => {
    if (downloadButton.getAttribute("aria-disabled") === "true") event.preventDefault();
    else refreshCountAfterDownloadClick();
  });
  heroDownload.addEventListener("click", event => {
    if (heroDownload.href.endsWith("#download")) event.preventDefault();
    else refreshCountAfterDownloadClick();
  });
  loadLatestRelease();
})();
