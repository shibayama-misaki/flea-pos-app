"use client"

import { useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ownerUserId } from "@/constants"

type Props = {
  open: boolean
  onClose: () => void
}

export default function EditItemModal({ open, onClose }: Props) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [image, setImage] = useState("")
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const reset = () => {
    setName("")
    setPrice("")
    setImage("")
    setMemo("")
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const numPrice = Number(price)

    if (!trimmedName) {
      alert("商品名を入力してください")
      return
    }

    if (Number.isNaN(numPrice) || numPrice < 0) {
      alert("価格を正しく入力してください")
      return
    }

    try {
      setLoading(true)

      await addDoc(collection(db, "items"), {
        image: image.trim(),
        name: trimmedName,
        memo: memo.trim(),
        price: numPrice,
        isActive: true,
      })

      reset()
      onClose()
    } catch (error) {
      console.error(error)
      alert("商品追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">商品追加</h3>
          <button
            onClick={handleClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">商品名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: アクリルキーホルダー"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">価格</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: 1000"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">画像URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: 50mm×50mm"
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
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "追加中..." : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}