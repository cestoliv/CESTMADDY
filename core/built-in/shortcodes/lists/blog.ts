import { IBlog, IPost, ISources } from "../../../scripts/interfaces"

export function compile(scSettings: any, sources: ISources): Promise<string> {
	return new Promise((resolve, reject) => {
		var HTMLlist: string = ""
		var sourceBlog: IBlog
		var posts: Array<IPost> = new Array()

		// Check "blog" setting
		if (!scSettings.hasOwnProperty("blog"))
			return reject("you have not specified any blog")
		// Check if blog exists
		let blogFound = false
		sources.blogs.forEach((blog) => {
			if (blog.name == scSettings["blog"])
			{
				sourceBlog = blog
				blogFound = true
				return
			}
		})
		if (!blogFound)
			return reject(`can't find a blog named ${scSettings["blog"]}`)

		// Sort by date
		posts = sourceBlog!.posts.sort((a, b) => {
			return a.date.object < b.date.object ? 1 : -1
		})

		// Apply limit
		if (scSettings.hasOwnProperty("limit") && typeof (scSettings["limit"]) == "number")
			posts = posts.slice(0, scSettings["limit"])

		// Start generation
		HTMLlist = `<ul class="list_blog">`
		posts.forEach((post) => {
			HTMLlist += `<li><a href="${post.webPath}">`

			if (scSettings.hasOwnProperty("enclosure") && scSettings["enclosure"])
				if (post.enclosure.webPath != "")
					HTMLlist += `<img src="${post.enclosure.webPath}" />`


			HTMLlist += `<div class="list_blog_content">
							<p class="list_blog_date">${post.author.name},
								<strong>${post.date.relativeString}</strong>,
								${post.date.object.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
							</p>
							<p class="list_blog_title">${post.title}</p>
							<p class="list_blog_description">${post.description}</p>
						</div>
					</a>
				</li>`.replace(/[\n\r]/g, '')
		})
		resolve(HTMLlist)
	})
}
