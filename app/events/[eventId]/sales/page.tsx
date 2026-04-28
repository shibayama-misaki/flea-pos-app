"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { SaleItem } from "@/types/SaleItem"

const formatDateTime = (value: any) => {
  if (!value) return "-"
  if (value.toDate) {
    return value.toDate().toLocaleString("ja-JP")
  }
  return "-"
}

export default function EventSalesPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState("all")

  useEffect(() => {
    const q = query(
      collection(db, "saleItems"),
      where("eventId", "==", eventId)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as SaleItem[]

      setSaleItems(data)
    })

    return () => unsub()
  }, [eventId])

  const sortedSaleItems = useMemo(() => {
    return [...saleItems].sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
      return bTime - aTime
    })
  }, [saleItems])

  const itemOptions = useMemo(() => {
    const map = new Map<string, string>()

    for (const item of saleItems) {
      if (!map.has(item.itemId)) {
        map.set(item.itemId, item.name)
      }
    }

    return Array.from(map.entries()).map(([itemId, name]) => ({
      itemId,
      name,
    }))
  }, [saleItems])

  const filteredSaleItems = useMemo(() => {
    if (selectedItemId === "all") return sortedSaleItems
    return sortedSaleItems.filter((item) => item.itemId === selectedItemId)
  }, [sortedSaleItems, selectedItemId])

  const totalQty = useMemo(() => {
    return filteredSaleItems.reduce((sum, item) => sum + item.qty, 0)
  }, [filteredSaleItems])

  const totalAmount = useMemo(() => {
    return filteredSaleItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    )
  }, [filteredSaleItems])

  return (
    <main className="min-h-screen bg-white p-4 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">売上一覧</h1>
      </div>

      <div className="mb-4 rounded-xl border p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium">商品で絞り込み</label>
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

      {filteredSaleItems.length === 0 ? (
        <p className="text-gray-500">売上データがありません</p>
      ) : (
        <div className="space-y-3">
          {filteredSaleItems.map((item) => (
            <div key={item.id} className="rounded-xl border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-medium">{item.name}</p>
                  <p className="flex gap-4">
                  <p className="text-sm text-gray-600">
                    単価: ¥{item.price}
                  </p>
                  <p className="text-sm text-gray-600">
                    点数: {item.qty}
                  </p>
                  <p className="text-sm text-gray-600">
                    小計: ¥{item.price * item.qty}
                  </p>
                  </p>
                </div>

                <div className="text-right text-sm text-gray-500">
                  <p>{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}