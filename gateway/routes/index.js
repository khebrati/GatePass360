var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login');
});

/* GET register page. */
router.get('/register', function(req, res, next) {
  res.render('register');
});

/* GET panel page. */
router.get('/panel', function(req, res, next) {
  res.render('panel');
});

/* GET guest panel page. */
router.get('/panel/guest', function(req, res, next) {
  res.render('panel-guest');
});

/* GET host panel page. */
router.get('/panel/host', function(req, res, next) {
  res.render('panel-host');
});

/* GET security panel page. */
router.get('/panel/security', function(req, res, next) {
  res.render('panel-security');
});

/* GET admin panel page. */
router.get('/panel/admin', function(req, res, next) {
  res.render('panel-admin');
});

module.exports = router;
