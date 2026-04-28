import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json()

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 }
      )
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary env is missing" },
        { status: 500 }
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)

    const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto
      .createHash("sha1")
      .update(signatureBase)
      .digest("hex")

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("timestamp", String(timestamp))
    formData.append("api_key", apiKey)
    formData.append("signature", signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data },
        { status: res.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "failed to destroy image" },
      { status: 500 }
    )
  }
}