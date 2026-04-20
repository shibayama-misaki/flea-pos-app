"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, doc, onSnapshot, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

type Item = {
  id: string
  name: string
  price: number
  stock: number
  image?: string
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [cart, setCart] = useState<any[]>([])

  const addItem = async (
    name: string,
    price: number,
    stock: number,
    image: string
  ) => {
    if (!name || Number.isNaN(price) || Number.isNaN(stock)) return

    await addDoc(collection(db, "items"), {
      name,
      price,
      stock,
      image,
    })
  }

  /** カートに商品追加 */
  const addToCart = (item: any) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === item.id)

      if (exist) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, qty: c.qty + 1 } : c
        )
      }

      return [...prev, { ...item, qty: 1 }]
    })
  }

  /** カート内の商品数量を更新 */
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, qty: c.qty + delta } : c
        )
        .filter((c) => c.qty > 0)
    )
  }

  /** 会計 */
  const checkout = async () => {
    try {
      await runTransaction(db, async (transaction) => {
        for (const c of cart) {
          const ref = doc(db, "items", c.id)
          const snap = await transaction.get(ref)

          if (!snap.exists()) throw "商品なし"

          const currentStock = snap.data().stock

          if (currentStock < c.qty) {
            throw "在庫不足"
          }

          transaction.update(ref, {
            stock: currentStock - c.qty,
          })
        }
      })

      // 売上保存
      await addDoc(collection(db, "sales"), {
        items: cart,
        total: cart.reduce((sum, c) => sum + c.price * c.qty, 0),
        createdAt: new Date(),
      })

      // カートリセット
      setCart([])

      alert("会計完了！")
    } catch (e) {
      alert("エラー：" + e)
    }
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "items"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Item[]

      setItems(data)
    })

    return () => unsub()
  }, [])

  return (
    <>
    <Link href="/sales">
      <button className="mb-4 ml-2 rounded bg-gray-500 px-4 py-2 text-white">
        売上一覧
      </button>
    </Link>

    <main className="min-h-screen bg-white p-4 pb-40">
      <button
        className="mb-4 rounded bg-blue-500 px-4 py-2 text-white"
        onClick={() => {
          const name = prompt("商品名")
          const price = Number(prompt("価格"))
          const stock = Number(prompt("在庫"))
          const image = prompt("画像URL")
          addItem(name, price, stock, image || "")
        }}
      >
        ＋ 商品追加
      </button>
      
      <h1 className="mb-4 text-2xl font-bold">商品一覧</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">商品がありません</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3 shadow-sm" onClick={() => addToCart(item)}>
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <p className="font-medium">{item.name}</p>
              <p>¥{item.price}</p>
              <p>在庫: {item.stock}</p>
            </div>
          ))}
        </div>
      )}
    </main>

    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
      <h2 className="font-bold mb-2">カート</h2>
      {cart.map((c) => (
        <div key={c.id} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <span>{c.name}</span>
              <button
                className="rounded bg-gray-200 px-2"
                onClick={() => updateQty(c.id, -1)}
              >
                −
              </button>
              <span>{c.qty}</span>
              <button
                className="rounded bg-gray-200 px-2"
                onClick={() => updateQty(c.id, 1)}
              >
                ＋
              </button>
            </div>
          </div>
          <span>¥{c.price * c.qty}</span>
        </div>
      ))}

      <div className="mt-2 font-bold">
        合計：
        ¥{cart.reduce((sum, c) => sum + c.price * c.qty, 0)}
      </div>

      <button
        className="mt-3 w-full bg-green-500 text-white py-2 rounded"
        onClick={checkout}
      >
        会計する
      </button>
    </div>
  </>
  )
}