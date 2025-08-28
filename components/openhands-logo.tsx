interface OpenHandsLogoProps {
  className?: string
  size?: number
}

export function OpenHandsLogo({ className = "", size = 24 }: OpenHandsLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Simple hands icon representing OpenHands */}
      <path
        d="M12 2C10.9 2 10 2.9 10 4V8L8 10V14C8 15.1 8.9 16 10 16H14C15.1 16 16 15.1 16 14V10L14 8V4C14 2.9 13.1 2 12 2Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M6 8C4.9 8 4 8.9 4 10V14C4 15.1 4.9 16 6 16C7.1 16 8 15.1 8 14V10C8 8.9 7.1 8 6 8Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M18 8C16.9 8 16 8.9 16 10V14C16 15.1 16.9 16 18 16C19.1 16 20 15.1 20 14V10C20 8.9 19.1 8 18 8Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M12 16V20C12 21.1 12.9 22 14 22H10C8.9 22 8 21.1 8 20V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="6" r="1" fill="currentColor" />
      <text
        x="12"
        y="19"
        textAnchor="middle"
        fontSize="6"
        fill="currentColor"
        className="font-bold"
      >
        🙌
      </text>
    </svg>
  )
}