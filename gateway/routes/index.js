var express = require('express');
var router = express.Router();
var { pageController } = require('../controllers');

/* GET home page. */
router.get('/', pageController.renderIndex);

/* GET login page. */
router.get('/login', pageController.renderLogin);

/* GET register page. */
router.get('/register', pageController.renderRegister);

/* GET panel page. */
router.get('/panel', pageController.renderPanel);

/* GET guest panel page. */
router.get('/panel/guest', pageController.renderGuestPanel);

/* GET host panel page. */
router.get('/panel/host', pageController.renderHostPanel);

/* GET security panel page. */
router.get('/panel/security', pageController.renderSecurityPanel);

/* GET admin panel page. */
router.get('/panel/admin', pageController.renderAdminPanel);

module.exports = router;
