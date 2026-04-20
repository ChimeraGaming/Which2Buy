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
    { id: "simple", name: "Simple" }
  ];

  const workflowModes = [
    { id: "recommendation", name: "Recommendation" },
    { id: "compated", name: "Compare Devices" }
  ];

  const useCaseLanes = [
    { id: "any", name: "Any current lane" },
    { id: "retro-focused", name: "Low End Retro" },
    { id: "balanced-android", name: "Mid Range Android" },
    { id: "high-end-android", name: "High End Android" },
    { id: "clamshell", name: "Clamshell / Dual Screen" }
  ];

  const useCaseLaneProfiles = {
    default: {
      fitModel: "default",
      ramByRank: { 1: 8, 2: 12, 3: 16, 4: 24 },
      reserveScale: {
        os: 1,
        app: 1,
        cacheBase: 1,
        cachePerHundred: 1,
        safetyShift: 0,
        safetyMin: 20,
        safetyMax: 35
      },
      internalNeed: {
        coreBase: 0,
        coreFactor: 0.12,
        coreMax: 24,
        comfortBase: 0,
        comfortFactor: 0.15,
        comfortMax: 32
      }
    },
    "retro-focused": {
      fitModel: "retro-lite",
      ramByRank: { 1: 1, 2: 1, 3: 2, 4: 4 },
      reserveScale: {
        os: 0.08,
        app: 0.05,
        cacheBase: 0.12,
        cachePerHundred: 0.2,
        safetyShift: -8,
        safetyMin: 10,
        safetyMax: 24
      },
      internalNeed: {
        coreBase: 0.5,
        coreFactor: 0.02,
        coreMax: 6,
        comfortBase: 1,
        comfortFactor: 0.03,
        comfortMax: 8
      }
    }
  };

  const brands = [
    { id: "anbernic", name: "ANBERNIC" },
    { id: "ayaneo", name: "AYANEO" },
    { id: "ayn", name: "AYN" },
    { id: "gameforce", name: "GameForce" },
    { id: "gpd", name: "GPD" },
    { id: "kinhank", name: "Kinhank" },
    { id: "logitech-g", name: "Logitech G" },
    { id: "miyoo", name: "Miyoo" },
    { id: "moqi", name: "Moqi" },
    { id: "onexplayer", name: "ONEXPLAYER" },
    { id: "powkiddy", name: "Powkiddy" },
    { id: "razer", name: "Razer" },
    { id: "retroid", name: "Retroid" },
    { id: "zpg", name: "ZPG" }
  ];

  const ownedDevicesByBrand = {
    anbernic: [
      { id: "anbernic-rg280v", name: "RG280V" },
      { id: "anbernic-rg300x", name: "RG300X" },
      { id: "anbernic-rg351p", name: "RG351P" },
      { id: "anbernic-rg351m", name: "RG351M" },
      { id: "anbernic-rg351mp", name: "RG351MP" },
      { id: "anbernic-rg353m", name: "RG353M" },
      { id: "anbernic-rg353p", name: "RG353P" },
      { id: "anbernic-rg353ps", name: "RG353PS" },
      { id: "anbernic-rg353v", name: "RG353V" },
      { id: "anbernic-rg353vs", name: "RG353VS" },
      { id: "anbernic-rg405m", name: "RG405M" },
      { id: "anbernic-rg405v", name: "RG405V" },
      { id: "anbernic-rg505", name: "RG505" },
      { id: "anbernic-rg552", name: "RG552" },
      { id: "anbernic-rg556", name: "RG556" },
      { id: "anbernic-rg557", name: "RG557" },
      { id: "anbernic-rg406h", name: "RG406H" },
      { id: "anbernic-rg406v", name: "RG406V" },
      { id: "anbernic-rg-arc-d", name: "RG ARC-D" },
      { id: "anbernic-rg-arc-s", name: "RG ARC-S" },
      { id: "anbernic-rg35xx", name: "RG35XX" },
      { id: "anbernic-rg35xx-plus", name: "RG35XX Plus" },
      { id: "anbernic-rg35xx-h", name: "RG35XX H" },
      { id: "anbernic-rg35xx-sp", name: "RG35XX SP" },
      { id: "anbernic-rg34xx", name: "RG34XX" },
      { id: "anbernic-rg34xxsp", name: "RG34XXSP" },
      { id: "anbernic-rg40xx-h", name: "RG40XX H" },
      { id: "anbernic-rg40xx-v", name: "RG40XX V" },
      { id: "anbernic-cube", name: "RG Cube" },
      { id: "anbernic-cube-xx", name: "CubeXX" },
      { id: "anbernic-rg-slide", name: "RG Slide" },
      { id: "anbernic-win600", name: "Win600" },
      { id: "anbernic-other", name: "Other ANBERNIC device" }
    ],
    ayaneo: [
      { id: "ayaneo-air", name: "Air" },
      { id: "ayaneo-air-plus", name: "Air Plus" },
      { id: "ayaneo-air-1s", name: "Air 1S" },
      { id: "ayaneo-3", name: "3" },
      { id: "ayaneo-2", name: "2" },
      { id: "ayaneo-2s", name: "2S" },
      { id: "ayaneo-geek", name: "Geek" },
      { id: "ayaneo-geek-1s", name: "Geek 1S" },
      { id: "ayaneo-next", name: "Next" },
      { id: "ayaneo-next-pro", name: "Next Pro" },
      { id: "ayaneo-next-2", name: "NEXT 2" },
      { id: "ayaneo-pocket-air", name: "Pocket Air" },
      { id: "ayaneo-pocket-air-mini", name: "Pocket Air Mini" },
      { id: "ayaneo-pocket-ace", name: "Pocket ACE" },
      { id: "ayaneo-pocket-ds", name: "Pocket DS" },
      { id: "ayaneo-pocket-dmg", name: "Pocket DMG" },
      { id: "ayaneo-pocket-micro", name: "Pocket Micro" },
      { id: "ayaneo-pocket-s", name: "Pocket S" },
      { id: "ayaneo-pocket-s-mini", name: "Pocket S Mini" },
      { id: "ayaneo-pocket-s2", name: "Pocket S2" },
      { id: "ayaneo-pocket-s2-pro", name: "Pocket S2 Pro" },
      { id: "ayaneo-pocket-evo", name: "Pocket EVO" },
      { id: "ayaneo-pocket-vert", name: "Pocket VERT" },
      { id: "ayaneo-flip-kb", name: "Flip KB" },
      { id: "ayaneo-flip-ds", name: "Flip DS" },
      { id: "ayaneo-flip-1s-kb", name: "Flip 1S KB" },
      { id: "ayaneo-flip-1s-ds", name: "Flip 1S DS" },
      { id: "ayaneo-slide", name: "Slide" },
      { id: "ayaneo-kun", name: "Kun" },
      { id: "ayaneo-other", name: "Other AYANEO device" }
    ],
    gameforce: [
      { id: "gameforce-chi", name: "Chi" },
      { id: "gameforce-ace", name: "ACE" },
      { id: "gameforce-other", name: "Other GameForce device" }
    ],
    gpd: [
      { id: "gpd-xd-plus", name: "XD Plus" },
      { id: "gpd-xp", name: "XP" },
      { id: "gpd-xp-plus", name: "XP Plus" },
      { id: "gpd-micro-pc", name: "MicroPC" },
      { id: "gpd-micro-pc-2", name: "MicroPC 2" },
      { id: "gpd-win", name: "WIN" },
      { id: "gpd-win-2", name: "WIN 2" },
      { id: "gpd-win-3", name: "WIN 3" },
      { id: "gpd-win-4", name: "WIN 4" },
      { id: "gpd-win-4-2025", name: "WIN 4 (2025)" },
      { id: "gpd-win-mini", name: "WIN Mini" },
      { id: "gpd-win-mini-2025", name: "WIN Mini (2025)" },
      { id: "gpd-win-max", name: "WIN Max" },
      { id: "gpd-win-max-2", name: "WIN Max 2" },
      { id: "gpd-win-max-2-2025", name: "WIN Max 2 (2025)" },
      { id: "gpd-win-5", name: "WIN 5" },
      { id: "gpd-other", name: "Other GPD device" }
    ],
    kinhank: [
      { id: "kinhank-super-console-k", name: "Super Console K" },
      { id: "kinhank-super-console-x2-pro", name: "Super Console X2 Pro" },
      { id: "kinhank-super-console-x5-pro", name: "Super Console X5 Pro" },
      { id: "kinhank-other", name: "Other Kinhank device" }
    ],
    "logitech-g": [
      { id: "logitech-g-cloud", name: "G Cloud" },
      { id: "logitech-g-other", name: "Other Logitech G device" }
    ],
    miyoo: [
      { id: "miyoo-mini", name: "Mini" },
      { id: "miyoo-mini-v4", name: "Mini V4" },
      { id: "miyoo-mini-plus", name: "Mini Plus" },
      { id: "miyoo-mini-plus-v3", name: "Mini Plus V3" },
      { id: "miyoo-a30", name: "A30" },
      { id: "miyoo-flip", name: "Flip" },
      { id: "miyoo-other", name: "Other Miyoo device" }
    ],
    moqi: [
      { id: "moqi-i7", name: "i7" },
      { id: "moqi-i7s", name: "i7S" },
      { id: "moqi-other", name: "Other Moqi device" }
    ],
    onexplayer: [
      { id: "onexplayer-1s", name: "OneXPlayer 1S" },
      { id: "onexplayer-mini", name: "Mini" },
      { id: "onexplayer-mini-pro", name: "Mini Pro" },
      { id: "onexplayer-2", name: "2" },
      { id: "onexplayer-2-pro", name: "2 Pro" },
      { id: "onexplayer-x1", name: "X1" },
      { id: "onexplayer-x1-pro", name: "X1 Pro" },
      { id: "onexplayer-x1-air", name: "X1 Air" },
      { id: "onexplayer-x1-mini", name: "X1 Mini" },
      { id: "onexfly-f1-pro", name: "OneXFly F1 Pro" },
      { id: "onexplayer-other", name: "Other ONEXPLAYER device" }
    ],
    powkiddy: [
      { id: "powkiddy-a12", name: "A12" },
      { id: "powkiddy-rgb10", name: "RGB10" },
      { id: "powkiddy-rgb10-max", name: "RGB10 Max" },
      { id: "powkiddy-rgb10-max-2", name: "RGB10 Max 2" },
      { id: "powkiddy-rgb10max3-pro", name: "RGB10MAX3 Pro" },
      { id: "powkiddy-rgb10x", name: "RGB10X" },
      { id: "powkiddy-rgb20s", name: "RGB20S" },
      { id: "powkiddy-rgb20-pro", name: "RGB20 Pro" },
      { id: "powkiddy-rgb20sx", name: "RGB20SX" },
      { id: "powkiddy-rgb30", name: "RGB30" },
      { id: "powkiddy-rgb55", name: "RGB55" },
      { id: "powkiddy-x18s", name: "X18S" },
      { id: "powkiddy-x28", name: "X28" },
      { id: "powkiddy-x35s", name: "X35S" },
      { id: "powkiddy-x35h", name: "X35H" },
      { id: "powkiddy-x55", name: "X55" },
      { id: "powkiddy-v10", name: "V10" },
      { id: "powkiddy-v20", name: "V20" },
      { id: "powkiddy-v90s", name: "V90S" },
      { id: "powkiddy-brick", name: "Brick" },
      { id: "powkiddy-other", name: "Other Powkiddy device" }
    ],
    razer: [
      { id: "razer-edge", name: "Edge" },
      { id: "razer-other", name: "Other Razer device" }
    ],
    retroid: [
      { id: "retroid-pocket-2", name: "Pocket 2" },
      { id: "retroid-pocket-2-plus", name: "Pocket 2+" },
      { id: "retroid-pocket-3", name: "Pocket 3" },
      { id: "retroid-pocket-3-plus", name: "Pocket 3+" },
      { id: "retroid-pocket-flip", name: "Pocket Flip" },
      { id: "retroid-pocket-4", name: "Pocket 4" },
      { id: "retroid-pocket-4-pro", name: "Pocket 4 Pro" },
      { id: "retroid-pocket-5", name: "Pocket 5" },
      { id: "retroid-pocket-mini", name: "Pocket Mini" },
      { id: "retroid-pocket-mini-v2", name: "Pocket Mini V2" },
      { id: "retroid-pocket-classic", name: "Pocket Classic" },
      { id: "retroid-pocket-flip-2", name: "Pocket Flip 2" },
      { id: "retroid-pocket-g2", name: "Pocket G2" },
      { id: "retroid-pocket-6", name: "Pocket 6 (pre-order)" },
      { id: "retroid-other", name: "Other Retroid device" }
    ],
    zpg: [
      { id: "zpg-a1-unicorn", name: "A1 Unicorn" },
      { id: "zpg-pro", name: "ZPG Pro" },
      { id: "zpg-other", name: "Other ZPG device" }
    ]
  };

  const ownedDeviceCompareProfiles = {
    anbernic: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["anbernic-rg35xx-sp", "anbernic-rg34xxsp"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "clamshell", dualScreen: false },
        { ids: ["anbernic-rg280v", "anbernic-rg300x", "anbernic-rg35xx", "anbernic-rg35xx-plus", "anbernic-rg40xx-v"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "vertical", dualScreen: false },
        { ids: ["anbernic-rg35xx-h", "anbernic-rg34xx", "anbernic-rg40xx-h", "anbernic-rg-arc-d", "anbernic-rg-arc-s", "anbernic-cube-xx"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
        { ids: ["anbernic-rg351p", "anbernic-rg351m", "anbernic-rg351mp", "anbernic-rg353m", "anbernic-rg353p", "anbernic-rg353ps", "anbernic-rg405m", "anbernic-rg505", "anbernic-rg552"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["anbernic-rg353v", "anbernic-rg353vs", "anbernic-rg405v"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "vertical", dualScreen: false },
        { ids: ["anbernic-win600"], compareClass: "windows-handheld", computeRank: 2, ram: 8, storage: 128, formFactor: "horizontal", dualScreen: false }
      ]
    },
    ayaneo: {
      fallback: { compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["ayaneo-pocket-micro", "ayaneo-pocket-dmg", "ayaneo-pocket-vert"], compareClass: "android-retro", computeRank: 2, ram: 6, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["ayaneo-pocket-air", "ayaneo-pocket-air-mini"], compareClass: "android-retro", computeRank: 3, ram: 8, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["ayaneo-pocket-ace", "ayaneo-pocket-s", "ayaneo-pocket-s-mini", "ayaneo-pocket-s2", "ayaneo-pocket-s2-pro", "ayaneo-pocket-evo"], compareClass: "android-retro", computeRank: 4, ram: 8, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["ayaneo-pocket-ds"], compareClass: "android-retro", computeRank: 4, ram: 8, storage: 128, formFactor: "clamshell", dualScreen: true },
        { ids: ["ayaneo-flip-ds", "ayaneo-flip-1s-ds"], compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "clamshell", dualScreen: true },
        { ids: ["ayaneo-flip-kb", "ayaneo-flip-1s-kb"], compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "clamshell", dualScreen: false },
        { ids: ["ayaneo-air", "ayaneo-air-plus", "ayaneo-air-1s"], compareClass: "windows-handheld", computeRank: 3, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false },
        { ids: ["ayaneo-3", "ayaneo-2", "ayaneo-2s", "ayaneo-geek", "ayaneo-geek-1s", "ayaneo-next", "ayaneo-next-pro", "ayaneo-next-2", "ayaneo-slide", "ayaneo-kun"], compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false }
      ]
    },
    gameforce: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["gameforce-chi"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
        { ids: ["gameforce-ace"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 64, formFactor: "horizontal", dualScreen: false }
      ]
    },
    gpd: {
      fallback: { compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["gpd-xd-plus", "gpd-xp", "gpd-xp-plus"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["gpd-micro-pc", "gpd-micro-pc-2"], compareClass: "windows-handheld", computeRank: 1, ram: 8, storage: 256, formFactor: "horizontal", dualScreen: false },
        { ids: ["gpd-win", "gpd-win-2"], compareClass: "windows-handheld", computeRank: 3, ram: 8, storage: 256, formFactor: "horizontal", dualScreen: false },
        { ids: ["gpd-win-3", "gpd-win-4", "gpd-win-4-2025", "gpd-win-mini", "gpd-win-mini-2025", "gpd-win-max", "gpd-win-max-2", "gpd-win-max-2-2025", "gpd-win-5"], compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false }
      ]
    },
    kinhank: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: []
    },
    "logitech-g": {
      fallback: { compareClass: "cloud-streaming", computeRank: 1, ram: 4, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: []
    },
    miyoo: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 1, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["miyoo-mini", "miyoo-mini-v4", "miyoo-mini-plus", "miyoo-mini-plus-v3"], compareClass: "linux-retro", computeRank: 1, ram: 1, storage: 64, formFactor: "vertical", dualScreen: false },
        { ids: ["miyoo-flip"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "clamshell", dualScreen: false }
      ]
    },
    moqi: {
      fallback: { compareClass: "android-retro", computeRank: 1, ram: 4, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: []
    },
    onexplayer: {
      fallback: { compareClass: "windows-handheld", computeRank: 4, ram: 16, storage: 512, formFactor: "horizontal", dualScreen: false },
      profiles: []
    },
    powkiddy: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["powkiddy-rgb20sx", "powkiddy-brick"], compareClass: "linux-retro", computeRank: 2, ram: 2, storage: 64, formFactor: "vertical", dualScreen: false },
        { ids: ["powkiddy-v90s"], compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "clamshell", dualScreen: false },
        { ids: ["powkiddy-x18s", "powkiddy-x28", "powkiddy-rgb10max3-pro"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "horizontal", dualScreen: false }
      ]
    },
    razer: {
      fallback: { compareClass: "cloud-streaming", computeRank: 2, ram: 6, storage: 128, formFactor: "horizontal", dualScreen: false },
      profiles: []
    },
    retroid: {
      fallback: { compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "horizontal", dualScreen: false },
      profiles: [
        { ids: ["retroid-pocket-2", "retroid-pocket-2-plus"], compareClass: "android-retro", computeRank: 1, ram: 4, storage: 64, formFactor: "horizontal", dualScreen: false },
        { ids: ["retroid-pocket-3", "retroid-pocket-3-plus"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["retroid-pocket-flip"], compareClass: "android-retro", computeRank: 2, ram: 4, storage: 128, formFactor: "clamshell", dualScreen: false },
        { ids: ["retroid-pocket-4", "retroid-pocket-4-pro", "retroid-pocket-mini"], compareClass: "android-retro", computeRank: 3, ram: 8, storage: 128, formFactor: "horizontal", dualScreen: false },
        { ids: ["retroid-pocket-classic"], compareClass: "android-retro", computeRank: 1, ram: 6, storage: 128, formFactor: "vertical", dualScreen: false }
      ]
    },
    zpg: {
      fallback: { compareClass: "linux-retro", computeRank: 1, ram: 2, storage: 64, formFactor: "horizontal", dualScreen: false },
      profiles: []
    }
  };

  const appDefaults = {
    theme: "canyon-dust",
    format: "default",
    mode: "",
    ownsDevice: "no",
    currentBrand: "",
    currentDeviceId: "",
    compareLeftBrand: "",
    compareLeftDeviceId: "",
    compareRightBrand: "",
    compareRightDeviceId: "",
    useCaseLane: "any",
    brandPreference: "any",
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
    workflowModes,
    useCaseLanes,
    useCaseLaneProfiles,
    brands,
    ownedDevicesByBrand,
    ownedDeviceCompareProfiles,
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
