(function () {
  const performanceTiers = [
    {
      id: "light",
      rank: 1,
      ram: 8,
      label: "Light",
      shortLabel: "8GB",
      description: "Mostly older systems, lighter Android use, and small libraries."
    },
    {
      id: "mid",
      rank: 2,
      ram: 12,
      label: "Mid",
      shortLabel: "12GB",
      description: "Mixed libraries with some harder systems, but not constant heavy use."
    },
    {
      id: "high",
      rank: 3,
      ram: 16,
      label: "High",
      shortLabel: "16GB",
      description: "Frequent PS2, GameCube, Wii, 3DS, tougher Android, or mixed workloads."
    },
    {
      id: "enthusiast",
      rank: 4,
      ram: 24,
      label: "Enthusiast",
      shortLabel: "24GB",
      description: "Persistent high-end use, demanding PC profiles, and maximum headroom."
    }
  ];

  const futureProofLabels = [
    { max: 20, label: "Strict Budget" },
    { max: 45, label: "Budget Leaning" },
    { max: 65, label: "Balanced" },
    { max: 85, label: "Future Proof Leaning" },
    { max: 100, label: "Max Headroom" }
  ];

  const themeGroups = [
    { id: "default", name: "Default Themes" },
    { id: "animated", name: "Animated Themes (Experimental)" }
  ];

  const themes = [
    { id: "canyon-dust", name: "Canyon Dust", group: "default" },
    { id: "signal-red", name: "Signal Red", group: "default" },
    { id: "sea-glass", name: "Sea Glass", group: "default" },
    { id: "midnight-grid", name: "Midnight Grid", group: "default" },
    { id: "alaska", name: "Alaska", group: "default" },
    { id: "biohazard", name: "BioHazard", group: "default" },
    { id: "snes-rainbow", name: "SNES Rainbow Glow", group: "default" },
    { id: "rain", name: "Rain", group: "animated" },
    { id: "shooting-star", name: "Shooting Star", group: "animated" },
    { id: "color-drip", name: "ColorDrip", group: "animated" },
    { id: "bubbly", name: "Bubbly", group: "animated" }
  ];

  const formats = [
    { id: "default", name: "Default" },
    { id: "simple", name: "Simple" },
    { id: "properties", name: "Properties V1" }
  ];

  const appDefaults = {
    theme: "canyon-dust",
    format: "default",
    ownsDevice: "no",
    currentDeviceId: "",
    formFactor: "no-preference",
    useSdCard: "no",
    sdCardSizeGb: 512,
    futureProofBias: 50,
    advancedMode: false,
    selectedSystems: [],
    systems: {},
    advanced: {
      osReserveGb: 22,
      appReserveGb: 14,
      cacheBaseGb: 10,
      cachePerHundredGb: 6,
      safetyBufferPct: 28
    }
  };

  const storageThresholds = {
    minimumLikelySafetyShift: -8,
    comfortableUpperSafetyShift: 5
  };

  const performanceThresholds = {
    ramFloorLight: 1.75,
    ramFloorMid: 2.7,
    ramFloorHigh: 3.8,
    bumpPressure: 0.8
  };

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(appDefaults));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getTierByRank(rank) {
    return performanceTiers.find((tier) => tier.rank === rank) || performanceTiers[0];
  }

  function getTierById(id) {
    return performanceTiers.find((tier) => tier.id === id) || performanceTiers[0];
  }

  function tierRankFromId(id) {
    return getTierById(id).rank;
  }

  function usageBand(count) {
    if (count >= 15) {
      return "primary";
    }

    if (count >= 4) {
      return "secondary";
    }

    if (count > 0) {
      return "edge";
    }

    return "none";
  }

  function usageWeight(band) {
    if (band === "primary") {
      return 1;
    }

    if (band === "secondary") {
      return 0.62;
    }

    if (band === "edge") {
      return 0.28;
    }

    return 0;
  }

  function libraryScale(count) {
    if (!count) {
      return 0;
    }

    return clamp(0.52 + (Math.log10(count + 1) / 2), 0.65, 1.25);
  }

  function ramTierRankFromScore(score) {
    if (score < performanceThresholds.ramFloorLight) {
      return 1;
    }

    if (score < performanceThresholds.ramFloorMid) {
      return 2;
    }

    if (score < performanceThresholds.ramFloorHigh) {
      return 3;
    }

    return 4;
  }

  function futureProofLabel(value) {
    return futureProofLabels.find((entry) => value <= entry.max).label;
  }

  window.Rules = {
    performanceTiers,
    futureProofLabels,
    themeGroups,
    themes,
    formats,
    appDefaults,
    storageThresholds,
    performanceThresholds,
    cloneDefaults,
    clamp,
    getTierByRank,
    getTierById,
    tierRankFromId,
    usageBand,
    usageWeight,
    libraryScale,
    ramTierRankFromScore,
    futureProofLabel
  };
})();
