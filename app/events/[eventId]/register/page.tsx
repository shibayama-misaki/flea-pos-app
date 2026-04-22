"use client"

import { useEffect, useState } from "react"
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  where,
} from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { useParams } from "next/navigation"
import { EventItem } from "@/types/EventItem"
import { Item } from "@/types/Item"

type CartItem = EventItem & {
  qty: number
}

export default function RegisterPage() {
  const [eventItems, setEventItems] = useState<EventItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const params = useParams();
  const eventId = params.eventId as string;

  const getQty = (id: string) => {
    const found = cart.find((c) => c.id === id)
    return found ? found.qty : 0
  }

const addToCart = (item: EventItem) => {
  setCart((prev) => {
    const exist = prev.find((c) => c.id === item.id)
    const currentQty = exist ? exist.qty : 0

    if (currentQty >= item.stock) {
      // alert("在庫数を超えています")
      return prev
    }
    if (exist) {
      return prev.map((c) =>
        c.id === item.id ? { ...c, qty: c.qty + 1 } : c
      )
    }

    return [...prev, { ...item, qty: 1 }]
  })
}

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    )
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  const checkout = async () => {
    if (cart.length === 0) return

    try {
      await runTransaction(db, async (transaction) => {
        for (const c of cart) {
          const ref = doc(db, "eventItems", c.id)
          const snap = await transaction.get(ref)
          if (!snap.exists()) {
            throw new Error("商品が見つかりません")
          }

          const currentStock = snap.data().stock
          if (currentStock < c.qty) {
            throw new Error(`${c.itemName} の在庫が足りません`)
          }
          transaction.update(ref, { stock: currentStock - c.qty })
        }
      })

      await addDoc(collection(db, "sales"), {
        eventId,
        items: cart,
        total,
        createdAt: new Date(),
      })

      setCart([])
      alert("会計完了！")
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert("会計に失敗しました")
      }
    }
  }

  useEffect(() => {
    const q = query(
      collection(db, "eventItems"),
      where("eventId", "==", eventId)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as EventItem[]
      setEventItems(data)
    })

    return () => unsub()
  }, [eventId])

  return (
    <>
      <main className="min-h-screen bg-white p-4 pb-48">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">レジ</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
        {eventItems.map((item) => {
            const qty = getQty(item.id)

            return (
            <div key={item.id} className="rounded-xl border p-3 shadow-sm">
                <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                {item.itemImage ? (
                    <img
                    src={item.itemImage}
                    alt={item.itemName}
                    className="h-full w-full object-cover"
                    />
                ) : null}
                </div>

                <p className="text-lg font-medium">{item.itemName}</p>
                <p className="font-semibold">¥{item.price}</p>
                <p className="mb-3 text-gray-600">在庫: {item.stock}</p>

                <div className="flex items-center justify-center gap-3">
                <button
                  className="rounded bg-gray-200 px-3 py-2 text-lg"
                  onClick={() => updateQty(item.id, -1)}
                  disabled={qty === 0}
                >
                    -
                </button>
                <span className="min-w-8 text-center text-lg font-bold">{qty}</span>
                <button
                  className="rounded bg-green-600 px-3 py-2 text-lg text-white"
                  onClick={() => addToCart(item)}
                >
                    +
                </button>
                </div>
            </div>
            )
        })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between text-lg font-bold">
        <span>総点数: {cart.reduce((sum, c) => sum + c.qty, 0)}</span>
        <span>合計: ¥{cart.reduce((sum, c) => sum + c.price * c.qty, 0)}</span>
      </div>

      <button
        className="mt-3 w-full rounded bg-green-600 py-3 text-lg font-bold text-white"
        onClick={checkout}
        disabled={cart.length === 0}
      >
        会計する
      </button>
    </div>
    </>
  )
}