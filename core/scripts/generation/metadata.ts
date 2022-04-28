import fs from "fs"
import { load } from "js-yaml"
import moment from "moment"
import path from "path"
import mime from "mime-types"
import getAudioDurationInSeconds from "get-audio-duration"

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

function getEmptyEpisode(sourcePath: string, podcast: IPodcast): IEpisode {
	return {
		type: ESourceType.Episode,
		sourcePath,
		generatedPath: getGeneratedPath(sourcePath, ESourceType.Episode),
		webPath: getWebPath(sourcePath, ESourceType.Episode),
		title: "Unnamed",
		date: {
			object: new Date(),
			localeString: new Date().toLocaleString(conf(`content.language`, "string", EConf.Required)),
			relativeString: `\${RELATIVE_DATE=${new Date().toISOString()}}`
		},
		author: {
			name: conf(`content.podcasts.${podcast.name}.main_author`, "string", EConf.Required),
			email: ""
		},
		description: "",
		enclosure: {
			generatedPath: "",
			webPath: ""
		},
		audio: {
			generatedPath: "",
			webPath: "",
			mime: "",
			length: 0,
			duration: 0
		},
		platforms: {}
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
				page = getEmptyEpisode(sourcePath, data)
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
				if (fileMeta.hasOwnProperty('title'))
					page.title = fileMeta.title
				else
					console.warn(`Retrieving metadata : You didn't provide any title for ${sourcePath.bold}`.yellow)
				///////
				// DATE
				///////
				if (isPost(page) || isEpisode(page)) {
					if (fileMeta.hasOwnProperty('date')) {
						if (moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss", true).isValid()) {
							page.date.object = moment(fileMeta.date, "YYYY-MM-DDThh:mm:ss").toDate()
							page.date.localeString = page.date.object.toLocaleString(conf(`content.language`, "string", EConf.Required))
							page.date.relativeString = `\${RELATIVE_DATE=${page.date.object.toISOString()}}`
						}
						else
							console.warn(`Retrieving metadata : Wrong date format (${"YYYY-MM-DDThh:mm:ss".bold}) for ${sourcePath.bold}`.yellow)
					}
					else
						console.warn(`Retrieving metadata : You didn't provide any date for ${sourcePath.bold}`.yellow)
				}
				/////////
				// AUTHOR
				/////////
				if ((isPost(page) && isBlog(data)) || (isEpisode(page) && isPodcast(data))) {
					if (fileMeta.hasOwnProperty('author'))
						page.author.name = fileMeta.author
				}
				//////////////
				// DESCRIPTION
				//////////////
				if (fileMeta.hasOwnProperty('description'))
					page.description = fileMeta.description
				if (page.description == "")
					console.warn(`Retrieving metadata : You didn't provide any description for ${sourcePath.bold}`.yellow)
				////////////
				// ENCLOSURE
				////////////
				if (isPost(page) || isEpisode(page)) {
					if (fileMeta.hasOwnProperty('enclosure')) {
						promisesList.push(new Promise((resolve, _reject) => {
							let enclosurePath = path.join(path.dirname(sourcePath), fileMeta.enclosure)
							fs.promises.access(enclosurePath, fs.constants.R_OK).then(() => {
								if (!isPost(page) && !isEpisode(page))
									return resolve()
								page.enclosure.generatedPath = getGeneratedPath(enclosurePath, ESourceType.Other)
								page.enclosure.webPath = getWebPath(enclosurePath, ESourceType.Other)
								resolve()
							}).catch(() => {
								console.warn(`Retrieving metadata : The enclosure ${enclosurePath.bold} for ${sourcePath.bold} does not exist`.yellow)
								resolve()
							})
						}))
					}
					else if (isEpisode(page))
						console.warn(`Retrieving metadata : You didn't provide any enclosure for ${sourcePath.bold}`.yellow)
				}
				////////////
				// PLATFORMS
				////////////
				if (isEpisode(page)) {
					if (fileMeta.hasOwnProperty('platforms')) {
						if (typeof(fileMeta["platforms"]) == "object")
							page.platforms = fileMeta["platforms"]
						else
							console.warn(`Retrieving metadata : Wrong platforms object for ${sourcePath.bold}`.yellow)
					}
				}
				////////
				// AUDIO
				////////
				if (isEpisode(page)) {
					if (fileMeta.hasOwnProperty('audio')) {
						promisesList.push(new Promise((resolve, _reject) => {
							let audioPath = path.join(path.dirname(sourcePath), fileMeta.audio)
							fs.promises.stat(audioPath).then((audioStat) => {
								if (!isEpisode(page))
									return resolve()
								let aMime = mime.lookup(path.extname(audioPath))

								page.audio.generatedPath = getGeneratedPath(audioPath, ESourceType.Other)
								page.audio.webPath = getWebPath(audioPath, ESourceType.Other)
								if (aMime)
									page.audio.mime = aMime
								else
									console.warn(`Retrieving metadata : Can't lookup mime type of ${audioPath.bold} for ${sourcePath.bold}`.yellow)
								page.audio.length = audioStat.size
								getAudioDurationInSeconds(audioPath).then((aDuration) => {
									if (!isEpisode(page))
										return resolve()
									page.audio.duration = aDuration
								}).catch(() => {
									console.warn(`Retrieving metadata : Failed to get audio duration for ${audioPath.bold} on ${sourcePath.bold}`.yellow)
								}).finally(() => {
									resolve()
								})
							}).catch(() => {
								console.warn(`Retrieving metadata : The audio ${audioPath.bold} for ${sourcePath.bold} does not exist`.yellow)
								resolve()
							})
						}))
					}
					else
						console.warn(`Retrieving metadata : You didn't provide any audio for ${sourcePath.bold}`.yellow)
				}
			}

			/////////
			// AUTHOR
			/////////
			if (isPost(page) || isEpisode(page)) {
				if (isBlog(data))
					page.author.email = conf(`content.blogs.${data.name}.authors.${page.author.name}`, "string", EConf.Required)
				else if (isPodcast(data))
					page.author.email = conf(`content.podcasts.${data.name}.authors.${page.author.name}`, "string", EConf.Required)
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
