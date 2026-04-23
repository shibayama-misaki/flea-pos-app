import { Timestamp } from "firebase/firestore"

export type SaleItem = {
  createdAt: Timestamp // 販売日時
  eventId: string
  id: string
  itemId: string
  name: string // 商品名
  price: number // 販売単価
  qty: number // 販売点数
  saleId: string
}