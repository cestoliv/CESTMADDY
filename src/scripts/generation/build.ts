import '@colors/colors'
import path from 'path'
import fs from 'fs'

import { getSources } from './sources/sources'
import { copyTheme, compileOther, compilePage, compileErrors } from './compile'
import { ISources } from '../interfaces'

function compileSources(sources: ISources): Promise<void> {
	return new Promise((resolve, reject) => {
		var compilePromises: Array<Promise<void>> = Array()

		// Blog posts
		sources.blogs.forEach((blog) => {
			blog.posts.forEach((post) => {
				compilePromises.push(compilePage(post, sources))
			})
		})

		// Pages
		sources.pages.forEach((page) => {
			compilePromises.push(compilePage(page, sources))
		})

		// Other ressources
		sources.others.forEach((other) => {
			compilePromises.push(compileOther(other))
		})

		Promise.allSettled(compilePromises).then((results) => {
			let hasFail = false
			results.forEach((result) => {
				if (result.status == 'rejected')
				{
					console.error(result.reason)
					hasFail = true
				}
			})
			if (hasFail)
				reject()
			else
				resolve()
		})
	})
}

(async function main() {
	console.log("Retrieving metadata".blue)
	// RETRIEVE SOURCES
	getSources().then((sources) => {
		// REMOVE GENERATED FOLDER
		fs.promises.rm(path.join("cestici", "generated"), { recursive: true, force: true}).then(() => {
			console.log("Compiling".blue)
			// COMPILATION
			Promise.all([
				compileSources(sources),
				compileErrors(),
				copyTheme()
			]).then(() => {
				console.log('COMPILED'.green.bold)
			}).catch(() => {})
		}).catch((err) => { console.error(`Compiling : Error : ${err}`.red) })
	}).catch(() => {})
})();
