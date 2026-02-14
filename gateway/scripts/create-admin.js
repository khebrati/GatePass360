
require('dotenv').config();
const User = require('../models/User');
const pool = require('../database/db');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printUsage() {
  log('\n📋 Admin Registration Script', 'cyan');
  log('============================\n', 'cyan');
  log('Usage:', 'yellow');
  log('  node scripts/create-admin.js <name> <email> <password>\n');
  log('Example:', 'yellow');
  log('  node scripts/create-admin.js "مدیر سیستم" admin@example.com securePassword123\n');
  log('Arguments:', 'yellow');
  log('  name      - Full name of the admin user');
  log('  email     - Email address (must be unique)');
  log('  password  - Password (min 6 characters)\n');
}

async function createAdmin(name, email, password) {
  try {
    log('\n🔧 Creating admin user...', 'blue');

    if (!name || name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('Invalid email format');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const existingUser = await User.existsByEmail(email);
    if (existingUser) {
      throw new Error(`User with email "${email}" already exists`);
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: null,
      role: 'admin'
    });

    log('\n✅ Admin user created successfully!', 'green');
    log('================================', 'green');
    log(`  ID:    ${user.id}`, 'cyan');
    log(`  Name:  ${user.name}`, 'cyan');
    log(`  Email: ${user.email}`, 'cyan');
    log(`  Role:  ${user.role}`, 'cyan');
    log(`  Created: ${user.created_at}`, 'cyan');
    log('================================\n', 'green');

    return user;
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (args.length < 3) {
    log('\n❌ Error: Missing required arguments', 'red');
    printUsage();
    process.exit(1);
  }

  const [name, email, password] = args;

  try {
    await createAdmin(name, email, password);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

