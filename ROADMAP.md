# Roadmap

*To get an up-to-date overview of the roadmap, look at it from the master branch.*

Current version : **v0.1.2**

- **v0.1.2** :
    + [X] ~~*Make the generation 2x faster (do not recompile each file)*~~ [2021-05-13]
    + [X] ~~*Update of docker configuration files*~~ [2021-05-14]
    + [X] ~~*Better documentation and commenting of the code*~~ [2021-05-18]
    + [X] ~~*Do not cut the content in the rss feed*~~ [2021-05-14]

- **v0.1.3** :
    + [ ] Log cleanup
    + [ ] Display configuration errors in the logs
    + [X] `featured_image` and `limit` settings for `LIST_BLOG_RECUR` and `LIST_PODCAST_RECUR`
    + [ ] Standardize names (enclosure, image -> featured_image)
    + [X] Better HTML to text function (with cheerio)
    + [X] No more need for the domain name in the config (less problem for the change dev=>prod and allows several domain names, ex: for TOR)
    + [ ] Harmonization of configuration files (e.g.: the port exists in the config.yml and the .env)

- **v0.1.4** :
    + [ ] Command to import/export (backup) the site, including comments if they are running under docker with the site
    + [ ] Added OpenGraph support

- **v0.2.0 : Shortcodes update** :
    + [ ] `LIST_BLOG_RECUR` and `LIST_PODCAST_RECUR` replaced by `LIST` with parameters (recur, type, enclosure) and page list added
    + [ ] Added external shortcodes management (install and update command)
    + [ ] Adding new shortcodes
        * [ ] `[HIDE]` to hide a post or podcast
        + [ ] `[SEARCH_BAR]` adds a site-wide search bar
- **v0.3.0 : Themes update** :
    + [ ] Command to add and update external themes
    + [ ] Possibility to add a custom stylesheet for each type of page (in `custom/themes/custom/*.css`)
- **v1.0.0 : Webmaster update** :
    + [ ] Added an interface to add and modify pages, change the style, add posts and podcasts.