const functions = require('firebase-functions')

exports.postRequestFunction = functions.https.onRequest((request, response) => {
    response.send(request.body);
});
