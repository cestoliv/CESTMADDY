import path from 'path'
import fs from 'fs'
import { load } from 'js-yaml'
import '@colors/colors'
import moment from 'moment'

import { IBlog, IPost, ESourceType, EConf } from '../../interfaces'
import { conf } from '../../config'
import { getGeneratedPath, getWebPath } from './sources'

export function getBlogsStruct(): Array<IBlog> {
	let struct: Array<IBlog> = new Array()
	let config: object = conf(`content.blogs`, "object", EConf.Optional)

	if (!config)
		return struct
	Object.keys(config).forEach((bName) => {
		let bDir = conf(`content.blogs.${bName}.dir`, "string", EConf.Required)
		struct.push({
			name: bName,
			path: path.join("./cestici/source", bDir),
			posts: new Array()
		})
	})
	return struct
}

export function getPostMeta(sourcePath: string, blog: IBlog): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.promises.readFile(sourcePath, 'utf-8').then((data) => {
			let post: IPost = {
				type: ESourceType.Post,
				sourcePath,
				generatedPath: getGeneratedPath(sourcePath, ESourceType.Post),
				webPath: getWebPath(sourcePath, ESourceType.Post),
				title: "Unnamed",
				date: {
					object: new Date(),
					localeString: new Date().toLocaleString(conf(`content.language`, "string", EConf.Required)),
					relativeString: `[RELATIVE_DATE=${new Date().toISOString()}]`
				},
				author: {
					name: conf(`content.blogs.${blog.name}.main_author`, "string", EConf.Required),
					email: ""
				},
				description: "",
				enclosure: {
					generatedPath: "",
					webPath: ""
				}
			}
			let fileMeta: any
			let metaReg: RegExp = new RegExp(/^---([\s\S]+?)---/, 'gmy')
			let found = metaReg.exec(data)

			if (found)
			{
				try {
					fileMeta = load(found[1])
				}
				catch (e) {
					reject(`Retrieving metadata : YAML formatting error ${sourcePath.bold}`.red)
				}
			}
			else
				console.warn(`Retrieving metadata : You didn't provide any metadata for ${sourcePath.bold}`.yellow)

			if (fileMeta) {
				// TITLE
				if (fileMeta.hasOwnProperty('title'))
					post.title = fileMeta.title
				else
					console.warn(`Retrieving metadata : You didn't provide any title for the post ${sourcePath.bold}`.yellow)
				// DATE
				if (fileMeta.hasOwnProperty('date')) {
					if (moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss", true).isValid()) {
						post.date.object = moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss").toDate()
						post.date.localeString = post.date.object.toLocaleString(conf(`content.language`, "string", EConf.Required))
						post.date.relativeString = `[RELATIVE_DATE=${post.date.object.toISOString()}]`
					}
					else
						console.warn(`Retrieving metadata : Wrong date format (${"YYYY-MM-DDThh:mm:ss".bold}) for the post ${sourcePath.bold}`.yellow)
				}
				else
					console.warn(`Retrieving metadata : You didn't provide any date for the post ${sourcePath.bold}`.yellow)

				// AUTHOR
				if (fileMeta.hasOwnProperty('author'))
					post.author.name = fileMeta.author
				post.author.email = conf(`content.blogs.${blog.name}.authors.${post.author.name}`, "string", EConf.Required)

				// DESCRIPTION
				if (fileMeta.hasOwnProperty('description'))
					post.description = fileMeta.description
				if (post.description == "")
					console.warn(`Retrieving metadata : You didn't provide any description for the post ${sourcePath.bold}`.yellow)

				// ENCLOSURE
				if (fileMeta.hasOwnProperty('enclosure')) {
					let enclosurePath = path.join(path.dirname(sourcePath), fileMeta.enclosure)
					fs.promises.access(enclosurePath, fs.constants.R_OK).then(() => {
						post.enclosure.generatedPath = getGeneratedPath(enclosurePath, ESourceType.Other)
						post.enclosure.webPath = getWebPath(enclosurePath, ESourceType.Other)
					}).catch(() => {
						console.warn(`Retrieving metadata : the enclosure ${enclosurePath.bold} for the post ${sourcePath.bold} does not exist`.yellow)
					}).finally(() => {
						blog.posts.push(post)
						resolve()
					})
				}
				else {
					blog.posts.push(post)
					resolve()
				}
			}
			else {
				blog.posts.push(post)
				resolve()
			}
		}).catch(() => {
			reject(`Retrieving metadata : can't read ${sourcePath.bold}`.red)
		})
	})
}
