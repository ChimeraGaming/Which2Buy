(function () {
  const APP_VERSION = "v.5.6.0";
  const LOCAL_STORAGE_KEY = "which2buy-state-v1";
  const FIT_SCORE_WEIGHTS = {
    performance: 35,
    ram: 25,
    storage: 20,
    value: 10,
    preference: 10
  };
  const FIT_SCORE_INFO = buildFitScoreInfo();
  const SYSTEMS = window.SystemsData || [];
  const DEVICES = window.DevicesData || [];
  const RULES = window.Rules;

  const systemMap = new Map(SYSTEMS.map((system) => [system.id, system]));
  const deviceMap = new Map(DEVICES.map((device) => [device.id, device]));
  const brandMap = new Map((RULES.brands || []).map((brand) => [brand.id, brand]));
  const ownedDevicesByBrand = RULES.ownedDevicesByBrand || {};
  const ownedDeviceCompareProfiles = RULES.ownedDeviceCompareProfiles || {};
  const useCaseLaneProfiles = RULES.useCaseLaneProfiles || {};
  const recommendableDevices = DEVICES.filter((device) => device.available && device.recommendable);
  const elements = {};
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function getValidPrice(device) {
    return device && Number.isFinite(device.priceUsd) && device.priceUsd > 0
      ? device.priceUsd
      : null;
  }

  function getPriceContext(devices) {
    const prices = devices
      .map((device) => getValidPrice(device))
      .filter((price) => price !== null);

    if (!prices.length) {
      return {
        min: 0,
        max: 0,
        span: 0
      };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
      min,
      max,
      span: Math.max(1, max - min)
    };
  }

  function getPriceAffordability(device, priceContext) {
    const price = getValidPrice(device);
    if (price === null || !priceContext.span) {
      return 0.5;
    }

    return RULES.clamp(1 - ((price - priceContext.min) / priceContext.span), 0, 1);
  }

  let state = null;
  let latestAnalysis = null;
  let statusTimer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    enhanceFormSections();
    state = loadState();
    populateThemeSelect();
    populateFormatSelect();
    populateUseCaseLaneSelect();
    populateBrandPreferenceSelect();
    populateCurrentBrandSelect();
    populateCurrentDeviceSelect();
    bindStaticEvents();
    applyStateToControls();
    renderSystemSelector();
    renderSystemCards();
    updateDerivedUi(false);
  }

  function cacheElements() {
    elements.themeSelect = document.getElementById("themeSelect");
    elements.formatSelect = document.getElementById("formatSelect");
    elements.shareButton = document.getElementById("shareButton");
    elements.exportButton = document.getElementById("exportButton");
    elements.quizForm = document.getElementById("quizForm");
    elements.ownsDeviceToggle = document.getElementById("ownsDeviceToggle");
    elements.currentDeviceField = document.getElementById("currentDeviceField");
    elements.currentBrandSelect = document.getElementById("currentBrandSelect");
    elements.currentBrandDeviceField = document.getElementById("currentBrandDeviceField");
    elements.currentDeviceSelect = document.getElementById("currentDeviceSelect");
    elements.currentOwnershipNotice = document.getElementById("currentOwnershipNotice");
    elements.useCaseLaneSelect = document.getElementById("useCaseLaneSelect");
    elements.formFactorSimpleSelect = document.getElementById("formFactorSimpleSelect");
    elements.brandPreferenceSelect = document.getElementById("brandPreferenceSelect");
    elements.preferencePoolNote = document.getElementById("preferencePoolNote");
    elements.sdCardToggle = document.getElementById("sdCardToggle");
    elements.sdCardDetails = document.getElementById("sdCardDetails");
    elements.sdCardSizeField = document.getElementById("sdCardSizeField");
    elements.sdCardSizeSelect = document.getElementById("sdCardSizeSelect");
    elements.futureProofRange = document.getElementById("futureProofRange");
    elements.futureProofLabel = document.getElementById("futureProofLabel");
    elements.advancedModeToggle = document.getElementById("advancedModeToggle");
    elements.advancedPanel = document.getElementById("advancedPanel");
    elements.systemSelector = document.getElementById("systemSelector");
    elements.systemLaneNote = document.getElementById("systemLaneNote");
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
    const validFormatIds = new Set(RULES.formats.map((format) => format.id));
    const validLaneIds = new Set((RULES.useCaseLanes || []).map((lane) => lane.id));
    const validBrandIds = new Set((RULES.brands || []).map((brand) => brand.id));
    const validSelected = Array.isArray(rawState.selectedSystems)
      ? rawState.selectedSystems.filter((id, index, array) => systemMap.has(id) && array.indexOf(id) === index)
      : [];

    normalized.theme = validThemeIds.has(rawState.theme) ? rawState.theme : normalized.theme;
    const normalizedFormat = rawState.format === "properties" ? "simple" : rawState.format;
    normalized.format = validFormatIds.has(normalizedFormat) ? normalizedFormat : normalized.format;
    normalized.useCaseLane = validLaneIds.has(rawState.useCaseLane) ? rawState.useCaseLane : normalized.useCaseLane;
    const validPreferenceBrandIds = new Set(["any", ...getPreferredBrandOptions(normalized.useCaseLane, normalized.formFactor).map((brand) => brand.id)]);
    normalized.ownsDevice = rawState.ownsDevice === "yes" ? "yes" : "no";
    normalized.currentBrand = validBrandIds.has(rawState.currentBrand) ? rawState.currentBrand : normalized.currentBrand;
    normalized.currentDeviceId = getOwnedDeviceOptions(normalized.currentBrand).some((device) => device.id === rawState.currentDeviceId)
      ? rawState.currentDeviceId
      : "";
    normalized.brandPreference = validPreferenceBrandIds.has(rawState.brandPreference) ? rawState.brandPreference : normalized.brandPreference;
    normalized.formFactor = ["horizontal", "vertical", "clamshell", "no-preference"].includes(rawState.formFactor)
      ? rawState.formFactor
      : normalized.formFactor;
    normalized.useSdCard = rawState.useSdCard === "yes" ? "yes" : "no";
    normalized.sdCardSizeGb = normalizeSdCardSize(rawState.sdCardSizeGb, normalized.sdCardSizeGb);
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
      normalized.currentBrand = "";
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
    elements.ownsDeviceToggle.addEventListener("change", (event) => {
      state.ownsDevice = event.target.checked ? "yes" : "no";
      if (state.ownsDevice === "no") {
        state.currentBrand = "";
        state.currentDeviceId = "";
        elements.currentBrandSelect.value = "";
      }
      populateCurrentDeviceSelect();
      toggleCurrentDeviceField();
      updateDerivedUi(false);
    });

    elements.currentBrandSelect.addEventListener("change", (event) => {
      const previousBrand = state.currentBrand;
      state.currentBrand = event.target.value;
      if (state.currentBrand !== previousBrand) {
        state.currentDeviceId = "";
      }
      populateCurrentDeviceSelect();
      toggleCurrentDeviceField();
      updateDerivedUi(false);
    });

    elements.formFactorSimpleSelect.addEventListener("change", (event) => {
      state.formFactor = event.target.value;
      const validPreferenceBrandIds = new Set(["any", ...getPreferredBrandOptions(state.useCaseLane, state.formFactor).map((brand) => brand.id)]);
      if (!validPreferenceBrandIds.has(state.brandPreference)) {
        state.brandPreference = "any";
      }
      populateBrandPreferenceSelect(state.useCaseLane, state.formFactor);
      elements.brandPreferenceSelect.value = state.brandPreference;
      updateDerivedUi(false);
    });

    elements.useCaseLaneSelect.addEventListener("change", (event) => {
      state.useCaseLane = event.target.value;
      const validPreferenceBrandIds = new Set(["any", ...getPreferredBrandOptions(state.useCaseLane, state.formFactor).map((brand) => brand.id)]);
      if (!validPreferenceBrandIds.has(state.brandPreference)) {
        state.brandPreference = "any";
      }
      populateBrandPreferenceSelect(state.useCaseLane, state.formFactor);
      elements.brandPreferenceSelect.value = state.brandPreference;
      updateDerivedUi(false);
    });

    elements.brandPreferenceSelect.addEventListener("change", (event) => {
      state.brandPreference = event.target.value;
      updateDerivedUi(false);
    });

    elements.sdCardToggle.addEventListener("change", (event) => {
      state.useSdCard = event.target.checked ? "yes" : "no";
      toggleSdCardField();
      updateDerivedUi(false);
    });

    elements.currentDeviceSelect.addEventListener("change", (event) => {
      state.currentDeviceId = event.target.value;
      updateDerivedUi(false);
    });

    elements.sdCardSizeSelect.addEventListener("change", (event) => {
      state.sdCardSizeGb = normalizeSdCardSize(event.target.value, state.sdCardSizeGb);
      updateDerivedUi(false);
    });

    elements.themeSelect.addEventListener("change", (event) => {
      state.theme = event.target.value;
      applyTheme();
      updateDerivedUi(false);
    });

    elements.formatSelect.addEventListener("change", (event) => {
      state.format = event.target.value;
      applyFormat();
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
    const groupedThemes = RULES.themeGroups.map((group) => {
      const options = RULES.themes
        .filter((theme) => theme.group === group.id)
        .map((theme) => `<option value="${theme.id}">${escapeHtml(theme.name)}</option>`)
        .join("");

      if (!options) {
        return "";
      }

      return `<optgroup label="${escapeHtml(group.name)}">${options}</optgroup>`;
    }).join("");

    elements.themeSelect.innerHTML = groupedThemes;
  }

  function populateFormatSelect() {
    elements.formatSelect.innerHTML = RULES.formats
      .map((format) => `<option value="${format.id}">${escapeHtml(format.name)}</option>`)
      .join("");
  }

  function populateUseCaseLaneSelect() {
    elements.useCaseLaneSelect.innerHTML = (RULES.useCaseLanes || [])
      .map((lane) => `<option value="${lane.id}">${escapeHtml(lane.name)}</option>`)
      .join("");
  }

  function populateBrandPreferenceSelect(useCaseLaneId, formFactor) {
    elements.brandPreferenceSelect.innerHTML = [
      `<option value="any">Any brand</option>`,
      ...getPreferredBrandOptions(useCaseLaneId, formFactor).map((brand) => `<option value="${brand.id}">${escapeHtml(brand.name)}</option>`)
    ].join("");
  }

  function populateCurrentBrandSelect() {
    elements.currentBrandSelect.innerHTML = [
      `<option value="">Select your brand</option>`,
      ...(RULES.brands || []).map((brand) => `<option value="${brand.id}">${escapeHtml(brand.name)}</option>`)
    ].join("");
  }

  function populateCurrentDeviceSelect() {
    const currentBrandDevices = getOwnedDeviceOptions(state ? state.currentBrand : "");
    const placeholder = state && state.currentBrand ? `Select your ${escapeHtml(getBrandName(state.currentBrand))} device` : "Select your brand first";
    elements.currentDeviceSelect.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...currentBrandDevices
        .map((device) => `<option value="${device.id}">${escapeHtml(device.name)}</option>`)
    ].join("");
  }

  function applyStateToControls() {
    applyTheme();
    applyFormat();

    const sdCardRadio = document.querySelector(`input[name="useSdCard"][value="${state.useSdCard}"]`);

    if (elements.ownsDeviceToggle) {
      elements.ownsDeviceToggle.checked = state.ownsDevice === "yes";
    }

    elements.currentBrandSelect.value = state.currentBrand;
    populateCurrentDeviceSelect();

    if (elements.formFactorSimpleSelect) {
      elements.formFactorSimpleSelect.value = state.formFactor;
    }

    if (elements.useCaseLaneSelect) {
      elements.useCaseLaneSelect.value = state.useCaseLane;
    }

    populateBrandPreferenceSelect(state.useCaseLane, state.formFactor);

    if (elements.brandPreferenceSelect) {
      elements.brandPreferenceSelect.value = state.brandPreference;
    }

    if (sdCardRadio) {
      sdCardRadio.checked = true;
    }

    if (elements.sdCardToggle) {
      elements.sdCardToggle.checked = state.useSdCard === "yes";
    }

    elements.currentDeviceSelect.value = state.currentDeviceId;
    elements.sdCardSizeSelect.value = String(state.sdCardSizeGb);
    elements.futureProofRange.value = String(state.futureProofBias);
    elements.futureProofLabel.textContent = RULES.futureProofLabel(state.futureProofBias);
    elements.advancedModeToggle.checked = state.advancedMode;
    elements.osReserveInput.value = String(state.advanced.osReserveGb);
    elements.appReserveInput.value = String(state.advanced.appReserveGb);
    elements.cacheBaseInput.value = String(state.advanced.cacheBaseGb);
    elements.cachePerHundredInput.value = String(state.advanced.cachePerHundredGb);
    elements.safetyBufferInput.value = String(state.advanced.safetyBufferPct);

    toggleCurrentDeviceField();
    toggleSdCardField();
    toggleAdvancedPanel();
  }

  function applyTheme() {
    document.body.setAttribute("data-theme", state.theme);
    elements.themeSelect.value = state.theme;
  }

  function applyFormat() {
    document.body.setAttribute("data-format", state.format);
    elements.formatSelect.value = state.format;
    syncSectionFolds();
  }

  function enhanceFormSections() {
    if (!elements.quizForm) {
      return;
    }

    const sectionBlocks = Array.from(elements.quizForm.querySelectorAll(":scope > .section-block"));
    sectionBlocks.forEach((block) => {
      if (block.querySelector(":scope > .section-fold")) {
        return;
      }

      const heading = block.querySelector(":scope > .section-heading");
      if (!heading) {
        return;
      }

      const fold = document.createElement("details");
      fold.className = "section-fold";
      fold.open = true;

      const summary = document.createElement("summary");
      summary.className = "section-summary";
      summary.innerHTML = heading.innerHTML;

      const body = document.createElement("div");
      body.className = "section-body";

      Array.from(block.children).forEach((child) => {
        if (child !== heading) {
          body.appendChild(child);
        }
      });

      block.innerHTML = "";
      fold.appendChild(summary);
      fold.appendChild(body);
      block.appendChild(fold);

      fold.addEventListener("toggle", () => {
        if (state && state.format === "simple" && fold.open) {
          collapseOtherSectionFolds(fold);
        }
      });
    });
  }

  function collapseOtherSectionFolds(activeFold) {
    if (!elements.quizForm) {
      return;
    }

    elements.quizForm.querySelectorAll(".section-fold").forEach((fold) => {
      if (fold !== activeFold) {
        fold.open = false;
      }
    });
  }

  function syncSectionFolds() {
    if (!elements.quizForm) {
      return;
    }

    const folds = Array.from(elements.quizForm.querySelectorAll(".section-fold"));
    if (state.format !== "simple") {
      folds.forEach((fold) => {
        fold.open = true;
      });
      return;
    }

    let foundOpenFold = false;
    folds.forEach((fold) => {
      if (fold.open && !foundOpenFold) {
        foundOpenFold = true;
        return;
      }

      fold.open = false;
    });
  }

  function toggleCurrentDeviceField() {
    elements.currentDeviceField.hidden = state.ownsDevice !== "yes";
    if (state.ownsDevice !== "yes") {
      elements.currentBrandSelect.value = "";
      elements.currentDeviceSelect.value = "";
      elements.currentBrandDeviceField.hidden = true;
      elements.currentOwnershipNotice.hidden = true;
      return;
    }

    if (!state.currentBrand) {
      elements.currentBrandDeviceField.hidden = true;
      elements.currentOwnershipNotice.hidden = true;
      return;
    }

    const brandName = getBrandName(state.currentBrand);
    const deviceLabel = elements.currentBrandDeviceField.querySelector("label");
    elements.currentBrandDeviceField.hidden = false;
    elements.currentOwnershipNotice.hidden = !state.currentDeviceId || deviceMap.has(state.currentDeviceId);

    if (deviceLabel) {
      deviceLabel.textContent = `Current ${brandName} device`;
    }
  }

  function toggleAdvancedPanel() {
    const isVisible = Boolean(state.advancedMode);
    elements.advancedPanel.hidden = !isVisible;
    elements.advancedPanel.style.display = isVisible ? "grid" : "none";
    elements.advancedPanel.setAttribute("aria-hidden", String(!isVisible));
  }

  function toggleSdCardField() {
    elements.sdCardDetails.hidden = state.useSdCard !== "yes";
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
    const system = systemMap.get(systemId);
    const selectedIndex = state.selectedSystems.indexOf(systemId);

    if (selectedIndex < 0 && system && getSystemLaneSupport(system) === "unsupported") {
      setStatus(`${system.name} sits outside ${getUseCaseLaneName(state.useCaseLane)}.`);
      return;
    }

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

    const text = `\`\`\`\n${buildExportText(latestAnalysis)}\n\`\`\``;
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
    const chips = SYSTEMS.map((system) => {
      const selectedClass = state.selectedSystems.includes(system.id) ? " is-selected" : "";
      const laneSupport = getSystemLaneSupport(system);
      const supportClass = laneSupport === "limited"
        ? " is-limited"
        : laneSupport === "unsupported" && state.selectedSystems.includes(system.id)
          ? " is-conflict"
          : laneSupport === "unsupported"
            ? " is-disabled"
            : "";
      return `<button class="system-chip${selectedClass}${supportClass}" type="button" data-system-toggle="${system.id}" data-lane-support="${laneSupport}">${escapeHtml(system.name)}</button>`;
    }).join("");

    if (state.format === "simple") {
      const selectedSystems = state.selectedSystems.length
        ? state.selectedSystems
          .map((systemId) => systemMap.get(systemId))
          .filter(Boolean)
          .map((system) => {
            const laneSupport = getSystemLaneSupport(system);
            const supportClass = laneSupport === "unsupported" ? " is-conflict" : laneSupport === "limited" ? " is-limited" : "";
            return `<span class="simple-selected-chip${supportClass}">${escapeHtml(system.name)}</span>`;
          })
          .join("")
        : `<span class="simple-system-empty">No systems selected yet.</span>`;

      elements.systemSelector.innerHTML = `
        <div class="simple-system-box">
          <div class="simple-system-selected">${selectedSystems}</div>
          <div class="simple-system-menu">
            <div class="simple-system-label">Select systems</div>
            <div class="simple-system-options">${chips}</div>
          </div>
        </div>
      `;
      updateSystemLaneNote();
      return;
    }

    elements.systemSelector.innerHTML = chips;
    updateSystemLaneNote();
  }

  function renderSystemCards() {
    const laneWarnings = buildSelectedLaneWarnings();
    if (!state.selectedSystems.length) {
      elements.systemCards.innerHTML = `
        <div class="inline-note">
          No systems selected yet. Pick a few systems above and the matching library cards will show up here.
        </div>
      `;
      return;
    }

    if (state.format === "simple") {
      elements.systemCards.innerHTML = `
        ${laneWarnings}
        <div class="simple-library-sheet">
          ${state.selectedSystems.map((systemId) => {
            const system = systemMap.get(systemId);
            const systemState = state.systems[systemId];

            if (!system || !systemState) {
              return "";
            }

            if (system.specialHandling === "pc") {
              return renderSimplePcCard(systemState);
            }

            return renderSimpleStandardSystemCard(system, systemState);
          }).join("")}
        </div>
      `;
      refreshCardSummaries();
      return;
    }

    elements.systemCards.innerHTML = `${laneWarnings}${state.selectedSystems.map((systemId) => {
      const system = systemMap.get(systemId);
      const systemState = state.systems[systemId];

      if (!system || !systemState) {
        return "";
      }

      if (system.specialHandling === "pc") {
        return renderPcCard(systemState);
      }

      return renderStandardSystemCard(system, systemState);
    }).join("")}`;

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

  function renderSimpleStandardSystemCard(system, systemState) {
    return `
      <article class="simple-library-row" data-system-card="${system.id}">
        <div class="simple-library-cell simple-library-system">
          <strong>${escapeHtml(system.name)}</strong>
          <span class="simple-library-note">${escapeHtml(capitalize(system.performanceTier))} tier${system.dualScreenWeight ? " | Dual screen" : ""}</span>
        </div>
        <label class="field simple-inline-field">
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
        <div class="simple-inline-stat">
          <span class="simple-inline-label">Per Game</span>
          <strong class="simple-inline-value">${formatRange(system.lowGb, system.highGb)}</strong>
          <span class="number-muted">Avg ${formatSize(system.avgGb)}</span>
        </div>
        <div class="simple-inline-stat">
          <span class="simple-inline-label">Total Range</span>
          <strong class="simple-inline-value" data-live="system-total" data-system-id="${system.id}">0GB</strong>
        </div>
        <div class="simple-inline-stat">
          <span class="simple-inline-label">Average Total</span>
          <strong class="simple-inline-value" data-live="system-avg" data-system-id="${system.id}">0GB</strong>
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

  function renderSimplePcCard(pcState) {
    const rows = pcState.entries.map((entry, index) => `
      <div class="simple-pc-entry">
        <span class="simple-pc-entry-label">PC game ${index + 1}</span>
        <input
          type="text"
          placeholder="Optional name"
          value="${escapeHtml(entry.name)}"
          data-role="pc-name"
          data-system-id="pc"
          data-entry-id="${entry.id}"
        >
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="Size GB"
          value="${escapeHtml(entry.sizeGb)}"
          data-role="pc-size"
          data-system-id="pc"
          data-entry-id="${entry.id}"
        >
        <button class="mini-button" type="button" data-action="remove-pc-row" data-entry-id="${entry.id}">Remove</button>
      </div>
    `).join("");

    return `
      <article class="simple-library-row simple-library-row-pc" data-system-card="pc">
        <div class="simple-library-cell simple-library-system">
          <strong>PC</strong>
          <span class="simple-library-note">Actual install sizes only</span>
        </div>
        <label class="field simple-inline-field">
          <span>Workload</span>
          <select data-role="pc-workload" data-system-id="pc">
            <option value="indie" ${pcState.workload === "indie" ? "selected" : ""}>Mostly indies</option>
            <option value="mixed" ${pcState.workload === "mixed" ? "selected" : ""}>Mixed library</option>
            <option value="demanding" ${pcState.workload === "demanding" ? "selected" : ""}>Demanding 3D library</option>
          </select>
        </label>
        <div class="simple-inline-stat">
          <span class="simple-inline-label">Total Install</span>
          <strong class="simple-inline-value" data-live="pc-total">0GB</strong>
        </div>
        <div class="simple-inline-stat">
          <span class="simple-inline-label">Games</span>
          <strong class="simple-inline-value" data-live="pc-count">0 games counted</strong>
        </div>
      </article>
      <div class="simple-pc-sheet">
        <div class="inline-note">PC uses actual install sizes. Enter the real size for each game.</div>
        <div class="simple-pc-rows">
          ${rows}
        </div>
        <div class="pc-controls">
          <button class="mini-button" type="button" data-action="add-pc-row">Add PC Game</button>
        </div>
      </div>
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
    updatePreferencePoolNote();
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

    const fitModel = getActiveFitModel(breakdown);
    const storage = analyzeStorage(breakdown, fitModel);
    const performance = analyzePerformance(breakdown, fitModel);
    const laneSupport = getActiveLaneSupportSummary(breakdown);

    if (laneSupport.blocked.length) {
      return {
        hasActiveLibrary: breakdown.length > 0,
        breakdown,
        fitModel,
        storage,
        performance,
        laneSupport,
        scoring: createEmptyScoring(),
        sdSavingsPaths: [],
        currentComparison: null,
        ownershipNote: buildOwnershipNote(getCurrentComparisonDevice(), null),
        dualScreenNeed: calculateDualScreenNeed(breakdown),
        headlineSystems: getHeadlineSystems(breakdown),
        keepCurrent: false
      };
    }

    const scoring = scoreDevices(breakdown, storage, performance);
    const dualScreenNeed = calculateDualScreenNeed(breakdown);
    const currentOwnedDevice = getCurrentComparisonDevice();
    const currentComparison = currentOwnedDevice && scoring.recommended
      ? compareCurrentDevice(currentOwnedDevice, scoring.recommended, performance, storage, dualScreenNeed)
      : null;
    const ownershipNote = buildOwnershipNote(currentOwnedDevice, currentComparison);
    const sdSavingsPaths = findSdSavingsPaths(breakdown, storage, performance, scoring);

    return {
      hasActiveLibrary: breakdown.length > 0,
      breakdown,
      fitModel,
      storage,
      performance,
      laneSupport,
      scoring,
      sdSavingsPaths,
      currentComparison,
      ownershipNote,
      dualScreenNeed,
      headlineSystems: getHeadlineSystems(breakdown),
      keepCurrent: Boolean(currentComparison && currentComparison.shouldKeepCurrent)
    };
  }

  function getActiveFitModel(breakdown) {
    if (!breakdown.length) {
      return "default";
    }

    if (state.useCaseLane === "retro-focused") {
      return "retro-lite";
    }

    if (breakdown.some((entry) => entry.type === "pc")) {
      return "default";
    }

    const excludedIds = new Set(["android", "switch", "wii-u", "ps3", "xbox"]);
    if (breakdown.some((entry) => excludedIds.has(entry.id))) {
      return "default";
    }

    const highestRank = Math.max(...breakdown.map((entry) => entry.computeRank));
    return highestRank <= 2 ? "retro-lite" : "default";
  }

  function getFitModelProfile(fitModel) {
    const defaultProfile = useCaseLaneProfiles.default || {};
    const retroProfile = useCaseLaneProfiles["retro-focused"] || {};
    return fitModel === "retro-lite"
      ? { ...defaultProfile, ...retroProfile }
      : defaultProfile;
  }

  function getRamTargetByRank(rank, fitModel) {
    const fitProfile = getFitModelProfile(fitModel);
    const laneTarget = fitProfile.ramByRank && fitProfile.ramByRank[rank];
    if (Number.isFinite(laneTarget)) {
      return laneTarget;
    }

    return RULES.getTierByRank(rank).ram;
  }

  function formatRamTierLabel(rank, fitModel) {
    return `${getRamTargetByRank(rank, fitModel)}GB`;
  }

  function analyzeStorage(breakdown, fitModel) {
    const libraryTotals = breakdown.reduce((totals, entry) => {
      totals.low += entry.lowTotal;
      totals.avg += entry.avgTotal;
      totals.high += entry.highTotal;
      return totals;
    }, { low: 0, avg: 0, high: 0 });

    const fitProfile = getFitModelProfile(fitModel);
    const reserveScale = fitProfile.reserveScale || {};
    const internalNeed = fitProfile.internalNeed || {};
    const osReserve = state.advanced.osReserveGb * (reserveScale.os || 1);
    const appReserve = state.advanced.appReserveGb * (reserveScale.app || 1);
    const cacheBase = state.advanced.cacheBaseGb * (reserveScale.cacheBase || 1);
    const cachePerHundred = state.advanced.cachePerHundredGb * (reserveScale.cachePerHundred || 1);
    const safetyBase = RULES.clamp(
      state.advanced.safetyBufferPct + (reserveScale.safetyShift || 0),
      reserveScale.safetyMin || 20,
      reserveScale.safetyMax || 35
    );
    const safetyLow = RULES.clamp(
      safetyBase + RULES.storageThresholds.minimumLikelySafetyShift,
      reserveScale.safetyMin || 20,
      reserveScale.safetyMax || 35
    );
    const safetyHigh = RULES.clamp(
      safetyBase + RULES.storageThresholds.comfortableUpperSafetyShift,
      reserveScale.safetyMin || 20,
      reserveScale.safetyMax || 35
    );

    const cacheLow = cacheBase + ((libraryTotals.low / 100) * cachePerHundred * 0.8);
    const cacheAvg = cacheBase + ((libraryTotals.avg / 100) * cachePerHundred);
    const cacheHigh = cacheBase + ((libraryTotals.high / 100) * cachePerHundred * 1.1);
    const sdFriendlyTotals = breakdown.reduce((totals, entry) => {
      if (!isSdFriendlyStorageEntry(entry)) {
        return totals;
      }

      totals.low += entry.lowTotal;
      totals.avg += entry.avgTotal;
      totals.high += entry.highTotal;
      return totals;
    }, { low: 0, avg: 0, high: 0 });

    const minimumLikely = (libraryTotals.low + osReserve + appReserve + cacheLow) * (1 + (safetyLow / 100));
    const expectedAverage = (libraryTotals.avg + osReserve + appReserve + cacheAvg) * (1 + (safetyBase / 100));
    const comfortableUpper = (libraryTotals.high + osReserve + appReserve + cacheHigh) * (1 + (safetyHigh / 100));
    const sdCardSizeGb = state.useSdCard === "yes" ? state.sdCardSizeGb : 0;
    const internalCoreNeed = osReserve
      + appReserve
      + cacheAvg
      + (internalNeed.coreBase || 0)
      + Math.min(internalNeed.coreMax || 24, libraryTotals.avg * (internalNeed.coreFactor || 0.12));
    const internalComfortNeed = osReserve
      + appReserve
      + cacheHigh
      + (internalNeed.comfortBase || 0)
      + Math.min(internalNeed.comfortMax || 32, libraryTotals.high * (internalNeed.comfortFactor || 0.15));

    return {
      fitModel,
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
      sdCardSizeGb,
      sdFriendlyTotals,
      sdFriendlyShare: libraryTotals.avg > 0 ? (sdFriendlyTotals.avg / libraryTotals.avg) : 0,
      internalCoreNeed,
      internalComfortNeed,
      minimumLikely,
      expectedAverage,
      comfortableUpper
    };
  }

  function analyzePerformance(breakdown, fitModel) {
    if (!breakdown.length) {
      return {
        fitModel,
        computeFloorRank: 1,
        minimumRamRank: 1,
        recommendedRamRank: 1,
        minimumRam: getRamTargetByRank(1, fitModel),
        recommendedRam: getRamTargetByRank(1, fitModel),
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
      const performanceUsageBand = getPerformanceUsageBand(entry);
      const performanceScale = getPerformanceUsageScale(entry);
      const adjustedComputeRank = performanceUsageBand === "edge" && entry.computeRank === 4 ? 3 : entry.computeRank;
      computeFloorRank = Math.max(computeFloorRank, adjustedComputeRank);

      const roleIntensity = getRoleIntensity(performanceUsageBand);
      const scale = performanceScale;
      const effectiveRamScore = 1 + ((entry.performanceWeight - 1) * roleIntensity);
      ramScoreTotal += effectiveRamScore * scale;
      ramScoreWeight += scale;
    });

    const ramScore = ramScoreWeight ? (ramScoreTotal / ramScoreWeight) : 1;
    const minimumRamRank = RULES.ramTierRankFromScore(ramScore);
    const minimumTierWeight = getTierWeightByRank(minimumRamRank);

    breakdown.forEach((entry) => {
      const performanceUsageBand = getPerformanceUsageBand(entry);
      const performanceScale = getPerformanceUsageScale(entry);
      const pressure = Math.max(0, entry.performanceWeight - minimumTierWeight)
        * RULES.usageWeight(performanceUsageBand)
        * performanceScale;

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
      fitModel,
      computeFloorRank,
      minimumRamRank,
      recommendedRamRank,
      minimumRam: getRamTargetByRank(minimumRamRank, fitModel),
      recommendedRam: getRamTargetByRank(recommendedRamRank, fitModel),
      ramScore,
      bumpReasons: dedupeEntriesById(bumpReasons),
      futureProofBump
    };
  }

  function scoreDevices(breakdown, storage, performance) {
    const dualScreenNeed = calculateDualScreenNeed(breakdown);
    const budgetWeight = (100 - state.futureProofBias) / 100;
    const futureWeight = state.futureProofBias / 100;
    const retroLiteModel = performance.fitModel === "retro-lite";
    const candidateDevices = getRecommendationDevicePool();
    const priceContext = getPriceContext(candidateDevices);

    const scored = candidateDevices.map((device) => {
      const strengths = [];
      const cautions = [];
      let rankScore = 0;
      const totalStoragePool = getDeviceStoragePool(device, storage);
      const sdCardMode = storage.sdCardSizeGb > 0;

      const computeDelta = device.computeRank - performance.computeFloorRank;
      if (computeDelta < 0) {
        rankScore -= 130 + (Math.abs(computeDelta) * 35);
        cautions.push("Falls below the performance floor for your heaviest systems.");
      } else if (computeDelta === 0) {
        rankScore += 42;
        strengths.push("Matches the performance floor.");
      } else {
        rankScore += (computeDelta === 1 ? 28 : 22) + (futureWeight * 12) - (budgetWeight * Math.max(0, computeDelta - 1) * 6);
        strengths.push(computeDelta === 1 ? "Adds useful performance headroom." : "Carries a lot of performance headroom.");
        if (computeDelta > 1 && budgetWeight > 0.55) {
          cautions.push("Carries more performance than your library strictly needs.");
        }
      }

      const ramDeltaFromRecommended = device.ram - performance.recommendedRam;
      if (ramDeltaFromRecommended >= 0) {
        rankScore += 34 - Math.min(12, ramDeltaFromRecommended / 2);
        strengths.push(device.ram === performance.recommendedRam ? "Lines up with the recommended RAM tier." : "Keeps extra RAM headroom.");
      } else if (device.ram >= performance.minimumRam) {
        rankScore += 10;
        cautions.push("Meets the minimum RAM tier, but not the recommended tier.");
      } else {
        rankScore -= 95;
        cautions.push("Drops below the minimum RAM tier.");
      }

      if (device.storage < storage.internalCoreNeed) {
        rankScore -= 24;
        cautions.push("Internal storage is tight even before leaning on an SD card.");
      }

      if (sdCardMode) {
        if (totalStoragePool >= storage.comfortableUpper) {
          rankScore += 12;
          strengths.push("Your total storage pool covers the comfortable upper estimate.");
        } else if (totalStoragePool >= storage.expectedAverage) {
          rankScore += 8;
          cautions.push("Current planned storage fits, but the upper range may still feel tight.");
        } else if (totalStoragePool >= storage.minimumLikely) {
          rankScore += 3;
          cautions.push("Meets the likely minimum, but you will manage installs sooner.");
        } else {
          rankScore -= 30;
          cautions.push("Current planned storage still falls short of the likely minimum.");
        }

        if (device.storage >= storage.internalCoreNeed) {
          rankScore += 4;
          strengths.push("Internal storage still leaves enough room for core daily use.");
        }

        const internalOvershootPenalty = getSdOvershootPenalty(device, storage, performance);
        if (internalOvershootPenalty > 0) {
          rankScore -= internalOvershootPenalty;
          cautions.push("Carries more internal storage than this setup needs once the SD card is counted.");
        }
      } else if (totalStoragePool >= storage.comfortableUpper) {
        rankScore += 28;
        strengths.push("Internal storage covers the comfortable upper estimate.");
      } else if (totalStoragePool >= storage.expectedAverage) {
        rankScore += 16;
        cautions.push("Average use fits internally, but the upper range may lean on a card.");
      } else if (totalStoragePool >= storage.minimumLikely) {
        rankScore += 8;
        cautions.push("Meets the likely minimum, but you will manage installs sooner.");
      } else {
        rankScore -= 30;
        cautions.push("Internal storage falls short of the likely minimum.");
      }

      const currentStoreStorageAdjustment = getCurrentStoreStorageAdjustment(device);
      rankScore += currentStoreStorageAdjustment.rankScore;
      if (currentStoreStorageAdjustment.note) {
        cautions.push(currentStoreStorageAdjustment.note);
      }

      const clearsCoreFloor = device.computeRank >= performance.computeFloorRank
        && device.ram >= performance.minimumRam;
      const preferenceWeight = clearsCoreFloor ? 1.4 : 1;

      if (state.brandPreference !== "any") {
        if (getDeviceBrandId(device) === state.brandPreference) {
          rankScore += Math.round(24 * preferenceWeight);
          strengths.push(`Matches your ${getBrandName(state.brandPreference)} brand preference.`);
        } else {
          rankScore -= Math.round(9 * preferenceWeight);
          cautions.push(`Misses your preferred ${getBrandName(state.brandPreference)} brand.`);
        }
      }

      if (state.formFactor === "horizontal") {
        if (device.formFactor === "horizontal") {
          rankScore += Math.round(10 * preferenceWeight);
          strengths.push("Matches your horizontal preference.");
        } else {
          rankScore -= Math.round(4 * preferenceWeight);
          cautions.push("Misses your preferred form factor.");
        }
      }

      if (state.formFactor === "vertical") {
        if (device.formFactor === "vertical") {
          rankScore += Math.round(10 * preferenceWeight);
          strengths.push("Matches your vertical preference.");
        } else {
          rankScore -= Math.round(4 * preferenceWeight);
          cautions.push("Misses your preferred form factor.");
        }
      }

      if (state.formFactor === "clamshell") {
        if (device.formFactor === "clamshell") {
          rankScore += Math.round(12 * preferenceWeight);
          strengths.push("Matches your clamshell preference.");
        } else {
          rankScore -= Math.round(5 * preferenceWeight);
          cautions.push("Misses your preferred form factor.");
        }
      }

      if (dualScreenNeed > 0.15) {
        if (device.dualScreen) {
          rankScore += 18 * dualScreenNeed;
          strengths.push("Dual screens help your DS or 3DS mix.");
        } else {
          rankScore -= 10 * dualScreenNeed;
          cautions.push("A second screen would help for DS or 3DS.");
        }
      }

      rankScore += getPriceAffordability(device, priceContext) * 30 * budgetWeight;

      if (device.positioning === "balanced" && budgetWeight > 0.45 && performance.computeFloorRank === 3) {
        rankScore += 6;
      }

      if (device.positioning === "premium" && futureWeight > 0.65) {
        rankScore += 8;
      }

      if (device.positioning === "dual-screen" && state.formFactor === "clamshell") {
        rankScore += 6;
      }

      if (retroLiteModel) {
        if (device.computeRank <= 2) {
          rankScore += 10;
          strengths.push("Stays in a lighter retro power class.");
        } else {
          rankScore -= 18;
          cautions.push("Carries heavier Android style headroom than this retro lane really needs.");
        }

        if (device.ram > 4) {
          rankScore -= Math.min(10, 2 + ((device.ram - 4) * 0.75));
        }
      }

      const meetsMinimumCore = device.computeRank >= performance.computeFloorRank && device.ram >= performance.minimumRam;
      const meetsRecommendedCore = meetsMinimumCore && device.ram >= performance.recommendedRam;
      const fitBreakdown = buildFitScoreBreakdown(
        device,
        storage,
        performance,
        totalStoragePool,
        dualScreenNeed,
        budgetWeight,
        futureWeight,
        priceContext
      );

      return {
        device,
        score: fitBreakdown.total,
        rankScore,
        fitBreakdown,
        strengths: dedupeStrings(strengths).slice(0, 4),
        cautions: dedupeStrings(cautions).slice(0, 4),
        meetsMinimumCore,
        meetsRecommendedCore
      };
    }).sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.rankScore - left.rankScore;
    });

    const recommendedPool = scored.filter((item) => item.meetsRecommendedCore);
    const minimumPool = scored.filter((item) => item.meetsMinimumCore);
    const bestPool = recommendedPool.length ? recommendedPool : minimumPool.length ? minimumPool : scored;
    const recommendationSelection = selectRecommendedCandidate(
      bestPool,
      minimumPool.length ? minimumPool : scored
    );
    const recommended = recommendationSelection.candidate;
    const optionalFitPool = (minimumPool.length ? minimumPool : scored).filter((candidate) => {
      return getDeviceStoragePool(candidate.device, storage) >= storage.expectedAverage
        && candidate.device.storage >= storage.internalCoreNeed
        && (!recommended || candidate.device.id !== recommended.device.id);
    });

    return {
      scored,
      recommended,
      preferenceApplied: recommendationSelection.preferenceApplied,
      preferenceReason: recommendationSelection.reason,
      optionalFit: getOptionalFit(recommended, optionalFitPool),
      budgetAlternative: getBudgetAlternative(recommended, minimumPool.length ? minimumPool : scored),
      futureProofOption: getFutureProofOption(recommended, minimumPool.length ? minimumPool : scored, performance.computeFloorRank),
      topCandidates: buildTopCandidates(recommended, minimumPool.length ? minimumPool : scored)
    };
  }

  function buildFitScoreBreakdown(device, storage, performance, totalStoragePool, dualScreenNeed, budgetWeight, futureWeight, priceContext) {
    const performanceScore = getPerformanceFitPoints(device, performance, budgetWeight, futureWeight);
    const ramScore = getRamFitPoints(device, performance, budgetWeight, futureWeight);
    const storageScore = getStorageFitPoints(device, storage, performance, totalStoragePool);
    const valueScore = getValueFitPoints(device, performance, budgetWeight, futureWeight, priceContext);
    const preferenceScore = getPreferenceFitPoints(device, dualScreenNeed);
    const total = RULES.clamp(
      performanceScore + ramScore + storageScore + valueScore + preferenceScore,
      0,
      100
    );

    return {
      performance: performanceScore,
      ram: ramScore,
      storage: storageScore,
      value: valueScore,
      preference: preferenceScore,
      total
    };
  }

  function isSdFriendlyStorageEntry(entry) {
    if (!entry || entry.type !== "system") {
      return false;
    }

    if (["android", "switch", "wii-u", "ps3"].includes(entry.id)) {
      return false;
    }

    if (entry.avgPerGame <= 1.5) {
      return true;
    }

    if (entry.avgPerGame <= 4 && entry.computeRank <= 3) {
      return true;
    }

    return entry.avgPerGame <= 8 && entry.computeRank <= 2;
  }

  function findSdSavingsPaths(breakdown, storage, performance, scoring) {
    if (storage.sdCardSizeGb || !breakdown.length || !scoring.recommended) {
      return [];
    }

    if (storage.sdFriendlyShare < 0.55 || storage.sdFriendlyTotals.avg < 96) {
      return [];
    }

    const currentDevice = scoring.recommended.device;
    const sdOptions = [128, 256, 512, 1024, 2048];
    const savingsByDevice = new Map();

    for (const sdCardSizeGb of sdOptions) {
      const hypotheticalStorage = { ...storage, sdCardSizeGb };
      const hypotheticalScoring = scoreDevices(breakdown, hypotheticalStorage, performance);
      const cheaperCandidates = hypotheticalScoring.scored
        .filter((candidate) => {
          return candidate.device.priceUsd < currentDevice.priceUsd
            && candidate.meetsMinimumCore
            && candidate.device.storage >= hypotheticalStorage.internalCoreNeed
            && getDeviceStoragePool(candidate.device, hypotheticalStorage) >= hypotheticalStorage.expectedAverage
            && candidate.score >= 60;
        })
        .sort((left, right) => {
          if (left.device.priceUsd !== right.device.priceUsd) {
            return left.device.priceUsd - right.device.priceUsd;
          }

          return right.score - left.score;
        });

      cheaperCandidates.forEach((candidate) => {
        if (savingsByDevice.has(candidate.device.id)) {
          return;
        }

        savingsByDevice.set(candidate.device.id, {
          candidate,
          sdCardSizeGb,
          savingsUsd: Math.max(0, currentDevice.priceUsd - candidate.device.priceUsd)
        });
      });
    }

    return [...savingsByDevice.values()]
      .sort((left, right) => {
        if (left.candidate.device.priceUsd !== right.candidate.device.priceUsd) {
          return left.candidate.device.priceUsd - right.candidate.device.priceUsd;
        }

        if (left.sdCardSizeGb !== right.sdCardSizeGb) {
          return left.sdCardSizeGb - right.sdCardSizeGb;
        }

        return right.candidate.score - left.candidate.score;
      })
      .slice(0, 3);
  }

  function buildDisplayScoreBreakdown(fitBreakdown) {
    const parts = [
      { key: "performance", value: fitBreakdown.performance, max: FIT_SCORE_WEIGHTS.performance },
      { key: "ram", value: fitBreakdown.ram, max: FIT_SCORE_WEIGHTS.ram },
      { key: "storage", value: fitBreakdown.storage, max: FIT_SCORE_WEIGHTS.storage },
      { key: "value", value: fitBreakdown.value, max: FIT_SCORE_WEIGHTS.value },
      { key: "preference", value: fitBreakdown.preference, max: FIT_SCORE_WEIGHTS.preference }
    ].map((part) => ({
      ...part,
      points: Math.floor(part.value),
      fraction: part.value - Math.floor(part.value)
    }));

    let remaining = Math.round(fitBreakdown.total) - parts.reduce((sum, part) => sum + part.points, 0);

    if (remaining > 0) {
      [...parts]
        .sort((left, right) => right.fraction - left.fraction)
        .forEach((part) => {
          if (remaining > 0 && part.points < part.max) {
            part.points += 1;
            remaining -= 1;
          }
        });
    } else if (remaining < 0) {
      [...parts]
        .sort((left, right) => left.fraction - right.fraction)
        .forEach((part) => {
          if (remaining < 0 && part.points > 0) {
            part.points -= 1;
            remaining += 1;
          }
        });
    }

    return {
      performance: parts.find((part) => part.key === "performance").points,
      ram: parts.find((part) => part.key === "ram").points,
      storage: parts.find((part) => part.key === "storage").points,
      value: parts.find((part) => part.key === "value").points,
      preference: parts.find((part) => part.key === "preference").points,
      total: Math.round(fitBreakdown.total)
    };
  }

  function hasCurrentStoreStorageChange(device) {
    return Boolean(
      device
      && device.currentBatchLabel
      && device.storageSpec
      && device.priorStorageSpec
      && device.storageSpec !== device.priorStorageSpec
    );
  }

  function getCurrentStoreStorageAdjustment(device) {
    if (!hasCurrentStoreStorageChange(device)) {
      return {
        storageScore: 0,
        valueScore: 0,
        rankScore: 0,
        note: ""
      };
    }

    return {
      storageScore: -1,
      valueScore: -1,
      rankScore: -6,
      note: `Current ${device.currentBatchLabel} listing uses ${device.storageSpec}. In real use this is mostly a transfer and install tradeoff, not a major emulation hit.`
    };
  }

  function getPerformanceFitPoints(device, performance, budgetWeight, futureWeight) {
    const delta = device.computeRank - performance.computeFloorRank;
    const retroLiteModel = performance.fitModel === "retro-lite";
    if (delta < 0) {
      return 0;
    }

    if (delta === 0) {
      return retroLiteModel ? 33 : 31;
    }

    if (delta === 1) {
      if (retroLiteModel) {
        return RULES.clamp(30 + futureWeight - (budgetWeight * 3), 24, 31);
      }

      return FIT_SCORE_WEIGHTS.performance;
    }

    if (retroLiteModel) {
      return RULES.clamp(
        22 + futureWeight - (budgetWeight * Math.min(10, delta * 4)),
        12,
        24
      );
    }

    return RULES.clamp(
      33 + (futureWeight * 2) - (budgetWeight * Math.min(4, (delta - 1) * 2)),
      28,
      FIT_SCORE_WEIGHTS.performance
    );
  }

  function getRamFitPoints(device, performance, budgetWeight, futureWeight) {
    const retroLiteModel = performance.fitModel === "retro-lite";
    if (device.ram < performance.minimumRam) {
      return 0;
    }

    if (device.ram < performance.recommendedRam) {
      const span = Math.max(1, performance.recommendedRam - performance.minimumRam);
      const closeness = (device.ram - performance.minimumRam) / span;
      if (retroLiteModel) {
        return RULES.clamp(10 + (closeness * 10), 10, 18);
      }

      return RULES.clamp(12 + (closeness * 8), 12, 20);
    }

    if (device.ram === performance.recommendedRam) {
      return FIT_SCORE_WEIGHTS.ram;
    }

    const overshoot = device.ram - performance.recommendedRam;
    if (retroLiteModel) {
      return RULES.clamp(
        24 - Math.min(14, overshoot * 1.5) + (futureWeight * 0.5) - (budgetWeight * Math.min(2, overshoot / 2)),
        10,
        FIT_SCORE_WEIGHTS.ram
      );
    }

    return RULES.clamp(
      24 - Math.min(3, overshoot / 4) + Math.min(1, futureWeight) - (budgetWeight * Math.min(1.5, overshoot / 16)),
      21,
      FIT_SCORE_WEIGHTS.ram
    );
  }

  function getStorageFitPoints(device, storage, performance, totalStoragePool) {
    const retroLiteModel = storage.fitModel === "retro-lite";
    const sdCardMode = storage.sdCardSizeGb > 0;
    let points = 0;

    if (sdCardMode) {
      if (totalStoragePool >= storage.comfortableUpper) {
        points = FIT_SCORE_WEIGHTS.storage;
      } else if (totalStoragePool >= storage.expectedAverage) {
        points = retroLiteModel ? 18 : 16;
      } else if (totalStoragePool >= storage.minimumLikely) {
        points = retroLiteModel ? 14 : 11;
      } else {
        const ratio = storage.minimumLikely ? (totalStoragePool / storage.minimumLikely) : 0;
        const scaledMax = retroLiteModel ? 14 : 11;
        points = scaledMax * Math.max(0, Math.min(1, ratio));
      }

      if (device.storage < storage.internalCoreNeed) {
        points -= retroLiteModel ? 2 : 5;
      }

      const overshootPenalty = getSdOvershootPenalty(device, storage, performance);
      if (overshootPenalty > 0) {
        points -= Math.min(4, overshootPenalty / 4);
      }
    } else {
      if (totalStoragePool >= storage.comfortableUpper) {
        points = FIT_SCORE_WEIGHTS.storage;
      } else if (totalStoragePool >= storage.expectedAverage) {
        points = retroLiteModel ? 17 : 15;
      } else if (totalStoragePool >= storage.minimumLikely) {
        points = retroLiteModel ? 12 : 9;
      } else {
        const ratio = storage.minimumLikely ? (totalStoragePool / storage.minimumLikely) : 0;
        const scaledMax = retroLiteModel ? 12 : 9;
        points = scaledMax * Math.max(0, Math.min(1, ratio));
      }

      if (device.storage < storage.internalCoreNeed) {
        points -= retroLiteModel ? 1.5 : 4;
      }
    }

    points += getCurrentStoreStorageAdjustment(device).storageScore;

    return RULES.clamp(points, 0, FIT_SCORE_WEIGHTS.storage);
  }

  function getValueFitPoints(device, performance, budgetWeight, futureWeight, priceContext) {
    const retroLiteModel = performance.fitModel === "retro-lite";
    const baseValue = getPriceAffordability(device, priceContext) * FIT_SCORE_WEIGHTS.value;
    if (retroLiteModel) {
      const lighterDeviceBonus = device.computeRank <= 2 ? 1.5 : 0;
      const heavyAndroidPenalty = device.computeRank >= 3 ? 2.5 + (budgetWeight * 1.5) : 0;
      return RULES.clamp(
        (baseValue * (0.9 + (budgetWeight * 0.25))) + 1.5 + lighterDeviceBonus - (futureWeight * 0.5) - heavyAndroidPenalty + getCurrentStoreStorageAdjustment(device).valueScore,
        2,
        FIT_SCORE_WEIGHTS.value
      );
    }

    return RULES.clamp(
      (baseValue * (0.55 + (budgetWeight * 0.45))) + (futureWeight * 1.5) + getCurrentStoreStorageAdjustment(device).valueScore,
      1,
      FIT_SCORE_WEIGHTS.value
    );
  }

  function getPreferenceFitPoints(device, dualScreenNeed) {
    let points = 0;

    if (state.brandPreference === "any") {
      points += 4;
    } else if (getDeviceBrandId(device) === state.brandPreference) {
      points += 6;
    } else {
      points += 1;
    }

    if (state.formFactor === "no-preference") {
      points += 3;
    } else if (device.formFactor === state.formFactor) {
      points += 3;
    } else {
      points += 0.5;
    }

    if (dualScreenNeed > 0.15) {
      if (device.dualScreen) {
        points += Math.min(1.5, dualScreenNeed * 3);
      } else {
        points -= Math.min(2.5, dualScreenNeed * 4);
      }
    }

    return RULES.clamp(points, 0, FIT_SCORE_WEIGHTS.preference);
  }

  function compareCurrentDevice(currentDevice, recommendedCandidate, performance, storage, dualScreenNeed) {
    if (!currentDevice || !recommendedCandidate) {
      return null;
    }

    const currentClass = getComparisonClass(currentDevice);
    const recommendedClass = getComparisonClass(recommendedCandidate.device);
    const differentLane = currentClass !== recommendedClass;

    const minimumFit = currentDevice.computeRank >= performance.computeFloorRank
      && currentDevice.ram >= performance.minimumRam;
    const recommendedFit = currentDevice.computeRank >= performance.computeFloorRank
      && currentDevice.ram >= performance.recommendedRam
      && getDeviceStoragePool(currentDevice, storage) >= storage.expectedAverage
      && currentDevice.storage >= storage.internalCoreNeed;

    let improvementScore = Math.max(0, recommendedCandidate.device.computeRank - currentDevice.computeRank) * 2;
    if ((recommendedCandidate.device.ram - currentDevice.ram) >= 4) {
      improvementScore += 1;
    }
    if ((recommendedCandidate.device.storage - currentDevice.storage) >= 128) {
      improvementScore += 1;
    }
    if (state.formFactor !== "no-preference" && currentDevice.formFactor !== state.formFactor && recommendedCandidate.device.formFactor === state.formFactor) {
      improvementScore += 2;
    }
    if (!currentDevice.dualScreen && recommendedCandidate.device.dualScreen && dualScreenNeed > 0.35) {
      improvementScore += 1;
    }
    if (differentLane) {
      improvementScore -= 1;
    }

    let classification = "sidegrade";
    if (differentLane && minimumFit && recommendedFit) {
      classification = "different lane";
    } else if (recommendedFit && improvementScore <= 1) {
      classification = "not worth upgrading";
    } else if (!minimumFit && improvementScore >= 4) {
      classification = "major upgrade";
    } else if (improvementScore >= 2) {
      classification = "moderate upgrade";
    }

    if (minimumFit && recommendedFit && state.formFactor === "no-preference" && !differentLane) {
      classification = "not worth upgrading";
    }

    return {
      currentDevice,
      recommendedDevice: recommendedCandidate.device,
      classification,
      differentLane,
      currentClass,
      recommendedClass,
      minimumFit,
      recommendedFit,
      shouldKeepCurrent: classification === "not worth upgrading",
      explanation: buildComparisonExplanation(currentDevice, recommendedCandidate.device, classification, minimumFit, recommendedFit)
    };
  }

  function buildComparisonExplanation(currentDevice, recommendedDevice, classification, minimumFit, recommendedFit) {
    const estimatedLead = currentDevice.estimatedProfile
      ? "This uses a family-level estimate for your current device. "
      : "";

    if (classification === "different lane") {
      return `${estimatedLead}${currentDevice.name} and ${recommendedDevice.name} sit in different handheld lanes. Treat this as a direction change in use style and value, not a strict same-lane upgrade.`;
    }

    if (classification === "not worth upgrading") {
      return `${estimatedLead}${currentDevice.name} already covers your current needs well enough. Any gain from ${recommendedDevice.name} is smaller than the cost unless you want a different form factor or more headroom on purpose.`;
    }

    if (classification === "major upgrade") {
      return `${estimatedLead}${recommendedDevice.name} is a clear step up in both capability and headroom. Your current ${currentDevice.name} misses enough of the performance or RAM target that the jump is meaningful.`;
    }

    if (classification === "moderate upgrade") {
      return `${estimatedLead}${recommendedDevice.name} gives you useful headroom over ${currentDevice.name}, but the jump is more about comfort and flexibility than a complete class change.`;
    }

    if (minimumFit && !recommendedFit) {
      return `${estimatedLead}${currentDevice.name} is still workable, but ${recommendedDevice.name} better matches the recommended tier and storage comfort target.`;
    }

    return `${estimatedLead}${recommendedDevice.name} changes the experience more in shape or comfort than raw capability.`;
  }
  function renderSnapshot(analysis) {
    if (!analysis.hasActiveLibrary) {
      if (state.format === "simple") {
        elements.snapshotCards.innerHTML = `
          <div class="simple-terminal simple-terminal-mini">
            <div class="simple-terminal-head">C:\\Where2Buy> glance</div>
            <div class="simple-terminal-note">Select systems and enter game counts or PC sizes to populate this view.</div>
          </div>
        `;
        return;
      }

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

    if (!analysis.scoring.recommended) {
      const noMatchMessage = buildNoSupportedMatchMessage(analysis);
      elements.snapshotCards.innerHTML = `
        <div class="${state.format === "simple" ? "simple-terminal simple-terminal-mini" : "snapshot-card"}">
          ${state.format === "simple"
            ? `<div class="simple-terminal-head">File Explorer</div>${renderSimpleExplorerPath(["Where2Buy", "Snapshot", "At a Glance"])}`
            : `<div class="summary-card-top"><h3>No supported match</h3><span class="mini-tag">Check inputs</span></div>`}
          <div class="${state.format === "simple" ? "simple-terminal-note" : "result-copy"}">${escapeHtml(noMatchMessage)}</div>
        </div>
      `;
      return;
    }

    if (state.format === "simple") {
      renderSimpleSnapshot(analysis);
      return;
    }

    const recommendedName = analysis.keepCurrent && analysis.currentComparison
      ? `Keep ${analysis.currentComparison.currentDevice.name}`
      : analysis.scoring.recommended.device.name;
    const snapshotPriceLabel = getRecommendedPriceLabel(analysis, analysis.scoring.recommended.device);
    const snapshotPriceCopy = getRecommendedPriceCopy(analysis, analysis.scoring.recommended.device);
    const computeLabel = RULES.getTierByRank(analysis.performance.computeFloorRank).label;
    const ramLabel = formatRamTierLabel(analysis.performance.recommendedRamRank, analysis.performance.fitModel);

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
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>Price</h3>
          <span class="mini-tag">Local</span>
        </div>
        <div class="kpi">${escapeHtml(snapshotPriceLabel)}</div>
        <div class="result-copy">${escapeHtml(snapshotPriceCopy)}</div>
      </div>
    `;
  }

  function renderSimpleSnapshot(analysis) {
    const recommendedName = analysis.keepCurrent && analysis.currentComparison
      ? `Keep ${analysis.currentComparison.currentDevice.name}`
      : analysis.scoring.recommended.device.name;
    const snapshotPriceLabel = getRecommendedPriceLabel(analysis, analysis.scoring.recommended.device);
    const snapshotPriceCopy = getRecommendedPriceCopy(analysis, analysis.scoring.recommended.device);

    elements.snapshotCards.innerHTML = `
      <div class="simple-terminal simple-terminal-mini">
        <div class="simple-terminal-head">File Explorer</div>
        ${renderSimpleExplorerPath(["Where2Buy", "Snapshot", "At a Glance"])}
        ${renderSimpleTerminalSection("At a Glance", [
          ["Best Fit", recommendedName],
          ["Price", snapshotPriceLabel],
          ["RAM Target", `${analysis.performance.recommendedRam}GB`],
          ["Storage Avg", formatSize(analysis.storage.expectedAverage)],
          ["Performance", getComputeFloorLabel(analysis.performance.computeFloorRank)],
          ...(analysis.ownershipNote ? [["Current Handheld", getOwnedDeviceLabel()]] : [])
        ])}
        <div class="simple-terminal-note">${escapeHtml(snapshotPriceCopy)}</div>
        ${analysis.ownershipNote ? `<div class="simple-terminal-note">${escapeHtml(analysis.ownershipNote)}</div>` : ""}
      </div>
    `;
  }

  function renderResults(analysis) {
    if (!analysis.hasActiveLibrary) {
      if (state.format === "simple") {
        elements.resultsContent.innerHTML = `
          <div class="simple-terminal simple-terminal-full">
            <div class="simple-terminal-head">File Explorer</div>
            ${renderSimpleExplorerPath(["Where2Buy", "Recommendations", "Simple"])}
            <div class="simple-terminal-command">Ready</div>
            <div class="simple-terminal-note">Pick a few systems and enter your library details to generate a recommendation.</div>
          </div>
        `;
        return;
      }

      elements.resultsContent.innerHTML = `
        <div class="empty-state">
          Pick a few systems and enter your library details to generate a recommendation.
        </div>
      `;
      return;
    }

    if (!analysis.scoring.recommended) {
      const noMatchMessage = buildNoSupportedMatchMessage(analysis);
      if (state.format === "simple") {
        elements.resultsContent.innerHTML = `
          <div class="simple-terminal simple-terminal-full">
            <div class="simple-terminal-head">File Explorer</div>
            ${renderSimpleExplorerPath(["Where2Buy", "Recommendations", "Simple"])}
            <div class="simple-terminal-command">No supported match</div>
            <div class="simple-terminal-note">${escapeHtml(noMatchMessage)}</div>
          </div>
        `;
        return;
      }

      elements.resultsContent.innerHTML = `
        <div class="empty-state">
          ${escapeHtml(noMatchMessage)}
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
    const optionalFitCopy = buildOptionalFitCopy(analysis.scoring.optionalFit, analysis.storage);
    const sdCardCopy = buildSdCardCopy(analysis.storage);
    const preferenceCopy = analysis.keepCurrent ? "" : buildPreferenceCopy(analysis.scoring);
    const performancePercent = getHeadroomPercent(displayDevice.computeRank, analysis.performance.computeFloorRank);
    const ramPercent = getFitPercent(displayDevice.ram, analysis.performance.recommendedRam);
    const storagePercent = getFitPercent(getDeviceStoragePool(displayDevice, analysis.storage), analysis.storage.comfortableUpper);
    const scoreBreakdown = buildDisplayScoreBreakdown(recommendedCandidate.fitBreakdown);
    const priceLabel = getRecommendedPriceLabel(analysis, recommendedDevice);
    const priceCopy = getRecommendedPriceCopy(analysis, recommendedDevice);

    if (state.format === "simple") {
      renderSimpleResults(analysis, {
        recommendedCandidate,
        recommendedDevice,
        displayDevice,
        recommendedTitle,
        recommendedBody,
        preferenceCopy,
        optionalFitCopy,
        sdCardCopy,
        performancePercent,
        ramPercent,
        storagePercent,
        scoreBreakdown,
        priceLabel,
        priceCopy
      });
      return;
    }

    elements.resultsContent.innerHTML = `
      <div class="scorecard-story">
        <section class="story-hero">
          <div class="story-hero-grid">
            <div class="story-hero-copy">
              <p class="story-kicker">Handheld Scorecard</p>
              <h3 class="story-title">${escapeHtml(recommendedTitle)}</h3>
              <p class="story-lead">${escapeHtml(buildStoryHeadline(analysis, recommendedCandidate, displayDevice))}</p>
              <div class="story-chip-row">
                <span class="story-chip story-chip-accent">${escapeHtml(getBrandName(getDeviceBrandId(displayDevice)))}</span>
                <span class="story-chip">${escapeHtml(displayDevice.family || displayDevice.name)}</span>
                <span class="story-chip">${escapeHtml(formatFormFactorLabel(displayDevice.formFactor))}</span>
                <span class="story-chip">${displayDevice.ram}GB RAM</span>
                <span class="story-chip">${formatSize(displayDevice.storage)} storage</span>
                ${displayDevice.storageSpec ? `<span class="story-chip">${escapeHtml(displayDevice.storageSpec)}</span>` : ""}
                <span class="story-chip">${escapeHtml(priceLabel)}</span>
                ${displayDevice.preOrder ? `<span class="story-chip">Pre-order</span>` : ""}
              </div>
              ${preferenceCopy ? `<p class="story-subnote">${escapeHtml(preferenceCopy)}</p>` : ""}
              ${optionalFitCopy ? `<p class="story-subnote">${escapeHtml(optionalFitCopy)}</p>` : ""}
              ${sdCardCopy ? `<p class="story-subnote">${escapeHtml(sdCardCopy)}</p>` : ""}
              ${analysis.ownershipNote ? `<p class="story-subnote">${escapeHtml(analysis.ownershipNote)}</p>` : ""}
            </div>
            <div class="story-burst">
              ${renderStoryScoreLabel(scoreBreakdown)}
              <strong class="story-burst-value">${formatFitScore(recommendedCandidate.score)}</strong>
              <span class="story-burst-copy">${escapeHtml(buildStoryStamp(analysis))}</span>
            </div>
          </div>
        </section>

        <section class="story-metric-strip">
          ${renderStoryMetricCard("Price", priceLabel, priceCopy)}
          ${renderStoryMetricCard("Recommended RAM", `${analysis.performance.recommendedRam}GB`, buildRamExplanation(analysis.performance))}
          ${renderStoryMetricCard("Minimum RAM", `${analysis.performance.minimumRam}GB`, "This is the lowest tier that still makes sense.")}
              ${renderStoryMetricCard("Expected Storage", formatSize(analysis.storage.expectedAverage), buildStorageNote(analysis.storage))}
              ${renderStoryMetricCard("Comfortable Upper", formatSize(analysis.storage.comfortableUpper), `${formatSize(analysis.storage.minimumLikely)} is the likely minimum.`)}
        </section>

        <section class="story-panel story-tone-blue">
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
                ${buildWhyThisFitsBase(analysis).map((line) => `<div>${escapeHtml(line)}</div>`).join("")}
              </div>
              ${renderStorySdSavingsBlock(analysis.sdSavingsPaths)}
            </div>
            <div class="story-meter-grid">
              ${renderStoryMeterCard("Performance headroom", performancePercent, `The device clears a ${getComputeFloorLabel(analysis.performance.computeFloorRank).toLowerCase()} requirement.`)}
              ${renderStoryMeterCard("RAM fit", ramPercent, `Target is ${analysis.performance.recommendedRam}GB. Minimum acceptable is ${analysis.performance.minimumRam}GB.`)}
              ${renderStoryMeterCard("Storage comfort", storagePercent, `Comfort target is ${formatSize(analysis.storage.comfortableUpper)} and the current storage pool is ${formatSize(getDeviceStoragePool(displayDevice, analysis.storage))}.`)}
            </div>
          </div>
        </section>

        <section class="story-panel story-tone-green">
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

        <section class="story-panel story-tone-yellow">
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

        <section class="story-panel story-tone-cyan">
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

  function renderSimpleResults(analysis, context) {
    const comparisonSection = analysis.currentComparison
      ? renderSimpleTerminalSection("Current Device Check", [
        ["Current Device", analysis.currentComparison.currentDevice.name],
        ["Recommended", analysis.currentComparison.recommendedDevice.name],
        ["Upgrade Level", capitalizeWords(analysis.currentComparison.classification)]
      ]) + renderSimpleTerminalNotes([analysis.currentComparison.explanation])
      : "";
    const bumpNotes = analysis.performance.bumpReasons.length || analysis.performance.futureProofBump
      ? renderSimpleTerminalNotes(buildSimpleBumpNotes(analysis))
      : "";
    const advisoryNotes = renderSimpleTerminalNotes([
      context.recommendedBody,
      context.priceCopy,
      context.preferenceCopy,
      context.optionalFitCopy,
      context.sdCardCopy,
      analysis.ownershipNote,
      ...buildWhyThisFits(analysis)
    ].filter(Boolean));

    elements.resultsContent.innerHTML = `
      <div class="simple-terminal simple-terminal-full">
        <div class="simple-terminal-head">File Explorer</div>
        <div class="simple-terminal-head">Which Handheld Should I Buy? [Version ${APP_VERSION}]</div>
        ${renderSimpleExplorerPath(["Where2Buy", "Recommendations", "Simple", getBrandName(getDeviceBrandId(context.recommendedDevice)), context.recommendedDevice.family || context.recommendedDevice.name])}
        <div class="simple-terminal-command">Folder Summary</div>
        ${renderSimpleTerminalSection("Recommendation Configuration", [
          ["Best Fit", context.recommendedTitle],
          ["Price", context.priceLabel],
          ["Recommended RAM", `${analysis.performance.recommendedRam}GB`],
          ["Minimum RAM", `${analysis.performance.minimumRam}GB`],
          ["Expected Storage", formatSize(analysis.storage.expectedAverage)],
          ["Comfortable Upper", formatSize(analysis.storage.comfortableUpper)],
          ["Performance Floor", getComputeFloorLabel(analysis.performance.computeFloorRank)],
          [renderInfoLabel("Performance Score", FIT_SCORE_INFO), formatFitScore(context.recommendedCandidate.score), true]
        ])}
        ${renderSimpleTerminalSection("Alternative Paths", [
          ["Budget Alternative", analysis.scoring.budgetAlternative ? analysis.scoring.budgetAlternative.device.name : "None"],
          ["Future Proof Option", analysis.scoring.futureProofOption ? analysis.scoring.futureProofOption.device.name : "None"],
          ...buildSdSavingsRows(analysis.sdSavingsPaths),
          ["Optional Fit", analysis.scoring.optionalFit ? analysis.scoring.optionalFit.device.name : "None"]
        ])}
        ${renderSimpleTerminalSection("Performance Score Breakdown", [
          ["Heavy Systems", `${context.scoreBreakdown.performance}/${FIT_SCORE_WEIGHTS.performance}`],
          ["RAM", `${context.scoreBreakdown.ram}/${FIT_SCORE_WEIGHTS.ram}`],
          ["Storage", `${context.scoreBreakdown.storage}/${FIT_SCORE_WEIGHTS.storage}`],
          ["Price vs Value", `${context.scoreBreakdown.value}/${FIT_SCORE_WEIGHTS.value}`],
          ["Preferences", `${context.scoreBreakdown.preference}/${FIT_SCORE_WEIGHTS.preference}`],
          ["Total Score", `${context.scoreBreakdown.total}/100`]
        ])}
        ${renderSimpleTerminalSection("Library Loadout", analysis.breakdown.map((entry) => {
          if (entry.type === "pc") {
            return [`PC (${entry.count} games)`, `${formatSize(entry.avgTotal)} actual | ${entry.workloadLabel}`];
          }

          return [`${entry.name} (${entry.count} games)`, formatRange(entry.lowTotal, entry.highTotal)];
        }))}
        ${comparisonSection}
        ${bumpNotes ? `<section class="simple-terminal-section"><h3 class="simple-terminal-title">Why It Got Bumped</h3>${bumpNotes}</section>` : ""}
        <section class="simple-terminal-section">
          <h3 class="simple-terminal-title">Notes</h3>
          ${advisoryNotes}
        </section>
      </div>
    `;
  }

  function renderSimpleTerminalSection(title, rows) {
    return `
      <section class="simple-terminal-section">
        <h3 class="simple-terminal-title">${escapeHtml(title)}</h3>
        <div class="simple-terminal-lines">
          ${rows.map(([label, value, labelIsHtml]) => renderSimplePromptLine(label, value, labelIsHtml)).join("")}
        </div>
      </section>
    `;
  }

  function renderSimpleExplorerPath(segments) {
    return `
      <div class="simple-explorer-path">
        <span class="simple-explorer-host">This PC</span>
        ${segments.map((segment) => `<span class="simple-explorer-node">${escapeHtml(segment)}</span>`).join("")}
      </div>
    `;
  }

  function renderSimpleTerminalNotes(notes) {
    return `
      <div class="simple-terminal-note-list">
        ${notes.map((note) => `<div class="simple-terminal-note">${escapeHtml(note)}</div>`).join("")}
      </div>
    `;
  }

  function renderSimplePromptLine(label, value, labelIsHtml = false) {
    return `
      <div class="simple-prompt-line">
        <span class="simple-prompt-label">${labelIsHtml ? label : escapeHtml(label)}</span>
        <span class="simple-prompt-dots" aria-hidden="true"></span>
        <span class="simple-prompt-value">${escapeHtml(value)}</span>
      </div>
    `;
  }

  function renderInfoLabel(label, infoText, className = "") {
    const classes = ["info-label"];
    if (className) {
      classes.push(className);
    }

    return `<span class="${classes.join(" ")}">${escapeHtml(label)} ${renderInfoHint(infoText)}</span>`;
  }

  function renderInfoHint(infoText, marker = "i", className = "") {
    const safeInfo = escapeHtml(infoText);
    const classes = ["info-hint"];
    if (className) {
      classes.push(className);
    }
    return `<span class="${classes.join(" ")}" tabindex="0" aria-label="${safeInfo}" data-tip="${safeInfo}">(${escapeHtml(marker)})</span>`;
  }

  function renderStoryScoreLabel(scoreBreakdown) {
    return `<span class="info-label story-burst-label">Performance Score ${renderInfoHint(FIT_SCORE_INFO, "i", "info-hint-pop-top")} ${renderInfoHint(buildFitScoreBreakdownInfo(scoreBreakdown), "B", "info-hint-pop-top info-hint-wide")}</span>`;
  }

  function buildSimpleBumpNotes(analysis) {
    const notes = [];
    const bumpNames = analysis.performance.bumpReasons.map((entry) => entry.name);

    if (bumpNames.length) {
      notes.push(`${formatJoinedList(bumpNames)} pushed the recommendation above the minimum tier.`);
    }

    if (analysis.performance.futureProofBump) {
      notes.push("Future proofing preference also kept the recommendation on the safer side of a close call.");
    }

    return notes;
  }

  function buildRecommendedBody(analysis, recommendedCandidate) {
    const systemSummary = analysis.headlineSystems.join(", ");
    const storageSummary = `your expected storage lands around ${formatSize(analysis.storage.expectedAverage)}`;
    const ramSummary = `the recommended RAM tier is ${analysis.performance.recommendedRam}GB`;
    if (analysis.fitModel === "retro-lite") {
      return `${recommendedCandidate.device.name} lands on top because it fits ${systemSummary || "your selected mix"}, keeps the storage target around ${formatSize(analysis.storage.expectedAverage)}, and does not waste money on heavier Android style headroom you do not need here.`;
    }

    return `${recommendedCandidate.device.name} lands on top because it fits ${systemSummary || "your selected mix"}, ${storageSummary}, and ${ramSummary} without drifting too far into overkill.`;
  }

  function buildStoryHeadline(analysis, recommendedCandidate, displayDevice) {
    if (analysis.keepCurrent && analysis.currentComparison) {
      return `${displayDevice.name} already matches your real library well enough. The tool does not see a strong reason to spend more unless you want a different shape or extra headroom on purpose.`;
    }

    if (state.useCaseLane !== "any") {
      if (analysis.fitModel === "retro-lite") {
        return `${recommendedCandidate.device.name} won inside the ${getUseCaseLaneName(state.useCaseLane).toLowerCase()} lane, so the result stays focused on lighter retro handhelds instead of drifting into stronger Android hardware.`;
      }

      return `${recommendedCandidate.device.name} won inside the ${getUseCaseLaneName(state.useCaseLane).toLowerCase()} lane, so the result stays focused on that use case instead of the full mixed pool.`;
    }

    if (analysis.scoring.preferenceApplied && analysis.scoring.preferenceReason) {
      return `${recommendedCandidate.device.name} clears the hard requirements and your preference mix helped decide the final pick.`;
    }

    if (state.brandPreference !== "any") {
      return `${recommendedCandidate.device.name} clears the hard requirements and lines up well with your ${getBrandName(state.brandPreference)} preference.`;
    }

    if (state.formFactor !== "no-preference") {
      return `${recommendedCandidate.device.name} clears the hard requirements and lines up well with your ${formatFormFactorLabel(state.formFactor).toLowerCase()} preference.`;
    }

    return `${recommendedCandidate.device.name} clears the hard requirements for ${analysis.headlineSystems.join(", ") || "your setup"} and still keeps the recommendation honest.`;
  }

  function buildStoryStamp(analysis) {
    if (analysis.keepCurrent) {
      return "No rush to upgrade";
    }

    if (analysis.scoring.preferenceApplied) {
      return "Preference applied";
    }

    if (state.futureProofBias >= 70) {
      return "Leans future proof";
    }

    if (state.futureProofBias <= 30) {
      return "Leans budget";
    }

    return "Balanced pick";
  }

  function buildOptionalFitCopy(optionalFit, storage) {
    if (!optionalFit) {
      return "";
    }

    return `Optional fit: ${optionalFit.device.name} works for your current planned storage around ${formatSize(storage.expectedAverage)}, but it does not target the comfortable upper estimate.`;
  }

  function buildSdCardCopy(storage) {
    if (!storage.sdCardSizeGb) {
      return "";
    }

    return `Storage profile includes a ${formatSdCardSize(storage.sdCardSizeGb)} SD card. Large SD cards now carry more weight, while internal storage still has to leave enough room for core daily use.`;
  }

  function buildSdSavingsRows(sdSavingsPaths) {
    if (!sdSavingsPaths || !sdSavingsPaths.length) {
      return [];
    }

    return sdSavingsPaths.map((path, index) => {
      const label = index === 0 ? "SD Card Saver" : `SD Card Saver ${index + 1}`;
      const savingsText = path.savingsUsd > 0
        ? ` (${usdFormatter.format(path.savingsUsd)} less)`
        : "";
      return [label, `${path.candidate.device.name} + ${formatSdCardSize(path.sdCardSizeGb)} SD${savingsText}`];
    });
  }

  function buildSdSavingsCopyLines(sdSavingsPaths) {
    if (!sdSavingsPaths || !sdSavingsPaths.length) {
      return [];
    }

    return sdSavingsPaths.map((path) => {
      const savingsText = path.savingsUsd > 0
        ? ` and could save about ${usdFormatter.format(path.savingsUsd)}`
        : "";

      return `Because a large part of this library is SD friendly, a ${formatSdCardSize(path.sdCardSizeGb)} SD card could bring you down to ${path.candidate.device.name}${savingsText}.`;
    });
  }

  function renderStorySdSavingsBlock(sdSavingsPaths) {
    if (!sdSavingsPaths || !sdSavingsPaths.length) {
      return "";
    }

    return `
      <div class="story-sd-saver">
        <p class="story-sd-saver-copy">A large part of this library is SD friendly, so a card can open cheaper fits.</p>
        <p class="story-sd-saver-warning">&#9888; Does not take in account Price of SD</p>
        <div class="story-sd-saver-table">
          <div class="story-sd-saver-row story-sd-saver-head">
            <span>SD Size</span>
            <span>System</span>
            <span>$ Saved</span>
          </div>
          ${sdSavingsPaths.map((path) => `
            <div class="story-sd-saver-row">
              <span>${escapeHtml(formatSdCardSize(path.sdCardSizeGb))}</span>
              <span>${escapeHtml(path.candidate.device.name)}</span>
              <span>${escapeHtml(usdFormatter.format(path.savingsUsd))}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function buildPreferenceCopy(scoring) {
    if (!scoring.preferenceApplied || !scoring.preferenceReason) {
      return "";
    }

    return scoring.preferenceReason;
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
      <section class="story-panel story-tone-purple">
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
              <span class="story-chip">${formatSize(comparison.currentDevice.storage)} storage</span>
            </div>
          </article>
          <article class="story-choice-card story-choice-card-accent">
            <span class="story-choice-label">Recommended</span>
            <h4>${escapeHtml(comparison.recommendedDevice.name)}</h4>
            <div class="story-chip-row">
              <span class="story-chip">${comparison.recommendedDevice.ram}GB RAM</span>
              <span class="story-chip">${formatSize(comparison.recommendedDevice.storage)} storage</span>
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
          <span class="story-chip">${formatSize(candidate.device.storage)} storage</span>
          ${candidate.device.storageSpec ? `<span class="story-chip">${escapeHtml(candidate.device.storageSpec)}</span>` : ""}
          ${candidate.device.preOrder ? `<span class="story-chip">Pre-order</span>` : ""}
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
            <strong class="story-rank-score">${formatFitScore(candidate.score)}</strong>
          </div>
        <h4>${escapeHtml(candidate.device.name)}</h4>
        <div class="story-chip-row">
          <span class="story-chip">${candidate.device.ram}GB RAM</span>
          <span class="story-chip">${formatSize(candidate.device.storage)} storage</span>
          ${candidate.device.storageSpec ? `<span class="story-chip">${escapeHtml(candidate.device.storageSpec)}</span>` : ""}
          ${candidate.device.preOrder ? `<span class="story-chip">Pre-order</span>` : ""}
        </div>
        <p class="story-rank-copy">${escapeHtml(candidate.strengths[0] || "Solid overall fit.")}</p>
      </article>
    `;
  }

  function buildRamExplanation(performance) {
    const recommendedTier = RULES.getTierByRank(performance.recommendedRamRank);
    const minimumTier = RULES.getTierByRank(performance.minimumRamRank);
    const recommendedRamLabel = formatRamTierLabel(performance.recommendedRamRank, performance.fitModel);
    const minimumRamLabel = formatRamTierLabel(performance.minimumRamRank, performance.fitModel);
    if (performance.fitModel === "retro-lite") {
      if (performance.recommendedRamRank === performance.minimumRamRank) {
        return `${recommendedRamLabel} is the honest fit for this lighter retro lane. The tool is using a lower RAM model here because these handhelds are SD first and not built around Android style multitasking.`;
      }

      return `${minimumRamLabel} is the minimum that still makes sense here, but ${recommendedRamLabel} is safer if you want more breathing room inside the retro lane.`;
    }

    if (performance.recommendedRamRank === performance.minimumRamRank) {
      return `${recommendedTier.label} is the honest fit for the library you entered. There was not enough borderline pressure to justify a higher RAM recommendation.`;
    }

    return `${minimumTier.label} is the lowest tier that still makes sense, but ${recommendedTier.label} is safer because one or more heavier systems pushed the recommendation up.`;
  }

  function buildStorageNote(storage) {
    if (storage.fitModel === "retro-lite") {
      return "This run is using the lighter retro storage model. It assumes Linux style overhead, smaller app needs, and much more SD first storage behavior than the Android side of the pool.";
    }

    const maxCurrentStorage = Math.max(...recommendableDevices.map((device) => device.storage));
    if (storage.comfortableUpper > maxCurrentStorage) {
      return storage.sdCardSizeGb
        ? "Your comfortable upper estimate is larger than the biggest current internal option, so this assumes removable storage is part of the plan."
        : "Your comfortable upper estimate is larger than the biggest current internal option. Plan on using a card or rotating installs even on the top storage variants.";
    }

    if (storage.expectedAverage > 512) {
      return storage.sdCardSizeGb
        ? "This library is large enough that the SD card meaningfully helps, but lower internal storage models can still feel tighter for day to day use."
        : "This library is large enough that higher storage variants make sense. Lower storage models can still work, but you will lean on external storage much sooner.";
    }

    return "These numbers already include OS room, app reserve, cache growth, and a safety buffer. They are meant to reflect real use, not a bare minimum spreadsheet fit.";
  }

  function buildWhyThisFitsBase(analysis) {
    const lines = [];
    const computeFloor = getComputeFloorLabel(analysis.performance.computeFloorRank);
    const selectedSystemText = analysis.headlineSystems.length
      ? `Your heaviest systems are ${analysis.headlineSystems.join(", ")}, which sets a ${computeFloor.toLowerCase()} performance floor.`
      : `Your system mix sets a ${computeFloor.toLowerCase()} performance floor.`;

    lines.push(selectedSystemText);
    lines.push(`The storage model points to ${formatSize(analysis.storage.expectedAverage)} as the expected average and ${formatSize(analysis.storage.comfortableUpper)} as the comfortable upper range.`);
    lines.push(`The RAM model lands on ${analysis.performance.recommendedRam}GB, with ${analysis.performance.minimumRam}GB as the minimum acceptable tier.`);
    if (analysis.fitModel === "retro-lite") {
      lines.push("This library stays in the lighter retro fit model, so RAM and storage checks are scaled for SD first retro handhelds instead of heavier Android overhead.");
    }
    if (state.useCaseLane !== "any") {
      if (state.formFactor !== "no-preference") {
        lines.push(`${getUseCaseLaneName(state.useCaseLane)} is active, but ${formatFormFactorLabel(state.formFactor).toLowerCase()} stays a hard pool filter when it is selected.`);
      } else {
        lines.push(`${getUseCaseLaneName(state.useCaseLane)} is active, so the live pool is filtered to that lane first.`);
      }
    }
    if (analysis.storage.sdCardSizeGb) {
      lines.push(`This run includes a ${formatSdCardSize(analysis.storage.sdCardSizeGb)} SD card, but the tool still checks that internal storage is not overly cramped.`);
    }
    if (state.brandPreference !== "any") {
      lines.push(`${getBrandName(state.brandPreference)} gets the strongest preference weight when the fit is close.`);
    }
    if (analysis.scoring.preferenceApplied && analysis.scoring.preferenceReason) {
      lines.push(analysis.scoring.preferenceReason);
    }

    if (state.formFactor === "clamshell") {
      lines.push("Clamshell is locked as the active form factor pool.");
    } else if (state.formFactor === "vertical") {
      lines.push("Vertical is locked as the active form factor pool.");
    } else if (state.formFactor === "horizontal") {
      lines.push("Horizontal is locked as the active form factor pool.");
    }

    if (state.futureProofBias >= 70) {
      lines.push("You leaned toward future proofing, so the scoring gives a little more credit to useful headroom when the fit is close.");
    } else if (state.futureProofBias <= 30) {
      lines.push("You leaned toward budget, so the scoring is stricter about paying for headroom you may never use.");
    }

    return lines;
  }

  function buildWhyThisFits(analysis) {
    return [
      ...buildWhyThisFitsBase(analysis),
      ...buildSdSavingsCopyLines(analysis.sdSavingsPaths)
    ];
  }

  function buildBumpedSection(analysis) {
    const bumpNames = analysis.performance.bumpReasons.map((entry) => entry.name);
    const recommendedTier = formatRamTierLabel(analysis.performance.recommendedRamRank, analysis.performance.fitModel);
    const minimumTier = formatRamTierLabel(analysis.performance.minimumRamRank, analysis.performance.fitModel);

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
      <section class="story-panel story-panel-contrast story-tone-red">
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
              <span class="tag">${formatSize(candidate.device.storage)} storage</span>
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
              <span class="mini-tag">${formatSize(candidate.device.storage)}</span>
            </div>
          </div>
            <div class="candidate-score">${formatFitScore(candidate.score)}</div>
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
      const leftPrice = getValidPrice(left.device) ?? Number.MAX_SAFE_INTEGER;
      const rightPrice = getValidPrice(right.device) ?? Number.MAX_SAFE_INTEGER;
      if (leftPrice !== rightPrice) {
        return leftPrice - rightPrice;
      }
      return right.rankScore - left.rankScore;
    });

    return sorted.find((candidate) => !recommended || candidate.device.id !== recommended.device.id) || sorted[0];
  }

  function getRecommendationDevicePool() {
    return getRecommendationDevicePoolFor(state.useCaseLane, state.formFactor);
  }

  function getRecommendationDevicePoolFor(useCaseLaneId, formFactor) {
    let pool = useCaseLaneId === "any"
      ? recommendableDevices
      : recommendableDevices.filter((device) => getDeviceUseCaseLane(device) === useCaseLaneId);

    if (formFactor && formFactor !== "no-preference") {
      const laneMatches = pool.filter((device) => device.formFactor === formFactor);
      if (laneMatches.length) {
        return laneMatches;
      }

      const globalMatches = recommendableDevices.filter((device) => device.formFactor === formFactor);
      if (globalMatches.length) {
        return globalMatches;
      }
    }

    return pool;
  }

  function getVisibleRecommendationPool() {
    let pool = getRecommendationDevicePoolFor(state.useCaseLane, state.formFactor);

    if (state.brandPreference !== "any") {
      pool = pool.filter((device) => getDeviceBrandId(device) === state.brandPreference);
    }

    return pool;
  }

  function getDeviceBrandId(device) {
    return device && device.brand ? device.brand : "ayn";
  }

  function getDeviceUseCaseLane(device) {
    if (!device) {
      return "balanced-android";
    }

    if (device.useCaseLane) {
      return device.useCaseLane;
    }

    if (device.formFactor === "clamshell") {
      return "clamshell";
    }

    if (device.computeRank >= 4) {
      return "high-end-android";
    }

    if (device.computeRank >= 3) {
      return "balanced-android";
    }

    return "retro-focused";
  }

  function getUseCaseLaneName(laneId) {
    const selectedLane = (RULES.useCaseLanes || []).find((lane) => lane.id === laneId);
    return selectedLane ? selectedLane.name : "Selected lane";
  }

  function getPreferredBrandOptions(useCaseLaneId, formFactor) {
    const preferredLaneId = useCaseLaneId || (state ? state.useCaseLane : RULES.appDefaults.useCaseLane);
    const preferredFormFactor = formFactor || (state ? state.formFactor : RULES.appDefaults.formFactor);
    const liveBrandIds = new Set(
      getRecommendationDevicePoolFor(preferredLaneId, preferredFormFactor)
        .map((device) => getDeviceBrandId(device))
    );
    return (RULES.brands || []).filter((brand) => liveBrandIds.has(brand.id));
  }

  function updatePreferencePoolNote() {
    if (!elements.preferencePoolNote) {
      return;
    }

    const visiblePool = getVisibleRecommendationPool();
    if (!visiblePool.length) {
      elements.preferencePoolNote.hidden = true;
      elements.preferencePoolNote.textContent = "";
      return;
    }

    const brandIds = [...new Set(visiblePool.map((device) => getDeviceBrandId(device)))];
    const deviceCount = visiblePool.length;
    const brandCount = brandIds.length;
    const filterParts = [];

    if (state.useCaseLane !== "any") {
      filterParts.push(getUseCaseLaneName(state.useCaseLane));
    }

    if (state.formFactor !== "no-preference") {
      filterParts.push(formatFormFactorLabel(state.formFactor));
    }

    if (state.brandPreference !== "any") {
      filterParts.push(getBrandName(state.brandPreference));
    }

    let message = `Current live pool: ${deviceCount} device${deviceCount === 1 ? "" : "s"} across ${brandCount} brand${brandCount === 1 ? "" : "s"}.`;

    if (filterParts.length) {
      message += ` Active filters: ${filterParts.join(", ")}.`;
    }

    if (state.brandPreference === "any" && brandCount <= 4) {
      message += ` Brands in play: ${brandIds.map((brandId) => getBrandName(brandId)).join(", ")}.`;
    }

    elements.preferencePoolNote.hidden = false;
    elements.preferencePoolNote.textContent = message;
    elements.preferencePoolNote.classList.toggle("is-warning", deviceCount <= 2);
  }

  function getOwnedDeviceOptions(brandId) {
    if (!brandId) {
      return [];
    }

    if (brandId === "ayn") {
      return DEVICES
        .filter((device) => getDeviceBrandId(device) === "ayn")
        .map((device) => ({
          id: device.id,
          name: device.name
        }));
    }

    return ownedDevicesByBrand[brandId] ? [...ownedDevicesByBrand[brandId]] : [];
  }

  function getOwnedDeviceById(brandId, deviceId) {
    return getOwnedDeviceOptions(brandId).find((device) => device.id === deviceId) || null;
  }

  function getOwnedDeviceCompareProfile(brandId, deviceId) {
    const brandProfiles = ownedDeviceCompareProfiles[brandId];
    if (!brandProfiles) {
      return null;
    }

    const matchedProfile = (brandProfiles.profiles || []).find((profile) => (profile.ids || []).includes(deviceId));
    return matchedProfile || brandProfiles.fallback || null;
  }

  function getComparisonClass(device) {
    if (!device) {
      return "android-retro";
    }

    if (device.compareClass) {
      return device.compareClass;
    }

    const brandId = getDeviceBrandId(device);

    if (brandId === "gpd" || brandId === "onexplayer") {
      return "windows-handheld";
    }

    if (brandId === "razer" || brandId === "logitech-g") {
      return "cloud-streaming";
    }

    if (brandId === "gameforce" || brandId === "kinhank" || brandId === "miyoo" || brandId === "powkiddy" || brandId === "zpg") {
      return "linux-retro";
    }

    if (brandId === "ayaneo" && device.name && !device.name.toLowerCase().includes("pocket")) {
      return "windows-handheld";
    }

    if (brandId === "ayn" && device.name === "Loki") {
      return "windows-handheld";
    }

    return "android-retro";
  }

  function getCurrentComparisonDevice() {
    if (state.ownsDevice !== "yes" || !state.currentBrand || !state.currentDeviceId) {
      return null;
    }

    if (deviceMap.has(state.currentDeviceId)) {
      const currentDevice = deviceMap.get(state.currentDeviceId);
      return {
        ...currentDevice,
        compareClass: getComparisonClass(currentDevice),
        estimatedProfile: false
      };
    }

    const ownedDevice = getOwnedDeviceById(state.currentBrand, state.currentDeviceId);
    const comparisonProfile = getOwnedDeviceCompareProfile(state.currentBrand, state.currentDeviceId);

    if (!ownedDevice || !comparisonProfile) {
      return null;
    }

    return {
      id: ownedDevice.id,
      brand: state.currentBrand,
      name: ownedDevice.name,
      family: ownedDevice.name,
      ram: comparisonProfile.ram,
      storage: comparisonProfile.storage,
      computeRank: comparisonProfile.computeRank,
      formFactor: comparisonProfile.formFactor || "horizontal",
      dualScreen: Boolean(comparisonProfile.dualScreen),
      compareClass: comparisonProfile.compareClass || "android-retro",
      estimatedProfile: true,
      available: false,
      recommendable: false
    };
  }

  function getBrandName(brandId) {
    return (brandMap.get(brandId) || brandMap.get("ayn") || { name: "AYN" }).name;
  }

  function getOwnedDeviceLabel() {
    if (!state.currentBrand) {
      return "";
    }

    if (state.currentDeviceId && deviceMap.has(state.currentDeviceId)) {
      return deviceMap.get(state.currentDeviceId).name;
    }

    const ownedDevice = getOwnedDeviceById(state.currentBrand, state.currentDeviceId);
    return ownedDevice ? ownedDevice.name : getBrandName(state.currentBrand);
  }

  function buildOwnershipNote(currentDevice, currentComparison) {
    if (state.ownsDevice !== "yes" || !state.currentBrand || !state.currentDeviceId) {
      return "";
    }

    if (!currentDevice) {
      return `Current handheld noted: ${getOwnedDeviceLabel()}. No family estimate is mapped yet for deeper comparison.`;
    }

    if (currentDevice.estimatedProfile) {
      const laneNote = currentComparison && currentComparison.differentLane
        ? " This is a cross-lane estimate, so treat it as directional."
        : "";
      return `Current handheld matched by family estimate: ${getOwnedDeviceLabel()}. This uses broad specs for comparison, not a full exact device sheet.${laneNote}`;
    }

    return "";
  }

  function getSdOvershootPenalty(device, storage, performance) {
    if (!storage.sdCardSizeGb || device.storage < storage.internalCoreNeed) {
      return 0;
    }

    const baselineInternalTarget = Math.max(128, Math.ceil(storage.internalCoreNeed / 64) * 64);
    const overshoot = Math.max(0, device.storage - baselineInternalTarget);
    const lowDemandProfile = performance.computeFloorRank <= 2 && performance.recommendedRam <= 12;
    const scale = lowDemandProfile ? 1.15 : 0.7;

    return Math.min(18, Math.round((overshoot / 128) * 3 * scale));
  }

  function selectRecommendedCandidate(pool, fallbackPool) {
    const baseline = pool[0] || null;
    if (!baseline) {
      return {
        candidate: baseline,
        preferenceApplied: false,
        reason: ""
      };
    }

    let candidate = baseline;
    let preferenceApplied = false;
    let reason = "";
    let workingPool = pool;
    const minimumFallbackPool = fallbackPool && fallbackPool.length ? fallbackPool : pool;

    if (state.brandPreference !== "any") {
      let preferredBrandCandidates = pool.filter((entry) => getDeviceBrandId(entry.device) === state.brandPreference);
      let usedMinimumBrandFallback = false;

      if (!preferredBrandCandidates.length) {
        preferredBrandCandidates = minimumFallbackPool.filter((entry) => {
          return getDeviceBrandId(entry.device) === state.brandPreference
            && entry.meetsMinimumCore;
        });
        usedMinimumBrandFallback = preferredBrandCandidates.length > 0;
      }

      const preferredBrandTop = preferredBrandCandidates[0] || null;

      if (preferredBrandTop && preferredBrandTop.device.id !== candidate.device.id) {
        const brandOverrideWindow = getBrandOverrideWindow(usedMinimumBrandFallback);
        if (preferredBrandTop.score >= candidate.score - brandOverrideWindow) {
          candidate = preferredBrandTop;
          workingPool = preferredBrandCandidates;
          preferenceApplied = true;
          reason = usedMinimumBrandFallback
            ? `${getBrandName(state.brandPreference)} preference kept the final pick on ${preferredBrandTop.device.name} because it still clears the minimum fit without forcing a jump to ${baseline.device.name}.`
            : `${getBrandName(state.brandPreference)} preference tipped the final pick toward ${preferredBrandTop.device.name} over ${baseline.device.name}.`;
        }
      } else if (preferredBrandTop) {
        workingPool = preferredBrandCandidates;
      }
    }

    if (state.formFactor !== "no-preference") {
      const preferredFormCandidates = workingPool.filter((entry) => entry.device.formFactor === state.formFactor);
      const preferredFormTop = preferredFormCandidates[0] || null;

      if (preferredFormTop && preferredFormTop.device.id !== candidate.device.id) {
        const formOverrideWindow = getFormFactorOverrideWindow();
        if (preferredFormTop.score >= candidate.score - formOverrideWindow) {
          const previousName = candidate.device.name;
          const previousReason = reason;
          candidate = preferredFormTop;
          preferenceApplied = true;
          reason = previousReason
            ? `${previousReason} ${formatFormFactorLabel(state.formFactor)} preference then pushed the final pick to ${preferredFormTop.device.name}.`
            : `${formatFormFactorLabel(state.formFactor)} preference tipped the final pick toward ${preferredFormTop.device.name} over ${previousName}.`;
        }
      }
    }

    return {
      candidate,
      preferenceApplied,
      reason
    };
  }

  function buildTopCandidates(recommended, pool) {
    const candidates = [];

    if (recommended) {
      candidates.push(recommended);
    }

    pool.forEach((candidate) => {
      const exists = candidates.some((item) => item.device.id === candidate.device.id);
      if (!exists && candidates.length < 3) {
        candidates.push(candidate);
      }
    });

    return candidates.slice(0, 3);
  }

  function getOptionalFit(recommended, pool) {
    if (!pool.length) {
      return null;
    }

    const sorted = [...pool].sort((left, right) => {
      const leftPrice = getValidPrice(left.device) ?? Number.MAX_SAFE_INTEGER;
      const rightPrice = getValidPrice(right.device) ?? Number.MAX_SAFE_INTEGER;
      if (leftPrice !== rightPrice) {
        return leftPrice - rightPrice;
      }

      return right.rankScore - left.rankScore;
    });

    return sorted.find((candidate) => !recommended || candidate.device.id !== recommended.device.id) || null;
  }

  function getDeviceStoragePool(device, storage) {
    return device.storage + (storage.sdCardSizeGb || 0);
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

      return right.rankScore - left.rankScore;
    });

    const futureProof = sorted.find((candidate) => candidate.device.computeRank >= computeFloorRank && (!recommended || candidate.device.id !== recommended.device.id));
    return futureProof || sorted[0];
  }

  function getBrandOverrideWindow(usedMinimumBrandFallback) {
    if (state.brandPreference !== "any") {
      return usedMinimumBrandFallback ? 34 : 24;
    }

    return 0;
  }

  function getFormFactorOverrideWindow() {
    if (state.formFactor === "clamshell") {
      return 14;
    }

    if (state.formFactor === "vertical") {
      return 12;
    }

    if (state.formFactor === "horizontal") {
      return 12;
    }

    return 0;
  }

  function formatFormFactorLabel(formFactor) {
    if (formFactor === "clamshell") {
      return "Clamshell";
    }

    if (formFactor === "vertical") {
      return "Vertical";
    }

    if (formFactor === "horizontal") {
      return "Horizontal";
    }

    return "No preference";
  }

  function getSystemLaneSupport(system, laneId = state ? state.useCaseLane : RULES.appDefaults.useCaseLane) {
    if (!system) {
      return "supported";
    }

    if (laneId === "retro-focused") {
      return system.retroFocusedSupport || "supported";
    }

    return "supported";
  }

  function getLaneSupportSummary(systemIds) {
    const summary = { blocked: [], limited: [] };

    if (state.useCaseLane !== "retro-focused") {
      return summary;
    }

    systemIds.forEach((systemId) => {
      const system = systemMap.get(systemId);
      const laneSupport = getSystemLaneSupport(system);

      if (!system) {
        return;
      }

      if (laneSupport === "unsupported") {
        summary.blocked.push(system.name);
      } else if (laneSupport === "limited") {
        summary.limited.push(system.name);
      }
    });

    return summary;
  }

  function getActiveLaneSupportSummary(breakdown) {
    return getLaneSupportSummary((breakdown || []).map((entry) => entry.id));
  }

  function updateSystemLaneNote() {
    if (!elements.systemLaneNote) {
      return;
    }

    const supportSummary = getLaneSupportSummary(state.selectedSystems);
    let message = "";

    if (state.useCaseLane === "retro-focused") {
      message = "Low End Retro is meant for older retro handhelds. PSP, Dreamcast, Saturn, and heavier arcade sets sit near the upper edge. PS2, GameCube, Wii, 3DS, Vita, Android, PC, Switch, Wii U, PS3, and Xbox are outside this lane.";

      if (supportSummary.blocked.length) {
        message = `${formatJoinedList(supportSummary.blocked)} sit outside Low End Retro. Pick a stronger lane or remove them.`;
      } else if (supportSummary.limited.length) {
        message = `${formatJoinedList(supportSummary.limited)} sit near the upper edge of Low End Retro. The stronger picks in this lane handle them better than the cheapest ones.`;
      }
    }

    elements.systemLaneNote.hidden = !message;
    elements.systemLaneNote.textContent = message;
    elements.systemLaneNote.classList.toggle("is-warning", state.useCaseLane === "retro-focused");
  }

  function buildSelectedLaneWarnings() {
    const supportSummary = getLaneSupportSummary(state.selectedSystems);
    const warnings = [];

    if (supportSummary.blocked.length) {
      warnings.push(`${formatJoinedList(supportSummary.blocked)} sit outside ${getUseCaseLaneName(state.useCaseLane)}. Pick a stronger lane or remove them.`);
    }

    if (supportSummary.limited.length) {
      warnings.push(`${formatJoinedList(supportSummary.limited)} sit near the upper edge of ${getUseCaseLaneName(state.useCaseLane)}.`);
    }

    return warnings.map((warning) => `<div class="inline-note is-warning">${escapeHtml(warning)}</div>`).join("");
  }

  function buildNoSupportedMatchMessage(analysis) {
    if (analysis.laneSupport && analysis.laneSupport.blocked.length) {
      return `${getUseCaseLaneName(state.useCaseLane)} does not honestly cover ${formatJoinedList(analysis.laneSupport.blocked)}. Pick a stronger lane or remove those systems.`;
    }

    return "No supported recommendation was found from the current live pool for these inputs.";
  }

  function createEmptyScoring() {
    return {
      scored: [],
      recommended: null,
      preferenceApplied: false,
      preferenceReason: "",
      optionalFit: null,
      budgetAlternative: null,
      futureProofOption: null,
      topCandidates: []
    };
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
      format: state.format,
      ownsDevice: state.ownsDevice,
      currentBrand: state.currentBrand,
      currentDeviceId: state.currentDeviceId,
      useCaseLane: state.useCaseLane,
      brandPreference: state.brandPreference,
      formFactor: state.formFactor,
      useSdCard: state.useSdCard,
      sdCardSizeGb: state.sdCardSizeGb,
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

  function buildFitScoreInfo() {
    return `How is Performance Score Determined?
- ${FIT_SCORE_WEIGHTS.performance}% = how well it runs heavy stuff
- ${FIT_SCORE_WEIGHTS.ram}% = enough RAM (smooth multitasking)
- ${FIT_SCORE_WEIGHTS.storage}% = enough storage (space + speed)
- ${FIT_SCORE_WEIGHTS.value}% = price vs what you get
- ${FIT_SCORE_WEIGHTS.preference}% = preferences after lane filtering (brand first, then form factor)

Score Guideline
- 90-100 = amazing
- 75-89 = good
- 60-74 = okay
- below 60 = bad

This is based on your Games selected and not neccasarily highest system.
Low End Retro uses lighter RAM and storage checks when the selected systems stay in that lane.`;
  }

  function buildFitScoreBreakdownInfo(scoreBreakdown) {
    return `Performance Score Breakdown

- Heavy Systems = ${scoreBreakdown.performance}/${FIT_SCORE_WEIGHTS.performance}
- RAM = ${scoreBreakdown.ram}/${FIT_SCORE_WEIGHTS.ram}
- Storage = ${scoreBreakdown.storage}/${FIT_SCORE_WEIGHTS.storage}
- Price vs Value = ${scoreBreakdown.value}/${FIT_SCORE_WEIGHTS.value}
- Preferences = ${scoreBreakdown.preference}/${FIT_SCORE_WEIGHTS.preference}

Total = ${scoreBreakdown.total}/100`;
  }

  function formatFitScore(value) {
    return `${Math.round(value)}%`;
  }

  function buildShareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("state", encodeState(JSON.stringify(serializeState())));
    return url.toString();
  }

  function buildExportText(analysis) {
    const lines = [];
    if (!analysis.scoring.recommended) {
      lines.push("Which Handheld Should I Buy?");
      lines.push("");
      lines.push(buildNoSupportedMatchMessage(analysis));
      return lines.join("\n");
    }

    const recommendedCandidate = analysis.scoring.recommended;
    const currentSection = analysis.currentComparison
      ? [
        "",
        "Compared to your current device",
        `${analysis.currentComparison.currentDevice.name} vs ${analysis.currentComparison.recommendedDevice.name}`,
        `${capitalizeWords(analysis.currentComparison.classification)}: ${analysis.currentComparison.explanation}`
      ]
      : [];

    lines.push("Which Handheld Should I Buy?");
    lines.push("");
    lines.push(`Recommended Device: ${analysis.keepCurrent && analysis.currentComparison ? `Keep your current ${analysis.currentComparison.currentDevice.name}` : recommendedCandidate.device.name}`);
    lines.push(`Local Price: ${getRecommendedPriceLabel(analysis, recommendedCandidate.device)}`);
    lines.push(`Estimated RAM Need: ${analysis.performance.recommendedRam}GB recommended, ${analysis.performance.minimumRam}GB minimum acceptable`);
    lines.push(`Estimated Storage Need: ${formatSize(analysis.storage.minimumLikely)} minimum likely, ${formatSize(analysis.storage.expectedAverage)} expected average, ${formatSize(analysis.storage.comfortableUpper)} comfortable upper`);
    if (analysis.ownershipNote) {
      lines.push(`Current Handheld: ${getOwnedDeviceLabel()}`);
      lines.push(analysis.ownershipNote);
    }
    if (analysis.storage.sdCardSizeGb) {
      lines.push(`SD Card: ${formatSdCardSize(analysis.storage.sdCardSizeGb)} included in storage fit`);
    }
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

  function normalizeSdCardSize(value, fallback) {
    const allowed = [128, 256, 512, 1024, 2048];
    const numeric = Number(value);
    if (allowed.indexOf(numeric) === -1) {
      return fallback;
    }

    return numeric;
  }

  function formatSdCardSize(valueGb) {
    if (valueGb === 1024) {
      return "1TB";
    }

    if (valueGb === 2048) {
      return "2TB";
    }

    return `${valueGb}GB`;
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

  function getPerformanceUsageBand(entry) {
    if (entry.type === "system") {
      return "edge";
    }

    return entry.usageBand;
  }

  function getPerformanceUsageScale(entry) {
    if (entry.type === "system") {
      return RULES.libraryScale(1);
    }

    return RULES.libraryScale(entry.effectiveCount);
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

    if (valueGb >= 1024) {
      const valueTb = valueGb / 1024;
      const roundedTb = Math.round(valueTb * 10) / 10;
      return Number.isInteger(roundedTb) ? `${roundedTb}TB` : `${roundedTb.toFixed(1)}TB`;
    }

    return `${Math.round(valueGb)}GB`;
  }

  function formatDevicePrice(device) {
    if (!device || !Number.isFinite(device.priceUsd) || device.priceUsd <= 0) {
      return "Price not set";
    }

    return usdFormatter.format(device.priceUsd);
  }

  function getRecommendedPriceLabel(analysis, device) {
    if (analysis.keepCurrent && analysis.currentComparison) {
      return "No new spend";
    }

    return formatDevicePrice(device);
  }

  function getRecommendedPriceCopy(analysis, device) {
    if (analysis.keepCurrent && analysis.currentComparison) {
      return "Your current device already fits this setup, so the tool does not see a needed new purchase.";
    }

    const brandName = getBrandName(getDeviceBrandId(device));
    const batchStorageNote = hasCurrentStoreStorageChange(device)
      ? ` Current ${device.currentBatchLabel} listing shows ${device.storageSpec} instead of the earlier ${device.priorStorageSpec} spec. On paper that is slower, but for most people the practical hit is mostly installs, transfers, and other large file work. Emulator and game performance are usually affected much less than people are making it sound.`
      : "";
    const preOrderNote = device.preOrder && !(device.currentBatchLabel && /pre-order/i.test(device.currentBatchLabel))
      ? " Current listing is still marked pre-order."
      : "";
    return `Official ${brandName} store price snapshot for ${device.name}.${batchStorageNote}${preOrderNote}`;
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
