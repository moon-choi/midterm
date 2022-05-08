DROP TABLE IF EXISTS quizzes_and_answers CASCADE;
CREATE TABLE quizzes_and_answers (
  id SERIAL PRIMARY KEY NOT NULL,
  -- user_id REFERENCES users(id),
  quiz TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_public BOOLEAN NOT NULL
);
