const generateBlockId = () => {
    return Math.random().toString(36).substr(2, 10);
};

const convertToJSON = (blocks) => {
    const data = {
        time: Date.now(),
        blocks: [],
        version: "2.28.2"
    };

    for (const block of blocks) {
        if (block.type === "header") {
            data.blocks.push({
                id: generateBlockId(),
                type: "header",
                data: {
                    text: block.text,
                    level: block.level
                }
            });
        } else if (block.type === "image") {
            data.blocks.push({
                id: generateBlockId(),
                type: "image",
                data: {
                    file: {
                        url: block.url
                    },
                    caption: block.caption,
                    withBorder: false,
                    stretched: false,
                    withBackground: false
                }
            });
        } else if (block.type === "paragraph") {
            data.blocks.push({
                id: generateBlockId(),
                type: "paragraph",
                data: {
                    text: block.text
                }
            });
        } else if (block.type === "list") {
            data.blocks.push({
                id: generateBlockId(),
                type: "list",
                data: {
                    style: "ordered",
                    items: block.items
                }
            });
        } else if (block.type === "code") {
            data.blocks.push({
                id: generateBlockId(),
                type: "code",
                data: {
                    code: block.code
                }
            })
        }
    }

    return data;
};

export default convertToJSON;
