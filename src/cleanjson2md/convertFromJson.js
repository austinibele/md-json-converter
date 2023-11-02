const convertFromJSON = (jsonData) => {
    const blocks = [];

    for (const block of jsonData.blocks) {
        if (block.type === "header") {
            blocks.push({
                type: "header",
                text: block.data.text,
                level: block.data.level
            });
        } else if (block.type === "image") {
            blocks.push({
                type: "image",
                url: block.data.url,
                caption: block.data.caption
            });
        } else if (block.type === "simpleImage") {
            blocks.push({
                type: "simpleImage",
                url: block.data.url,
                caption: block.data.caption
            })
        } else if (block.type === "paragraph") {
            blocks.push({
                type: "paragraph",
                text: block.data.text
            });
        } else if (block.type === "list") {
            blocks.push({
                type: "list",
                items: block.data.items
            });
        } else if (block.type === "code") {
            blocks.push({
                type: "code",
                code: block.data.code
            });
        }
    }

    return blocks;
};

export default convertFromJSON;
