import jwt from 'jsonwebtoken'

export const tokenPour = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' })

export const bearer = (id) => ({ Authorization: `Bearer ${tokenPour(id)}` })
