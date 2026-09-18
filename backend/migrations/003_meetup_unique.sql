-- One meetup record per thread (re-proposable after a decline via ON CONFLICT UPDATE).
ALTER TABLE meetups ADD CONSTRAINT meetups_thread_id_unique UNIQUE (thread_id);