// Logotipo TUTOR-ia (ver docs/marca). Las letras usan currentColor; el reloj y «-ia», el coral de la marca.
export function MarcaTutoria({ className, firma = false }: { className?: string; firma?: boolean }) {
  return (
    <svg viewBox={firma ? '-4 -4 534 136' : '-4 -4 534 108'} className={className} role="img" aria-label="TUTOR-ia">
      <path d="M0 0h62v22h-20v78h-22v-78h-20z" fill="currentColor"/>
      <path d="M72 0h22v66a9 9 0 0 0 18 0v-66h22v68a31 31 0 0 1 -62 0z" fill="currentColor"/>
      <path d="M146 0h62v22h-20v78h-22v-78h-20z" fill="currentColor"/>
      <circle cx="261" cy="50" r="43" fill="none" stroke="#f0603f" strokeWidth="14"/>
      <path d="M261 50V23" stroke="#f0603f" strokeWidth="9" strokeLinecap="round"/>
      <path d="M261 50L278.0 60.0" stroke="#f0603f" strokeWidth="9" strokeLinecap="round"/>
      <circle cx="261" cy="50" r="7" fill="#f0603f"/>
      <path fillRule="evenodd" fill="currentColor" d="M318 0h34a29 29 0 0 1 12 55.4l16 44.6h-24l-13 -42h-3v42h-22zM340 20v18h11a9 9 0 0 0 0 -18z"/>
      <rect x="392" y="52" width="24" height="14" rx="2" fill="#f0603f"/>
      <rect x="428" y="44" width="20" height="56" fill="#f0603f"/>
      <circle cx="438" cy="22" r="11" fill="#f0603f"/>
      <circle cx="490" cy="72" r="20" fill="none" stroke="#f0603f" strokeWidth="16"/>
      <rect x="504" y="44" width="18" height="56" fill="#f0603f"/>
      

      {firma && (
        <>
          <rect x="0" y="118" width="150" height="7" rx="3.5" fill="#f0603f" />
      
          <text x="522" y="126" textAnchor="end" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="17" letterSpacing="3.2" fill="#f0603f">
            BY PRÈTZHÈT DIGITAU
          </text>
        </>
      
      )}
    </svg>
  )
}
