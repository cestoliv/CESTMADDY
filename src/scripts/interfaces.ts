export enum ESourceType {
	Page,		// Markdown Page
	Post,		// Markdown Post
	Podcast,	// Markdown Podcast
	Other		// Other file (image, video, etc.)
}

export interface ISourceFile {
	type: ESourceType,
	sourcePath: string,
	generatedPath: string
}
