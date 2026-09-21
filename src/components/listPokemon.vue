<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PokemonCard from './PokemonCard.vue'
import PokemonModal from './PokemonModal.vue'
import FilterChips from './FilterChips.vue'
import FiltersSheet from './FiltersSheet.vue'
import { usePokedex } from '../composables/usePokedex'
import { GENERATIONS, onColor, typeColor, typeLabel } from '../utils/pokemon'

const { list, status, favorites, typeMembers, loadList, loadType } = usePokedex()

const PAGE = 48

const search = ref('')
const generation = ref<number | null>(null)
const type = ref<string | null>(null)
const onlyFavorites = ref(false)
const visible = ref(PAGE)
const openId = ref<number | null>(null)
const sheetOpen = ref(false)
const typeLoading = ref(false)
const input = ref<HTMLInputElement | null>(null)

/* Su schermi stretti il campo è piccolo: placeholder più corto */
const mq = window.matchMedia("(min-width: 40rem)")
const wide = ref(mq.matches)
const placeholder = computed(() => (wide.value ? 'Cerca per nome o numero' : 'Nome o numero'))
const onMq = (e: MediaQueryListEvent) => (wide.value = e.matches)
mq.addEventListener('change', onMq)

/* ----------------------------- Filtri ------------------------------ */
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
  const range = GENERATIONS.find((g) => g.id === generation.value)
  const members = type.value ? typeMembers.get(type.value) : null
  const favs = onlyFavorites.value ? new Set(favorites.value) : null
  const asNumber = /^\d+$/.test(q) ? Number(q) : null

  return list.value.filter((p) => {
    if (range && (p.id < range.from || p.id > range.to)) return false
    if (type.value && !members?.has(p.id)) return false
    if (favs && !favs.has(p.id)) return false
    if (!q) return true
    return asNumber !== null ? p.id === asNumber : p.name.includes(q)
  })
})

const generationLabel = computed(() => GENERATIONS.find((g) => g.id === generation.value)?.label ?? '')
const activeFilters = computed(() => (generation.value !== null ? 1 : 0) + (type.value ? 1 : 0))

const shown = computed(() => filtered.value.slice(0, visible.value))
const filteredIds = computed(() => filtered.value.map((p) => p.id))
const hasFilters = computed(
  () => !!search.value.trim() || generation.value !== null || !!type.value || onlyFavorites.value,
)

watch([search, generation, type, onlyFavorites], () => {
  visible.value = PAGE
})

watch(type, async (t) => {
  if (!t || typeMembers.has(t)) return
  typeLoading.value = true
  await loadType(t)
  if (type.value === t) typeLoading.value = false
})

function resetFilters() {
  search.value = ''
  generation.value = null
  type.value = null
  onlyFavorites.value = false
}

function pickRandom() {
  const pool = filtered.value
  if (!pool.length) return
  openId.value = pool[Math.floor(Math.random() * pool.length)]!.id
}

/* --------------------- Caricamento progressivo --------------------- */
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

watch(sentinel, (el, previous) => {
  if (previous) observer?.unobserve(previous)
  if (el) observer?.observe(el)
})

/* ------------------------ Scorciatoia "/" -------------------------- */
function onSlash(e: KeyboardEvent) {
  if (e.key !== '/' || openId.value !== null) return
  const el = e.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
  e.preventDefault()
  input.value?.focus()
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) visible.value += PAGE
    },
    { rootMargin: '700px 0px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
  window.addEventListener('keydown', onSlash)
})

onBeforeUnmount(() => {
  mq.removeEventListener('change', onMq)
  observer?.disconnect()
  window.removeEventListener('keydown', onSlash)
})
</script>

<template>
  <section class="screen" aria-label="Elenco dei Pokémon">
    <div class="glass">
      <!-- Barra di ricerca: resta agganciata in alto mentre si scorre -->
      <div class="toolbar">
        <label class="search">
          <i class="pi pi-search search__icon" aria-hidden="true" />
          <input
            ref="input"
            v-model="search"
            type="search"
            class="search__input"
            :placeholder="placeholder"
            aria-label="Cerca un Pokémon per nome o numero"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="search"
          />
          <button
            v-if="search"
            type="button"
            class="search__clear"
            aria-label="Cancella la ricerca"
            @click="search = ''"
          >
            <i class="pi pi-times" aria-hidden="true" />
          </button>
          <kbd v-else class="search__kbd" aria-hidden="true">/</kbd>
        </label>

        <button
          type="button"
          class="pk-btn"
          :class="{ 'is-on': onlyFavorites }"
          :aria-pressed="onlyFavorites"
          aria-label="Mostra solo i preferiti"
          @click="onlyFavorites = !onlyFavorites"
        >
          <i class="pi" :class="onlyFavorites ? 'pi-heart-fill' : 'pi-heart'" aria-hidden="true" />
          <span class="btn__label">Preferiti</span>
          <span v-if="favorites.length" class="btn__count font-display">{{ favorites.length }}</span>
        </button>

        <button
          type="button"
          class="pk-btn pk-btn--primary"
          :disabled="!filtered.length"
          aria-label="Apri un Pokémon a caso"
          @click="pickRandom"
        >
          <span aria-hidden="true">🎲</span>
          <span class="btn__label">A caso</span>
        </button>
      </div>

      <!-- Filtri: su desktop le chip sono sempre visibili, su mobile stanno in un pannello -->
      <div class="filters-desktop">
        <FilterChips v-model:generation="generation" v-model:type="type" />
      </div>

      <div class="filterbar">
        <button type="button" class="pk-btn" :class="{ 'is-on': activeFilters > 0 }" aria-haspopup="dialog" @click="sheetOpen = true">
          <i class="pi pi-sliders-h" aria-hidden="true" />
          Filtri
          <span v-if="activeFilters" class="filter-badge font-display">{{ activeFilters }}</span>
        </button>
        <button
          v-if="generation !== null"
          type="button"
          class="pk-chip is-on"
          :aria-label="`Togli il filtro ${generationLabel}`"
          @click="generation = null"
        >
          {{ generationLabel }}
          <i class="pi pi-times" aria-hidden="true" />
        </button>
        <button
          v-if="type"
          type="button"
          class="pk-chip pk-chip--type is-on"
          :style="{ '--tone': typeColor(type), '--on-tone': onColor(typeColor(type)) }"
          :aria-label="`Togli il filtro ${typeLabel(type)}`"
          @click="type = null"
        >
          {{ typeLabel(type) }}
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <FiltersSheet
        v-model:open="sheetOpen"
        v-model:generation="generation"
        v-model:type="type"
        :count="filtered.length"
        :loading="typeLoading"
      />

      <p v-if="status === 'ready'" class="count" role="status">
        <template v-if="typeLoading">Cerco i Pokémon di tipo {{ typeLabel(type ?? '') }}…</template>
        <template v-else>{{ shown.length }} di {{ filtered.length }} Pokémon</template>
      </p>

      <!-- Errore -->
      <div v-if="status === 'error'" class="state" role="alert">
        <p class="state__title font-display">Nessun segnale dalla PokéAPI</p>
        <p class="state__text">Controlla la connessione e riprova.</p>
        <button type="button" class="pk-btn pk-btn--primary" @click="loadList">Riprova</button>
      </div>

      <!-- Caricamento -->
      <ul v-else-if="status !== 'ready' || typeLoading" class="grid" aria-busy="true">
        <li v-for="n in 12" :key="n" class="skeleton" />
      </ul>

      <!-- Nessun risultato -->
      <div v-else-if="!filtered.length" class="state">
        <p class="state__title font-display">Nessun Pokémon trovato</p>
        <p class="state__text">
          {{ onlyFavorites && !favorites.length
            ? 'Tocca il cuore su una card per salvarla tra i preferiti.'
            : 'Prova con un altro nome o togli qualche filtro.' }}
        </p>
        <button v-if="hasFilters" type="button" class="pk-btn pk-btn--primary" @click="resetFilters">
          Azzera i filtri
        </button>
      </div>

      <!-- Elenco -->
      <template v-else>
        <ul class="grid">
          <li v-for="p in shown" :key="p.id">
            <PokemonCard :pokemon="p" @open="openId = $event" />
          </li>
        </ul>

        <div v-if="shown.length < filtered.length" ref="sentinel" class="more">
          <button type="button" class="pk-btn" @click="visible += PAGE">
            Mostra altri {{ Math.min(PAGE, filtered.length - shown.length) }}
          </button>
        </div>
      </template>
    </div>

    <PokemonModal :id="openId" :ids="filteredIds" @close="openId = null" @go="openId = $event" />
  </section>
</template>

<style scoped>
/* Cornice scura + display LCD, come lo schermo di un Pokédex */
.screen {
  padding: clamp(0.4rem, 1.6vw, 0.9rem);
  border-radius: 1.75rem;
  background: var(--ink);
  box-shadow: 0 8px 0 rgb(0 0 0 / 0.28);
}

.glass {
  min-height: 70vh;
  padding: clamp(0.75rem, 2.5vw, 1.5rem);
  border-radius: 1.25rem;
  background: var(--lcd);
  box-shadow: inset 0 6px 18px rgb(27 31 42 / 0.14);
}

/* ------------------------------ Toolbar ------------------------------ */
.toolbar {
  position: sticky;
  top: 0.6rem;
  z-index: 20;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px solid var(--ink);
  border-radius: 1.1rem;
  background: var(--lcd-card);
  box-shadow: 0 4px 0 var(--ink);
}

.search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search__icon {
  position: absolute;
  top: 50%;
  left: 0.9rem;
  transform: translateY(-50%);
  opacity: 0.6;
  pointer-events: none;
}

.search__input {
  width: 100%;
  height: 2.75rem;
  padding: 0 0.75rem 0 2.5rem;
  border: 2px solid var(--ink);
  border-radius: 0.8rem;
  background: #fff;
  color: var(--ink);
  font: 500 1rem var(--font-body);
  appearance: none;
}

/* spazio per la "x" solo quando c'è del testo */
.search__input:not(:placeholder-shown) {
  padding-right: 2.75rem;
}

@media (hover: hover) and (min-width: 48rem) {
  .search__input {
    padding-right: 2.75rem;
  }
}

.search__input::placeholder {
  color: rgb(27 31 42 / 0.5);
}

.search__input::-webkit-search-cancel-button {
  display: none;
}

.search__clear {
  position: absolute;
  top: 50%;
  right: 0.25rem;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--ink);
  transform: translateY(-50%);
  cursor: pointer;
}

.search__kbd {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  display: none;
  padding: 0.05rem 0.5rem;
  border: 1.5px solid var(--lcd-line);
  border-radius: 0.4rem;
  font: 600 0.85rem var(--font-display);
  opacity: 0.7;
  transform: translateY(-50%);
  pointer-events: none;
}

@media (hover: hover) and (min-width: 48rem) {
  .search__kbd {
    display: block;
  }
}

/* ---------------------- Pulsanti della barra ---------------------- */
.toolbar .pk-btn {
  position: relative;
}

.btn__label {
  display: none;
}

/* su mobile il contatore sta "appeso" all'angolo, così il campo di ricerca resta largo */
.btn__count {
  position: absolute;
  top: -0.5rem;
  right: -0.4rem;
  min-width: 1.35rem;
  padding: 0.1rem 0.35rem;
  border: 2px solid var(--lcd-card);
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 0.75rem;
  line-height: 1.2;
  text-align: center;
}

@media (min-width: 40rem) {
  .btn__label {
    display: inline;
  }

  .btn__count {
    position: static;
    border: 0;
    font-size: 0.8rem;
  }
}

/* ------------------------------- Filtri ------------------------------- */
.filters-desktop {
  display: none;
  margin-top: 1rem;
}

.filterbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.filterbar .pk-btn {
  height: 2.5rem;
}

.filterbar .pk-chip {
  min-height: 2.5rem;
}

.filterbar .pk-chip i {
  font-size: 0.7rem;
}

.filter-badge {
  min-width: 1.4rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 0.8rem;
  text-align: center;
}

@media (min-width: 64rem) {
  .filters-desktop {
    display: block;
  }

  .filterbar {
    display: none;
  }
}

.count {
  margin: 0.9rem 0 0;
  font-size: 0.9rem;
  opacity: 0.75;
}

/* ------------------------------- Griglia ------------------------------ */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1rem 0 0;
  padding: 0 0 0.4rem;
  list-style: none;
}

@media (min-width: 40rem) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.1rem;
  }
}

@media (min-width: 64rem) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 80rem) {
  .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.skeleton {
  aspect-ratio: 3 / 4;
  border: 2px solid var(--lcd-line);
  border-radius: 1.25rem;
  background: var(--lcd-card);
  opacity: 0.7;
  animation: pulse 1.1s ease-in-out infinite alternate;
}

@keyframes pulse {
  to {
    opacity: 0.3;
  }
}

.more {
  display: grid;
  place-items: center;
  padding: 1.5rem 0 0.5rem;
}

/* --------------------------- Errore / vuoto --------------------------- */
.state {
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 4rem 1rem;
  text-align: center;
}

.state__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}

.state__text {
  max-width: 26rem;
  margin: 0 0 0.6rem;
  line-height: 1.5;
}
</style>
