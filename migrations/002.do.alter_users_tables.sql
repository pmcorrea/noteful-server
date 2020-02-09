BEGIN;

ALTER TABLE users ADD COLUMN followers TEXT [];
ALTER TABLE users ADD COLUMN connections  TEXT [];
ALTER TABLE users ADD COLUMN followrequests  TEXT [];

COMMIT;

