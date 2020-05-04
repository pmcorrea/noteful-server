const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeTestPosts() {
	return [
		{
			user_id: 1,
			user_name: "Peter",
			avatar: "https://res.cloudinary.com/pmcorrea/image/upload/v1583012322/k2o16y7t0nob9dhovfsw.jpg",
			folder_id: 1,
			post_name: "Chicken Recipes",
			modified: "Mon, 1 Apr 2020 23:18:08 GMT",
			content: "This is some test content.",
			visibility: "Public",
		},

		{
			user_id: 1,
			user_name: "Adam",
			avatar: "https://res.cloudinary.com/pmcorrea/image/upload/v1583012322/k2o16y7t0nob9dhovfsw.jpg",
			folder_id: 1,
			post_name: "Chicken Recipes",
			modified: "Mon, 1 Apr 2020 23:18:08 GMT",
			content: "This is some test content.",
			visibility: "Private",
		},
	]
}

function makeTestFolder() {
	[
		{
			user_id: "2",
			folder_name: "Important"
		},
		{
			user_id: "3",
			folder_name: "Important"
		},
	]
}

function makeTestUsers() {
	return [
		{
			user_name: "Peter_test",
			user_password: "adminpassword",
			user_status: "admin",
			visibility: "Public",
			avatar: "https://res.cloudinary.com/pmcorrea/image/upload/v1583012322/k2o16y7t0nob9dhovfsw.jpg",
		},
		{
			user_name: "Petra_test",
			user_password: "userpassword",
			user_status: "user",
			visibility: "Public",
			avatar: "https://res.cloudinary.com/pmcorrea/image/upload/v1583012322/k2o16y7t0nob9dhovfsw.jpg",
		},

	]
}

function cleanDB(db) {
	return db.transaction(trx =>
		trx.raw(
			`TRUNCATE
			posts, 
			folders,
			users,
			connections
			`
		)
			.then(() =>
				Promise.all([
					trx.raw(`ALTER SEQUENCE folders_id_seq minvalue 0 START WITH 1`),
					trx.raw(`ALTER SEQUENCE posts_id_seq minvalue 0 START WITH 1`),
					trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
					trx.raw(`SELECT setval('folders_id_seq', 0)`),
					trx.raw(`SELECT setval('posts_id_seq', 0)`),
					trx.raw(`SELECT setval('users_id_seq', 0)`),
				])
			)
			.catch(function (error) {
				console.error(error)
			})
	)
}

function seedUsers(db, users) {
	const preppedUsers = users.map(user => ({
		...user,
		user_password: bcrypt.hashSync(user.user_password, 4)
	}))


	return db.into('users').insert(preppedUsers)
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
	const token = jwt.sign({ user_name: user.user_name }, secret, {
		subject: user.user_name,
		algorithm: 'HS256',
	})
	return `Bearer ${token}`
}

module.exports = {
	makeTestFolder,
	makeTestPosts,
	makeTestUsers,
	cleanDB,
	seedUsers,
	makeAuthHeader
}