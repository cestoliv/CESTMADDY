import path from 'path'

import { conf } from '../config'
import { EConf, ESourceType, IBlog, IPodcast, ISources } from '../interfaces'
import { getFooter, getFooterPath, getHeader, getHeaderPath } from './header_footer'
import { getMeta } from './metadata'
import { getGeneratedPath, getPathsRecur } from './paths'

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
	Object.keys(config).forEach((bName) => {
		let bDir = conf(`content.podcasts.${bName}.dir`, "string", EConf.Required)
		struct.push({
			name: bName,
			path: path.join("./cestici/source", bDir),
			episodes: new Array()
		})
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

		getPathsRecur().forEach((sourcePath) => {
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
					console.log(err)
					reject()
				})
			}
		})
	})
}
