import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: true,

    server: {
      deps: {
        inline: [
          "@mui/material",
          "@mui/icons-material",
          "@mui/system",
          "@mui/utils",
          "@emotion/react",
          "@emotion/styled",
          "react-transition-group",
        ],
      },
    },
  },
});