"use client"

import { useEffect, useState } from "react"
import {
  addDoc,
  collection,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Event } from "@/types/Event"

type Props = {
  open: boolean
  onClose: () => void
  event?: Event | null
}

const toInputDate = (value?: Timestamp | null) => {
  if (!value) return ""

  const d = value.toDate()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const fromInputDate = (value: string) => {
  if (!value) return null

  const [year, month, day] = value.split("-").map(Number)
  return Timestamp.fromDate(new Date(year, month - 1, day))
}

export default function EventModal({ open, onClose, event }: Props) {
  const isEdit = !!event

  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [place, setPlace] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(event?.name ?? "")
      setDate(toInputDate(event?.date ?? null))
      setPlace(event?.place ?? "")
      setNote(event?.memo ?? "")
    }
  }, [open, event])

  if (!open) return null

  const reset = () => {
    setName("")
    setDate("")
    setPlace("")
    setNote("")
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedDate = date.trim()
    const trimmedPlace = place.trim()
    const trimmedNote = note.trim()

    if (!trimmedName) {
      alert("イベント名を入力してください")
      return
    }

    const eventDate = fromInputDate(trimmedDate)

    try {
      setLoading(true)

      if (isEdit && event?.id) {
        await updateDoc(doc(db, "events", event.id), {
          name: trimmedName,
          date: eventDate,
          place: trimmedPlace,
          note: trimmedNote,
        })
      } else {
        await addDoc(collection(db, "events"), {
          name: trimmedName,
          date: eventDate,
          place: trimmedPlace,
          note: trimmedNote,
        })
      }

      reset()
      onClose()
    } catch (error) {
      console.error(error)
      alert(isEdit ? "イベント編集に失敗しました" : "イベント追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {isEdit ? "イベント編集" : "イベント追加"}
          </h3>

          <button
            onClick={handleClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">イベント名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: デザフェス2026"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">場所</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: 東京ビッグサイト"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">メモ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder="補足メモ"
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
              {loading
                ? isEdit
                  ? "更新中..."
                  : "追加中..."
                : isEdit
                  ? "更新"
                  : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}