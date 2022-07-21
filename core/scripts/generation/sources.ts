import path from 'path'
import { glob } from 'glob'

import { conf } from '../config'
import { EConf, ESourceType, IBlog, IPodcast, ISources } from '../interfaces'
import { getFooter, getFooterPath, getHeader, getHeaderPath } from './header_footer'
import { getMeta } from './metadata'
import { getGeneratedPath, getWebPath } from './paths'

export function getBlogsStruct(): Array<IBlog> {
	let struct: Array<IBlog> = new Array()
	let config: object = conf(`content.blogs`, "object", EConf.Optional)

	if (!config)
		return struct
	Object.keys(config).forEach((bName) => {
		let bDir = conf(`content.blogs.${bName}.dir`, "string", EConf.Required)
		let bDescription = conf(`content.blogs.${bName}.description`, "string", EConf.Optional)
		let bCategory = conf(`content.blogs.${bName}.category`, "string", EConf.Optional)
		let bLanguage = conf(`content.blogs.${bName}.language`, "string", EConf.Optional)

		if (!bDescription)
			bDescription = ""
		if (!bCategory)
			bCategory = ""
		if (!bLanguage)
			bLanguage = conf("content.language", "string", EConf.Required)
		struct.push({
			name: bName,
			path: path.join("./cestici/source", bDir),
			category: bCategory,
			description: bDescription,
			language: bLanguage,
			posts: new Array()
		})
	})
	return struct
}

export function getPodcastsStruct(): Array<IPodcast> {
	let struct: Array<IPodcast> = new Array()
	let config: object = conf(`content.podcasts`, "object", EConf.Optional)

	if (!config)
		return struct
	Object.keys(config).forEach((pName) => {
		let podcast: IPodcast
		let pDir = conf(`content.podcasts.${pName}.dir`, "string", EConf.Required)
		let pAuthor = conf(`content.podcasts.${pName}.main_author`, "string", EConf.Required)
		let enclosurePath = conf(`content.podcasts.${pName}.enclosure`, "string", EConf.Optional)

		podcast = {
			name: pName,
			path: path.join("./cestici/source", pDir),
			episodes: new Array(),
			author: {
				name: pAuthor,
				email: conf(`content.podcasts.${pName}.authors.${pAuthor}`, "string", EConf.Required)
			},
			description: conf(`content.podcasts.${pName}.description`, "string", EConf.Optional),
			language: conf(`content.podcasts.${pName}.language`, "string", EConf.Optional),
			country: conf(`content.podcasts.${pName}.country`, "string", EConf.Optional),
			category: conf(`content.podcasts.${pName}.category`, "string", EConf.Optional),
			explicit: conf(`content.podcasts.${pName}.explicit`, "string", EConf.Optional),
			complete: conf(`content.podcasts.${pName}.complete`, "string", EConf.Optional),
			type: conf(`content.podcasts.${pName}.type`, "string", EConf.Optional),
			limit: conf(`content.podcasts.${pName}.limit`, "number", EConf.Optional),
			enclosure: {
				generatedPath: "",
				webPath: ""
			}
		}
		if (enclosurePath) {
			enclosurePath = path.join('cestici', 'source', enclosurePath)
			podcast.enclosure.generatedPath = getGeneratedPath(enclosurePath, ESourceType.Other)
			podcast.enclosure.webPath = getWebPath(enclosurePath, ESourceType.Other)
		}
		struct.push(podcast)
	})
	return struct
}

export function getSources(): Promise<ISources> {
	return new Promise((resolve, reject) => {
		let sources: ISources = {
			header: "",
			footer: "",
			others: new Array(),
			pages: new Array(),
			blogs: getBlogsStruct(),
			podcasts: getPodcastsStruct()
		}
		let indexReg: RegExp = new RegExp(/index\.(md|markdown|markdn|mdown|mkd)$/)
		let mdReg: RegExp = new RegExp(/\.(md|markdown|markdn|mdown|mkd)$/)
		let metaPromises: Array<Promise<void>> = Array()
		let headerPath = getHeaderPath()
		let footerPath = getFooterPath()

		glob("cestici/source/**", {nodir: true}, function (err, files) {
			if (err) {
				console.error(err)
				return reject()
			}

			files.forEach((sourcePath) => {
				if (mdReg.test(sourcePath))
				{
					if (sourcePath == headerPath || sourcePath == footerPath)
						return
					let added = false
					sources.blogs.forEach((blog) => {
						if (sourcePath.startsWith(blog.path) && !indexReg.test(sourcePath))
							return added = true, metaPromises.push(getMeta(sourcePath, blog))
					})
					if (added) return
					sources.podcasts.forEach((podcast) => {
						if (sourcePath.startsWith(podcast.path) && !indexReg.test(sourcePath))
							return added = true, metaPromises.push(getMeta(sourcePath, podcast))
					})
					if (added) return
					metaPromises.push(getMeta(sourcePath, sources.pages))
				}
				else {
					sources.others.push({
						type: ESourceType.Other,
						sourcePath,
						generatedPath: getGeneratedPath(sourcePath, ESourceType.Other)
					})
				}
			})

			Promise.allSettled(metaPromises).then((results) => {
				let hasFail = false
				results.forEach((result) => {
					if (result.status == 'rejected')
					{
						console.error(result.reason)
						hasFail = true
					}
				})
				if (hasFail)
					reject()
				else {
					// Retrieve Header and Footer content
					Promise.all([getHeader(sources), getFooter(sources)]).then(([header, footer]) => {
						sources.header = header[1]
						sources.footer = footer[1]
						resolve(sources)
					}).catch((err) => {
						console.error(err)
						reject()
					})
				}
			})
		})
	})
}
