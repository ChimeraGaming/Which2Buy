(function () {
  const systems = [
    { id: "nes", name: "NES", lowGb: 0.001, avgGb: 0.002, highGb: 0.004, performanceTier: "light", performanceWeight: 1.0, dualScreenWeight: 0 },
    { id: "snes", name: "SNES", lowGb: 0.002, avgGb: 0.003, highGb: 0.005, performanceTier: "light", performanceWeight: 1.0, dualScreenWeight: 0 },
    { id: "n64", name: "N64", lowGb: 0.012, avgGb: 0.02, highGb: 0.04, performanceTier: "light", performanceWeight: 1.2, dualScreenWeight: 0 },
    { id: "gb-gbc-gba", name: "GB / GBC / GBA", lowGb: 0.001, avgGb: 0.003, highGb: 0.006, performanceTier: "light", performanceWeight: 1.0, dualScreenWeight: 0 },
    { id: "ds", name: "DS", lowGb: 0.05, avgGb: 0.15, highGb: 0.5, performanceTier: "light", performanceWeight: 1.4, dualScreenWeight: 0.8 },
    { id: "3ds", name: "3DS", lowGb: 0.5, avgGb: 1.5, highGb: 4.0, performanceTier: "high", performanceWeight: 3.4, dualScreenWeight: 1.0 },
    { id: "gamecube", name: "GameCube", lowGb: 1.0, avgGb: 1.6, highGb: 2.6, performanceTier: "high", performanceWeight: 3.0, dualScreenWeight: 0 },
    { id: "wii", name: "Wii", lowGb: 0.8, avgGb: 2.5, highGb: 4.5, performanceTier: "high", performanceWeight: 3.2, dualScreenWeight: 0 },
    { id: "wii-u", name: "Wii U", lowGb: 6.0, avgGb: 14.0, highGb: 22.0, performanceTier: "enthusiast", performanceWeight: 4.2, dualScreenWeight: 0 },
    { id: "switch", name: "Switch", lowGb: 4.0, avgGb: 10.0, highGb: 18.0, performanceTier: "enthusiast", performanceWeight: 4.8, dualScreenWeight: 0 },
    { id: "ps1", name: "PS1", lowGb: 0.3, avgGb: 0.6, highGb: 1.0, performanceTier: "light", performanceWeight: 1.2, dualScreenWeight: 0 },
    { id: "ps2", name: "PS2", lowGb: 1.5, avgGb: 2.6, highGb: 4.0, performanceTier: "high", performanceWeight: 3.1, dualScreenWeight: 0 },
    { id: "ps3", name: "PS3", lowGb: 8.0, avgGb: 18.0, highGb: 35.0, performanceTier: "enthusiast", performanceWeight: 4.6, dualScreenWeight: 0 },
    { id: "psp", name: "PSP", lowGb: 0.4, avgGb: 1.1, highGb: 2.0, performanceTier: "mid", performanceWeight: 2.0, dualScreenWeight: 0 },
    { id: "vita", name: "Vita", lowGb: 1.0, avgGb: 2.2, highGb: 4.0, performanceTier: "high", performanceWeight: 3.0, dualScreenWeight: 0 },
    { id: "dreamcast", name: "Dreamcast", lowGb: 0.7, avgGb: 1.1, highGb: 1.8, performanceTier: "mid", performanceWeight: 2.3, dualScreenWeight: 0 },
    { id: "saturn", name: "Saturn", lowGb: 0.4, avgGb: 0.8, highGb: 1.2, performanceTier: "high", performanceWeight: 3.0, dualScreenWeight: 0 },
    { id: "sega-cd", name: "Sega CD", lowGb: 0.3, avgGb: 0.5, highGb: 0.7, performanceTier: "light", performanceWeight: 1.1, dualScreenWeight: 0 },
    { id: "genesis", name: "Genesis", lowGb: 0.002, avgGb: 0.004, highGb: 0.008, performanceTier: "light", performanceWeight: 1.0, dualScreenWeight: 0 },
    { id: "arcade", name: "Arcade", lowGb: 0.05, avgGb: 0.25, highGb: 1.2, performanceTier: "mid", performanceWeight: 2.4, dualScreenWeight: 0 },
    { id: "android", name: "Android", lowGb: 0.6, avgGb: 4.0, highGb: 12.0, performanceTier: "high", performanceWeight: 2.9, dualScreenWeight: 0 },
    {
      id: "pc",
      name: "PC",
      lowGb: 0,
      avgGb: 0,
      highGb: 0,
      performanceTier: "high",
      performanceWeight: 3.2,
      dualScreenWeight: 0,
      specialHandling: "pc"
    }
  ];

  window.SystemsData = systems;
})();
