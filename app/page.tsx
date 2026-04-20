"use client"

import { useEffect, useMemo, useState } from "react"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore"
import { db } from "../lib/firebase"

type Item = {
  id: string
  name: string
  price: number
  stock: number
  image?: string
}

type FormState = {
  name: string
  price: string
  stock: string
  image: string
}

const initialForm: FormState = {
  name: "",
  price: "",
  stock: "",
  image: "",
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Item[]

      setItems(data)
    })

    return () => unsub()
  }, [])

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [items, editingItemId]
  )

  const openAddForm = () => {
    setEditingItemId(null)
    setForm(initialForm)
    setIsFormOpen(true)
  }

  const openEditForm = (item: Item) => {
    setEditingItemId(item.id)
    setForm({
      name: item.name,
      price: String(item.price),
      stock: String(item.stock),
      image: item.image || "",
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItemId(null)
    setForm(initialForm)
  }

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const name = form.name.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)
    const image = form.image.trim()

    if (!name) {
      alert("商品名を入力してください")
      return
    }

    if (Number.isNaN(price) || price < 0) {
      alert("価格を正しく入力してください")
      return
    }

    if (Number.isNaN(stock) || stock < 0) {
      alert("在庫を正しく入力してください")
      return
    }

    try {
      if (editingItemId) {
        await updateDoc(doc(db, "items", editingItemId), {
          name,
          price,
          stock,
          image,
        })
      } else {
        await addDoc(collection(db, "items"), {
          name,
          price,
          stock,
          image,
        })
      }

      closeForm()
    } catch (error) {
      console.error(error)
      alert("保存に失敗しました")
    }
  }

  const deleteItem = async (item: Item) => {
    const ok = confirm(`「${item.name}」を削除しますか？`)
    if (!ok) return

    try {
      await deleteDoc(doc(db, "items", item.id))
    } catch (error) {
      console.error(error)
      alert("商品削除に失敗しました")
    }
  }

  return (
    <main className="min-h-screen bg-white p-4 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">商品一覧</h2>

        <button
          onClick={openAddForm}
          className="rounded bg-green-600 px-4 py-2 font-medium text-white"
        >
          商品追加
        </button>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingItem ? "商品を編集" : "商品を追加"}
              </h3>

              <button
                type="button"
                onClick={closeForm}
                className="rounded bg-gray-200 px-3 py-2 text-sm font-medium"
              >
                閉じる
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">商品名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Tシャツ"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">価格</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">在庫</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => handleChange("stock", e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">画像URL</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-green-600 py-3 text-lg font-bold text-white"
              >
                {editingItem ? "更新する" : "追加する"}
              </button>
            </form>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500">商品がありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const isSoldOut = item.stock === 0

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-3 shadow-sm ${
                  isSoldOut ? "bg-gray-100 opacity-60" : "bg-white"
                }`}
              >
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-lg font-medium">{item.name}</p>
                  {isSoldOut && (
                    <span className="rounded bg-gray-500 px-2 py-1 text-xs font-bold text-white">
                      売り切れ
                    </span>
                  )}
                </div>

                <p className="font-semibold">¥{item.price}</p>
                <p className={isSoldOut ? "text-gray-700" : "text-gray-600"}>
                  在庫: {item.stock}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEditForm(item)}
                    className="flex-1 rounded bg-gray-200 py-2 font-medium"
                  >
                    編集
                  </button>

                  <button
                    onClick={() => deleteItem(item)}
                    className="flex-1 rounded bg-red-500 py-2 font-medium text-white"
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}