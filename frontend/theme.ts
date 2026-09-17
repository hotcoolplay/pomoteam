import { createTheme, virtualColor, type MantineColorsTuple } from "@mantine/core";

// Approximate 10-shade ramps (index 0 lightest -> 9 darkest). Regenerate
// precise values for your brand with Mantine's color generator:
// https://mantine.dev/colors-generator/
const brass: MantineColorsTuple = [
  "#FFF8E1", "#FFECB3", "#FFE082", "#FFD54F", "#FFCA28",
  "#F5B942", "#E9B949", "#C99A2E", "#A67C1F", "#7A5A14",
];

const sea: MantineColorsTuple = [
  "#E6F7F4", "#C0EAE3", "#96DCD1", "#6BCDBE", "#48C1AF",
  "#34B6A2", "#2E8B7A", "#24705F", "#1A5548", "#103B32",
];

export const theme = createTheme({
  primaryColor: "accent",
  colors: {
    brass,
    sea,
    // A single color name that resolves to a different real color per
    // scheme. StudyRoom flips the *scheme* (dark for focus, light for
    // break); every component reading theme.primaryColor - Button,
    // Progress, Badge, etc. left with no explicit color prop - repaints
    // itself for free, with no per-component phase conditionals.
    accent: virtualColor({ name: "accent", light: "sea", dark: "brass" }),
  },
  fontFamily: "'Public Sans', system-ui, -apple-system, sans-serif",
  headings: {
    fontFamily: "'Bricolage Grotesque', 'Public Sans', sans-serif",
    fontWeight: "600",
  },
  // Explicit rather than relying on the library default, since that default
  // changed between major versions (sm in 8.x, md in 9.x) - pin the one this
  // design was built against.
  defaultRadius: "md",
});
