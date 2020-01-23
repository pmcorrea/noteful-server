// Import app, and PORT from config file
// Import env variables, ArticlesServices object, and knex instance
require('dotenv').config()
const { PORT } = require('./config')
const app = require('./app')
const knex = require('knex')

// Create the knex instance
const knexInstance = knex({
    client: 'pg', 
    connection: process.env.DATABASE_URL
})

// Avoid dependency cycle
// Attached knexInstance to app as a variable called 'db'
// Now all incoming requests have knexInstance as a property
app.set('db', knexInstance)

// Begin listening on POST
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})