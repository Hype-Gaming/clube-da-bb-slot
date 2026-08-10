export interface SlotDefinition {
  id: string
  name: string
  provider?: string
  slug?: string
  image: string
  heroImage?: string
  enabled: boolean
  featured?: boolean
  palette: [string, string]
  symbol: string
}

export const slots: SlotDefinition[] = [
  {
    id: 'fortune-tiger',
    name: 'Fortune Tiger',
    slug: 'fortune-tiger',
    image: '/slots/Fortune Tiger.png',
    heroImage: '/slots/Fortune Tiger.png',
    enabled: true,
    featured: true,
    palette: ['#f5a623', '#7b2d10'],
    symbol: '虎'
  },
  {
    id: 'fortune-mouse',
    name: 'Fortune Mouse',
    image: '/slots/Fortune mouse.png',
    enabled: false,
    palette: ['#f6b742', '#91410e'],
    symbol: '鼠'
  },
  {
    id: 'fortune-rabbit',
    name: 'Fortune Rabbit',
    image: '/slots/Fortune Rabbit.png',
    enabled: false,
    palette: ['#ff8a9b', '#a92562'],
    symbol: '兔'
  },
  {
    id: 'golden-dragon',
    name: 'Golden Dragon',
    image: '',
    enabled: false,
    palette: ['#f5d35b', '#7021a9'],
    symbol: '龍'
  },
  {
    id: 'golden-rabbit',
    name: 'Golden Rabbit',
    image: '',
    enabled: false,
    palette: ['#ffbd31', '#e53777'],
    symbol: '兔'
  },
  {
    id: 'magic-rabbit',
    name: 'Magic Rabbit',
    image: '',
    enabled: false,
    palette: ['#48bde2', '#333bba'],
    symbol: '兔'
  }
]

export const getSlotById = (id: string) => slots.find(slot => slot.id === id)
