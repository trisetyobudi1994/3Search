const devOrigin = process.env.NEXT_DEV_ORIGIN;

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 memblokir resource dev dari origin lain. Set NEXT_DEV_ORIGIN
  // (hostname saja) saat membuka dev server lewat tunnel/preview.
  ...(devOrigin ? { allowedDevOrigins: [devOrigin] } : {}),
};

module.exports = nextConfig;
