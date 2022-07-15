import express, { RequestHandler, Response, Request } from 'express'
import path from 'path'
import fs from 'fs'
import moment from 'moment'
import serveStaticCb from 'serve-static-callback'
const interceptor = require("express-interceptor")

import { conf } from '../config'
import { EConf, HotData } from '../interfaces'
import { matomoInit, matomoTrack } from './trackers/matomo'
import { replaceHotcodes } from '../generation/hotcodes'

moment.locale(conf('content.language', 'string', EConf.Required))

if (conf("content.tracker.matomo", "object", EConf.Optional))
	matomoInit()

export const sendError = (code: number, res: Response) => {
	const	codes:number[] = [404, 500]
	const	noTemplateMessage = "Error, your theme does not provide any template for error"
	var		servPath: string = path.resolve("./cestici/generated/errors")

	if (codes.includes(code))
	{
		servPath = path.join(servPath, `${code}.html`)
		fs.access(servPath, (err) => {
			if (!err)
				res.status(code).sendFile(servPath)
			else
				res.status(500).send(`${noTemplateMessage} ${code}`)
		})
	}
	else
		res.status(500).send(`${noTemplateMessage} ${code}`)
}

export const staticFront:RequestHandler = express.static("./cestici/generated/front", {
	fallthrough: true,
})

export const staticContent:RequestHandler = serveStaticCb(
	"./cestici/generated/content",
	{
		extensions: ["html"],
		dotfiles: "deny",
		index: ["index.html", "post.html", "episode.html"],
		fallthrough: true
	},
	function (req: express.Request, _res: express.Response, path: string) {
		if (conf("content.tracker.matomo", "object", EConf.Optional))
			matomoTrack(req, path)
	})

export const static404:RequestHandler = (_req, res, _next) => {
    sendError(404, res)
}

export const redirExtIndexes:RequestHandler = (req, res, next) => {
	const	indexFiles:string[] = ["index", "post", "episode"]
	var		newPath: string = req.path
	var		filename: string

	if(newPath.endsWith('.html')) // remove .html
		newPath = newPath.substring(0, newPath.length - 5)
	filename = newPath.split("/").slice(-1)[0]
	if(indexFiles.includes(filename)) // remove index, post, episode
		newPath = newPath.substring(0, newPath.length - filename.length)

	if(newPath != req.path)
		res.redirect(newPath)
	else
		next()
}

export const intercept:RequestHandler = interceptor((req: Request, res:Response) => {
	return {
		isInterceptable: () => { // only with HTML / XML
			if (/text\/html/.test(res.get('Content-Type')) ||
				/application\/xml/.test(res.get('Content-Type'))
			)
				return true
			return false
		},
		intercept: (html: string, send: (arg0: string) => void) => {
			let hotData: HotData = {
				domain: `${req.protocol}://${req.headers.host}`,
				path: req.url,
				store_path: ""
			}
			replaceHotcodes(html, hotData, 0).then(replacedHtml => {
				send(replacedHtml)
			}).catch(err => {
				console.error(`Serving : Hotcode ${err}`.red)
				send(html)
			})
		}
	}
})
