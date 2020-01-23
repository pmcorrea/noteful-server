BEGIN;

CREATE TABLE noteful_folders (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    folder_id TEXT UNIQUE,
    folder_name TEXT NOT NULL
);

CREATE TABLE noteful_notes (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    note_id TEXT,
    note_name TEXT,
    modified TEXT,
    folder_id TEXT REFERENCES noteful_folders(folder_id) ON DELETE CASCADE NOT NULL,
    content TEXT
);

COMMIT;