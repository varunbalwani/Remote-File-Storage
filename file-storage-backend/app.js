require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const connectDB = require('./config/database');

connectDB();

var indexRouter = require('./routes/index');
var uploadFileRouter = require('./routes/uploadFile');
var downloadFileRouter = require('./routes/downloadFile');
var fetchAllFilesRouter = require('./routes/fetchAllFiles');

var app = express();

app.use(cors());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));

app.use('/uploadFile', uploadFileRouter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/downloadFile', downloadFileRouter);
app.use('/fetchAllFiles', fetchAllFilesRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
