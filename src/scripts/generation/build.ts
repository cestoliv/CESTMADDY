import '@colors/colors'

import { getSources } from './sources/sources'

(async function main() {
	console.log("Retrieving metadata")
	getSources().then((sources) => {
		//console.log(sources.pages)
		console.log(sources.blogs[0].posts)
		//console.log(sources.podcasts[0].episodes)
	}).catch(() => {})
})();
