// If we add multiple test files, it would be nice if we could 
// avoid needing to require expect and supertest in every file. 
// We can utilize a feature of mocha to require a specific setup 
// file we specify. Then we can add these functions as globals inside tests.
process.env.TZ = 'UTC'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'secret123TEST'
// process.env.PORT='8001'

require('dotenv').config()
const { expect } = require('chai')
const supertest = require('supertest')

process.env.TEST_DB_URL = process.env.TEST_DB_URL
  || "postgresql://postgres@localhost/noteful_test"

global.expect = expect
global.supertest = supertest