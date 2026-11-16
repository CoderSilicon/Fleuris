<template>
  <svg viewBox="0 0 420 420" fill="none" role="img" aria-label="Fleuris Graphmark Logo">
    <!-- Subtle Geometric Grid / Ottoman Tughra & Kufic Cadence -->
    <g stroke="#3155D9" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <!-- Primary Sweeping 'Ğ' (Yumuşak G) & 'S' / 'Ş' Calligraphic Arc -->
      <path 
        data-graph-path 
        d="M285 115 C 210 75, 110 115, 115 205 C 120 295, 225 320, 290 265 C 325 235, 315 190, 255 195 L 205 195" 
        stroke-width="1.5"
      />
      
      <!-- Secondary 'Ç' / 'C' Crescent & 'Ü' / 'Ö' Diacritic Constellation -->
      <path 
        data-graph-path 
        d="M250 130 C 175 110, 145 170, 155 225 C 165 275, 235 285, 275 245" 
        opacity="0.7"
      />

      <!-- The Breve (˘) Crown Curve of 'Ğ' -->
      <path 
        data-graph-path 
        d="M170 68 Q 210 96 250 68" 
        stroke-width="1.5"
      />

      <!-- Cedilla (¸) Tail Sweep of 'Ç' and 'Ş' -->
      <path 
        data-graph-path 
        d="M210 298 C 202 325, 228 335, 212 356 C 204 366, 190 362, 188 352" 
        stroke-width="1.4"
      />

      <!-- Structural Constellation Chords (Connecting Diacritics to Core Form) -->
      <path data-graph-path d="M170 68 L 115 205 L 210 298" opacity="0.35" stroke-dasharray="3 4" />
      <path data-graph-path d="M250 68 L 285 115 L 255 195 L 210 298" opacity="0.4" />
      <path data-graph-path d="M115 205 L 205 195 L 290 265" opacity="0.45" />
      
      <!-- Kufic-inspired Square Geometric Echo -->
      <path data-graph-path d="M155 145 L 265 145 L 265 255 L 155 255 Z" opacity="0.2" />
    </g>

    <!-- Central Pulse Wave -->
    <circle
      data-graph-pulse
      cx="205"
      cy="195"
      r="28"
      stroke="#3155D9"
      stroke-width="1.5"
      opacity="0"
    />

    <!-- Outer Structural Rings (Accenting Key Turkish Diacritic & Anchor Points) -->
    <g fill="#F5F4EF" stroke="#3155D9" stroke-width="1.5">
      <!-- Core Terminal Ring -->
      <circle data-graph-ring cx="205" cy="195" r="18" />
      <!-- Breve (˘) Left & Right Crown Rings ('Ü' / 'Ö' / 'Ğ' Dual-Dot Heritage) -->
      <circle data-graph-ring cx="170" cy="68" r="11" />
      <circle data-graph-ring cx="250" cy="68" r="11" />
      <!-- Cedilla (¸) Base Anchor Ring -->
      <circle data-graph-ring cx="210" cy="298" r="13" />
    </g>

    <!-- Graph Nodes (Calligraphic Inflection & Diacritic Points) -->
    <g fill="#3155D9">
      <!-- Core Focal Point -->
      <circle data-graph-node cx="205" cy="195" r="8" />
      
      <!-- 'Ğ' Breve / 'Ü' & 'Ö' Twin Dots -->
      <circle data-graph-node cx="170" cy="68" r="5" />
      <circle data-graph-node cx="250" cy="68" r="5" />
      
      <!-- 'İ' (Dotted I) High Ascender Point -->
      <circle data-graph-node cx="210" cy="44" r="4" />

      <!-- Primary Curve Inflection Nodes -->
      <circle data-graph-node cx="285" cy="115" r="6" />
      <circle data-graph-node cx="115" cy="205" r="7" />
      <circle data-graph-node cx="290" cy="265" r="6" />
      <circle data-graph-node cx="255" cy="195" r="5" />

      <!-- 'Ç' / 'Ş' Cedilla Nodes -->
      <circle data-graph-node cx="210" cy="298" r="6" />
      <circle data-graph-node cx="212" cy="356" r="4.5" />
    </g>

    <!-- Inner Core Bullseye (Matching Original Style) -->
    <circle cx="205" cy="195" r="4" fill="#F5F4EF" />
    <circle cx="205" cy="195" r="2" fill="#3155D9" />
  </svg>
</template>