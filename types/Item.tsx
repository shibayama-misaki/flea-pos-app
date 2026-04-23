export type Item = {
  id: string
  image?: string // 商品画像
  name: string // 商品名
  memo?: string // 備考
  price?: number // 単価
  isActive?: boolean
}