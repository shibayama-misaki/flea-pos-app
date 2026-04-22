"use client"

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-white p-4">
      <h2 className="mb-6 text-2xl font-bold">ホーム</h2>

      <div className="space-y-4">
        <Link
          href="/events"
          className="block rounded-xl border p-4 shadow-sm"
        >
          <p className="text-lg font-medium">イベント一覧</p>
          <p className="text-sm text-gray-600">
            イベントを確認・追加できます
          </p>
        </Link>

        <Link
          href="/items"
          className="block rounded-xl border p-4 shadow-sm"
        >
          <p className="text-lg font-medium">商品一覧</p>
          <p className="text-sm text-gray-600">
            商品マスタを確認・追加できます
          </p>
        </Link>
      </div>
    </main>
  )
}