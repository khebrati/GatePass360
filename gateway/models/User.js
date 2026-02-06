const pool = require('../database/db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * User Model - handles all database operations for users
 */
class User {
  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, phone, role, created_at FROM "User" WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM "User" WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Check if user exists by email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  static async existsByEmail(email) {
    const result = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows.length > 0;
  }

  /**
   * Create a new user
   * @param {Object} userData - { name, email, password, phone, role }
   * @returns {Promise<Object>}
   */
  static async create({ name, email, password, phone, role }) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO "User" (name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email.toLowerCase(), passwordHash, phone || null, role || 'guest']
    );
    return result.rows[0];
  }

  /**
   * Verify password
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Update last login timestamp
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE "User" SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  /**
   * Find host by ID (verifies role is 'host')
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findHostById(id) {
    const result = await pool.query(
      'SELECT id, name, email FROM "User" WHERE id = $1 AND role = $2',
      [id, 'host']
    );
    return result.rows[0] || null;
  }

  /**
   * Find host by email (verifies role is 'host')
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findHostByEmail(email) {
    const result = await pool.query(
      'SELECT id, name, email FROM "User" WHERE email = $1 AND role = $2',
      [email.toLowerCase(), 'host']
    );
    return result.rows[0] || null;
  }

  /**
   * Get all users (for admin)
   * @returns {Promise<Array>}
   */
  static async findAll() {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM "User" ORDER BY created_at DESC'
    );
    return result.rows;
  }
}

module.exports = User;

