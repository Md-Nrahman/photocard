import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "https://md-nrahman.github.io/photocard", // This must match your repo name
});
