export default function PulseLogo({ size = 'md', theme = 'light' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.4, nav: 0.85 }
  const s = scales[size] ?? 1
  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(10 * s) }}>
      {/* Icon: circle with EKG pulse line */}
      <svg width={Math.round(34 * s)} height={Math.round(34 * s)} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="17" fill="#2563eb"/>
        {/* Clock tick marks at 12, 3, 6, 9 */}
        <line x1="17" y1="2.5" x2="17" y2="6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="31.5" y1="17" x2="28" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="17" y1="31.5" x2="17" y2="28" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="2.5" y1="17" x2="6" y2="17" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        {/* EKG pulse line */}
        <path
          d="M7 17 L10.5 17 L12.5 13 L15 22 L17 9 L19 25 L21.5 17 L27 17"
          stroke="white" strokeWidth="2.1" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {/* Wordmark */}
      <span style={{
        fontSize: Math.round(20 * s),
        fontWeight: 700,
        color: textColor,
        letterSpacing: '-0.01em',
        lineHeight: 1,
        fontFamily: 'Outfit, sans-serif',
      }}>
        Pulse
      </span>
    </div>
  )
}
