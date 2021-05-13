# Roadmap

Current version : **v0.1.1**

- **v0.1.2** :
    + [ ] Removed the need for the `.env` file when cestmaddy is not launched with docker.
    + [ ] Make the generation of rss feeds faster (do not recompile each file)
    + [X] ~~*Update of docker configuration files*~~ [2021-05-13]

- **v0.2.0 : Shortcodes update** :
    + [ ] `LIST_BLOG_RECUR` and `LIST_PODCAST_RECUR` replaced by `LIST` with parameters (recur, type, enclosure) and page list added
    + [ ] Added external shortcodes management (install and update command)
    + [ ] Adding new shortcodes
        * [ ] `[HIDE]` to hide a post or podcast
- **v0.3.0 : Themes update** :
    + [ ] Command to add and update external themes
    + [ ] Possibility to add a custom stylesheet for each type of page (in `custom/themes/custom/*.css`)
- **v1.0.0 : Blogger update** :
    + [ ] Interface for adding posts
- **v1.1.0 : Webmaster update** :
    + [ ] Add the modification of pages and stylesheet from the interface.
- **v1.2.0 : Podcaster update** :
    + [ ] Add the modification of podcasts from the interface.