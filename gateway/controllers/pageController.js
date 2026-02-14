/**
 * Page Controller - handles rendering of view pages
 */
const pageController = {
  /**
   * GET /
   */
  renderIndex: (req, res) => {
    res.render('index');
  },

  /**
   * GET /login
   */
  renderLogin: (req, res) => {
    res.render('login');
  },

  /**
   * GET /register
   */
  renderRegister: (req, res) => {
    res.render('register');
  },

  /**
   * GET /panel
   */
  renderPanel: (req, res) => {
    res.render('panel');
  },

  /**
   * GET /panel/guest
   */
  renderGuestPanel: (req, res) => {
    res.render('panel-guest');
  },

  /**
   * GET /panel/host
   */
  renderHostPanel: (req, res) => {
    res.render('panel-host');
  },

  /**
   * GET /panel/security
   */
  renderSecurityPanel: (req, res) => {
    res.render('panel-security');
  },

  /**
   * GET /panel/admin
   */
  renderAdminPanel: (req, res) => {
    res.render('panel-admin');
  }
};

module.exports = pageController;

