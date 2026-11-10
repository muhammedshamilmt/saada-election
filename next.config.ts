import type { NextConfig } from "next";

const dbToggle =
  process.env.DB_IS_ENABLE ??
  process.env.db_isenble ??
  process.env.NEXT_PUBLIC_DB_IS_ENABLE ??
  "true";

const nextConfig: NextConfig = {
  /* Pass DB flag down to client browser regardless of which env variable name is written */
  env: {
    NEXT_PUBLIC_DB_IS_ENABLE: dbToggle,
    DB_IS_ENABLE: dbToggle,
    db_isenble: dbToggle,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
