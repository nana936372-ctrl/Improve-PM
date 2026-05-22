import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        muted: "#666f7a",
        panel: "#f7f8fa",
        line: "#dce1e7",
        brand: "#2563eb",
        success: "#16803c",
        warning: "#a35d00",
        danger: "#b42318"
      }
    }
  },
  plugins: []
};

export default config;
