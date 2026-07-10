declare module "next-pwa" {
  import type { NextConfig } from "next";
  type PluginOptions = {
    disable?: boolean;
    register?: boolean;
    dest?: string;
    skipWaiting?: boolean;
    [key: string]: unknown;
  };
  function withPWA(options?: PluginOptions): (nextConfig?: NextConfig) => NextConfig;
  export default withPWA;
}
