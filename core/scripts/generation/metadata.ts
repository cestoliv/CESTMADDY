import fs from "fs"
import { load } from "js-yaml"
import moment from "moment"
import path from "path"
import { conf } from "../config"

import { EConf, ESourceType, IBlog, IEpisode, IPage, IPodcast, IPost, isBlog, isEpisode, isPage, isPages, isPodcast, isPost } from "../interfaces"
import { getGeneratedPath, getWebPath } from "./paths"

function getEmptyPost(sourcePath: string, blog: IBlog): IPost {
	return {
		type: ESourceType.Post,
		sourcePath,
		generatedPath: getGeneratedPath(sourcePath, ESourceType.Post),
		webPath: getWebPath(sourcePath, ESourceType.Post),
		title: "Unnamed",
		date: {
			object: new Date(),
			localeString: new Date().toLocaleString(conf(`content.language`, "string", EConf.Required)),
			relativeString: `\${RELATIVE_DATE=${new Date().toISOString()}}`
		},
		author: {
			name: conf(`content.blogs.${blog.name}.main_author`, "string", EConf.Required),
			email: ""
		},
		description: "",
		enclosure: {
			generatedPath: "",
			webPath: ""
		},
		content: "" // set in compilation
	}
}

function getEmptyPage(sourcePath: string): IPage {
	return {
		type: ESourceType.Page,
		sourcePath,
		generatedPath: getGeneratedPath(sourcePath, ESourceType.Page),
		title: "Unnamed",
		description: "",
		content: "" // set in compilation
	}
}

function getEmptyEpisode(sourcePath: string): IEpisode {
	return {
		type: ESourceType.Episode,
		sourcePath,
		generatedPath: getGeneratedPath(sourcePath, ESourceType.Post)
	}
}

export function getMeta(sourcePath: string, data: Array<IPage> | IBlog | IPodcast): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.promises.readFile(sourcePath, 'utf-8').then((filecontent) => {
			var page: IPage | IPost | IEpisode
			let fileMeta: any
			let metaReg: RegExp = new RegExp(/^---([\s\S]+?)---/, 'gmy')
			let promisesList: Array<Promise<void>> = new Array()
			let found = metaReg.exec(filecontent)

			if (isBlog(data))
				page = getEmptyPost(sourcePath, data)
			else if (isPodcast(data))
				page = getEmptyEpisode(sourcePath)
			else
				page = getEmptyPage(sourcePath)

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
				////////
				// TITLE
				////////
				if (isPost(page) || isPage(page)) {
					if (fileMeta.hasOwnProperty('title'))
						page.title = fileMeta.title
					else
						console.warn(`Retrieving metadata : You didn't provide any title for the post ${sourcePath.bold}`.yellow)
				}
				///////
				// DATE
				///////
				if (isPost(page)) {
					if (fileMeta.hasOwnProperty('date')) {
						if (moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss", true).isValid()) {
							page.date.object = moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss").toDate()
							page.date.localeString = page.date.object.toLocaleString(conf(`content.language`, "string", EConf.Required))
							page.date.relativeString = `\${RELATIVE_DATE=${page.date.object.toISOString()}}`
						}
						else
							console.warn(`Retrieving metadata : Wrong date format (${"YYYY-MM-DDThh:mm:ss".bold}) for the post ${sourcePath.bold}`.yellow)
					}
					else
						console.warn(`Retrieving metadata : You didn't provide any date for the post ${sourcePath.bold}`.yellow)
				}
				/////////
				// AUTHOR
				/////////
				if (isPost(page) && isBlog(data)) {
					if (fileMeta.hasOwnProperty('author'))
						page.author.name = fileMeta.author
					page.author.email = conf(`content.blogs.${data.name}.authors.${page.author.name}`, "string", EConf.Required)
				}
				//////////////
				// DESCRIPTION
				//////////////
				if (isPost(page) || isPage(page)) {
					if (fileMeta.hasOwnProperty('description'))
						page.description = fileMeta.description
					if (page.description == "")
						console.warn(`Retrieving metadata : You didn't provide any description for the post ${sourcePath.bold}`.yellow)
				}
				////////////
				// ENCLOSURE
				////////////
				if (isPost(page)) {
					if (fileMeta.hasOwnProperty('enclosure')) {
						promisesList.push(new Promise((resolve, reject) => {
							let enclosurePath = path.join(path.dirname(sourcePath), fileMeta.enclosure)
							fs.promises.access(enclosurePath, fs.constants.R_OK).then(() => {
								if (!isPost(page))
									return resolve()
								page.enclosure.generatedPath = getGeneratedPath(enclosurePath, ESourceType.Other)
								page.enclosure.webPath = getWebPath(enclosurePath, ESourceType.Other)
								resolve()
							}).catch(() => {
								console.warn(`Retrieving metadata : the enclosure ${enclosurePath.bold} for the post ${sourcePath.bold} does not exist`.yellow)
								resolve()
							})
						}))
					}
				}
			}
			// Promises (enclosure...)
			Promise.allSettled(promisesList).then(() => {
				// PUSH DATA
				if (isBlog(data) && isPost(page)) {
					data.posts.push(page)
				}
				else if (isPodcast(data) && isEpisode(page)) {
					data.episodes.push(page)
				}
				else if (isPages(data) && isPage(page)) {
					data.push(page)
				}
				resolve()
			})
		}).catch(() => {
			reject(`Retrieving metadata : can't read ${sourcePath.bold}`.red)
		})
	})
}
