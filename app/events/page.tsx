"use client"

import { useEffect, useState } from "react"
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore"
import Link from "next/link"
import { db } from "../../lib/firebase"
import { Event } from "@/types/Event"
import EditEventModal from "@/components/modal/EditEventModal"

const formatDate = (value: any) => {
  if (!value) return "日付未設定"
  if (value.toDate) return value.toDate().toLocaleDateString("ja-JP")
  if (typeof value === "string") return value
  return "日付未設定"
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [open, setOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Event[]

      setEvents(data)
    })

    return () => unsub()
  }, [])

  /** 新規追加モーダルを開く */
  const openAddModal = () => {
    setEditingEvent(null)
    setOpen(true)
  }

  /** 編集モーダルを開く */
  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setOpen(true)
  }

  /** モーダルを閉じる */
  const closeModal = () => {
    setOpen(false)
    setEditingEvent(null)
  }

  /** イベント削除 */
  const deleteEvent = async (event: Event) => {
    const ok = confirm(`「${event.name}」を削除しますか？`)
    if (!ok) return

    try {
      await deleteDoc(doc(db, "events", event.id))
    } catch (error) {
      console.error(error)
      alert("削除に失敗しました")
    }
  }

  return (
    <>
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
          <h2 className="text-2xl font-bold">イベント一覧</h2>

          <button
            onClick={openAddModal}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white"
          >
            イベント追加
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-gray-500">イベントがありません</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border p-4 shadow-sm">
                <Link href={`/events/${event.id}`}>
                  <div className="cursor-pointer">
                    <p className="text-lg font-medium">{event.name}</p>

                    <p className="text-sm text-gray-600">
                      {formatDate(event.date)}
                      {event.place ? ` / ${event.place}` : ""}
                    </p>

                    {event.memo && (
                      <p className="mt-1 text-sm text-gray-500">
                        {event.memo}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(event)}
                    className="rounded bg-blue-500 px-3 py-2 text-sm font-medium text-white"
                  >
                    編集
                  </button>

                  <button
                    onClick={() => deleteEvent(event)}
                    className="rounded bg-red-500 px-3 py-2 text-sm font-medium text-white"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <EditEventModal
        open={open}
        onClose={closeModal}
        event={editingEvent}
      />
    </>
  )
}