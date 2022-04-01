import fs from 'fs'

import { ESourceType, ISources } from '../interfaces'
import { getBlogsStruct } from './sources_blog'
import { getPodcastsStruct } from './sources_podcast'

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

function getGeneratedPath(sourcePath: string, sourceType: ESourceType): string {
	let generatedPath: string

	// Remove everything before the first source/
	generatedPath = `./cestici/generated/content/${sourcePath.split("source/").slice(1, sourcePath.length).join("source/")}`
	// Replace extension with .html
	if (sourceType != ESourceType.Other)
		generatedPath = `${generatedPath.split('.').slice(0, -1).join('.')}.html`
	return generatedPath
}

export function getSources(): ISources {
	let sources: ISources = {
		others: new Array(),
		pages: new Array(),
		blogs: getBlogsStruct(),
		podcasts: getPodcastsStruct()
	}
	let indexReg: RegExp = new RegExp(/index\.(md|markdown|markdn|mdown|mkd)$/)

	getPathsRecur().forEach((sourcePath) => {
		if (new RegExp(/\.(md|markdown|markdn|mdown|mkd)$/).test(sourcePath))
		{
			let added = false
			sources.blogs.forEach((blog) => {
				if (sourcePath.startsWith(blog.path) && !indexReg.test(sourcePath))
				{
					blog.posts.push({
						sourcePath,
						generatedPath: getGeneratedPath(sourcePath, ESourceType.Post)
					})
					added = true
					return
				}
			})
			if (added)
				return
			sources.podcasts.forEach((podcast) => {
				if (sourcePath.startsWith(podcast.path) && !indexReg.test(sourcePath))
				{
					podcast.episodes.push({
						sourcePath,
						generatedPath: getGeneratedPath(sourcePath, ESourceType.Episode)
					})
					added = true
					return
				}
			})
			if (added)
				return
			sources.pages.push({
				sourcePath,
				generatedPath: getGeneratedPath(sourcePath, ESourceType.Page)
			})
		}
		sources.others.push({
			sourcePath,
			generatedPath: getGeneratedPath(sourcePath, ESourceType.Other)
		})
	})
	return sources
}
