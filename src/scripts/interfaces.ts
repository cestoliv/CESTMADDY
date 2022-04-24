//#region Sources
export enum ESourceType {
	Page,
	Post,
	Episode,
	Error,
	Other
}

export interface IPage {
	type: ESourceType,
	sourcePath: string,
	generatedPath: string
}

export interface IPost {
	type: ESourceType,
	sourcePath: string,
	generatedPath: string,
	title: string,
	date: {
		object: Date,
		localeString: string,
		relativeString: string
	},
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
	type: ESourceType,
	sourcePath: string,
	generatedPath: string
}

export interface IPodcast {
	name: string,
	path: string,
	episodes: Array<IEpisode>
}

export interface IOther {
	type: ESourceType,
	sourcePath: string,
	generatedPath: string
}

export interface ISources {
	header: string,
	footer: string,
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
