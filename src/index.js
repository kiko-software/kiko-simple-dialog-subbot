const express = require('express')
const cors = require('cors')
const compress = require('compression')
const bodyParser = require('body-parser')
const Functions = require('./functions')

const app = express()
app.use(cors())
app.use(compress())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/v1/webhook-message-sent', Functions.postWebhookMessageSent)

const port = process.env.PORT || 8080
app.listen(port, () => { console.log(`Server is up and running on port number ${port}`)})
