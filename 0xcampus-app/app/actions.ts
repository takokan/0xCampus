"use server"

import { uploadToPinata, uploadMetadataToPinata } from "@/lib/pinata"

export async function uploadVideoToPinata(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    const ipfsHash = await uploadToPinata(file)
    return { success: true, ipfsHash }
  } catch (error) {
    console.error("Error in uploadVideoToPinata:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function uploadMetadata(metadata: any) {
  try {
    const ipfsHash = await uploadMetadataToPinata(metadata)
    return { success: true, ipfsHash }
  } catch (error) {
    console.error("Error in uploadMetadata:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

