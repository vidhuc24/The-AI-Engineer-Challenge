import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: 'http://localhost:8000/api/chat',
      },
      {
        source: '/api/upload-document',
        destination: 'http://localhost:8000/api/upload-document',
      },
      {
        source: '/api/documents/status',
        destination: 'http://localhost:8000/api/documents/status',
      },
      {
        source: '/api/documents/clear',
        destination: 'http://localhost:8000/api/documents/clear',
      },
      {
        source: '/api/health',
        destination: 'http://localhost:8000/api/health',
      },
    ];
  },
};

export default nextConfig;
