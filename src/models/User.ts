import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
})

export const User = mongoose.model('User', userSchema)
