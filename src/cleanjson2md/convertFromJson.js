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
            let url = block.data.url? block.data.url : block.data.file.url;
            blocks.push({
                type: "image",
                url: url,
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
        } else if (block.type === "warning") {
            blocks.push({
                type: "warning",
                title: block.data.title,
                message: block.data.message
            });
        }
    }

    return blocks;
};

export default convertFromJSON;
