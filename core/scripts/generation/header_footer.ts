import path from "path"
import fs from "fs"

import { conf } from "../config"
import { EConf, ISources } from "../interfaces"
import { compileHTML } from "./compile"

export function getHeaderPath(): string | null {
	if (!conf('content.header', 'string', EConf.Optional))
		return (null)
	return (path.join('./cestici', 'source',
	conf('content.header', 'string', EConf.Required)))
}

export function getHeader(sources: ISources): Promise<[string | null, string]> {
	return new Promise((resolve, reject) => {
		let headerPath = getHeaderPath()

		if (!headerPath)
			return resolve([null, ""])
		fs.promises.readFile(headerPath, 'utf-8').then((filec) => {
			compileHTML(filec, headerPath!, sources).then((header) => {
				resolve([headerPath, header])
			}).catch((err) => {
				reject(err)
			})
		}).catch(() => {
			reject(`Compiling : can't read ${headerPath!.bold}`.red)
		})
	})
}

export function getFooterPath(): string | null {
	if (!conf('content.footer', 'string', EConf.Optional))
		return (null)
	return (path.join('./cestici', 'source',
	conf('content.footer', 'string', EConf.Required)))
}

export function getFooter(sources: ISources): Promise<[string | null, string]> {
	return new Promise((resolve, reject) => {
		var footerPath = getFooterPath()

		if (!footerPath)
			return resolve([null, ""])
		fs.promises.readFile(footerPath, 'utf-8').then((filec) => {
			compileHTML(filec, footerPath!, sources).then((footer) => {
				resolve([footerPath, footer])
			}).catch((err) => {
				reject(err)
			})
		}).catch(() => {
			reject(`Compiling : can't read ${footerPath!.bold}`.red)
		})
	})
}
