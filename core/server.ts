import express from 'express'
import '@colors/colors'

import { conf } from './scripts/config'
import routes from './scripts/webserv/routes'
import { EConf } from './scripts/interfaces'

process.title = `cmy webserver ${conf("content.title", "string", EConf.Optional)}`
const app = express()
app.set('trust proxy', 1)
app.use('/', routes)
app.listen(conf("server.port", "number", EConf.Required), () => {
	console.log(`\ncestmaddy started on ::${conf("server.port", "number", EConf.Required)}`.magenta.bold)
})
