"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { EventItem } from "@/types/EventItem"
import { Item } from "@/types/Item"

type Event = {
  id: string
  name: string
  date?: Timestamp
  place?: string
  note?: string
}

const formatDate = (value: any) => {
  if (!value) return "日付未設定"
  if (value.toDate) return value.toDate().toLocaleDateString("ja-JP")
  if (typeof value === "string") return value
  return "日付未設定"
}

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [eventItems, setEventItems] = useState<EventItem[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    const q = query(collection(db, "events"), where("__name__", "==", eventId))

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0]
        setEvent({
          id: docSnap.id,
          ...docSnap.data(),
        } as Event)
      }
    })

    return () => unsub()
  }, [eventId])

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

  const joinedEventItems = useMemo(() => {
    return eventItems.map((eventItem) => {
      const item = items.find((i) => i.id === eventItem.itemId)
      return {
        ...eventItem,
        itemName: item?.name || "不明な商品",
        image: item?.image || "",
      }
    })
  }, [eventItems, items])

  const addableItems = useMemo(() => {
    const registeredIds = new Set(eventItems.map((ei) => ei.itemId))
    return items.filter((item) => !registeredIds.has(item.id))
  }, [items, eventItems])

  const addItemToEvent = async (item: Item) => {
    const stock = Number(prompt("初期在庫を入力してください", "1"))
    const price = Number(prompt("販売価格を入力してください", String(item.price)))

    if (Number.isNaN(stock) || stock < 0) {
      alert("在庫を正しく入力してください")
      return
    }

    if (Number.isNaN(price) || price < 0) {
      alert("価格を正しく入力してください")
      return
    }

    try {
      await addDoc(collection(db, "eventItems"), {
        eventId,
        itemId: item.id,
        name: item.name,
        stock,
        price,
        image: item.image
      })
    } catch (error) {
      console.error(error)
      alert("イベント商品追加に失敗しました")
    }
  }

  return (
    <main className="min-h-screen bg-white p-4 pb-8">
      <section className="mb-8">
        <h2 className="mb-2 text-2xl font-bold">
          {event ? event.name : "読み込み中..."}
        </h2>

        {event && (
          <div className="text-sm text-gray-600">
            <p>
              {formatDate(event.date)}
              {event.place ? ` / ${event.place}` : ""}
            </p>
            {event.note && <p className="mt-1">{event.note}</p>}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xl font-bold">このイベントの商品</h3>

        {joinedEventItems.length === 0 ? (
          <p className="text-gray-500">商品がまだ登録されていません</p>
        ) : (
          <div className="space-y-3">
            {joinedEventItems.map((ei) => (
              <div key={ei.id} className="rounded-xl border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                    {ei.image ? (
                      <img
                        src={ei.image}
                        alt={ei.itemName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <p className="text-lg font-medium">{ei.itemName}</p>
                    <p className="text-sm text-gray-600">在庫: {ei.stock}</p>
                    <p className="text-sm text-gray-600">価格: ¥{ei.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-xl font-bold">追加できる商品</h3>

        {addableItems.length === 0 ? (
          <p className="text-gray-500">追加できる商品はありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {addableItems.map((item) => (
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
                <p className="mb-3 font-semibold">¥{item.price}</p>

                <button
                  onClick={() => addItemToEvent(item)}
                  className="w-full rounded bg-green-600 py-2 font-medium text-white"
                >
                  このイベントに追加
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}