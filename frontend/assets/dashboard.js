(() => {
  const LIMIT = 200;
  const REFRESH_MS = 5000;

  const els = {
    alerts: document.getElementById("alerts"),
    statusPill: document.getElementById("statusPill"),
    lastUpdated: document.getElementById("lastUpdated"),
    cpuNow: document.getElementById("cpuNow"),
    memNow: document.getElementById("memNow"),
    diskNow: document.getElementById("diskNow"),
    refreshLabel: document.getElementById("refreshLabel"),
    limitLabel: document.getElementById("limitLabel"),
    collectNow: document.getElementById("collectNow"),
  };

  els.refreshLabel.textContent = `${Math.round(REFRESH_MS / 1000)}s`;
  els.limitLabel.textContent = `${LIMIT}`;

  function fmtPct(v) {
    if (typeof v !== "number" || Number.isNaN(v)) return "—%";
    return `${v.toFixed(1)}%`;
  }

  function parseTs(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function setStatus(ok, text) {
    els.statusPill.textContent = text;
    els.statusPill.classList.remove("pill-ok", "pill-bad");
    els.statusPill.classList.add(ok ? "pill-ok" : "pill-bad");
  }

  function chartColors() {
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    const grid = theme === "light" ? "rgba(12,22,48,0.10)" : "rgba(232,238,252,0.10)";
    const tick = theme === "light" ? "rgba(12,22,48,0.70)" : "rgba(232,238,252,0.70)";
    return { grid, tick };
  }

  function makeChart(canvasId, label, color) {
    const ctx = document.getElementById(canvasId);
    const { grid, tick } = chartColors();
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label,
            data: [],
            borderColor: color,
            backgroundColor: "rgba(109,125,255,0.08)",
            tension: 0.25,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            grid: { color: grid },
            ticks: { color: tick, maxTicksLimit: 6 },
          },
          y: {
            suggestedMin: 0,
            suggestedMax: 100,
            grid: { color: grid },
            ticks: { color: tick, callback: (v) => `${v}%` },
          },
        },
      },
    });
  }

  const charts = {
    cpu: makeChart("cpuChart", "CPU %", "#6d7dff"),
    mem: makeChart("memChart", "Memory %", "#4dd6ff"),
    disk: makeChart("diskChart", "Disk %", "#ff5a7a"),
  };

  function refreshChartTheme() {
    const { grid, tick } = chartColors();
    Object.values(charts).forEach((c) => {
      c.options.scales.x.grid.color = grid;
      c.options.scales.y.grid.color = grid;
      c.options.scales.x.ticks.color = tick;
      c.options.scales.y.ticks.color = tick;
      c.update();
    });
  }

  window.addEventListener("opsvision:theme", refreshChartTheme);

  function setAlerts(alerts, timestamp) {
    if (!alerts || alerts.length === 0) {
      els.alerts.innerHTML = `<div class="muted">No alerts. Thresholds not exceeded.</div>`;
      return;
    }
    const ts = timestamp ? parseTs(timestamp) : "";
    els.alerts.innerHTML = alerts
      .map((a) => {
        const sev = a.toLowerCase().includes("high") ? "danger" : "warn";
        const badge = sev === "danger" ? "badge-danger" : "badge-warn";
        return `
          <div class="alert">
            <div>
              <strong>${a}</strong>
              <div class="muted">${ts ? `Detected at ${ts}` : ""}</div>
            </div>
            <div class="badge ${badge}">${sev.toUpperCase()}</div>
          </div>
        `;
      })
      .join("");
  }

  function applyMetrics(metrics) {
    const labels = metrics.map((m) => parseTs(m.timestamp));
    const cpu = metrics.map((m) => m.cpu_percent);
    const mem = metrics.map((m) => m.mem_percent);
    const disk = metrics.map((m) => m.disk_percent);

    charts.cpu.data.labels = labels;
    charts.mem.data.labels = labels;
    charts.disk.data.labels = labels;
    charts.cpu.data.datasets[0].data = cpu;
    charts.mem.data.datasets[0].data = mem;
    charts.disk.data.datasets[0].data = disk;

    charts.cpu.update();
    charts.mem.update();
    charts.disk.update();

    const last = metrics[metrics.length - 1];
    if (last) {
      els.cpuNow.textContent = fmtPct(last.cpu_percent);
      els.memNow.textContent = fmtPct(last.mem_percent);
      els.diskNow.textContent = fmtPct(last.disk_percent);
      els.lastUpdated.textContent = `Last updated: ${new Date(last.timestamp).toLocaleString()}`;
    }
  }

  async function tick() {
    try {
      setStatus(true, "Collecting…");
      const collected = await window.OpsVisionApi.collect();
      if (collected && collected.alerts) setAlerts(collected.alerts, collected.metric?.timestamp);

      setStatus(true, "Refreshing charts…");
      const metrics = await window.OpsVisionApi.listMetrics(LIMIT);
      applyMetrics(metrics);

      setStatus(true, "Live");
    } catch (e) {
      console.error(e);
      setStatus(false, "Offline");
      els.alerts.innerHTML = `<div class="muted">Backend not reachable. Start the server and refresh.</div>`;
    }
  }

  els.collectNow.addEventListener("click", tick);

  tick();
  setInterval(tick, REFRESH_MS);
})();

