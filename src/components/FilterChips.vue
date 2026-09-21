<script setup lang="ts">
import { GENERATIONS, TYPE_ORDER, onColor, typeColor, typeLabel } from '../utils/pokemon'

const generation = defineModel<number | null>('generation', { required: true })
const type = defineModel<string | null>('type', { required: true })

defineProps<{ titles?: boolean }>()
</script>

<template>
  <div class="groups">
    <div>
      <h3 v-if="titles" class="group__title font-display">Regione</h3>
      <div class="chips" role="group" aria-label="Filtra per regione">
        <button
          type="button"
          class="pk-chip"
          :class="{ 'is-on': generation === null }"
          :aria-pressed="generation === null"
          @click="generation = null"
        >
          Tutte le regioni
        </button>
        <button
          v-for="g in GENERATIONS"
          :key="g.id"
          type="button"
          class="pk-chip"
          :class="{ 'is-on': generation === g.id }"
          :aria-pressed="generation === g.id"
          :title="`Generazione ${g.id}: dal n. ${g.from} al n. ${g.to}`"
          @click="generation = generation === g.id ? null : g.id"
        >
          {{ g.label }}
        </button>
      </div>
    </div>

    <div>
      <h3 v-if="titles" class="group__title font-display">Tipo</h3>
      <div class="chips" role="group" aria-label="Filtra per tipo">
        <button
          type="button"
          class="pk-chip"
          :class="{ 'is-on': type === null }"
          :aria-pressed="type === null"
          @click="type = null"
        >
          Tutti i tipi
        </button>
        <button
          v-for="t in TYPE_ORDER"
          :key="t"
          type="button"
          class="pk-chip pk-chip--type"
          :class="{ 'is-on': type === t }"
          :aria-pressed="type === t"
          :style="{ '--tone': typeColor(t), '--on-tone': onColor(typeColor(t)) }"
          @click="type = type === t ? null : t"
        >
          <span class="pk-chip__dot" aria-hidden="true" />
          {{ typeLabel(t) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups {
  display: grid;
  gap: 0.7rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.group__title {
  margin: 0 0 0.55rem;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
}
</style>
