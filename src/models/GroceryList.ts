import mongoose from 'mongoose'

const groceryListSchema = new mongoose.Schema({
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
  ],
})

export const GroceryList = mongoose.model('GroceryList', groceryListSchema)
