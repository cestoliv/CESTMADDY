import fs from 'fs'

import { IPage, ESourceType } from "../../interfaces"
import { getGeneratedPath } from "./sources"

export function getPageMeta(sourcePath: string, pages: Array<IPage>): Promise<void> {
	return new Promise((resolve, _reject) => {
		let page: IPage = {
			sourcePath,
			generatedPath: getGeneratedPath(sourcePath, ESourceType.Page)
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
		pages.push(page)
		resolve()
	})
}
