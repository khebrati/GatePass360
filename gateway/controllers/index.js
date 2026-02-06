// Export all controllers
const authController = require('./authController');
const visitController = require('./visitController');
const passController = require('./passController');
const pageController = require('./pageController');
const adminController = require('./adminController');

module.exports = {
  authController,
  visitController,
  passController,
  pageController,
  adminController
};

