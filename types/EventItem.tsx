export type EventItem = {
  eventId: string
  id: string
  image?: string // 商品画像
  itemId: string
  memo?: string // 備考
  name: string // 商品名
  price: number // 単価
  stock: number // 在庫数
}