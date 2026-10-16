/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Tự động nén Gzip/Brotli giảm hơn 70% băng thông truyền tải mạng
  poweredByHeader: false, // Ẩn thông tin công nghệ để tăng cường bảo mật
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'xlsx'],
  },
  output: 'standalone', // Xuất gói Docker / Container tối ưu kích thước siêu nhẹ cho Cloud
};

export default nextConfig;
