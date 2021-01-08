import fs from 'fs'
import path from 'path'
import FileType from '../types/FileType'
import { FileUpload } from 'graphql-upload'
import shortid from 'shortid'

export const storeUpload = async (upload: FileUpload): Promise<FileType> => {
  const { createReadStream, filename, mimetype } = await upload
  const stream = createReadStream()
  const id = shortid.generate()
  const pathName = path.join(__dirname, `../../public/images/${id}-${filename}`)
  const file = { id, filename, mimetype, path: pathName }

  try {
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(pathName)

      writeStream.on('finish', resolve)

      writeStream.on('error', (error) => {
        fs.unlink(pathName, () => {
          reject(error)
        })
      })
      stream.on('error', (error) => writeStream.destroy(error))

      stream.pipe(writeStream)
    })
  } catch (err) {
    console.log('Error saving file: ', err)
  }

  return file
}
