import fs from "fs"
import path from "path"

import { conf } from "../config"
import { EConf, ESourceType } from "../interfaces"

export function getPathsRecur(startDir: string = "cestici/source"): Array<string> {
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
	let webPath: string

	// Remove everything before the first source/
	webPath = `/${sourcePath.split("source/").slice(1, sourcePath.length).join("source/")}`
	// Remove extension
	if (sourceType != ESourceType.Other)
		webPath = webPath.split('.').slice(0, -1).join('.')
	// Remove index, post and episode at the end
	if (sourceType == ESourceType.Page)
		if (webPath.endsWith("/index"))
			webPath = webPath.split('/').slice(0, -1).join('/')
	if (sourceType == ESourceType.Post)
		if (webPath.endsWith("/post"))
			webPath = webPath.split('/').slice(0, -1).join('/')
	if (sourceType == ESourceType.Episode)
		if (webPath.endsWith("/episode"))
			webPath = webPath.split('/').slice(0, -1).join('/')

	return webPath
}

export function getThemePath(): string {
	const builtInThemes = ["clean"]
	var themeName: string | null = 'clean'
	var themePath: string = path.join('./', 'core', 'built-in', 'themes', themeName)

	themeName = conf("content.theme", "string", EConf.Optional)
	if (themeName && themeName != "" && !builtInThemes.includes(themeName))
		themePath = path.join('./', 'cestici', 'custom', 'themes', themeName)

	return themePath
}
