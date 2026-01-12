import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FluencyLab School',
    short_name: 'FluencyLab',
    description: 'Aplicativo PWA da FluencyLab School',
    start_url: '/hub',
    display: 'fullscreen',
    display_override: ['fullscreen'],
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    icons: [],
  }
}
