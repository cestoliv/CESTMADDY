import fs from "fs"
import path from "path";

import { ESourceType, IBlog, IEpisode, IPodcast, IPost, ISources } from "../interfaces";
import { getGeneratedPath } from "./paths";

function createBlogFeed(blog: IBlog): Promise<void> {
	return new Promise((resolve, reject) => {
		var posts: Array<IPost>
		var feed: string
		var postsFeed: string = ""
		var feedPath = getGeneratedPath(path.join(blog.path, 'rss.xml'), ESourceType.Other)

		// Sort by date
		posts = blog.posts.sort((a, b) => {
			return a.date.object < b.date.object ? 1 : -1
		})

		posts.forEach((post) => {
			let enclosureUrl = ""
			if (post.enclosure.webPath != "")
				enclosureUrl = `\${DOMAIN}${post.enclosure.webPath}`
			postsFeed += `<item>
			<title>${post.title}</title>
			<link>\${DOMAIN}${post.webPath}</link>
			<description>${post.description}</description>
			<author>${post.author.email} (${post.author.name})</author>
			<enclosure url="${enclosureUrl}"/>
			<pubDate>${post.date.object.toUTCString()}</pubDate>
			<content:encoded><![CDATA[${post.content}]]></content:encoded>
		</item>
		`
		})

		feed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
	<channel>
		<title>${blog.name}</title>
		<description>${blog.description}</description>
		<link>\${DOMAIN}/${blog.path}</link>
		<category>${blog.category}</category>
		<language>${blog.language}</language>
		${postsFeed}
	</channel>
</rss>`

		fs.promises.mkdir(path.dirname(feedPath), { recursive: true }).then(() => {
			fs.promises.writeFile(feedPath, feed).then(() => {
				resolve()
			}).catch((err) => {
				reject(`Feed : Can't write ${feedPath.bold} : ${err}`.red)
			})
		}).catch((err) => {
			reject(`Feed : Can't create folder ${path.dirname(feedPath).bold} : ${err}`.red)
		})
	})
}

function createPodcastFeed(podcast: IPodcast): Promise<void> {
	return new Promise((resolve, reject) => {
		var episodes: Array<IEpisode>
		var feed: string
		var episodesFeed: string = ""
		var feedPath = getGeneratedPath(path.join(podcast.path, 'rss.xml'), ESourceType.Other)

		// TODO: Sort by date
		episodes = podcast.episodes
		/*
		episodes = podcast.episodes.sort((a, b) => {
			return a.date.object < b.date.object ? 1 : -1
		})
		*/

		episodes.forEach((episode) => {
			episodesFeed += `<item>
			<title>${/* TODO */""}</title>
			<link>${/* TODO */""}</link>
			<guid>${/* TODO */""}</guid>
			<description><![CDATA[${/* TODO */""}]]></description>
			<author>${/* TODO */""} (${/* TODO */""})</author>
			<enclosure url="${/* TODO */""}" length="${/* TODO */""}" type="${/* TODO */""}"/>
			<pubDate>${/* TODO */""}</pubDate>
			<itunes:duration>${/* TODO */""}</itunes:duration>
			<itunes:image href="${/* TODO */""}" />
		</item>
		`
		})

		feed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0"
	xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
	xmlns:media="http://www.itunes.com/dtds/podcast-1.0.dtd"
	xmlns:spotify="http://www.spotify.com/ns/rss"
	xmlns:dcterms="https://purl.org/dc/terms"
	xmlns:psc="https://podlove.org/simple-chapters/"
>
	<channel>
		<atom:link href="${feedPath}" rel="self" type="application/rss+xml" />
		<title>${podcast.name}</title>
		<link>\${DOMAIN}/${podcast.path}</link>
		<description>${/* TODO */""}</description>
		<image>
			<link>${/* TODO */""}</link>
			<title>${/* TODO */""}</title>
			<url>${/* TODO */""}</url>
		</image>
		<language>${/* TODO */""}</language>

		<googleplay:author>${/* TODO */""}</googleplay:author>
		<googleplay:image href="${/* TODO */""}"/>
		<googleplay:category text="${/* TODO */""}"/>
		<googleplay:explicit>"${/* TODO */""}</googleplay:explicit>

		<itunes:owner>
			<itunes:name>${/* TODO */""}</itunes:name>
			<itunes:email>${/* TODO */""}</itunes:email>
		</itunes:owner>
		<itunes:author>${/* TODO */""}</itunes:author>
		<itunes:image href="${/* TODO */""}"/>
		<itunes:category text="${/* TODO */""}"/>
		<itunes:complete>${/* TODO */""}</itunes:complete>
		<itunes:explicit>${/* TODO */""}</itunes:explicit>
		<itunes:type>${/* TODO */""}</itunes:type>

		<spotify:limit>${/* TODO */""}</spotify:limit>
		<spotify:countryOfOrigin>${/* TODO */""}</spotify:countryOfOrigin>
	${episodesFeed}
	</channel>
</rss>`

		fs.promises.mkdir(path.dirname(feedPath), { recursive: true }).then(() => {
			fs.promises.writeFile(feedPath, feed).then(() => {
				resolve()
			}).catch((err) => {
				reject(`Feed : Can't write ${feedPath.bold} : ${err}`.red)
			})
		}).catch((err) => {
			reject(`Feed : Can't create folder ${path.dirname(feedPath).bold} : ${err}`.red)
		})
	})
}

export function createFeeds(sources: ISources): Promise<void> {
	return new Promise((resolve, reject) => {
		var promisesList: Array<Promise<void>> = new Array()

		sources.blogs.forEach((blog) => {
			promisesList.push(createBlogFeed(blog))
		})

		sources.podcasts.forEach((podcast) => {
			promisesList.push(createPodcastFeed(podcast))
		})

		Promise.allSettled(promisesList).then((results) => {
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
