export type AudioDeviceTransport = "usb" | "analog" | "bluetooth" | "hdmi" | "virtual" | "network" | "other";

const CATEGORY_LABELS: Record<AudioDeviceTransport, string> = {
  usb: "Audio USB",
  analog: "Audio analogico / integrato",
  bluetooth: "Audio Bluetooth",
  hdmi: "HDMI / Display",
  virtual: "Virtuale / loopback",
  network: "Rete / remoto",
  other: "Altro"
};

const KEYWORDS: Record<AudioDeviceTransport, string[]> = {
  usb: [" usb", "usb ", "usb-", "webcam", "camera", "dock", "docking", "scarlett", "yeti", "quadcast"],
  analog: [
    "realtek",
    "conexant",
    "via",
    "c-media",
    "cmedia",
    "sound blaster",
    "creative",
    "x-fi",
    "line in",
    "line-in",
    "rear mic",
    "front mic",
    "mic in",
    "mic input",
    "microfono",
    "microphone array",
    "jack",
    "alc",
    "high definition audio",
    "hd audio",
    "integrated",
    "onboard",
    "motherboard",
    "pci",
    "pcie",
    "wdm",
    "wasapi"
  ],
  bluetooth: ["bluetooth", "airpods", "buds", "hands-free", "hands free", "headset", "le-"],
  hdmi: ["hdmi", "displayport", "display audio", "monitor"],
  virtual: [
    "virtual",
    "voicemeter",
    "vb-audio",
    "stereo mix",
    "loopback",
    "wave out mix",
    "what u hear",
    "what you hear",
    "monitor of",
    "obs",
    "broadcast",
    "cable output"
  ],
  network: ["dante", "ndi", "network", "remote audio", "remote"],
  other: []
};

export function classifyAudioDeviceLabel(label: string): AudioDeviceTransport {
  const normalized = ` ${label.toLowerCase()} `;

  for (const category of ["bluetooth", "usb", "virtual", "network", "hdmi", "analog"] as const) {
    if (KEYWORDS[category].some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

export function getAudioDeviceCategoryLabel(category: AudioDeviceTransport): string {
  return CATEGORY_LABELS[category];
}
