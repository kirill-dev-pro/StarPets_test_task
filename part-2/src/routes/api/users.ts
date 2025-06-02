import express from 'express'
import { DatabaseError } from 'sequelize'
import { db } from '../../db.ts'
import User from '../../models/User.ts'

const router = express.Router()

router.patch('/:userId/balance', async (req, res) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const amount = parseInt(req.body.amount, 10)
  if (Number.isNaN(amount)) {
    return res.status(400).json({ error: 'amount must be a number' })
  }

  const user = await User.findByPk(userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  try {
    const [[newBalance]] = await db.query(
      'UPDATE users SET balance = balance + :amount WHERE id = :id RETURNING balance;',
      {
        replacements: {
          amount,
          id: userId,
        },
      },
    )

    res.json({
      success: true,
      userId: user.id,
      previousBalance: user.balance,
      amount: amount,
      newBalance,
    })
  } catch (error) {
    if (error instanceof DatabaseError) {
      // assuming all DatabaseError are because of validation
      return res.status(400).json({ error: 'Insufficient funds' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:userId/balance', async (req, res) => {
  const { userId } = req.params

  const user = await User.findByPk(parseInt(userId, 10))

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
    })
  }

  res.json({
    userId: user.dataValues.id,
    balance: user.dataValues.balance,
  })
})

router.post('/:userId/balance/reset', async (req, res) => {
  const { userId } = req.params
  const user = await User.findByPk(parseInt(userId, 10))
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  await user.update({ balance: 10000 })
  res.json({ success: true })
})

export default router
