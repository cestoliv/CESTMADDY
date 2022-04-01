import path from 'path'

import { IPodcast } from '../interfaces'
import { conf } from "../config"

export function getPodcastsStruct(): Array<IPodcast> {
	let struct: Array<IPodcast> = new Array()
	let config: object = conf(`content.podcasts`, "object", false)

	if (!config)
		return struct
	Object.keys(config).forEach((bName) => {
		let bDir = conf(`content.podcasts.${bName}.dir`, "string")
		struct.push({
			name: bName,
			path: `./${path.join("./cestici/source", bDir)}`,
			episodes: new Array()
		})
	})
	return struct
}
