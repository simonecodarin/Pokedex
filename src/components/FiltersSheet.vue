<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import FilterChips from './FilterChips.vue'
import { lockScroll } from '../utils/scrollLock'

const open = defineModel<boolean>('open', { required: true })
const generation = defineModel<number | null>('generation', { required: true })
const type = defineModel<string | null>('type', { required: true })

defineProps<{ count: number; loading: boolean }>()

const dialog = ref<HTMLDialogElement | null>(null)

watch(open, (isOpen) => {
  const el = dialog.value
  if (!el) return
  if (isOpen && !el.open) {
    lockScroll(true)
    el.showModal()
  } else if (!isOpen && el.open) {
    el.close()
  }
})

function onClose() {
  open.value = false
  lockScroll(false)
}

function onBackdrop(e: MouseEvent) {
  if (e.target === dialog.value) open.value = false
}

function reset() {
  generation.value = null
  type.value = null
}

onBeforeUnmount(() => lockScroll(false))
</script>

<template>
  <dialog ref="dialog" class="sheet" aria-labelledby="filters-title" @close="onClose" @click="onBackdrop">
    <div class="sheet__inner">
      <header class="sheet__head">
        <h2 id="filters-title" class="font-display">Filtri</h2>
        <button type="button" class="sheet__close" aria-label="Chiudi i filtri" @click="open = false">
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </header>

      <div class="sheet__body">
        <FilterChips v-model:generation="generation" v-model:type="type" titles />
      </div>

      <footer class="sheet__foot">
        <button type="button" class="pk-btn" :disabled="generation === null && type === null" @click="reset">
          Azzera
        </button>
        <button type="button" class="pk-btn pk-btn--primary sheet__apply" @click="open = false">
          {{ loading ? 'Cerco…' : `Mostra ${count} Pokémon` }}
        </button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: auto 0 0 0;
  width: 100%;
  max-width: 42rem;
  max-height: 90dvh;
  margin: 0 auto;
  padding: 0;
  border: 2px solid var(--ink);
  border-bottom: 0;
  border-radius: 1.5rem 1.5rem 0 0;
  background: var(--lcd);
  color: var(--ink);
  overflow: hidden;
}

.sheet[open] {
  display: flex;
  animation: rise 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sheet::backdrop {
  background: rgb(27 31 42 / 0.72);
  backdrop-filter: blur(3px);
}

@keyframes rise {
  from {
    transform: translateY(10%);
    opacity: 0;
  }
}

.sheet__inner {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem 0.6rem 1.25rem;
}

.sheet__head h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.sheet__close {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: var(--lcd-card);
  color: var(--ink);
  cursor: pointer;
  box-shadow: 0 3px 0 var(--ink);
}

.sheet__body {
  flex: 1;
  min-height: 0;
  padding: 0.5rem 1.25rem 1.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sheet__foot {
  display: flex;
  gap: 0.6rem;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  border-top: 2px solid var(--ink);
  background: var(--lcd-card);
}

.sheet__apply {
  flex: 1;
}
</style>
