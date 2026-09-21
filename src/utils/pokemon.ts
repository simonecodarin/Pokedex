export const TOTAL = 1025

const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

/** Illustrazione ufficiale (non serve una richiesta per Pokémon: l'URL si costruisce dall'id) */
export const artworkUrl = (id: number) => `${SPRITES}/other/official-artwork/${id}.png`
/** Sprite pixel-art, usato come ripiego se l'illustrazione non si carica */
export const spriteUrl = (id: number) => `${SPRITES}/${id}.png`

export const padId = (id: number) => String(id).padStart(4, '0')

export interface TypeMeta {
  label: string
  color: string
}

export const TYPES: Record<string, TypeMeta> = {
  normal: { label: 'Normale', color: '#a8a77a' },
  fire: { label: 'Fuoco', color: '#ee8130' },
  water: { label: 'Acqua', color: '#6390f0' },
  electric: { label: 'Elettro', color: '#f7d02c' },
  grass: { label: 'Erba', color: '#7ac74c' },
  ice: { label: 'Ghiaccio', color: '#96d9d6' },
  fighting: { label: 'Lotta', color: '#c22e28' },
  poison: { label: 'Veleno', color: '#a33ea1' },
  ground: { label: 'Terra', color: '#e2bf65' },
  flying: { label: 'Volante', color: '#a98ff3' },
  psychic: { label: 'Psico', color: '#f95587' },
  bug: { label: 'Coleottero', color: '#a6b91a' },
  rock: { label: 'Roccia', color: '#b6a136' },
  ghost: { label: 'Spettro', color: '#735797' },
  dragon: { label: 'Drago', color: '#6f35fc' },
  dark: { label: 'Buio', color: '#705746' },
  steel: { label: 'Acciaio', color: '#b7b7ce' },
  fairy: { label: 'Folletto', color: '#d685ad' },
}

export const TYPE_ORDER = Object.keys(TYPES)

const FALLBACK_COLOR = '#8a9480'

export const typeColor = (type?: string) => (type && TYPES[type]?.color) || FALLBACK_COLOR
export const typeLabel = (type: string) => TYPES[type]?.label ?? type

/** Sceglie testo scuro o bianco, quello con più contrasto sopra il colore dato */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
  return luminance > 0.21 ? '#1b1f2a' : '#ffffff'
}

export interface Generation {
  id: number
  label: string
  from: number
  to: number
}

export const GENERATIONS: Generation[] = [
  { id: 1, label: 'Kanto', from: 1, to: 151 },
  { id: 2, label: 'Johto', from: 152, to: 251 },
  { id: 3, label: 'Hoenn', from: 252, to: 386 },
  { id: 4, label: 'Sinnoh', from: 387, to: 493 },
  { id: 5, label: 'Unima', from: 494, to: 649 },
  { id: 6, label: 'Kalos', from: 650, to: 721 },
  { id: 7, label: 'Alola', from: 722, to: 809 },
  { id: 8, label: 'Galar', from: 810, to: 905 },
  { id: 9, label: 'Paldea', from: 906, to: 1025 },
]

export const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Attacco',
  defense: 'Difesa',
  'special-attack': 'Att. speciale',
  'special-defense': 'Dif. speciale',
  speed: 'Velocità',
}
