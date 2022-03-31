import express, { RequestHandler, Response, Request, Send } from 'express'
import path from 'path'
import fs from 'fs'
import moment from 'moment'
const interceptor = require("express-interceptor")

export const sendError = (code: number, res: Response) => {
    const   codes:number[] = [404, 500]
    const   noTemplateMessage = "Error, your theme does not provide any template for error"
    var     servPath: string = path.resolve("./cestici/generated/errors")

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
    fallthrough: true
})

export const staticContent:RequestHandler = express.static("./cestici/generated/content", {
    extensions: ["html"],
    dotfiles: "deny",
    index: ["index.html", "post.html", "podcast.html"],
    fallthrough: true
})

export const static404:RequestHandler = (_req, res, _next) => {
    sendError(404, res)
}

export const redirExtIndexes:RequestHandler = (req, res, next) => {
    const   indexFiles:string[] = ["index", "post", "podcast"]
    const   reqPath: string = req.path.replace(/\/$/, "") // remove trailing slash
    var     newPath: string = reqPath
    var     filename: string

    if(reqPath.endsWith('.html'))
        newPath = reqPath.substring(0, reqPath.length - 5)
    filename = newPath.split("/").slice(-1)[0]
    if(indexFiles.includes(filename))
        newPath = reqPath.substring(0, newPath.length - filename.length)
    if(newPath != reqPath)
        res.redirect(newPath)
    else
        next()
}

export const replaceInHtml:RequestHandler = interceptor((req: Request, res:Response) => {
    return {
        isInterceptable: () => { // only with HTML / XML
			if (/text\/html/.test(res.get('Content-Type')) ||
				/application\/xml/.test(res.get('Content-Type'))
            )
				return true
            return false
        },
        intercept: (html: string, send: (arg0: string) => void) => {
			// RELATIVE DATE
			html = html.replace(/\w*(?<!\$)\[RELATIVE_DATE([\s\S]*?)\]/g, (_: string, iso_date: string) => {
                iso_date = iso_date.substring(1) // remove the =
                return moment(iso_date, "YYYY-MM-DDThh:mm:ss").fromNow();
            })
			// DOMAIN
			html = html.replace(/\w*(?<!\$)\[DOMAIN\]/g, `${req.protocol}://${req.headers.host}`)
			send(html)
        }
    }
})
