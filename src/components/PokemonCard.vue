<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TypeBadge from './TypeBadge.vue'
import { usePokedex, type PokemonBasic } from '../composables/usePokedex'
import { artworkUrl, padId, spriteUrl, typeColor } from '../utils/pokemon'

const props = defineProps<{ pokemon: PokemonBasic }>()
const emit = defineEmits<{ open: [id: number] }>()

const { details, loadDetail, isFavorite, toggleFavorite } = usePokedex()

const detail = computed(() => details.get(props.pokemon.id))
const tone = computed(() => typeColor(detail.value?.types[0]))
const favorite = computed(() => isFavorite(props.pokemon.id))

const img = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
const failed = ref(false)
const src = computed(() => (failed.value ? spriteUrl(props.pokemon.id) : artworkUrl(props.pokemon.id)))

onMounted(() => {
  loadDetail(props.pokemon.id)
  if (img.value?.complete && img.value.naturalWidth > 0) loaded.value = true
})
</script>

<template>
  <div class="card" :style="{ '--tone': tone }" :data-ready="!!detail">
    <button type="button" class="card__open" @click="emit('open', pokemon.id)">
      <span class="card__num font-display">#{{ padId(pokemon.id) }}</span>

      <span class="card__stage">
        <img
          ref="img"
          :src="src"
          alt=""
          width="475"
          height="475"
          loading="lazy"
          decoding="async"
          class="card__img"
          :class="{ 'is-loaded': loaded }"
          @load="loaded = true"
          @error="failed = true"
        />
      </span>

      <span class="card__name font-display">{{ pokemon.name.replace(/-/g, ' ') }}</span>

      <span class="card__types">
        <template v-if="detail">
          <TypeBadge v-for="t in detail.types" :key="t" :type="t" />
        </template>
        <span v-else class="card__types-skeleton" aria-hidden="true" />
      </span>
    </button>

    <button
      type="button"
      class="card__fav"
      :class="{ 'is-on': favorite }"
      :aria-pressed="favorite"
      :aria-label="favorite ? `Togli ${pokemon.name} dai preferiti` : `Aggiungi ${pokemon.name} ai preferiti`"
      @click="toggleFavorite(pokemon.id)"
    >
      <i class="pi" :class="favorite ? 'pi-heart-fill' : 'pi-heart'" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  border: 2px solid var(--ink);
  border-radius: 1.25rem;
  background: var(--lcd-card);
  box-shadow: 0 4px 0 var(--ink);
  transition:
    background-color 0.45s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

/* il colore del tipo entra appena arrivano i dati */
.card[data-ready='true'] {
  background: color-mix(in oklab, var(--tone) 26%, var(--lcd-card));
}

.card:has(.card__open:focus-visible) {
  outline: 3px solid var(--lens);
  outline-offset: 3px;
}

@media (hover: hover) {
  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 var(--ink);
  }
}

.card:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--ink);
}

.card__open {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.7rem 0.7rem 0.9rem;
  border: 0;
  border-radius: inherit;
  background: none;
  color: inherit;
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.card__open:focus-visible {
  outline: none;
}

.card__num {
  align-self: flex-start;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.6;
}

.card__stage {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1;
}

/* disco colorato dietro il Pokémon */
.card__stage::before {
  content: '';
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: color-mix(in oklab, var(--tone) 55%, transparent);
  transition: background-color 0.45s ease;
}

.card[data-ready='false'] .card__stage::before {
  background: var(--lcd-line);
  opacity: 0.5;
}

.card__img {
  position: relative;
  width: 86%;
  height: 86%;
  object-fit: contain;
  opacity: 0;
  filter: drop-shadow(0 6px 4px rgb(27 31 42 / 0.25));
  transition:
    opacity 0.35s ease,
    transform 0.25s ease;
}

.card__img.is-loaded {
  opacity: 1;
}

@media (hover: hover) {
  .card:hover .card__img {
    transform: scale(1.07);
  }
}

.card__name {
  max-width: 100%;
  overflow: hidden;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.card__types {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3rem;
  min-height: 1.6rem;
}

.card__types-skeleton {
  width: 4.5rem;
  height: 1.4rem;
  border-radius: 999px;
  background: var(--lcd-line);
  opacity: 0.6;
}

.card__fav {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--ink);
  font-size: 1.05rem;
  cursor: pointer;
}

.card__fav.is-on {
  color: var(--shell);
}

@media (hover: hover) {
  .card__fav:hover {
    background: rgb(255 255 255 / 0.6);
  }
}

@media (min-width: 640px) {
  .card__open {
    padding: 0.9rem 0.9rem 1.1rem;
  }
  .card__name {
    font-size: 1.2rem;
  }
}
</style>
