import {
  COUNTRY_FILL_AURORA,
  COUNTRY_FILL_AURORA_PLAIN,
  COUNTRY_FILL_BRONZE,
  COUNTRY_FILL_BRONZE_PLAIN,
  COUNTRY_FILL_COPPER,
  COUNTRY_FILL_COPPER_PLAIN,
  COUNTRY_FILL_GOLD,
  COUNTRY_FILL_GOLD_PLAIN,
  COUNTRY_FILL_OBSIDIAN,
  COUNTRY_FILL_OBSIDIAN_PLAIN,
  COUNTRY_FILL_ROSE_METAL,
  COUNTRY_FILL_ROSE_METAL_PLAIN,
  COUNTRY_FILL_SILVER,
  COUNTRY_FILL_SILVER_PLAIN,
} from "../../lib/visitStorage";

export type MapFillMetalSwatchClass =
  | "swatchSilverPlain"
  | "swatchGoldPlain"
  | "swatchCopperPlain"
  | "swatchBronzePlain"
  | "swatchAuroraPlain"
  | "swatchRoseMetalPlain"
  | "swatchObsidianPlain"
  | "swatchSilver"
  | "swatchGold"
  | "swatchCopper"
  | "swatchBronze"
  | "swatchAurora"
  | "swatchRoseMetal"
  | "swatchObsidian";

export type MapFillPreset =
  | { kind: "hex"; value: string }
  | { kind: "metal"; value: string; swatchClass: MapFillMetalSwatchClass; label: string };

export const MAP_FILL_PRESETS: readonly MapFillPreset[] = [
  { kind: "hex", value: "#4a9eff" },
  { kind: "hex", value: "#22c55e" },
  { kind: "hex", value: "#eab308" },
  { kind: "hex", value: "#f97316" },
  { kind: "hex", value: "#ef4444" },
  { kind: "hex", value: "#a855f7" },
  { kind: "hex", value: "#ec4899" },
  { kind: "hex", value: "#14b8a6" },
  { kind: "hex", value: "#6366f1" },
  { kind: "hex", value: "#f43f5e" },
  { kind: "hex", value: "#84cc16" },
  { kind: "hex", value: "#06b6d4" },
  { kind: "hex", value: "#d946ef" },
  { kind: "hex", value: "#fb923c" },
  {
    kind: "metal",
    value: COUNTRY_FILL_SILVER_PLAIN,
    swatchClass: "swatchSilverPlain",
    label: "Plain silver",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_GOLD_PLAIN,
    swatchClass: "swatchGoldPlain",
    label: "Plain gold",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_COPPER_PLAIN,
    swatchClass: "swatchCopperPlain",
    label: "Plain copper",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_BRONZE_PLAIN,
    swatchClass: "swatchBronzePlain",
    label: "Plain bronze",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_AURORA_PLAIN,
    swatchClass: "swatchAuroraPlain",
    label: "Plain teal",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_ROSE_METAL_PLAIN,
    swatchClass: "swatchRoseMetalPlain",
    label: "Plain rose gold",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_OBSIDIAN_PLAIN,
    swatchClass: "swatchObsidianPlain",
    label: "Plain obsidian",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_SILVER,
    swatchClass: "swatchSilver",
    label: "Silver with sparkles",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_GOLD,
    swatchClass: "swatchGold",
    label: "Gold with sparkles",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_COPPER,
    swatchClass: "swatchCopper",
    label: "Copper with sparkles",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_BRONZE,
    swatchClass: "swatchBronze",
    label: "Bronze with sparkles",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_AURORA,
    swatchClass: "swatchAurora",
    label: "Northern lights",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_ROSE_METAL,
    swatchClass: "swatchRoseMetal",
    label: "Rose gold with sparkles",
  },
  {
    kind: "metal",
    value: COUNTRY_FILL_OBSIDIAN,
    swatchClass: "swatchObsidian",
    label: "Obsidian with sparkles",
  },
];
