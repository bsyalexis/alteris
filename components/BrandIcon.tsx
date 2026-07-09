/** Gemme Altéris — SVG d'origine du site, inline pour hériter des animations CSS (.brand svg) */
export function BrandIcon() {
  return (
    <svg viewBox="0 0 512 512" width="22" height="22" aria-hidden="true">
      <defs>
        <linearGradient id="bgem" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0" stopColor="#e6ffab" />
          <stop offset="0.42" stopColor="#93d84a" />
          <stop offset="1" stopColor="#4c8a22" />
        </linearGradient>
      </defs>
      <polygon
        points="256,60 366,196 336,410 256,456 176,410 146,196"
        fill="url(#bgem)"
        stroke="#eaffb8"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <polygon points="256,60 366,196 256,232 146,196" fill="#ffffff" opacity="0.28" />
      <polygon points="146,196 256,232 176,410" fill="#3f7a1e" opacity="0.3" />
      <polygon points="366,196 336,410 256,232" fill="#c7ef78" opacity="0.3" />
      <path
        d="M256,392 C256,352 292,344 292,312 C292,286 268,282 262,300 C258,312 272,320 282,312"
        fill="none"
        stroke="#2f5416"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path d="M256,392 L256,300" stroke="#2f5416" strokeWidth="16" strokeLinecap="round" />
      <path
        d="M256,300 C274,294 290,302 292,318 C274,320 258,314 256,300 Z"
        fill="#a9d651"
        stroke="#2f5416"
        strokeWidth="8"
      />
      <path
        d="M256,336 C238,330 224,338 222,354 C240,356 254,350 256,336 Z"
        fill="#8fd13f"
        stroke="#2f5416"
        strokeWidth="8"
      />
    </svg>
  );
}
