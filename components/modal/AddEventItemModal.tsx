"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Item } from "@/types/Item"
import { toThumbUrl } from "@/utils/file"

type Props = {
  open: boolean
  onClose: () => void
  eventId: string
  addableItems: Item[]
}

export default function AddEventItemModal({
  open,
  onClose,
  eventId,
  addableItems,
}: Props) {
  const [keyword, setKeyword] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("1")
  const [memo, setMemo] = useState("")
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    setKeyword("")
    setSelectedItem(null)
    setPrice("")
    setStock("1")
    setMemo("")
    setDropdownOpen(false)
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!dropdownRef.current) return
      if (!dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredItems = useMemo(() => {
    const q = keyword.trim().toLowerCase()

    if (!q) return addableItems

    return addableItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    )
  }, [addableItems, keyword])

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setKeyword(item.name)
    setPrice(String(item.price ?? ""))
    setMemo(String(item.memo ?? ""))
    setDropdownOpen(false)
  }

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedItem) {
      alert("商品を選択してください")
      return
    }

    const stockNum = Number(stock)
    const priceNum = Number(price)

    if (Number.isNaN(stockNum) || stockNum < 0) {
      alert("在庫を正しく入力してください")
      return
    }

    if (Number.isNaN(priceNum) || priceNum < 0) {
      alert("販売価格を正しく入力してください")
      return
    }

    try {
      setLoading(true)

      await addDoc(collection(db, "eventItems"), {
        eventId,
        itemId: selectedItem.id,
        name: selectedItem.name,
        memo: selectedItem.memo,
        stock: stockNum,
        price: priceNum,
        image: selectedItem.image || "",
      })

      onClose()
    } catch (error) {
      console.error(error)
      alert("イベント商品追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">イベントに商品を追加</h3>

          <button
            onClick={handleClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={dropdownRef} className="relative">
            <label className="mb-1 block text-sm font-medium">商品名</label>

            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded border px-3 py-2 text-left"
            >
              <span className={selectedItem ? "text-black" : "text-gray-400"}>
                {selectedItem ? selectedItem.name : "商品を選択"}
              </span>
              <span className="text-sm text-gray-500">▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded border bg-white shadow-lg">
                <div className="max-h-56 overflow-y-auto">
                  {addableItems.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      該当する商品がありません
                    </div>
                  ) : (
                    addableItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded bg-gray-100">
                          {item.image ? (
                            <img
                              src={toThumbUrl(item.image)}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">¥{item.price}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
              placeholder="初期在庫"
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