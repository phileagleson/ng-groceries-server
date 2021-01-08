import { User } from '../../models/User'
import UserType from '../../types/UserType'
import { IRequest } from '../../index'
import bcrypt from 'bcryptjs'
import {
  checkPass,
  createAccessToken,
  createRefreshToken,
} from '../../utils/auth'
import { Response } from 'express'

interface IRegisterUserInput {
  userData: {
    name: string
    email: string
    password: string
  }
}

interface IContext {
  req: IRequest
  res: Response
  user: UserType
}

interface IArgs {
  email: string
  password: string
}

const userResolver = {
  Query: {
    users: async (): Promise<UserType[]> => await User.find(),
    isAuthenticated: (
      _: ParentNode,
      args: IArgs,
      { user }: IContext
    ): UserType => {
      if (!user) {
        throw new Error('Unauthenticated')
      }

      return user
    },
    loginUser: async (
      _: ParentNode,
      { email, password }: IArgs,
      { res }: IContext
    ): Promise<UserType> => {
      const user = await User.findOne({ email })
      if (!user) {
        throw new Error('User not found')
      }
      // check if password matches
      const loginResult = await checkPass(password, user.passwordHash)
      if (!loginResult) {
        throw new Error('Invalid Password')
      }

      // email and password match generate tokens to send back
      const accessToken = await createAccessToken(user)
      const refreshToken = await createRefreshToken(user)

      // store as cookie
      res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token')
      res.set('x-token', accessToken)
      res.set('x-refresh-token', refreshToken)

      return { name: user.name, email: user.email, id: user._id }
    },
  },
  Mutation: {
    registerUser: async (
      _: ParentNode,
      { userData }: IRegisterUserInput
    ): Promise<UserType> => {
      const existingUser = await User.findOne({ email: userData.email })
      if (existingUser) {
        throw new Error('User already registered')
      }

      try {
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(userData.password, salt)
        const newUser = new User({
          name: userData.name,
          email: userData.email,
          passwordHash: hashedPassword,
        })

        await newUser.save()
        const userObject = newUser.toObject()
        return { ...userObject, id: userObject._id } as UserType
      } catch (err) {
        throw new Error('Error creating user ' + err)
      }
    },
  },
}
export default userResolver
