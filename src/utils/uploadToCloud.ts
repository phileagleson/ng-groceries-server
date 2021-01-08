import config from '../config'
import cloudinary from 'cloudinary'
import FileType from '../types/FileType'

const uploadToCloud = async (image: FileType): Promise<string> => {
  cloudinary.v2.config({
    cloud_name: config.GROCERY_CLOUD_NAME,
    api_key: config.GROCERY_CLOUD_API,
    api_secret: config.GROCERY_CLOUD_API_SECRET,
  })

  try {
    const uploadedImage = await cloudinary.v2.uploader.upload(image.path)
    return uploadedImage.secure_url
  } catch (err) {
    throw new Error('Error uploading image: ' + err)
  }
}

export const deleteImage = async (imageURL: string): Promise<any> => {
  const startPOS = imageURL.lastIndexOf('/') + 1
  const endPOS = imageURL.lastIndexOf('.')
  const imageId = imageURL.substring(startPOS, endPOS)

  try {
    const res = await cloudinary.v2.uploader.destroy(imageId)
    return res
  } catch (err) {
    console.log(err)
  }
}

export default uploadToCloud
