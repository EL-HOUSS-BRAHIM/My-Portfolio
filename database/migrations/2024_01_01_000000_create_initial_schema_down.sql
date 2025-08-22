-- Rollback: create_initial_schema
-- Created: 2024-01-01

-- Drop tables in reverse order to handle foreign key constraints
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS uploads;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS newsletter_subscribers;
DROP TABLE IF EXISTS experiences;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS contact_submissions;
DROP TABLE IF EXISTS users;