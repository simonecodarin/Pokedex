<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import TypeBadge from './TypeBadge.vue'
import { usePokedex } from '../composables/usePokedex'
import { STAT_LABELS, artworkUrl, padId, typeColor } from '../utils/pokemon'
import { lockScroll } from '../utils/scrollLock'

const props = defineProps<{ id: number | null; ids: number[] }>()
const emit = defineEmits<{ close: []; go: [id: number] }>()

const { details, species, loadDetail, loadSpecies, isFavorite, toggleFavorite, nameOf } =
  usePokedex()

const cur = ref(props.id ?? 1)

const detail = computed(() => details.get(cur.value))
const info = computed(() => species.get(cur.value))
const title = computed(() => nameOf(cur.value).replace(/-/g, ' '))
const tone = computed(() => typeColor(detail.value?.types[0]))
const favorite = computed(() => isFavorite(cur.value))

const shiny = ref(false)
const artSrc = computed(() =>
  shiny.value && detail.value?.shiny
    ? detail.value.shiny
    : (detail.value?.artwork ?? artworkUrl(cur.value)),
)

const total = computed(() => detail.value?.stats.reduce((sum, s) => sum + s.value, 0) ?? 0)
const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 1 })
const pct = (value: number) => Math.min(100, (value / 180) * 100)

const index = computed(() => props.ids.indexOf(cur.value))
const canNavigate = computed(() => index.value >= 0 && props.ids.length > 1)
const prevId = computed(() =>
  canNavigate.value ? props.ids[(index.value - 1 + props.ids.length) % props.ids.length]! : null,
)
const nextId = computed(() =>
  canNavigate.value ? props.ids[(index.value + 1) % props.ids.length]! : null,
)

const playing = ref(false)
let audio: HTMLAudioElement | null = null

function stopCry() {
  audio?.pause()
  audio = null
  playing.value = false
}

function playCry() {
  const url = detail.value?.cry
  if (!url) return
  stopCry()
  audio = new Audio(url)
  audio.volume = 0.5
  audio.onended = () => (playing.value = false)
  playing.value = true
  audio.play().catch(() => (playing.value = false))
}

const panel = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
let opener: HTMLElement | null = null

watch(
  () => props.id,
  (id, previous) => {
    stopCry()
    shiny.value = false
    if (id === null) {
      lockScroll(false)
      if (previous !== null && previous !== undefined) opener?.focus()
      return
    }
    cur.value = id
    loadDetail(id)
    loadSpecies(id)
    if (previous === null || previous === undefined) {
      opener = document.activeElement as HTMLElement | null
      lockScroll(true)
      nextTick(() => closeBtn.value?.focus())
    }
  },
  { immediate: true },
)

function trapTab(e: KeyboardEvent) {
  const nodes = panel.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  )
  if (!nodes?.length) return
  const first = nodes[0]!
  const last = nodes[nodes.length - 1]!
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

function onKey(e: KeyboardEvent) {
  if (props.id === null) return
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft' && prevId.value) emit('go', prevId.value)
  else if (e.key === 'ArrowRight' && nextId.value) emit('go', nextId.value)
  else if (e.key === 'Tab') trapTab(e)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  lockScroll(false)
  stopCry()
})

let startX = 0
let startY = 0
const onTouchStart = (e: TouchEvent) => {
  startX = e.touches[0]!.clientX
  startY = e.touches[0]!.clientY
}
const onTouchEnd = (e: TouchEvent) => {
  const dx = e.changedTouches[0]!.clientX - startX
  const dy = e.changedTouches[0]!.clientY - startY
  if (Math.abs(dx) < 70 || Math.abs(dy) > 50) return
  if (dx < 0 && nextId.value) emit('go', nextId.value)
  if (dx > 0 && prevId.value) emit('go', prevId.value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="id !== null" class="modal" @click.self="emit('close')">
        <div
          ref="panel"
          class="panel"
          role="dialog"
          aria-modal="true"
          :aria-label="`Scheda di ${title}`"
          :style="{ '--tone': tone }"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <button
            ref="closeBtn"
            type="button"
            class="close"
            aria-label="Chiudi la scheda"
            @click="emit('close')"
          >
            <i class="pi pi-times" aria-hidden="true" />
          </button>

          <div class="scroll">
            <div :key="cur" class="body">
              <div class="stage">
                <span class="stage__num font-display" aria-hidden="true">{{ padId(cur) }}</span>

                <div class="stage__art">
                  <span class="stage__disc" aria-hidden="true" />
                  <img class="stage__img" :src="artSrc" alt="" width="475" height="475" />
                  <span class="stage__scan" aria-hidden="true" />
                </div>

                <div class="stage__actions">
                  <button type="button" class="pill" :disabled="!detail?.cry" @click="playCry">
                    <i class="pi pi-volume-up" aria-hidden="true" />
                    {{ playing ? 'In ascolto…' : 'Verso' }}
                  </button>
                  <button
                    type="button"
                    class="pill"
                    :class="{ 'is-on': shiny }"
                    :aria-pressed="shiny"
                    :disabled="!detail?.shiny"
                    @click="shiny = !shiny"
                  >
                    <span aria-hidden="true">✨</span> Shiny
                  </button>
                  <button
                    type="button"
                    class="pill"
                    :class="{ 'is-fav': favorite }"
                    :aria-pressed="favorite"
                    @click="toggleFavorite(cur)"
                  >
                    <i class="pi" :class="favorite ? 'pi-heart-fill' : 'pi-heart'" aria-hidden="true" />
                    Preferito
                  </button>
                </div>
              </div>

              <div class="info">
                <p class="info__num font-display">#{{ padId(cur) }}</p>
                <h2 class="info__name font-display">{{ title }}</h2>
                <p v-if="info?.genus" class="info__genus">{{ info.genus }}</p>

                <template v-if="detail">
                  <div class="info__types">
                    <TypeBadge v-for="t in detail.types" :key="t" :type="t" large />
                  </div>

                  <p v-if="info?.text" class="info__text">{{ info.text }}</p>

                  <dl class="facts">
                    <div>
                      <dt>Altezza</dt>
                      <dd class="font-display">{{ fmt(detail.height) }} m</dd>
                    </div>
                    <div>
                      <dt>Peso</dt>
                      <dd class="font-display">{{ fmt(detail.weight) }} kg</dd>
                    </div>
                    <div v-if="detail.baseExperience">
                      <dt>Esperienza base</dt>
                      <dd class="font-display">{{ detail.baseExperience }}</dd>
                    </div>
                  </dl>

                  <h3 class="info__h">Statistiche base</h3>
                  <ul class="stats">
                    <li v-for="(s, i) in detail.stats" :key="s.key">
                      <span class="stats__label">{{ STAT_LABELS[s.key] ?? s.key }}</span>
                      <span class="stats__value font-display">{{ s.value }}</span>
                      <span class="stats__track">
                        <i
                          class="stats__bar"
                          :style="{ width: pct(s.value) + '%', animationDelay: 0.55 + i * 0.07 + 's' }"
                        />
                      </span>
                    </li>
                  </ul>
                  <p class="stats__total">
                    Totale <strong class="font-display">{{ total }}</strong>
                  </p>

                  <h3 class="info__h">Abilità</h3>
                  <ul class="abilities">
                    <li v-for="a in detail.abilities" :key="a.name">
                      {{ a.name }}<small v-if="a.hidden"> (nascosta)</small>
                    </li>
                  </ul>
                </template>

                <div v-else class="skeleton" aria-busy="true">
                  <span /><span /><span /><span />
                </div>
              </div>
            </div>
          </div>

          <nav v-if="prevId && nextId" class="pager" aria-label="Altri Pokémon">
            <button type="button" class="pager__btn" @click="emit('go', prevId)">
              <i class="pi pi-chevron-left" aria-hidden="true" />
              <span class="pager__text">
                <small class="font-display">#{{ padId(prevId) }}</small>
                {{ nameOf(prevId).replace(/-/g, ' ') }}
              </span>
            </button>
            <button type="button" class="pager__btn pager__btn--next" @click="emit('go', nextId)">
              <span class="pager__text">
                <small class="font-display">#{{ padId(nextId) }}</small>
                {{ nameOf(nextId).replace(/-/g, ' ') }}
              </span>
              <i class="pi pi-chevron-right" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(27 31 42 / 0.78);
  backdrop-filter: blur(3px);
}

.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 66rem;
  max-height: 94dvh;
  border: 2px solid var(--ink);
  border-bottom: 0;
  border-radius: 1.5rem 1.5rem 0 0;
  background: var(--lcd);
  color: var(--ink);
  overflow: hidden;
}

.close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--lcd-card);
  color: var(--ink);
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 3px 0 var(--ink);
}

.close:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--ink) transparent;
}

.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 3rem 1rem 1.1rem;
  background: color-mix(in oklab, var(--tone) 55%, var(--lcd));
  border-bottom: 2px solid var(--ink);
  overflow: hidden;
  transition: background-color 0.4s ease;
}

.stage__num {
  position: absolute;
  top: -0.15em;
  left: 0.5rem;
  font-size: clamp(6rem, 30vw, 11rem);
  font-weight: 700;
  line-height: 1;
  color: rgb(27 31 42 / 0.09);
  pointer-events: none;
  user-select: none;
}

.stage__art {
  position: relative;
  width: min(54vw, 15rem);
  aspect-ratio: 1;
}

.stage__disc {
  position: absolute;
  inset: 6%;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: color-mix(in oklab, var(--tone) 40%, var(--lcd-card));
}

.stage__img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 8px rgb(27 31 42 / 0.3));
  animation: reveal 0.9s linear both;
}

.stage__scan {
  position: absolute;
  left: -4%;
  right: -4%;
  top: 0;
  height: 3px;
  border-radius: 3px;
  background: var(--lens);
  box-shadow: 0 0 14px 4px rgb(44 181 245 / 0.65);
  animation: sweep 0.9s linear both;
  pointer-events: none;
}

@keyframes reveal {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes sweep {
  from {
    top: 0;
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  to {
    top: 100%;
    opacity: 0;
  }
}

.stage__actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.5rem;
  padding: 0.4rem 0.95rem;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: var(--lcd-card);
  color: var(--ink);
  font: 700 0.9rem/1 var(--font-body);
  cursor: pointer;
  box-shadow: 0 3px 0 var(--ink);
}

.pill:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.pill:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pill.is-on {
  background: #ffe97a;
}

.pill.is-fav {
  background: var(--shell);
  color: #fff;
}

.info {
  padding: 1.25rem 1.25rem 1.75rem;
}

.info__num {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.6;
}

.info__name {
  margin: 0;
  font-size: clamp(2rem, 7vw, 3rem);
  font-weight: 700;
  line-height: 1.05;
  text-transform: capitalize;
}

.info__genus {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  opacity: 0.75;
}

.info__types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}

.info__text {
  max-width: 34rem;
  margin: 1rem 0 0;
  font-size: 1rem;
  line-height: 1.6;
}

.facts {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  margin: 1.25rem 0 0;
  border-block: 2px solid var(--ink);
}

.facts > div {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.55rem 0.65rem;
}

.facts > div + div {
  border-left: 2px solid var(--lcd-line);
}

.facts dt {
  font-size: 0.78rem;
  line-height: 1.25;
  opacity: 0.7;
}

.facts dd {
  margin: 0.1rem 0 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.info__h {
  margin: 1.2rem 0 0.55rem;
  font: 700 1.1rem/1.2 var(--font-display);
}

.stats {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stats li {
  display: grid;
  grid-template-columns: 6.6rem 2.4rem 1fr;
  align-items: center;
  gap: 0.5rem;
}

.stats__label {
  font-size: 0.9rem;
}

.stats__value {
  font-weight: 700;
  text-align: right;
}

.stats__track {
  height: 0.8rem;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: var(--lcd-card);
  overflow: hidden;
}

.stats__bar {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--tone);
  border-right: 2px solid var(--ink);
  animation: fill 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
}

@keyframes fill {
  from {
    width: 0;
  }
}

.stats__total {
  margin: 0.7rem 0 0;
  font-size: 0.9rem;
  text-align: right;
}

.abilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.abilities li {
  padding: 0.3rem 0.8rem;
  border: 2px solid var(--ink);
  border-radius: 0.75rem;
  background: var(--lcd-card);
  font-size: 0.9rem;
  text-transform: capitalize;
}

.abilities small {
  text-transform: none;
  opacity: 0.7;
}

.skeleton {
  display: grid;
  gap: 0.8rem;
  margin-top: 1.25rem;
}

.skeleton span {
  height: 1.5rem;
  border-radius: 0.5rem;
  background: var(--lcd-line);
  opacity: 0.6;
  animation: pulse 1.2s ease-in-out infinite alternate;
}

.skeleton span:nth-child(1) {
  width: 40%;
}
.skeleton span:nth-child(2) {
  width: 90%;
}
.skeleton span:nth-child(3) {
  width: 75%;
}
.skeleton span:nth-child(4) {
  width: 60%;
}

@keyframes pulse {
  to {
    opacity: 0.25;
  }
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem calc(0.6rem + env(safe-area-inset-bottom));
  border-top: 2px solid var(--ink);
  background: var(--lcd-card);
}

.pager__btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.3rem 0.6rem;
  border: 0;
  border-radius: 0.75rem;
  background: none;
  color: var(--ink);
  font: 500 0.95rem/1.2 var(--font-body);
  cursor: pointer;
}

.pager__btn--next {
  text-align: right;
}

.pager__btn:hover {
  background: rgb(27 31 42 / 0.08);
}

.pager__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: capitalize;
}

.pager__text small {
  opacity: 0.6;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: background-color 0.25s ease;
}

.sheet-enter-active .panel,
.sheet-leave-active .panel {
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  background-color: rgb(27 31 42 / 0);
}

.sheet-enter-from .panel,
.sheet-leave-to .panel {
  transform: translateY(8%);
  opacity: 0;
}

@media (min-width: 48rem) {
  .modal {
    align-items: center;
    padding: 2rem;
  }

  .panel {
    max-height: min(92dvh, 54rem);
    border-bottom: 2px solid var(--ink);
    border-radius: 1.75rem;
    box-shadow: 0 10px 0 rgb(0 0 0 / 0.3);
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    min-height: 100%;
  }

  .stage {
    justify-content: center;
    padding: 3rem 1.5rem 2rem;
    border-right: 2px solid var(--ink);
    border-bottom: 0;
  }

  .stage__art {
    width: min(100%, 21rem);
  }

  .info {
    padding: 2.5rem 2rem 1.5rem;
  }

  .stats li {
    grid-template-columns: 7rem 2.6rem 1fr;
  }
}
</style>
