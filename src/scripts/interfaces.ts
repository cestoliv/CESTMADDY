//#region Sources
export enum ESourceType {
	Page,
	Post,
	Episode,
	Other
}

export interface IPage {
	sourcePath: string,
	generatedPath: string
}

export interface IPost {
	sourcePath: string,
	generatedPath: string,
	title: string,
	date: string,
	author: {
		name: string,
		email: string
	},
	description: string,
	enclosure: {
		generatedPath: string,
		webPath: string
	}
}

export interface IBlog {
	name: string,
	path: string,
	posts: Array<IPost>
}

export interface IEpisode {
	sourcePath: string,
	generatedPath: string
}

export interface IPodcast {
	name: string,
	path: string,
	episodes: Array<IEpisode>
}

export interface IOther {
	sourcePath: string,
	generatedPath: string
}

export interface ISources {
	others: Array<IOther>,
	pages: Array<IPage>,
	blogs: Array<IBlog>,
	podcasts: Array<IPodcast>
}
//#endregion

export enum EConf {
	Required,
	Optional
}
