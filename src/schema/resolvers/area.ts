import IArgType from '../../types/ArgType'
import AreaType from '../../types/AreaType'
import ItemType from '../../types/ItemType'
import ArgType from '../../types/ArgType'
import GroceryListType from '../../types/GroceryListType'
import { Area } from '../../models/Area'
import { Item } from '../../models/Item'
import { GroceryList } from '../../models/GroceryList'
import { storeUpload } from '../../utils/storeUpload'
import uploadToCloud, { deleteImage } from '../../utils/uploadToCloud'

interface IContext {
  user: {
    id: string
    name: string
    email: string
  }
}

const areaResolver = {
  Query: {
    areas: async (
      _: ParentNode,
      args: ArgType,
      { user }: IContext
    ): Promise<AreaType[]> => {
      if (!user) {
        throw new Error('Unauthorized')
      }

      return await Area.find().populate('items')
    },
    items: async (): Promise<ItemType[]> => await Item.find(),
    getItemsForArea: async (
      _: ParentNode,
      { areaId }: IArgType,
      { user }: IContext
    ): Promise<ItemType[]> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const area = await Area.findById(areaId).populate('items')
      return area.items
    },
    groceryList: async (): Promise<GroceryListType[]> => {
      const groceryList = await GroceryList.findOne().populate('items')
      return groceryList
    },
  },

  Mutation: {
    addArea: async (
      _: ParentNode,
      { name, imageUpload }: IArgType,
      { user }: IContext //{ name: string; imageUpload: FileUpload }
    ): Promise<AreaType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }

      try {
        const results = await storeUpload(imageUpload)
        try {
          const imageURL = await uploadToCloud(results)
          // Create new area
          const newArea = await new Area({
            name,
            imageURL,
          }).save()

          return newArea.toObject() as AreaType
        } catch (err) {
          console.error('Error uploading image to cloudinary: ', err)
          throw new Error('Error uploading image to cloudinary: ' + err)
        }
      } catch (err) {
        console.error('Error storing image: ', err)
        throw new Error('Error storing image on server: ' + err)
      }
    },
    updateArea: async (
      _: ParentNode,
      { areaId, name, imageUpload }: IArgType,
      { user }: IContext //{ name: string; imageUpload: FileUpload }
    ): Promise<AreaType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      try {
        const area = await Area.findById(areaId)
        if (imageUpload) {
          const originalImage = area.imageURL
          const results = await storeUpload(imageUpload)
          const imageURL = await uploadToCloud(results)
          area.imageURL = imageURL

          // delete originalImage

          await deleteImage(originalImage)
        }

        if (name) {
          area.name = name
        }
        area.save()

        return area
      } catch (err) {
        throw new Error('Area not found')
      }
    },
    deleteArea: async (
      _: ParentNode,
      { areaId }: IArgType,
      { user }: IContext
    ): Promise<AreaType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const area = await Area.findOneAndDelete({ _id: areaId })
      const imageURL = area.imageURL
      if (area) {
        if (imageURL) {
          await deleteImage(imageURL)
        }
        return area
      }
      throw new Error('Area not found')
    },
    addItemToArea: async (
      _: ParentNode,
      { name, areaId }: IArgType,
      { user }: IContext
    ): Promise<ItemType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      // find area
      const area = await Area.findById(areaId).populate('items')
      if (!area) {
        throw new Error('Area not found')
      }

      // see if item exists at all
      const item = await Item.findOne({ name: name.toLowerCase() })

      if (item) {
        // see if item exists
        let found = false
        area.items.forEach((i: ItemType) => {
          if (i._id.toString() === item._id.toString()) {
            found = true
          }
        })
        if (found) {
          throw new Error('Item already exists in ' + area.name)
        } else {
          area.items.push(item)
          area.save()
          return item
        }
      }

      const newItem = await new Item({
        name: name.toLowerCase(),
      }).save()

      area.items.push(newItem)
      await area.save()

      return newItem.toObject() as ItemType
    },
    updateItem: async (
      _: ParentNode,
      { name, itemId }: IArgType,
      { user }: IContext
    ): Promise<ItemType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const item = await Item.findById(itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      item.name = name.toLowerCase()
      await item.save()
      return item
    },
    addItemToGroceryList: async (
      _: ParentNode,
      { groceryId, itemId, name }: IArgType,
      { user }: IContext
    ): Promise<GroceryListType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const groceryList = await GroceryList.findById(groceryId).populate(
        'items'
      )
      let item = await Item.findById(itemId)
      if (item) {
        groceryList.items.push(item)
      } else {
        // see if item anme exists
        if (name) {
          item = await Item.findOne({ name: name.toLowerCase() })
        }

        // chedk for item again
        if (item) {
          groceryList.items.push(item)
        } else {
          // item does not exist in db, create new item
          item = new Item({
            name: name.toLowerCase(),
          })

          await item.save()
          groceryList.items.push(item)
        }
      }
      await groceryList.save()

      return groceryList.toObject() as GroceryListType
    },
    removeItemFromGroceryList: async (
      _: ParentNode,
      { groceryId, itemId }: IArgType,
      { user }: IContext
    ): Promise<GroceryListType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const groceryList = await GroceryList.findById(groceryId).populate(
        'items'
      )
      const index = groceryList.items.findIndex((item: ItemType) => {
        if (item._id.toString() === itemId.toString()) {
          return true
        }
      })

      if (index < 0) {
        throw new Error('Item not found on grocerly list')
      }

      if (index > -1) {
        groceryList.items.splice(index, 1)
      }
      await groceryList.save()

      return groceryList
    },
    createGroceryList: async (
      parent: any,
      args: any,
      { user }: IContext
    ): Promise<GroceryListType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const newGroceryList = new GroceryList()
      await newGroceryList.save()
      return newGroceryList.toObject() as GroceryListType
    },
    deleteItemFromArea: async (
      _: ParentNode,
      { areaId, itemId }: IArgType,
      { user }: IContext
    ): Promise<ItemType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const area = await Area.findById(areaId).populate('items')
      if (!area) {
        throw new Error('Area not found')
      }

      let itemToDelete: ItemType = { _id: '', name: '' }

      const index = area.items.findIndex((item: ItemType) => {
        if (item._id.toString() === itemId.toString()) {
          itemToDelete = item
          return true
        }
      })

      if (index < 0) {
        throw new Error('Item not found in area')
      }

      if (index > -1) {
        area.items.splice(index, 1)
        await area.save()
      }
      return itemToDelete
    },
    resetGroceryList: async (
      _: ParentNode,
      { groceryId }: IArgType,
      { user }: IContext
    ): Promise<GroceryListType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }
      const groceryList = await GroceryList.findById(groceryId).populate(
        'items'
      )
      groceryList.items.splice(0, groceryList.items.length)
      await groceryList.save()

      return groceryList
    },
    sortGroceryList: async (
      _: ParentNode,
      { groceryId, sortedItems }: IArgType,
      { user }: IContext
    ): Promise<GroceryListType> => {
      if (!user) {
        throw new Error('Unauthorized')
      }

      try {
        const groceryList = await GroceryList.findById(groceryId).populate(
          'items'
        )

        if (groceryList.items.length === sortedItems.length) {
          // clear original list
          groceryList.items.splice(0, groceryList.items.length)

          // add items back
          for (const item of sortedItems) {
            const itemRef = await Item.findById(item._id)
            groceryList.items.push(itemRef)
          }
          await groceryList.save()
        }
        return groceryList
      } catch {
        throw new Error('List not found')
      }
    },
  },
}

export default areaResolver
