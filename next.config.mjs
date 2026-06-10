/** @type {import('next').NextConfig} */
const nextConfig = {
  // Comprime respostas HTTP — páginas carregam mais rápido
  compress: true,

  // Detecta problemas no código em desenvolvimento
  reactStrictMode: true,

  // Remove o header "X-Powered-By: Next.js" — não revela a tecnologia usada
  poweredByHeader: false,

  // Permite carregar imagens do Supabase Storage sem erro
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xjxbydmjofdhjoibvxcc.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
