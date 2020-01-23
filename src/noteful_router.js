// Import and instantiate Express Router
const express = require('express')
const notefulRouter = express.Router()
// Enable Express to parse JSON
const jsonParser = express.json()
// Import notefulService object
const notefulService = require('./noteful_service')
// Import xss to sanitize incomming requests

// Instantiate an sanitation function 
// const serializeArticle = article => ({
//   id: article.id,
//   style: article.style,
//   title: xss(article.title),
//   content: xss(article.content),
//   date_published: article.date_published,
// })

// '/' Route
notefulRouter
	.route('/notes')
	.get((req, res, next) => {
		// Retrieve all articles, this returns a Promise-like object
		notefulService.getAllNotes(
			// Pass in the knexInstance from the request to getAllArticles()
			req.app.get('db')
		)
		// Utilize Promise-like object, send as JSON
		.then(notes => {
			res.json(notes)
		})
		// Error handler 
		.catch(next)
	})
	.post(jsonParser, (req, res, next) => {
		const { id, note_id, note_name, modified, folder_id, content } = req.body.note
		const newNote = { note_id, note_name, modified, folder_id, content }
		notefulService.insertNote(req.app.get('db'), newNote)
		.then(article => {
			res
				.status(201)
				.json(article)
			})
		// Invoke next for Err handling
		.catch(next)
		
	})

notefulRouter
	.route('/notes/:noteId')
	.delete((req, res, next) => {
		const noteId = req.params.noteId
		notefulService.deleteNote(req.app.get('db'), noteId)
		.then(() => {
			res.status(204).end()
		})
		.catch(next)
	})

notefulRouter
	.route('/folders/:folderId')
	.delete((req, res, next) => {
		const folderId = req.params.folderId
		notefulService.deleteFolder(req.app.get('db'), folderId)
		.then(item => {
			// console.log(item)
			res.status(200).json(item)
		})
		.catch(next)
	})

notefulRouter
	.route('/folders')
	.get((req, res, next) => {
		// Retrieve all articles, this returns a Promise-like object
		notefulService.getAllFolders(
			// Pass in the knexInstance from the request to getAllArticles()
			req.app.get('db')
		)
		// Utilize Promise-like object, send as JSON
		.then(notes => {
			res.json(notes)
		})
		// Error handler 
		.catch(next)
	})
	.post(jsonParser, (req, res, next) => {
		const { id, folder_id, folder_name } = req.body.folder
		const newFolder = { folder_id, folder_name }
		notefulService.insertFolder(req.app.get('db'), newFolder)
		.then(article => {
			res
				.status(201)
				.json(article)
			})
		// Invoke next for Err handling
		.catch(next)
		
	})
	

module.exports = notefulRouter