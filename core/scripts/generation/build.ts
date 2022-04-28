import '@colors/colors'
import path from 'path'
import fs from 'fs'

import { getSources } from './sources'
import { copyTheme, compileOther, compilePage, compileErrors } from './compile'
import { EConf, ISources } from '../interfaces'
import { createFavicons } from './favicon'
import { createFeeds } from './feed'
import { conf } from '../config'

function compileSources(sources: ISources): Promise<void> {
	return new Promise((resolve, reject) => {
		var compilePromises: Array<Promise<void>> = Array()

		// Blog posts
		sources.blogs.forEach((blog) => {
			blog.posts.forEach((post) => {
				compilePromises.push(compilePage(post, sources))
			})
		})

		// Podcast episodes
		sources.podcasts.forEach((podcast) => {
			podcast.episodes.forEach((episode) => {
				compilePromises.push(compilePage(episode, sources))
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
	process.title = `cmy generation ${conf("content.title", "string", EConf.Optional)}`
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
				copyTheme(),
				createFavicons()
			]).then(() => {
				createFeeds(sources).then(() => {
					console.log('COMPILED'.green.bold)

					var used = process.memoryUsage().heapUsed / 1024 / 1024;
					console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
				}).catch(() => {})
			}).catch(() => {})
		}).catch((err) => { console.error(`Compiling : Error : ${err}`.red) })
	}).catch(() => {})
})();
