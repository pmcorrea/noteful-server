const notefulService = {
	// User methods
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
		.select("id", "user_name", "visibility")
		.where("id", userId)
	}, 
	getUserByUsername(knex, username) {
		return knex("users")
		.select("id", "user_name", "visibility")
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
		.select("id", "user_name", "visibility", "followers", "connections", "followrequests")
		.where("user_status", "user")
	}, 
	getAllBlockedUsers(knex) {
		return knex("users")
		.select("id", "user_name", "visibility", "followers", "connections", "followrequests")
		.where("user_status", "blocked")
	}, 
	getAllAdmins(knex) {
		return knex("users")
		.select("id", "user_name", "visibility", "followers", "connections", "followrequests")
		.where("user_status", "admin")
	}, 
	// Notes and folder methods 
	getNotes(knex, user_id) {
		return knex
		.select("*")
		.from("notes")
		.where("user_id", user_id)
	},
	getFolders(knex, user_id) {
		return knex
		.select("*")
		.from("folders")
		.where("user_id", user_id)
	},
	addNote(knex, note) {
		return knex
		.returning("*")
		.insert(note)
		.into("notes")
	},
	addFolder(knex, folder) {
		return knex
		.returning("*")
		.insert(folder)
		.into("folders")
	},
	deleteNote(knex, noteId) {
		return knex("notes")
		.where("id", noteId)
		.del()
	},
	deleteFolder(knex, folderId) {
		return knex("folders")
		.where("id", folderId)
		.del()
	},
	// Password methods
	updatePassword(knex, userId, newPassword) {
		return knex("users")
		.where("id", userId)
		.update("user_password", newPassword)
	}, 
	// Visibility methods
	updateVisibility(knex, userId, newVisibility) {
		return knex("users")
		.where("id", userId)
		.update("visibility", newVisibility)
	},
	// Connection methods
	getConnections(knex, userId) {
		return knex("users")
		.select("connections")
		.where("id", userId)
	}, 
	// redundant method
	updateConnectionsByUsername(knex, username, updatedFollowing) {
		return knex("users")
		.update("connections", updatedFollowing)
		.where("user_name", username)
	}, 
	updateConnectionsById(knex, userId, following) {
		return knex("users")
		.update("connections", following)
		.where("id", userId)
		.returning("connections")
	},
	// Followers methods
	getFollowers(knex, userId){
		return knex("users")
		.select("followers")
		.where("id", userId)
	},
	updateFollowersById(knex, userId, newFollowers){
		return knex("users")
		.update("followers", newFollowers)
		.where("id", userId)
	}, 
};

module.exports = notefulService;
