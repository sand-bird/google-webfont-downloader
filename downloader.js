import fsp from "node:fs/promises";
import fs from "fs";
import path from "path";
import { Readable, finished } from "node:stream";

// for when the css file is going to live somewhere other than the direct parent of the font directory
const URL_BASE_DIR = process.env.URL_BASE_DIR || "";
const DRY_RUN = ["true", "t"].includes(
  (process.env.DRY_RUN || "").toLowerCase()
);

async function main() {
  let cssUrl = process.argv[2];
  if (!cssUrl)
    throw Error("requires uri to a google font css file (local path or url)");

  const text = await fetchCss(cssUrl);
  const chunks = text.split(/(?=\/\*)/);
  const localChunks = await Promise.all(chunks.map(processChunk));

  await fsp.writeFile("font.css", localChunks.join(""));
}

async function processChunk(chunk) {
  let filename = getFilename(chunk);
  let dir = getDirectory(chunk);
  let url = getFileUrl(chunk);
  if (!DRY_RUN) await fetchFont(url, filename, dir);

  return replaceUrl(chunk, `'${path.join(URL_BASE_DIR, dir, filename)}'`);
}

main();

// ----------------------------------------------------------------------------

async function fetchCss(url) {
  try {
    // node 21 native fetch!
    let res = await fetch(url, {
      headers: {
        // requred for the response body to include charset comments, for some reason
        "User-Agent":
          "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0",
      },
    });
    return res.text();
  } catch (e) {
    // assume it's a local filepath if fetch throws
    console.log(`loading local file ${url}`);
    return fsp.readFile(url, { encoding: "utf8" });
  }
}

function getDirectory(chunk) {
  return chunk
    .match(/(?<=font-family: ')[^']+/)[0]
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
}

function getFilename(chunk) {
  let charset = chunk.match(/(?<=\/\* )[\w-]*/)[0];
  let style = chunk.match(/(?<=font-style: )\w+/)[0];
  let weight = chunk.match(/(?<=font-weight: )\d+/)[0];
  // TODO: parse this from url? not sure if we can assume all the files are woff2
  return [charset, style, weight].join("-") + ".woff2";
}

const fileRegex = /(?<=src: url\()([^\)]*)/;
function getFileUrl(chunk) {
  return chunk.match(fileRegex)[0];
}

function replaceUrl(chunk, url) {
  return chunk.replace(fileRegex, url);
}

async function fetchFont(url, filename, dirname) {
  if (!fs.existsSync(dirname)) {
    await fsp.mkdir(dirname);
    console.log(`created directory ${dirname}`);
  }
  console.log(`fetching font ${filename} from ${url}`);
  const stream = fs.createWriteStream(path.join(dirname, filename));
  const { body } = await fetch(url);
  return finished(Readable.fromWeb(body).pipe(stream), (err) => {
    if (err) console.error(err);
  });
}
