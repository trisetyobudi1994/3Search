import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      boxShadow: {
        "3d-sm": "0 1px 2px rgba(24,24,27,0.04), 0 2px 4px rgba(24,24,27,0.03), 0 4px 8px rgba(24,24,27,0.02)",
        "3d": "0 1px 2px rgba(24,24,27,0.04), 0 4px 8px rgba(24,24,27,0.04), 0 12px 24px rgba(24,24,27,0.05), 0 24px 48px rgba(24,24,27,0.04)",
        "3d-lg": "0 2px 4px rgba(24,24,27,0.04), 0 8px 16px rgba(24,24,27,0.06), 0 24px 48px rgba(24,24,27,0.08), 0 48px 96px rgba(24,24,27,0.06)",
        "3d-glow": "0 2px 4px rgba(124,58,237,0.12), 0 8px 16px rgba(124,58,237,0.12), 0 24px 48px rgba(37,99,235,0.1)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
