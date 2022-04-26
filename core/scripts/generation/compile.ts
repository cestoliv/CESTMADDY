import fs from 'fs'
import path from 'path'
import ejs from 'ejs'
import { marked } from 'marked'
import hljs from 'highlight.js'

import { EConf, ESourceType, IOther, IPage, IPost, ISources } from "../interfaces"
import { conf } from '../config'
import { replaceShortcodes } from './shortcodes'

marked.use({
	pedantic: false,
	gfm: true,
	breaks: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,
	xhtml: false,
	highlight: function(code) {
		return hljs.highlightAuto(code).value;
	}
})

export function compileHTML(markdown: string, sourcePath: string, sources: ISources): Promise<string> {
	return new Promise((resolve, reject) => {
		replaceShortcodes(markdown, sourcePath, sources, 0).then((markdown) => {
			marked(markdown, (err, html) => {
				if(err) return reject(err)
				resolve(html)
			})
		})
	})
}

export function copyTheme(): Promise<void> {
	return new Promise((resolve, reject) => {
		let themeName: string = 'clean'
		let themePath: string = path.join('./', 'core', 'built-in', 'themes', themeName)

		fs.promises.cp(themePath, path.join('./', 'cestici', 'generated', 'front', 'theme'), {recursive: true}).then(() => {
			resolve()
		}).catch((err) => {
			console.error(`Copy theme files : Error : ${err}`.red)
			reject()
		})
	})
}

export function compileErrors(): Promise<void> {
	return new Promise((resolve, reject) => {
		const	codes: number[] = [404, 500]
		const	templateDirs: string = path.join('./', 'core', 'built-in', 'themes', 'clean', 'templates', 'errors')
		var		compilePromises: Array<Promise<void>> = new Array()

		codes.forEach((code) => {
			compilePromises.push(new Promise((resolve, reject) => {
				let templatePath: string = path.join(templateDirs, `${code.toString()}.ejs`)
				let generatedPath: string = path.join('./', 'cestici', 'generated', 'errors', `${code.toString()}.html`)

				fs.promises.access(templatePath).then(() => {
					let renderOptions = {
						content: {
							type: ESourceType.Error
						},
						site: {
							title: conf("content.title", "string", EConf.Required),
						}
					}

					ejs.renderFile(templatePath, renderOptions, (err, html) => {
						if(err) return reject(`Compiling errors : Error ${templatePath.bold} : ${err}`.red)
						fs.mkdir(path.dirname(generatedPath), {recursive: true}, (err) => {
							if(err) return reject(`Compiling errors : Error ${templatePath.bold} : ${err}`.red)
							fs.writeFile(generatedPath, html, (err) => {
								if(err) return reject(`Compiling errors: Error ${templatePath.bold} : ${err}`.red)
								resolve()
							})
						})
					})
				}).catch((err) => {
					if (err.hasOwnProperty('code') && err.code == 'ENOENT')
						resolve()
					else
						reject(err)
				})
			}))
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

export function compilePage(page: IPost | IPage, sources: ISources): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.promises.readFile(page.sourcePath, 'utf-8').then((data) => {
			let templateDir: string = path.join('./', 'core', 'built-in', 'themes', 'clean', 'templates')
			let templatePath: string = path.join(templateDir, 'page.ejs')
			let renderOptions = {
				content: page,
				site: {
					title: conf("content.title", "string", EConf.Required),
					language: conf("content.language", "string", EConf.Required),
					theme: 'clean',
					header: sources.header,
					footer: sources.footer,
					favicon: {
						theme_color: conf("content.favicon.theme_color", "string", EConf.Optional),
						background: conf("content.favicon.background", "string", EConf.Optional)
					}
				},
				html: ""
			}

			if (page.type == ESourceType.Post)
				templatePath = path.join(templateDir, 'post.ejs')

			compileHTML(data, page.sourcePath, sources).then((html) => {
				renderOptions.html = html;
				ejs.renderFile(templatePath, renderOptions, (err, html) => {
					if(err) return reject(`Compiling : Error ${page.sourcePath.bold} : ${err}`.red)
					fs.mkdir(path.dirname(page.generatedPath), {recursive: true}, (err) => {
						if(err) return reject(`Compiling : Error ${page.sourcePath.bold} : ${err}`.red)
						fs.writeFile(page.generatedPath, html, (err) => {
							if(err) return reject(`Compiling : Error ${page.sourcePath.bold} : ${err}`.red)
							resolve()
						})
					})
				})
			}).catch((err) => {
				reject(`Compiling : Error ${page.sourcePath.bold} : ${err}`.red)
			})
		}).catch((err) => {
			reject(`Compiling : can't read ${page.sourcePath.bold} : ${err}`.red)
		})
	})
}

export function compileOther(other: IOther): Promise<void> {
	return new Promise((resolve, reject) => {
		fs.promises.mkdir(path.dirname(other.generatedPath), {recursive: true}).then(() => {
			fs.promises.link(other.sourcePath, other.generatedPath).then(() => {
				resolve()
			}).catch((err) => {
				reject(`Compiling : can't create symlink for ${other.sourcePath.bold} : ${err}`.red)
			})
		}).catch((err) => {
			reject(`Compiling : Error ${other.sourcePath.bold} : ${err}`.red)
		})
	})
}
