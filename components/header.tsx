'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

import { SimpleCountdown } from './simple-countdown'

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
          <SimpleCountdown />
          <Link
            href="https://github.com/All-Hands-AI/OpenHands"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>OpenHands Repo</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
          
          <Link
            href="https://github.com/All-Hands-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
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