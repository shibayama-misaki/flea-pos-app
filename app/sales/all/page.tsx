"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, onSnapshot } from "firebase/firestore"
import { db } from "../../../lib/firebase"

type EventItem = {
  id: string
  name: string
  date?: string
  place?: string
  note?: string
}

type ProductItem = {
  id: string
  name: string
  price: number
  image?: string
  isActive?: boolean
}

export default function SalesAllPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [items, setItems] = useState<ProductItem[]>([])



  return (
    <></>
  )
}