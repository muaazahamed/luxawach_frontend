@import "tailwindcss";

@theme {
  --font-sans: "Assistant", "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Noto Serif", ui-serif, Georgia, serif;
  --font-manrope: "Manrope", sans-serif;
  --color-gold: #D4AF37;
  --color-off-white: #FFFFFF;
  --color-ink: #121212;
}

@layer base {
  html,
  body,
  #root {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  body {
    @apply bg-off-white text-ink font-sans antialiased;
  }

  img {
    max-width: 100%;
    height: auto;
  }
}

.text-gold {
  color: var(--color-gold);
}

.bg-gold {
  background-color: var(--color-gold);
}

.border-gold {
  border-color: var(--color-gold);
}

.glass {
  @apply bg-white/10 backdrop-blur-md border border-white/20;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Skip rendering for off-screen sections to reduce CLS and improve paint time */
.content-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}

/* Hint the browser that lazy images may change visibility */
img[loading="lazy"] {
  content-visibility: auto;
}
