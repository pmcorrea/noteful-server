// Import environment variables
require('dotenv').config()
const { NODE_ENV } = require('./config')

// Import modules and middleware
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')

// Import routers
const centrRouter = require('./centr_router')
const authRouter = require('./auth_router')

// Instantiate Express App
const app = express()

// Setup Middleware
const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';
app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use('/', centrRouter)
app.use('/api/auth', authRouter)
// Our production applications should hide error messages 
// from users and other malicious parties
app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

// Routes
app.get('/', (req, res) => {
    res.send('Hello, world!')
})

// Export app
module.exports = app