var express = require('express');
var router = express.Router();
var { pageController } = require('../controllers');

router.get('/', pageController.renderIndex);

router.get('/login', pageController.renderLogin);

router.get('/register', pageController.renderRegister);

router.get('/panel', pageController.renderPanel);

router.get('/panel/guest', pageController.renderGuestPanel);

router.get('/panel/host', pageController.renderHostPanel);

router.get('/panel/security', pageController.renderSecurityPanel);

router.get('/panel/admin', pageController.renderAdminPanel);

module.exports = router;
