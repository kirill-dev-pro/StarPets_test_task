import express from 'express'
import { db } from '../db.ts'
import type User from '../models/User.ts'

const rootRouter = express.Router()

rootRouter.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

rootRouter.get('/', async (_, res) => {
  const [availableUsers] = await db.query('SELECT * FROM users')

  res.send(`
    <!DOCTYPE html>
    <html class="dark">
      <head>
        <title>StarPets Balance Management</title>
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-900 text-gray-100 min-h-screen p-6">
        <h1 class="text-3xl font-bold mb-6">StarPets Balance Management</h1>
        
        <div class="balance-form bg-gray-800 p-4 rounded-lg shadow-md mb-6">
          <h2 class="text-xl font-semibold mb-4">Update Balance</h2>
          <form hx-patch="/api/users/1/balance" hx-target="#user-list" hx-swap="innerHTML" class="flex gap-2">
            <input type="number" name="amount" placeholder="Amount" required class="bg-gray-700 text-white px-3 py-2 rounded">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Update Balance</button>
          </form>
        </div>

        <div id="user-list" class="user-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${
            availableUsers
              ? (availableUsers as User[])
                  .map(
                    (user) => `
            <div class="user-card bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 class="text-lg font-semibold">User ID: ${user.id}</h3>
              <p class="text-gray-300">Balance: ${user.balance}</p>
            </div>
          `,
                  )
                  .join('')
              : '<p class="text-gray-400">No users found</p>'
          }
          <form hx-post="/api/users/1/balance/reset" hx-target="#user-list" hx-swap="innerHTML" class="flex gap-2">
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Reset Balance</button>
          </form>
        </div>

        <div class="docs mt-8 bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">API Documentation</h2>
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>PATCH /api/users/:userId/balance</strong> - Update user balance (requires userId and amount)</li>
            <li><strong>GET /api/users/:userId/balance</strong> - Get user balance</li>
            <li><strong>GET /health</strong> - Health check</li>
          </ul>
        </div>
      </body>
    </html>
  `)
})

export default rootRouter
