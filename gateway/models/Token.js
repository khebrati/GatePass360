const pool = require('../database/db');

/**
 * Token Model - handles token blacklist operations
 */
class Token {
  /**
   * Add token to blacklist
   * @param {string} token
   * @param {number} userId
   * @returns {Promise<void>}
   */
  static async blacklist(token, userId) {
    await pool.query(
      'INSERT INTO "TokenBlacklist" (token, user_id) VALUES ($1, $2)',
      [token, userId]
    );
  }

  /**
   * Check if token is blacklisted
   * @param {string} token
   * @returns {Promise<boolean>}
   */
  static async isBlacklisted(token) {
    const result = await pool.query(
      'SELECT id FROM "TokenBlacklist" WHERE token = $1',
      [token]
    );
    return result.rows.length > 0;
  }
}

module.exports = Token;

