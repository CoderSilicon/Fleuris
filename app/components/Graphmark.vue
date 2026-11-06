<template>
  <svg viewBox="0 0 420 420" fill="none" role="img" aria-label="Connected graph of ideas">
    <g stroke="#3155D9" stroke-width="1">
      <path data-graph-path d="M210 210 L95 110 L50 225 L150 340 L300 310 L350 150 L210 210" />
      <path data-graph-path d="M95 110 L270 75 L350 150" />
      <path data-graph-path d="M50 225 L210 210 L270 75" />
      <path data-graph-path d="M150 340 L210 210 L300 310" />
      <path data-graph-path d="M270 75 L300 310" />
      <path data-graph-path d="M50 225 L95 110 L350 150 L300 310" opacity="0.45" />
    </g>

    <circle
      data-graph-pulse
      cx="210"
      cy="210"
      r="26"
      stroke="#3155D9"
      stroke-width="1.5"
      opacity="0"
    />

    <g fill="#3155D9">
      <circle data-graph-node cx="210" cy="210" r="9" />
      <circle data-graph-node cx="95" cy="110" r="6" />
      <circle data-graph-node cx="50" cy="225" r="5" />
      <circle data-graph-node cx="150" cy="340" r="6" />
      <circle data-graph-node cx="300" cy="310" r="7" />
      <circle data-graph-node cx="350" cy="150" r="5" />
      <circle data-graph-node cx="270" cy="75" r="5" />
    </g>

    <g fill="#F5F4EF" stroke="#3155D9" stroke-width="1.5">
      <circle data-graph-ring cx="210" cy="210" r="18" />
      <circle data-graph-ring cx="95" cy="110" r="13" />
      <circle data-graph-ring cx="300" cy="310" r="14" />
    </g>

    <circle cx="210" cy="210" r="5" fill="#3155D9" />
  </svg>
</template>
