// core
const fs = require('fs')
const path = require('path')
const url = require('url')

// npm
const Mailgun = require('mailgun-js')
const pug = require('pug')

// setup
const baseUrl = `https://${process.env.DOMAIN}`
const authEmail = 'GlitchApps Email Auth <auth@' + process.env.MAILGUN_DOMAIN + '>'
const verifyTemplate = pug.compile(fs.readFileSync(path.join(__dirname, '..', 'emails', 'verify.pug')), {})
// console.log('verifyTemplate:', verifyTemplate)

var mailgun = Mailgun({
  apiKey       : process.env.MAILGUN_API_KEY,
  domain       : process.env.MAILGUN_DOMAIN,
  publicApiKey : process.env.MAILGUN_PUBLIC_KEY,
})

// isValid - checks (with MailGun) if this email address is valid
function isValid(email, callback) {
  console.log('email.isValid - email=' + email)

  mailgun.validate(email, (err, body) => {
    if (err) return callback(err)
    console.log('isValid() - body:', body)
    if( !body ) {
      // not sure what this means, but I guess it's a guard
      return callback(null, false)
    }
    return callback(null, body.is_valid)
  })
}

function sendVerify(email, verifyToken, humanToken, callback) {
  const link = new url.URL(baseUrl + '/verify')
  link.searchParams.append('email', email)
  link.searchParams.append('verify', verifyToken)
  
  const subject = `EmailAuth Login Verification (code: "${humanToken}")`
  const html = verifyTemplate({
    title : subject,
    verifyUrl : link,
    human : humanToken,
  })

  // console.log('html:', html)
  
  var data = {
    from    : authEmail,
    to      : email,
    subject : subject,
    text    : `Please click the following link : ${link}`,
    html    : html,
  }

  mailgun.messages().send(data, callback)
}

// exports
module.exports = {
  isValid,
  sendVerify,
}
