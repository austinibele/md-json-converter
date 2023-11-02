import json2md from "./json2md.js";
import md2cleanjson from "./md2cleanjson.js"


const generateBlockId = () => {
    return Math.random().toString(36).substr(2, 10);
};


function parseMetadata(metadata) {
    let blocks = [];
    const titleBlock = {
        id: generateBlockId(),
        type: "header",
        data: {
            text: metadata.title,
            level: 1
        }
    }
    blocks.push(titleBlock)

    if (metadata.ogImage !== "") {
        let ogImageBLock = {
            type: "simpleImage",
            data: {
                url: metadata.ogImage,
                alt: metadata.ogImageAlt,
                caption: metadata.ogImageCaption,
                withBorder: false,
                withBackground: false,
                stretched: false
            }
        }
        blocks.push(ogImageBLock)
    }
    return blocks;
}

function json2cleanjson(data) {
    const titleBlocks = {"time": Date.now(), "blocks": parseMetadata(data.metadata), "version": "2.28.2"}
    const markdown = json2md(data)
    const bodyBlocks = JSON.parse(md2cleanjson(markdown))
    return { titleBlocks, bodyBlocks }
}

export default json2cleanjson;
