import path from 'path'
import fs from 'fs'

import { EConf, IEpisode, IPodcast, ESourceType } from '../../interfaces'
import { conf } from "../../config"
import { getGeneratedPath } from './sources'

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

export function getEpisodeMeta(sourcePath: string, podcast: IPodcast): Promise<void> {
	return new Promise((resolve, _reject) => {
		let episode: IEpisode = {
			type: ESourceType.Episode,
			sourcePath,
			generatedPath: getGeneratedPath(sourcePath, ESourceType.Post)
		}
		let metaReg: RegExp = new RegExp(/^---([\s\S]+?)---/, 'gmy')

		let fileContent = fs.readFileSync(sourcePath, 'utf-8').toString()
		let found = metaReg.exec(fileContent)
		if (found)
		{
			/*
			try {
				let fileMeta: Object = load(found[1])
				if (fileMeta.hasOwnProperty())
			}
			catch (e) {
				console.error(`YAML formatting error for the post metadata : ${sourcePath.bold}`.red)
			}
			*/
		}
		podcast.episodes.push(episode)
		resolve()
	})
}
