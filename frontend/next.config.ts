import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Turbopack is used only in dev (next dev --turbopack).
     Production build uses the standard webpack pipeline which
     handles leaflet/dist/leaflet.css without panicking. */
};

export default nextConfig;
