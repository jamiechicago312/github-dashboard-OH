'use client'

import Link from 'next/link'
import { GitHubUser } from '@/types/github'

interface MaintainersProps {
  maintainers: GitHubUser[]
}

export default function Maintainers({ maintainers }: MaintainersProps) {
  if (maintainers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintainers</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No maintainers found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Maintainers</h2>
        <span className="text-sm text-gray-500">
          {maintainers.length} maintainer{maintainers.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {maintainers.slice(0, 10).map((maintainer) => (
          <div key={maintainer.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <img
              src={maintainer.avatar_url}
              alt={`${maintainer.login}'s avatar`}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Link
                  href={maintainer.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {maintainer.login}
                </Link>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Maintainer
                </span>
              </div>
              {maintainer.name && (
                <p className="text-sm text-gray-600 truncate">{maintainer.name}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={maintainer.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {maintainers.length > 10 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Showing 10 of {maintainers.length} maintainers
          </p>
        </div>
      )}
    </div>
  )
}