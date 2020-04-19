const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeTestPosts() {
	return [
		{
			post_id: "test_id_1",
			post_name: "test_post_1",
			modified: "2019-01-03T00:00:00.000Z",
			folder_id: "test_folder_id_1",
			content: "This is some test content.",
		},
		{
			post_id: "test_id_2",
			post_name: "test_post_2",
			modified: "2019-01-03T00:00:00.000Z",
			folder_id: "test_folder_id_2",
			content: "This is some test content.",
		}
	]
}

function makeTestFolder() {
	[
		{
			folder_id: "test_folder_id_1",
			folder_name: "test_folder_name_1"
		},
		{
			folder_id: "test_folder_id_2",
			folder_name: "test_folder_name_2"
		},
	]
}

function makeTestUsers() {
	return [
		{
			user_handle: "test_user_1",
			user_password: "test_password_1",
			user_type: "user",
		},
		{
			user_handle: "test_user_2",
			user_password: "test_password_2",
			user_type: "user",
		},
		{
			user_handle: "test_admin_1",
			user_password: "test_password_1",
			user_type: "admin",
		},
		{
			user_handle: "test_admin_2",
			user_password: "test_password_2",
			user_type: "admin",
		},
	]
}

function cleanDB(db) {
	return db.transaction(trx => 
		trx.raw(
			`TRUNCATE
			folders,
			posts,
			users
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
		.catch(function(error) {
			console.error(error)
		})
	)
}

function seedUsers(db, users) {
	const preppedUsers = users.map(user => ({
	  ...user,
	  user_password: bcrypt.hashSync(user.user_password, 1)
	}))


	return db.into('users').insert(preppedUsers)
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
	const token = jwt.sign({ user_name: user.user_handle }, secret, {
	  subject: user.user_handle,
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