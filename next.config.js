/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Google Fontsの設定を修正
  optimizeFonts: false,
  // エラーハンドリングの設定を追加
  onError: async (err, req, res) => {
    console.error("Server Error:", err)
    res.statusCode = 500
    res.end("Internal Server Error")
  },
}

module.exports = nextConfig
