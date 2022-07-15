import { glob } from "glob"
import path from "path"
import { HotData } from "../interfaces"

export function runHotCrons(): Promise<void> {
	return new Promise((resolve, reject) => {
		glob('{dist/core/built-in,dist/cestici/custom}/hotcodes/**/*.js', (err, files) => {
			if (err) {
				console.log(err)
				return reject()
			}

			console.log(__dirname)
			console.log(files)
		})
	})
}

function getHotcodeReturn(hcPath: string, hotSettings: any, hotData: HotData): Promise<string> {
	return new Promise((resolve, reject) => {
		import(hcPath).then((sc) => {
			hotData.store_path = path.join('store', 'hotcodes', hotSettings['hot'].replace(/\./g, '/'))

			sc.compile(hotSettings, hotData).then((result: string) => {
				resolve(result)
			}).catch((err: string) => {
				console.error(`Serving : Hotcode ${hotSettings['short']} in ${hotData.path.bold} returned an error : ${err}.`.red)
				resolve("")
			})
		}).catch((err) => {
			reject(err)
		})
	})
}

function compileHotcode(hotSettings: any, hotData: HotData): Promise<string> {
	return new Promise((resolve, _reject) => {
		var hcPath: string

		if (!hotSettings.hasOwnProperty('hot'))
		{
			console.error(`Serving : You do not specify a hot property in a hotcode in ${hotData.path.bold}.`.red)
			return resolve("")
		}

		// Search in built-in Hotcodes
		hcPath = path.join('../../', 'built-in', 'hotcodes', hotSettings['hot'].replace(/\./g, '/'))
		getHotcodeReturn(hcPath, hotSettings, hotData).then((result) => {
			resolve(result)
		}).catch((_err) => {
			// Search in custom Hotcodes
			hcPath = path.join('../../../', 'cestici', 'custom', 'hotcodes', hotSettings['hot'].replace(/\./g, '/'))
			getHotcodeReturn(hcPath, hotSettings, hotData).then((result) => {
				resolve(result)
			}).catch((_err) => {
				console.error(`Serving : The specified hotcode (${name}) in ${hotData.path} does not match any hotcodes.`.red)
				resolve("")
			})
		})
	})
}

export function replaceHotcodes(markdown: string, hotData: HotData, startIndex: number): Promise<string> {
	return new Promise((resolve, _reject) => {
		var hcReg: RegExp = new RegExp(/\$\{[\s\S]*?\}/, 'gm')
		var found = hcReg.exec(markdown.substring(startIndex))

		if (!found)
			return resolve(markdown)

			var foundObj: object
			try {
				foundObj = JSON.parse(found[0].substring(1))
				compileHotcode(foundObj, hotData).then((compiledHc) => {
					markdown = markdown.substring(0, startIndex + found!.index)
						+ compiledHc
						+ markdown.substring(startIndex + found!.index + found![0].length)

					replaceHotcodes(markdown, hotData,
						startIndex + found!.index + compiledHc.length)
					.then((markdown) => {
						resolve(markdown)
					})
				})
			}
			catch (_e) {
				console.error(`Serving : A hotcode is badly formatted in ${hotData.path.bold} (the syntax is that of json)`.red)
				replaceHotcodes(markdown, hotData,
					startIndex + found!.index + found![0].length
				).then((markdown) => {
					resolve(markdown)
				})
			}
	})
}
