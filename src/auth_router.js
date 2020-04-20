const express = require('express')
const authRouter = express.Router()
const jsonParser = express.json()
const authService = require('./auth_service')
const centrService = require('./centr_service')
const { requireAuth } = require('./jwt-auth.js')

authRouter
	.route('/login')
	.post(jsonParser, (req, res, next) => {
		const { user_name, password, token } = req.body
		const loginUser = { user_name, password }

		if (token) {
			const payload = authService.verifyJwt(token)
			const currentUser = payload.user_name
			
			let getPostsAndFolders = async () => {
				try {
					let userId = await centrService.getUserIdByUsername(req.app.get('db'), currentUser)
					userId = userId[0]['id']

					let posts = await centrService.getPosts(req.app.get('db'), userId)

					let folders = await centrService.getFolders(req.app.get('db'), userId)

					let postsAndFolders = {
						posts: posts, 
						folders: folders,
					}

					return res.status(200).json(postsAndFolders)

				} catch(error) {
					console.error(error)
				}
			}

			getPostsAndFolders()

		} else {
			for (const [key, value] of Object.entries(loginUser)) {
				if (value == null) {					
					return res.status(400).json({
						error: `Missing ${key} in request body`
					})
				}
			}	
		
			let getPostsFoldersAndToken = async () => {
				try {
					let dbUser = await authService.getUser(req.app.get('db'), loginUser.user_name)

					if (!dbUser)
						return res.status(400).json({
							error: `User does not exist, please register.`
						})
					
					if (dbUser.user_status == 'blocked')
						return res.status(400).json({
							error: `User is blocked.`
						})

					let compareMatch = await authService.comparePasswords(loginUser.password, dbUser.user_password)
					if (!compareMatch)
						return res.status(400).json({
							error: 'Incorrect user_name or password!',
						})

					const sub = dbUser.user_name
					const payload = { user_name: dbUser.user_name }

					let authToken = authService.createJwt(sub, payload)

					let dbUserId = await centrService.getUserIdByUsername(req.app.get('db'), dbUser.user_name)
					userId = dbUserId[0]['id']

					let posts = await centrService.getPosts(req.app.get('db'), userId)

					let folders = await centrService.getFolders(req.app.get('db'), userId)

					let postsFoldersAndAuth = {
						posts: posts, 
						folders: folders,
						authToken: authToken
					}

					return res.status(200).json(postsFoldersAndAuth)

				} catch(error) {
					console.error(error)
				}
			}

			getPostsFoldersAndToken()
		}
	})

authRouter
	.route('/register')
	.post(jsonParser, (req, res, next) => {
		const { user_name, password, visibility, profilePicURL } = req.body
		const newUser = { user_name, password, visibility, profilePicURL }

		let registerUser = async () => {
			try {
				let dbUser = await authService.getUser(req.app.get('db'), newUser.user_name)

				if (dbUser)
					return res.status(400).json({
						error: `Username already exists`
					})
					
				let encryptedPw = await authService.encryptPw(newUser.password)

				let hashedUser = {
					user_name: newUser.user_name,
					user_password: encryptedPw,
					user_status: 'user',
					visibility: visibility,
					avatar: profilePicURL
				}

				await authService.addUser(req.app.get('db'),hashedUser)

				return res.status(200).json('User created')
			
			} catch(error) {
				console.error(error)
			}
		}

		registerUser()
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

		let updatePassword = async () => {
			try {
				let user = await authService.getUser(req.app.get('db'), username)
				let comparePasswords = await authService.comparePasswords(oldPassword, user.user_password)

				if (comparePasswords) {
					let userId = await centrService.getUserIdByUsername(req.app.get('db'), username)
					userId = userId[0]['id']

					let encryptedPw = await authService.encryptPw(newPassword)

					await centrService.updatePassword(req.app.get('db'), userId, encryptedPw )

					return res.status(200).json('Password is updated')
				} else {
					return res.status(400).json('Current password is incorrect')
				}
			} catch(error) {
				console.error(error)
			}
		}

		updatePassword()
	})

authRouter
	.route('/changevisibility')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		const {token, visibility} = req.body
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		let changeVisibility = async () => {
			try {

				let userId = await centrService.getUserIdByUsername(req.app.get('db'), username)
				userId = userId[0]['id']

				await centrService.updateVisibility(req.app.get('db'), userId, visibility )
				
				return res.status(200).json('Visibility is updated')

			} catch(error) {
				console.error(error)
			}
		}

		changeVisibility()
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

		let deleteAccount = async () => {
			try {
				let userId = await centrService.getUserIdByUsername(req.app.get('db'), username)
				userId = userId[0]['id']

				await centrService.deleteUserById(req.app.get('db'), userId )
				return res.status(200).json('user deleted')
			} catch(error) {
				console.error(error)
			}
		}

		deleteAccount()
	})

authRouter
	.route('/checkUsername')
	.post(jsonParser, (req, res, next) => {

		let {user_name} = req.body

		let doesUserExists = async () => {
			let user = await centrService.getUserByUsername(
				req.app.get('db'),
				user_name
			)

			user = user[0]
			if (user) {
				return res.status(200).json(true)
			}

			return res.status(200).json(false)
		}

		doesUserExists()
	})

authRouter
	.route('/getCurrentUserDetailsById')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		let userDetails = async () => {
			try {
				let userId = await centrService.getUserIdByUsername(req.app.get('db'), username)
				userId = userId[0]['id']

				let user = await centrService.getUserById(req.app.get('db'), userId )
				return res.status(200).json(user)
			} catch(error) {
				console.error(error)
			}
		}

		userDetails()
	})

authRouter
	.route('/getUserDetailsById')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		let {userId} = req.body

		let userDetails = async () => {
			try {
				let user = await centrService.getUserById(req.app.get('db'), userId )
				user = user[0]
				return res.status(200).json(user)
			} catch(error) {
				console.error(error)
			}
		}

		userDetails()
	})

authRouter
	.route('/getUserDetailsByToken')
	.all(requireAuth)
	.get(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name


		let userDetails = async () => {
			try {
				let user = await centrService.getUserByUsername(req.app.get('db'), username )
				user = user[0]
				return res.status(200).json(user)
			} catch(error) {
				console.error(error)
			}
		}

		userDetails()
	})


authRouter
	.route('/getallusers')
	.all(requireAuth)
	.get((req, res, next) => {
		centrService.getAllUsers(req.app.get('db'))
		.then(result => {
			return res.status(200).json(result)
		})
		.catch(next)
	})

authRouter
	.route('/getconnectionswithdetails')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		centrService.getUserIdByUsername(req.app.get('db'), username)
		.then(user => {
			return user[0]['id'] 
		})
		.then(userId => {
			return centrService.getAllConnections_UserIds(req.app.get('db'), userId)
		})
		.then(connections => {
			return Promise.all(connections.map(user => {
				return centrService.getUserById(req.app.get('db'), user)
			}))
		})
		.then(result => {
			return res.status(200).json(result)
		})
		.catch(next)			
	})





authRouter
	.route('/connections')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		
		let payload = authService.verifyJwt(token)
		let username = payload.user_name

		let getConnections = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					username
				)

				currentUserId = currentUserId[0]['id']
				let connections = await centrService.getAllConnections(
					req.app.get('db'),
					currentUserId
				)

				let connectionIds = connections.map(x => x.connection_id)

				let users = await Promise.all( connectionIds.map( x => { 
					return centrService.getUserById(
						req.app.get('db'),
						x)
					}
				))

				users = users.flat()

				return res.status(200).json(users)
			} catch(error) {
				console.error(error)
			}
		}

		getConnections()
	})
	.delete(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name
		let { userId } = req.body

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(req.app.get('db'), currentUsername)
				currentUserId = currentUserId[0]['id']

				let connectionToDelete = await centrService.getConnection(req.app.get('db'), currentUserId, userId)
				
				if (connectionToDelete.length !== 0) {
					connectionToDeleteId = connectionToDelete[0]['id']

					await centrService.deleteConnection(
						req.app.get('db'),
						connectionToDeleteId
					)
				
					return res.status(200).json(connectionToDeleteId)
				} else {
					res.status(200).json('No connection to delete')
				}
				
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()

	})

authRouter
	.route('/followers')
	.all(requireAuth)
	.get((req, res, next) => {
			let token = req.get("Authorization")
			token = token.slice(7, token.length);
			let payload = authService.verifyJwt(token)
			let currentUsername = payload.user_name

			let getFollowers = async () => {
				try {
					let userId = await centrService.getUserIdByUsername(req.app.get('db'),currentUsername)
					userId = userId[0]['id']
					let followers = await centrService.getFollowers(req.app.get('db'),userId)
					return res.status(200).json(followers)
				} catch(error) {
					console.error(error)
				}
			}

			getFollowers()

	})
	.delete(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name
		let { userId } = req.body

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(req.app.get('db'), currentUsername)
				currentUserId = currentUserId[0]['id']

				let follower = await centrService.getConnection(
					req.app.get('db'),
					userId,
					currentUserId
				)

				if (follower.length !== 0) {
					followerToDelete = follower[0]['id']
					
					await centrService.deleteConnection(
						req.app.get('db'),
						followerToDelete
					)

					return res.status(200).json('Follower deleted')
				} else {
					return res.status(200).json('No follower to delete')
				}			
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()
	})

authRouter
	.route('/notfollowing')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUsername = payload.user_name

		let async = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(req.app.get('db'), currentUsername)
				currentUserId = currentUserId[0]['id']
			
				let allUsers = await centrService.getAllUsers(
					req.app.get('db')
				)

		
				let myConnectons = await centrService.getAllConnections(
					req.app.get('db'),
					currentUserId
				)

				let mySentRequests = await centrService.getSentRequests_UserIds(
					req.app.get('db'),
					currentUserId
				)
				mySentRequestsIds = mySentRequests.map(x => x.connection_id)

				allUsersIds = allUsers.map(x => x.id)
				myConnectonsIds = myConnectons.map(x => x.connection_id)

				let notFollowingIds = allUsersIds.filter(x => !myConnectonsIds.includes(x));
				let notFollowingButRequested = notFollowingIds.filter(x =>!mySentRequestsIds.includes(x) )
				notFollowingButRequested = notFollowingButRequested.filter(x => (
					x !==  currentUserId))
				let notFollowing = 
					await Promise.all(notFollowingButRequested.map(x => {
						return centrService.getUserById(
							req.app.get('db'),
							x
						)
				}))

				notFollowing = notFollowing.flat()
	
				res.status(200).json(notFollowing)
			
			} catch(error) {
				console.error(error)
			}
		}

		async()
		
	})


authRouter
	.route('/followrequests')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)
				currentUserId = currentUserId[0]['id']

				let requests = await centrService.getAllRequestsToFollow_UserIds(
					req.app.get('db'),
					currentUserId
				)

				return res.status(200).json(requests)
			} catch(err) {
				console.error(err)
			}
		}

		asyncFunction()
	})

	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let {userId}  = req.body

		let asyncFunction = async () => {

			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)
				currentUserId = currentUserId[0]['id']

				let request = await centrService.getRequestToFollow(
					req.app.get('db'),
					currentUserId,
					userId
				)

				if (request.length !== 0) {
					request = request[0]['id']

					await centrService.approveRequestToFollow(
						req.app.get('db'),
						request
					)

					res.status(200).json('Request approved')
				} else {
					res.status(200).json('Request to approve not found')
				}
				
			} catch(error) {
				console.error(error)
			}
		}

		asyncFunction()
	})
	.delete(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let { userId } = req.body

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)
				currentUserId = currentUserId[0]['id']

				let requestToDelete = await centrService.getRequestToFollow(
					req.app.get('db'),
					currentUserId,
					userId
				)
				
				if (requestToDelete.length !== 0) {
					requestToDelete = requestToDelete[0]['id']

					await centrService.deleteConnection(
						req.app.get('db'),
						requestToDelete
					)
	
					res.status(200).json('Request deleted')
				} else {
					res.status(200).json('No request found')
				}
					
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()
	})
	

authRouter
	.route('/sentrequests')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)
				currentUserId = currentUserId[0]['id']

				let requests = await centrService.getSentRequests_UserIds(
					req.app.get('db'),
					currentUserId
				)

				return res.status(200).json(requests)
			} catch(err) {
				console.error(err)
			}
		}

		asyncFunction()
	})

	.post(jsonParser, (req, res, next) => {

		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name


		let {userId}  = req.body

		let asyncFunction = async () => {

			try {
					let currentUserId = await centrService.getUserIdByUsername(
						req.app.get('db'),
						currentUser
					)
					currentUserId = currentUserId[0]['id']

					let user_name = await centrService.getUserNameById(
						req.app.get('db'),
						userId
					)

					user_name = user_name[0]['user_name']


					let doesRequestExists = await centrService.getSentRequest(
						req.app.get('db'),
						currentUserId,
						userId
					)

					if (doesRequestExists.length == 0) {
						await centrService.insertRequestToFollow(
							req.app.get('db'),
							currentUserId,
							userId,
							user_name
						)

						res.status(200).json('request added')
					} else {
						res.status(200).json('request already exist')
					}
			} catch(error) {
				console.error(error)
			}
		}

		asyncFunction()
	})
	.delete(jsonParser, (req, res, next) => {

		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let { userId } = req.body

		let asyncFunction = async () => {
			try {
				let currentUserId = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)
				currentUserId = currentUserId[0]['id']

				let requestToDelete = await centrService.getSentRequest(
					req.app.get('db'),
					currentUserId,
					userId
				)
				
				if (requestToDelete.length !== 0) {
					requestToDelete = requestToDelete[0]['id']

					await centrService.deleteConnection(
						req.app.get('db'),
						requestToDelete
					)
	
					res.status(200).json('Request deleted')
				} else {
					res.status(200).json('No request found')
				}
					
			} catch(err) {
				console.log(err)
			}
		}

		asyncFunction()
	})

authRouter
	.route('/updateavatar')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		const {url} = req.body

		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let asyncFunction  = async () => {
			try {
				let userID = await centrService.getUserIdByUsername(
					req.app.get('db'),
					currentUser
				)

				userID = userID[0]['id']

				await centrService.updateAvatar(
					req.app.get('db'),
					userID,
					url
				)
				.then(result => {
					res.status(200).json('Avatar updated')
				})
				.catch()

				await centrService.updateAvatarOnPostsTable(
					req.app.get('db'),
					userID,
					url
				)
				.then(result => {
					res.status(200).json('Avatar on posts table updated')
				})
				.catch()
				
			} catch(error) {
				console.log(error)
			}
		}

		asyncFunction()
	})




module.exports = authRouter