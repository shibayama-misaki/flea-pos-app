"use client"

import { useEffect, useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { EventItem } from "@/types/EventItem"
import { toThumbUrl } from "@/utils/file"

type Props = {
  open: boolean
  onClose: () => void
  eventItem: EventItem | null
}

export default function EditEventItemModal({
  open,
  onClose,
  eventItem,
}: Props) {
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && eventItem) {
      setMemo(String(eventItem.memo ?? ""))
      setPrice(String(eventItem.price ?? ""))
      setStock(String(eventItem.stock ?? ""))
    }
  }, [open, eventItem])

  if (!open || !eventItem) return null

  const reset = () => {
    setPrice("")
    setStock("")
    setMemo("")
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = Number(price)
    const stockNum = Number(stock)

    if (Number.isNaN(priceNum) || priceNum < 0) {
      alert("販売価格を正しく入力してください")
      return
    }

    if (Number.isNaN(stockNum) || stockNum < 0) {
      alert("在庫を正しく入力してください")
      return
    }

    try {
      setLoading(true)

      await updateDoc(doc(db, "eventItems", eventItem.id), {
        price: priceNum,
        stock: stockNum,
        memo: memo,
      })

      reset()
      onClose()
    } catch (error) {
      console.error(error)
      alert("イベント商品の編集に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">イベント商品を編集</h3>

          <button
            onClick={handleClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg border bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded bg-gray-100">
              {eventItem.image ? (
                <img
                  src={toThumbUrl(eventItem.image)}
                  alt={eventItem.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div>
              <p className="font-medium">{eventItem.name}</p>
              <p className="text-sm text-gray-500">商品ID: {eventItem.itemId}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">販売価格</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="販売価格"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">在庫</label>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="在庫"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="備考"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium"
              disabled={loading}
            >
              キャンセル
            </button>

            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}