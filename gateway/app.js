var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { initializeDatabase } = require('./database/init-db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var visitsRouter = require('./routes/visits');
var passesRouter = require('./routes/passes');
var adminRouter = require('./routes/admin');

var app = express();

// Initialize database on startup
initializeDatabase()
  .then(() => console.log('Database ready'))
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/passes', passesRouter);
app.use('/api/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Return JSON for API routes
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
