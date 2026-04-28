"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore"
import { db } from "../../../../lib/firebase"
import { EventItem } from "@/types/EventItem"
import { toThumbUrl } from "@/utils/file"

type CartItem = EventItem & {
  qty: number
}

export default function RegisterPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [eventItems, setEventItems] = useState<EventItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

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

  /** カート内数量取得 */
  const getQty = (id: string) => {
    const found = cart.find((c) => c.id === id)
    return found ? found.qty : 0
  }

  /** カート追加 */
  const addToCart = (item: EventItem) => {
    setCart((prev) => {
      const exist = prev.find((c) => c.id === item.id)
      const currentQty = exist ? exist.qty : 0

      if (currentQty >= item.stock) {
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

  /** カート数量更新 */
  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c

          const nextQty = c.qty + delta
          const maxStock = c.stock

          if (nextQty > maxStock) return c

          return { ...c, qty: nextQty }
        })
        .filter((c) => c.qty > 0)
    )
  }

  const totalQty = useMemo(
    () => cart.reduce((sum, c) => sum + c.qty, 0),
    [cart]
  )

  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.qty, 0),
    [cart]
  )

  /** 会計 */
  const checkout = async () => {
    if (cart.length === 0 || loading) return

    const checkoutCart = [...cart]
    const checkoutTotalQty = checkoutCart.reduce((sum, c) => sum + c.qty, 0)
    const checkoutTotal = checkoutCart.reduce((sum, c) => sum + c.price * c.qty, 0)

    try {
      setLoading(true)

      await runTransaction(db, async (transaction) => {
        const eventItemRefs = checkoutCart.map((c) => ({
          cartItem: c,
          ref: doc(db, "eventItems", c.id),
        }))

        const eventItemSnaps = await Promise.all(
          eventItemRefs.map(async ({ ref, cartItem }) => {
            const snap = await transaction.get(ref)

            if (!snap.exists()) {
              throw new Error(`${cartItem.name} が見つかりません`)
            }

            return {
              cartItem,
              ref,
              snap,
            }
          })
        )

        for (const { cartItem, snap } of eventItemSnaps) {
          const currentStock = snap.data().stock ?? 0

          if (currentStock < cartItem.qty) {
            throw new Error(`${cartItem.name} の在庫が足りません`)
          }
        }

        for (const { cartItem, ref, snap } of eventItemSnaps) {
          const currentStock = snap.data().stock ?? 0

          transaction.update(ref, {
            stock: currentStock - cartItem.qty,
          })
        }

        const saleRef = doc(collection(db, "sales"))
        transaction.set(saleRef, {
          eventId,
          total: checkoutTotal,
          totalQty: checkoutTotalQty,
          createdAt: serverTimestamp(),
        })

        for (const c of checkoutCart) {
          const saleItemRef = doc(collection(db, "saleItems"))
          transaction.set(saleItemRef, {
            saleId: saleRef.id,
            eventId,
            itemId: c.itemId,
            name: c.name,
            price: c.price,
            qty: c.qty,
            createdAt: serverTimestamp(),
          })
        }
      })

      setCart([])
      alert("会計完了！")
    } catch (error) {
      console.error(error)

      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert("会計に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-white p-4 pb-48">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">レジ</h1>
        </div>

        {eventItems.length === 0 ? (
          <p className="text-gray-500">登録された商品がありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {eventItems.map((item) => {
              const qty = getQty(item.id)

              return (
                <div key={item.id} className="rounded-xl border p-3 shadow-sm">
                  <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {item.image ? (
                      <img
                        src={toThumbUrl(item.image)}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <p className="text-lg font-medium">{item.name}</p>
                  <p className="font-semibold">¥{item.price}</p>
                  <p className="mb-3 text-gray-600">在庫: {item.stock}</p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="rounded bg-gray-200 px-3 py-2 text-lg disabled:opacity-50"
                      onClick={() => updateQty(item.id, -1)}
                      disabled={qty === 0 || loading}
                    >
                      -
                    </button>

                    <span className="min-w-8 text-center text-lg font-bold">
                      {qty}
                    </span>

                    <button
                      className="rounded bg-green-600 px-3 py-2 text-lg text-white disabled:opacity-50"
                      onClick={() => addToCart(item)}
                      disabled={qty >= item.stock || loading}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>総点数: {totalQty}</span>
          <span>合計: ¥{total}</span>
        </div>

        <button
          className="mt-3 w-full rounded bg-green-600 py-3 text-lg font-bold text-white disabled:opacity-50"
          onClick={checkout}
          disabled={cart.length === 0 || loading}
        >
          {loading ? "会計中..." : "会計する"}
        </button>
      </div>
    </>
  )
}