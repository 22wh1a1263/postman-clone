import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pm: {
          bg: "#1e1e1e",
          sidebar: "#2c2c2c",
          panel: "#252525",
          border: "#3a3a3a",
          hover: "#333333",
          accent: "#ff6c37",
          "accent-dim": "#e05a2a",
          text: "#e0e0e0",
          muted: "#888888",
          success: "#3ecf8e",
          error: "#f87171",
          warning: "#fbbf24",
          info: "#60a5fa",
          tab: "#2a2a2a",
          "tab-active": "#1e1e1e",
        }
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
