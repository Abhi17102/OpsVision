(function () {
  const key = "opsvision.theme";
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
  }

  function getPreferred() {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function toggle() {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(key, next);
    apply(next);
    window.dispatchEvent(new CustomEvent("opsvision:theme", { detail: { theme: next } }));
  }

  apply(getPreferred());

  window.OpsVisionTheme = { toggle };

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", toggle);
  });
})();

