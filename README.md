# Google webfont downloader

A quick & dirty utility I threw together for downloading .woff2 files from google fonts. **Requires Node 21!**

## 💁‍♀️

As of March 2024, Google Fonts allows you to download a .ttf archive of your selected font, but not the web-optimized .woff2 files that are actually referenced in their API. Instead they give you a link that looks something like this: 
```
https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap
```

This generates a CSS file that resembles [`sample_file.css`](sample_file.css). The generated file contains a bunch of `@font-face` declarations for different character sets, weights, and styles, each referencing a woff2 file with a randomly generated name, eg:

```css
/* cyrillic-ext */
@font-face {
  font-family: 'Ubuntu';
  font-style: italic;
  font-weight: 300;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/ubuntu/v20/4iCp6KVjbNBYlgoKejZftVyCN4Ffgg.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
}
```

But what if you're running a static site, and you wanna host your own fonts instead of fetching them from google's API? This script is here to help you out. It does the following:
1. parses google's CSS file
2. downloads all those woff2's and saves them with readable filenames in a subdirectory named after the font family (eg, the file for the example above would be saved to `./ubuntu/cyrillic-ext-italic-300.woff2`)
3. creates a modified CSS file that links to your new local files instead of the ones on google's servers, and saves it at `./font.css`

Then you can just upload all the fonts and the generated `font.css` file to your server and you should be good to go!

## 🏃‍♀️

Run like so:

```
$ node downloader.js CSS_FILE_PATH
````

where `CSS_FILE_PATH` can be either a `fonts.googleapis.com` URL like the one above, or a filepath to an equvalent CSS file stored locally, eg `node downloader.js sample_file.css`.

### Environment variables

#### URL_BASE_DIR

Setting the URL_BASE_DIR envvar allows you to prepend some base directory to the source urls in `font.css`, for when the CSS file should live somewhere other than the direct parent of the font directory.

By default, source urls in `font.css` are relative to the current directory (same as the actual destination for the downloaded files), so they will come out like this:
```js
url('ubuntu/cyrillic-ext-italic-300.woff2')
```

However, if you're running a static site you would typically keep fonts in a `/fonts/` directory at the site root and CSS files in a `/styles/` directory that's also at the root (or at least, that's how I do it). In this case, you can run the script like so:

```
$ URL_BASE_DIR="/fonts/" node downloader.js CSS_FILE_PATH
```

The woff2 files will still be saved to `./ubuntu/` (or whatever your font is called), but all the source urls in `font.css` will instead look like this:

```js
url('/fonts/ubuntu/cyrillic-ext-italic-300.woff2')
```

So that when you upload the fonts to `/fonts/ubuntu/` on your webserver and `font.css` to `/styles/`, the source urls will still work.

#### DRY_RUN

Set this to `true` or `t` to skip downloading fonts and only (re)generate `font.css`. Useful if you already ran the script but need a different URL_BASE_DIR, eg:

```
$ DRY_RUN=true URL_BASE_DIR="/fonts/" node downloader.js CSS_FILE_PATH
```
