import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f1f9f3",
        surface: "#ffffff",
        ink: "#1e3a2c",
        primary: { DEFAULT: "#33ab6c", ink: "#1e7a4b" },
        accent: { DEFAULT: "#f5872e", soft: "#fff2e6", ink: "#d76c16" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
