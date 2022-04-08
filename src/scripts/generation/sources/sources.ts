import fs from 'fs'

import { ESourceType, ISources } from '../../interfaces'
import { getBlogsStruct, getPostMeta } from './sources_blog'
import { getPageMeta } from './sources_page'
import { getEpisodeMeta, getPodcastsStruct } from './sources_podcast'

function getPathsRecur(startDir: string = "./cestici/source"): Array<string> {
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
	generatedPath = `./cestici/generated/content/${sourcePath.split("source/").slice(1, sourcePath.length).join("source/")}`
	// Replace extension with .html
	if (sourceType != ESourceType.Other)
		generatedPath = `${generatedPath.split('.').slice(0, -1).join('.')}.html`
	return generatedPath
}

export function getSources(): Promise<ISources> {
	return new Promise((resolve, reject) => {
		let sources: ISources = {
			others: new Array(),
			pages: new Array(),
			blogs: getBlogsStruct(),
			podcasts: getPodcastsStruct()
		}
		let indexReg: RegExp = new RegExp(/index\.(md|markdown|markdn|mdown|mkd)$/)
		let metaPromises: Array<Promise<void>> = Array()

		getPathsRecur().forEach((sourcePath) => {
			if (new RegExp(/\.(md|markdown|markdn|mdown|mkd)$/).test(sourcePath))
			{
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
			sources.others.push({
				sourcePath,
				generatedPath: getGeneratedPath(sourcePath, ESourceType.Other)
			})
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
			else
				resolve(sources)
		})
	})
}
