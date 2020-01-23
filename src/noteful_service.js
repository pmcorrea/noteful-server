// ArticlesService object holds methods to execute on database
// We pass in the knex instance 
const notefulService = {

  getAllFolders(knex){
    // knex methods returns Promise-like objects
    return knex.select('*').from('noteful_folders')
  },
  getAllNotes(knex){
    // knex methods returns Promise-like objects
    return knex.select('*').from('noteful_notes')
  },
  insertFolder(knex, folder){
    // knex methods returns Promise-like objects
    return knex
      .insert(folder)
      .into('noteful_folders')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  insertNote(knex, note){
    // knex methods returns Promise-like objects
    return knex
      .insert(note)
      .into('noteful_notes')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  deleteNote(knex, noteId){
    // knex methods returns Promise-like objects
    return knex('noteful_notes')
      .where('note_id', noteId)
      .del()
  },
  deleteFolder(knex, folderId){
    // knex methods returns Promise-like objects
    return knex('noteful_folders')
      .where('folder_id', folderId)
      .del()
      .then((numDeleted) => {
        return knex
        .select('*')
        .from('noteful_folders')
      })
      
  },
}

module.exports = notefulService