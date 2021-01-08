import { FileUpload } from 'graphql-upload'
import ItemType from './ItemType'

interface IArgType {
  name: string
  areaId: string
  itemId: string
  groceryId: string
  imageUpload: FileUpload
  sortedItems: ItemType[]
}

export default IArgType
