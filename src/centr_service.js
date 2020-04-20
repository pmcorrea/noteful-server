const centrService = {

	getUserIdByUsername(knex, username) {
		return knex
		.select("id")
		.from("users")
		.where("user_name", username)
	},
	getUserNameById(knex, userId) {
		return knex("users")
		.select("user_name")
		.where("id", userId)
	}, 
	getUserById(knex, userId) {
		return knex("users")
		.select("id", "user_name", "visibility", "avatar")
		.where("id", userId)
	}, 
	getUserByUsername(knex, username) {
		return knex("users")
		.select("id", "user_name", "visibility", "avatar")
		.where("user_name", username)
	},
	addUser(knex, hashedUser) {
		return knex
		.insert(hashedUser)
		.into("users")
	},
	deleteUserById(knex, userId) {
		return knex("users")
		.where("id", userId)
		.del()
	}, 
	getAllUsers(knex) {
		return knex("users")
		.select("id", "user_name", "visibility", "avatar")
		.where("user_status", "user")
	}, 
	getAllBlockedUsers(knex) {
		return knex("users")
		.select("id", "user_name", "visibility")
		.where("user_status", "blocked")
	}, 
	getAllAdmins(knex) {
		return knex("users")
		.select("id", "user_name", "visibility")
		.where("user_status", "admin")
	}, 

	getPosts(knex, user_id) {
		return knex
		.select("*")
		.from("posts")
		.where("user_id", user_id)
	},
	getPostById(knex, postId) {
		return knex
		.select("*")
		.from("posts")
		.where({
			id: postId,
		})
	},
	updatePostById(knex, post_name, content, folder_id, visibility, modified, postIdToEdit) {
		return knex("posts")
		.where("id", postIdToEdit)
		.update({
			"post_name": post_name,
			"content": content,
			"folder_id": folder_id,
			"visibility": visibility,
			"modified": modified
		})	
	},
	getPublicPosts(knex, user_id) {
		return knex
		.select("*")
		.from("posts")
		.where({
			user_id: user_id,
			visibility: 'Public'
		})
	},
	getFolders(knex, user_id) {
		return knex
		.select("*")
		.from("folders")
		.where("user_id", user_id)
	},
	addPost(knex, post) {
		return knex
		.returning("*")
		.insert(post)
		.into("posts")
	},
	addFolder(knex, folder) {
		return knex
		.returning("*")
		.insert(folder)
		.into("folders")
	},
	deletePost(knex, postId) {
		return knex("posts")
		.where("id", postId)
		.del()
	},
	deleteFolder(knex, folderId) {
		return knex("folders")
		.where("id", folderId)
		.del()
	},

	updatePassword(knex, userId, newPassword) {
		return knex("users")
		.where("id", userId)
		.update("user_password", newPassword)
	}, 

	updateVisibility(knex, userId, newVisibility) {
		return knex("users")
		.where("id", userId)
		.update("visibility", newVisibility)
	},
	updateAvatar(knex, userId, url) {
		return knex("users")
		.where("id", userId)
		.update("avatar", url)
	},
	updateAvatarOnPostsTable(knex, userId, url) {
		return knex("posts")
		.where("user_id", userId)
		.update("avatar", url)
	},

	insertRequestToFollow(knex, myId, theirId, user_name) {
		newRequest = {
			user_id: myId,
			connection_id: theirId,
			connection_name: user_name,
			request: 'Pending',
			is_following: 'False',
			is_blocked: 'False',
		}

		return knex("connections")
		.insert(newRequest)
	},
	approveRequestToFollow(knex, recordId) {
		return knex("connections")
		.update({
			"request": "Approved",
			"is_following": "True"
		})
		.where("id", recordId)
	},
	getRequestToFollow(knex, myId, theirId) {
		return knex("connections")
		.select("*")
		.where({
			user_id: theirId,
			connection_id: myId,
			request: 'Pending'
		})
	},
	getAllRequestsToFollow(knex, myId) {
		return knex("connections")
		.select("*")
		.where({
			connection_id: myId,
			request: 'Pending'
		})
	},
	getAllRequestsToFollow_UserIds(knex, myId) {
		return knex("connections")
		.select("user_id")
		.where({
			connection_id: myId,
			request: 'Pending'
		})
	},
	getSentRequest(knex, myId, theirId) {
		return knex("connections")
		.select("*")
		.where({
			user_id: myId,
			connection_id: theirId,
		})
	},
	getSentRequests_UserIds(knex, myId) {
		return knex("connections")
		.select("connection_id")
		.where({
			user_id: myId,
			request: 'Pending'
		})
	},

	getConnection(knex, myId, theirId) {
		return knex("connections")
		.select("*")
		.where({
			user_id: myId,
			connection_id: theirId,
			is_following: 'True'
		})
	},
	getConnection_UserId(knex, myId, theirId) {
		return knex("connections")
		.select("id")
		.where({
			user_id: myId,
			connection_id: theirId,
			is_following: 'True'
		})
	},
	deleteConnection(knex, recordId) {
		return knex("connections")
		.where("id", recordId)
		.del()
	},
	getAllConnections(knex, myId) {
		return knex("connections")
		.select("*")
		.where({
			user_id: myId,
			is_following: 'True'
		})
	},
	getAllConnections_UserIds(knex, myId) {
		return knex("connections")
		.select("connection_id")
		.where({
			user_id: myId,
			is_following: 'True'
		})
	},
	

	getFollowers(knex, myId){
		return knex("connections")
		.select("*")
		.where({
			connection_id: myId,
			is_following: 'True'
		})
	},
	getFollowers_UserIds(knex, myId){
		return knex("connections")
		.select("user_id")
		.where({
			connection_id: myId,
			is_following: 'True'
		})
	},
};

module.exports = centrService;
