"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
} from "firebase/firestore"
import { db } from "../../../lib/firebase"
import { EventItem } from "@/types/EventItem"
import { Item } from "@/types/Item"
import AddEventItemModal from "@/components/modal/AddEventItemModal"
import EditEventItemModal from "@/components/modal/EditEventItemModal"
import { Event } from "@/types/Event"
import { toThumbUrl } from "@/utils/file"

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
  const [openAddModal, setOpenAddModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingEventItem, setEditingEventItem] = useState<EventItem | null>(null)

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
        itemName: item?.name || eventItem.name || "不明な商品",
        image: eventItem.image || item?.image || "",
      }
    })
  }, [eventItems, items])

  const addableItems = useMemo(() => {
    const registeredIds = new Set(eventItems.map((ei) => ei.itemId))
    return items.filter((item) => !registeredIds.has(item.id))
  }, [items, eventItems])

    const openEdit = (eventItem: EventItem) => {
    setEditingEventItem(eventItem)
    setOpenEditModal(true)
  }

  const closeEdit = () => {
    setOpenEditModal(false)
    setEditingEventItem(null)
  }

  const deleteEventItem = async (eventItem: EventItem) => {
    const ok = confirm(`「${eventItem.name}」をこのイベントから削除しますか？`)
    if (!ok) return

    try {
      await deleteDoc(doc(db, "eventItems", eventItem.id))
    } catch (error) {
      console.error(error)
      alert("イベント商品の削除に失敗しました")
    }
  }

  return (
    <>
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
              {event.memo && <p className="mt-1">{event.memo}</p>}
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-bold">このイベントの商品</h3>

            <button
              onClick={() => setOpenAddModal(true)}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              商品を追加
            </button>
          </div>

          {joinedEventItems.length === 0 ? (
            <p className="text-gray-500">商品がまだ登録されていません</p>
          ) : (
            <div className="space-y-3">
              {joinedEventItems.map((ei) => (
                <div key={ei.id} className="flex justify-between rounded-xl border p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                      {ei.image ? (
                        <img
                          src={toThumbUrl(ei.image)}
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

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEdit(ei)}
                      className="rounded bg-blue-500 px-3 py-2 text-sm font-medium text-white"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteEventItem(ei)}
                      className="rounded bg-red-500 px-3 py-2 text-sm font-medium text-white"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <AddEventItemModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        eventId={eventId}
        addableItems={addableItems}
      />

      <EditEventItemModal
        open={openEditModal}
        onClose={closeEdit}
        eventItem={editingEventItem}
      />
    </>
  )
}