import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "'Times New Roman'", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#0d0d0d",
        surface: "#161616",
        border: "#262626",
        muted: "#404040",
        subtle: "#737373",
        primary: "#e8e0d0",
        secondary: "#a8a29e",
      },
    },
  },
  plugins: [],
};

export default config;
