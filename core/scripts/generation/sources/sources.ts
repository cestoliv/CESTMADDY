import fs from 'fs'
import path from 'path'

import { conf } from '../../config'
import { EConf, ESourceType, ISources } from '../../interfaces'
import { compileHTML } from '../compile'
import { getBlogsStruct, getPostMeta } from './sources_blog'
import { getPageMeta } from './sources_page'
import { getEpisodeMeta, getPodcastsStruct } from './sources_podcast'

function getPathsRecur(startDir: string = "cestici/source"): Array<string> {
	let files: Array<string> = Array()

	let dirFiles: Array<string> = fs.readdirSync(startDir) || Array()

	dirFiles.forEach((dirFile) => {
		if (fs.statSync(`${startDir}/${dirFile}`).isDirectory()) {
			getPathsRecur(`${startDir}/${dirFile}`).forEach((childFile) => {
				files.push(childFile)
			})
		}
		else
			files.push(`${startDir}/${dirFile}`)
	})

	return files
}

export function getGeneratedPath(sourcePath: string, sourceType: ESourceType): string {
	let generatedPath: string

	// Remove everything before the first source/
	generatedPath = `cestici/generated/content/${sourcePath.split("source/").slice(1, sourcePath.length).join("source/")}`
	// Replace extension with .html
	if (sourceType != ESourceType.Other)
		generatedPath = `${generatedPath.split('.').slice(0, -1).join('.')}.html`
	return generatedPath
}

export function getWebPath(sourcePath: string, sourceType: ESourceType): string {
	let generatedPath: string

	// Remove everything before the first source/
	generatedPath = `/${sourcePath.split("source/").slice(1, sourcePath.length).join("source/")}`
	// Remove extension
	if (sourceType != ESourceType.Other)
		generatedPath = generatedPath.split('.').slice(0, -1).join('.')
	return generatedPath
}

function getHeaderPath(): string | null {
	if (!conf('content.header', 'string', EConf.Optional))
		return (null)
	return (path.join('./cestici', 'source',
	conf('content.header', 'string', EConf.Required)))
}

function getHeader(sources: ISources): Promise<[string | null, string]> {
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

function getFooterPath(): string | null {
	if (!conf('content.footer', 'string', EConf.Optional))
		return (null)
	return (path.join('./cestici', 'source',
	conf('content.footer', 'string', EConf.Required)))
}

function getFooter(sources: ISources): Promise<[string | null, string]> {
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
						return added = true, metaPromises.push(getPostMeta(sourcePath, blog))
				})
				if (added) return
				sources.podcasts.forEach((podcast) => {
					if (sourcePath.startsWith(podcast.path) && !indexReg.test(sourcePath))
						return added = true, metaPromises.push(getEpisodeMeta(sourcePath, podcast))
				})
				if (added) return
				metaPromises.push(getPageMeta(sourcePath, sources.pages))
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
