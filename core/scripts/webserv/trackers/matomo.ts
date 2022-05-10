import { Request } from "express"
import { getClientIp } from "request-ip"
import dotenv from 'dotenv'
import mime from 'mime-types'
const MatomoTracker = require("matomo-tracker")

import { conf } from "../../config"
import { EConf } from "../../interfaces"

dotenv.config()

var siteId = conf("content.tracker.matomo.id", "number", EConf.Required)
var instanceUrl = conf("content.tracker.matomo.instance", "string", EConf.Required)
var authToken = process.env.MATOMO_TOKEN
if (!authToken) {
	console.error(`Env : ${"MATOMO_TOKEN".bold} is not defined`.red)
	process.exit(1)
}

var matomo = new MatomoTracker(siteId, instanceUrl)

matomo.on('error', function(err: any) {
	console.warn(`Matomo error: ${err}`)
})

export function matomoTrack(req: Request, path: string): void {
	if (mime.lookup(path) == "text/html") {
		matomo.track({
			url: `${req.protocol}://${req.headers.host}${req.url}`,
			ua: req.header('User-Agent'),
			lang: req.header('Accept-Language'),
			token_auth: authToken,
			cip: getClientIp(req),
			urlref: req.get("Referer")

		})
		console.log(req.url)
	}
}
