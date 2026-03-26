import 'dotenv/config'
import mongoose from 'mongoose'
import app from './server'

const PORT = process.env.PORT ?? 3001
const MONGODB_URI = process.env.MONGODB_URI

async function main() {
  if (!MONGODB_URI) {
    console.error('Set MONGODB_URI in backend/.env (see .env.example)')
    process.exit(1)
  }

  await mongoose.connect(MONGODB_URI)
  console.log('MongoDB connected')

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
