import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output gives OpenNext the full file trace it needs to inline
  // Turbopack chunks into the Worker bundle.
  output: "standalone",
  // Keep heavy Lightning/Spark SDK out of the server bundle. These come in
  // transitively via @meshsdk/react -> @utxos/sdk -> @buildonspark/spark-sdk
  // and add ~18 MB of Lightning/gRPC code to the server side, blowing past
  // the 10 MiB Cloudflare Workers limit. They're only used in client
  // components, so externalizing them is safe.
  serverExternalPackages: [
    "@buildonspark/spark-sdk",
    "@buildonspark/issuer-sdk",
    "@utxos/sdk",
    "@lightsparkdev/core",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflarestream.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
