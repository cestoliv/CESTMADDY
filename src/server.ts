import express from 'express'
import 'colors'

import { conf } from './scripts/config'
import routes from './scripts/webserv/routes'

const app = express()
app.set('trust proxy', 1)
app.use('/', routes)
app.listen(conf("server.port", "number"), () => {
	console.log(`\ncestmaddy started on ::${conf("server.port", "number")}`.magenta.bold)
})
