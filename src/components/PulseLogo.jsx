export default function PulseLogo({ size = 'md', theme = 'light' }) {
  const scales = { sm: 0.7, md: 1, lg: 1.4 }
  const s = scales[size] ?? 1
  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(10 * s) }}>
      {/* Icon: circle with EKG pulse line */}
      <svg width={Math.round(34 * s)} height={Math.round(34 * s)} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="17" cy="17" r="17" fill="#2563eb"/>
        <path
          d="M4 17 L9 17 L11.5 11 L14 23 L16.5 7 L19 27 L21.5 17 L30 17"
          stroke="white" strokeWidth="2.2" fill="none"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      {/* Wordmark */}
      <span style={{
        fontSize: Math.round(20 * s),
        fontWeight: 800,
        color: textColor,
        letterSpacing: '-0.5px',
        lineHeight: 1,
        fontFamily: 'Outfit, sans-serif',
      }}>
        Pulse
      </span>
    </div>
  )
}
