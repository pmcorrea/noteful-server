const notefulService = {
	getUserId(knex, user_name) {
		return knex
		  .select("id")
		  .from("users")
		  .where("user_name", user_name);
    },
    insertUser(knex, hashedUser) {
      return knex
        .insert(hashedUser)
        .into("users")
      },
  getNotes(knex, user_id) {
    return knex
      .select("*")
      .from("notes")
      .where("user_id", user_id);
  },
  getFolders(knex, user_id) {
    return knex
      .select("*")
      .from("folders")
      .where("user_id", user_id);
  },
  addNote(knex, note) {
    return knex
    .returning("*")
    .insert(note)
    .into("notes");
  },
  addFolder(knex, folder) {
    return knex
      .returning("*")
      .insert(folder)
      .into("folders");
  },
  deleteNote(knex, noteId) {
    return knex("notes")
      .where("id", noteId)
      .del();
  },
  deleteFolder(knex, folderId) {
    return knex("folders")
      .where("id", folderId)
      .del();
  },
  updatePassword(knex, userId, newPassword) {
    return knex("users")
      .where("id", userId)
      .update("user_password", newPassword);
  }, 
  updateVisibility(knex, userId, newVisibility) {
    return knex("users")
      .where("id", userId)
      .update("visibility", newVisibility);
  },
  getVisibilityAndUserName(knex, userId) {
    return knex("users")
      .select("visibility", "user_name")
      .where("id", userId);
  }, 
  deleteAccount(knex, userId) {
    return knex("users")
      .where("id", userId)
      .del()
  }
};

module.exports = notefulService;
