// local
const email = require('./email.js')

// locals
function locals(req, res, next) {
  res.locals = {
    // set by the Glitch platform
    projectDomain : process.env.PROJECT_DOMAIN,
    projectId     : process.env.PROJECT_ID,
    // from .env
    title         : process.env.TITLE || 'TITLE not set in .env file',
  }
  next()
}

// Uses MailGun's API to validate this email address, mainly so that we don't
// have to and we're already using MailGun anyway.
function validateEmail(req, res, next) {
  // ToDo: validate email, but for now presume it is valid.
  email.isValid(req.body.email, (err, isValid) => {
    if (err) return next(err)
    // store the normalised email
    res.locals.email = req.body.email
    next()
  })
}

function checkLoggedIn(req, res, next) {
  if (!req.session.account) {
    return res.redirect('/')
  }
  next()
}

function redirectToMyIfLoggedIn(req, res, next) {
  if ( req.session.account ) {
    return res.redirect('/my/')
  }
  next()
}

// exports
module.exports = {
  locals,
  validateEmail,
  checkLoggedIn,
  redirectToMyIfLoggedIn,
}
