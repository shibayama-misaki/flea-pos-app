import Link from "next/link"

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  return (
    <>
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
              className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white"
            >
              イベント詳細
            </Link>

            <Link
              href={`/events/${eventId}/register`}
              className="rounded bg-gray-200 px-3 py-2 text-sm font-medium"
            >
              レジ
            </Link>

            <Link
              href={`/events/${eventId}/sales`}
              className="rounded bg-gray-200 px-3 py-2 text-sm font-medium"
            >
              売上
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </>
  )
}