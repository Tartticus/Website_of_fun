import Database from 'duckdb';

const db = new Database('passes.db');

// Initialize the database with our table
db.exec(`
  CREATE TABLE IF NOT EXISTS passes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    twitter_username TEXT NOT NULL,
    image_data TEXT NOT NULL,
    date_submitted DATE NOT NULL,
    date_fulfilled TIMESTAMP,
    minted BOOLEAN DEFAULT FALSE
  );
`);

export const savePass = (twitterUsername: string, imageData: string) => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO passes (twitter_username, image_data, date_submitted) VALUES (?, ?, ?)',
      [twitterUsername, imageData, today],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};