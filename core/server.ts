import express from 'express'
import '@colors/colors'
import dotenv from 'dotenv'

import { conf } from './scripts/config'
import routes from './scripts/webserv/routes'
import { EConf } from './scripts/interfaces'

process.title = `cmy webserver ${conf("content.title", "string", EConf.Optional)}`
dotenv.config()

const app = express()
app.set('trust proxy', 1)
app.use('/', routes)
app.listen(process.env.PORT, () => {
	console.log(`\ncestmaddy started on ::${process.env.PORT}`.magenta.bold)
})