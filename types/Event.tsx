import { Timestamp } from "firebase/firestore"

export type Event = {
  date?: Timestamp // 開催日
  id: string
  name: string // イベント名
  memo?: string // 備考
  place?: string // 会場
  url?: string
}