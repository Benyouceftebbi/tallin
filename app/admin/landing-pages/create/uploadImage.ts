"use server"

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"

export async function uploadImage(file) {
 

  try {
   
    // Create a unique filename for the image in Firebase Storage
    const storageRef = ref(storage, `landing-page-images/${Date.now()}-${file.name}`)

    // Convert the file to an ArrayBuffer
    const buffer = await file.arrayBuffer()

    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    })

    // Get the public download URL for the uploaded file
    const downloadURL = await getDownloadURL(storageRef)

    return { url: downloadURL }
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error)
    if (error instanceof Error) {
      return { error: `Failed to upload file: ${error.message}` }
    }
    return { error: "Failed to upload file due to an unknown error." }
  }
}