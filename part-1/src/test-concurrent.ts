const API_URL = 'http://localhost:3000'
const USER_ID = 1
const AMOUNT = -2 // Deduct 2 units
const TOTAL_REQUESTS = 10000

interface RequestResult {
  statusCode: number
  success: boolean
  response?: any
  error?: string
}

const makeRequest = async (): Promise<RequestResult> => {
  try {
    const response = await fetch(`${API_URL}/api/users/${USER_ID}/balance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: USER_ID,
        amount: AMOUNT,
      }),
    })

    const data = await response.json()

    return {
      statusCode: response.status,
      success: response.ok,
      response: data,
    }
  } catch (error) {
    return {
      statusCode: 0,
      success: false,
      error: (error as Error).message,
    }
  }
}

const getBalance = async (): Promise<number | null> => {
  try {
    const response = await fetch(`${API_URL}/api/users/${USER_ID}/balance`)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return parseFloat(data.balance)
  } catch (error) {
    return null
  }
}

// Main test function
const runConcurrentTest = async (): Promise<void> => {
  console.log('Starting concurrent balance update test...')
  console.log(`Total requests: ${TOTAL_REQUESTS}`)
  console.log(`Amount per request: ${AMOUNT}`)

  // Get initial balance
  const initialBalance = await getBalance()
  console.log(`Initial balance: ${initialBalance}`)

  if (initialBalance === null) {
    console.error('Failed to get initial balance. Make sure the server is running.')
    return
  }

  // Calculate expected results
  const expectedSuccessfulRequests = Math.floor(initialBalance / Math.abs(AMOUNT))
  console.log(`Expected successful requests: ${expectedSuccessfulRequests}`)
  console.log(`Expected failed requests: ${TOTAL_REQUESTS - expectedSuccessfulRequests}`)

  const startTime = Date.now()

  // faster batched sending
  const BATCH_SIZE = 100
  const results: RequestResult[] = []

  for (let i = 0; i < TOTAL_REQUESTS; i += BATCH_SIZE) {
    const batch = Array.from({ length: Math.min(BATCH_SIZE, TOTAL_REQUESTS - i) }, () =>
      makeRequest(),
    )
    const batchResults = await Promise.all(batch)
    results.push(...batchResults)

    // Small delay between batches (optional)
    if (i + BATCH_SIZE < TOTAL_REQUESTS) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  // slower method
  // const results: RequestResult[] = []
  // for (let i = 0; i < TOTAL_REQUESTS; i++) {
  //   const result = await makeRequest()
  //   results.push(result)
  // }

  const endTime = Date.now()
  const duration = endTime - startTime

  // Analyze results
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  const insufficientFunds = results.filter(
    (r) => !r.success && r.response && r.response.error === 'Insufficient funds',
  ).length

  console.log('\n=== TEST RESULTS ===')
  console.log(`Total requests sent: ${TOTAL_REQUESTS}`)
  console.log(`Successful requests: ${successful}`)
  console.log(`Failed requests: ${failed}`)
  console.log(`Failed due to insufficient funds: ${insufficientFunds}`)
  console.log(`Test duration: ${duration}ms`)
  console.log(`Requests per second: ${Math.round(TOTAL_REQUESTS / (duration / 1000))}`)

  // Get final balance
  const finalBalance = await getBalance()
  console.log(`Final balance: ${finalBalance}`)

  // Verify the results
  const expectedFinalBalance = initialBalance + successful * AMOUNT
  console.log(`Expected final balance: ${expectedFinalBalance}`)

  const balanceMatch = Math.abs((finalBalance || 0) - expectedFinalBalance) < 0.01
  const correctSuccessCount = successful === expectedSuccessfulRequests
  const correctFailCount = insufficientFunds === TOTAL_REQUESTS - expectedSuccessfulRequests

  console.log('\n=== VERIFICATION ===')
  console.log(`Balance matches expected: ${balanceMatch ? '✓' : '✗'}`)
  console.log(`Success count correct: ${correctSuccessCount ? '✓' : '✗'}`)
  console.log(`Insufficient funds count correct: ${correctFailCount ? '✓' : '✗'}`)

  if (balanceMatch && correctSuccessCount && correctFailCount) {
    console.log('\n🎉 TEST PASSED: All concurrent requests handled correctly!')
  } else {
    console.log('\n❌ TEST FAILED: Results do not match expectations.')
  }
}

// Check if server is running before starting test
const checkServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`)
    return response.ok
  } catch (error) {
    return false
  }
}

// Run the test
const main = async (): Promise<void> => {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.error('Server is not running on localhost:3000')
    console.error('Please start the server with: npm start')
    process.exit(1)
  }

  await runConcurrentTest()
}

main().catch(console.error)
