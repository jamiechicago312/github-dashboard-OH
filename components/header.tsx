'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="text-lg">🙌</span>
            </div>
            <span className="font-brand text-lg">OpenHands Dashboard</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            href="https://github.com/All-Hands-AI/OpenHands"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 space-x-1"
          >
            <span>OpenHands Repo</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <Link
            href="https://github.com/All-Hands-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-3 space-x-1"
          >
            <span>All-Hands-AI Org</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}