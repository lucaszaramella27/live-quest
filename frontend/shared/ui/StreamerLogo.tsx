interface StreamerLogoProps {
  size?: number
  className?: string
}

export function StreamerLogo({ size = 120, className = '' }: StreamerLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Microfone base */}
      <path
        d="M100 160 L100 180 M85 180 L115 180"
        stroke="url(#mainGradient)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Corpo do microfone */}
      <circle cx="100" cy="70" r="45" fill="url(#mainGradient)" opacity="0.3" />
      <circle cx="100" cy="70" r="35" fill="url(#mainGradient)" />

      {/* Gráficos de crescimento dentro */}
      <rect x="75" y="75" width="8" height="20" fill="white" opacity="0.9" rx="2" />
      <rect x="87" y="68" width="8" height="27" fill="white" opacity="0.9" rx="2" />
      <rect x="99" y="60" width="8" height="35" fill="white" opacity="0.9" rx="2" />
      <rect x="111" y="52" width="8" height="43" fill="white" opacity="0.9" rx="2" />

      {/* Seta crescente ao redor */}
      <path
        d="M 35 110 Q 60 50, 140 30"
        stroke="url(#arrowGradient)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      
      {/* Ponta da seta */}
      <path
        d="M 135 25 L 150 20 L 145 35 Z"
        fill="url(#arrowGradient)"
        opacity="0.9"
      />

      {/* Botão play */}
      <path
        d="M 165 45 L 185 55 L 165 65 Z"
        fill="url(#arrowGradient)"
      />

      {/* Sparkles */}
      <g opacity="0.8">
        {/* Sparkle 1 */}
        <path
          d="M 50 50 L 52 55 L 50 60 L 48 55 Z"
          fill="#a855f7"
        />
        <path
          d="M 45 55 L 50 55 L 55 55 L 50 55 Z"
          fill="#a855f7"
        />
        
        {/* Sparkle 2 */}
        <path
          d="M 40 75 L 41 78 L 40 81 L 39 78 Z"
          fill="#8b5cf6"
        />
        <path
          d="M 37 78 L 40 78 L 43 78 L 40 78 Z"
          fill="#8b5cf6"
        />

        {/* Sparkle 3 */}
        <path
          d="M 155 35 L 157 39 L 155 43 L 153 39 Z"
          fill="#22d3ee"
        />
        <path
          d="M 151 39 L 155 39 L 159 39 L 155 39 Z"
          fill="#22d3ee"
        />

        {/* Sparkle 4 */}
        <path
          d="M 170 70 L 172 74 L 170 78 L 168 74 Z"
          fill="#06b6d4"
        />
        <path
          d="M 166 74 L 170 74 L 174 74 L 170 74 Z"
          fill="#06b6d4"
        />
      </g>

      {/* Conexão microfone */}
      <path
        d="M 100 115 L 100 160"
        stroke="url(#mainGradient)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}
