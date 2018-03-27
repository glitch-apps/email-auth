// core
const http = require('http')

// local
const app = require('./lib/app.js')

// setup
const port = process.env.PORT || 3000

// server
const server = http.createServer()
server.on('request', app)
server.listen(port, () => {
  console.log('Listening on port ' + port)
})
