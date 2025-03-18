import axios from "axios"

const pinataApiKey = process.env.PINATA_API_KEY
const pinataApiSecret = process.env.PINATA_API_SECRET

// Function to upload file to IPFS via Pinata
export async function uploadToPinata(file: File) {
  if (!pinataApiKey || !pinataApiSecret) {
    throw new Error("Pinata API keys not configured")
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
      },
    })

    return response.data.IpfsHash
  } catch (error) {
    console.error("Error uploading to Pinata:", error)
    throw new Error("Failed to upload to IPFS")
  }
}

// Function to upload metadata to IPFS via Pinata
export async function uploadMetadataToPinata(metadata: any) {
  if (!pinataApiKey || !pinataApiSecret) {
    throw new Error("Pinata API keys not configured")
  }

  try {
    const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
      },
    })

    return response.data.IpfsHash
  } catch (error) {
    console.error("Error uploading metadata to Pinata:", error)
    throw new Error("Failed to upload metadata to IPFS")
  }
}

