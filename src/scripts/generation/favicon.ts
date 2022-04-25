import path from "path"
import im from "imagemagick"
import fs from "fs"
import { optimize, OptimizedError, OptimizedSvg } from "svgo"
import potrace from "potrace"

import { conf } from "../config"
import { EConf } from "../interfaces"

interface IImgOpt {
	options: Array<string>,
	generatedPath: string
}

function isOptiSvg(opti: OptimizedSvg | OptimizedError): opti is OptimizedSvg {
	return ('data' in opti && 'info' in opti)
}

export function createFavicons(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!conf('content.favicon.path', 'string', EConf.Optional))
			return resolve()

		var faviconsPromises: Array<Promise<void>> = new Array()
		const faviconPath = path.join('./', 'cestici', 'source',
			conf('content.favicon.path', 'string', EConf.Required))
		const generatedDir = path.join('cestici', 'generated', 'front', 'favicons')
		const themeColor = conf('content.favicon.theme_color', 'string', EConf.Optional)
		const themeBackground = conf('content.favicon.background', 'string', EConf.Optional)
		const siteTitle = conf('content.title', 'string', EConf.Required)

		fs.promises.mkdir(generatedDir, {recursive: true}).then(() => {
			var imgOptions: Array<IImgOpt> = new Array()

			// apple-touch-icon.png - 180x180
			imgOptions.push({
				options: [
					'-resize', '180x180',
					'-extent', '180x180'
				],
				generatedPath: path.join(generatedDir, "apple-touch-icon.png")
			})
			// favicon.ico - 48x48
			imgOptions.push({
				options: [
					'-resize', '48x48',
					'-extent', '48x48',
				],
				generatedPath: path.join(generatedDir, "favicon.ico")
			})
			// favicon-32x32.png - 32x32
			imgOptions.push({
				options: [
					'-resize', '32x32',
					'-extent', '32x32'
				],
				generatedPath: path.join(generatedDir, "favicon-32x32.png")
			})
			// favicon-16x16.png - 16x16
			imgOptions.push({
				options: [
					'-resize', '16x16',
					'-extent', '16x16'
				],
				generatedPath: path.join(generatedDir, "favicon-16x16.png")
			})
			// android-chrome-192x192.png - 192x192
			imgOptions.push({
				options: [
					'-resize', '160x160', // add padding
					'-extent', '192x192'
				],
				generatedPath: path.join(generatedDir, "android-chrome-192x192.png")
			})
			// android-chrome-512x512.png - 512x512
			imgOptions.push({
				options: [
					'-resize', '425x425', // add padding
					'-extent', '512x512'
				],
				generatedPath: path.join(generatedDir, "android-chrome-512x512.png")
			})
			// mstile-150x150.png - 150x150
			imgOptions.push({
				options: [
					'-resize', '75x75', // add padding
					'-extent', '150x150'
				],
				generatedPath: path.join(generatedDir, "mstile-150x150.png")
			})

			imgOptions.forEach((img) => {
				faviconsPromises.push(new Promise((resolve, reject) => {
					im.convert([
						'-background', 'transparent',
						'-gravity', 'center',
						faviconPath,
					]
						.concat(img.options)
						.concat(img.generatedPath)
					, (err, _stdout) => {
						if(err) return reject(err)
						resolve()
					})
				}))
			})

			// safari-pinned-tab.svg
			faviconsPromises.push(new Promise((resolve, reject) => {
				if(faviconPath.endsWith(".svg")) {
					fs.promises.readFile(faviconPath, "utf-8").then((faviconSvg) => {
						var svg_opti = optimize(faviconSvg, {
							path: faviconPath,
							multipass: true
						})
						if (!isOptiSvg(svg_opti))
							return reject(svg_opti.error)

						// make a square
						if(+(svg_opti.info.width) > +(svg_opti.info.height)) { // +(var) convert var to float
							// make height equal to width
							svg_opti.data = svg_opti.data.replace(/(<svg.*?height=").*?(".*?>)/, `$1${svg_opti.info.width}$2`)
						}
						else if(+(svg_opti.info.height) > +(svg_opti.info.width)) { // +(var) convert var to float
							// make width equal to height
							svg_opti.data = svg_opti.data.replace(/(<svg.*?width=").*?(".*?>)/, `$1${svg_opti.info.height}$2`)
						}

						// replace every colors to black
						// #aaaaaa
						svg_opti.data = svg_opti.data.replace(/#.{6}/g, "#000")
						// #aaa
						svg_opti.data = svg_opti.data.replace(/#.{3}/g, "#000")

						fs.promises.writeFile(path.join(generatedDir, "safari-pinned-tab.svg"), svg_opti.data).then(() => {
							resolve()
						}).catch((err) => {
							reject(err)
						})
					}).catch((err) => {
						reject(err)
					})
				}
				else {
					// convert image to monochrome svg
					potrace.trace(faviconPath, {
						background: "#00000000",
						color: '#000000',
						threshold: 120
					}, (err, faviconSvg) => {
						if(err) return reject(err)
						var svg_opti = optimize(faviconSvg, {
							path: faviconPath,
							multipass: true
						})
						if (!isOptiSvg(svg_opti))
							return reject(svg_opti.error)

						fs.promises.writeFile(path.join(generatedDir, "safari-pinned-tab.svg"), svg_opti.data).then(() => {
							resolve()
						}).catch((err) => {
							reject(err)
						})
					})
				}
			}))

			// site.webmanifest
			faviconsPromises.push(
				fs.promises.writeFile(path.join(generatedDir, "site.webmanifest"),
`{
	"name": "${siteTitle}",
	"short_name": "",
	"icons": [
		{
			"src": "/__favicons/android-chrome-192x192.png",
			"sizes": "192x192",
			"type": "image/png"
		},
		{
			"src": "/__favicons/android-chrome-512x512.png",
			"sizes": "512x512",
			"type": "image/png"
		}
	],
	"theme_color": "${themeColor}",
	"background_color": "${themeBackground}",
	"display": "standalone"
}`
				)
			)

			// browserconfig.xml
			faviconsPromises.push(
				fs.promises.writeFile(path.join(generatedDir, "browserconfig.xml"),
`<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
	<msapplication>
		<tile>
			<square150x150logo src="/__favicons/mstile-150x150.png"/>
			<TileColor>${themeBackground}</TileColor>
		</tile>
	</msapplication>
</browserconfig>`
				)
			)

			Promise.allSettled(faviconsPromises).then((results) => {
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
		}).catch((err) => {
			reject(`Create favicons : Error ${generatedDir.bold} : ${err}`.red)
		})
	})
}
