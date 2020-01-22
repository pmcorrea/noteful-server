// Import PORT from config file
const { PORT } = require('./config')
const app = require('./app')

// Server Controller
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})