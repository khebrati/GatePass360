/**
 * Page Controller - handles rendering of view pages
 */
const pageController = {
  /**
   * Render home page
   * GET /
   */
  renderIndex: (req, res) => {
    res.render('index');
  },

  /**
   * Render login page
   * GET /login
   */
  renderLogin: (req, res) => {
    res.render('login');
  },

  /**
   * Render register page
   * GET /register
   */
  renderRegister: (req, res) => {
    res.render('register');
  },

  /**
   * Render general panel page
   * GET /panel
   */
  renderPanel: (req, res) => {
    res.render('panel');
  },

  /**
   * Render guest panel page
   * GET /panel/guest
   */
  renderGuestPanel: (req, res) => {
    res.render('panel-guest');
  },

  /**
   * Render host panel page
   * GET /panel/host
   */
  renderHostPanel: (req, res) => {
    res.render('panel-host');
  },

  /**
   * Render security panel page
   * GET /panel/security
   */
  renderSecurityPanel: (req, res) => {
    res.render('panel-security');
  },

  /**
   * Render admin panel page
   * GET /panel/admin
   */
  renderAdminPanel: (req, res) => {
    res.render('panel-admin');
  }
};

module.exports = pageController;

