// src/db-mysql.js
// Helper to query the shared MySQL database for user information

const mysql = require("mysql2/promise");

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "event_management",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
};

/**
 * Get user email by user ID from the shared MySQL database
 * @param {number|string} userId - The user ID
 * @returns {Promise<string|null>} - User email or null if not found
 */
async function getUserEmailById(userId) {
  if (!userId) return null;

  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT email FROM users WHERE id = ? AND is_active = true",
        [userId],
      );

      if (rows.length > 0) {
        return rows[0].email;
      }
      return null;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error querying MySQL for user email:", error);
    return null;
  }
}

/**
 * Get organizer email from event by event ID
 * @param {number|string} eventId - The event ID
 * @returns {Promise<string|null>} - Organizer email or null if not found
 */
async function getOrganizerEmailByEventId(eventId) {
  if (!eventId) return null;

  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT u.email FROM users u
         INNER JOIN events e ON u.id = e.organizer_id
         WHERE e.id = ? AND u.is_active = true`,
        [eventId],
      );

      if (rows.length > 0) {
        return rows[0].email;
      }
      return null;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error querying MySQL for organizer email by event:", error);
    return null;
  }
}

module.exports = { getUserEmailById, getOrganizerEmailByEventId };
