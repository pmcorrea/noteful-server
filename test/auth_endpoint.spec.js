const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test_helpers')
const jwt = require('jsonwebtoken')

describe('Auth Endpoints', function() {
	let db
	const testUsers = helpers.makeTestUsers()
	const testUser = testUsers[0]

	before('make knex connection', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL,
		})
		app.set('db', db)
	})

	after('disconnect from db', () => db.destroy())
	
	before('cleanup', () => helpers.cleanDB(db))

	afterEach('cleanup', () => helpers.cleanDB(db))

	describe(`POST /api/auth/login`, () => {
		beforeEach('insert users', () => (
			helpers.seedUsers(db, testUsers)
		))

		const requiredFields = ['user_name', 'password']

		requiredFields.forEach(field => {
			const loginAttemptBody = {
				user_name: testUser.user_handle,
				password: testUser.user_password
			}

			it(`responds w/ 400 if ${field} is missing`, () => {
				delete loginAttemptBody[field]

				return supertest(app)
					.post('/api/auth/login')
					.send(loginAttemptBody)
					.expect(400, {
						error: `Missing ${field} in request body`,
					})
			})
		})

		it('responds 404 when user or password is invalid', () => {
			const invalidUser = {
				user_name: 'notRealUser',
				password: 'wrongPassword'
			}

			return supertest(app)
				.post('/api/auth/login')
				.send(invalidUser)
				.expect(400, { error: `Incorrect user_name or password` })
		})

		it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
			const userValidCreds = {
				user_name: testUser.user_handle,
				password: testUser.user_password,
			}

			const expectedToken = jwt.sign(
				{ user_name: testUser.user_handle },
				process.env.JWT_SECRET,
				{
					subject: testUser.user_handle,
					algorithm: 'HS256',
				}
			)

			return supertest(app)
				.post('/api/auth/login')
				.send(userValidCreds)
				.expect(200, {
					authToken: expectedToken,
				})
		})
	})
})