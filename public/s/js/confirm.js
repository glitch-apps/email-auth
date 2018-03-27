console.log('Hello, World!')

var $

// extract the `confirm` token and `email` from the page
var confirm = $('#confirm').val()
var email = $('#email').val()

console.log('confirm=' + confirm)
console.log('email=' + email)

// hit `/confirm.json` to see what the current status is
function check() {
  // let's see what the `/confirm.json` check says
  $.getJSON(
    '/confirm.json',
    { confirm : confirm, email : email }
  ).done(function(data) {
    console.log('data:', data)
    if (data.ok) {
      window.location = '/my/'
    }
    else {
      console.log("Error in confirm.json:", data.msg)
    }
  }).fail(function(err) {
    console.log("Error requesting confirm.json:", err)
  })
}

// run this check every 10s
var checkId = setInterval(check, 10 * 1000)

// after 5 mins, cancel all checking, since the token will have expired anyway
setTimeout(function() {
  clearInterval(checkId)
}, 5 * 60 * 1000)
