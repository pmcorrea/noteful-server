BEGIN;

ALTER TABLE users DROP COLUMN followers;
ALTER TABLE users DROP COLUMN connections;
ALTER TABLE users DROP COLUMN followRequests;

COMMIT;