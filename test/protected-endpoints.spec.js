const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test_helpers')

describe('Protected endpoints', function () {
  let db

  const testUsers = helpers.makeTestUsers()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanDB(db))

  afterEach('cleanup', () => helpers.cleanDB(db))

  beforeEach('insert users', () =>
    helpers.seedUsers(db, testUsers)
  )

  const protectedEndpoints = [
    {
      name: 'POST /posts',
      path: '/posts',
      method: supertest(app).post,
    },
    {
      name: 'DELETE /posts/:postId',
      path: '/posts/:postId',
      method: supertest(app).delete,
    },
    {
      name: 'GET /folders',
      path: '/folders',
      method: supertest(app).get,
    },
    {
      name: 'POST /folders',
      path: '/folders',
      method: supertest(app).post,
    },
    {
      name: 'DELETE /folders/:folderId',
      path: '/folders/:folderId',
      method: supertest(app).delete,
    },
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it(`responds 401 'Missing bearer token' when no bearer token`, () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: `Missing bearer token` })
      })

      it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: `Unauthorized request` })
      })

      it(`responds 401 'Unauthorized request' when invalid sub in payload`, () => {
        const invalidUser = { user_name: 'user-not-existy' }
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: `Unauthorized request` })
      })
    })
  })
})