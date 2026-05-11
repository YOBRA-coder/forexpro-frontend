// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  bg:      "#07090D",
  surf:    "#0D1318",
  surf2:   "#121A22",
  border:  "#1C2B38",
  text:    "#CDD8EA",
  muted:   "#48627A",
  gold:    "#F0B429",
  green:   "#00E070",
  red:     "#FF3550",
  blue:    "#3D9EFF",
  purple:  "#9B7FFF",
};

// ─── Navigation config ────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard"    },
  { id: "signals",   icon: "⚡", label: "Signals"      },
  { id: "copy",      icon: "↻", label: "Copy Trading" },
  { id: "providers", icon: "★", label: "Providers"    },
  { id: "education", icon: "🎓", label: "Education"    },
  { id: "journal",   icon: "📖", label: "Journal"      },
  { id: "prices",    icon: "📡", label: "Live Prices"  },
  { id: "profile",   icon: "⚙", label: "Profile / MT5"},
];

const bottomNav = [
  { id: "dashboard", icon: "⊞", label: "Dashboard"    },
  { id: "signals",   icon: "⚡", label: "Signals"      },
  { id: "copy",      icon: "↻", label: "Copy Trading" },
  { id: "prices",    icon: "📡", label: "Live Prices"  },
  { id: "profile",   icon: "⚙", label: "Profile / MT5"},
];

export { C, NAV, bottomNav };