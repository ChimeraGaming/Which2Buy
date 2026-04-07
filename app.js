(function () {
  const LOCAL_STORAGE_KEY = "which2buy-state-v1";
  const SYSTEMS = window.SystemsData || [];
  const DEVICES = window.DevicesData || [];
  const RULES = window.Rules;

  const systemMap = new Map(SYSTEMS.map((system) => [system.id, system]));
  const deviceMap = new Map(DEVICES.map((device) => [device.id, device]));
  const recommendableDevices = DEVICES.filter((device) => device.available && device.recommendable);
  const elements = {};

  let state = null;
  let latestAnalysis = null;
  let statusTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    state = loadState();
    populateThemeSelect();
    populateCurrentDeviceSelect();
    bindStaticEvents();
    applyStateToControls();
    renderSystemSelector();
    renderSystemCards();
    updateDerivedUi(false);
  }

  function cacheElements() {
    elements.themeSelect = document.getElementById("themeSelect");
    elements.shareButton = document.getElementById("shareButton");
    elements.exportButton = document.getElementById("exportButton");
    elements.quizForm = document.getElementById("quizForm");
    elements.currentDeviceField = document.getElementById("currentDeviceField");
    elements.currentDeviceSelect = document.getElementById("currentDeviceSelect");
    elements.futureProofRange = document.getElementById("futureProofRange");
    elements.futureProofLabel = document.getElementById("futureProofLabel");
    elements.advancedModeToggle = document.getElementById("advancedModeToggle");
    elements.advancedPanel = document.getElementById("advancedPanel");
    elements.systemSelector = document.getElementById("systemSelector");
    elements.systemCards = document.getElementById("systemCards");
    elements.snapshotCards = document.getElementById("snapshotCards");
    elements.resultsContent = document.getElementById("resultsContent");
    elements.resultsSection = document.getElementById("resultsSection");
    elements.saveStatus = document.getElementById("saveStatus");
    elements.osReserveInput = document.getElementById("osReserveInput");
    elements.appReserveInput = document.getElementById("appReserveInput");
    elements.cacheBaseInput = document.getElementById("cacheBaseInput");
    elements.cachePerHundredInput = document.getElementById("cachePerHundredInput");
    elements.safetyBufferInput = document.getElementById("safetyBufferInput");
  }

  function loadState() {
    const defaults = RULES.cloneDefaults();
    const savedState = parseSavedState();
    const urlState = parseUrlState();
    const merged = {
      ...defaults,
      ...savedState,
      ...urlState,
      advanced: {
        ...defaults.advanced,
        ...(savedState.advanced || {}),
        ...(urlState.advanced || {})
      },
      systems: {
        ...(savedState.systems || {}),
        ...(urlState.systems || {})
      }
    };

    if (Array.isArray(urlState.selectedSystems)) {
      merged.selectedSystems = urlState.selectedSystems;
    } else if (Array.isArray(savedState.selectedSystems)) {
      merged.selectedSystems = savedState.selectedSystems;
    }

    return normalizeState(merged);
  }

  function parseSavedState() {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function parseUrlState() {
    try {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get("state");
      return encoded ? JSON.parse(decodeState(encoded)) : {};
    } catch (error) {
      return {};
    }
  }

  function normalizeState(rawState) {
    const normalized = RULES.cloneDefaults();
    const validThemeIds = new Set(RULES.themes.map((theme) => theme.id));
    const validDeviceIds = new Set(DEVICES.map((device) => device.id));
    const validSelected = Array.isArray(rawState.selectedSystems)
      ? rawState.selectedSystems.filter((id, index, array) => systemMap.has(id) && array.indexOf(id) === index)
      : [];

    normalized.theme = validThemeIds.has(rawState.theme) ? rawState.theme : normalized.theme;
    normalized.ownsDevice = rawState.ownsDevice === "yes" ? "yes" : "no";
    normalized.currentDeviceId = validDeviceIds.has(rawState.currentDeviceId) ? rawState.currentDeviceId : "";
    normalized.formFactor = ["horizontal", "clamshell", "no-preference"].includes(rawState.formFactor)
      ? rawState.formFactor
      : normalized.formFactor;
    normalized.futureProofBias = snapRangeValue(rawState.futureProofBias, normalized.futureProofBias);
    normalized.advancedMode = Boolean(rawState.advancedMode);
    normalized.selectedSystems = validSelected;
    normalized.advanced = {
      osReserveGb: clampNumber(rawState.advanced && rawState.advanced.osReserveGb, 8, 64, normalized.advanced.osReserveGb),
      appReserveGb: clampNumber(rawState.advanced && rawState.advanced.appReserveGb, 4, 48, normalized.advanced.appReserveGb),
      cacheBaseGb: clampNumber(rawState.advanced && rawState.advanced.cacheBaseGb, 0, 48, normalized.advanced.cacheBaseGb),
      cachePerHundredGb: clampNumber(rawState.advanced && rawState.advanced.cachePerHundredGb, 0, 32, normalized.advanced.cachePerHundredGb),
      safetyBufferPct: clampNumber(rawState.advanced && rawState.advanced.safetyBufferPct, 20, 35, normalized.advanced.safetyBufferPct)
    };
    normalized.systems = {};

    normalized.selectedSystems.forEach((systemId) => {
      const rawSystemState = rawState.systems && rawState.systems[systemId] ? rawState.systems[systemId] : {};
      normalized.systems[systemId] = normalizeSystemState(systemId, rawSystemState);
    });

    if (normalized.ownsDevice === "no") {
      normalized.currentDeviceId = "";
    }

    return normalized;
  }

  function normalizeSystemState(systemId, rawSystemState) {
    if (systemId === "pc") {
      const rawEntries = Array.isArray(rawSystemState.entries) ? rawSystemState.entries : [];
      const entries = rawEntries.length
        ? rawEntries.map((entry, index) => normalizePcEntry(entry, index))
        : [createPcEntry()];

      return {
        workload: ["indie", "mixed", "demanding"].includes(rawSystemState.workload) ? rawSystemState.workload : "mixed",
        entries
      };
    }

    return {
      count: Math.max(0, Math.round(Number(rawSystemState.count) || 0))
    };
  }

  function normalizePcEntry(rawEntry, index) {
    return {
      id: rawEntry && rawEntry.id ? String(rawEntry.id) : createEntryId(index),
      name: rawEntry && rawEntry.name ? String(rawEntry.name).slice(0, 80) : "",
      sizeGb: rawEntry && rawEntry.sizeGb !== undefined && rawEntry.sizeGb !== null ? String(rawEntry.sizeGb) : ""
    };
  }

  function createPcEntry() {
    return {
      id: createEntryId(Date.now()),
      name: "",
      sizeGb: ""
    };
  }

  function createEntryId(seed) {
    return "pc-" + String(seed) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function bindStaticEvents() {
    document.getElementById("ownershipChoices").addEventListener("change", (event) => {
      const target = event.target;
      if (target.name !== "ownsDevice") {
        return;
      }

      state.ownsDevice = target.value === "yes" ? "yes" : "no";
      if (state.ownsDevice === "no") {
        state.currentDeviceId = "";
      }
      toggleCurrentDeviceField();
      updateDerivedUi(false);
    });

    document.getElementById("formFactorChoices").addEventListener("change", (event) => {
      const target = event.target;
      if (target.name !== "formFactor") {
        return;
      }

      state.formFactor = target.value;
      updateDerivedUi(false);
    });

    elements.currentDeviceSelect.addEventListener("change", (event) => {
      state.currentDeviceId = event.target.value;
      updateDerivedUi(false);
    });

    elements.themeSelect.addEventListener("change", (event) => {
      state.theme = event.target.value;
      applyTheme();
      updateDerivedUi(false);
    });

    elements.futureProofRange.addEventListener("input", (event) => {
      state.futureProofBias = snapRangeValue(event.target.value, state.futureProofBias);
      elements.futureProofLabel.textContent = RULES.futureProofLabel(state.futureProofBias);
      updateDerivedUi(false);
    });

    elements.advancedModeToggle.addEventListener("change", (event) => {
      state.advancedMode = event.target.checked;
      toggleAdvancedPanel();
      updateDerivedUi(false);
    });

    elements.osReserveInput.addEventListener("input", () => handleAdvancedInput("osReserveGb", elements.osReserveInput, 8, 64));
    elements.appReserveInput.addEventListener("input", () => handleAdvancedInput("appReserveGb", elements.appReserveInput, 4, 48));
    elements.cacheBaseInput.addEventListener("input", () => handleAdvancedInput("cacheBaseGb", elements.cacheBaseInput, 0, 48));
    elements.cachePerHundredInput.addEventListener("input", () => handleAdvancedInput("cachePerHundredGb", elements.cachePerHundredInput, 0, 32));
    elements.safetyBufferInput.addEventListener("input", () => handleAdvancedInput("safetyBufferPct", elements.safetyBufferInput, 20, 35));

    elements.systemSelector.addEventListener("click", handleSystemToggle);
    elements.systemCards.addEventListener("input", handleSystemCardInput);
    elements.systemCards.addEventListener("click", handleSystemCardClick);

    elements.shareButton.addEventListener("click", handleShare);
    elements.exportButton.addEventListener("click", handleExport);

    elements.quizForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateDerivedUi(true);
    });
  }

  function populateThemeSelect() {
    elements.themeSelect.innerHTML = RULES.themes
      .map((theme) => `<option value="${theme.id}">${theme.name}</option>`)
      .join("");
  }

  function populateCurrentDeviceSelect() {
    elements.currentDeviceSelect.innerHTML = [
      `<option value="">Select your device</option>`,
      ...DEVICES.map((device) => `<option value="${device.id}">${escapeHtml(device.name)}</option>`)
    ].join("");
  }

  function applyStateToControls() {
    applyTheme();

    const ownsDeviceRadio = document.querySelector(`input[name="ownsDevice"][value="${state.ownsDevice}"]`);
    const formFactorRadio = document.querySelector(`input[name="formFactor"][value="${state.formFactor}"]`);

    if (ownsDeviceRadio) {
      ownsDeviceRadio.checked = true;
    }

    if (formFactorRadio) {
      formFactorRadio.checked = true;
    }

    elements.currentDeviceSelect.value = state.currentDeviceId;
    elements.futureProofRange.value = String(state.futureProofBias);
    elements.futureProofLabel.textContent = RULES.futureProofLabel(state.futureProofBias);
    elements.advancedModeToggle.checked = state.advancedMode;
    elements.osReserveInput.value = String(state.advanced.osReserveGb);
    elements.appReserveInput.value = String(state.advanced.appReserveGb);
    elements.cacheBaseInput.value = String(state.advanced.cacheBaseGb);
    elements.cachePerHundredInput.value = String(state.advanced.cachePerHundredGb);
    elements.safetyBufferInput.value = String(state.advanced.safetyBufferPct);

    toggleCurrentDeviceField();
    toggleAdvancedPanel();
  }

  function applyTheme() {
    document.body.setAttribute("data-theme", state.theme);
    elements.themeSelect.value = state.theme;
  }

  function toggleCurrentDeviceField() {
    elements.currentDeviceField.hidden = state.ownsDevice !== "yes";
    if (state.ownsDevice !== "yes") {
      elements.currentDeviceSelect.value = "";
    }
  }

  function toggleAdvancedPanel() {
    elements.advancedPanel.hidden = !state.advancedMode;
  }

  function handleAdvancedInput(key, inputElement, min, max) {
    state.advanced[key] = clampNumber(inputElement.value, min, max, state.advanced[key]);
    updateDerivedUi(false);
  }

  function handleSystemToggle(event) {
    const button = event.target.closest("[data-system-toggle]");
    if (!button) {
      return;
    }

    const systemId = button.getAttribute("data-system-toggle");
    const selectedIndex = state.selectedSystems.indexOf(systemId);

    if (selectedIndex >= 0) {
      state.selectedSystems.splice(selectedIndex, 1);
      delete state.systems[systemId];
    } else {
      state.selectedSystems.push(systemId);
      state.systems[systemId] = normalizeSystemState(systemId, {});
    }

    renderSystemSelector();
    renderSystemCards();
    updateDerivedUi(false);
  }

  function handleSystemCardInput(event) {
    const target = event.target;
    const role = target.getAttribute("data-role");
    const systemId = target.getAttribute("data-system-id");

    if (!role || !systemId || !state.systems[systemId]) {
      return;
    }

    if (role === "system-count") {
      state.systems[systemId].count = Math.max(0, Math.round(Number(target.value) || 0));
      refreshCardSummaries();
      updateDerivedUi(false);
      return;
    }

    if (role === "pc-workload") {
      state.systems.pc.workload = ["indie", "mixed", "demanding"].includes(target.value) ? target.value : "mixed";
      updateDerivedUi(false);
      return;
    }

    if (role === "pc-name" || role === "pc-size") {
      const entryId = target.getAttribute("data-entry-id");
      const entry = state.systems.pc.entries.find((row) => row.id === entryId);
      if (!entry) {
        return;
      }

      if (role === "pc-name") {
        entry.name = target.value.slice(0, 80);
      } else {
        entry.sizeGb = target.value;
      }

      refreshCardSummaries();
      updateDerivedUi(false);
    }
  }

  function handleSystemCardClick(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.getAttribute("data-action");

    if (action === "add-pc-row" && state.systems.pc) {
      state.systems.pc.entries.push(createPcEntry());
      renderSystemCards();
      updateDerivedUi(false);
      return;
    }

    if (action === "remove-pc-row" && state.systems.pc) {
      const entryId = actionTarget.getAttribute("data-entry-id");
      state.systems.pc.entries = state.systems.pc.entries.filter((entry) => entry.id !== entryId);
      if (!state.systems.pc.entries.length) {
        state.systems.pc.entries.push(createPcEntry());
      }
      renderSystemCards();
      updateDerivedUi(false);
    }
  }

  async function handleShare() {
    const shareUrl = buildShareUrl();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Share link copied");
    } catch (error) {
      setStatus("Copy failed");
    }
  }

  function handleExport() {
    if (!latestAnalysis || !latestAnalysis.hasActiveLibrary) {
      setStatus("Nothing to export yet");
      return;
    }

    const text = buildExportText(latestAnalysis);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "which2buy-results.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Results exported");
  }

  function renderSystemSelector() {
    elements.systemSelector.innerHTML = SYSTEMS.map((system) => {
      const selectedClass = state.selectedSystems.includes(system.id) ? " is-selected" : "";
      return `<button class="system-chip${selectedClass}" type="button" data-system-toggle="${system.id}">${escapeHtml(system.name)}</button>`;
    }).join("");
  }

  function renderSystemCards() {
    if (!state.selectedSystems.length) {
      elements.systemCards.innerHTML = `
        <div class="inline-note">
          No systems selected yet. Pick a few systems above and the matching library cards will show up here.
        </div>
      `;
      return;
    }

    elements.systemCards.innerHTML = state.selectedSystems.map((systemId) => {
      const system = systemMap.get(systemId);
      const systemState = state.systems[systemId];

      if (!system || !systemState) {
        return "";
      }

      if (system.specialHandling === "pc") {
        return renderPcCard(systemState);
      }

      return renderStandardSystemCard(system, systemState);
    }).join("");

    refreshCardSummaries();
  }
  function renderStandardSystemCard(system, systemState) {
    return `
      <article class="system-card" data-system-card="${system.id}">
        <div class="system-card-header">
          <div class="system-card-meta">
            <h3>${escapeHtml(system.name)}</h3>
            <div class="pill-row">
              <span class="pill">${escapeHtml(capitalize(system.performanceTier))} workload</span>
              ${system.dualScreenWeight ? `<span class="pill is-accent">Dual-screen relevant</span>` : ""}
            </div>
          </div>
          <div class="stat-box">
            <span class="stat-label">Total Range</span>
            <span class="stat-value" data-live="system-total" data-system-id="${system.id}">0GB</span>
          </div>
        </div>
        <div class="system-card-grid">
          <label class="field">
            <span>Game count</span>
            <input
              type="number"
              min="0"
              step="1"
              value="${systemState.count}"
              data-role="system-count"
              data-system-id="${system.id}"
            >
          </label>
          <div class="stat-box">
            <span class="stat-label">Per Game</span>
            <span class="stat-value">${formatRange(system.lowGb, system.highGb)}</span>
            <div class="number-muted">Average ${formatSize(system.avgGb)}</div>
          </div>
          <div class="stat-box">
            <span class="stat-label">Average Total</span>
            <span class="stat-value" data-live="system-avg" data-system-id="${system.id}">0GB</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderPcCard(pcState) {
    const rows = pcState.entries.map((entry, index) => `
      <div class="pc-row">
        <div class="pc-row-grid">
          <label class="field">
            <span>PC game ${index + 1}</span>
            <input
              type="text"
              placeholder="Optional name"
              value="${escapeHtml(entry.name)}"
              data-role="pc-name"
              data-system-id="pc"
              data-entry-id="${entry.id}"
            >
          </label>
          <label class="field">
            <span>Size (GB)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Required"
              value="${escapeHtml(entry.sizeGb)}"
              data-role="pc-size"
              data-system-id="pc"
              data-entry-id="${entry.id}"
            >
          </label>
          <button class="mini-button" type="button" data-action="remove-pc-row" data-entry-id="${entry.id}">Remove</button>
        </div>
      </div>
    `).join("");

    return `
      <article class="system-card" data-system-card="pc">
        <div class="system-card-header">
          <div class="system-card-meta">
            <h3>PC</h3>
            <div class="pill-row">
              <span class="pill">Actual install sizes</span>
              <span class="pill is-accent">No averages</span>
            </div>
          </div>
          <div class="stat-box">
            <span class="stat-label">Total Install Size</span>
            <span class="stat-value" data-live="pc-total">0GB</span>
          </div>
        </div>
        <div class="field">
          <label for="pcWorkloadSelect">PC workload</label>
          <select id="pcWorkloadSelect" data-role="pc-workload" data-system-id="pc">
            <option value="indie" ${pcState.workload === "indie" ? "selected" : ""}>Mostly indies</option>
            <option value="mixed" ${pcState.workload === "mixed" ? "selected" : ""}>Mixed library</option>
            <option value="demanding" ${pcState.workload === "demanding" ? "selected" : ""}>Demanding 3D library</option>
          </select>
        </div>
        <div class="inline-note">
          PC sizes vary widely. Enter actual install sizes for accuracy. The workload preset keeps the performance advice honest.
        </div>
        <div class="pc-rows">
          ${rows}
        </div>
        <div class="pc-controls">
          <button class="mini-button" type="button" data-action="add-pc-row">Add PC Game</button>
          <span class="number-muted" data-live="pc-count">0 games counted</span>
        </div>
      </article>
    `;
  }

  function refreshCardSummaries() {
    state.selectedSystems.forEach((systemId) => {
      const system = systemMap.get(systemId);
      const systemState = state.systems[systemId];

      if (!system || !systemState) {
        return;
      }

      if (system.specialHandling === "pc") {
        const pcStats = getPcStats(systemState);
        const totalElement = elements.systemCards.querySelector('[data-live="pc-total"]');
        const countElement = elements.systemCards.querySelector('[data-live="pc-count"]');

        if (totalElement) {
          totalElement.textContent = formatSize(pcStats.totalGb);
        }

        if (countElement) {
          countElement.textContent = `${pcStats.entries.length} game${pcStats.entries.length === 1 ? "" : "s"} counted`;
        }

        return;
      }

      const totalElement = elements.systemCards.querySelector(`[data-live="system-total"][data-system-id="${systemId}"]`);
      const avgElement = elements.systemCards.querySelector(`[data-live="system-avg"][data-system-id="${systemId}"]`);
      const lowTotal = systemState.count * system.lowGb;
      const avgTotal = systemState.count * system.avgGb;
      const highTotal = systemState.count * system.highGb;

      if (totalElement) {
        totalElement.textContent = formatRange(lowTotal, highTotal);
      }

      if (avgElement) {
        avgElement.textContent = formatSize(avgTotal);
      }
    });
  }

  function updateDerivedUi(scrollToResults) {
    latestAnalysis = analyzeState();
    renderSnapshot(latestAnalysis);
    renderResults(latestAnalysis);
    persistState();

    if (scrollToResults && latestAnalysis.hasActiveLibrary) {
      elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function analyzeState() {
    const breakdown = [];

    state.selectedSystems.forEach((systemId) => {
      const system = systemMap.get(systemId);
      const systemState = state.systems[systemId];

      if (!system || !systemState) {
        return;
      }

      if (system.specialHandling === "pc") {
        const pcStats = getPcStats(systemState);
        if (!pcStats.entries.length || pcStats.totalGb <= 0) {
          return;
        }

        const pcProfile = getPcWorkloadProfile(systemState.workload, pcStats.totalGb, pcStats.entries.length);
        breakdown.push({
          id: system.id,
          name: system.name,
          type: "pc",
          count: pcStats.entries.length,
          effectiveCount: Math.max(pcStats.entries.length, Math.round(pcStats.totalGb / 60) || 1),
          lowTotal: pcStats.totalGb,
          avgTotal: pcStats.totalGb,
          highTotal: pcStats.totalGb,
          lowPerGame: null,
          avgPerGame: null,
          highPerGame: null,
          performanceTier: pcProfile.performanceTier,
          performanceWeight: pcProfile.performanceWeight,
          computeRank: pcProfile.computeRank,
          usageBand: RULES.usageBand(Math.max(pcStats.entries.length, Math.round(pcStats.totalGb / 40))),
          workloadLabel: pcProfile.label,
          dualScreenWeight: 0,
          entries: pcStats.entries
        });
        return;
      }

      const count = Math.max(0, Math.round(Number(systemState.count) || 0));
      if (!count) {
        return;
      }

      breakdown.push({
        id: system.id,
        name: system.name,
        type: "system",
        count,
        effectiveCount: count,
        lowTotal: count * system.lowGb,
        avgTotal: count * system.avgGb,
        highTotal: count * system.highGb,
        lowPerGame: system.lowGb,
        avgPerGame: system.avgGb,
        highPerGame: system.highGb,
        performanceTier: system.performanceTier,
        performanceWeight: system.performanceWeight,
        computeRank: RULES.tierRankFromId(system.performanceTier),
        usageBand: RULES.usageBand(count),
        workloadLabel: capitalize(system.performanceTier),
        dualScreenWeight: system.dualScreenWeight || 0
      });
    });

    const storage = analyzeStorage(breakdown);
    const performance = analyzePerformance(breakdown);
    const scoring = scoreDevices(breakdown, storage, performance);
    const dualScreenNeed = calculateDualScreenNeed(breakdown);
    const currentComparison = state.ownsDevice === "yes" && state.currentDeviceId
      ? compareCurrentDevice(deviceMap.get(state.currentDeviceId), scoring.recommended, performance, storage, dualScreenNeed)
      : null;

    return {
      hasActiveLibrary: breakdown.length > 0,
      breakdown,
      storage,
      performance,
      scoring,
      currentComparison,
      dualScreenNeed,
      headlineSystems: getHeadlineSystems(breakdown),
      keepCurrent: Boolean(currentComparison && currentComparison.shouldKeepCurrent)
    };
  }

  function analyzeStorage(breakdown) {
    const libraryTotals = breakdown.reduce((totals, entry) => {
      totals.low += entry.lowTotal;
      totals.avg += entry.avgTotal;
      totals.high += entry.highTotal;
      return totals;
    }, { low: 0, avg: 0, high: 0 });

    const osReserve = state.advanced.osReserveGb;
    const appReserve = state.advanced.appReserveGb;
    const cacheBase = state.advanced.cacheBaseGb;
    const cachePerHundred = state.advanced.cachePerHundredGb;
    const safetyBase = state.advanced.safetyBufferPct;
    const safetyLow = RULES.clamp(safetyBase + RULES.storageThresholds.minimumLikelySafetyShift, 20, 35);
    const safetyHigh = RULES.clamp(safetyBase + RULES.storageThresholds.comfortableUpperSafetyShift, 20, 35);

    const cacheLow = cacheBase + ((libraryTotals.low / 100) * cachePerHundred * 0.8);
    const cacheAvg = cacheBase + ((libraryTotals.avg / 100) * cachePerHundred);
    const cacheHigh = cacheBase + ((libraryTotals.high / 100) * cachePerHundred * 1.1);

    const minimumLikely = (libraryTotals.low + osReserve + appReserve + cacheLow) * (1 + (safetyLow / 100));
    const expectedAverage = (libraryTotals.avg + osReserve + appReserve + cacheAvg) * (1 + (safetyBase / 100));
    const comfortableUpper = (libraryTotals.high + osReserve + appReserve + cacheHigh) * (1 + (safetyHigh / 100));

    return {
      libraryTotals,
      reserves: {
        osReserve,
        appReserve,
        cacheLow,
        cacheAvg,
        cacheHigh,
        safetyLow,
        safetyBase,
        safetyHigh
      },
      minimumLikely,
      expectedAverage,
      comfortableUpper
    };
  }

  function analyzePerformance(breakdown) {
    if (!breakdown.length) {
      return {
        computeFloorRank: 1,
        minimumRamRank: 1,
        recommendedRamRank: 1,
        minimumRam: RULES.getTierByRank(1).ram,
        recommendedRam: RULES.getTierByRank(1).ram,
        ramScore: 1,
        bumpReasons: [],
        futureProofBump: false
      };
    }

    let computeFloorRank = 1;
    let ramScoreTotal = 0;
    let ramScoreWeight = 0;
    let peakPressure = 0;
    const bumpReasons = [];

    breakdown.forEach((entry) => {
      const adjustedComputeRank = entry.usageBand === "edge" && entry.computeRank === 4 ? 3 : entry.computeRank;
      computeFloorRank = Math.max(computeFloorRank, adjustedComputeRank);

      const roleIntensity = getRoleIntensity(entry.usageBand);
      const scale = RULES.libraryScale(entry.effectiveCount);
      const effectiveRamScore = 1 + ((entry.performanceWeight - 1) * roleIntensity);
      ramScoreTotal += effectiveRamScore * scale;
      ramScoreWeight += scale;
    });

    const ramScore = ramScoreWeight ? (ramScoreTotal / ramScoreWeight) : 1;
    const minimumRamRank = RULES.ramTierRankFromScore(ramScore);
    const minimumTierWeight = getTierWeightByRank(minimumRamRank);

    breakdown.forEach((entry) => {
      const pressure = Math.max(0, entry.performanceWeight - minimumTierWeight)
        * RULES.usageWeight(entry.usageBand)
        * RULES.libraryScale(entry.effectiveCount);

      if (pressure > peakPressure) {
        peakPressure = pressure;
      }

      if (pressure > RULES.performanceThresholds.bumpPressure) {
        bumpReasons.push(entry);
      }
    });

    let recommendedRamRank = minimumRamRank;
    let futureProofBump = false;

    if (peakPressure > RULES.performanceThresholds.bumpPressure) {
      recommendedRamRank += 1;
    }

    if (state.futureProofBias >= 75 && minimumRamRank < 4 && isNearNextRamThreshold(ramScore, minimumRamRank)) {
      recommendedRamRank += 1;
      futureProofBump = true;
    }

    recommendedRamRank = RULES.clamp(recommendedRamRank, minimumRamRank, 4);

    return {
      computeFloorRank,
      minimumRamRank,
      recommendedRamRank,
      minimumRam: RULES.getTierByRank(minimumRamRank).ram,
      recommendedRam: RULES.getTierByRank(recommendedRamRank).ram,
      ramScore,
      bumpReasons: dedupeEntriesById(bumpReasons),
      futureProofBump
    };
  }

  function scoreDevices(breakdown, storage, performance) {
    const dualScreenNeed = calculateDualScreenNeed(breakdown);
    const budgetWeight = (100 - state.futureProofBias) / 100;
    const futureWeight = state.futureProofBias / 100;

    const scored = recommendableDevices.map((device) => {
      const strengths = [];
      const cautions = [];
      let score = 0;

      const computeDelta = device.computeRank - performance.computeFloorRank;
      if (computeDelta < 0) {
        score -= 130 + (Math.abs(computeDelta) * 35);
        cautions.push("Falls below the performance floor for your heaviest systems.");
      } else if (computeDelta === 0) {
        score += 42;
        strengths.push("Matches the performance floor.");
      } else {
        score += (computeDelta === 1 ? 28 : 22) + (futureWeight * 12) - (budgetWeight * Math.max(0, computeDelta - 1) * 6);
        strengths.push(computeDelta === 1 ? "Adds useful performance headroom." : "Carries a lot of performance headroom.");
        if (computeDelta > 1 && budgetWeight > 0.55) {
          cautions.push("Carries more performance than your library strictly needs.");
        }
      }

      const ramDeltaFromRecommended = device.ram - performance.recommendedRam;
      if (ramDeltaFromRecommended >= 0) {
        score += 34 - Math.min(12, ramDeltaFromRecommended / 2);
        strengths.push(device.ram === performance.recommendedRam ? "Lines up with the recommended RAM tier." : "Keeps extra RAM headroom.");
      } else if (device.ram >= performance.minimumRam) {
        score += 10;
        cautions.push("Meets the minimum RAM tier, but not the recommended tier.");
      } else {
        score -= 95;
        cautions.push("Drops below the minimum RAM tier.");
      }

      if (device.storage >= storage.comfortableUpper) {
        score += 28;
        strengths.push("Internal storage covers the comfortable upper estimate.");
      } else if (device.storage >= storage.expectedAverage) {
        score += 16;
        cautions.push("Average use fits internally, but the upper range may lean on a card.");
      } else if (device.storage >= storage.minimumLikely) {
        score += 8;
        cautions.push("Meets the likely minimum, but you will manage installs sooner.");
      } else {
        score -= 30;
        cautions.push("Internal storage falls short of the likely minimum.");
      }

      if (state.formFactor === "horizontal") {
        if (device.formFactor === "horizontal") {
          score += 12;
          strengths.push("Matches your horizontal preference.");
        } else {
          score -= 6;
          cautions.push("Misses your preferred form factor.");
        }
      }

      if (state.formFactor === "clamshell") {
        if (device.formFactor === "clamshell") {
          score += 18;
          strengths.push("Matches your clamshell preference.");
        } else {
          score -= 8;
          cautions.push("Misses your preferred form factor.");
        }
      }

      if (dualScreenNeed > 0.15) {
        if (device.dualScreen) {
          score += 18 * dualScreenNeed;
          strengths.push("Dual screens help your DS or 3DS mix.");
        } else {
          score -= 10 * dualScreenNeed;
          cautions.push("A second screen would help for DS or 3DS.");
        }
      }

      score += (6 - device.priceIndex) * 6 * budgetWeight;

      if (device.positioning === "balanced" && budgetWeight > 0.45 && performance.computeFloorRank === 3) {
        score += 6;
      }

      if (device.positioning === "premium" && futureWeight > 0.65) {
        score += 8;
      }

      if (device.positioning === "dual-screen" && state.formFactor === "clamshell") {
        score += 6;
      }

      const meetsMinimumCore = device.computeRank >= performance.computeFloorRank && device.ram >= performance.minimumRam;
      const meetsRecommendedCore = meetsMinimumCore && device.ram >= performance.recommendedRam;

      return {
        device,
        score,
        strengths: dedupeStrings(strengths).slice(0, 4),
        cautions: dedupeStrings(cautions).slice(0, 4),
        meetsMinimumCore,
        meetsRecommendedCore
      };
    }).sort((left, right) => right.score - left.score);

    const recommendedPool = scored.filter((item) => item.meetsRecommendedCore);
    const minimumPool = scored.filter((item) => item.meetsMinimumCore);
    const bestPool = recommendedPool.length ? recommendedPool : minimumPool.length ? minimumPool : scored;
    const recommended = bestPool[0] || null;

    return {
      scored,
      recommended,
      budgetAlternative: getBudgetAlternative(recommended, minimumPool.length ? minimumPool : scored),
      futureProofOption: getFutureProofOption(recommended, minimumPool.length ? minimumPool : scored, performance.computeFloorRank),
      topCandidates: (minimumPool.length ? minimumPool : scored).slice(0, 3)
    };
  }

  function compareCurrentDevice(currentDevice, recommendedCandidate, performance, storage, dualScreenNeed) {
    if (!currentDevice || !recommendedCandidate) {
      return null;
    }

    const minimumFit = currentDevice.computeRank >= performance.computeFloorRank
      && currentDevice.ram >= performance.minimumRam;
    const recommendedFit = currentDevice.computeRank >= performance.computeFloorRank
      && currentDevice.ram >= performance.recommendedRam
      && currentDevice.storage >= storage.expectedAverage;

    let improvementScore = Math.max(0, recommendedCandidate.device.computeRank - currentDevice.computeRank) * 2;
    if ((recommendedCandidate.device.ram - currentDevice.ram) >= 4) {
      improvementScore += 1;
    }
    if ((recommendedCandidate.device.storage - currentDevice.storage) >= 128) {
      improvementScore += 1;
    }
    if (state.formFactor !== "no-preference" && currentDevice.formFactor !== state.formFactor && recommendedCandidate.device.formFactor === state.formFactor) {
      improvementScore += 1;
    }
    if (!currentDevice.dualScreen && recommendedCandidate.device.dualScreen && dualScreenNeed > 0.35) {
      improvementScore += 1;
    }

    let classification = "sidegrade";
    if (recommendedFit && improvementScore <= 1) {
      classification = "not worth upgrading";
    } else if (!minimumFit && improvementScore >= 4) {
      classification = "major upgrade";
    } else if (improvementScore >= 2) {
      classification = "moderate upgrade";
    }

    if (minimumFit && recommendedFit && state.formFactor === "no-preference") {
      classification = "not worth upgrading";
    }

    return {
      currentDevice,
      recommendedDevice: recommendedCandidate.device,
      classification,
      minimumFit,
      recommendedFit,
      shouldKeepCurrent: classification === "not worth upgrading",
      explanation: buildComparisonExplanation(currentDevice, recommendedCandidate.device, classification, minimumFit, recommendedFit)
    };
  }

  function buildComparisonExplanation(currentDevice, recommendedDevice, classification, minimumFit, recommendedFit) {
    if (classification === "not worth upgrading") {
      return `${currentDevice.name} already covers your current needs well enough. Any gain from ${recommendedDevice.name} is smaller than the cost unless you want a different form factor or more headroom on purpose.`;
    }

    if (classification === "major upgrade") {
      return `${recommendedDevice.name} is a clear step up in both capability and headroom. Your current ${currentDevice.name} misses enough of the performance or RAM target that the jump is meaningful.`;
    }

    if (classification === "moderate upgrade") {
      return `${recommendedDevice.name} gives you useful headroom over ${currentDevice.name}, but the jump is more about comfort and flexibility than a complete class change.`;
    }

    if (minimumFit && !recommendedFit) {
      return `${currentDevice.name} is still workable, but ${recommendedDevice.name} better matches the recommended tier and storage comfort target.`;
    }

    return `${recommendedDevice.name} changes the experience more in shape or comfort than raw capability.`;
  }
  function renderSnapshot(analysis) {
    if (!analysis.hasActiveLibrary) {
      elements.snapshotCards.innerHTML = `
        <div class="snapshot-card">
          <div class="summary-card-top">
            <h3>Waiting for library input</h3>
            <span class="mini-tag">Live</span>
          </div>
          <div class="result-copy">
            Select systems and enter game counts or PC sizes. The snapshot will update as you type.
          </div>
        </div>
      `;
      return;
    }

    const recommendedName = analysis.keepCurrent && analysis.currentComparison
      ? `Keep ${analysis.currentComparison.currentDevice.name}`
      : analysis.scoring.recommended.device.name;
    const computeLabel = RULES.getTierByRank(analysis.performance.computeFloorRank).label;
    const ramLabel = RULES.getTierByRank(analysis.performance.recommendedRamRank).shortLabel;

    elements.snapshotCards.innerHTML = `
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>Best Fit</h3>
          <span class="mini-tag is-accent">Live</span>
        </div>
        <div class="kpi">${escapeHtml(recommendedName)}</div>
        <div class="result-copy">Based on your current inputs, this is the cleanest fit without overspending on unused headroom.</div>
      </div>
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>RAM Target</h3>
          <span class="mini-tag">${escapeHtml(ramLabel)}</span>
        </div>
        <div class="kpi">${analysis.performance.recommendedRam}GB</div>
        <div class="result-copy">Minimum acceptable is ${analysis.performance.minimumRam}GB.</div>
      </div>
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>Storage Upper</h3>
          <span class="mini-tag">${formatSize(analysis.storage.comfortableUpper)}</span>
        </div>
        <div class="kpi">${formatSize(analysis.storage.expectedAverage)}</div>
        <div class="result-copy">Expected average with reserves. Comfortable upper is ${formatSize(analysis.storage.comfortableUpper)}.</div>
      </div>
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>Performance Floor</h3>
          <span class="mini-tag">${escapeHtml(computeLabel)}</span>
        </div>
        <div class="kpi">${escapeHtml(getComputeFloorLabel(analysis.performance.computeFloorRank))}</div>
        <div class="result-copy">This is driven by your heaviest systems, not by average use alone.</div>
      </div>
    `;
  }

  function renderResults(analysis) {
    if (!analysis.hasActiveLibrary || !analysis.scoring.recommended) {
      elements.resultsContent.innerHTML = `
        <div class="empty-state">
          Pick a few systems and enter your library details to generate a recommendation.
        </div>
      `;
      return;
    }

    const recommendedCandidate = analysis.scoring.recommended;
    const recommendedDevice = recommendedCandidate.device;
    const displayDevice = analysis.keepCurrent && analysis.currentComparison
      ? analysis.currentComparison.currentDevice
      : recommendedDevice;
    const recommendedTitle = analysis.keepCurrent && analysis.currentComparison
      ? `Keep your current ${analysis.currentComparison.currentDevice.name}`
      : recommendedDevice.name;
    const recommendedBody = analysis.keepCurrent && analysis.currentComparison
      ? `${analysis.currentComparison.currentDevice.name} already covers your current needs well enough. If you still want to buy a new device, ${recommendedDevice.name} is the closest current fit.`
      : buildRecommendedBody(analysis, recommendedCandidate);
    const performancePercent = getHeadroomPercent(displayDevice.computeRank, analysis.performance.computeFloorRank);
    const ramPercent = getFitPercent(displayDevice.ram, analysis.performance.recommendedRam);
    const storagePercent = getFitPercent(displayDevice.storage, analysis.storage.comfortableUpper);

    elements.resultsContent.innerHTML = `
      <div class="scorecard-story">
        <section class="story-hero">
          <div class="story-hero-grid">
            <div class="story-hero-copy">
              <p class="story-kicker">AYN Scorecard</p>
              <h3 class="story-title">${escapeHtml(recommendedTitle)}</h3>
              <p class="story-lead">${escapeHtml(buildStoryHeadline(analysis, recommendedCandidate, displayDevice))}</p>
              <div class="story-chip-row">
                <span class="story-chip story-chip-accent">${escapeHtml(displayDevice.family || displayDevice.name)}</span>
                <span class="story-chip">${displayDevice.formFactor === "clamshell" ? "Clamshell" : "Horizontal"}</span>
                <span class="story-chip">${displayDevice.ram}GB RAM</span>
                <span class="story-chip">${displayDevice.storage}GB storage</span>
              </div>
            </div>
            <div class="story-burst">
              <span class="story-burst-label">Fit Score</span>
              <strong class="story-burst-value">${Math.round(recommendedCandidate.score)}</strong>
              <span class="story-burst-copy">${escapeHtml(buildStoryStamp(analysis))}</span>
            </div>
          </div>
        </section>

        <section class="story-metric-strip">
          ${renderStoryMetricCard("Recommended RAM", `${analysis.performance.recommendedRam}GB`, buildRamExplanation(analysis.performance))}
          ${renderStoryMetricCard("Minimum RAM", `${analysis.performance.minimumRam}GB`, "This is the lowest tier that still makes sense.")}
              ${renderStoryMetricCard("Expected Storage", formatSize(analysis.storage.expectedAverage), buildStorageNote(analysis.storage))}
              ${renderStoryMetricCard("Comfortable Upper", formatSize(analysis.storage.comfortableUpper), `${formatSize(analysis.storage.minimumLikely)} is the likely minimum.`)}
        </section>

        <section class="story-panel">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Focus</p>
              <h3>Why this wins</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">Best fit</span>
              <span class="story-chip">${escapeHtml(getComputeFloorLabel(analysis.performance.computeFloorRank))}</span>
            </div>
          </div>
          <div class="story-columns">
            <div class="story-copy-stack">
              <p class="story-body">${escapeHtml(recommendedBody)}</p>
              <div class="story-list">
                ${buildWhyThisFits(analysis).map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
              </div>
            </div>
            <div class="story-meter-grid">
              ${renderStoryMeterCard("Performance headroom", performancePercent, `The device clears a ${getComputeFloorLabel(analysis.performance.computeFloorRank).toLowerCase()} requirement.`)}
              ${renderStoryMeterCard("RAM fit", ramPercent, `Target is ${analysis.performance.recommendedRam}GB. Minimum acceptable is ${analysis.performance.minimumRam}GB.`)}
              ${renderStoryMeterCard("Storage comfort", storagePercent, `Comfort target is ${formatSize(analysis.storage.comfortableUpper)}.`)}
            </div>
          </div>
        </section>

        <section class="story-panel">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Loadout</p>
              <h3>Library loadout</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">${analysis.breakdown.length} active systems</span>
            </div>
          </div>
          <div class="story-breakdown-grid">
            ${analysis.breakdown.map(renderStoryBreakdownCard).join("")}
          </div>
        </section>

        ${analysis.currentComparison ? renderStoryComparisonPanel(analysis.currentComparison) : ""}

        ${buildBumpedSection(analysis)}

        <section class="story-panel">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Options</p>
              <h3>Other lanes</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">Honest alternatives</span>
            </div>
          </div>
          <div class="story-choice-grid">
            ${renderStoryChoiceCard("Budget Alternative", analysis.scoring.budgetAlternative, "The cheaper fit that still clears your minimum floor.")}
            ${renderStoryChoiceCard("Future Proof Option", analysis.scoring.futureProofOption, "Extra headroom if you want more breathing room than the strict fit requires.")}
          </div>
        </section>

        <section class="story-panel">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Finish</p>
              <h3>Leaderboard</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">Top current fits</span>
            </div>
          </div>
          <div class="story-rank-grid">
            ${analysis.scoring.topCandidates.map((candidate, index) => renderStoryRankCard(candidate, index)).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function buildRecommendedBody(analysis, recommendedCandidate) {
    const systemSummary = analysis.headlineSystems.join(", ");
    const storageSummary = `your expected storage lands around ${formatSize(analysis.storage.expectedAverage)}`;
    const ramSummary = `the recommended RAM tier is ${analysis.performance.recommendedRam}GB`;
    return `${recommendedCandidate.device.name} lands on top because it fits ${systemSummary || "your selected mix"}, ${storageSummary}, and ${ramSummary} without drifting too far into overkill.`;
  }

  function buildStoryHeadline(analysis, recommendedCandidate, displayDevice) {
    if (analysis.keepCurrent && analysis.currentComparison) {
      return `${displayDevice.name} already matches your real library well enough. The tool does not see a strong reason to spend more unless you want a different shape or extra headroom on purpose.`;
    }

    return `${recommendedCandidate.device.name} clears the hard requirements for ${analysis.headlineSystems.join(", ") || "your setup"} and still keeps the recommendation honest.`;
  }

  function buildStoryStamp(analysis) {
    if (analysis.keepCurrent) {
      return "No rush to upgrade";
    }

    if (state.futureProofBias >= 70) {
      return "Leans future proof";
    }

    if (state.futureProofBias <= 30) {
      return "Leans budget";
    }

    return "Balanced pick";
  }

  function renderStoryMetricCard(label, value, copy) {
    return `
      <article class="story-metric-card">
        <span class="story-metric-label">${escapeHtml(label)}</span>
        <strong class="story-metric-value">${escapeHtml(value)}</strong>
        <p class="story-metric-copy">${escapeHtml(copy)}</p>
      </article>
    `;
  }

  function renderStoryMeterCard(label, percent, copy) {
    return `
      <article class="story-meter-card">
        <div class="story-meter-head">
          <span>${escapeHtml(label)}</span>
          <strong>${Math.round(percent)}%</strong>
        </div>
        <div class="story-meter-track">
          <span class="story-meter-fill" style="width:${Math.round(percent)}%"></span>
        </div>
        <p class="story-meter-copy">${escapeHtml(copy)}</p>
      </article>
    `;
  }

  function renderStoryBreakdownCard(entry) {
    if (entry.type === "pc") {
      return `
        <article class="story-breakdown-card">
          <span class="story-breakdown-label">PC</span>
          <h4>${escapeHtml(entry.workloadLabel)}</h4>
          <strong class="story-breakdown-total">${formatSize(entry.avgTotal)}</strong>
          <p class="story-breakdown-copy">${entry.count} games counted with actual install sizes.</p>
        </article>
      `;
    }

    return `
      <article class="story-breakdown-card">
        <span class="story-breakdown-label">${escapeHtml(entry.name)}</span>
        <h4>${entry.count} games</h4>
        <strong class="story-breakdown-total">${formatRange(entry.lowTotal, entry.highTotal)}</strong>
        <p class="story-breakdown-copy">${formatRange(entry.lowPerGame, entry.highPerGame)} each.</p>
      </article>
    `;
  }

  function renderStoryComparisonPanel(comparison) {
    return `
      <section class="story-panel">
        <div class="story-panel-heading">
          <div>
            <p class="story-step">Current</p>
            <h3>Current device check</h3>
          </div>
          <div class="story-chip-row">
            <span class="story-chip">${escapeHtml(capitalizeWords(comparison.classification))}</span>
          </div>
        </div>
        <div class="story-choice-grid">
          <article class="story-choice-card">
            <span class="story-choice-label">Current</span>
            <h4>${escapeHtml(comparison.currentDevice.name)}</h4>
            <div class="story-chip-row">
              <span class="story-chip">${comparison.currentDevice.ram}GB RAM</span>
              <span class="story-chip">${comparison.currentDevice.storage}GB storage</span>
            </div>
          </article>
          <article class="story-choice-card story-choice-card-accent">
            <span class="story-choice-label">Recommended</span>
            <h4>${escapeHtml(comparison.recommendedDevice.name)}</h4>
            <div class="story-chip-row">
              <span class="story-chip">${comparison.recommendedDevice.ram}GB RAM</span>
              <span class="story-chip">${comparison.recommendedDevice.storage}GB storage</span>
            </div>
          </article>
        </div>
        <p class="story-body">${escapeHtml(comparison.explanation)}</p>
      </section>
    `;
  }

  function renderStoryChoiceCard(title, candidate, subtitle) {
    if (!candidate) {
      return "";
    }

    return `
      <article class="story-choice-card">
        <span class="story-choice-label">${escapeHtml(title)}</span>
        <h4>${escapeHtml(candidate.device.name)}</h4>
        <div class="story-chip-row">
          <span class="story-chip story-chip-accent">${candidate.device.ram}GB RAM</span>
          <span class="story-chip">${candidate.device.storage}GB storage</span>
        </div>
        <p class="story-choice-copy">${escapeHtml(subtitle)}</p>
        <div class="story-list compact-story-list">
          ${candidate.strengths.slice(0, 2).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
          ${candidate.cautions.slice(0, 1).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
        </div>
      </article>
    `;
  }

  function renderStoryRankCard(candidate, index) {
    return `
      <article class="story-rank-card">
        <div class="story-rank-head">
          <span class="story-rank-index">0${index + 1}</span>
          <strong class="story-rank-score">${Math.round(candidate.score)}</strong>
        </div>
        <h4>${escapeHtml(candidate.device.name)}</h4>
        <div class="story-chip-row">
          <span class="story-chip">${candidate.device.ram}GB RAM</span>
          <span class="story-chip">${candidate.device.storage}GB storage</span>
        </div>
        <p class="story-rank-copy">${escapeHtml(candidate.strengths[0] || "Solid overall fit.")}</p>
      </article>
    `;
  }

  function buildRamExplanation(performance) {
    const recommendedTier = RULES.getTierByRank(performance.recommendedRamRank);
    const minimumTier = RULES.getTierByRank(performance.minimumRamRank);
    if (performance.recommendedRamRank === performance.minimumRamRank) {
      return `${recommendedTier.label} is the honest fit for the library you entered. There was not enough borderline pressure to justify a higher RAM recommendation.`;
    }

    return `${minimumTier.label} is the lowest tier that still makes sense, but ${recommendedTier.label} is safer because one or more heavier systems pushed the recommendation up.`;
  }

  function buildStorageNote(storage) {
    const maxCurrentStorage = Math.max(...recommendableDevices.map((device) => device.storage));
    if (storage.comfortableUpper > maxCurrentStorage) {
      return "Your comfortable upper estimate is larger than the biggest current internal option. Plan on using a card or rotating installs even on the top storage variants.";
    }

    if (storage.expectedAverage > 512) {
      return "This library is large enough that higher storage variants make sense. Lower storage models can still work, but you will lean on external storage much sooner.";
    }

    return "These numbers already include OS room, app reserve, cache growth, and a safety buffer. They are meant to reflect real use, not a bare minimum spreadsheet fit.";
  }

  function buildWhyThisFits(analysis) {
    const lines = [];
    const computeFloor = getComputeFloorLabel(analysis.performance.computeFloorRank);
    const selectedSystemText = analysis.headlineSystems.length
      ? `Your heaviest systems are ${analysis.headlineSystems.join(", ")}, which sets a ${computeFloor.toLowerCase()} performance floor.`
      : `Your system mix sets a ${computeFloor.toLowerCase()} performance floor.`;

    lines.push(selectedSystemText);
    lines.push(`The storage model points to ${formatSize(analysis.storage.expectedAverage)} as the expected average and ${formatSize(analysis.storage.comfortableUpper)} as the comfortable upper range.`);
    lines.push(`The RAM model lands on ${analysis.performance.recommendedRam}GB, with ${analysis.performance.minimumRam}GB as the minimum acceptable tier.`);

    if (state.formFactor === "clamshell") {
      lines.push("Your clamshell preference gets real weight, but only after the device clears the performance and RAM floor.");
    } else if (state.formFactor === "horizontal") {
      lines.push("Your horizontal preference helps break ties, but it does not override hard requirements.");
    }

    if (state.futureProofBias >= 70) {
      lines.push("You leaned toward future proofing, so the scoring gives a little more credit to useful headroom when the fit is close.");
    } else if (state.futureProofBias <= 30) {
      lines.push("You leaned toward budget, so the scoring is stricter about paying for headroom you may never use.");
    }

    return lines;
  }

  function buildBumpedSection(analysis) {
    const bumpNames = analysis.performance.bumpReasons.map((entry) => entry.name);
    const recommendedTier = RULES.getTierByRank(analysis.performance.recommendedRamRank).shortLabel;
    const minimumTier = RULES.getTierByRank(analysis.performance.minimumRamRank).shortLabel;

    if (!bumpNames.length && !analysis.performance.futureProofBump) {
      return "";
    }

    const reasons = [];
    if (bumpNames.length) {
      reasons.push(`${formatJoinedList(bumpNames)} pushed the recommendation above the minimum tier.`);
      reasons.push(`Without ${formatJoinedList(bumpNames)}, you would stay closer to the ${minimumTier} tier instead of the ${recommendedTier} tier.`);
    }

    if (analysis.performance.futureProofBump) {
      reasons.push("Your future proofing preference also kept the recommendation on the safer side of a close call.");
    }

    return `
      <section class="story-panel story-panel-contrast">
        <div class="story-panel-heading">
          <div>
            <p class="story-step">Bump</p>
            <h3>Why it got bumped</h3>
          </div>
        </div>
        <div class="story-list">
          ${reasons.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
        </div>
      </section>
    `;
  }

  function renderBreakdownCard(entry) {
    if (entry.type === "pc") {
      return `
        <div class="breakdown-card">
          <h3>${escapeHtml(entry.name)}</h3>
          <div class="tag-row">
            <span class="tag">${entry.count} games</span>
            <span class="tag is-accent">${escapeHtml(entry.workloadLabel)}</span>
          </div>
          <div class="breakdown-copy">Actual install total: ${formatSize(entry.avgTotal)}.</div>
        </div>
      `;
    }

    return `
      <div class="breakdown-card">
        <h3>${escapeHtml(entry.name)}</h3>
        <div class="tag-row">
          <span class="tag">${entry.count} games</span>
          <span class="tag">${formatRange(entry.lowPerGame, entry.highPerGame)} each</span>
        </div>
        <div class="breakdown-copy">Total range: ${formatRange(entry.lowTotal, entry.highTotal)}.</div>
      </div>
    `;
  }

  function renderCandidateCard(title, candidate, subtitle) {
    if (!candidate) {
      return "";
    }

    return `
      <div class="candidate-card">
        <div class="candidate-row">
          <div>
            <h3>${escapeHtml(title)}</h3>
            <div class="tag-row">
              <span class="tag is-accent">${escapeHtml(candidate.device.name)}</span>
              <span class="tag">${candidate.device.ram}GB RAM</span>
              <span class="tag">${candidate.device.storage}GB storage</span>
            </div>
          </div>
        </div>
        <div class="candidate-copy">${escapeHtml(subtitle)}</div>
        <div class="list-lines">
          ${candidate.strengths.slice(0, 2).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
          ${candidate.cautions.slice(0, 1).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
        </div>
      </div>
    `;
  }

  function renderScoreSnapshot(candidate) {
    return `
      <div class="candidate-card">
        <div class="candidate-row">
          <div>
            <h3>${escapeHtml(candidate.device.name)}</h3>
            <div class="mini-meta">
              <span class="mini-tag">${candidate.device.ram}GB</span>
              <span class="mini-tag">${candidate.device.storage}GB</span>
            </div>
          </div>
          <div class="candidate-score">${Math.round(candidate.score)}</div>
        </div>
        <div class="list-lines">
          ${candidate.strengths.slice(0, 2).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
          ${candidate.cautions.slice(0, 1).map((item) => `<div>${escapeHtml(item)}</div>`).join("")}
        </div>
      </div>
    `;
  }

  function getBudgetAlternative(recommended, pool) {
    if (!pool.length) {
      return recommended;
    }

    const sorted = [...pool].sort((left, right) => {
      if (left.device.priceIndex !== right.device.priceIndex) {
        return left.device.priceIndex - right.device.priceIndex;
      }
      return right.score - left.score;
    });

    return sorted.find((candidate) => !recommended || candidate.device.id !== recommended.device.id) || sorted[0];
  }

  function getFutureProofOption(recommended, pool, computeFloorRank) {
    if (!pool.length) {
      return recommended;
    }

    const sorted = [...pool].sort((left, right) => {
      const leftValue = (left.device.computeRank * 100) + (left.device.ram * 5) + left.device.storage;
      const rightValue = (right.device.computeRank * 100) + (right.device.ram * 5) + right.device.storage;

      if (leftValue !== rightValue) {
        return rightValue - leftValue;
      }

      return right.score - left.score;
    });

    const futureProof = sorted.find((candidate) => candidate.device.computeRank >= computeFloorRank && (!recommended || candidate.device.id !== recommended.device.id));
    return futureProof || sorted[0];
  }

  function getPcStats(pcState) {
    const entries = pcState.entries
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        sizeGb: Number(entry.sizeGb) || 0
      }))
      .filter((entry) => entry.sizeGb > 0);

    return {
      entries,
      totalGb: entries.reduce((total, entry) => total + entry.sizeGb, 0)
    };
  }

  function getPcWorkloadProfile(workload, totalGb, count) {
    const profiles = {
      indie: { label: "Mostly indies", performanceTier: "mid", performanceWeight: 2.2, computeRank: 2 },
      mixed: { label: "Mixed library", performanceTier: "high", performanceWeight: 3.3, computeRank: 3 },
      demanding: { label: "Demanding 3D library", performanceTier: "enthusiast", performanceWeight: 4.6, computeRank: 4 }
    };

    const profile = profiles[workload] || profiles.mixed;

    if (profile.computeRank === 4 && count <= 2 && totalGb < 100) {
      return {
        ...profile,
        performanceWeight: 4.0,
        computeRank: 3,
        performanceTier: "high",
        label: "Demanding 3D library"
      };
    }

    return profile;
  }

  function calculateDualScreenNeed(breakdown) {
    const weight = breakdown.reduce((total, entry) => total + ((entry.dualScreenWeight || 0) * entry.count), 0);
    return RULES.clamp(weight / 20, 0, 1);
  }

  function getHeadlineSystems(breakdown) {
    return [...breakdown]
      .sort((left, right) => (right.performanceWeight * right.count) - (left.performanceWeight * left.count))
      .slice(0, 3)
      .map((entry) => entry.name);
  }

  function latestOrDefaultPerformance() {
    return latestAnalysis ? latestAnalysis.performance : {
      computeFloorRank: 1,
      minimumRam: 8,
      recommendedRam: 8
    };
  }

  function latestOrDefaultStorage() {
    return latestAnalysis ? latestAnalysis.storage : {
      expectedAverage: 0
    };
  }

  function persistState() {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializeState()));
      setStatus("Saved locally");
    } catch (error) {
      setStatus("Local save failed");
    }
  }

  function serializeState() {
    return {
      theme: state.theme,
      ownsDevice: state.ownsDevice,
      currentDeviceId: state.currentDeviceId,
      formFactor: state.formFactor,
      futureProofBias: state.futureProofBias,
      advancedMode: state.advancedMode,
      selectedSystems: state.selectedSystems,
      advanced: { ...state.advanced },
      systems: state.selectedSystems.reduce((result, systemId) => {
        result[systemId] = state.systems[systemId];
        return result;
      }, {})
    };
  }

  function buildShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("state", encodeState(JSON.stringify(serializeState())));
    return url.toString();
  }

  function buildExportText(analysis) {
    const lines = [];
    const recommendedCandidate = analysis.scoring.recommended;
    const currentSection = analysis.currentComparison
      ? [
        "",
        "Compared to your current device",
        `${analysis.currentComparison.currentDevice.name} vs ${analysis.currentComparison.recommendedDevice.name}`,
        `${capitalizeWords(analysis.currentComparison.classification)}: ${analysis.currentComparison.explanation}`
      ]
      : [];

    lines.push("Which AYN Device Should I Buy?");
    lines.push("");
    lines.push(`Recommended Device: ${analysis.keepCurrent && analysis.currentComparison ? `Keep your current ${analysis.currentComparison.currentDevice.name}` : recommendedCandidate.device.name}`);
    lines.push(`Estimated RAM Need: ${analysis.performance.recommendedRam}GB recommended, ${analysis.performance.minimumRam}GB minimum acceptable`);
    lines.push(`Estimated Storage Need: ${formatSize(analysis.storage.minimumLikely)} minimum likely, ${formatSize(analysis.storage.expectedAverage)} expected average, ${formatSize(analysis.storage.comfortableUpper)} comfortable upper`);
    lines.push("");
    lines.push("System Breakdown");

    analysis.breakdown.forEach((entry) => {
      if (entry.type === "pc") {
        lines.push(`- ${entry.name}: ${entry.count} games, actual install total ${formatSize(entry.avgTotal)}`);
      } else {
        lines.push(`- ${entry.name}: ${entry.count} games, ${formatRange(entry.lowPerGame, entry.highPerGame)} each, total ${formatRange(entry.lowTotal, entry.highTotal)}`);
      }
    });

    lines.push("");
    lines.push("Why This Fits");
    buildWhyThisFits(analysis).forEach((line) => lines.push(`- ${line}`));

    if (analysis.performance.bumpReasons.length || analysis.performance.futureProofBump) {
      lines.push("");
      lines.push("Why It Got Bumped");
      if (analysis.performance.bumpReasons.length) {
        lines.push(`- ${formatJoinedList(analysis.performance.bumpReasons.map((entry) => entry.name))} pushed the recommendation above the minimum tier.`);
      }
      if (analysis.performance.futureProofBump) {
        lines.push("- Your future proofing preference also kept the recommendation on the safer side of a close call.");
      }
    }

    lines.push("");
    lines.push(`Budget Alternative: ${analysis.scoring.budgetAlternative ? analysis.scoring.budgetAlternative.device.name : "None"}`);
    lines.push(`Future Proof Option: ${analysis.scoring.futureProofOption ? analysis.scoring.futureProofOption.device.name : "None"}`);
    lines.push(...currentSection);

    return lines.join("\n");
  }

  function setStatus(message) {
    elements.saveStatus.textContent = message;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      elements.saveStatus.textContent = "";
    }, 1800);
  }

  function getHeadroomPercent(actualRank, requiredRank) {
    if (actualRank < requiredRank) {
      return RULES.clamp(22 - ((requiredRank - actualRank) * 12), 6, 100);
    }

    return RULES.clamp(56 + ((actualRank - requiredRank) * 18), 6, 100);
  }

  function getFitPercent(actualValue, targetValue) {
    if (!targetValue || targetValue <= 0) {
      return 100;
    }

    return RULES.clamp((actualValue / targetValue) * 100, 6, 100);
  }

  function encodeState(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function decodeState(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  function snapRangeValue(value, fallback) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return fallback;
    }
    return RULES.clamp(Math.round(numeric / 5) * 5, 0, 100);
  }

  function clampNumber(value, min, max, fallback) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return fallback;
    }
    return RULES.clamp(Math.round(numeric), min, max);
  }

  function getRoleIntensity(usageBand) {
    if (usageBand === "primary") {
      return 1;
    }

    if (usageBand === "secondary") {
      return 0.72;
    }

    if (usageBand === "edge") {
      return 0.38;
    }

    return 0;
  }

  function getTierWeightByRank(rank) {
    const map = {
      1: 1.0,
      2: 2.2,
      3: 3.4,
      4: 4.8
    };

    return map[rank] || 1.0;
  }

  function isNearNextRamThreshold(score, currentRank) {
    const nextThresholds = {
      1: RULES.performanceThresholds.ramFloorLight,
      2: RULES.performanceThresholds.ramFloorMid,
      3: RULES.performanceThresholds.ramFloorHigh
    };

    const nextThreshold = nextThresholds[currentRank];
    if (!nextThreshold) {
      return false;
    }

    return (nextThreshold - score) <= 0.18;
  }

  function getComputeFloorLabel(rank) {
    const labels = {
      1: "Light floor",
      2: "Mid floor",
      3: "High floor",
      4: "Enthusiast floor"
    };

    return labels[rank] || "Light floor";
  }

  function formatSize(valueGb) {
    if (!Number.isFinite(valueGb) || valueGb <= 0) {
      return "0GB";
    }

    if (valueGb < 0.1) {
      return `${Math.max(1, Math.round(valueGb * 1024))}MB`;
    }

    if (valueGb < 1) {
      return `${valueGb.toFixed(2)}GB`;
    }

    if (valueGb < 10) {
      return `${valueGb.toFixed(1)}GB`;
    }

    return `${Math.round(valueGb)}GB`;
  }

  function formatRange(lowGb, highGb) {
    if (Math.abs(lowGb - highGb) < 0.05) {
      return formatSize(highGb);
    }

    return `${formatSize(lowGb)} to ${formatSize(highGb)}`;
  }

  function formatJoinedList(values) {
    if (!values.length) {
      return "";
    }

    if (values.length === 1) {
      return values[0];
    }

    if (values.length === 2) {
      return `${values[0]} and ${values[1]}`;
    }

    return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function capitalizeWords(value) {
    return value
      .split(" ")
      .map((word) => capitalize(word))
      .join(" ");
  }

  function dedupeEntriesById(entries) {
    const seen = new Set();
    return entries.filter((entry) => {
      if (seen.has(entry.id)) {
        return false;
      }
      seen.add(entry.id);
      return true;
    });
  }

  function dedupeStrings(values) {
    return values.filter((value, index) => values.indexOf(value) === index);
  }
})();
