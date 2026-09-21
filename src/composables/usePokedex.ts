import axios from 'axios'
import { ref, shallowReactive, shallowRef, watch } from 'vue'
import { TOTAL, artworkUrl } from '../utils/pokemon'

export interface PokemonBasic {
  id: number
  name: string
}

export interface PokemonDetail {
  id: number
  name: string
  types: string[]
  height: number // metri
  weight: number // kg
  baseExperience: number | null
  stats: { key: string; value: number }[]
  abilities: { name: string; hidden: boolean }[]
  cry: string | null
  artwork: string
  shiny: string | null
}

export interface PokemonSpecies {
  genus: string | null
  text: string | null
}

interface ApiPokemon {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number | null
  types: { type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  abilities: { is_hidden: boolean; ability: { name: string } }[]
  cries?: { latest?: string | null }
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      'official-artwork'?: { front_default: string | null; front_shiny: string | null }
    }
  }
}

interface ApiSpecies {
  genera: { genus: string; language: { name: string } }[]
  flavor_text_entries: { flavor_text: string; language: { name: string } }[]
}

const api = axios.create({ baseURL: 'https://pokeapi.co/api/v2', timeout: 15000 })

const list = shallowRef<PokemonBasic[]>([])
const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const details = shallowReactive(new Map<number, PokemonDetail>())
const species = shallowReactive(new Map<number, PokemonSpecies>())
const typeMembers = shallowReactive(new Map<string, Set<number>>())
const inflight = new Map<string, Promise<void>>()

const MAX_PARALLEL = 6
let active = 0
const waiting: Array<() => void> = []

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((resolve) => waiting.push(resolve))
  active++
  try {
    return await task()
  } finally {
    active--
    waiting.shift()?.()
  }
}

const idFromUrl = (url: string) => Number(url.split('/').filter(Boolean).pop())

function toDetail(d: ApiPokemon): PokemonDetail {
  const art = d.sprites.other?.['official-artwork']
  return {
    id: d.id,
    name: d.name,
    types: d.types.map((t) => t.type.name),
    height: d.height / 10,
    weight: d.weight / 10,
    baseExperience: d.base_experience,
    stats: d.stats.map((s) => ({ key: s.stat.name, value: s.base_stat })),
    abilities: d.abilities.map((a) => ({
      name: a.ability.name.replace(/-/g, ' '),
      hidden: a.is_hidden,
    })),
    cry: d.cries?.latest ?? null,
    artwork: art?.front_default ?? d.sprites.front_default ?? artworkUrl(d.id),
    shiny: art?.front_shiny ?? d.sprites.front_shiny ?? null,
  }
}

const cleanText = (text: string) =>
  text
    .replace(/\u00ad/g, '')
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function toSpecies(d: ApiSpecies): PokemonSpecies {
  const pick = <T extends { language: { name: string } }>(items: T[]) => {
    const reversed = [...items].reverse()
    return (
      reversed.find((i) => i.language.name === 'it') ?? reversed.find((i) => i.language.name === 'en')
    )
  }
  const genus = pick(d.genera)?.genus ?? null
  const text = pick(d.flavor_text_entries)?.flavor_text
  return { genus, text: text ? cleanText(text) : null }
}

async function loadList() {
  if (status.value === 'loading' || status.value === 'ready') return
  status.value = 'loading'
  try {
    const { data } = await api.get<{ results: { name: string; url: string }[] }>('/pokemon', {
      params: { limit: TOTAL },
    })
    list.value = data.results.map((r) => ({ id: idFromUrl(r.url), name: r.name }))
    status.value = 'ready'
  } catch (error) {
    console.error(error)
    status.value = 'error'
  }
}

function loadDetail(id: number) {
  const key = `d${id}`
  if (details.has(id) || inflight.has(key)) return
  const request = limited(() => api.get<ApiPokemon>(`/pokemon/${id}`))
    .then(({ data }) => {
      details.set(id, toDetail(data))
    })
    .catch((error) => console.error(error))
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
}

function loadSpecies(id: number) {
  const key = `s${id}`
  if (species.has(id) || inflight.has(key)) return
  const request = limited(() => api.get<ApiSpecies>(`/pokemon-species/${id}`))
    .then(({ data }) => {
      species.set(id, toSpecies(data))
    })
    .catch((error) => console.error(error))
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
}

function loadType(type: string): Promise<void> {
  const key = `t${type}`
  if (typeMembers.has(type)) return Promise.resolve()
  const running = inflight.get(key)
  if (running) return running
  const request = api
    .get<{ pokemon: { pokemon: { url: string } }[] }>(`/type/${type}`)
    .then(({ data }) => {
      const ids = data.pokemon.map((p) => idFromUrl(p.pokemon.url)).filter((id) => id <= TOTAL)
      typeMembers.set(type, new Set(ids))
    })
    .catch((error) => console.error(error))
    .finally(() => inflight.delete(key))
  inflight.set(key, request)
  return request
}

const FAVORITES_KEY = 'pokedex:favorites'

function readFavorites(): number[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((n): n is number => Number.isInteger(n)) : []
  } catch {
    return []
  }
}

const favorites = ref<number[]>(readFavorites())

watch(
  favorites,
  (value) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(value))
    } catch {
      
    }
  },
  { deep: true },
)

const isFavorite = (id: number) => favorites.value.includes(id)

function toggleFavorite(id: number) {
  favorites.value = isFavorite(id)
    ? favorites.value.filter((f) => f !== id)
    : [...favorites.value, id]
}

const nameOf = (id: number) => list.value[id - 1]?.name ?? ''

export function usePokedex() {
  return {
    list,
    status,
    details,
    species,
    typeMembers,
    favorites,
    loadList,
    loadDetail,
    loadSpecies,
    loadType,
    isFavorite,
    toggleFavorite,
    nameOf,
  }
}
