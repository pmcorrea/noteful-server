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

		// if token exists
		if (token) {
			const payload = authService.verifyJwt(token)
			const currentUser = payload.user_name
			
			notefulService.getUserIdByUsername(req.app.get('db'), currentUser)
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
		// if no token exists	
		} else {
			// if username or password is missing from payload
			for (const [key, value] of Object.entries(loginUser)) {
				if (value == null) {					
					return res.status(400).json({
						error: `Missing ${key} in request body`
					})
				}
			}	
		
			authService.getUser(req.app.get('db'), loginUser.user_name)
			.then(dbUser => {
				// if username does not exists
				if (!dbUser)
					return res.status(400).json({
						error: `User does not exist, please register.`
					})
				
				// if username is blocked
				if (dbUser.user_status == 'blocked')
					return res.status(400).json({
						error: `User is blocked.`
					})

				// compare passwords
				return authService.comparePasswords(loginUser.password, dbUser.user_password)
				.then(compareMatch => {
					if (!compareMatch)
						return res.status(400).json({
							error: 'Incorrect user_name or password!',
						})
					
					// if passwords match, create token and grab notes/folders
					const sub = dbUser.user_name
					const payload = { user_name: dbUser.user_name }
					let result;

					let authToken = authService.createJwt(sub, payload)
				
					notefulService.getUserIdByUsername(req.app.get('db'), dbUser.user_name)
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
					authService.addUser(
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
					notefulService.getUserIdByUsername(req.app.get('db'), username)
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
					notefulService.getUserIdByUsername(req.app.get('db'), user.user_name)
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
	.route('/getUserDetailsById')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name
		
		authService.getUser(req.app.get('db'), username)
		.then(user => {
					notefulService.getUserIdByUsername(req.app.get('db'), user.user_name)
					.then(userPayload => {
						let userId = userPayload[0]['id']
							notefulService.getUserById(req.app.get('db'), userId )
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
					notefulService.getUserIdByUsername(req.app.get('db'), user.user_name)
					.then(userPayload => {
						let userId = userPayload[0]['id']
							notefulService.deleteUserById(req.app.get('db'), userId )
							.then(result => {
								return res.status(200).json(result)
							}).catch(next)
					}).catch(next)
		}).catch(next)
	})

authRouter
	.route('/getallusers')
	.all(requireAuth)
	.get((req, res, next) => {
		notefulService.getAllUsers(req.app.get('db'))
		.then(result => {
			return res.status(200).json(result)
		})
		.catch(next)
	})

authRouter
	.route('/getconnections')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		notefulService.getUserIdByUsername(req.app.get('db'), username)
		.then(result => {
			let userId = result[0]['id']
			notefulService.getConnections(req.app.get('db'), userId)
			.then(result => {
				return res.status(200).json(result)
			}).catch(next)
			
		}).catch(next)
		
		
	})

authRouter
	.route('/getconnectionswithdetails')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		notefulService.getUserIdByUsername(req.app.get('db'), username)
		.then(user => {
			return user[0]['id'] 
		})
		.then(userId => {
			return notefulService.getConnections(req.app.get('db'), userId)
		})
		.then(followingUsernames => {
			return followingUsernames[0]['connections']
		})
		.then(connections => {
			return Promise.all(connections.map(user => {
				return notefulService.getUserByUsername(req.app.get('db'), user)
			}))
		})
		.then(result => {
			return res.status(200).json(result)
		})
		.catch(next)			
	})

authRouter
	.route('/postconnection')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		// Get new connectionId
		let { newConnectionId } = req.body

		// Get current User
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		// Get current user ID
		notefulService.getUserByUsername(req.app.get('db'), currentUser)
		.then(userInfo => {
			return userInfo[0]['id']
		})
		// Get current user connections
		.then(currentUserId => {
			return notefulService.getConnections(req.app.get('db'), currentUserId)
		})
		.then(currentUserConnections => {
			return currentUserConnections[0]['connections']
		})
		// Create updated current user connections
		.then(currentUserConnections => {
			// Get new conection username 
			return notefulService.getUserNameById(req.app.get('db'), newConnectionId)
			.then(newConnectionUsername => {
				return [...currentUserConnections, newConnectionUsername[0]['user_name']]
			})	
		})
		// Update current user connections 
		.then(updatedConnections => {
			return notefulService.updateConnectionsByUsername(req.app.get('db'), currentUser, updatedConnections)
		})
		.then(result => {
			return res.status(200).json('Connection added')
		})
		.catch(next)
	})


authRouter
	.route('/postFollower')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		// Get Current Username
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name
		
		// Get new connection ID
		let { newConnectionId } = req.body
		
		// Get new connection's followers by id
		notefulService.getFollowers(req.app.get('db'), newConnectionId)
		// create updated followers
		.then(followers => {
			let currentFollowers = followers[0]['followers']
			return  [...currentFollowers, currentUsername]
		})
		// update followers by new conection id
		.then(updatedFollowers => {
			return notefulService.updateFollowersById(req.app.get('db'), newConnectionId, updatedFollowers)
		})
		.then(result => {
			return res.status(200).json('new follower added')
		})
		.catch(next)

	})

authRouter
	.route('/deleteconnection')
	.all(requireAuth)
	.delete(jsonParser, (req, res, next) => {
		// Get Current Username
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name
		let { oldConnectionId } = req.body

		let asyncFunction = async () => {
			try {
				// get current userId
				let userId = await notefulService.getUserIdByUsername(req.app.get('db'), currentUsername)
				userId = userId[0]['id']

				// get current connections
				let currentConnections = await notefulService.getConnections(req.app.get('db'), userId)
				currentConnections = currentConnections[0]['connections']

				// get old connection username by id
				let oldConnection = await notefulService.getUserNameById(req.app.get('db'), oldConnectionId)
				oldConnection = oldConnection[0]['user_name']

				// create updated connections
				let updatedConnections = currentConnections.filter(conn => (
					conn !== oldConnection
				))

				// update connections in db 
				let result = await notefulService.updateConnectionsById(req.app.get('db'), userId, updatedConnections)
				return res.status(200).json(result)
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()

	})

authRouter
	.route('/deletefollower')
	.all(requireAuth)
	.delete(jsonParser, (req, res, next) => {
		// Get Current Username
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name
		let { oldConnectionId } = req.body

		let asyncFunction = async () => {
			try {
				// get current followers of old connection
				let currentConnections = await notefulService.getFollowers(req.app.get('db'), oldConnectionId)
				currentConnections = currentConnections[0]['followers']

				// create updated followers
				currentConnections = currentConnections.filter(conn => (
					conn !== currentUsername
				))

				// update followers for old conn
				let updatedFollowers = await notefulService.updateFollowersById(req.app.get('db'), oldConnectionId, currentConnections)

				return res.status(200).json(updatedFollowers)
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()
	})

module.exports = authRouter