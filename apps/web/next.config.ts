import path from "node:path";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(path.resolve(process.cwd(), "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@tmr/core", "@tmr/db"],
  serverExternalPackages: ["@node-rs/argon2", "postgres"],
};

export default nextConfig;
