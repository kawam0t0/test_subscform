/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "v0.blob.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  optimizeFonts: false,
  onError: async (err, req, res) => {
    console.error("Server Error:", err)
    res.statusCode = 500
    res.end("Internal Server Error")
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
}

module.exports = nextConfig