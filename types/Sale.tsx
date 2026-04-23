import { Timestamp } from "firebase/firestore"

export type Sale = {
  createdAt: Timestamp // 販売日時
  eventId: string
  id: string 
  total: number // 合計額
  totalQty: number // 合計点数
}