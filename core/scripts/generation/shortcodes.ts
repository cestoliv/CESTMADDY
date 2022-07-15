import path from "path"
import { ISources } from "../interfaces"

function getShortcodeReturn(obj: any, sourcePath: string, sources: ISources, scPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		import(scPath).then((sc) => [
			sc.compile(obj, sources).then((result: string) => {
				resolve(result)
			}).catch((err: string) => {
				console.error(`Compiling : Shortcode ${obj['sc']} in ${sourcePath.bold} returned an error : ${err}.`.red)
				resolve("")
			})
		]).catch((err) => {
			reject(err)
		})
	})
}

function compileShortcode(obj: any, sourcePath: string, sources: ISources): Promise<string> {
	return new Promise((resolve, _reject) => {
		var scPath: string

		if (!obj.hasOwnProperty('short'))
		{
			if (!obj.hasOwnProperty('hot'))
				console.error(`Compiling : You do not specify a short or hot property in a {short, hot}code in ${sourcePath.bold}.`.red)
			return resolve("")
		}

		// Search in built-in Shortcodes
		scPath = path.join('../../', 'built-in', 'shortcodes', obj['short'].replace(/\./g, '/'))
		getShortcodeReturn(obj, sourcePath, sources, scPath).then((result) => {
			resolve(result)
		}).catch((_err) => {
			// Search in custom Shortcodes
			scPath = path.join('../../../', 'cestici', 'custom', 'shortcodes', obj['short'].replace(/\./g, '/'))
			getShortcodeReturn(obj, sourcePath, sources, scPath).then((result) => {
				resolve(result)
			}).catch((_err) => {
				console.error(`Compiling : The specified sc property in ${sourcePath.bold} does not match any shortcode.`.red)
				resolve("")
			})
		})
	})
}

export function replaceShortcodes(markdown: string, sourcePath: string, sources: ISources, startIndex: number): Promise<string> {
	return new Promise((resolve, _reject) => {
		var scReg: RegExp = new RegExp(/^\$\{[\s\S]*?\}/, 'gm')
		var found = scReg.exec(markdown.substring(startIndex))

		if (!found) {
			return resolve(markdown)
		}

		var foundObj: object
		try {
			foundObj = JSON.parse(found[0].substring(1))
			compileShortcode(foundObj, sourcePath, sources).then((compiledSc) => {
				markdown = markdown.substring(0, startIndex + found!.index)
					+ compiledSc
					+ markdown.substring(startIndex + found!.index + found![0].length)

				replaceShortcodes(markdown, sourcePath, sources,
					startIndex + found!.index + compiledSc.length)
				.then((markdown) => {
					resolve(markdown)
				})
			})
		}
		catch (_e) {
			console.error(`Compiling : A shortcode is badly formatted in ${sourcePath.bold} (the syntax is that of json)`.red)
			replaceShortcodes(markdown, sourcePath, sources,
				startIndex + found!.index + found![0].length
			).then((markdown) => {
				resolve(markdown)
			})
		}
	})
}
