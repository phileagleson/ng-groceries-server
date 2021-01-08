import { gql } from 'apollo-server-express'

const userTypeDefs = gql`
  type User {
    id: ID!
    name: String
    email: String
  }

  input RegisterUserInput {
    name: String!
    email: String!
    password: String
  }

  extend type Query {
    users: [User]
    loginUser(email: String!, password: String!): User
    isAuthenticated: User
  }

  extend type Mutation {
    registerUser(userData: RegisterUserInput): User!
  }
`

export default userTypeDefs
