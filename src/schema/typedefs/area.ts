import { gql } from 'apollo-server-express'

export const areaTypeDefs = gql`
  type Area {
    _id: ID!
    name: String!
    imageURL: String
    items: [Item]
  }

  type GroceryList {
    _id: ID!
    items: [Item]
  }

  type Item {
    _id: ID!
    name: String!
  }

  input ItemInput {
    _id: ID!
    name: String!
    _v: Int
  }

  type Image {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Query {
    areas: [Area]
    items: [Item]
    groceryList: GroceryList!
    getItemsForArea(areaId: ID!): [Item]
  }

  type Mutation {
    addItemToArea(name: String!, areaId: ID!): Item
    deleteItemFromArea(areaId: ID!, itemId: ID!): Item
    updateItem(name: String!, itemId: ID!): Item
    removeItemFromGroceryList(groceryId: ID!, itemId: ID!): GroceryList!
    addArea(name: String!, imageUpload: Upload!): Area
    updateArea(areaId: ID!, name: String, imageUpload: Upload): Area
    deleteArea(areaId: ID!): Area
    createGroceryList: GroceryList!
    addItemToGroceryList(groceryId: ID!, itemId: ID!): GroceryList!
    resetGroceryList(groceryId: ID!): GroceryList!
    sortGroceryList(groceryId: ID!, sortedItems: [ItemInput]): GroceryList!
  }
`

export default areaTypeDefs
