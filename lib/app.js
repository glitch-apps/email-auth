// core
const path = require('path')

// npm
const express = require('express')
const favicon = require('serve-favicon')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')

// local
const middleware = require('./middleware.js')

// setup

// application
const app = express()
app.set('view engine', 'pug')
app.enable('strict routing')
app.enable('case sensitive routing')
app.disable('x-powered-by')

app.use(favicon(path.join(__dirname, '..', 'public', 'favicon.ico')))
app.use(express.static('public'))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'tiny'))
app.use(bodyParser.urlencoded({ extended : false }))
app.use(cookieSession({
  name: 'session',
  keys: [ process.env.SESSION_KEY],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// middleware
app.use(middleware.locals)

// routes
require('./routes/home.js')(app)
require('./routes/auth.js')(app)
require('./routes/my.js')(app)

// exports
module.exports = app
