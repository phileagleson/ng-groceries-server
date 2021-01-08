import config from './config'
import express, { Application, NextFunction, Request, Response } from 'express'
import { ApolloServer } from 'apollo-server-express'
import mongoose from 'mongoose'
import { typeDefs } from './schema/typedefs/index'
import { resolvers } from './schema/resolvers/index'
import { getUser, refreshTokens } from './utils/auth'

export interface IRequest extends Request {
  user: {
    name: string
  }
}

const startServer = async () => {
  const app: Application = express()

  const server: ApolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }) => {
      let user = null
      const token = req.headers['x-token'] as string
      if (token !== null && token !== 'undefined') {
        user = await getUser(token)
      }

      // we found a user return
      if (user) {
        return { req, res, user }
      } else {
        // try to refresh
        const refreshToken = req.headers['x-refresh-token'] as string
        if (refreshToken !== null && refreshToken !== undefined) {
          const newTokens = await refreshTokens(refreshToken)
          if (newTokens?.token && newTokens?.refreshToken) {
            res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token')
            res.set('x-token', newTokens.token)
            res.set('x-refresh-token', newTokens.refreshToken)
            user = newTokens.user
          }
        }
        return { req, res, user }
      }
    },
  })
  server.applyMiddleware({ app })

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    user: config.MONGO_GROCERY_USER, //process.env.MONGO_GROCERY_USER,
    pass: config.MONGO_GROCERY_PASS, //process.env.MONGO_GROCERY_PASS,
  }

  try {
    await mongoose.connect(config.DB_URI, options)

    console.info(`Connected to database on Worker process ${process.pid}`)
  } catch (err) {
    console.error(
      `DB Connection error: ${err.stack} on Worker process ${process.pid}`
    )
  }

  app.listen({ port: config.GROCERY_PORT }, () => {
    console.info(
      `Server ready at http://localhost:${config.GROCERY_PORT}${server.graphqlPath}`
    )
  })
}

startServer()
