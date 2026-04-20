"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"

type Sale = {
  id: string
  total: number
  items: any[]
  createdAt: any
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])

  /** 商品ごとの合計 */
  const summary = sales.reduce((acc: any, sale) => {
    sale.items.forEach((item: any) => {
      if (!acc[item.name]) {
        acc[item.name] = { qty: 0, total: 0 }
      }
      acc[item.name].qty += item.qty
      acc[item.name].total += item.qty * item.price
    })
    return acc
  }, {})

  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"))

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[]

      setSales(data)
    })

    return () => unsub()
  }, [])

  return (
    <>
    <main className="min-h-screen p-4 bg-white">
      <h1 className="text-2xl font-bold mb-4">売上一覧</h1>
      {sales.length === 0 ? (
        <p className="text-gray-500">売上なし</p>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="border p-3 rounded">
              <p className="font-bold">合計 ¥{sale.total}</p>

              <div className="text-sm text-gray-600">
                {sale.items.map((item, i) => (
                  <div key={i}>
                    {item.name} ×{item.qty}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mt-6 mb-2">商品別売上</h2>
      <div className="space-y-2">
        {Object.entries(summary).map(([name, data]: any) => (
          <div key={name} className="border p-2 rounded flex justify-between">
            <span>{name}</span>
            <span>{data.qty}個 / ¥{data.total}</span>
          </div>
        ))}
      </div>
    </main>
    </>
  )
}