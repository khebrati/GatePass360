// Export all controllers
const authController = require('./authController');
const visitController = require('./visitController');
const passController = require('./passController');
const pageController = require('./pageController');

module.exports = {
  authController,
  visitController,
  passController,
  pageController
};

