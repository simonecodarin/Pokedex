<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ListPokemon from './components/listPokemon.vue'
import { usePokedex } from './composables/usePokedex'

const { status, list, loadList } = usePokedex()

onMounted(loadList)

const message = computed(() => {
  switch (status.value) {
    case 'ready':
      return `${list.value.length} Pokémon registrati`
    case 'error':
      return 'Nessun segnale dalla PokéAPI'
    default:
      return 'Sto caricando il Pokédex…'
  }
})
</script>

<template>
  <div class="shell">
    <header class="hero">
      <div class="hero__inner">
        <!-- La lente e i LED raccontano lo stato: giallo = carico, verde = pronto, rosso = errore -->
        <div class="lens" :data-state="status" aria-hidden="true">
          <span class="lens__glass" />
        </div>

        <div class="hero__text">
          <h1 class="title font-display">Pokédex</h1>
          <p class="status" role="status">{{ message }}</p>
        </div>

        <div class="leds" :data-state="status" aria-hidden="true">
          <i class="led led--red" />
          <i class="led led--yellow" />
          <i class="led led--green" />
        </div>
      </div>
    </header>

    <main class="wrap">
      <ListPokemon />
    </main>

    <footer class="foot">
      Dati e immagini da PokéAPI. Pokémon è un marchio di Nintendo, Game Freak e Creatures.
    </footer>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  background: var(--shell);
}

.hero {
  border-bottom: 5px solid var(--ink);
  background: var(--shell-hi);
}

.hero__inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 40rem) {
  .hero__inner {
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
  }
}

/* ------------------------------- Lente ------------------------------- */
.lens {
  position: relative;
  flex: none;
  width: clamp(3.75rem, 14vw, 6rem);
  aspect-ratio: 1;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background: #fff;
  box-shadow:
    0 4px 0 rgb(0 0 0 / 0.3),
    inset 0 -5px 8px rgb(0 0 0 / 0.14);
}

.lens__glass {
  position: absolute;
  inset: 10%;
  border: 3px solid var(--ink);
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 27%, rgb(255 255 255 / 0.95) 0 7%, transparent 8%),
    radial-gradient(ellipse at 30% 24%, rgb(255 255 255 / 0.4), transparent 48%),
    radial-gradient(circle at 50% 58%, #5cd0ff, #1490e0 58%, #0a5aa8);
  box-shadow:
    inset 0 -6px 12px rgb(0 30 90 / 0.5),
    0 0 0 0 rgb(44 181 245 / 0);
}

.lens[data-state='ready'] .lens__glass {
  animation: flash 1.1s ease-out 1;
  box-shadow:
    inset 0 -6px 12px rgb(0 30 90 / 0.5),
    0 0 18px 3px rgb(44 181 245 / 0.55);
}

.lens[data-state='loading'] .lens__glass,
.lens[data-state='idle'] .lens__glass {
  animation: breathe 1.2s ease-in-out infinite alternate;
}

.lens[data-state='error'] .lens__glass {
  filter: grayscale(0.85) brightness(0.8);
}

@keyframes flash {
  0% {
    box-shadow:
      inset 0 -6px 12px rgb(0 30 90 / 0.5),
      0 0 0 0 rgb(44 181 245 / 0.9);
  }
  40% {
    box-shadow:
      inset 0 -6px 12px rgb(0 30 90 / 0.5),
      0 0 46px 14px rgb(44 181 245 / 0.85);
  }
}

@keyframes breathe {
  from {
    box-shadow:
      inset 0 -6px 12px rgb(0 30 90 / 0.5),
      0 0 4px 0 rgb(44 181 245 / 0.2);
  }
  to {
    box-shadow:
      inset 0 -6px 12px rgb(0 30 90 / 0.5),
      0 0 22px 5px rgb(44 181 245 / 0.6);
  }
}

/* ------------------------------ Titolo ------------------------------- */
.hero__text {
  min-width: 0;
}

.title {
  margin: 0;
  color: #fff;
  font-size: clamp(2.4rem, 9vw, 4.6rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  /* effetto "serigrafia" sul guscio */
  text-shadow:
    0 3px 0 var(--shell-dark),
    0 6px 0 rgb(0 0 0 / 0.18);
}

.status {
  margin: 0.5rem 0 0;
  color: rgb(255 255 255 / 0.92);
  font-size: 0.95rem;
  font-weight: 500;
}

/* -------------------------------- LED --------------------------------- */
.leds {
  display: flex;
  gap: 0.45rem;
  margin-left: auto;
  align-self: flex-start;
  padding-top: 0.15rem;
}

.led {
  width: 0.8rem;
  height: 0.8rem;
  border: 2px solid var(--ink);
  border-radius: 50%;
  background: rgb(27 31 42 / 0.35);
}

@media (min-width: 40rem) {
  .led {
    width: 1rem;
    height: 1rem;
  }
}

.leds[data-state='error'] .led--red {
  background: var(--led-red);
  box-shadow: 0 0 10px 2px rgb(255 75 62 / 0.8);
  animation: blink 0.7s steps(2, jump-none) infinite;
}

.leds[data-state='loading'] .led--yellow,
.leds[data-state='idle'] .led--yellow {
  background: var(--led-yellow);
  box-shadow: 0 0 10px 2px rgb(255 210 63 / 0.8);
  animation: blink 0.9s steps(2, jump-none) infinite;
}

.leds[data-state='ready'] .led--green {
  background: var(--led-green);
  box-shadow: 0 0 10px 2px rgb(61 220 132 / 0.8);
}

@keyframes blink {
  50% {
    opacity: 0.25;
  }
}

/* ------------------------------ Contenuto ----------------------------- */
.wrap {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 0.75rem 2rem;
}

@media (min-width: 40rem) {
  .wrap {
    padding: 1.75rem 1.5rem 2.5rem;
  }
}

.foot {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem 2rem;
  color: rgb(255 255 255 / 0.85);
  font-size: 0.8rem;
  text-align: center;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=DM+Sans:wght@400;500;700&display=swap');

/*
  Stili globali del Pokédex (palette, font, focus).
  Stanno qui dentro App.vue di proposito: così non serve importare nessun altro file CSS.
  Palette ispirata al Pokédex "fisico": guscio rosso, bordo/schermo scuro (ink),
  display LCD verde-grigio, lente blu.
*/
:root {
  --shell: #d8321f;
  --shell-hi: #e8442e;
  --shell-dark: #a92112;
  --ink: #1b1f2a;
  --lcd: #e3ead8;
  --lcd-card: #f4f7ee;
  --lcd-line: #b7c2a8;
  --lens: #2cb5f5;
  --led-red: #ff4b3e;
  --led-yellow: #ffd23f;
  --led-green: #3ddc84;

  --font-display: 'Chakra Petch', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
}

/* "html body" ha più peso di un semplice "body": vince sugli stili del vecchio main.css */
html body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--shell);
  -webkit-font-smoothing: antialiased;
}

/*
  Un solo font per tutta l'app, anche se il vecchio main.css ne forza un altro con "*".
  Le icone (.pi) restano escluse, altrimenti perderebbero il loro font.
*/
:where(.shell, .modal) *:not(.pi) {
  font-family: var(--font-body);
}

.font-display {
  font-family: var(--font-display);
}

/* ---- Elementi condivisi: pulsanti "a tasto" e chip ---- */
.pk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 2.75rem;
  height: 2.75rem;
  padding: 0 0.85rem;
  border: 2px solid var(--ink);
  border-radius: 0.8rem;
  background: #fff;
  color: var(--ink);
  font: 700 0.95rem/1 var(--font-body);
  cursor: pointer;
  box-shadow: 0 3px 0 var(--ink);
  transition:
    transform 0.1s ease,
    box-shadow 0.1s ease;
}

.pk-btn:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--ink);
}

.pk-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pk-btn.is-on {
  background: var(--shell);
  color: #fff;
}

.pk-btn--primary {
  background: var(--lens);
}

.pk-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0.3rem 0.85rem;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: var(--lcd-card);
  color: var(--ink);
  font: 600 0.9rem/1 var(--font-body);
  cursor: pointer;
}

.pk-chip.is-on {
  background: var(--ink);
  color: #fff;
}

.pk-chip--type.is-on {
  background: var(--tone);
  color: var(--on-tone);
}

.pk-chip__dot {
  width: 0.7rem;
  height: 0.7rem;
  border: 1.5px solid var(--ink);
  border-radius: 50%;
  background: var(--tone);
}

.pk-chip--type.is-on .pk-chip__dot {
  border-color: var(--on-tone);
}

:focus-visible {
  outline: 3px solid var(--lens);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
