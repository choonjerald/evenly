/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ allow builds to succeed even if eslint finds problems
    ignoreDuringBuilds: true,
  },
  // leave this false so TS type errors still fail builds
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
