<script setup lang="ts">
import { computed } from 'vue'
import { onColor, typeColor, typeLabel } from '../utils/pokemon'

const props = defineProps<{ type: string; large?: boolean }>()

const bg = computed(() => typeColor(props.type))
</script>

<template>
  <span
    class="badge"
    :class="{ 'badge--lg': large }"
    :style="{ background: bg, color: onColor(bg) }"
  >
    {{ typeLabel(type) }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.65rem;
  border: 1.5px solid var(--ink);
  border-radius: 999px;
  font: 700 0.75rem/1.5 var(--font-body);
  white-space: nowrap;
}

.badge--lg {
  padding: 0.2rem 0.95rem;
  font-size: 0.9rem;
}
</style>
