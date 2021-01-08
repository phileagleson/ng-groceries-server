import config from '../config'
import jwt from 'jsonwebtoken'
import UserType from '../types/UserType'
import bcrypt from 'bcryptjs'
import { User } from '../models/User'

interface IPayload {
  user: {
    id: string
    name: string
    email: string
  }
}

export const checkPass = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

export const createAccessToken = async (user: UserType): Promise<string> => {
  const token = jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
    config.GROCERY_ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m',
    }
  )

  return token
}

export const createRefreshToken = async (user: UserType): Promise<string> => {
  const token = jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
    config.GROCERY_REFRESH_TOKEN_SECRET,
    {
      expiresIn: '10d',
    }
  )

  return token
}

export const getUser = async (token: string): Promise<UserType | null> => {
  // attempt to validate token
  try {
    const payload = jwt.verify(
      token,
      config.GROCERY_ACCESS_TOKEN_SECRET
    ) as IPayload
    return payload.user as any
  } catch {
    return null
  }
}

export const refreshTokens = async (
  refreshToken: string
): Promise<any | null> => {
  let userId = -1

  try {
    const test = jwt.decode(refreshToken) as any
    const {
      user: { id },
    } = jwt.decode(refreshToken) as any
    userId = id
  } catch (err) {
    return null
  }

  if (!userId) {
    return null
  }

  const user = await User.findById(userId)
  if (!user) {
    return null
  }

  try {
    jwt.verify(refreshToken, config.GROCERY_REFRESH_TOKEN_SECRET)
  } catch (err) {
    return null
  }

  // we have a user with a good refresh token, create a new token and a new refresh token
  const newRefreshToken = await createRefreshToken(user)
  const accessToken = await createAccessToken(user)
  return {
    token: accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  }
}
