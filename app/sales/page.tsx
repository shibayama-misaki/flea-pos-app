"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { SaleItem } from "@/types/SaleItem"
import { Event } from "@/types/Event"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const formatDateTime = (value: any) => {
  if (!value) return "-"
  if (value.toDate) {
    return value.toDate().toLocaleString("ja-JP")
  }
  return "-"
}

const formatDateKey = (value: any) => {
  if (!value?.toDate) return ""

  const d = value.toDate()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export default function SalesPage() {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState("all")
  const [selectedItemId, setSelectedItemId] = useState("all")
  const [selectedDate, setSelectedDate] = useState("")

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "saleItems"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as SaleItem[]

      setSaleItems(data)
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Event[]

      setEvents(data)
    })

    return () => unsub()
  }, [])

  const eventMap = useMemo(() => {
    return new Map(events.map((event) => [event.id, event]))
  }, [events])

  const sortedSaleItems = useMemo(() => {
    return [...saleItems].sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
      return bTime - aTime
    })
  }, [saleItems])

  const eventOptions = useMemo(() => {
    const ids = new Set(sortedSaleItems.map((item) => item.eventId))

    return Array.from(ids)
      .map((eventId) => {
        const event = eventMap.get(eventId)
        return {
          eventId,
          name: event?.name || "不明なイベント",
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))
  }, [sortedSaleItems, eventMap])

  const baseFilteredByEvent = useMemo(() => {
    if (selectedEventId === "all") return sortedSaleItems
    return sortedSaleItems.filter((item) => item.eventId === selectedEventId)
  }, [sortedSaleItems, selectedEventId])

  const itemOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const item of baseFilteredByEvent) {
      if (!map.has(item.itemId)) {
        map.set(item.itemId, item.name)
      }
    }

    return Array.from(map.entries())
      .map(([itemId, name]) => ({
        itemId,
        name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "ja"))
  }, [baseFilteredByEvent])

  const filteredSaleItems = useMemo(() => {
    return baseFilteredByEvent.filter((item) => {
      if (selectedItemId !== "all" && item.itemId !== selectedItemId) {
        return false
      }
      return true
    })
  }, [baseFilteredByEvent, selectedItemId])

  useEffect(() => {
    if (selectedItemId === "all") return

    const exists = itemOptions.some((item) => item.itemId === selectedItemId)
    if (!exists) {
      setSelectedItemId("all")
    }
  }, [itemOptions, selectedItemId])

  const totalQty = useMemo(() => {
    return filteredSaleItems.reduce((sum, item) => sum + item.qty, 0)
  }, [filteredSaleItems])

  const totalAmount = useMemo(() => {
    return filteredSaleItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    )
  }, [filteredSaleItems])

  const dateOptions = useMemo(() => {
    const keys = Array.from(
      new Set(
        filteredSaleItems
          .map((item) => formatDateKey(item.createdAt))
          .filter(Boolean)
      )
    )

    return keys.sort((a, b) => (a < b ? 1 : -1))
  }, [filteredSaleItems])

  useEffect(() => {
    if (!selectedDate && dateOptions.length > 0) {
      setSelectedDate(dateOptions[0])
      return
    }

    if (selectedDate && !dateOptions.includes(selectedDate)) {
      setSelectedDate(dateOptions[0] ?? "")
    }
  }, [dateOptions, selectedDate])

  const dailyChartData = useMemo(() => {
    if (!selectedDate) return []

    const dayItems = filteredSaleItems.filter(
      (item) => formatDateKey(item.createdAt) === selectedDate
    )

    const buckets = new Map<string, number>()

    for (const item of dayItems) {
      if (!item.createdAt?.toDate) continue

      const d = item.createdAt.toDate()
      const hh = String(d.getHours()).padStart(2, "0")
      const mm = String(d.getMinutes()).padStart(2, "0")
      const label = `${hh}:${mm}`

      buckets.set(label, (buckets.get(label) ?? 0) + item.price * item.qty)
    }

    return Array.from(buckets.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([time, amount]) => ({
        time,
        amount,
      }))
  }, [filteredSaleItems, selectedDate])

  return (
    <main className="min-h-screen bg-white p-4 pb-8">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-block rounded bg-gray-200 px-4 py-2 text-sm font-medium"
        >
          ← 戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">全売上履歴</h1>
      </div>

      <div className="mb-4 grid gap-4 rounded-xl border p-4 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">イベント</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="all">全イベント</option>
            {eventOptions.map((event) => (
              <option key={event.eventId} value={event.eventId}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">商品</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="all">全商品</option>
            {itemOptions.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">グラフ対象日</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            {dateOptions.length === 0 ? (
              <option value="">日付なし</option>
            ) : (
              dateOptions.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-xl border p-4 shadow-sm">
        <div className="flex flex-wrap gap-4 text-sm">
          <p>
            <span className="font-medium">明細件数:</span>{" "}
            {filteredSaleItems.length}
          </p>
          <p>
            <span className="font-medium">販売点数:</span> {totalQty}
          </p>
          <p>
            <span className="font-medium">売上合計:</span> ¥{totalAmount}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-bold">1日の売上グラフ</h2>
          <p className="text-sm text-gray-500">
            {selectedDate || "表示できる日付がありません"}
          </p>
        </div>

        {dailyChartData.length === 0 ? (
          <p className="text-gray-500">グラフ用データがありません</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="売上"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {filteredSaleItems.length === 0 ? (
        <p className="text-gray-500">売上データがありません</p>
      ) : (
        <div className="space-y-3">
          {filteredSaleItems.map((item) => {
            const eventName = eventMap.get(item.eventId)?.name || "不明なイベント"

            return (
              <div key={item.id} className="rounded-xl border p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      イベント: {eventName}
                    </p>
                    <div className="flex gap-4">
                      <p className="text-sm text-gray-600">単価: ¥{item.price}</p>
                      <p className="text-sm text-gray-600">点数: {item.qty}</p>
                      <p className="text-sm text-gray-600">
                        小計: ¥{item.price * item.qty}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>{formatDateTime(item.createdAt)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}