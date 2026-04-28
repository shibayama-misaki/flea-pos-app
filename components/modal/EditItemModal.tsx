"use client"

import { useEffect, useState } from "react"
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Item } from "@/types/Item"

type Props = {
  open: boolean
  onClose: () => void
  item?: Item | null
}

type CloudinaryUploadResponse = {
  secure_url: string
  public_id: string
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function EditItemModal({ open, onClose, item }: Props) {
  const isEdit = !!item

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [memo, setMemo] = useState("")
  const [currentImage, setCurrentImage] = useState("")
  const [currentImagePublicId, setCurrentImagePublicId] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    setName(item?.name ?? "")
    setPrice(item?.price != null ? String(item.price) : "")
    setMemo(item?.memo ?? "")
    setCurrentImage(item?.image ?? "")
    setCurrentImagePublicId(item?.imagePublicId ?? "")
    setImageFile(null)
    setPreviewUrl("")
  }, [open, item])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  if (!open) return null

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setName("")
    setPrice("")
    setMemo("")
    setCurrentImage("")
    setCurrentImagePublicId("")
    setImageFile(null)
    setPreviewUrl("")
  }

  const handleClose = () => {
    if (loading) return
    reset()
    onClose()
  }

  const handleSelectImage = (file: File | null) => {
    if (!file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setImageFile(null)
      setPreviewUrl("")
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("画像サイズは5MB以下にしてください")
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setPreviewUrl("")
    setCurrentImage("")
    setCurrentImagePublicId("")
  }

  const uploadImageToCloudinary = async (
    file: File
  ): Promise<{ imageUrl: string; publicId: string }> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Cloudinaryの環境変数が設定されていません")
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", UPLOAD_PRESET)
    formData.append("folder", "items")

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }

    const data: CloudinaryUploadResponse = await res.json()

    return {
      imageUrl: data.secure_url,
      publicId: data.public_id,
    }
  }

  const deleteCloudinaryImage = async (publicId: string) => {
    const res = await fetch("/api/cloudinary/destroy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const numPrice = Number(price)

    if (!trimmedName) {
      alert("商品名を入力してください")
      return
    }

    if (Number.isNaN(numPrice) || numPrice < 0) {
      alert("価格を正しく入力してください")
      return
    }

    try {
      setLoading(true)

      let imageUrl = currentImage
      let imagePublicId = currentImagePublicId

      if (imageFile) {
        const uploaded = await uploadImageToCloudinary(imageFile)
        imageUrl = uploaded.imageUrl
        imagePublicId = uploaded.publicId

        if (isEdit && currentImagePublicId) {
          try {
            await deleteCloudinaryImage(currentImagePublicId)
          } catch (error) {
            console.error("old image delete failed", error)
          }
        }
      }

      const payload = {
        image: imageUrl,
        imagePublicId,
        name: trimmedName,
        memo: memo.trim(),
        price: numPrice,
        isActive: true,
        updatedAt: serverTimestamp(),
      }

      if (isEdit && item?.id) {
        await updateDoc(doc(db, "items", item.id), payload)
      } else {
        await addDoc(collection(db, "items"), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }

      reset()
      onClose()
    } catch (error) {
      console.error(error)
      alert(isEdit ? "商品更新に失敗しました" : "商品追加に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const displayImage = previewUrl || currentImage

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{isEdit ? "商品編集" : "商品追加"}</h3>
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
            <label className="mb-1 block text-sm font-medium">商品名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: アクリルキーホルダー"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">価格</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: 1000"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">商品画像</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSelectImage(e.target.files?.[0] ?? null)}
              className="w-full rounded border px-3 py-2"
              disabled={loading}
            />

            {displayImage ? (
              <div className="mt-3">
                <img
                  src={displayImage}
                  alt="プレビュー"
                  className="h-32 w-32 rounded border object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="mt-2 text-sm text-red-600 underline"
                  disabled={loading}
                >
                  画像を外す
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                画像を選ばない場合は未設定で保存されます
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded border px-3 py-2"
              placeholder="例: 50mm×50mm"
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
              {loading ? (isEdit ? "更新中..." : "追加中...") : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}