(function () {
  const APP_VERSION = "v.6.5.2";
  const LOCAL_STORAGE_KEY = "which2buy-state-v1";
  const FIT_SCORE_WEIGHTS = {
    performance: 30,
    ram: 20,
    storage: 18,
    value: 10,
    preference: 8,
    experience: 14
  };
  const EXPERIENCE_SCORE_WEIGHTS = {
    screen: 3.5,
    controls: 3,
    portability: 2.5,
    battery: 2,
    software: 2,
    touch: 1
  };
  const FIT_SCORE_INFO = buildFitScoreInfo();
  const SYSTEMS = window.SystemsData || [];
  const RULES = window.Rules;
  const ownedDevicesByBrand = RULES.ownedDevicesByBrand || {};
  const ownedDeviceCompareProfiles = RULES.ownedDeviceCompareProfiles || {};
  const SYSTEM_ACCURACY_PROFILES = {
    default: { screenBig: 0.45, screenRetro: 0.45, dualScreen: 0, sticks: 0.5, dpad: 0.5, portability: 0.55, battery: 0.45, software: 0.35, touch: 0, confidenceRisk: 0.15 },
    nes: { screenBig: 0.18, screenRetro: 0.9, dualScreen: 0, sticks: 0.15, dpad: 0.95, portability: 0.85, battery: 0.7, software: 0.12, touch: 0, confidenceRisk: 0.08 },
    snes: { screenBig: 0.2, screenRetro: 0.92, dualScreen: 0, sticks: 0.2, dpad: 0.95, portability: 0.82, battery: 0.7, software: 0.12, touch: 0, confidenceRisk: 0.08 },
    "n64": { screenBig: 0.34, screenRetro: 0.68, dualScreen: 0, sticks: 0.65, dpad: 0.45, portability: 0.68, battery: 0.55, software: 0.2, touch: 0, confidenceRisk: 0.14 },
    "gb-gbc-gba": { screenBig: 0.18, screenRetro: 1, dualScreen: 0, sticks: 0.1, dpad: 0.96, portability: 0.9, battery: 0.72, software: 0.12, touch: 0, confidenceRisk: 0.08 },
    ds: { screenBig: 0.46, screenRetro: 0.58, dualScreen: 1, sticks: 0.22, dpad: 0.78, portability: 0.64, battery: 0.5, software: 0.42, touch: 0.72, confidenceRisk: 0.2 },
    "3ds": { screenBig: 0.56, screenRetro: 0.54, dualScreen: 0.86, sticks: 0.45, dpad: 0.62, portability: 0.56, battery: 0.52, software: 0.72, touch: 0.62, confidenceRisk: 0.42 },
    gamecube: { screenBig: 0.62, screenRetro: 0.34, dualScreen: 0, sticks: 0.88, dpad: 0.35, portability: 0.46, battery: 0.58, software: 0.45, touch: 0, confidenceRisk: 0.24 },
    wii: { screenBig: 0.64, screenRetro: 0.28, dualScreen: 0, sticks: 0.82, dpad: 0.34, portability: 0.42, battery: 0.56, software: 0.5, touch: 0, confidenceRisk: 0.28 },
    "wii-u": { screenBig: 0.76, screenRetro: 0.18, dualScreen: 0.18, sticks: 0.86, dpad: 0.28, portability: 0.26, battery: 0.58, software: 0.92, touch: 0.2, confidenceRisk: 0.88 },
    switch: { screenBig: 0.72, screenRetro: 0.22, dualScreen: 0, sticks: 0.86, dpad: 0.3, portability: 0.36, battery: 0.62, software: 0.88, touch: 0.12, confidenceRisk: 0.82 },
    xbox: { screenBig: 0.78, screenRetro: 0.1, dualScreen: 0, sticks: 0.94, dpad: 0.22, portability: 0.22, battery: 0.62, software: 0.96, touch: 0, confidenceRisk: 0.95 },
    ps1: { screenBig: 0.34, screenRetro: 0.84, dualScreen: 0, sticks: 0.32, dpad: 0.76, portability: 0.76, battery: 0.62, software: 0.18, touch: 0, confidenceRisk: 0.1 },
    ps2: { screenBig: 0.64, screenRetro: 0.3, dualScreen: 0, sticks: 0.88, dpad: 0.32, portability: 0.42, battery: 0.56, software: 0.52, touch: 0, confidenceRisk: 0.3 },
    ps3: { screenBig: 0.82, screenRetro: 0.08, dualScreen: 0, sticks: 0.96, dpad: 0.22, portability: 0.18, battery: 0.6, software: 1, touch: 0, confidenceRisk: 1 },
    psp: { screenBig: 0.58, screenRetro: 0.38, dualScreen: 0, sticks: 0.46, dpad: 0.62, portability: 0.72, battery: 0.56, software: 0.24, touch: 0, confidenceRisk: 0.18 },
    vita: { screenBig: 0.56, screenRetro: 0.34, dualScreen: 0, sticks: 0.76, dpad: 0.5, portability: 0.58, battery: 0.52, software: 0.68, touch: 0.22, confidenceRisk: 0.38 },
    dreamcast: { screenBig: 0.48, screenRetro: 0.52, dualScreen: 0, sticks: 0.7, dpad: 0.5, portability: 0.58, battery: 0.52, software: 0.3, touch: 0, confidenceRisk: 0.24 },
    saturn: { screenBig: 0.46, screenRetro: 0.62, dualScreen: 0, sticks: 0.42, dpad: 0.68, portability: 0.58, battery: 0.52, software: 0.42, touch: 0, confidenceRisk: 0.34 },
    "sega-cd": { screenBig: 0.28, screenRetro: 0.84, dualScreen: 0, sticks: 0.18, dpad: 0.92, portability: 0.76, battery: 0.62, software: 0.14, touch: 0, confidenceRisk: 0.12 },
    genesis: { screenBig: 0.18, screenRetro: 0.95, dualScreen: 0, sticks: 0.12, dpad: 0.96, portability: 0.84, battery: 0.7, software: 0.12, touch: 0, confidenceRisk: 0.08 },
    arcade: { screenBig: 0.44, screenRetro: 0.6, dualScreen: 0, sticks: 0.52, dpad: 0.68, portability: 0.6, battery: 0.5, software: 0.3, touch: 0, confidenceRisk: 0.28 },
    android: { screenBig: 0.62, screenRetro: 0.24, dualScreen: 0, sticks: 0.74, dpad: 0.42, portability: 0.44, battery: 0.58, software: 0.62, touch: 0.18, confidenceRisk: 0.26 },
    pc: { screenBig: 0.74, screenRetro: 0.12, dualScreen: 0, sticks: 0.9, dpad: 0.2, portability: 0.24, battery: 0.66, software: 0.82, touch: 0.08, confidenceRisk: 0.38 }
  };
  const SYSTEM_COMPATIBILITY_PROFILES = {
    default: { screenTarget: "balanced", controlTarget: "balanced", touchNeed: "none", softwareNeed: 0.35, portabilityTarget: 0.55, analogNeed: false },
    nes: { screenTarget: "retro", controlTarget: "dpad", touchNeed: "none", softwareNeed: 0.12, portabilityTarget: 0.84, analogNeed: false },
    snes: { screenTarget: "retro", controlTarget: "dpad", touchNeed: "none", softwareNeed: 0.12, portabilityTarget: 0.82, analogNeed: false },
    "gb-gbc-gba": { screenTarget: "retro", controlTarget: "dpad", touchNeed: "none", softwareNeed: 0.12, portabilityTarget: 0.88, analogNeed: false },
    genesis: { screenTarget: "retro", controlTarget: "dpad", touchNeed: "none", softwareNeed: 0.12, portabilityTarget: 0.84, analogNeed: false },
    "sega-cd": { screenTarget: "retro", controlTarget: "dpad", touchNeed: "none", softwareNeed: 0.14, portabilityTarget: 0.76, analogNeed: false },
    ps1: { screenTarget: "retro", controlTarget: "dpad-balanced", touchNeed: "none", softwareNeed: 0.18, portabilityTarget: 0.74, analogNeed: false },
    n64: { screenTarget: "retro-balanced", controlTarget: "balanced", touchNeed: "none", softwareNeed: 0.2, portabilityTarget: 0.66, analogNeed: true },
    dreamcast: { screenTarget: "retro-balanced", controlTarget: "balanced", touchNeed: "none", softwareNeed: 0.3, portabilityTarget: 0.58, analogNeed: true },
    saturn: { screenTarget: "retro-balanced", controlTarget: "dpad-balanced", touchNeed: "none", softwareNeed: 0.42, portabilityTarget: 0.58, analogNeed: false },
    arcade: { screenTarget: "retro-balanced", controlTarget: "balanced", touchNeed: "none", softwareNeed: 0.3, portabilityTarget: 0.6, analogNeed: false },
    ds: { screenTarget: "dual", controlTarget: "dpad", touchNeed: "required", softwareNeed: 0.28, portabilityTarget: 0.64, analogNeed: false, formFactorNeed: "clamshell-prefer" },
    "3ds": { screenTarget: "dual-large", controlTarget: "balanced", touchNeed: "required", softwareNeed: 0.72, portabilityTarget: 0.56, analogNeed: true, formFactorNeed: "clamshell-strong" },
    psp: { screenTarget: "wide", controlTarget: "balanced", touchNeed: "none", softwareNeed: 0.24, portabilityTarget: 0.72, analogNeed: false },
    gamecube: { screenTarget: "wide", controlTarget: "stick", touchNeed: "none", softwareNeed: 0.45, portabilityTarget: 0.46, analogNeed: true },
    wii: { screenTarget: "wide", controlTarget: "stick", touchNeed: "none", softwareNeed: 0.5, portabilityTarget: 0.42, analogNeed: true },
    ps2: { screenTarget: "wide", controlTarget: "stick", touchNeed: "none", softwareNeed: 0.52, portabilityTarget: 0.42, analogNeed: true },
    vita: { screenTarget: "wide", controlTarget: "stick", touchNeed: "prefer", softwareNeed: 0.68, portabilityTarget: 0.58, analogNeed: true },
    android: { screenTarget: "wide", controlTarget: "stick", touchNeed: "prefer", softwareNeed: 0.62, portabilityTarget: 0.44, analogNeed: true },
    switch: { screenTarget: "wide-large", controlTarget: "stick", touchNeed: "prefer", softwareNeed: 0.88, portabilityTarget: 0.36, analogNeed: true },
    "wii-u": { screenTarget: "wide-large", controlTarget: "stick", touchNeed: "prefer", softwareNeed: 0.92, portabilityTarget: 0.26, analogNeed: true },
    xbox: { screenTarget: "wide-large", controlTarget: "stick", touchNeed: "none", softwareNeed: 0.96, portabilityTarget: 0.22, analogNeed: true },
    ps3: { screenTarget: "wide-large", controlTarget: "stick", touchNeed: "none", softwareNeed: 1, portabilityTarget: 0.18, analogNeed: true },
    pc: { screenTarget: "wide-large", controlTarget: "stick", touchNeed: "none", softwareNeed: 0.82, portabilityTarget: 0.24, analogNeed: true }
  };
  const DEVICE_TRAIT_BASES = {
    premiumLarge: { label: "Large premium Android", bigScreen: 0.9, retroScreen: 0.46, dualScreen: 0, sticks: 0.92, dpad: 0.58, portability: 0.42, battery: 0.78, software: 0.82, touch: true },
    premiumPocket: { label: "Compact premium Android", bigScreen: 0.7, retroScreen: 0.52, dualScreen: 0, sticks: 0.88, dpad: 0.62, portability: 0.64, battery: 0.72, software: 0.82, touch: true },
    premiumDual: { label: "Premium dual screen", bigScreen: 0.74, retroScreen: 0.48, dualScreen: 1, sticks: 0.48, dpad: 0.78, portability: 0.54, battery: 0.64, software: 0.78, touch: true },
    midDual: { label: "Dual screen Android", bigScreen: 0.62, retroScreen: 0.54, dualScreen: 1, sticks: 0.34, dpad: 0.82, portability: 0.64, battery: 0.68, software: 0.72, touch: true },
    midClamshell: { label: "Android clamshell", bigScreen: 0.48, retroScreen: 0.58, dualScreen: 0, sticks: 0.44, dpad: 0.82, portability: 0.8, battery: 0.74, software: 0.72, touch: true },
    verticalAndroid: { label: "Android vertical", bigScreen: 0.42, retroScreen: 0.84, dualScreen: 0, sticks: 0.3, dpad: 0.9, portability: 0.78, battery: 0.7, software: 0.73, touch: true },
    squareAndroid: { label: "Square Android", bigScreen: 0.58, retroScreen: 0.96, dualScreen: 0, sticks: 0.6, dpad: 0.78, portability: 0.68, battery: 0.74, software: 0.72, touch: true },
    largeAndroid: { label: "Large Android", bigScreen: 0.84, retroScreen: 0.62, dualScreen: 0, sticks: 0.88, dpad: 0.62, portability: 0.5, battery: 0.72, software: 0.74, touch: true },
    midAndroid: { label: "Balanced Android", bigScreen: 0.56, retroScreen: 0.64, dualScreen: 0, sticks: 0.78, dpad: 0.66, portability: 0.64, battery: 0.72, software: 0.72, touch: true },
    retroHorizontal: { label: "Retro horizontal", bigScreen: 0.32, retroScreen: 0.82, dualScreen: 0, sticks: 0.42, dpad: 0.84, portability: 0.82, battery: 0.88, software: 0.66, touch: false },
    retroVertical: { label: "Retro vertical", bigScreen: 0.28, retroScreen: 0.94, dualScreen: 0, sticks: 0.16, dpad: 0.94, portability: 0.9, battery: 0.9, software: 0.68, touch: false },
    retroClamshell: { label: "Retro clamshell", bigScreen: 0.26, retroScreen: 0.84, dualScreen: 0, sticks: 0.18, dpad: 0.88, portability: 0.9, battery: 0.86, software: 0.66, touch: false },
    retroSquare: { label: "Square retro", bigScreen: 0.46, retroScreen: 1, dualScreen: 0, sticks: 0.54, dpad: 0.8, portability: 0.74, battery: 0.82, software: 0.67, touch: false },
    linuxLarge: { label: "Large retro", bigScreen: 0.74, retroScreen: 0.72, dualScreen: 0, sticks: 0.68, dpad: 0.72, portability: 0.48, battery: 0.86, software: 0.68, touch: false },
    windowsHandheld: { label: "Windows handheld", bigScreen: 0.8, retroScreen: 0.28, dualScreen: 0, sticks: 0.92, dpad: 0.52, portability: 0.28, battery: 0.56, software: 0.84, touch: true },
    windowsCompact: { label: "Compact Windows handheld", bigScreen: 0.66, retroScreen: 0.34, dualScreen: 0, sticks: 0.9, dpad: 0.56, portability: 0.44, battery: 0.5, software: 0.84, touch: true },
    cloudLarge: { label: "Streaming handheld", bigScreen: 0.92, retroScreen: 0.3, dualScreen: 0, sticks: 0.84, dpad: 0.56, portability: 0.46, battery: 0.82, software: 0.78, touch: true }
  };
  const DEVICE_TRAIT_OVERRIDES = {
    "odin3-base": { bigScreen: 0.88, portability: 0.46, battery: 0.8 },
    "odin3-pro": { bigScreen: 0.88, portability: 0.46, battery: 0.8 },
    "odin3-max": { bigScreen: 0.88, portability: 0.44, battery: 0.78 },
    "odin3-ultra": { bigScreen: 0.88, portability: 0.42, battery: 0.76 },
    "odin2-portal-base": { bigScreen: 0.98, portability: 0.4, battery: 0.76, retroScreen: 0.56 },
    "odin2-portal-pro": { bigScreen: 0.98, portability: 0.4, battery: 0.76, retroScreen: 0.56 },
    "odin2-portal-max": { bigScreen: 0.98, portability: 0.38, battery: 0.74, retroScreen: 0.56 },
    "retroid-pocket-5": { portability: 0.66, bigScreen: 0.7 },
    "retroid-pocket-6": { portability: 0.62, bigScreen: 0.74, software: 0.78 },
    "retroid-pocket-6-12gb": { portability: 0.62, bigScreen: 0.74, software: 0.78 },
    "retroid-pocket-flip-2": { portability: 0.84, battery: 0.7 },
    "retroid-pocket-classic": { portability: 0.82, touch: false, software: 0.7 },
    "anbernic-rg556": { bigScreen: 0.88, battery: 0.74, portability: 0.46 },
    "anbernic-rg557": { bigScreen: 0.9, battery: 0.72, portability: 0.44 },
    "anbernic-rg406h": { retroScreen: 0.72, portability: 0.68 },
    "anbernic-rg406v": { retroScreen: 0.88, portability: 0.76 },
    "anbernic-rg-slide": { bigScreen: 0.78, portability: 0.58 },
    "anbernic-cube": { bigScreen: 0.62, portability: 0.7 },
    "anbernic-cube-xx": { bigScreen: 0.5, portability: 0.76 },
    "powkiddy-x55": { bigScreen: 0.82, portability: 0.42 },
    "powkiddy-brick": { profileLabel: "Compact vertical retro", retroScreen: 0.92, portability: 0.9, battery: 0.86 },
    "powkiddy-rgb10max3-pro": { profileLabel: "Large Android retro", bigScreen: 0.82, retroScreen: 0.66, battery: 0.74, portability: 0.46, software: 0.68 },
    "miyoo-a30": { portability: 0.92, battery: 0.9 },
    "miyoo-mini-v4": { portability: 1, battery: 0.9 },
    "miyoo-mini-plus": { portability: 0.9, battery: 0.9 },
    "miyoo-flip": { portability: 0.9, battery: 0.82 },
    "ayaneo-pocket-air": { profileLabel: "Premium OLED pocket", bigScreen: 0.74, retroScreen: 0.56, sticks: 0.84, dpad: 0.66, portability: 0.62, battery: 0.8, software: 0.78, touch: true },
    "ayaneo-pocket-dmg": { profileLabel: "Premium vertical Android", bigScreen: 0.4, retroScreen: 0.9, sticks: 0.22, dpad: 0.94, portability: 0.78, battery: 0.76, software: 0.8, touch: true },
    "ayaneo-pocket-micro": { profileLabel: "Micro metal Android", bigScreen: 0.34, retroScreen: 0.9, sticks: 0.46, dpad: 0.84, portability: 0.88, battery: 0.62, software: 0.74, touch: true },
    "ayaneo-pocket-s": { profileLabel: "Large flagship Android", bigScreen: 0.94, retroScreen: 0.44, sticks: 0.92, dpad: 0.58, portability: 0.38, battery: 0.76, software: 0.82, touch: true },
    "ayaneo-pocket-s-mini": { profileLabel: "Compact flagship Android", bigScreen: 0.72, retroScreen: 0.52, sticks: 0.88, dpad: 0.62, portability: 0.62, battery: 0.72, software: 0.82, touch: true },
    "ayaneo-pocket-vert": { profileLabel: "Flagship vertical Android", bigScreen: 0.44, retroScreen: 0.9, sticks: 0.24, dpad: 0.94, portability: 0.78, battery: 0.78, software: 0.8, touch: true },
    "retroid-pocket-4": { profileLabel: "Balanced Android", bigScreen: 0.62, retroScreen: 0.62, sticks: 0.82, dpad: 0.64, portability: 0.66, battery: 0.72, software: 0.76, touch: true },
    "retroid-pocket-4-pro": { profileLabel: "Balanced Android", bigScreen: 0.62, retroScreen: 0.62, sticks: 0.84, dpad: 0.64, portability: 0.66, battery: 0.72, software: 0.78, touch: true },
    "retroid-pocket-mini": { profileLabel: "Compact premium Android", bigScreen: 0.56, retroScreen: 0.78, sticks: 0.76, dpad: 0.72, portability: 0.72, battery: 0.68, software: 0.76, touch: true },
    "logitech-g-cloud": { profileLabel: "Large streaming handheld", bigScreen: 0.94, retroScreen: 0.28, sticks: 0.84, dpad: 0.56, portability: 0.44, battery: 0.84, software: 0.8, touch: true }
  };
  const OFFICIAL_DATA_DATE = "2026-04-27";
  const HARDWARE_PRESETS = {
    androidCurrent: {
      touchscreen: true,
      officialOta: true,
      osFamily: "Android",
      sourceCheckedOn: OFFICIAL_DATA_DATE
    },
    odin3: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 6,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      refreshRateHz: 120,
      batteryMah: 8000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 15,
      weightGrams: 390,
      cooling: "Active cooling",
      screenSpec: "6in AMOLED 1080p 120Hz"
    },
    thor: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 6,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      secondaryScreenSizeInches: 3.92,
      secondaryScreenWidthPx: 1240,
      secondaryScreenHeightPx: 1080,
      secondaryPanelType: "AMOLED",
      batteryMah: 6000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "6in + 3.92in AMOLED"
    },
    odin2Portal: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      batteryMah: 8000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "7in AMOLED 1080p"
    },
    retroidAmoled55: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5.5,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      refreshRateHz: 60,
      batteryMah: 5000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "5.5in AMOLED 1080p 60Hz"
    },
    retroidMiniV2: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.92,
      screenWidthPx: 1240,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      refreshRateHz: 60,
      batteryMah: 4000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "3.92in AMOLED 1240x1080"
    },
    retroidClassic: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.92,
      screenWidthPx: 1240,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      refreshRateHz: 60,
      batteryMah: 5000,
      activeCooling: true,
      osFamily: "Android",
      osVersion: 14,
      cooling: "Active cooling",
      screenSpec: "3.92in AMOLED 1240x1080"
    },
    retroidPocket4: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4.7,
      screenWidthPx: 1334,
      screenHeightPx: 750,
      refreshRateHz: 60,
      batteryMah: 5000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      osFamily: "Android",
      cooling: "Active cooling",
      screenSpec: "4.7in 750x1334 60Hz"
    },
    retroid6: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5.5,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      refreshRateHz: 120,
      batteryMah: 6000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "5.5in AMOLED 1080p 120Hz"
    },
    anbernicT820Square: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.95,
      screenWidthPx: 720,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 5200,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "3.95in IPS 720x720"
    },
    anbernicT820Wide: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4,
      screenWidthPx: 960,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 5000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "4in IPS 960x720"
    },
    anbernicRg556: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5.48,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      batteryMah: 5500,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "5.48in AMOLED 1080p"
    },
    anbernicRg557: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5.48,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "AMOLED",
      batteryMah: 5500,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 14,
      cooling: "Active cooling",
      screenSpec: "5.48in AMOLED 1080p"
    },
    anbernicSlide: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4.7,
      screenWidthPx: 1280,
      screenHeightPx: 960,
      panelType: "LTPS",
      refreshRateHz: 120,
      batteryMah: 5000,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      cooling: "Active cooling",
      screenSpec: "4.7in LTPS 1280x960 120Hz"
    },
    anbernicLinux35: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3300,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    streamingLarge: {
      touchscreen: true,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "IPS",
      refreshRateHz: 60,
      batteryMah: 6000,
      hallSticks: false,
      analogTriggers: true,
      activeCooling: false,
      osFamily: "Android",
      screenSpec: "7in IPS 1080p 60Hz"
    },
    linuxRetroBase: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux"
    },
    anbernicH70034: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.4,
      screenWidthPx: 720,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3500,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "3.4in IPS 720x480"
    },
    anbernicH70035: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3300,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    anbernicH70040: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3200,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "4in IPS 640x480"
    },
    anbernicH700Square: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.95,
      screenWidthPx: 720,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 3800,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "3.95in IPS 720x720"
    },
    ayaneoAce: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4.5,
      screenWidthPx: 1620,
      screenHeightPx: 1080,
      panelType: "IPS",
      batteryMah: 6000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 13,
      weightGrams: 310,
      cooling: "Active cooling",
      screenSpec: "4.5in IPS 1620x1080"
    },
    ayaneoS2: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 6.3,
      screenWidthPx: 2560,
      screenHeightPx: 1440,
      panelType: "IPS",
      batteryMah: 8000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 14,
      weightGrams: 428,
      cooling: "Active cooling",
      screenSpec: "6.3in IPS 1440p"
    },
    ayaneoS2Pro: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 6.3,
      screenWidthPx: 2560,
      screenHeightPx: 1440,
      panelType: "IPS",
      batteryMah: 10000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      osVersion: 14,
      weightGrams: 440,
      cooling: "Active cooling",
      screenSpec: "6.3in IPS 1440p"
    },
    ayaneoEvo: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "OLED",
      refreshRateHz: 165,
      batteryMah: 8600,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      weightGrams: 478,
      cooling: "Active cooling",
      screenSpec: "7in OLED 1080p 165Hz"
    },
    ayaneoDs: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "OLED",
      secondaryScreenSizeInches: 5,
      secondaryScreenWidthPx: 1024,
      secondaryScreenHeightPx: 768,
      secondaryPanelType: "LCD",
      refreshRateHz: 165,
      batteryMah: 8000,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Android",
      cooling: "Active cooling",
      screenSpec: "7in OLED 1080p + 5in 1024x768"
    },
    powkiddyRgb30: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4,
      screenWidthPx: 720,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 4100,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      weightGrams: 207,
      screenSpec: "4in IPS 720x720"
    },
    powkiddyRgb20Sx: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 4,
      screenWidthPx: 720,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 5000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "4in IPS 720x720"
    },
    powkiddyX55: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5.5,
      screenWidthPx: 1280,
      screenHeightPx: 720,
      panelType: "IPS",
      batteryMah: 4000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      weightGrams: 293,
      screenSpec: "5.5in IPS 1280x720"
    },
    powkiddyRgb10Max3Pro: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 5,
      screenWidthPx: 854,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 4000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "5in IPS 854x480"
    },
    powkiddyRgb20S: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    powkiddyRgb20Pro: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.2,
      screenWidthPx: 1024,
      screenHeightPx: 768,
      panelType: "IPS",
      batteryMah: 5000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.2in IPS 1024x768"
    },
    powkiddyRgb10X: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 2800,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    powkiddyV10: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 480,
      screenHeightPx: 320,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 480x320"
    },
    powkiddyV20: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 5000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    powkiddyV90S: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "3.5in IPS 640x480"
    },
    powkiddyX35H: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      weightGrams: 181,
      screenSpec: "3.5in IPS 640x480"
    },
    trimuiBrick: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.2,
      screenWidthPx: 1024,
      screenHeightPx: 768,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      weightGrams: 181,
      screenSpec: "3.2in IPS 1024x768"
    },
    miyooMiniV4: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 2.8,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 2000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      videoOut: true,
      osFamily: "Linux",
      screenSpec: "2.8in IPS 640x480"
    },
    miyooMiniPlus: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      weightGrams: 162,
      screenSpec: "3.5in IPS 640x480"
    },
    miyooA30: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 2.8,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 2800,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      screenSpec: "2.8in IPS 640x480"
    },
    miyooFlip: {
      touchscreen: false,
      officialOta: false,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 3.5,
      screenWidthPx: 640,
      screenHeightPx: 480,
      panelType: "IPS",
      batteryMah: 3000,
      hallSticks: false,
      analogTriggers: false,
      activeCooling: false,
      osFamily: "Linux",
      weightGrams: 181,
      screenSpec: "3.5in IPS 640x480"
    },
    steamDeckLcd: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1280,
      screenHeightPx: 800,
      panelType: "LCD",
      refreshRateHz: 60,
      batteryWh: 40,
      hallSticks: false,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "SteamOS",
      weightGrams: 669,
      cooling: "Active cooling",
      screenSpec: "7in LCD 1280x800 60Hz"
    },
    steamDeckOled: {
      touchscreen: true,
      officialOta: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7.4,
      screenWidthPx: 1280,
      screenHeightPx: 800,
      panelType: "OLED",
      refreshRateHz: 90,
      batteryWh: 50,
      hallSticks: false,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "SteamOS",
      weightGrams: 640,
      cooling: "Active cooling",
      screenSpec: "7.4in OLED 1280x800 90Hz"
    },
    rogAlly: {
      touchscreen: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "IPS",
      refreshRateHz: 120,
      batteryWh: 40,
      hallSticks: false,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Windows",
      weightGrams: 608,
      cooling: "Active cooling",
      screenSpec: "7in IPS 1080p 120Hz"
    },
    rogAllyX: {
      touchscreen: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "IPS",
      refreshRateHz: 120,
      batteryWh: 80,
      hallSticks: false,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Windows",
      weightGrams: 678,
      cooling: "Active cooling",
      screenSpec: "7in IPS 1080p 120Hz"
    },
    msiClaw7Ai: {
      touchscreen: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 7,
      screenWidthPx: 1920,
      screenHeightPx: 1080,
      panelType: "IPS",
      refreshRateHz: 120,
      batteryWh: 53,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Windows",
      cooling: "Active cooling",
      screenSpec: "7in IPS 1080p 120Hz"
    },
    msiClaw8Ai: {
      touchscreen: true,
      sourceCheckedOn: OFFICIAL_DATA_DATE,
      screenSizeInches: 8,
      screenWidthPx: 1920,
      screenHeightPx: 1200,
      panelType: "IPS",
      refreshRateHz: 120,
      batteryWh: 80,
      hallSticks: true,
      analogTriggers: true,
      activeCooling: true,
      videoOut: true,
      osFamily: "Windows",
      weightGrams: 795,
      cooling: "Active cooling",
      screenSpec: "8in IPS 1920x1200 120Hz"
    }
  };
  const DEVICE_CATALOG_OVERRIDES = {
    "odin3-base": {
      ...HARDWARE_PRESETS.odin3,
      chipset: "Dragonwing Q8"
    },
    "odin3-pro": {
      ...HARDWARE_PRESETS.odin3,
      chipset: "Dragonwing Q8"
    },
    "odin3-max": {
      ...HARDWARE_PRESETS.odin3,
      chipset: "Dragonwing Q8"
    },
    "odin3-ultra": {
      ...HARDWARE_PRESETS.odin3,
      chipset: "Dragonwing Q8"
    },
    "thor-lite": {
      ...HARDWARE_PRESETS.thor,
      chipset: "Snapdragon 865"
    },
    "thor-base": {
      ...HARDWARE_PRESETS.thor,
      chipset: "Snapdragon 8 Gen 2"
    },
    "thor-pro": {
      ...HARDWARE_PRESETS.thor,
      chipset: "Snapdragon 8 Gen 2"
    },
    "thor-max-512": {
      ...HARDWARE_PRESETS.thor,
      chipset: "Snapdragon 8 Gen 2"
    },
    "thor-max": {
      ...HARDWARE_PRESETS.thor,
      chipset: "Snapdragon 8 Gen 2"
    },
    "odin2-portal-base": {
      ...HARDWARE_PRESETS.odin2Portal,
      chipset: "Snapdragon 8 Gen 2"
    },
    "odin2-portal-pro": {
      ...HARDWARE_PRESETS.odin2Portal,
      chipset: "Snapdragon 8 Gen 2"
    },
    "odin2-portal-max": {
      ...HARDWARE_PRESETS.odin2Portal,
      chipset: "Snapdragon 8 Gen 2"
    },
    "retroid-pocket-g2": {
      ...HARDWARE_PRESETS.retroidAmoled55,
      chipset: "GoldPlus 2.8GHz / Adreno A22",
      osVersion: 15
    },
    "retroid-pocket-5": {
      ...HARDWARE_PRESETS.retroidAmoled55,
      priceUsd: 199,
      chipset: "Snapdragon 865"
    },
    "retroid-pocket-flip-2": {
      ...HARDWARE_PRESETS.retroidAmoled55,
      chipset: "Snapdragon 865",
      formFactor: "clamshell"
    },
    "retroid-pocket-6": {
      ...HARDWARE_PRESETS.retroid6,
      chipset: "Snapdragon 8 Gen 2"
    },
    "retroid-pocket-6-12gb": {
      ...HARDWARE_PRESETS.retroid6,
      chipset: "Snapdragon 8 Gen 2"
    },
    "retroid-pocket-mini-v2": {
      ...HARDWARE_PRESETS.retroidMiniV2,
      priceUsd: 179,
      chipset: "Snapdragon 865",
      specConfidence: "official"
    },
    "retroid-pocket-4": {
      ...HARDWARE_PRESETS.retroidPocket4,
      priceUsd: 139,
      chipset: "Dimensity 900",
      osVersion: 11,
      specConfidence: "official"
    },
    "retroid-pocket-4-pro": {
      ...HARDWARE_PRESETS.retroidPocket4,
      priceUsd: 149,
      chipset: "Dimensity 1100",
      osVersion: 13,
      specConfidence: "official"
    },
    "retroid-pocket-mini": {
      ...HARDWARE_PRESETS.retroidMiniV2,
      priceUsd: 179,
      chipset: "Snapdragon 865",
      specConfidence: "official"
    },
    "retroid-pocket-classic": {
      ...HARDWARE_PRESETS.retroidClassic,
      chipset: "G1 Gen2"
    },
    "anbernic-cube": {
      ...HARDWARE_PRESETS.anbernicT820Square,
      chipset: "Unisoc T820",
      weightGrams: 260
    },
    "anbernic-rg406h": {
      ...HARDWARE_PRESETS.anbernicT820Wide,
      chipset: "Unisoc T820",
      weightGrams: 265
    },
    "anbernic-rg406v": {
      ...HARDWARE_PRESETS.anbernicT820Wide,
      chipset: "Unisoc T820",
      formFactor: "vertical",
      weightGrams: 289
    },
    "anbernic-rg-slide": {
      ...HARDWARE_PRESETS.anbernicSlide,
      chipset: "Unisoc T820",
      weightGrams: 379
    },
    "anbernic-rg556": {
      ...HARDWARE_PRESETS.anbernicRg556,
      chipset: "Unisoc T820",
      weightGrams: 331
    },
    "anbernic-rg557": {
      ...HARDWARE_PRESETS.anbernicRg557,
      chipset: "Dimensity 8300",
      ram: 12,
      storage: 256,
      weightGrams: 347
    },
    "anbernic-rg35xx-h": {
      ...HARDWARE_PRESETS.anbernicLinux35,
      chipset: "H700"
    },
    "anbernic-rg35xx-plus": {
      ...HARDWARE_PRESETS.anbernicH70035,
      chipset: "H700",
      weightGrams: 186
    },
    "anbernic-rg35xx-sp": {
      ...HARDWARE_PRESETS.anbernicH70035,
      chipset: "H700",
      formFactor: "clamshell",
      weightGrams: 192
    },
    "anbernic-rg34xx": {
      ...HARDWARE_PRESETS.anbernicH70034,
      chipset: "H700",
      weightGrams: 188
    },
    "anbernic-rg34xxsp": {
      ...HARDWARE_PRESETS.anbernicH70034,
      chipset: "H700",
      formFactor: "clamshell",
      weightGrams: 178
    },
    "anbernic-rg40xx-h": {
      ...HARDWARE_PRESETS.anbernicH70040,
      chipset: "H700",
      weightGrams: 208
    },
    "anbernic-rg40xx-v": {
      ...HARDWARE_PRESETS.anbernicH70040,
      chipset: "H700",
      formFactor: "vertical",
      weightGrams: 216
    },
    "anbernic-cube-xx": {
      ...HARDWARE_PRESETS.anbernicH700Square,
      chipset: "H700",
      weightGrams: 246
    },
    "ayaneo-pocket-ace": {
      ...HARDWARE_PRESETS.ayaneoAce,
      chipset: "Snapdragon G3x Gen 2"
    },
    "ayaneo-pocket-s2": {
      ...HARDWARE_PRESETS.ayaneoS2,
      chipset: "Snapdragon G3 Gen 3"
    },
    "ayaneo-pocket-evo": {
      ...HARDWARE_PRESETS.ayaneoEvo,
      chipset: "Snapdragon G3x Gen 2"
    },
    "ayaneo-pocket-ds": {
      ...HARDWARE_PRESETS.ayaneoDs,
      chipset: "Snapdragon G3x Gen 2"
    },
    "ayaneo-pocket-air": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 6,
      storage: 128,
      performanceTier: "high",
      computeRank: 3,
      useCaseLane: "balanced-android",
      positioning: "premium",
      priceUsd: 299,
      priceIndex: 4,
      available: true,
      recommendable: true,
      chipset: "Dimensity 1200",
      screenSpec: "5.5in OLED",
      batteryMah: 7350,
      cooling: "Active cooling",
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-air-mini": {
      ...HARDWARE_PRESETS.androidCurrent,
      performanceTier: "mid",
      computeRank: 2,
      priceUsd: 99.99,
      priceIndex: 1,
      available: true,
      recommendable: false,
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-dmg": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 8,
      storage: 128,
      performanceTier: "enthusiast",
      computeRank: 4,
      useCaseLane: "high-end-android",
      formFactor: "vertical",
      positioning: "premium",
      priceUsd: 449,
      priceIndex: 5,
      available: true,
      recommendable: true,
      chipset: "Snapdragon G3x Gen 2",
      screenSpec: "3.92in OLED",
      batteryMah: 6000,
      cooling: "Active cooling",
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-micro": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 6,
      storage: 128,
      performanceTier: "mid",
      computeRank: 2,
      useCaseLane: "retro-focused",
      positioning: "balanced",
      priceUsd: 219,
      priceIndex: 3,
      available: true,
      recommendable: true,
      chipset: "Helio G99",
      screenSpec: "3.5in 960x640",
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-s": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 12,
      storage: 128,
      performanceTier: "enthusiast",
      computeRank: 4,
      useCaseLane: "high-end-android",
      positioning: "premium",
      priceUsd: 559,
      priceIndex: 6,
      available: true,
      recommendable: true,
      chipset: "Snapdragon G3x Gen 2",
      screenSpec: "6in 1080p",
      cooling: "Active cooling",
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-s-mini": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 8,
      storage: 128,
      performanceTier: "enthusiast",
      computeRank: 4,
      useCaseLane: "high-end-android",
      positioning: "premium",
      priceUsd: 319,
      priceIndex: 4,
      available: true,
      recommendable: true,
      chipset: "Snapdragon G3x Gen 2",
      screenSpec: "5.5in OLED",
      cooling: "Active cooling",
      osFamily: "Android",
      specConfidence: "official"
    },
    "ayaneo-pocket-s2-pro": {
      ...HARDWARE_PRESETS.ayaneoS2Pro,
      ram: 16,
      storage: 512,
      performanceTier: "enthusiast",
      computeRank: 4,
      useCaseLane: "high-end-android",
      positioning: "premium",
      priceUsd: 559,
      priceIndex: 6,
      available: false,
      recommendable: false,
      chipset: "Snapdragon G3 Gen 3",
      specConfidence: "official"
    },
    "ayaneo-pocket-vert": {
      ...HARDWARE_PRESETS.androidCurrent,
      ram: 8,
      storage: 128,
      performanceTier: "enthusiast",
      computeRank: 4,
      useCaseLane: "high-end-android",
      formFactor: "vertical",
      positioning: "premium",
      priceUsd: 269,
      priceIndex: 4,
      available: true,
      recommendable: true,
      chipset: "Snapdragon 8+ Gen 1",
      batteryMah: 6000,
      osFamily: "Android",
      specConfidence: "official"
    },
    "powkiddy-rgb10max3-pro": {
      ...HARDWARE_PRESETS.powkiddyRgb10Max3Pro,
      performanceTier: "mid",
      computeRank: 2,
      useCaseLane: "balanced-android",
      positioning: "balanced",
      priceUsd: 114.99,
      priceIndex: 2,
      available: true,
      recommendable: true,
      chipset: "Amlogic A311D",
      specConfidence: "official"
    },
    "powkiddy-rgb10x": {
      ...HARDWARE_PRESETS.powkiddyRgb10X,
      specConfidence: "official"
    },
    "powkiddy-v10": {
      ...HARDWARE_PRESETS.powkiddyV10,
      chipset: "Quad-core Cortex-A35 1.5GHz",
      specConfidence: "official"
    },
    "powkiddy-v90s": {
      ...HARDWARE_PRESETS.powkiddyV90S,
      chipset: "Allwinner 133 Plus",
      specConfidence: "official"
    },
    "powkiddy-v20": {
      ...HARDWARE_PRESETS.powkiddyV20,
      chipset: "Allwinner A133P",
      specConfidence: "official"
    },
    "powkiddy-rgb20s": {
      ...HARDWARE_PRESETS.powkiddyRgb20S,
      chipset: "RK3326",
      specConfidence: "official"
    },
    "powkiddy-x35h": {
      ...HARDWARE_PRESETS.powkiddyX35H,
      chipset: "RK3566",
      specConfidence: "official"
    },
    "powkiddy-rgb20-pro": {
      ...HARDWARE_PRESETS.powkiddyRgb20Pro,
      chipset: "ARM quad-core 1.8GHz",
      specConfidence: "official"
    },
    "powkiddy-rgb20sx": {
      ...HARDWARE_PRESETS.powkiddyRgb20Sx,
      chipset: "ARM quad-core 1.8GHz",
      formFactor: "vertical",
      specConfidence: "official"
    },
    "powkiddy-rgb30": {
      ...HARDWARE_PRESETS.powkiddyRgb30,
      chipset: "RK3566",
      specConfidence: "official"
    },
    "powkiddy-x55": {
      ...HARDWARE_PRESETS.powkiddyX55,
      chipset: "RK3566",
      specConfidence: "official"
    },
    "powkiddy-brick": {
      ...HARDWARE_PRESETS.trimuiBrick,
      ram: 2,
      storage: 64,
      performanceTier: "light",
      computeRank: 1,
      useCaseLane: "retro-focused",
      formFactor: "vertical",
      positioning: "balanced",
      priceUsd: 64.99,
      priceIndex: 1,
      available: true,
      recommendable: true,
      chipset: "Allwinner A133P",
      specConfidence: "official"
    },
    "miyoo-a30": {
      ...HARDWARE_PRESETS.miyooA30,
      specConfidence: "official"
    },
    "miyoo-mini-v4": {
      ...HARDWARE_PRESETS.miyooMiniV4,
      specConfidence: "official"
    },
    "miyoo-mini-plus": {
      ...HARDWARE_PRESETS.miyooMiniPlus,
      chipset: "Dual-core Cortex-A7 1.2GHz",
      specConfidence: "official"
    },
    "miyoo-flip": {
      ...HARDWARE_PRESETS.miyooFlip,
      chipset: "RK3566",
      specConfidence: "official"
    },
    "steamdeck-lcd-256": {
      ...HARDWARE_PRESETS.steamDeckLcd,
      priceUsd: 549,
      chipset: "AMD custom APU (7 nm)",
      specConfidence: "official"
    },
    "steamdeck-oled-512": {
      ...HARDWARE_PRESETS.steamDeckOled,
      priceUsd: 649,
      chipset: "AMD custom APU (6 nm)",
      specConfidence: "official"
    },
    "steamdeck-oled-1tb": {
      ...HARDWARE_PRESETS.steamDeckOled,
      chipset: "AMD custom APU (6 nm)",
      specConfidence: "official"
    },
    "rog-ally-z1": {
      ...HARDWARE_PRESETS.rogAlly,
      priceUsd: 499.99,
      chipset: "AMD Ryzen Z1",
      specConfidence: "official"
    },
    "rog-ally-z1-extreme": {
      ...HARDWARE_PRESETS.rogAlly,
      priceUsd: 699,
      chipset: "AMD Ryzen Z1 Extreme",
      specConfidence: "official"
    },
    "rog-ally-x": {
      ...HARDWARE_PRESETS.rogAllyX,
      priceUsd: 799.99,
      chipset: "AMD Ryzen Z1 Extreme",
      specConfidence: "official"
    },
    "msi-claw-7-ai-plus": {
      ...HARDWARE_PRESETS.msiClaw7Ai,
      chipset: "Intel Core Ultra 7 258V",
      specConfidence: "official"
    },
    "msi-claw-8-ai-plus": {
      ...HARDWARE_PRESETS.msiClaw8Ai,
      priceUsd: 1199.99,
      chipset: "Intel Core Ultra 7 258V",
      specConfidence: "official"
    },
    "logitech-g-cloud": {
      ...HARDWARE_PRESETS.streamingLarge,
      priceUsd: 299.99,
      priceIndex: 4,
      available: true,
      recommendable: false,
      chipset: "Snapdragon 720G",
      specConfidence: "official"
    }
  };
  const DEVICE_YEAR_OVERRIDES = {
    "odin3-base": 2026,
    "odin3-pro": 2026,
    "odin3-max": 2026,
    "odin3-ultra": 2026,
    "thor-lite": 2026,
    "thor-base": 2026,
    "thor-pro": 2026,
    "thor-max-512": 2026,
    "thor-max": 2026,
    "odin2-portal-base": 2025,
    "odin2-portal-pro": 2025,
    "odin2-portal-max": 2025,
    "odin-lite": 2022,
    "odin-base": 2022,
    "odin-pro": 2022,
    "odin2-base": 2023,
    "odin2-pro": 2023,
    "odin2-max": 2023,
    "loki": 2023,
    "retroid-pocket-g2": 2026,
    "retroid-pocket-5": 2024,
    "retroid-pocket-flip-2": 2025,
    "retroid-pocket-6": 2026,
    "retroid-pocket-6-12gb": 2026,
    "retroid-pocket-mini-v2": 2024,
    "retroid-pocket-classic": 2025,
    "retroid-pocket-2": 2020,
    "retroid-pocket-2-plus": 2021,
    "retroid-pocket-3": 2022,
    "retroid-pocket-3-plus": 2022,
    "retroid-pocket-flip": 2023,
    "retroid-pocket-4": 2024,
    "retroid-pocket-4-pro": 2024,
    "retroid-pocket-mini": 2024,
    "anbernic-rg280v": 2020,
    "anbernic-rg300x": 2021,
    "anbernic-rg351p": 2020,
    "anbernic-rg351m": 2020,
    "anbernic-rg351mp": 2021,
    "anbernic-rg353m": 2022,
    "anbernic-rg353p": 2022,
    "anbernic-rg353ps": 2023,
    "anbernic-rg353v": 2022,
    "anbernic-rg353vs": 2022,
    "anbernic-rg405m": 2023,
    "anbernic-rg405v": 2023,
    "anbernic-rg505": 2022,
    "anbernic-rg552": 2021,
    "anbernic-rg-arc-d": 2023,
    "anbernic-rg-arc-s": 2023,
    "anbernic-rg35xx": 2022,
    "anbernic-rg35xx-plus": 2023,
    "anbernic-rg35xx-h": 2024,
    "anbernic-rg35xx-sp": 2024,
    "anbernic-rg34xx": 2024,
    "anbernic-rg34xxsp": 2025,
    "anbernic-rg40xx-h": 2024,
    "anbernic-rg40xx-v": 2024,
    "anbernic-cube": 2024,
    "anbernic-cube-xx": 2024,
    "anbernic-rg406h": 2024,
    "anbernic-rg406v": 2024,
    "anbernic-rg556": 2024,
    "anbernic-rg557": 2025,
    "anbernic-rg-slide": 2025,
    "anbernic-win600": 2022,
    "powkiddy-a12": 2020,
    "powkiddy-rgb10": 2020,
    "powkiddy-rgb10-max": 2021,
    "powkiddy-rgb10-max-2": 2021,
    "powkiddy-rgb10max3-pro": 2024,
    "powkiddy-rgb10x": 2024,
    "powkiddy-rgb20s": 2022,
    "powkiddy-rgb20-pro": 2024,
    "powkiddy-rgb20sx": 2024,
    "powkiddy-rgb30": 2023,
    "powkiddy-rgb55": 2024,
    "powkiddy-x18s": 2021,
    "powkiddy-x28": 2023,
    "powkiddy-x35s": 2024,
    "powkiddy-x35h": 2024,
    "powkiddy-x55": 2023,
    "powkiddy-v10": 2024,
    "powkiddy-v20": 2025,
    "powkiddy-v90s": 2025,
    "powkiddy-brick": 2024,
    "miyoo-mini": 2022,
    "miyoo-mini-v4": 2024,
    "miyoo-mini-plus": 2023,
    "miyoo-mini-plus-v3": 2024,
    "miyoo-a30": 2024,
    "miyoo-flip": 2025,
    "ayaneo-pocket-air": 2023,
    "ayaneo-pocket-air-mini": 2024,
    "ayaneo-pocket-ace": 2025,
    "ayaneo-pocket-dmg": 2025,
    "ayaneo-pocket-micro": 2024,
    "ayaneo-pocket-s": 2024,
    "ayaneo-pocket-s-mini": 2025,
    "ayaneo-pocket-s2": 2026,
    "ayaneo-pocket-s2-pro": 2026,
    "ayaneo-pocket-evo": 2025,
    "ayaneo-pocket-ds": 2026,
    "ayaneo-pocket-vert": 2025,
    "rog-ally-z1": 2023,
    "rog-ally-z1-extreme": 2023,
    "rog-ally-x": 2024,
    "msi-claw-7-ai-plus": 2024,
    "msi-claw-8-ai-plus": 2024,
    "steamdeck-lcd-256": 2022,
    "steamdeck-oled-512": 2023,
    "steamdeck-oled-1tb": 2023,
    "logitech-g-cloud": 2022,
    "razer-edge": 2023
  };
  const DEVICES = buildDeviceCatalog(window.DevicesData || []);

  const systemMap = new Map(SYSTEMS.map((system) => [system.id, system]));
  const deviceMap = new Map(DEVICES.map((device) => [device.id, device]));
  const livePoolDeviceIds = new Set(DEVICES.map((device) => device.id));
  const brandMap = new Map((RULES.brands || []).map((brand) => [brand.id, brand]));
  const useCaseLaneProfiles = RULES.useCaseLaneProfiles || {};
  const recommendableDevices = DEVICES.filter((device) => device.available && device.recommendable);
  const recommendableDeviceIds = new Set(recommendableDevices.map((device) => device.id));
  const elements = {};
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function buildDeviceCatalog(baseDevices) {
    const catalog = baseDevices.map((device) => applyDeviceCatalogOverride(device, false));
    const baseIds = new Set(catalog.map((device) => device.id));

    Object.entries(ownedDevicesByBrand).forEach(([brandId, devices]) => {
      (devices || []).forEach((ownedDevice) => {
        if (baseIds.has(ownedDevice.id)) {
          return;
        }

        const comparisonProfile = getCatalogCompareProfile(brandId, ownedDevice.id);
        if (!comparisonProfile) {
          return;
        }

        catalog.push(buildCollectedCatalogDevice(brandId, ownedDevice, comparisonProfile));
      });
    });

    return catalog;
  }

  function getCatalogCompareProfile(brandId, deviceId) {
    const brandProfiles = ownedDeviceCompareProfiles[brandId];
    if (!brandProfiles) {
      return null;
    }

    const matchedProfile = (brandProfiles.profiles || []).find((profile) => (profile.ids || []).includes(deviceId));
    return matchedProfile || brandProfiles.fallback || null;
  }

  function inferCatalogCompareClass(brandId, name) {
    const lowerName = (name || "").toLowerCase();

    if (brandId === "gpd" || brandId === "onexplayer" || brandId === "asus" || brandId === "msi" || brandId === "valve") {
      return "windows-handheld";
    }

    if (brandId === "razer" || brandId === "logitech-g") {
      return "cloud-streaming";
    }

    if (brandId === "gameforce" || brandId === "kinhank" || brandId === "miyoo" || brandId === "powkiddy" || brandId === "zpg") {
      return "linux-retro";
    }

    if (brandId === "ayaneo" && !lowerName.includes("pocket")) {
      return "windows-handheld";
    }

    return "android-retro";
  }

  function getCatalogTierId(rank) {
    const normalizedRank = Number.isFinite(rank) ? Math.max(1, Math.min(4, Math.round(rank))) : 1;
    const tierMap = {
      1: "light",
      2: "mid",
      3: "high",
      4: "enthusiast"
    };
    return tierMap[normalizedRank] || "light";
  }

  function getCatalogUseCaseLane(device) {
    if (device.formFactor === "clamshell") {
      return "clamshell";
    }

    if (device.useCaseLane) {
      return device.useCaseLane;
    }

    const compareClass = device.compareClass || inferCatalogCompareClass(device.brand, device.name);

    if (compareClass === "linux-retro") {
      return "retro-focused";
    }

    if ((device.computeRank || 1) >= 4) {
      return "high-end-android";
    }

    if ((device.computeRank || 1) >= 3 || compareClass === "cloud-streaming") {
      return "balanced-android";
    }

    return "retro-focused";
  }

  function getCatalogPositioning(device) {
    if (device.dualScreen) {
      return "dual-screen";
    }

    if ((device.computeRank || 1) >= 4) {
      return "premium";
    }

    return "balanced";
  }

  function getCatalogPriceIndex(priceUsd, computeRank) {
    if (Number.isFinite(priceUsd) && priceUsd > 0) {
      if (priceUsd >= 550) {
        return 6;
      }

      if (priceUsd >= 400) {
        return 5;
      }

      if (priceUsd >= 300) {
        return 4;
      }

      if (priceUsd >= 180) {
        return 3;
      }

      if (priceUsd >= 90) {
        return 2;
      }

      return 1;
    }

    return Math.max(1, Math.min(6, (computeRank || 1) + 1));
  }

  function applyDeviceCatalogOverride(device, generated) {
    const override = DEVICE_CATALOG_OVERRIDES[device.id] || {};
    const merged = {
      ...device,
      ...override
    };

    if (!Number.isFinite(merged.priceUsd) || merged.priceUsd <= 0) {
      merged.priceUsd = null;
    }

    merged.available = override.available !== undefined ? Boolean(override.available) : Boolean(device.available);
    merged.recommendable = merged.available && (override.recommendable !== undefined ? Boolean(override.recommendable) : Boolean(device.recommendable));
    merged.compareClass = override.compareClass || device.compareClass || inferCatalogCompareClass(merged.brand, merged.name);
    merged.performanceTier = merged.performanceTier || getCatalogTierId(merged.computeRank);
    merged.useCaseLane = getCatalogUseCaseLane(merged);
    merged.positioning = merged.positioning || getCatalogPositioning(merged);
    merged.priceIndex = Number.isFinite(merged.priceIndex) ? merged.priceIndex : getCatalogPriceIndex(merged.priceUsd, merged.computeRank);
    merged.catalogGenerated = generated;
    merged.specConfidence = merged.specConfidence || (generated ? "profile" : "official");
    merged.catalogSource = generated
      ? (merged.specConfidence === "official" ? "official" : (merged.catalogSource || "collected"))
      : (merged.catalogSource || "live");

    return merged;
  }

  function buildCollectedCatalogDevice(brandId, ownedDevice, comparisonProfile) {
    const compareClass = comparisonProfile.compareClass || inferCatalogCompareClass(brandId, ownedDevice.name);
    const computeRank = Number.isFinite(comparisonProfile.computeRank) ? comparisonProfile.computeRank : 1;
    const seededDevice = {
      id: ownedDevice.id,
      brand: brandId,
      name: ownedDevice.name,
      family: ownedDevice.name,
      ram: Number.isFinite(comparisonProfile.ram) ? comparisonProfile.ram : 4,
      storage: Number.isFinite(comparisonProfile.storage) ? comparisonProfile.storage : 128,
      performanceTier: getCatalogTierId(computeRank),
      computeRank,
      formFactor: comparisonProfile.formFactor || "horizontal",
      dualScreen: Boolean(comparisonProfile.dualScreen),
      compareClass,
      priceUsd: null,
      available: false,
      recommendable: false,
      catalogGenerated: true,
      specConfidence: "profile",
      catalogSource: "collected"
    };

    seededDevice.useCaseLane = getCatalogUseCaseLane(seededDevice);
    seededDevice.positioning = getCatalogPositioning(seededDevice);
    seededDevice.priceIndex = getCatalogPriceIndex(seededDevice.priceUsd, seededDevice.computeRank);

    return applyDeviceCatalogOverride(seededDevice, true);
  }

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
    populateModeSelect();
    populateThemeSelect();
    populateFormatSelect();
    populateUseCaseLaneSelect();
    populateBrandPreferenceSelect();
    populateCurrentBrandSelect();
    populateCurrentDeviceSelect();
    populateCompareBrandSelects();
    populateCompareDeviceSelects();
    bindStaticEvents();
    applyStateToControls();
    renderSystemSelector();
    renderSystemCards();
    updateDerivedUi(false);
    scrollToRequestedReferenceSection();
  }

  function cacheElements() {
    elements.layoutTop = document.querySelector(".layout-top");
    elements.sidebar = document.querySelector(".sidebar");
    elements.modeGatePanel = document.getElementById("modeGatePanel");
    elements.modeSelect = document.getElementById("modeSelect");
    elements.themeSelect = document.getElementById("themeSelect");
    elements.formatSelect = document.getElementById("formatSelect");
    elements.shareButton = document.getElementById("shareButton");
    elements.exportButton = document.getElementById("exportButton");
    elements.quizForm = document.getElementById("quizForm");
    elements.compareModePanel = document.getElementById("compareModePanel");
    elements.compareButton = document.getElementById("compareButton");
    elements.ownsDeviceToggle = document.getElementById("ownsDeviceToggle");
    elements.currentDeviceField = document.getElementById("currentDeviceField");
    elements.currentBrandSelect = document.getElementById("currentBrandSelect");
    elements.currentBrandDeviceField = document.getElementById("currentBrandDeviceField");
    elements.currentDeviceSelect = document.getElementById("currentDeviceSelect");
    elements.currentOwnershipNotice = document.getElementById("currentOwnershipNotice");
    elements.compareLeftBrandSelect = document.getElementById("compareLeftBrandSelect");
    elements.compareLeftDeviceSelect = document.getElementById("compareLeftDeviceSelect");
    elements.compareLeftNotice = document.getElementById("compareLeftNotice");
    elements.compareRightBrandSelect = document.getElementById("compareRightBrandSelect");
    elements.compareRightDeviceSelect = document.getElementById("compareRightDeviceSelect");
    elements.compareRightNotice = document.getElementById("compareRightNotice");
    elements.useCaseLaneSelect = document.getElementById("useCaseLaneSelect");
    elements.formFactorSimpleSelect = document.getElementById("formFactorSimpleSelect");
    elements.brandPreferenceSelect = document.getElementById("brandPreferenceSelect");
    elements.sessionStyleSelect = document.getElementById("sessionStyleSelect");
    elements.portabilityPrioritySelect = document.getElementById("portabilityPrioritySelect");
    elements.screenPrioritySelect = document.getElementById("screenPrioritySelect");
    elements.controlPrioritySelect = document.getElementById("controlPrioritySelect");
    elements.softwarePreferenceSelect = document.getElementById("softwarePreferenceSelect");
    elements.touchPreferenceSelect = document.getElementById("touchPreferenceSelect");
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
    elements.changelogSection = document.getElementById("changelogSection");
    elements.roadmapSection = document.getElementById("roadmapSection");
    elements.resultsKicker = document.getElementById("resultsKicker");
    elements.resultsTitle = document.getElementById("resultsTitle");
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

    merged.mode = typeof urlState.mode === "string" ? urlState.mode : defaults.mode;

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
    const validModeIds = new Set((RULES.workflowModes || []).map((mode) => mode.id));
    const validLaneIds = new Set((RULES.useCaseLanes || []).map((lane) => lane.id));
    const validBrandIds = new Set((RULES.brands || []).map((brand) => brand.id));
    const validSessionStyles = new Set(["mixed", "short", "long"]);
    const validPortabilityPriorities = new Set(["balanced", "carry", "pocket", "desk"]);
    const validScreenPriorities = new Set(["balanced", "big", "retro", "dual"]);
    const validControlPriorities = new Set(["balanced", "sticks", "dpad"]);
    const validSoftwarePreferences = new Set(["balanced", "stable", "tinker"]);
    const validTouchPreferences = new Set(["no-preference", "required", "avoid"]);
    const validSelected = Array.isArray(rawState.selectedSystems)
      ? rawState.selectedSystems.filter((id, index, array) => systemMap.has(id) && array.indexOf(id) === index)
      : [];

    normalized.theme = validThemeIds.has(rawState.theme) ? rawState.theme : normalized.theme;
    const normalizedFormat = rawState.format === "properties" ? "simple" : rawState.format;
    normalized.format = validFormatIds.has(normalizedFormat) ? normalizedFormat : normalized.format;
    normalized.mode = validModeIds.has(rawState.mode) ? rawState.mode : normalized.mode;
    normalized.useCaseLane = validLaneIds.has(rawState.useCaseLane) ? rawState.useCaseLane : normalized.useCaseLane;
    const validPreferenceBrandIds = new Set(["any", ...getPreferredBrandOptions(normalized.useCaseLane, normalized.formFactor).map((brand) => brand.id)]);
    normalized.ownsDevice = rawState.ownsDevice === "yes" ? "yes" : "no";
    normalized.currentBrand = validBrandIds.has(rawState.currentBrand) ? rawState.currentBrand : normalized.currentBrand;
    normalized.currentDeviceId = getOwnedDeviceOptions(normalized.currentBrand).some((device) => device.id === rawState.currentDeviceId)
      ? rawState.currentDeviceId
      : "";
    normalized.compareLeftBrand = validBrandIds.has(rawState.compareLeftBrand) ? rawState.compareLeftBrand : normalized.compareLeftBrand;
    normalized.compareLeftDeviceId = getOwnedDeviceOptions(normalized.compareLeftBrand).some((device) => device.id === rawState.compareLeftDeviceId)
      ? rawState.compareLeftDeviceId
      : "";
    normalized.compareRightBrand = validBrandIds.has(rawState.compareRightBrand) ? rawState.compareRightBrand : normalized.compareRightBrand;
    normalized.compareRightDeviceId = getOwnedDeviceOptions(normalized.compareRightBrand).some((device) => device.id === rawState.compareRightDeviceId)
      ? rawState.compareRightDeviceId
      : "";
    normalized.brandPreference = validPreferenceBrandIds.has(rawState.brandPreference) ? rawState.brandPreference : normalized.brandPreference;
    normalized.formFactor = ["horizontal", "vertical", "clamshell", "no-preference"].includes(rawState.formFactor)
      ? rawState.formFactor
      : normalized.formFactor;
    normalized.sessionStyle = validSessionStyles.has(rawState.sessionStyle) ? rawState.sessionStyle : normalized.sessionStyle;
    normalized.portabilityPriority = validPortabilityPriorities.has(rawState.portabilityPriority) ? rawState.portabilityPriority : normalized.portabilityPriority;
    normalized.screenPriority = validScreenPriorities.has(rawState.screenPriority) ? rawState.screenPriority : normalized.screenPriority;
    normalized.controlPriority = validControlPriorities.has(rawState.controlPriority) ? rawState.controlPriority : normalized.controlPriority;
    normalized.softwarePreference = validSoftwarePreferences.has(rawState.softwarePreference) ? rawState.softwarePreference : normalized.softwarePreference;
    normalized.touchPreference = validTouchPreferences.has(rawState.touchPreference) ? rawState.touchPreference : normalized.touchPreference;
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
    window.addEventListener("hashchange", () => {
      applyMode();
      scrollToRequestedReferenceSection("smooth");
    });

    elements.modeSelect.addEventListener("change", (event) => {
      state.mode = event.target.value;
      applyMode();
      updateDerivedUi(false);
    });

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

    elements.sessionStyleSelect.addEventListener("change", (event) => {
      state.sessionStyle = event.target.value;
      updateDerivedUi(false);
    });

    elements.portabilityPrioritySelect.addEventListener("change", (event) => {
      state.portabilityPriority = event.target.value;
      updateDerivedUi(false);
    });

    elements.screenPrioritySelect.addEventListener("change", (event) => {
      state.screenPriority = event.target.value;
      updateDerivedUi(false);
    });

    elements.controlPrioritySelect.addEventListener("change", (event) => {
      state.controlPriority = event.target.value;
      updateDerivedUi(false);
    });

    elements.softwarePreferenceSelect.addEventListener("change", (event) => {
      state.softwarePreference = event.target.value;
      updateDerivedUi(false);
    });

    elements.touchPreferenceSelect.addEventListener("change", (event) => {
      state.touchPreference = event.target.value;
      updateDerivedUi(false);
    });

    elements.sdCardToggle.addEventListener("change", (event) => {
      state.useSdCard = event.target.checked ? "yes" : "no";
      toggleSdCardField();
      updateDerivedUi(false);
    });

    elements.currentDeviceSelect.addEventListener("change", (event) => {
      state.currentDeviceId = event.target.value;
      updateCurrentOwnershipNotice();
      updateDerivedUi(false);
    });

    elements.compareLeftBrandSelect.addEventListener("change", (event) => {
      const previousBrand = state.compareLeftBrand;
      state.compareLeftBrand = event.target.value;
      if (state.compareLeftBrand !== previousBrand) {
        state.compareLeftDeviceId = "";
      }
      populateCompareDeviceSelect("left");
      updateCompareSelectionNotice("left");
      updateDerivedUi(false);
    });

    elements.compareLeftDeviceSelect.addEventListener("change", (event) => {
      state.compareLeftDeviceId = event.target.value;
      updateCompareSelectionNotice("left");
      updateDerivedUi(false);
    });

    elements.compareRightBrandSelect.addEventListener("change", (event) => {
      const previousBrand = state.compareRightBrand;
      state.compareRightBrand = event.target.value;
      if (state.compareRightBrand !== previousBrand) {
        state.compareRightDeviceId = "";
      }
      populateCompareDeviceSelect("right");
      updateCompareSelectionNotice("right");
      updateDerivedUi(false);
    });

    elements.compareRightDeviceSelect.addEventListener("change", (event) => {
      state.compareRightDeviceId = event.target.value;
      updateCompareSelectionNotice("right");
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
    elements.compareButton.addEventListener("click", () => updateDerivedUi(true));

    elements.quizForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateDerivedUi(true);
    });
  }

  function populateModeSelect() {
    elements.modeSelect.innerHTML = [
      `<option value="">Pick a mode</option>`,
      ...(RULES.workflowModes || []).map((mode) => `<option value="${mode.id}">${escapeHtml(mode.name)}</option>`)
    ].join("");
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

  function populateBrandSelect(selectElement, placeholder) {
    selectElement.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...(RULES.brands || []).map((brand) => `<option value="${brand.id}">${escapeHtml(brand.name)}</option>`)
    ].join("");
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
    populateBrandSelect(elements.currentBrandSelect, "Select your brand");
  }

  function populateCurrentDeviceSelect() {
    populateOwnedDeviceSelect(elements.currentDeviceSelect, state ? state.currentBrand : "");
  }

  function populateCompareBrandSelects() {
    populateBrandSelect(elements.compareLeftBrandSelect, "Select a brand");
    populateBrandSelect(elements.compareRightBrandSelect, "Select a brand");
  }

  function populateCompareDeviceSelects() {
    populateCompareDeviceSelect("left");
    populateCompareDeviceSelect("right");
  }

  function populateCompareDeviceSelect(side) {
    const isLeft = side === "left";
    const selectElement = isLeft ? elements.compareLeftDeviceSelect : elements.compareRightDeviceSelect;
    const brandId = isLeft ? state.compareLeftBrand : state.compareRightBrand;
    populateOwnedDeviceSelect(selectElement, brandId);
  }

  function populateOwnedDeviceSelect(selectElement, brandId) {
    const devices = getOwnedDeviceOptions(brandId);
    const placeholder = brandId ? `Select ${escapeHtml(getBrandName(brandId))} device` : "Select your brand first";
    selectElement.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...devices.map((device) => `<option value="${device.id}">${escapeHtml(formatDeviceDisplayName(device))}</option>`)
    ].join("");
  }

  function applyStateToControls() {
    applyMode();
    applyTheme();
    applyFormat();

    const sdCardRadio = document.querySelector(`input[name="useSdCard"][value="${state.useSdCard}"]`);

    if (elements.ownsDeviceToggle) {
      elements.ownsDeviceToggle.checked = state.ownsDevice === "yes";
    }

    elements.currentBrandSelect.value = state.currentBrand;
    populateCurrentDeviceSelect();
    elements.compareLeftBrandSelect.value = state.compareLeftBrand;
    elements.compareRightBrandSelect.value = state.compareRightBrand;
    populateCompareDeviceSelects();

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
    if (elements.sessionStyleSelect) {
      elements.sessionStyleSelect.value = state.sessionStyle;
    }
    if (elements.portabilityPrioritySelect) {
      elements.portabilityPrioritySelect.value = state.portabilityPriority;
    }
    if (elements.screenPrioritySelect) {
      elements.screenPrioritySelect.value = state.screenPriority;
    }
    if (elements.controlPrioritySelect) {
      elements.controlPrioritySelect.value = state.controlPriority;
    }
    if (elements.softwarePreferenceSelect) {
      elements.softwarePreferenceSelect.value = state.softwarePreference;
    }
    if (elements.touchPreferenceSelect) {
      elements.touchPreferenceSelect.value = state.touchPreference;
    }

    if (sdCardRadio) {
      sdCardRadio.checked = true;
    }

    if (elements.sdCardToggle) {
      elements.sdCardToggle.checked = state.useSdCard === "yes";
    }

    elements.currentDeviceSelect.value = state.currentDeviceId;
    elements.compareLeftDeviceSelect.value = state.compareLeftDeviceId;
    elements.compareRightDeviceSelect.value = state.compareRightDeviceId;
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
    updateCurrentOwnershipNotice();
    updateCompareSelectionNotice("left");
    updateCompareSelectionNotice("right");
    toggleSdCardField();
    toggleAdvancedPanel();
  }

  function applyMode() {
    document.body.setAttribute("data-mode", state.mode || "unselected");
    elements.modeSelect.value = state.mode;
    toggleModePanels();
    syncSectionFolds();
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

  function getRequestedReferenceSectionId() {
    const hash = window.location.hash || "";

    if (hash === "#changelogSection" || hash === "#roadmapSection") {
      return hash.slice(1);
    }

    return "";
  }

  function scrollToRequestedReferenceSection(behavior = "auto") {
    const sectionId = getRequestedReferenceSectionId();
    if (!sectionId) {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target || target.hidden) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior, block: "start" });
    });
  }

  function toggleModePanels() {
    const hasModeSelection = Boolean(state.mode);
    const compareMode = state.mode === "compated";
    const requestedReferenceSectionId = getRequestedReferenceSectionId();
    const showStandaloneReference = !hasModeSelection && Boolean(requestedReferenceSectionId);
    elements.modeGatePanel.hidden = hasModeSelection || showStandaloneReference;
    elements.layoutTop.hidden = !hasModeSelection;
    elements.resultsSection.hidden = !hasModeSelection;
    elements.changelogSection.hidden = !hasModeSelection && requestedReferenceSectionId !== "changelogSection";
    if (elements.roadmapSection) {
      elements.roadmapSection.hidden = !hasModeSelection && requestedReferenceSectionId !== "roadmapSection";
    }
    elements.quizForm.hidden = !hasModeSelection || compareMode;
    elements.compareModePanel.hidden = !hasModeSelection || !compareMode;

    if (elements.sidebar) {
      elements.sidebar.hidden = !hasModeSelection || compareMode;
    }

    if (elements.layoutTop) {
      elements.layoutTop.classList.toggle("layout-top-single", hasModeSelection && compareMode);
    }

    if (elements.resultsKicker) {
      elements.resultsKicker.textContent = compareMode ? "Compare" : "Results";
    }

    if (elements.resultsTitle) {
      elements.resultsTitle.textContent = compareMode ? "Device Compare" : "Scorecard";
    }
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
      elements.currentOwnershipNotice.textContent = "";
      return;
    }

    if (!state.currentBrand) {
      elements.currentBrandDeviceField.hidden = true;
      elements.currentOwnershipNotice.hidden = true;
      elements.currentOwnershipNotice.textContent = "";
      return;
    }

    const brandName = getBrandName(state.currentBrand);
    const deviceLabel = elements.currentBrandDeviceField.querySelector("label");
    elements.currentBrandDeviceField.hidden = false;

    if (deviceLabel) {
      deviceLabel.textContent = `Current ${brandName} device`;
    }
  }

  function updateCurrentOwnershipNotice() {
    if (state.ownsDevice !== "yes" || !state.currentBrand || !state.currentDeviceId) {
      elements.currentOwnershipNotice.hidden = true;
      elements.currentOwnershipNotice.textContent = "";
      return;
    }

    const currentDevice = getCurrentComparisonDevice();
    const note = getPoolAccuracyNote(currentDevice);
    elements.currentOwnershipNotice.hidden = !note;
    elements.currentOwnershipNotice.textContent = note;
  }

  function updateCompareSelectionNotice(side) {
    const noticeElement = side === "left" ? elements.compareLeftNotice : elements.compareRightNotice;
    const brandId = side === "left" ? state.compareLeftBrand : state.compareRightBrand;
    const deviceId = side === "left" ? state.compareLeftDeviceId : state.compareRightDeviceId;

    if (!brandId || !deviceId) {
      noticeElement.hidden = true;
      noticeElement.textContent = "";
      return;
    }

    const device = getResolvedDeviceSelection(brandId, deviceId);
    const note = getPoolAccuracyNote(device);
    noticeElement.hidden = !note;
    noticeElement.textContent = note;
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
    const hasExportableContent = latestAnalysis
      && ((latestAnalysis.mode === "compated" && latestAnalysis.ready)
        || (latestAnalysis.mode !== "compated" && latestAnalysis.hasActiveLibrary));

    if (!hasExportableContent) {
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
    if (!state.mode) {
      latestAnalysis = null;
      elements.snapshotCards.innerHTML = "";
      elements.resultsContent.innerHTML = "";
      persistState();
      return;
    }

    if (state.mode === "compated") {
      latestAnalysis = analyzeCompareMode();
      elements.snapshotCards.innerHTML = "";
      renderCompareResults(latestAnalysis);
    } else {
      updatePreferencePoolNote();
      latestAnalysis = analyzeState();
      renderSnapshot(latestAnalysis);
      renderResults(latestAnalysis);
    }

    persistState();

    const hasVisibleResults = state.mode === "compated"
      ? latestAnalysis.ready
      : latestAnalysis.hasActiveLibrary;

    if (scrollToResults && hasVisibleResults) {
      elements.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function buildSelectedSystemBreakdown() {
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

    return breakdown;
  }

  function analyzeState() {
    const breakdown = buildSelectedSystemBreakdown();

    const fitModel = getActiveFitModel(breakdown);
    const storage = analyzeStorage(breakdown, fitModel);
    const performance = analyzePerformance(breakdown, fitModel);
    const accuracy = analyzeAccuracy(breakdown);
    const laneSupport = getActiveLaneSupportSummary(breakdown);
    const currentOwnedDevice = getCurrentComparisonDevice();

    if (laneSupport.blocked.length) {
      return {
        mode: "recommendation",
        hasActiveLibrary: breakdown.length > 0,
        breakdown,
        fitModel,
        storage,
        performance,
        accuracy,
        confidence: analyzeRecommendationConfidence(breakdown, null, accuracy, currentOwnedDevice),
        laneSupport,
        scoring: createEmptyScoring(),
        sdSavingsPaths: [],
        currentComparison: null,
        ownershipNote: buildOwnershipNote(currentOwnedDevice, null),
        dualScreenNeed: calculateDualScreenNeed(breakdown),
        headlineSystems: getHeadlineSystems(breakdown),
        keepCurrent: false
      };
    }

    const scoring = scoreDevices(breakdown, storage, performance, accuracy);
    const dualScreenNeed = calculateDualScreenNeed(breakdown);
    const currentComparison = currentOwnedDevice && scoring.recommended
      ? compareCurrentDevice(currentOwnedDevice, scoring.recommended, performance, storage, dualScreenNeed)
      : null;
    const ownershipNote = buildOwnershipNote(currentOwnedDevice, currentComparison);
    const sdSavingsPaths = findSdSavingsPaths(breakdown, storage, performance, scoring);
    const confidence = analyzeRecommendationConfidence(breakdown, scoring.recommended, accuracy, currentOwnedDevice);

    return {
      mode: "recommendation",
      hasActiveLibrary: breakdown.length > 0,
      breakdown,
      fitModel,
      storage,
      performance,
      accuracy,
      confidence,
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

  function analyzeCompareMode() {
    const leftDevice = getResolvedCompareDevice("left");
    const rightDevice = getResolvedCompareDevice("right");

    if (!leftDevice || !rightDevice) {
      return {
        mode: "compated",
        ready: false,
        leftDevice,
        rightDevice
      };
    }

    const metrics = buildDirectCompareMetrics(leftDevice, rightDevice);
    let leftPoints = 0;
    let rightPoints = 0;

    metrics.forEach((metric) => {
      if (metric.winner === "left") {
        leftPoints += metric.weight;
      } else if (metric.winner === "right") {
        rightPoints += metric.weight;
      }
    });

    const winnerSide = leftPoints === rightPoints ? "tie" : leftPoints > rightPoints ? "left" : "right";
    const winningDevice = winnerSide === "left" ? leftDevice : winnerSide === "right" ? rightDevice : null;
    const differentLane = getComparisonClass(leftDevice) !== getComparisonClass(rightDevice);
    const verdict = getDirectCompareVerdict(leftPoints, rightPoints, differentLane);
    const confidence = analyzeCompareConfidence(leftDevice, rightDevice, differentLane);

    return {
      mode: "compated",
      ready: true,
      leftDevice,
      rightDevice,
      winnerSide,
      winningDevice,
      differentLane,
      verdict,
      confidence,
      metrics,
      headline: buildDirectCompareHeadline(winnerSide, winningDevice, leftDevice, rightDevice),
      summary: buildDirectCompareSummary(winnerSide, leftDevice, rightDevice, differentLane),
      notes: buildDirectCompareNotes(leftDevice, rightDevice, metrics, winnerSide, differentLane)
    };
  }

  function getResolvedCompareDevice(side) {
    if (side === "left") {
      return getResolvedDeviceSelection(state.compareLeftBrand, state.compareLeftDeviceId);
    }

    return getResolvedDeviceSelection(state.compareRightBrand, state.compareRightDeviceId);
  }

  function buildDirectCompareMetrics(leftDevice, rightDevice) {
    const leftTraits = getDeviceTraitProfile(leftDevice);
    const rightTraits = getDeviceTraitProfile(rightDevice);
    const metrics = [];
    const selectedBreakdown = buildSelectedSystemBreakdown();
    let formFactorMetric = {
      label: "Form Factor",
      leftValue: formatFormFactorLabel(leftDevice.formFactor),
      rightValue: formatFormFactorLabel(rightDevice.formFactor),
      winner: "tie",
      weight: 0,
      note: "Shape is preference driven, so this row does not pick a winner."
    };

    if (selectedBreakdown.length) {
      const leftCompatibility = getLibraryCompatibilitySummary(leftDevice, selectedBreakdown);
      const rightCompatibility = getLibraryCompatibilitySummary(rightDevice, selectedBreakdown);
      const leftFormFactorSummary = getLibraryFormFactorSummary(leftCompatibility);
      const rightFormFactorSummary = getLibraryFormFactorSummary(rightCompatibility);
      metrics.push({
        label: "Selected Library",
        leftValue: formatFitScore(leftCompatibility.ratio * 100),
        rightValue: formatFitScore(rightCompatibility.ratio * 100),
        winner: compareNumericLead(leftCompatibility.ratio, rightCompatibility.ratio),
        weight: 3,
        note: "Current selected systems with screen, controls, touch, software, and form factor counted when relevant."
      });

      formFactorMetric = {
        label: "Form Factor",
        leftValue: formatFormFactorLabel(leftDevice.formFactor),
        rightValue: formatFormFactorLabel(rightDevice.formFactor),
        winner: leftFormFactorSummary && rightFormFactorSummary
          ? compareNumericLead(leftFormFactorSummary.ratio, rightFormFactorSummary.ratio)
          : "tie",
        weight: leftFormFactorSummary && rightFormFactorSummary ? 2 : 0,
        note: leftFormFactorSummary && rightFormFactorSummary
          ? "Current selected systems care about clamshell or dual screen shape, so form factor can break the tie."
          : "Shape is preference driven, so this row does not pick a winner."
      };
    }

    metrics.push(
      {
        label: "Power Tier",
        leftValue: getComputeFloorLabel(leftDevice.computeRank),
        rightValue: getComputeFloorLabel(rightDevice.computeRank),
        winner: compareNumericLead(leftDevice.computeRank, rightDevice.computeRank),
        weight: 4,
        note: "Higher tier means more raw headroom."
      },
      {
        label: "RAM",
        leftValue: `${leftDevice.ram}GB`,
        rightValue: `${rightDevice.ram}GB`,
        winner: compareNumericLead(leftDevice.ram, rightDevice.ram),
        weight: 2,
        note: "More RAM helps multitasking and heavier Android loads."
      },
      {
        label: "Storage",
        leftValue: formatSize(leftDevice.storage),
        rightValue: formatSize(rightDevice.storage),
        winner: compareNumericLead(leftDevice.storage, rightDevice.storage),
        weight: 1,
        note: "Internal storage only."
      },
      {
        label: "Screen",
        leftValue: formatDeviceScreenLabel(leftDevice),
        rightValue: formatDeviceScreenLabel(rightDevice),
        winner: compareNumericLead(
          (leftTraits.bigScreen + leftTraits.retroScreen + leftTraits.dualScreen) / 3,
          (rightTraits.bigScreen + rightTraits.retroScreen + rightTraits.dualScreen) / 3
        ),
        weight: 2,
        note: "General screen utility for mixed handheld use."
      },
      {
        label: "Controls",
        leftValue: formatDeviceControlLabel(leftDevice),
        rightValue: formatDeviceControlLabel(rightDevice),
        winner: compareNumericLead(
          (leftTraits.sticks + leftTraits.dpad) / 2,
          (rightTraits.sticks + rightTraits.dpad) / 2
        ),
        weight: 2,
        note: "General control flexibility, not one genre only."
      },
      {
        label: "Portability",
        leftValue: leftTraits.portability >= 0.75 ? "Easy carry" : leftTraits.portability >= 0.55 ? "Mid carry" : "Larger carry",
        rightValue: rightTraits.portability >= 0.75 ? "Easy carry" : rightTraits.portability >= 0.55 ? "Mid carry" : "Larger carry",
        winner: compareNumericLead(leftTraits.portability, rightTraits.portability),
        weight: 1,
        note: "Higher portability means easier day to day carry."
      },
      {
        label: "Battery Fit",
        leftValue: leftTraits.battery >= 0.78 ? "Strong" : leftTraits.battery >= 0.62 ? "Good" : "Average",
        rightValue: rightTraits.battery >= 0.78 ? "Strong" : rightTraits.battery >= 0.62 ? "Good" : "Average",
        winner: compareNumericLead(leftTraits.battery, rightTraits.battery),
        weight: 1,
        note: "Directional long session comfort only."
      },
      {
        label: "Software Fit",
        leftValue: formatDeviceSoftwareLabel(leftDevice),
        rightValue: formatDeviceSoftwareLabel(rightDevice),
        winner: compareNumericLead(leftTraits.software, rightTraits.software),
        weight: 1,
        note: "Directional maturity estimate from the profile layer."
      },
      formFactorMetric,
      {
        label: "Live Price",
        leftValue: getComparisonPriceLabel(leftDevice),
        rightValue: getComparisonPriceLabel(rightDevice),
        winner: comparePriceLead(leftDevice, rightDevice),
        weight: 1,
        note: "Lower live price wins when both prices exist."
      }
    );

    return metrics;
  }

  function compareNumericLead(leftValue, rightValue) {
    if (leftValue === rightValue) {
      return "tie";
    }

    return leftValue > rightValue ? "left" : "right";
  }

  function comparePriceLead(leftDevice, rightDevice) {
    const leftPrice = getValidPrice(leftDevice);
    const rightPrice = getValidPrice(rightDevice);

    if (leftPrice === null || rightPrice === null || leftPrice === rightPrice) {
      return "tie";
    }

    return leftPrice < rightPrice ? "left" : "right";
  }

  function getDirectCompareVerdict(leftPoints, rightPoints, differentLane) {
    const gap = Math.abs(leftPoints - rightPoints);

    if (gap >= 5) {
      return differentLane ? "Clear lead across different lanes" : "Clear lead";
    }

    if (gap >= 2) {
      return differentLane ? "Modest lead across different lanes" : "Modest lead";
    }

    return differentLane ? "Close but different lanes" : "Close match";
  }

  function buildDirectCompareHeadline(winnerSide, winningDevice, leftDevice, rightDevice) {
    if (winnerSide === "tie" || !winningDevice) {
      return `${leftDevice.name} and ${rightDevice.name} are very close on paper.`;
    }

    return `${winningDevice.name} has the stronger overall spec profile.`;
  }

  function buildDirectCompareSummary(winnerSide, leftDevice, rightDevice, differentLane) {
    const cheaperSide = comparePriceLead(leftDevice, rightDevice);
    const cheaperDevice = cheaperSide === "left" ? leftDevice : cheaperSide === "right" ? rightDevice : null;

    if (winnerSide === "tie") {
      let tieSummary = "These two land very close on raw specs, so shape, software lane, and price matter more than the small paper gap.";
      if (differentLane) {
        tieSummary += " They also sit in different handheld lanes, so this is directional rather than one to one.";
      }
      return tieSummary;
    }

    const winningDevice = winnerSide === "left" ? leftDevice : rightDevice;
    let summary = `${winningDevice.name} comes out ahead on compute tier, RAM, and storage overall.`;

    if (cheaperDevice) {
      if (cheaperDevice.id === winningDevice.id) {
        summary += ` It also carries the lower live price right now.`;
      } else {
        summary += ` ${cheaperDevice.name} is the cheaper option if price matters more than raw headroom.`;
      }
    }

    if (differentLane) {
      summary += " These two sit in different handheld lanes, so treat the result as directional.";
    }

    return summary;
  }

  function buildDirectCompareNotes(leftDevice, rightDevice, metrics, winnerSide, differentLane) {
    const notes = [];
    const libraryMetric = metrics.find((metric) => metric.label === "Selected Library");
    const powerMetric = metrics.find((metric) => metric.label === "Power Tier");
    const ramMetric = metrics.find((metric) => metric.label === "RAM");
    const formFactorMetric = metrics.find((metric) => metric.label === "Form Factor");
    const priceMetric = metrics.find((metric) => metric.label === "Live Price");
    const selectedBreakdown = buildSelectedSystemBreakdown();

    if (libraryMetric && libraryMetric.winner !== "tie") {
      const libraryLeader = libraryMetric.winner === "left" ? leftDevice : rightDevice;
      notes.push(`${libraryLeader.name} fits your currently selected systems more cleanly.`);
    }

    if (formFactorMetric && formFactorMetric.weight > 0 && formFactorMetric.winner !== "tie") {
      const formFactorLeader = formFactorMetric.winner === "left" ? leftDevice : rightDevice;
      if (selectedBreakdown.some((entry) => entry.id === "ds" || entry.id === "3ds")) {
        notes.push(`${formFactorLeader.name} fits DS or 3DS more naturally because the form factor is closer to a true dual screen layout.`);
      } else {
        notes.push(`${formFactorLeader.name} matches your selected library's form factor needs more naturally.`);
      }
    }

    if (powerMetric && powerMetric.winner !== "tie") {
      const powerLeader = powerMetric.winner === "left" ? leftDevice : rightDevice;
      notes.push(`${powerLeader.name} has the higher power tier.`);
    }

    if (ramMetric && ramMetric.winner !== "tie") {
      const ramLeader = ramMetric.winner === "left" ? leftDevice : rightDevice;
      notes.push(`${ramLeader.name} carries more RAM for heavier multitasking.`);
    }

    if (priceMetric && priceMetric.winner !== "tie") {
      const priceLeader = priceMetric.winner === "left" ? leftDevice : rightDevice;
      notes.push(`${priceLeader.name} has the lower live price from the current pool.`);
    }

    if (differentLane) {
      notes.push("These sit in different handheld lanes, so the result is directional rather than like for like.");
    }

    const leftAccuracyNote = getPoolAccuracyNote(leftDevice);
    const rightAccuracyNote = getPoolAccuracyNote(rightDevice);
    if (leftAccuracyNote) {
      notes.push(leftAccuracyNote);
    }
    if (rightAccuracyNote) {
      notes.push(rightAccuracyNote);
    }

    if (winnerSide === "tie") {
      notes.push("This is close enough that form factor and software preference should break the tie.");
    }

    return dedupeStrings(notes).slice(0, 6);
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

  function scoreDevices(breakdown, storage, performance, accuracy) {
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

      const experienceNotes = buildExperienceNotes(getExperienceFitBreakdown(device, accuracy));
      experienceNotes.positives.forEach((note) => strengths.push(note));
      experienceNotes.cautions.forEach((note) => cautions.push(note));

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
        accuracy,
        totalStoragePool,
        dualScreenNeed,
        budgetWeight,
        futureWeight,
        priceContext,
        breakdown
      );
      const compatibilityStrength = buildCompatibilityStrengthLine(fitBreakdown.compatibility);
      const compatibilityCaution = buildCompatibilityCautionLine(fitBreakdown.compatibility);
      if (compatibilityStrength) {
        strengths.push(compatibilityStrength);
      }
      if (compatibilityCaution) {
        cautions.push(compatibilityCaution);
      }

      return {
        device,
        score: fitBreakdown.total,
        rankScore,
        fitBreakdown,
        compatibility: fitBreakdown.compatibility,
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

  function buildFitScoreBreakdown(device, storage, performance, accuracy, totalStoragePool, dualScreenNeed, budgetWeight, futureWeight, priceContext, breakdown) {
    const performanceBreakdown = getPerformanceFitPoints(device, performance, budgetWeight, futureWeight, breakdown);
    const performanceScore = performanceBreakdown.total;
    const ramScore = getRamFitPoints(device, performance, budgetWeight, futureWeight);
    const storageScore = getStorageFitPoints(device, storage, performance, totalStoragePool);
    const valueScore = getValueFitPoints(device, performance, budgetWeight, futureWeight, priceContext);
    const preferenceScore = getPreferenceFitPoints(device, dualScreenNeed);
    const experienceScore = getExperienceFitBreakdown(device, accuracy).total;
    const total = RULES.clamp(
      performanceScore + ramScore + storageScore + valueScore + preferenceScore + experienceScore,
      0,
      100
    );

    return {
      performance: performanceScore,
      performanceBase: performanceBreakdown.base,
      performanceCompatibility: performanceBreakdown.compatibilityScore,
      compatibility: performanceBreakdown.compatibility,
      ram: ramScore,
      storage: storageScore,
      value: valueScore,
      preference: preferenceScore,
      experience: experienceScore,
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
      const hypotheticalScoring = scoreDevices(breakdown, hypotheticalStorage, performance, analyzeAccuracy(breakdown));
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
      { key: "preference", value: fitBreakdown.preference, max: FIT_SCORE_WEIGHTS.preference },
      { key: "experience", value: fitBreakdown.experience, max: FIT_SCORE_WEIGHTS.experience }
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
      experience: parts.find((part) => part.key === "experience").points,
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

  function getBasePerformanceFitPoints(device, performance, budgetWeight, futureWeight) {
    const delta = device.computeRank - performance.computeFloorRank;
    const retroLiteModel = performance.fitModel === "retro-lite";
    if (delta < 0) {
      return 0;
    }

    if (delta === 0) {
      return retroLiteModel ? 27 : 26;
    }

    if (delta === 1) {
      if (retroLiteModel) {
        return RULES.clamp(27 + futureWeight - (budgetWeight * 3), 21, 29);
      }

      return FIT_SCORE_WEIGHTS.performance;
    }

    if (retroLiteModel) {
      return RULES.clamp(
        20 + futureWeight - (budgetWeight * Math.min(8, delta * 3)),
        10,
        22
      );
    }

    return RULES.clamp(
      28 + (futureWeight * 1.5) - (budgetWeight * Math.min(5, (delta - 1) * 2.5)),
      22,
      FIT_SCORE_WEIGHTS.performance
    );
  }

  function getPerformanceFitPoints(device, performance, budgetWeight, futureWeight, breakdown) {
    const baseScore = getBasePerformanceFitPoints(device, performance, budgetWeight, futureWeight);
    const compatibility = getLibraryCompatibilitySummary(device, breakdown);

    if (baseScore <= 0 || !breakdown.length) {
      return {
        total: baseScore,
        base: baseScore,
        compatibilityScore: baseScore,
        compatibility
      };
    }

    const compatibilityScore = compatibility.ratio * FIT_SCORE_WEIGHTS.performance;
    return {
      total: RULES.clamp((baseScore * 0.62) + (compatibilityScore * 0.38), 0, FIT_SCORE_WEIGHTS.performance),
      base: baseScore,
      compatibilityScore,
      compatibility
    };
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
        18 - Math.min(8, overshoot * 1.2) + (futureWeight * 0.5) - (budgetWeight * Math.min(2, overshoot / 2)),
        10,
        FIT_SCORE_WEIGHTS.ram
      );
    }

    return RULES.clamp(
      19 - Math.min(3, overshoot / 6) + Math.min(1, futureWeight) - (budgetWeight * Math.min(1.5, overshoot / 16)),
      16,
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
      ? `Keep ${formatDeviceDisplayName(analysis.currentComparison.currentDevice)}`
      : formatDeviceDisplayName(analysis.scoring.recommended.device);
    const snapshotPriceLabel = getRecommendedPriceLabel(analysis, analysis.scoring.recommended.device);
    const snapshotPriceCopy = getRecommendedPriceCopy(analysis, analysis.scoring.recommended.device);
    const computeLabel = RULES.getTierByRank(analysis.performance.computeFloorRank).label;
    const ramLabel = formatRamTierLabel(analysis.performance.recommendedRamRank, analysis.performance.fitModel);
    const snapshotDevice = analysis.keepCurrent && analysis.currentComparison
      ? analysis.currentComparison.currentDevice
      : analysis.scoring.recommended.device;
    const experienceBreakdown = getExperienceFitBreakdown(snapshotDevice, analysis.accuracy);
    const experienceLabel = formatFitScore((experienceBreakdown.total / FIT_SCORE_WEIGHTS.experience) * 100);

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
          <h3>Experience Fit</h3>
          <span class="mini-tag">${escapeHtml(experienceLabel)}</span>
        </div>
        <div class="kpi">${escapeHtml(formatDeviceExperienceLabel(snapshotDevice))}</div>
        <div class="result-copy">${escapeHtml(analysis.accuracy.summary)}</div>
      </div>
      <div class="snapshot-card">
        <div class="summary-card-top">
          <h3>Confidence</h3>
          <span class="mini-tag">${Math.round(analysis.confidence.score)}%</span>
        </div>
        <div class="kpi">${escapeHtml(analysis.confidence.label)}</div>
        <div class="result-copy">${escapeHtml(analysis.confidence.summary)}</div>
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
      ? `Keep ${formatDeviceDisplayName(analysis.currentComparison.currentDevice)}`
      : formatDeviceDisplayName(analysis.scoring.recommended.device);
    const snapshotDevice = analysis.keepCurrent && analysis.currentComparison
      ? analysis.currentComparison.currentDevice
      : analysis.scoring.recommended.device;
    const snapshotPriceLabel = getRecommendedPriceLabel(analysis, analysis.scoring.recommended.device);
    const snapshotPriceCopy = getRecommendedPriceCopy(analysis, analysis.scoring.recommended.device);

    elements.snapshotCards.innerHTML = `
      <div class="simple-terminal simple-terminal-mini">
        <div class="simple-terminal-head">File Explorer</div>
        ${renderSimpleExplorerPath(["Where2Buy", "Snapshot", "At a Glance"])}
        ${renderSimpleTerminalSection("At a Glance", [
          ["Best Fit", recommendedName],
          ["Experience Fit", formatFitScore((getExperienceFitBreakdown(snapshotDevice, analysis.accuracy).total / FIT_SCORE_WEIGHTS.experience) * 100)],
          ["Confidence", analysis.confidence.label],
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

  function renderCompareResults(analysis) {
    if (!analysis.ready) {
      const emptyMessage = "Pick a handheld on both sides to run a direct compare.";

      if (state.format === "simple") {
        elements.resultsContent.innerHTML = `
          <div class="simple-terminal simple-terminal-full">
            <div class="simple-terminal-head">File Explorer</div>
            ${renderSimpleExplorerPath(["Where2Buy", "Compare", "Simple"])}
            <div class="simple-terminal-command">Ready</div>
            <div class="simple-terminal-note">${escapeHtml(emptyMessage)}</div>
          </div>
        `;
        return;
      }

      elements.resultsContent.innerHTML = `
        <div class="empty-state">
          ${escapeHtml(emptyMessage)}
        </div>
      `;
      return;
    }

    if (state.format === "simple") {
      renderSimpleCompareResults(analysis);
      return;
    }

    const winnerCopy = analysis.winnerSide === "tie"
      ? "No clear winner"
      : `${analysis.winningDevice.name} leads`;
    const compareNotes = [analysis.confidence.summary, ...analysis.notes].filter(Boolean);

    elements.resultsContent.innerHTML = `
      <div class="scorecard-story">
        <section class="story-hero">
          <div class="story-hero-grid">
            <div class="story-hero-copy">
              <p class="story-kicker">Direct Compare</p>
              <h3 class="story-title">${escapeHtml(analysis.headline)}</h3>
              <p class="story-lead">${escapeHtml(analysis.summary)}</p>
            </div>
            <div class="story-burst">
              <span class="story-burst-label">Verdict</span>
              <strong class="story-burst-value">${escapeHtml(winnerCopy)}</strong>
              <span class="story-burst-copy">${escapeHtml(analysis.confidence.label)} | ${escapeHtml(analysis.verdict)}</span>
            </div>
          </div>
        </section>

        <section class="story-panel story-tone-purple">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Devices</p>
              <h3>Head to head</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">${escapeHtml(analysis.verdict)}</span>
              <span class="story-chip">${escapeHtml(analysis.confidence.label)}</span>
            </div>
          </div>
          <div class="story-choice-grid">
            ${renderCompareDeviceCard("Left Device", analysis.leftDevice, analysis.winnerSide === "left")}
            ${renderCompareDeviceCard("Right Device", analysis.rightDevice, analysis.winnerSide === "right")}
          </div>
        </section>

        <section class="story-panel story-tone-blue">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Metrics</p>
              <h3>Paper specs</h3>
            </div>
          </div>
          <div class="compare-metric-list">
            ${analysis.metrics.map((metric) => renderCompareMetricRow(metric)).join("")}
          </div>
        </section>

        <section class="story-panel story-tone-green">
          <div class="story-panel-heading">
            <div>
              <p class="story-step">Notes</p>
              <h3>What stands out</h3>
            </div>
            <div class="story-chip-row">
              <span class="story-chip">${Math.round(analysis.confidence.score)}% confidence</span>
            </div>
          </div>
          <div class="story-list">
            ${compareNotes.map((note) => `<div>${escapeHtml(note)}</div>`).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderSimpleCompareResults(analysis) {
    const compareNotes = [analysis.confidence.summary, ...analysis.notes].filter(Boolean);
    elements.resultsContent.innerHTML = `
      <div class="simple-terminal simple-terminal-full">
        <div class="simple-terminal-head">File Explorer</div>
        ${renderSimpleExplorerPath(["Where2Buy", "Compare", "Simple"])}
        ${renderSimpleTerminalSection("Compare", [
          ["Headline", analysis.headline],
          ["Verdict", analysis.verdict],
          ["Confidence", analysis.confidence.label],
          ["Left Device", analysis.leftDevice.name],
          ["Right Device", analysis.rightDevice.name]
        ])}
        ${renderSimpleTerminalSection("Paper Specs", analysis.metrics.map((metric) => {
          return [metric.label, `${metric.leftValue} | ${metric.rightValue}`];
        }))}
        <section class="simple-terminal-section">
          <h3 class="simple-terminal-title">Notes</h3>
          ${renderSimpleTerminalNotes(compareNotes)}
        </section>
      </div>
    `;
  }

  function renderCompareDeviceCard(title, device, isLeading) {
    const accuracyNote = getPoolAccuracyNote(device);
    const accentClass = isLeading ? " story-choice-card-accent" : "";

    return `
      <article class="story-choice-card${accentClass}">
        <span class="story-choice-label">${escapeHtml(title)}</span>
        <h4>${escapeHtml(formatDeviceDisplayName(device))}</h4>
        <div class="story-chip-row">
          <span class="story-chip story-chip-accent">${escapeHtml(getBrandName(getDeviceBrandId(device)))}</span>
          <span class="story-chip">${escapeHtml(getComparisonClassLabel(getComparisonClass(device)))}</span>
          <span class="story-chip">${escapeHtml(formatFormFactorLabel(device.formFactor))}</span>
          <span class="story-chip">${escapeHtml(formatDeviceScreenLabel(device))}</span>
          <span class="story-chip">${escapeHtml(formatDeviceControlLabel(device))}</span>
          <span class="story-chip">${escapeHtml(formatDeviceSoftwareLabel(device))}</span>
          <span class="story-chip">${device.ram}GB RAM</span>
          <span class="story-chip">${formatSize(device.storage)} storage</span>
          ${renderDeviceFeatureChips(device, 2)}
          <span class="story-chip">${escapeHtml(getComparisonPriceLabel(device))}</span>
        </div>
        ${accuracyNote ? `<p class="story-choice-copy">${escapeHtml(accuracyNote)}</p>` : `<p class="story-choice-copy">Live pool device with direct sheet data.</p>`}
      </article>
    `;
  }

  function renderCompareMetricRow(metric) {
    const leftClass = metric.winner === "left" ? " is-leading" : "";
    const rightClass = metric.winner === "right" ? " is-leading" : "";

    return `
      <article class="compare-metric-row">
        <div class="compare-metric-head">
          <span class="compare-metric-label">${escapeHtml(metric.label)}</span>
          <span class="compare-metric-note">${escapeHtml(metric.note)}</span>
        </div>
        <div class="compare-metric-values">
          <span class="compare-metric-value${leftClass}">${escapeHtml(metric.leftValue)}</span>
          <span class="compare-metric-value compare-metric-value-center">vs</span>
          <span class="compare-metric-value${rightClass}">${escapeHtml(metric.rightValue)}</span>
        </div>
      </article>
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
      ? `Keep your current ${formatDeviceDisplayName(analysis.currentComparison.currentDevice)}`
      : formatDeviceDisplayName(recommendedDevice);
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
    const experienceBreakdown = getExperienceFitBreakdown(displayDevice, analysis.accuracy);
    const experiencePercent = (experienceBreakdown.total / FIT_SCORE_WEIGHTS.experience) * 100;

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
                <span class="story-chip">${escapeHtml(formatDeviceExperienceLabel(displayDevice))}</span>
                <span class="story-chip">${escapeHtml(formatDeviceScreenLabel(displayDevice))}</span>
                <span class="story-chip">${escapeHtml(formatDeviceControlLabel(displayDevice))}</span>
                <span class="story-chip">${escapeHtml(formatDeviceSoftwareLabel(displayDevice))}</span>
                <span class="story-chip">${displayDevice.ram}GB RAM</span>
                <span class="story-chip">${formatSize(displayDevice.storage)} storage</span>
                ${displayDevice.storageSpec ? `<span class="story-chip">${escapeHtml(displayDevice.storageSpec)}</span>` : ""}
                ${renderDeviceFeatureChips(displayDevice, 3)}
                <span class="story-chip">${escapeHtml(priceLabel)}</span>
                ${getDeviceTraitProfile(displayDevice).touch ? `<span class="story-chip">Touch</span>` : ""}
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
          ${renderStoryMetricCard("Experience Fit", formatFitScore(experiencePercent), analysis.accuracy.summary)}
          ${renderStoryMetricCard("Confidence", analysis.confidence.label, analysis.confidence.summary)}
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
              ${renderStoryMeterCard("Experience fit", experiencePercent, analysis.accuracy.summary)}
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
        ["Current Device", formatDeviceDisplayName(analysis.currentComparison.currentDevice)],
        ["Recommended", formatDeviceDisplayName(analysis.currentComparison.recommendedDevice)],
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
        ${renderSimpleExplorerPath(["Where2Buy", "Recommendations", "Simple", getBrandName(getDeviceBrandId(context.recommendedDevice)), formatDeviceDisplayName(context.recommendedDevice)])}
        <div class="simple-terminal-command">Folder Summary</div>
        ${renderSimpleTerminalSection("Recommendation Configuration", [
          ["Best Fit", context.recommendedTitle],
          ["Experience Fit", formatFitScore((getExperienceFitBreakdown(context.displayDevice, analysis.accuracy).total / FIT_SCORE_WEIGHTS.experience) * 100)],
          ["Confidence", analysis.confidence.label],
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
          ["Experience", `${context.scoreBreakdown.experience}/${FIT_SCORE_WEIGHTS.experience}`],
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
    const accuracySummary = analysis.accuracy.primarySignals.length
      ? `the accuracy layer is leaning toward ${formatJoinedList(analysis.accuracy.primarySignals)}`
      : "the accuracy layer stays balanced";
    if (analysis.fitModel === "retro-lite") {
      return `${recommendedCandidate.device.name} lands on top because it fits ${systemSummary || "your selected mix"}, keeps the storage target around ${formatSize(analysis.storage.expectedAverage)}, ${accuracySummary}, and does not waste money on heavier Android style headroom you do not need here.`;
    }

    return `${recommendedCandidate.device.name} lands on top because it fits ${systemSummary || "your selected mix"}, ${storageSummary}, ${ramSummary}, and ${accuracySummary} without drifting too far into overkill.`;
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

    if (analysis.accuracy.primarySignals.length) {
      return `${recommendedCandidate.device.name} clears the hard requirements and the accuracy pass lined it up well with ${formatJoinedList(analysis.accuracy.primarySignals)}.`;
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

    if (analysis.confidence.score < 60) {
      return "Watch caveats";
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
      return [label, `${formatDeviceDisplayName(path.candidate.device)} + ${formatSdCardSize(path.sdCardSizeGb)} SD${savingsText}`];
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

      return `Because a large part of this library is SD friendly, a ${formatSdCardSize(path.sdCardSizeGb)} SD card could bring you down to ${formatDeviceDisplayName(path.candidate.device)}${savingsText}.`;
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
              <span>${escapeHtml(formatDeviceDisplayName(path.candidate.device))}</span>
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
            <h4>${escapeHtml(formatDeviceDisplayName(comparison.currentDevice))}</h4>
            <div class="story-chip-row">
              <span class="story-chip">${comparison.currentDevice.ram}GB RAM</span>
              <span class="story-chip">${formatSize(comparison.currentDevice.storage)} storage</span>
            </div>
          </article>
          <article class="story-choice-card story-choice-card-accent">
            <span class="story-choice-label">Recommended</span>
            <h4>${escapeHtml(formatDeviceDisplayName(comparison.recommendedDevice))}</h4>
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
        <h4>${escapeHtml(formatDeviceDisplayName(candidate.device))}</h4>
        <div class="story-chip-row">
          <span class="story-chip story-chip-accent">${candidate.device.ram}GB RAM</span>
          <span class="story-chip">${formatSize(candidate.device.storage)} storage</span>
          ${candidate.device.storageSpec ? `<span class="story-chip">${escapeHtml(candidate.device.storageSpec)}</span>` : ""}
          ${renderDeviceFeatureChips(candidate.device, 1)}
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
        <h4>${escapeHtml(formatDeviceDisplayName(candidate.device))}</h4>
        <div class="story-chip-row">
          <span class="story-chip">${candidate.device.ram}GB RAM</span>
          <span class="story-chip">${formatSize(candidate.device.storage)} storage</span>
          ${candidate.device.storageSpec ? `<span class="story-chip">${escapeHtml(candidate.device.storageSpec)}</span>` : ""}
          ${renderDeviceFeatureChips(candidate.device, 1)}
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
    if (analysis.accuracy.primarySignals.length) {
      lines.push(`Accuracy inputs are currently leaning toward ${formatJoinedList(analysis.accuracy.primarySignals)}.`);
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

    if (analysis.scoring.recommended && analysis.scoring.recommended.compatibility) {
      const compatibilityStrength = buildCompatibilityStrengthLine(analysis.scoring.recommended.compatibility);
      const compatibilityCaution = buildCompatibilityCautionLine(analysis.scoring.recommended.compatibility);
      if (compatibilityStrength) {
        lines.push(`Compatibility note: ${compatibilityStrength}`);
      }
      if (compatibilityCaution) {
        lines.push(`Compatibility note: ${compatibilityCaution}`);
      }
    }

    if (analysis.confidence.notes.length) {
      lines.push(`Confidence note: ${analysis.confidence.notes[0]}`);
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
              <span class="tag is-accent">${escapeHtml(formatDeviceDisplayName(candidate.device))}</span>
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
            <h3>${escapeHtml(formatDeviceDisplayName(candidate.device))}</h3>
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

    if (brandId === "gpd" || brandId === "onexplayer" || brandId === "asus" || brandId === "msi" || brandId === "valve") {
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

  function getComparisonClassLabel(compareClass) {
    const labels = {
      "android-retro": "Android Retro",
      "windows-handheld": "Windows Handheld",
      "linux-retro": "Linux Retro",
      "cloud-streaming": "Cloud Streaming"
    };

    return labels[compareClass] || "Mixed";
  }

  function getComparisonPriceLabel(device) {
    const price = getValidPrice(device);
    if (price !== null) {
      return usdFormatter.format(price);
    }

    return device && livePoolDeviceIds.has(device.id) ? "Price unavailable" : "No live price";
  }

  function getResolvedDeviceSelection(brandId, deviceId) {
    if (!brandId || !deviceId) {
      return null;
    }

    const ownedDevice = getOwnedDeviceById(brandId, deviceId);
    if (!ownedDevice) {
      return null;
    }

    if (deviceMap.has(deviceId)) {
      const currentDevice = deviceMap.get(deviceId);
      return {
        ...currentDevice,
        compareClass: getComparisonClass(currentDevice),
        estimatedProfile: currentDevice.specConfidence === "profile",
        inLivePool: livePoolDeviceIds.has(deviceId)
      };
    }

    const comparisonProfile = getOwnedDeviceCompareProfile(brandId, deviceId);

    if (!comparisonProfile) {
      return null;
    }

    return {
      id: ownedDevice.id,
      brand: brandId,
      name: ownedDevice.name,
      family: ownedDevice.name,
      ram: comparisonProfile.ram,
      storage: comparisonProfile.storage,
      computeRank: comparisonProfile.computeRank,
      formFactor: comparisonProfile.formFactor || "horizontal",
      dualScreen: Boolean(comparisonProfile.dualScreen),
      compareClass: comparisonProfile.compareClass || "android-retro",
      estimatedProfile: true,
      inLivePool: false,
      available: false,
      recommendable: false,
      specConfidence: "profile"
    };
  }

  function getPoolAccuracyNote(device) {
    if (!device || device.inLivePool) {
      return "";
    }

    if (device.estimatedProfile) {
      return `${device.name} is not in the live pool. This compare uses collected profile data and data could be incorrect.`;
    }

    if (device.catalogGenerated) {
      return `${device.name} is not in the live pool. This compare uses collected sheet data and data could be incorrect.`;
    }

    return `${device.name} is not in the live pool. Current data could be incorrect.`;
  }

  function getCurrentComparisonDevice() {
    if (state.ownsDevice !== "yes") {
      return null;
    }

    return getResolvedDeviceSelection(state.currentBrand, state.currentDeviceId);
  }

  function getBrandName(brandId) {
    return (brandMap.get(brandId) || brandMap.get("ayn") || { name: "AYN" }).name;
  }

  function getOwnedDeviceLabel() {
    if (!state.currentBrand) {
      return "";
    }

    if (state.currentDeviceId && deviceMap.has(state.currentDeviceId)) {
      return formatDeviceDisplayName(deviceMap.get(state.currentDeviceId));
    }

    const ownedDevice = getOwnedDeviceById(state.currentBrand, state.currentDeviceId);
    return ownedDevice ? formatDeviceDisplayName(ownedDevice) : getBrandName(state.currentBrand);
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

    if (!currentDevice.inLivePool) {
      if (currentDevice.catalogGenerated) {
        return `Current handheld noted: ${getOwnedDeviceLabel()}. It is outside the live pool, so this uses collected sheet data and current data could be incorrect.`;
      }

      return `Current handheld noted: ${getOwnedDeviceLabel()}. It is outside the live pool, so current data could be incorrect.`;
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

  function getExperienceEntryWeight(entry) {
    const usageWeights = {
      primary: 1.1,
      secondary: 0.82,
      edge: 0.48,
      none: 0.2
    };
    const usageWeight = usageWeights[entry.usageBand] || 0.55;
    const countValue = Number.isFinite(entry.count) ? entry.count : Math.max(1, entry.effectiveCount || 1);
    const libraryWeight = Math.min(1.7, 0.68 + Math.log10(countValue + 1));
    return Math.max(0.45, (entry.performanceWeight * 0.26) * usageWeight * libraryWeight);
  }

  function normalizeWeightedTraits(traits, fallbackValue = 0.5) {
    const weight = traits.weight || 0;
    if (!weight) {
      return {
        screenBig: fallbackValue,
        screenRetro: fallbackValue,
        dualScreen: 0,
        sticks: fallbackValue,
        dpad: fallbackValue,
        portability: fallbackValue,
        battery: fallbackValue,
        software: fallbackValue,
        touch: 0,
        confidenceRisk: 0.25
      };
    }

    return {
      screenBig: traits.screenBig / weight,
      screenRetro: traits.screenRetro / weight,
      dualScreen: traits.dualScreen / weight,
      sticks: traits.sticks / weight,
      dpad: traits.dpad / weight,
      portability: traits.portability / weight,
      battery: traits.battery / weight,
      software: traits.software / weight,
      touch: traits.touch / weight,
      confidenceRisk: traits.confidenceRisk / weight
    };
  }

  function applyAccuracyBiases(aggregate) {
    let screenBig = aggregate.screenBig;
    let screenRetro = aggregate.screenRetro;
    let dualScreen = aggregate.dualScreen;
    let sticks = aggregate.sticks;
    let dpad = aggregate.dpad;
    let portability = aggregate.portability;
    let battery = aggregate.battery;
    let software = aggregate.software;
    let touch = aggregate.touch;

    if (state.sessionStyle === "short") {
      portability += 0.12;
      battery -= 0.05;
    } else if (state.sessionStyle === "long") {
      battery += 0.18;
      screenBig += 0.08;
      portability -= 0.06;
    }

    if (state.portabilityPriority === "carry") {
      portability += 0.16;
      screenBig -= 0.04;
    } else if (state.portabilityPriority === "pocket") {
      portability += 0.28;
      screenBig -= 0.08;
    } else if (state.portabilityPriority === "desk") {
      portability -= 0.16;
      screenBig += 0.08;
      battery += 0.05;
    }

    if (state.screenPriority === "big") {
      screenBig += 0.3;
      screenRetro -= 0.05;
    } else if (state.screenPriority === "retro") {
      screenRetro += 0.3;
    } else if (state.screenPriority === "dual") {
      dualScreen += 0.5;
      screenBig += 0.08;
    }

    if (state.controlPriority === "sticks") {
      sticks += 0.22;
      dpad -= 0.05;
    } else if (state.controlPriority === "dpad") {
      dpad += 0.24;
      sticks -= 0.06;
    }

    if (state.softwarePreference === "stable") {
      software += 0.24;
    } else if (state.softwarePreference === "tinker") {
      software -= 0.12;
    }

    if (state.touchPreference === "required") {
      touch = 1;
    } else if (state.touchPreference === "avoid") {
      touch = 0;
    }

    return {
      screenBig: RULES.clamp(screenBig, 0, 1),
      screenRetro: RULES.clamp(screenRetro, 0, 1),
      dualScreen: RULES.clamp(dualScreen, 0, 1),
      sticks: RULES.clamp(sticks, 0, 1),
      dpad: RULES.clamp(dpad, 0, 1),
      portability: RULES.clamp(portability, 0, 1),
      battery: RULES.clamp(battery, 0, 1),
      software: RULES.clamp(software, 0, 1),
      touch: RULES.clamp(touch, 0, 1)
    };
  }

  function getPrimaryAccuracySignals(accuracy) {
    const candidates = [
      { key: "screenBig", label: "larger screens" },
      { key: "screenRetro", label: "retro friendly screens" },
      { key: "dualScreen", label: "dual screen layouts" },
      { key: "sticks", label: "stick heavy control layouts" },
      { key: "dpad", label: "d-pad heavy control layouts" },
      { key: "portability", label: "easy carry size" },
      { key: "battery", label: "long session comfort" },
      { key: "software", label: "software maturity" },
      { key: "touch", label: "touch support" }
    ];

    return candidates
      .map((entry) => ({ label: entry.label, value: accuracy.targets[entry.key] || 0 }))
      .filter((entry) => entry.value >= 0.56)
      .sort((left, right) => right.value - left.value)
      .slice(0, 3)
      .map((entry) => entry.label);
  }

  function buildAccuracySummary(accuracy) {
    const topNeeds = getPrimaryAccuracySignals(accuracy);
    if (!topNeeds.length) {
      return "Accuracy layer stays balanced, so the recommendation leans more on core fit than on one special hardware trait.";
    }

    return `Accuracy layer is leaning toward ${formatJoinedList(topNeeds)}.`;
  }

  function analyzeAccuracy(breakdown) {
    const totals = breakdown.reduce((result, entry) => {
      const profile = SYSTEM_ACCURACY_PROFILES[entry.id] || SYSTEM_ACCURACY_PROFILES.default;
      const weight = getExperienceEntryWeight(entry);
      result.screenBig += profile.screenBig * weight;
      result.screenRetro += profile.screenRetro * weight;
      result.dualScreen += profile.dualScreen * weight;
      result.sticks += profile.sticks * weight;
      result.dpad += profile.dpad * weight;
      result.portability += profile.portability * weight;
      result.battery += profile.battery * weight;
      result.software += profile.software * weight;
      result.touch += profile.touch * weight;
      result.confidenceRisk += profile.confidenceRisk * weight;
      result.weight += weight;
      return result;
    }, {
      screenBig: 0,
      screenRetro: 0,
      dualScreen: 0,
      sticks: 0,
      dpad: 0,
      portability: 0,
      battery: 0,
      software: 0,
      touch: 0,
      confidenceRisk: 0,
      weight: 0
    });

    const aggregate = normalizeWeightedTraits(totals);
    const targets = applyAccuracyBiases(aggregate);

    return {
      aggregate,
      targets,
      summary: buildAccuracySummary({ aggregate, targets }),
      primarySignals: getPrimaryAccuracySignals({ aggregate, targets }),
      confidenceRisk: RULES.clamp(aggregate.confidenceRisk, 0, 1)
    };
  }

  function getHeuristicDeviceTraitProfile(device) {
    const familyText = `${device.id} ${device.family || ""} ${device.name || ""}`.toLowerCase();
    const compareClass = getComparisonClass(device);
    let traits = null;

    if (compareClass === "windows-handheld") {
      if (device.dualScreen) {
        traits = { ...DEVICE_TRAIT_BASES.premiumDual };
      } else if (familyText.includes("mini") || familyText.includes("win 4") || familyText.includes("air")) {
        traits = { ...DEVICE_TRAIT_BASES.windowsCompact };
      } else {
        traits = { ...DEVICE_TRAIT_BASES.windowsHandheld };
      }
    } else if (compareClass === "cloud-streaming") {
      traits = { ...DEVICE_TRAIT_BASES.cloudLarge };
    } else if (device.dualScreen) {
      traits = { ...(device.computeRank >= 4 ? DEVICE_TRAIT_BASES.premiumDual : DEVICE_TRAIT_BASES.midDual) };
    } else if (device.formFactor === "clamshell") {
      traits = { ...(device.computeRank >= 2 ? DEVICE_TRAIT_BASES.midClamshell : DEVICE_TRAIT_BASES.retroClamshell) };
    } else if (device.formFactor === "vertical") {
      traits = { ...(device.computeRank >= 2 ? DEVICE_TRAIT_BASES.verticalAndroid : DEVICE_TRAIT_BASES.retroVertical) };
    } else if (familyText.includes("cube") || familyText.includes("rgb30")) {
      traits = { ...(device.computeRank >= 2 ? DEVICE_TRAIT_BASES.squareAndroid : DEVICE_TRAIT_BASES.retroSquare) };
    } else if (familyText.includes("x55")) {
      traits = { ...DEVICE_TRAIT_BASES.linuxLarge };
    } else if (device.computeRank >= 4) {
      traits = { ...DEVICE_TRAIT_BASES.premiumLarge };
    } else if (device.computeRank === 3) {
      traits = { ...DEVICE_TRAIT_BASES.largeAndroid };
    } else if (device.computeRank === 2) {
      traits = { ...DEVICE_TRAIT_BASES.midAndroid };
    } else {
      traits = { ...DEVICE_TRAIT_BASES.retroHorizontal };
    }

    if (familyText.includes("pocket 6") || familyText.includes("pocket 5") || familyText.includes("pocket ace")) {
      traits = { ...traits, ...DEVICE_TRAIT_BASES.premiumPocket };
    }

    if (familyText.includes("pocket classic")) {
      traits = { ...DEVICE_TRAIT_BASES.verticalAndroid };
    }

    if (familyText.includes("rg556") || familyText.includes("rg557")) {
      traits = { ...DEVICE_TRAIT_BASES.largeAndroid };
    }

    return traits;
  }

  function getHardwareSourceTrust(device) {
    if (!device) {
      return 0.55;
    }

    if (device.specConfidence === "profile") {
      return 0.55;
    }

    if (device.catalogSource === "official") {
      return 0.92;
    }

    if (device.catalogSource === "collected") {
      return 0.76;
    }

    return 0.98;
  }

  function getSourceFreshness(sourceCheckedOn, sourceTrust) {
    if (!sourceCheckedOn) {
      return sourceTrust >= 0.9 ? 0.72 : 0.56;
    }

    const parsed = Date.parse(sourceCheckedOn);
    if (!Number.isFinite(parsed)) {
      return sourceTrust >= 0.9 ? 0.72 : 0.56;
    }

    const ageDays = Math.max(0, (Date.now() - parsed) / 86400000);
    return RULES.clamp(1 - (ageDays / 540), 0.45, 1);
  }

  function getScreenSpecText(device) {
    return `${device && device.screenSpec ? device.screenSpec : ""}`.trim();
  }

  function getParsedScreenSizes(text) {
    return Array.from(String(text || "").matchAll(/(\d+(?:\.\d+)?)\s*(?:in|")/gi))
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0);
  }

  function getParsedPanelType(text) {
    if (/amoled/i.test(text)) {
      return "AMOLED";
    }

    if (/\boled\b/i.test(text)) {
      return "OLED";
    }

    if (/ltps/i.test(text)) {
      return "LTPS";
    }

    if (/ips/i.test(text)) {
      return "IPS";
    }

    return null;
  }

  function getParsedScreenResolution(text) {
    const explicitMatch = String(text || "").match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
    if (explicitMatch) {
      return {
        width: Number(explicitMatch[1]),
        height: Number(explicitMatch[2])
      };
    }

    if (/1440p/i.test(text)) {
      return { width: 2560, height: 1440 };
    }

    if (/1080p/i.test(text)) {
      return { width: 1920, height: 1080 };
    }

    if (/720p/i.test(text)) {
      return { width: 1280, height: 720 };
    }

    return null;
  }

  function getPrimaryScreenSize(device) {
    if (Number.isFinite(device.screenSizeInches) && device.screenSizeInches > 0) {
      return device.screenSizeInches;
    }

    const parsedSizes = getParsedScreenSizes(getScreenSpecText(device));
    return parsedSizes[0] || null;
  }

  function getSecondaryScreenSize(device) {
    if (Number.isFinite(device.secondaryScreenSizeInches) && device.secondaryScreenSizeInches > 0) {
      return device.secondaryScreenSizeInches;
    }

    const parsedSizes = getParsedScreenSizes(getScreenSpecText(device));
    return parsedSizes[1] || null;
  }

  function getPrimaryScreenResolution(device) {
    if (
      Number.isFinite(device.screenWidthPx) &&
      device.screenWidthPx > 0 &&
      Number.isFinite(device.screenHeightPx) &&
      device.screenHeightPx > 0
    ) {
      return {
        width: device.screenWidthPx,
        height: device.screenHeightPx
      };
    }

    return getParsedScreenResolution(getScreenSpecText(device));
  }

  function getPrimaryPanelType(device) {
    if (device.panelType) {
      return device.panelType;
    }

    return getParsedPanelType(getScreenSpecText(device));
  }

  function getDeviceAspectRatio(device) {
    const resolution = getPrimaryScreenResolution(device);
    if (!resolution) {
      return null;
    }

    const largerSide = Math.max(resolution.width, resolution.height);
    const smallerSide = Math.min(resolution.width, resolution.height);
    if (!Number.isFinite(largerSide) || !Number.isFinite(smallerSide) || smallerSide <= 0) {
      return null;
    }

    return largerSide / smallerSide;
  }

  function getAspectCloseness(ratio, target, range) {
    if (!Number.isFinite(ratio)) {
      return 0;
    }

    return RULES.clamp(1 - (Math.abs(ratio - target) / range), 0, 1);
  }

  function hasKnownBatteryCapacity(device) {
    return Boolean(
      device
      && (
        (Number.isFinite(device.batteryMah) && device.batteryMah > 0)
        || (Number.isFinite(device.batteryWh) && device.batteryWh > 0)
      )
    );
  }

  function getBatteryCapacityScore(device) {
    if (device && Number.isFinite(device.batteryMah) && device.batteryMah > 0) {
      return RULES.clamp(0.34 + ((device.batteryMah - 3000) / 6000), 0.32, 0.9);
    }

    if (device && Number.isFinite(device.batteryWh) && device.batteryWh > 0) {
      return RULES.clamp(0.34 + ((device.batteryWh - 20) / 60), 0.32, 0.9);
    }

    return null;
  }

  function getBatteryCapacityLabel(device) {
    if (device && Number.isFinite(device.batteryMah) && device.batteryMah > 0) {
      return `${Math.round(device.batteryMah)}mAh`;
    }

    if (device && Number.isFinite(device.batteryWh) && device.batteryWh > 0) {
      const formatted = Number.isInteger(device.batteryWh)
        ? `${Math.round(device.batteryWh)}`
        : `${device.batteryWh.toFixed(1).replace(/\\.0$/, "")}`;
      return `${formatted}Wh`;
    }

    return "";
  }

  function getExplicitHardwareFieldCount(device) {
    const screenSize = getPrimaryScreenSize(device);
    const screenResolution = getPrimaryScreenResolution(device);
    const panelType = getPrimaryPanelType(device);
    let count = 0;

    if (Number.isFinite(screenSize)) {
      count += 1;
    }

    if (screenResolution) {
      count += 1;
    }

    if (panelType) {
      count += 1;
    }

    if (device.dualScreen || Number.isFinite(getSecondaryScreenSize(device))) {
      count += 1;
    }

    if (hasKnownBatteryCapacity(device)) {
      count += 1;
    }

    if (Number.isFinite(device.weightGrams) && device.weightGrams > 0) {
      count += 1;
    }

    if (device.hallSticks === true || device.hallSticks === false) {
      count += 1;
    }

    if (device.analogTriggers === true || device.analogTriggers === false) {
      count += 1;
    }

    if (device.activeCooling === true || device.activeCooling === false || device.cooling) {
      count += 1;
    }

    if (device.osFamily) {
      count += 1;
    }

    if (Number.isFinite(device.osVersion)) {
      count += 1;
    }

    if (device.officialOta === true || device.officialOta === false) {
      count += 1;
    }

    if (device.touchscreen === true || device.touchscreen === false) {
      count += 1;
    }

    return count;
  }

  function getDeviceOsFamily(device) {
    if (device.osFamily) {
      return device.osFamily;
    }

    const compareClass = getComparisonClass(device);
    if (compareClass === "windows-handheld") {
      return "Windows";
    }

    if (compareClass === "linux-retro") {
      return "Linux";
    }

    if (compareClass === "cloud-streaming") {
      return "Android";
    }

    return null;
  }

  function getTouchscreenData(device) {
    if (device.touchscreen === true || device.touchscreen === false) {
      return {
        known: true,
        value: Boolean(device.touchscreen)
      };
    }

    const osFamily = getDeviceOsFamily(device);
    if (osFamily === "Windows") {
      return {
        known: true,
        value: true
      };
    }

    return {
      known: false,
      value: null
    };
  }

  function getHardwareDeviceTraitProfile(device) {
    if (!device) {
      return null;
    }

    const fieldCount = getExplicitHardwareFieldCount(device);
    if (fieldCount < 2) {
      return null;
    }

    const compareClass = getComparisonClass(device);
    const osFamily = getDeviceOsFamily(device);
    const touchData = getTouchscreenData(device);
    const screenSize = getPrimaryScreenSize(device);
    const secondaryScreenSize = getSecondaryScreenSize(device);
    const screenResolution = getPrimaryScreenResolution(device);
    const aspectRatio = getDeviceAspectRatio(device);
    const panelType = getPrimaryPanelType(device);
    const screenSizeScore = Number.isFinite(screenSize)
      ? RULES.clamp((screenSize - 3.5) / 3.5, 0, 1)
      : 0.42;
    const wideAspectScore = Number.isFinite(aspectRatio)
      ? getAspectCloseness(aspectRatio, 16 / 9, 0.75)
      : 0.42;
    const retroAspectScore = Number.isFinite(aspectRatio)
      ? Math.max(
        getAspectCloseness(aspectRatio, 4 / 3, 0.45),
        getAspectCloseness(aspectRatio, 1, 0.28) * 0.96,
        getAspectCloseness(aspectRatio, 3 / 2, 0.4) * 0.84
      )
      : 0.5;
    const panelBonus = panelType
      ? (/amoled|oled/i.test(panelType) ? 0.05 : /ltps/i.test(panelType) ? 0.04 : 0.02)
      : 0;
    const refreshBonus = Number.isFinite(device.refreshRateHz)
      ? (device.refreshRateHz >= 120 ? 0.08 : device.refreshRateHz >= 90 ? 0.05 : device.refreshRateHz >= 75 ? 0.03 : 0)
      : 0;
    const resolutionBonus = screenResolution
      ? (Math.max(screenResolution.width, screenResolution.height) >= 1600 ? 0.05 : Math.max(screenResolution.width, screenResolution.height) >= 1200 ? 0.03 : 0.02)
      : 0;
    const dualScreen = device.dualScreen || Number.isFinite(secondaryScreenSize) ? 1 : 0;
    const retroSizeScore = Number.isFinite(screenSize)
      ? (screenSize <= 3.6 ? 0.92 : screenSize <= 4.1 ? 1 : screenSize <= 4.8 ? 0.84 : screenSize <= 5.6 ? 0.64 : 0.4)
      : 0.72;
    let bigScreen = RULES.clamp((screenSizeScore * 0.62) + 0.26 + (wideAspectScore * 0.12) + panelBonus + refreshBonus + resolutionBonus, 0, 1);
    let retroScreen = RULES.clamp((retroAspectScore * 0.55) + (retroSizeScore * 0.35) + (panelBonus * 0.35) + (resolutionBonus * 0.5), 0, 1);
    let sticks = device.hallSticks
      ? 0.84
      : compareClass === "windows-handheld"
        ? 0.84
        : compareClass === "cloud-streaming"
          ? 0.78
          : (device.computeRank || 1) >= 3
            ? 0.72
            : (device.computeRank || 1) >= 2
              ? 0.62
              : 0.42;
    let dpad = 0.58;
    let portability = 0.62;
    let battery = 0.56;
    let software = compareClass === "windows-handheld"
      ? 0.78
      : compareClass === "cloud-streaming"
        ? 0.74
        : compareClass === "linux-retro"
          ? 0.62
          : 0.7;

    if (device.analogTriggers) {
      sticks += 0.08;
      dpad -= compareClass === "linux-retro" ? 0 : 0.04;
    }

    if (device.formFactor === "vertical") {
      sticks -= 0.24;
      dpad += 0.18;
      retroScreen += 0.04;
      bigScreen -= 0.04;
      portability += 0.06;
    } else if (device.formFactor === "clamshell") {
      sticks -= 0.14;
      dpad += 0.1;
      portability += 0.08;
    }

    if (dualScreen) {
      sticks -= 0.08;
      bigScreen += 0.06;
      retroScreen = Math.max(retroScreen, 0.48);
    }

    if (device.useCaseLane === "retro-focused") {
      sticks -= 0.1;
      dpad += 0.12;
    }

    if (compareClass === "linux-retro") {
      sticks -= 0.06;
      dpad += 0.14;
    }

    if (compareClass === "windows-handheld") {
      portability -= 0.1;
    } else if (compareClass === "cloud-streaming") {
      portability -= 0.02;
    }

    if (Number.isFinite(screenSize)) {
      const sizePortability = RULES.clamp(1 - ((screenSize - 3.5) / 3.8), 0.45, 1);
      portability = (portability * 0.35) + (sizePortability * 0.65);
    }

    if (Number.isFinite(device.weightGrams) && device.weightGrams > 0) {
      const weightPortability = RULES.clamp(1 - ((device.weightGrams - 180) / 340), 0.35, 1);
      portability = (portability * 0.55) + (weightPortability * 0.45);
    }

    const batteryCapacityScore = getBatteryCapacityScore(device);
    if (batteryCapacityScore !== null) {
      battery = batteryCapacityScore;
    }

    if (compareClass === "linux-retro" || osFamily === "Linux" || osFamily === "SteamOS") {
      battery += 0.18;
    } else if (compareClass === "cloud-streaming") {
      battery += 0.14;
    } else if (compareClass === "windows-handheld") {
      battery -= 0.16;
    }

    if ((device.computeRank || 1) <= 1) {
      battery += 0.08;
    } else if ((device.computeRank || 1) >= 4) {
      battery -= 0.05;
    }

    if (device.activeCooling) {
      battery -= 0.03;
      software += 0.03;
    }

    if (Number.isFinite(screenSize) && screenSize >= 6.5) {
      battery -= 0.03;
    }

    if (device.officialOta === true) {
      software += 0.12;
    } else if (device.officialOta === false) {
      software -= 0.05;
    }

    if (Number.isFinite(device.osVersion)) {
      if (device.osVersion >= 15) {
        software += 0.08;
      } else if (device.osVersion >= 14) {
        software += 0.06;
      } else if (device.osVersion >= 13) {
        software += 0.04;
      } else if (device.osVersion >= 11) {
        software += 0.02;
      } else {
        software -= 0.03;
      }
    }

    const sourceTrust = getHardwareSourceTrust(device);
    const sourceFreshness = getSourceFreshness(device.sourceCheckedOn, sourceTrust);
    if (sourceTrust < 0.7) {
      software -= 0.08;
    }

    if (sourceFreshness < 0.7) {
      software -= 0.05;
    }

    const hardwareCoverage = RULES.clamp(fieldCount / 10, 0, 1);
    return {
      bigScreen: RULES.clamp(bigScreen, 0, 1),
      retroScreen: RULES.clamp(retroScreen, 0, 1),
      dualScreen: RULES.clamp(dualScreen, 0, 1),
      sticks: RULES.clamp(sticks, 0, 1),
      dpad: RULES.clamp(dpad, 0, 1),
      portability: RULES.clamp(portability, 0, 1),
      battery: RULES.clamp(battery, 0, 1),
      software: RULES.clamp(software, 0, 1),
      touch: touchData.value,
      touchKnown: touchData.known,
      hardwareFieldCount: fieldCount,
      hardwareCoverage,
      sourceTrust,
      sourceFreshness,
      hardwareBlend: RULES.clamp(hardwareCoverage * sourceTrust, 0, 1),
      sourceCheckedOn: device.sourceCheckedOn || null
    };
  }

  function blendTraitValue(baseValue, nextValue, mix) {
    if (!Number.isFinite(nextValue)) {
      return baseValue;
    }

    if (!Number.isFinite(baseValue)) {
      return nextValue;
    }

    return (baseValue * (1 - mix)) + (nextValue * mix);
  }

  function getDeviceTraitProfile(device) {
    if (!device) {
      return null;
    }

    const heuristicTraits = getHeuristicDeviceTraitProfile(device);
    const hardwareTraits = getHardwareDeviceTraitProfile(device);
    const traits = { ...heuristicTraits };

    if (hardwareTraits) {
      const mix = hardwareTraits.hardwareBlend;
      ["bigScreen", "retroScreen", "dualScreen", "sticks", "dpad", "portability", "battery", "software"].forEach((key) => {
        traits[key] = blendTraitValue(heuristicTraits[key], hardwareTraits[key], mix);
      });

      if (hardwareTraits.touchKnown) {
        traits.touch = hardwareTraits.touch;
      }
    }

    Object.assign(traits, DEVICE_TRAIT_OVERRIDES[device.id] || {});

    return {
      ...traits,
      profileLabel: traits.profileLabel || traits.label,
      touch: Boolean(traits.touch),
      hardwareCoverage: hardwareTraits ? hardwareTraits.hardwareCoverage : 0,
      hardwareFieldCount: hardwareTraits ? hardwareTraits.hardwareFieldCount : 0,
      sourceTrust: hardwareTraits ? hardwareTraits.sourceTrust : getHardwareSourceTrust(device),
      sourceFreshness: hardwareTraits ? hardwareTraits.sourceFreshness : getSourceFreshness(device.sourceCheckedOn, getHardwareSourceTrust(device)),
      hardwareBlend: hardwareTraits ? hardwareTraits.hardwareBlend : 0,
      sourceCheckedOn: hardwareTraits ? hardwareTraits.sourceCheckedOn : (device.sourceCheckedOn || null)
    };
  }

  function formatDecimalValue(value) {
    if (!Number.isFinite(value)) {
      return "";
    }

    return String(Math.round(value * 100) / 100)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*[1-9])0+$/, "$1");
  }

  function getAspectRatioLabel(aspectRatio) {
    if (!Number.isFinite(aspectRatio)) {
      return null;
    }

    if (Math.abs(aspectRatio - 1) <= 0.08) {
      return "1:1";
    }

    if (aspectRatio < 1.22) {
      return "near square";
    }

    const knownRatios = [
      { ratio: 5 / 4, label: "5:4" },
      { ratio: 4 / 3, label: "4:3" },
      { ratio: 3 / 2, label: "3:2" },
      { ratio: 16 / 10, label: "16:10" },
      { ratio: 16 / 9, label: "16:9" }
    ];
    const closest = knownRatios.reduce((best, candidate) => {
      const distance = Math.abs(aspectRatio - candidate.ratio);
      if (!best || distance < best.distance) {
        return {
          label: candidate.label,
          distance
        };
      }

      return best;
    }, null);

    return closest ? closest.label : null;
  }

  function getPrimaryScreenSummary(device) {
    if (!device) {
      return null;
    }

    const secondaryScreenSize = getSecondaryScreenSize(device);
    const dualScreen = device.dualScreen || Number.isFinite(secondaryScreenSize);
    const screenSize = getPrimaryScreenSize(device);
    const panelType = getPrimaryPanelType(device);
    const aspectLabel = getAspectRatioLabel(getDeviceAspectRatio(device));

    if (dualScreen) {
      return panelType ? `Dual ${panelType}` : "Dual screen";
    }

    const parts = [];
    if (Number.isFinite(screenSize)) {
      parts.push(`${formatDecimalValue(screenSize)}in`);
    }

    if (panelType) {
      parts.push(panelType);
    }

    if (aspectLabel) {
      parts.push(aspectLabel);
    }

    if (parts.length) {
      return parts.join(" ");
    }

    return device.screenSpec || null;
  }

  function getSoftwareSummary(device) {
    if (!device) {
      return null;
    }

    const osFamily = getDeviceOsFamily(device);
    if (!osFamily) {
      return null;
    }

    if (osFamily === "Android") {
      if (Number.isFinite(device.osVersion) && device.officialOta === true) {
        return `Android ${device.osVersion} OTA`;
      }

      if (Number.isFinite(device.osVersion)) {
        return `Android ${device.osVersion}`;
      }

      return device.officialOta === true ? "Android OTA" : "Android";
    }

    if (osFamily === "Linux") {
      return device.officialOta === false ? "Linux community" : "Linux";
    }

    if (osFamily === "Windows") {
      return "Windows";
    }

    return osFamily;
  }

  function getSystemCompatibilityProfile(systemId) {
    return SYSTEM_COMPATIBILITY_PROFILES[systemId] || SYSTEM_COMPATIBILITY_PROFILES.default;
  }

  function getWideScreenFitRatio(device, traits) {
    const aspectRatio = getDeviceAspectRatio(device);
    const screenSize = getPrimaryScreenSize(device);
    const aspectFit = Number.isFinite(aspectRatio)
      ? Math.max(
        getAspectCloseness(aspectRatio, 16 / 9, 0.75),
        getAspectCloseness(aspectRatio, 16 / 10, 0.5) * 0.94
      )
      : RULES.clamp((traits.bigScreen * 0.72) + ((1 - traits.retroScreen) * 0.28), 0, 1);
    const sizeFit = Number.isFinite(screenSize)
      ? RULES.clamp((screenSize - 4) / 2.5, 0.35, 1)
      : traits.bigScreen;

    return RULES.clamp((aspectFit * 0.58) + (sizeFit * 0.42), 0, 1);
  }

  function getRetroScreenFitRatio(device, traits) {
    const aspectRatio = getDeviceAspectRatio(device);
    const screenSize = getPrimaryScreenSize(device);
    const aspectFit = Number.isFinite(aspectRatio)
      ? Math.max(
        getAspectCloseness(aspectRatio, 4 / 3, 0.45),
        getAspectCloseness(aspectRatio, 1, 0.28) * 0.96,
        getAspectCloseness(aspectRatio, 3 / 2, 0.4) * 0.84
      )
      : traits.retroScreen;
    const sizeFit = Number.isFinite(screenSize)
      ? (screenSize <= 4.1 ? 1 : screenSize <= 4.8 ? 0.84 : screenSize <= 5.6 ? 0.64 : 0.42)
      : traits.retroScreen;

    return RULES.clamp((aspectFit * 0.7) + (sizeFit * 0.3), 0, 1);
  }

  function getDualScreenFitRatio(device, traits) {
    if (device.dualScreen) {
      return 1;
    }

    const touchData = getTouchscreenData(device);
    const screenSize = getPrimaryScreenSize(device);
    const largeTouchScore = touchData.value
      ? Number.isFinite(screenSize)
        ? RULES.clamp(0.34 + ((screenSize - 4) / 3), 0.42, 0.8)
        : 0.58
      : 0.16;

    return RULES.clamp(Math.max(traits.dualScreen * 0.72, largeTouchScore), 0, 1);
  }

  function getStickControlFitRatio(device, traits, analogNeed = false) {
    let value = traits.sticks;

    if (device.hallSticks) {
      value += 0.05;
    }

    if (device.analogTriggers) {
      value += analogNeed ? 0.1 : 0.05;
    } else if (analogNeed) {
      value -= 0.14;
    }

    if (device.formFactor === "vertical") {
      value -= 0.08;
    }

    return RULES.clamp(value, 0, 1);
  }

  function getDpadControlFitRatio(device, traits) {
    let value = traits.dpad;

    if (device.formFactor === "vertical") {
      value += 0.04;
    }

    return RULES.clamp(value, 0, 1);
  }

  function getSystemScreenCompatibilityRatio(device, traits, profile) {
    if (profile.screenTarget === "retro") {
      return getRetroScreenFitRatio(device, traits);
    }

    if (profile.screenTarget === "retro-balanced") {
      return RULES.clamp((getRetroScreenFitRatio(device, traits) * 0.62) + (getWideScreenFitRatio(device, traits) * 0.38), 0, 1);
    }

    if (profile.screenTarget === "wide") {
      return getWideScreenFitRatio(device, traits);
    }

    if (profile.screenTarget === "wide-large") {
      return RULES.clamp((getWideScreenFitRatio(device, traits) * 0.72) + (traits.bigScreen * 0.28), 0, 1);
    }

    if (profile.screenTarget === "dual") {
      return getDualScreenFitRatio(device, traits);
    }

    if (profile.screenTarget === "dual-large") {
      return RULES.clamp((getDualScreenFitRatio(device, traits) * 0.78) + (traits.bigScreen * 0.22), 0, 1);
    }

    return RULES.clamp(((traits.bigScreen + traits.retroScreen) / 2) * 0.84 + (getWideScreenFitRatio(device, traits) * 0.08) + (getRetroScreenFitRatio(device, traits) * 0.08), 0, 1);
  }

  function getSystemControlCompatibilityRatio(device, traits, profile) {
    if (profile.controlTarget === "dpad") {
      return getDpadControlFitRatio(device, traits);
    }

    if (profile.controlTarget === "stick") {
      return getStickControlFitRatio(device, traits, profile.analogNeed);
    }

    if (profile.controlTarget === "dpad-balanced") {
      return RULES.clamp((getDpadControlFitRatio(device, traits) * 0.56) + (getStickControlFitRatio(device, traits, profile.analogNeed) * 0.44), 0, 1);
    }

    return RULES.clamp((getStickControlFitRatio(device, traits, profile.analogNeed) * 0.56) + (getDpadControlFitRatio(device, traits) * 0.44), 0, 1);
  }

  function getSystemTouchCompatibilityRatio(device, profile) {
    const touchData = getTouchscreenData(device);

    if (profile.touchNeed === "required") {
      return touchData.value ? 1 : 0.12;
    }

    if (profile.touchNeed === "prefer") {
      return touchData.value ? 1 : 0.58;
    }

    if (touchData.known && !touchData.value) {
      return 1;
    }

    return touchData.value ? 0.88 : 0.94;
  }

  function getSystemFormFactorCompatibilityRatio(device, profile) {
    if (!profile.formFactorNeed) {
      return 1;
    }

    const dualScreen = Boolean(device.dualScreen || Number.isFinite(getSecondaryScreenSize(device)));
    const clamshell = device.formFactor === "clamshell";
    const touchData = getTouchscreenData(device);
    const primaryScreenSize = getPrimaryScreenSize(device);
    const largeTouchScreen = touchData.value && Number.isFinite(primaryScreenSize) && primaryScreenSize >= 6;

    if (profile.formFactorNeed === "clamshell-prefer") {
      if (dualScreen && clamshell) {
        return 1;
      }

      if (dualScreen) {
        return 0.88;
      }

      if (clamshell) {
        return 0.62;
      }

      if (largeTouchScreen) {
        return 0.42;
      }

      return touchData.value ? 0.32 : 0.2;
    }

    if (profile.formFactorNeed === "clamshell-strong") {
      if (dualScreen && clamshell) {
        return 1;
      }

      if (dualScreen) {
        return 0.8;
      }

      if (clamshell) {
        return 0.56;
      }

      if (largeTouchScreen) {
        return 0.32;
      }

      return touchData.value ? 0.24 : 0.14;
    }

    return 1;
  }

  function getSystemSoftwareCompatibilityRatio(traits, profile) {
    return RULES.clamp(1 - (Math.max(0, profile.softwareNeed - traits.software) * 1.45), 0.12, 1);
  }

  function getCompatibilityEntryWeight(entry) {
    const countWeight = RULES.libraryScale(entry.effectiveCount || entry.count || 1);
    return countWeight * Math.max(0.75, entry.performanceWeight || 1);
  }

  function getSystemCompatibilityDetails(device, entry) {
    const traits = getDeviceTraitProfile(device);
    const profile = getSystemCompatibilityProfile(entry.id);
    const screenRatio = getSystemScreenCompatibilityRatio(device, traits, profile);
    const controlsRatio = getSystemControlCompatibilityRatio(device, traits, profile);
    const touchRatio = getSystemTouchCompatibilityRatio(device, profile);
    const formFactorRatio = getSystemFormFactorCompatibilityRatio(device, profile);
    const softwareRatio = getSystemSoftwareCompatibilityRatio(traits, profile);
    const portabilityRatio = getScalarFitRatio(traits.portability, profile.portabilityTarget);
    const ratio = profile.formFactorNeed
      ? RULES.clamp(
        (screenRatio * 0.24)
        + (controlsRatio * 0.22)
        + (softwareRatio * 0.18)
        + (touchRatio * 0.08)
        + (portabilityRatio * 0.08)
        + (formFactorRatio * 0.2),
        0,
        1
      )
      : RULES.clamp(
        (screenRatio * 0.3)
        + (controlsRatio * 0.28)
        + (softwareRatio * 0.24)
        + (touchRatio * 0.08)
        + (portabilityRatio * 0.1),
        0,
        1
      );

    return {
      id: entry.id,
      name: entry.name,
      screenRatio,
      controlsRatio,
      touchRatio,
      formFactorRatio,
      softwareRatio,
      portabilityRatio,
      ratio,
      weight: getCompatibilityEntryWeight(entry),
      formFactorRelevant: Boolean(profile.formFactorNeed)
    };
  }

  function getLibraryCompatibilitySummary(device, breakdown) {
    if (!device || !breakdown.length) {
      return {
        ratio: 1,
        entries: [],
        strongest: [],
        weakest: []
      };
    }

    const entries = breakdown.map((entry) => getSystemCompatibilityDetails(device, entry));
    const totalWeight = entries.reduce((total, entry) => total + entry.weight, 0);
    const ratio = totalWeight
      ? entries.reduce((total, entry) => total + (entry.ratio * entry.weight), 0) / totalWeight
      : 1;
    const importanceSort = (left, right) => {
      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }

      return right.ratio - left.ratio;
    };

    return {
      ratio: RULES.clamp(ratio, 0, 1),
      entries,
      strongest: [...entries]
        .filter((entry) => entry.ratio >= 0.76)
        .sort((left, right) => {
          if (right.ratio !== left.ratio) {
            return right.ratio - left.ratio;
          }

          return importanceSort(left, right);
        })
        .slice(0, 2),
      weakest: [...entries]
        .filter((entry) => entry.ratio <= 0.62)
        .sort((left, right) => {
          if (left.ratio !== right.ratio) {
            return left.ratio - right.ratio;
          }

          return importanceSort(left, right);
        })
        .slice(0, 2)
    };
  }

  function getLibraryFormFactorSummary(compatibility) {
    if (!compatibility || !compatibility.entries || !compatibility.entries.length) {
      return null;
    }

    const relevantEntries = compatibility.entries.filter((entry) => entry.formFactorRelevant);
    if (!relevantEntries.length) {
      return null;
    }

    const totalWeight = relevantEntries.reduce((total, entry) => total + entry.weight, 0);
    const ratio = totalWeight
      ? relevantEntries.reduce((total, entry) => total + (entry.formFactorRatio * entry.weight), 0) / totalWeight
      : 1;

    return {
      ratio: RULES.clamp(ratio, 0, 1),
      entries: relevantEntries
    };
  }

  function buildCompatibilityStrengthLine(compatibility) {
    if (!compatibility || compatibility.ratio < 0.76 || !compatibility.strongest.length) {
      return "";
    }

    if (compatibility.strongest.some((entry) => entry.formFactorRelevant)) {
      return `${formatJoinedList(compatibility.strongest.map((entry) => entry.name))} line up especially well with this screen, control, form factor, and software setup.`;
    }

    return `${formatJoinedList(compatibility.strongest.map((entry) => entry.name))} line up especially well with this screen, control, and software setup.`;
  }

  function buildCompatibilityCautionLine(compatibility) {
    if (!compatibility || compatibility.ratio > 0.68 || !compatibility.weakest.length) {
      return "";
    }

    const weakestNames = formatJoinedList(compatibility.weakest.map((entry) => entry.name));
    if (compatibility.weakest.some((entry) => entry.id === "ds" || entry.id === "3ds")) {
      return `${weakestNames} fit less naturally here because dual screen, clamshell form factor, and touch layout matter more.`;
    }

    return `${weakestNames} fit less cleanly here once screen shape, controls, and software overhead are counted.`;
  }

  function normalizeRatio(value, fallback = 0.72) {
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return RULES.clamp(value, 0, 1);
  }

  function getScreenFitRatio(traits, accuracy) {
    const weights = {
      big: Math.max(0.12, accuracy.targets.screenBig),
      retro: Math.max(0.12, accuracy.targets.screenRetro),
      dual: Math.max(0.08, accuracy.targets.dualScreen)
    };
    const totalWeight = weights.big + weights.retro + weights.dual;
    return normalizeRatio(
      ((traits.bigScreen * weights.big) + (traits.retroScreen * weights.retro) + (traits.dualScreen * weights.dual)) / totalWeight
    );
  }

  function getControlFitRatio(traits, accuracy) {
    const stickWeight = Math.max(0.15, accuracy.targets.sticks);
    const dpadWeight = Math.max(0.15, accuracy.targets.dpad);
    return normalizeRatio(
      ((traits.sticks * stickWeight) + (traits.dpad * dpadWeight)) / (stickWeight + dpadWeight)
    );
  }

  function getScalarFitRatio(actual, target) {
    return normalizeRatio(1 - Math.abs(actual - target));
  }

  function getTouchFitRatio(traits, accuracy) {
    if (state.touchPreference === "required") {
      return traits.touch ? 1 : 0;
    }

    if (state.touchPreference === "avoid") {
      return traits.touch ? 0.35 : 1;
    }

    if (accuracy.targets.touch >= 0.52) {
      return traits.touch ? 1 : 0.28;
    }

    return traits.touch ? 0.9 : 0.78;
  }

  function getExperienceFitBreakdown(device, accuracy) {
    const traits = getDeviceTraitProfile(device);
    const screenRatio = getScreenFitRatio(traits, accuracy);
    const controlsRatio = getControlFitRatio(traits, accuracy);
    const portabilityRatio = getScalarFitRatio(traits.portability, accuracy.targets.portability);
    const batteryRatio = getScalarFitRatio(traits.battery, accuracy.targets.battery);
    const softwareRatio = getScalarFitRatio(traits.software, accuracy.targets.software);
    const touchRatio = getTouchFitRatio(traits, accuracy);
    const screen = screenRatio * EXPERIENCE_SCORE_WEIGHTS.screen;
    const controls = controlsRatio * EXPERIENCE_SCORE_WEIGHTS.controls;
    const portability = portabilityRatio * EXPERIENCE_SCORE_WEIGHTS.portability;
    const battery = batteryRatio * EXPERIENCE_SCORE_WEIGHTS.battery;
    const software = softwareRatio * EXPERIENCE_SCORE_WEIGHTS.software;
    const touch = touchRatio * EXPERIENCE_SCORE_WEIGHTS.touch;

    return {
      traits,
      screen,
      controls,
      portability,
      battery,
      software,
      touch,
      total: screen + controls + portability + battery + software + touch
    };
  }

  function buildExperienceNotes(breakdown) {
    const positives = [];
    const cautions = [];

    if (breakdown.screen >= EXPERIENCE_SCORE_WEIGHTS.screen * 0.78) {
      positives.push("Screen shape lines up well with your selected library.");
    } else if (breakdown.screen <= EXPERIENCE_SCORE_WEIGHTS.screen * 0.42) {
      cautions.push("Screen fit is only average for the way you plan to use it.");
    }

    if (breakdown.controls >= EXPERIENCE_SCORE_WEIGHTS.controls * 0.76) {
      positives.push("Control layout matches the way you said you play.");
    } else if (breakdown.controls <= EXPERIENCE_SCORE_WEIGHTS.controls * 0.42) {
      cautions.push("Control layout is a weaker match for your stated play style.");
    }

    if (breakdown.portability >= EXPERIENCE_SCORE_WEIGHTS.portability * 0.74) {
      positives.push("Portability lines up well with how much carry weight you want.");
    } else if (breakdown.portability <= EXPERIENCE_SCORE_WEIGHTS.portability * 0.38) {
      cautions.push("Size or carry weight may feel off for your portability preference.");
    }

    if (breakdown.software <= EXPERIENCE_SCORE_WEIGHTS.software * 0.38) {
      cautions.push("Software maturity is a weaker fit for the tolerance you picked.");
    }

    if (breakdown.touch <= EXPERIENCE_SCORE_WEIGHTS.touch * 0.35) {
      cautions.push("Touch support does not line up cleanly with your touchscreen preference.");
    }

    return {
      positives: positives.slice(0, 2),
      cautions: cautions.slice(0, 2)
    };
  }

  function buildConfidenceLabel(score) {
    if (score >= 86) {
      return "High confidence";
    }

    if (score >= 72) {
      return "Good confidence";
    }

    if (score >= 58) {
      return "Mixed confidence";
    }

    return "Limited confidence";
  }

  function analyzeRecommendationConfidence(breakdown, recommendedCandidate, accuracy, currentDevice) {
    let score = 88;
    const notes = [];
    const experimentalIds = new Set(["xbox", "ps3", "switch", "wii-u"]);
    const highFrictionIds = new Set(["3ds", "vita", "android", "pc", "saturn", "dreamcast", "arcade"]);
    const experimentalSystems = breakdown.filter((entry) => experimentalIds.has(entry.id));
    const highFrictionSystems = breakdown.filter((entry) => highFrictionIds.has(entry.id));
    const recommendedTraits = recommendedCandidate ? getDeviceTraitProfile(recommendedCandidate.device) : null;
    const recommendedCompatibility = recommendedCandidate ? recommendedCandidate.compatibility : null;
    const currentTraits = currentDevice ? getDeviceTraitProfile(currentDevice) : null;

    if (experimentalSystems.length) {
      score -= 18 + (experimentalSystems.length * 4);
      notes.push(`${formatJoinedList(experimentalSystems.map((entry) => entry.name))} still carry lower confidence than older emulation targets.`);
    }

    if (highFrictionSystems.length >= 2) {
      score -= 6;
      notes.push(`${formatJoinedList(highFrictionSystems.map((entry) => entry.name))} add extra emulator and software variability.`);
    }

    if (breakdown.length >= 6) {
      score -= 4;
      notes.push("Large mixed libraries are harder to fit perfectly with one device.");
    }

    if (state.softwarePreference === "stable" && accuracy.targets.software >= 0.7) {
      score -= 3;
    }

    if (currentDevice && !currentDevice.inLivePool) {
      score -= 4;
      notes.push(currentDevice.specConfidence === "profile"
        ? "Current device comparison still uses a collected profile because that device is outside the live pool."
        : "Current device comparison uses collected sheet data because that device is outside the live pool.");
    }

    if (!experimentalSystems.length && breakdown.length <= 3) {
      score += 3;
    }

    if (recommendedTraits && recommendedTraits.software >= 0.78 && accuracy.targets.software >= 0.62) {
      score += 2;
    }

    if (recommendedTraits && recommendedTraits.hardwareCoverage >= 0.72 && recommendedTraits.sourceTrust >= 0.9 && recommendedTraits.sourceFreshness >= 0.9) {
      score += 3;
    } else if (recommendedTraits && recommendedTraits.hardwareCoverage < 0.42) {
      score -= 6;
      notes.push(`${recommendedCandidate.device.name} still uses lighter hardware detail than the newest catalog entries.`);
    }

    if (recommendedTraits && recommendedTraits.sourceFreshness < 0.75) {
      score -= 3;
      notes.push(`${recommendedCandidate.device.name} uses older checked data than the newest refreshed listings.`);
    }

    if (recommendedCompatibility && recommendedCompatibility.ratio >= 0.82) {
      score += 2;
    } else if (recommendedCompatibility && recommendedCompatibility.ratio < 0.62) {
      score -= 6;
      if (recommendedCompatibility.weakest.length) {
        notes.push(`${formatJoinedList(recommendedCompatibility.weakest.map((entry) => entry.name))} fit less cleanly on this handheld than the rest of your mix.`);
      }
    }

    if (currentTraits && currentTraits.hardwareCoverage < 0.35) {
      score -= 2;
    }

    score = RULES.clamp(score - (accuracy.confidenceRisk * 10), 40, 96);

    return {
      score,
      label: buildConfidenceLabel(score),
      notes: notes.slice(0, 3),
      summary: notes[0] || "Inputs line up well with the current live pool, so confidence stays solid for this result."
    };
  }

  function analyzeCompareConfidence(leftDevice, rightDevice, differentLane) {
    let score = 92;
    const notes = [];
    const leftTraits = getDeviceTraitProfile(leftDevice);
    const rightTraits = getDeviceTraitProfile(rightDevice);

    if (!leftDevice.inLivePool) {
      score -= 10;
      notes.push(leftDevice.specConfidence === "profile"
        ? `${leftDevice.name} is outside the live pool and uses a collected profile estimate.`
        : `${leftDevice.name} is outside the live pool and uses collected sheet data.`);
    }

    if (!rightDevice.inLivePool) {
      score -= 10;
      notes.push(rightDevice.specConfidence === "profile"
        ? `${rightDevice.name} is outside the live pool and uses a collected profile estimate.`
        : `${rightDevice.name} is outside the live pool and uses collected sheet data.`);
    }

    if (differentLane) {
      score -= 8;
      notes.push("These devices sit in different handheld lanes, so the compare is directional.");
    }

    if (leftTraits && leftTraits.hardwareCoverage < 0.42) {
      score -= 5;
      notes.push(`${leftDevice.name} still uses lighter hardware detail than the newest catalog entries.`);
    }

    if (rightTraits && rightTraits.hardwareCoverage < 0.42) {
      score -= 5;
      notes.push(`${rightDevice.name} still uses lighter hardware detail than the newest catalog entries.`);
    }

    if (leftTraits && leftTraits.sourceFreshness < 0.75) {
      score -= 2;
    }

    if (rightTraits && rightTraits.sourceFreshness < 0.75) {
      score -= 2;
    }

    return {
      score: RULES.clamp(score, 48, 96),
      label: buildConfidenceLabel(RULES.clamp(score, 48, 96)),
      notes: notes.slice(0, 3),
      summary: notes[0] || "Both devices map cleanly enough for a direct compare."
    };
  }

  function formatDeviceExperienceLabel(device) {
    const traits = getDeviceTraitProfile(device);
    return traits ? traits.profileLabel : "Estimated profile";
  }

  function formatDeviceScreenLabel(device) {
    const screenSummary = getPrimaryScreenSummary(device);
    if (screenSummary) {
      return screenSummary;
    }

    const traits = getDeviceTraitProfile(device);
    if (!traits) {
      return "Unknown";
    }

    if (traits.dualScreen >= 0.8) {
      return "Dual screen";
    }

    if (traits.bigScreen >= 0.8) {
      return "Large screen";
    }

    if (traits.retroScreen >= 0.86) {
      return "Retro tuned";
    }

    return "Balanced screen";
  }

  function formatDeviceControlLabel(device) {
    if (device.hallSticks && device.analogTriggers) {
      return "Hall sticks + analog";
    }

    if (device.hallSticks) {
      return "Hall sticks";
    }

    if (device.analogTriggers && getComparisonClass(device) === "cloud-streaming") {
      return "Streaming controls";
    }

    const traits = getDeviceTraitProfile(device);
    if (!traits) {
      return "Unknown";
    }

    if (traits.sticks - traits.dpad >= 0.16) {
      return "Stick leaning";
    }

    if (traits.dpad - traits.sticks >= 0.16) {
      return "D-pad leaning";
    }

    return "Balanced controls";
  }

  function formatDeviceSoftwareLabel(device) {
    const softwareSummary = getSoftwareSummary(device);
    if (softwareSummary) {
      return softwareSummary;
    }

    const traits = getDeviceTraitProfile(device);
    if (!traits) {
      return "Estimated";
    }

    if (traits.software >= 0.8) {
      return "Stable profile";
    }

    if (traits.software >= 0.68) {
      return "Good profile";
    }

    return "More variable";
  }

  function renderDeviceFeatureChips(device, limit = 3) {
    const chips = [];
    const pushChip = (value) => {
      if (value && !chips.includes(value)) {
        chips.push(value);
      }
    };

    if (device.chipset) {
      pushChip(device.chipset);
    }

    const screenSummary = getPrimaryScreenSummary(device);
    if (screenSummary) {
      pushChip(screenSummary);
    } else if (device.screenSpec) {
      pushChip(device.screenSpec);
    }

    const batteryLabel = getBatteryCapacityLabel(device);
    if (batteryLabel) {
      pushChip(batteryLabel);
    }

    if (device.hallSticks) {
      pushChip("Hall sticks");
    }

    if (device.activeCooling) {
      pushChip("Active cooling");
    } else if (device.cooling) {
      pushChip(device.cooling);
    }

    const softwareSummary = getSoftwareSummary(device);
    if (softwareSummary) {
      pushChip(softwareSummary);
    }

    if (!chips.length) {
      return "";
    }

    return chips
      .slice(0, limit)
      .map((chip) => `<span class="story-chip">${escapeHtml(chip)}</span>`)
      .join("");
  }

  function getDeviceYear(device) {
    if (!device) {
      return null;
    }

    if (Number.isFinite(device.releaseYear)) {
      return Math.round(device.releaseYear);
    }

    const explicitYearMatch = `${device.name || ""} ${device.family || ""}`.match(/\b(20\d{2})\b/);
    if (explicitYearMatch) {
      return Number(explicitYearMatch[1]);
    }

    return DEVICE_YEAR_OVERRIDES[device.id] || null;
  }

  function formatDeviceDisplayName(device) {
    if (!device) {
      return "";
    }

    const baseName = device.name || "";
    const year = getDeviceYear(device);
    if (!year || /\b(20\d{2})\b/.test(baseName)) {
      return baseName;
    }

    const trailingTagMatch = baseName.match(/\(([^()]*)\)\s*$/);
    if (trailingTagMatch) {
      return baseName.replace(/\(([^()]*)\)\s*$/, `($1, ${year})`);
    }

    return `${baseName} (${year})`;
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
      mode: state.mode,
      ownsDevice: state.ownsDevice,
      currentBrand: state.currentBrand,
      currentDeviceId: state.currentDeviceId,
      compareLeftBrand: state.compareLeftBrand,
      compareLeftDeviceId: state.compareLeftDeviceId,
      compareRightBrand: state.compareRightBrand,
      compareRightDeviceId: state.compareRightDeviceId,
      useCaseLane: state.useCaseLane,
      brandPreference: state.brandPreference,
      formFactor: state.formFactor,
      sessionStyle: state.sessionStyle,
      portabilityPriority: state.portabilityPriority,
      screenPriority: state.screenPriority,
      controlPriority: state.controlPriority,
      softwarePreference: state.softwarePreference,
      touchPreference: state.touchPreference,
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
- ${FIT_SCORE_WEIGHTS.performance}% = raw power floor plus per system compatibility
- ${FIT_SCORE_WEIGHTS.ram}% = enough RAM (smooth multitasking)
- ${FIT_SCORE_WEIGHTS.storage}% = enough storage (space + speed)
- ${FIT_SCORE_WEIGHTS.value}% = price vs what you get
- ${FIT_SCORE_WEIGHTS.preference}% = preferences after lane filtering (brand first, then form factor)
- ${FIT_SCORE_WEIGHTS.experience}% = screen fit, controls, portability, battery, software, and touch fit

Score Guideline
- 90-100 = amazing
- 75-89 = good
- 60-74 = okay
- below 60 = bad

This is based on your Games selected and not neccasarily highest system.
Low End Retro uses lighter RAM and storage checks when the selected systems stay in that lane.
System compatibility now also checks things like screen shape, controls, touch needs, and software overhead for the systems you picked.`;
  }

  function buildFitScoreBreakdownInfo(scoreBreakdown) {
    return `Performance Score Breakdown

- System Fit = ${scoreBreakdown.performance}/${FIT_SCORE_WEIGHTS.performance}
- Raw power floor = ${Math.round(scoreBreakdown.performanceBase * 10) / 10}/${FIT_SCORE_WEIGHTS.performance}
- Per system compatibility = ${Math.round(scoreBreakdown.performanceCompatibility * 10) / 10}/${FIT_SCORE_WEIGHTS.performance}
- RAM = ${scoreBreakdown.ram}/${FIT_SCORE_WEIGHTS.ram}
- Storage = ${scoreBreakdown.storage}/${FIT_SCORE_WEIGHTS.storage}
- Price vs Value = ${scoreBreakdown.value}/${FIT_SCORE_WEIGHTS.value}
- Preferences = ${scoreBreakdown.preference}/${FIT_SCORE_WEIGHTS.preference}
- Experience = ${scoreBreakdown.experience}/${FIT_SCORE_WEIGHTS.experience}

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
    if (analysis.mode === "compated") {
      const lines = [
        "Which Handheld Should I Buy?",
        "",
        "Compare Devices",
        `Headline: ${analysis.headline}`,
        `Verdict: ${analysis.verdict}`,
        `Confidence: ${analysis.confidence.label}`,
        `Left Device: ${analysis.leftDevice.name}`,
        `Right Device: ${analysis.rightDevice.name}`,
        ""
      ];

      lines.push("Paper Specs");
      analysis.metrics.forEach((metric) => {
        lines.push(`- ${metric.label}: ${metric.leftValue} vs ${metric.rightValue}`);
      });

      if (analysis.notes.length) {
        lines.push("");
        lines.push("Notes");
        analysis.notes.forEach((note) => lines.push(`- ${note}`));
      }

      return lines.join("\n");
    }

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
        `${formatDeviceDisplayName(analysis.currentComparison.currentDevice)} vs ${formatDeviceDisplayName(analysis.currentComparison.recommendedDevice)}`,
        `${capitalizeWords(analysis.currentComparison.classification)}: ${analysis.currentComparison.explanation}`
      ]
      : [];

    lines.push("Which Handheld Should I Buy?");
    lines.push("");
    lines.push(`Recommended Device: ${analysis.keepCurrent && analysis.currentComparison ? `Keep your current ${formatDeviceDisplayName(analysis.currentComparison.currentDevice)}` : formatDeviceDisplayName(recommendedCandidate.device)}`);
    lines.push(`Confidence: ${analysis.confidence.label}`);
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
    lines.push(`Budget Alternative: ${analysis.scoring.budgetAlternative ? formatDeviceDisplayName(analysis.scoring.budgetAlternative.device) : "None"}`);
    lines.push(`Future Proof Option: ${analysis.scoring.futureProofOption ? formatDeviceDisplayName(analysis.scoring.futureProofOption.device) : "None"}`);
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
