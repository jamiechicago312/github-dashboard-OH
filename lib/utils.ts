import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number | undefined | null): string {
  if (num == null || num === undefined) {
    return '0'
  }
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Today'
  } else if (diffDays === 2) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diffTime / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

/**
 * Get color for programming language
 */
export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#239120',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Scala': '#c22d40',
    'R': '#198CE7',
    'MATLAB': '#e16737',
    'Shell': '#89e051',
    'PowerShell': '#012456',
    'HTML': '#e34c26',
    'CSS': '#1572B6',
    'SCSS': '#c6538c',
    'Vue': '#2c3e50',
    'React': '#61dafb',
    'Angular': '#dd0031',
    'Svelte': '#ff3e00',
    'Dart': '#00B4AB',
    'Lua': '#000080',
    'Perl': '#0298c3',
    'Haskell': '#5e5086',
    'Clojure': '#db5855',
    'Elixir': '#6e4a7e',
    'Erlang': '#B83998',
    'F#': '#b845fc',
    'OCaml': '#3be133',
    'Reason': '#ff5847',
    'Elm': '#60B5CC',
    'PureScript': '#1D222D',
    'Crystal': '#000100',
    'Nim': '#ffc200',
    'Zig': '#ec915c',
    'Assembly': '#6E4C13',
    'Makefile': '#427819',
    'Dockerfile': '#384d54',
    'YAML': '#cb171e',
    'JSON': '#292929',
    'XML': '#0060ac',
    'Markdown': '#083fa1',
    'TeX': '#3D6117',
    'Jupyter Notebook': '#DA5B0B',
    'Vim script': '#199f4b',
    'Emacs Lisp': '#c065db',
    'Common Lisp': '#3fb68b',
    'Scheme': '#1e4aec',
    'Racket': '#3c5caa',
    'Standard ML': '#dc566d',
    'Coq': '#d0b68c',
    'Agda': '#315665',
    'Idris': '#b30000',
    'VHDL': '#adb2cb',
    'Verilog': '#b2b7f8',
    'SystemVerilog': '#DAE1C2',
    'Tcl': '#e4cc98',
    'XSLT': '#EB8CEB',
    'Batchfile': '#C1F12E',
    'AppleScript': '#101F1F',
    'VBScript': '#15dcdc',
    'AutoHotkey': '#6594b9',
    'Inno Setup': '#264b99',
    'NSIS': '#dbb284',
    'CMake': '#DA3434',
    'QMake': '#00b841',
    'Meson': '#007800',
    'Bazel': '#00D000',
    'Buck': '#8f4e8b',
    'Gradle': '#02303a',
    'Maven POM': '#0f4c81',
    'Ant Build System': '#A9157E',
    'default': '#586069'
  }
  
  return colors[language] || colors['default']
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Generate a random color for avatars or placeholders
 */
export function generateColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Check if a URL is valid
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Check if a contributor is external to the organization
 */
export function isExternalContributor(
  contributor: { login: string },
  orgMemberLogins: string[]
): boolean {
  return !orgMemberLogins.includes(contributor.login.toLowerCase())
}