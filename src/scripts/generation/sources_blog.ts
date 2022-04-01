import path from 'path'

import { IBlog } from '../interfaces'
import { conf } from "../config"

export function getBlogsStruct(): Array<IBlog> {
	let struct: Array<IBlog> = new Array()
	let config: object = conf(`content.blogs`, "object", false)

	if (!config)
		return struct
	Object.keys(config).forEach((bName) => {
		let bDir = conf(`content.blogs.${bName}.dir`, "string")
		struct.push({
			name: bName,
			path: `./${path.join("./cestici/source", bDir)}`,
			posts: new Array()
		})
	})
	return struct
}
