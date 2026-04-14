import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes'
import countriesRouter from './routes/countries.routes'
import landmarksRouter from './routes/landmarks.routes'
import usersRouter from './routes/users.routes'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api', authRouter)
app.use('/api', countriesRouter)
app.use('/api', landmarksRouter)
app.use('/api', usersRouter)

export default app
