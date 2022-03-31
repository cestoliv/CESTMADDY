import fs from 'fs'
import path from 'path'

import { ISourceFile, ESourceType } from '../interfaces'
import { conf } from "../config"

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

function getSpecialPaths(type: string): Array<string> {
	let paths: Array<string> = new Array()
	let config: object = conf(`content.${type}`, "object", false)

	if ((type != "blogs" && type != "podcasts")
		|| !config)
		return paths
	Object.keys(config).forEach((speName) => {
		let speDir = conf(`content.${type}.${speName}.dir`, "string")
		paths.push(`./${path.join("./cestici/source", speDir)}`)
	})
	return paths
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

function getSources(): Array<ISourceFile> {
	let sourceFiles: Array<ISourceFile> = new Array()
	let blogsPath: Array<string> = getSpecialPaths("blogs")
	let podcastsPath: Array<string> = getSpecialPaths("podcasts")

	getPathsRecur().forEach((sourcePath) => {
		let sourceType: ESourceType = ESourceType.Other
		let generatedPath: string

		if (new RegExp(/\.(md|markdown|markdn|mdown|mkd)$/).test(sourcePath))
		{
			sourceType = ESourceType.Page
			blogsPath.forEach((blogPath) => {
				if (sourcePath.startsWith(blogPath)
					&& !new RegExp(/index\.(md|markdown|markdn|mdown|mkd)$/).test(sourcePath))
					sourceType = ESourceType.Post
			})
			podcastsPath.forEach((podcastsPath) => {
				if (sourcePath.startsWith(podcastsPath)
					&& !new RegExp(/index\.(md|markdown|markdn|mdown|mkd)$/).test(sourcePath))
					sourceType = ESourceType.Podcast
			})
		}
		generatedPath = getGeneratedPath(sourcePath, sourceType)
		sourceFiles.push({
			type: sourceType,
			sourcePath,
			generatedPath
		})
	})
	return sourceFiles
}
