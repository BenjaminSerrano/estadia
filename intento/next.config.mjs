let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para rutas dinámicas en export estático
  exportPathMap: async function () {
    const paths = {}
    
    // Página principal
    paths['/'] = { page: '/' }
    
    // Rutas estáticas básicas para evitar errores de build
    const sections = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC']
    const elements = ['__TODOS_LOS_DATOS__']
    
    sections.forEach(section => {
      paths[`/data/${section}`] = { 
        page: '/data/[section]', 
        query: { section } 
      }
      
      elements.forEach(element => {
        paths[`/data/${section}/${element}`] = { 
          page: '/data/[section]/[element]', 
          query: { section, element } 
        }
      })
    })
    
    return paths
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
