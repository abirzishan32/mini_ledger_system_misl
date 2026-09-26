import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Traces the files the server actually reaches and emits a self-contained
  // bundle with its own minimal node_modules. Without it the runtime image would
  // have to carry the whole dependency tree, most of which is never loaded.
  output: "standalone",
};

export default nextConfig;
