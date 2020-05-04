const express = require('express')
const centrRouter = express.Router()
const jsonParser = express.json()
const centrService = require('./centr_service')
const { requireAuth } = require('./jwt-auth')
const xss = require('xss')
const authService = require('./auth_service')

centrRouter
	.route('/editpost')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let userFromPayload = payload.user_name

		let { postId } = req.body

		let async = async () => {
			let postToEdit = await centrService.getPostById(
				req.app.get('db'),
				postId
			)
			res.status(200).json(postToEdit)
		}
		async()
	})

centrRouter
	.route('/updatepost')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let userFromPayload = payload.user_name

		let { post } = req.body

		let { post_name, content, folder_id, visibility, modified, postIdToEdit } = post

		centrService.updatePostById(
			req.app.get('db'),
			post_name,
			xss(content),
			folder_id,
			visibility,
			modified,
			postIdToEdit
		)
			.then(result => {
				return res.status(200).json('post updated')
			})
			.catch(err => {
				console.error(err)
			})
	})

centrRouter
	.route('/posts')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let userFromPayload = payload.user_name

		return centrService.getUserIdByUsername(req.app.get('db'), userFromPayload)
			.then(userId => {

				let user_id = userId[0]['id']

				let { user_name, folder_id, post_name, modified, content, visibility, avatar } = req.body.post
				user_name = user_name['user_name']
				let newPost = { user_id, user_name, folder_id, post_name, modified, content: xss(content), visibility, avatar }

				centrService.addPost(req.app.get("db"), newPost)
					.then(result => {
						return res.status(200).json(result)
					})
					.catch(next);
			})
			.catch(next)
	})

centrRouter
	.route('/publicposts')
	.all(requireAuth)
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let currentUser = payload.user_name

		let { userId } = req.body

		let async = async () => {
			try {
				let result =
					await Promise.all(userId.map(x => {

						return centrService.getPublicPosts(
							req.app.get('db'),
							x
						)
					}))

				function compareDates(a, b) {

					let aDate = new Date(a.modified)
					let bDate = new Date(b.modified)

					if (aDate > bDate) {
						return -1
					}

					if (bDate > aDate) {
						return 1
					}

					return 0
				}

				if (result.length !== 0) {
					result = result.flat()
					result.sort(compareDates)
					res.status(200).json(result)
				} else {
					res.status(200).json([])
				}

			} catch (error) {
				console.error(error)
			}
		}
		async()


	})

centrRouter
	.route('/posts/:postId')
	.all(requireAuth)
	.delete((req, res, next) => {
		const postId = req.params.postId
		centrService.deletePost(req.app.get('db'), postId)
			.then(() => {
				res.status(200).json(postId)
			})
			.catch(next)
	})

centrRouter
	.route('/folders/:folderId')
	.all(requireAuth)
	.delete((req, res, next) => {
		const folderId = req.params.folderId
		centrService.deleteFolder(req.app.get('db'), folderId)
			.then(folderId => {
				return res.status(200).json(folderId)
			})
			.catch(next)
	})

centrRouter
	.route('/folders')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let user = payload.user_name

		centrService.getFolders(

			req.app.get('db'),
			user
		)
			.then(folders => {
				res.json(folders)
			})
			.catch(next)
	})
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let userFromPayload = payload.user_name

		const { folder_name } = req.body.folder

		return centrService.getUserIdByUsername(req.app.get('db'), userFromPayload)
			.then(userId => {
				const newFolder = {
					user_id: userId[0]['id'],
					folder_name: folder_name
				}
				return centrService.addFolder(req.app.get('db'), newFolder)
					.then(result => {
						return res.status(200).json(result)
					})
					.catch(next)
			})
			.catch(next)
	})

module.exports = centrRouter