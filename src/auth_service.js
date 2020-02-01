const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('./config')

function getUser(db, user_name) {
	return db("users")
		.where("user_name", user_name )
		.first()
}

function insertUser(db, user_credentials) {
	return db
		.insert(user_credentials)
		.into("users")
}

function encryptPw(pw) {
	return bcrypt.hash(pw, 4)
}

function comparePasswords(loginPw, dbPw) {
	return bcrypt.compare(loginPw, dbPw)
}

function createJwt(subject, payload) {
	return jwt.sign(
		payload, 
		config.JWT_SECRET, 
		{
			subject,
			algorithm: 'HS256'
		})
}

function verifyJwt(token) {
  return jwt.verify(token, config.JWT_SECRET, {
    algorithms: ['HS256'],
  })
}

module.exports = {
	getUser,
	comparePasswords,
	createJwt,
	verifyJwt,
	insertUser,
	encryptPw
}