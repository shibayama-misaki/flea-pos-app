"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, onSnapshot } from "firebase/firestore"
import Link from "next/link"
import { db } from "../../lib/firebase"

type ProductItem = {
  id: string
  name: string
  price: number
  image?: string
  isActive?: boolean
}

export default function ItemsPage() {
  const [items, setItems] = useState<ProductItem[]>([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ProductItem[]

      setItems(data)
    })

    return () => unsub()
  }, [])

  const addItem = async () => {
    const name = prompt("商品名") || ""
    const price = Number(prompt("価格"))
    const image = prompt("画像URL") || ""

    if (!name.trim()) {
      alert("商品名を入力してください")
      return
    }

    if (Number.isNaN(price) || price < 0) {
      alert("価格を正しく入力してください")
      return
    }

    try {
      await addDoc(collection(db, "items"), {
        name: name.trim(),
        price,
        image: image.trim(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      console.error(error)
      alert("商品追加に失敗しました")
    }
  }

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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">商品一覧</h2>

        <button
          onClick={addItem}
          className="rounded bg-green-600 px-4 py-2 font-medium text-white"
        >
          商品追加
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500">商品がありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3 shadow-sm">
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <p className="text-lg font-medium">{item.name}</p>
              <p className="font-semibold">¥{item.price}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}