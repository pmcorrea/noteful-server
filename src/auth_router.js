const express = require('express')
const authRouter = express.Router()
const jsonParser = express.json()
const authService = require('./auth_service')
const notefulService = require('./noteful_service')
const { requireAuth } = require('./jwt-auth.js')


authRouter
	.route('/login')
	.post(jsonParser, (req, res, next) => {
		const { user_name, password, token } = req.body
		const loginUser = { user_name, password }

		if (token) {
			const payload = authService.verifyJwt(token)
			const userFromPayload = payload.user_name
			
			notefulService.getUserId(req.app.get('db'), userFromPayload)
							.then(userId => {
								notefulService.getNotes(req.app.get('db'), userId[0]['id'])
									.then(notes => {
										notefulService.getFolders(req.app.get('db'), userId[0]['id'])
											.then(folders => {
												result = {
													notes: notes, 
													folders: folders,
												}
												return res.status(200).json(result)
											})
									})
							})		
		} else {
			for (const [key, value] of Object.entries(loginUser)) {
				if (value == null) {					
					return res.status(200).json({
						error: `Missing ${key} in request body`
					})
				}
			}	
		
			authService.getUser(req.app.get('db'), loginUser.user_name)
			.then(dbUser => {
				if (!dbUser)
					return res.status(400).json({
						error: `User does not exist, please register.`
					})
				
				if (dbUser.user_status== 'blocked')
					return res.status(400).json({
						error: `User is blocked.`
					})

					
				return authService.comparePasswords(loginUser.password, dbUser.user_password)
					.then(compareMatch => {
						if (!compareMatch)
							return res.status(400).json({
								error: 'Incorrect user_name or password!',
							})
						
						const sub = dbUser.user_name
						const payload = { user_name: dbUser.user_name }
						let result;

						let authToken = authService.createJwt(sub, payload)
				

						notefulService.getUserId(req.app.get('db'), dbUser.user_name)
							.then(userId => {
								notefulService.getNotes(req.app.get('db'), userId[0]['id'])
									.then(notes => {
										notefulService.getFolders(req.app.get('db'), userId[0]['id'])
											.then(folders => {
												result = {
													notes: notes, 
													folders: folders,
													authToken: authToken
												}
												return res.status(200).json(result)
											})
									})
							})
					})
					.catch(next)	
			})
			.catch(next)
		}	
	})

authRouter
	.route('/register')
	.post(jsonParser, (req, res, next) => {
		const { user_name, password, visibility } = req.body
		const newUser = { user_name, password, visibility }

		authService.getUser(
			req.app.get('db'),
			newUser.user_name
		)
		.then(dbUser => {
			if (dbUser)
				return res.status(400).json({
					error: `Username already exists`
				})	
				 
			return authService.encryptPw(newUser.password)
				.then(hashedPw => {
					let hashedUser = {
						user_name: newUser.user_name,
						user_password: hashedPw,
						user_status: 'user',
						visibility: visibility
					}
					authService.insertUser(
						req.app.get('db'),
						hashedUser
					)
					.then(result => {
						return res.status(200).json('User created')
					})
					.catch(error => (
						console.error(error)
					))
				})
				.catch(next)		
		})
		.catch(next)
})

authRouter
	.route('/changepassword')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		const {oldPassword, newPassword, confirmNewPassword, token} = req.body

		if (confirmNewPassword !== newPassword ){
			return res.status(400).json('New passwords do not match')
		}
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name
		
		authService.getUser(req.app.get('db'), username)
		.then(user => {
			authService.comparePasswords(oldPassword, user.user_password)
			.then(result => {
				if (result) {
					notefulService.getUserId(req.app.get('db'), username)
					.then(userPayload => {
						let userId = userPayload[0]['id']

						authService.encryptPw(newPassword)
						.then(encryptedPw => {
						
							notefulService.updatePassword(req.app.get('db'), userId, encryptedPw )
							.then(result => {
								return res.status(200).json('Password is updated')
							})
						})
					})	
				} else {
					return res.status(400).json('Current password is incorrect')
				}
			})
		})
		.catch(next)

		
	})

authRouter
	.route('/changevisibility')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		const {token, visibility} = req.body
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name
		
		authService.getUser(req.app.get('db'), username)
		.then(user => {
					notefulService.getUserId(req.app.get('db'), user.user_name)
					.then(userPayload => {
						let userId = userPayload[0]['id']
							notefulService.updateVisibility(req.app.get('db'), userId, visibility )
							.then(result => {
								return res.status(200).json('Visibility is updated')
							}).catch(next)
					}).catch(next)
		}).catch(next)
	})

authRouter
	.route('/getVisibilityAndUserName')
	.all(requireAuth)
	// .get(jsonParser, (req, res, next) => {
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name
		
		authService.getUser(req.app.get('db'), username)
		.then(user => {
					notefulService.getUserId(req.app.get('db'), user.user_name)
					.then(userPayload => {
						let userId = userPayload[0]['id']
							notefulService.getVisibilityAndUserName(req.app.get('db'), userId )
							.then(result => {
								return res.status(200).json(result)
							}).catch(next)
					}).catch(next)
		}).catch(next)
	})
		
authRouter
	.route('/deleteAccount')
	.all(requireAuth)
	.delete(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name
		
		const {confirmUsername, currentUsername} = req.body
		

		if (confirmUsername !== currentUsername) {
			return res.status(400).json('User name to delete does not match')
		}
		
		authService.getUser(req.app.get('db'), username)
		.then(user => {
					notefulService.getUserId(req.app.get('db'), user.user_name)
					.then(userPayload => {
						let userId = userPayload[0]['id']
							notefulService.deleteAccount(req.app.get('db'), userId )
							.then(result => {
								return res.status(200).json(result)
							}).catch(next)
					}).catch(next)
		}).catch(next)
	})

module.exports = authRouter