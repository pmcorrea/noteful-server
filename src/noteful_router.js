const express = require('express')
const notefulRouter = express.Router()
const jsonParser = express.json()
const notefulService = require('./noteful_service')
const { requireAuth } = require('./jwt-auth')
const xss = require('xss')
const authService = require('./auth_service')

// Instantiate an sanitation function 
// const serializeResponse = article => ({
//   id: article.id,
//   style: article.style,
//   title: xss(article.title),
//   content: xss(article.content),
//   date_published: article.date_published,
// })

notefulRouter
	.route('/notes')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let user = payload.user_name

		notefulService.getNotes(
			req.app.get('db'),
			user
		)
		.then(notes => {
			res.json(notes)
		})
		.catch(next)
	})
	.post(jsonParser, (req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let userFromPayload = payload.user_name

		return notefulService.getUserId(req.app.get('db'), userFromPayload)
			.then(userId => {
				
				let user_id = userId[0]['id']
				const { note_name, modified, folder_id, content } = req.body.note
				const newNote = { user_id, note_name, modified, folder_id, content }
			
				notefulService.addNote(req.app.get("db"), newNote)
					.then(result => {
						return res.status(200).json(result)
						})
					.catch(next);
			})
			.catch(next)
	})

notefulRouter
	.route('/notes/:noteId')
	.all(requireAuth)
	.delete((req, res, next) => {
		const noteId = req.params.noteId
		notefulService.deleteNote(req.app.get('db'), noteId)
		.then(() => {
			res.status(200).json(noteId)
		})
		.catch(next)
	})

notefulRouter
	.route('/folders/:folderId')
	.all(requireAuth)
	.delete((req, res, next) => {
		const folderId = req.params.folderId
		notefulService.deleteFolder(req.app.get('db'), folderId)
		.then(folderId => {
			return res.status(200).json(folderId)
		})
		.catch(next)
	})

notefulRouter
	.route('/folders')
	.all(requireAuth)
	.get((req, res, next) => {
		let token = req.get("Authorization")
		token = token.slice(7, token.length);
		let payload = authService.verifyJwt(token)
		let user = payload.user_name
		
		notefulService.getFolders(
			
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
		
		return notefulService.getUserId(req.app.get('db'), userFromPayload)
			.then(userId => {
				const newFolder = { 
					user_id: userId[0]['id'], 
					folder_name: folder_name 
				}
				return notefulService.addFolder(req.app.get('db'), newFolder)
					.then(result => {
						return res.status(200).json(result)
						})
					.catch(next)
						})
		.catch(next)	
	})
	
module.exports = notefulRouter