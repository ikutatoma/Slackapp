const functions = require('firebase-functions');

exports.postRequestFunction = functions.https.onRequest((request, response) => {
  if (request.method !== 'POST') {
    response.send('This is not post request')
  }

  // なんか処理

  response.send('This is post request')
})