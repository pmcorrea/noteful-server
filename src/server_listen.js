require('dotenv').config()
const { PORT } = require('./config')
const app = require('./app')
const knex = require('knex')


const knexInstance = knex({
    client: 'pg', 
    connection: process.env.DATABASE_URL
})

// Avoid dependency cycle
app.set('db', knexInstance)


app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})