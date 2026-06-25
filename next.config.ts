import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow a separate build dir (e.g. NEXT_DIST_DIR=.next-onboard) so a
  // production instance can run alongside the dev server without clobbering it.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
