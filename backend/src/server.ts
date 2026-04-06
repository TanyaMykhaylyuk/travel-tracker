import express from 'express'
import cors from 'cors'
import countriesRouter from './routes/countries.routes'
import landmarksRouter from './routes/landmarks.routes'
import usersRouter from './routes/users.routes'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', countriesRouter)
app.use('/api', landmarksRouter)
app.use('/api', usersRouter)

export default app
