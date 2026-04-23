"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function EventHeader({ eventId }: { eventId: string }) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const baseClass =
    "rounded px-3 py-2 text-sm font-medium"

  const activeClass = "bg-green-600 text-white"
  const inactiveClass = "bg-gray-200"

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="px-4 py-3">
        <nav className="flex gap-2">
          <Link
            href="/events"
            className="inline-block rounded bg-gray-200 px-4 py-2 text-sm font-medium"
          >
            ← 戻る
          </Link>

          <Link
            href={`/events/${eventId}`}
            className={`${baseClass} ${
              isActive(`/events/${eventId}`)
                ? activeClass
                : inactiveClass
            }`}
          >
            イベント詳細
          </Link>

          <Link
            href={`/events/${eventId}/register`}
            className={`${baseClass} ${
              isActive(`/events/${eventId}/register`)
                ? activeClass
                : inactiveClass
            }`}
          >
            レジ
          </Link>

          <Link
            href={`/events/${eventId}/sales`}
            className={`${baseClass} ${
              isActive(`/events/${eventId}/sales`)
                ? activeClass
                : inactiveClass
            }`}
          >
            売上
          </Link>
        </nav>
      </div>
    </header>
  )
}