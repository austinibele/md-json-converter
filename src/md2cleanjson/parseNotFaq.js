const parseHeader = (line) => {
    const headerMatch = line.match(/^(#{1,6})\s(.+)$/);
    if (headerMatch) {
        return {
            type: "header",
            level: headerMatch[1].length,
            text: headerMatch[2]
        };
    }
};

const parseImage = (line) => {
    const imageMatch = line.match(/!\[([^\]]+)\]\(([^)]+)\)/);
    if (imageMatch) {
        return {
            type: "image",
            url: imageMatch[2],
            caption: imageMatch[1]
        };
    }
};

const parseListItem = (line) => {
    const listItemMatch = line.match(/-\s(.+)|\d\\s(.+)/);
    if (listItemMatch) {
        return listItemMatch[1] || listItemMatch[2];
    }
};


function containsInvalidTag(str) {
    // This regex looks for a string that starts with < and is followed by any character
    // other than a space or > (which could indicate a valid tag), and is not closed by >
    // This is used to detect the markdown caption character '<', and only render the caption specifcally with the image
    // And not accidentally on the next line of text while potentially being detected as an invalid tag
    const invalidTagRegex = /<[^ >]+[^>]*$/;
    return invalidTagRegex.test(str);
  }

const convertMdtoHtml = (line) => {
    // Replace bold markdown with HTML <b> tags
    line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    line = line.replace(/__(.*?)__/g, '<b>$1</b>');

    // Replace italic markdown with HTML <i> tags
    // Updated regex pattern for italics, accounting for edge cases and ignoring underscores in words/identifiers
    const italicRegex = /(?<!\w)(?<!\\)_([^\s_](?:.*?[^\s_])?)(?<!\\)_(?!\w)/g;
    line = line.replace(italicRegex, function(match, content) {
        // The "content" captured group contains the text to be italicized
        return `<i>${content}</i>`;
    });

    // Replace markdown links with HTML <a> tags
    line = line.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    return line;
}

const parseParagraph = (line) => {
    if (containsInvalidTag(line)) {
        return null;
    }
    line = line.trim();
    if (line.length > 0) {
        line = convertMdtoHtml(line);
        return {
            type: "paragraph",
            text: line
        };
    }
    return null; // Return null if the line is empty
};

const processListItems = (listItems) => {
    if (listItems.length) {
        return {
            type: "list",
            items: listItems.slice()
        };
    }
};

const parseCodeBlock = (lines, currentIndex) => {
    if (lines[currentIndex].trim() === "```") {
        let codeLines = [];
        currentIndex++;  // Move to next line
        while (currentIndex < lines.length && lines[currentIndex].trim() !== "```") {
            codeLines.push(lines[currentIndex]);
            currentIndex++;
        }
        if (currentIndex < lines.length) {
            currentIndex++;  // Skip the ending ```
        }
        return {
            block: {
                type: "code",
                code: codeLines.join("\n")
            },
            newIndex: currentIndex  // return the updated index
        };
    }
    return null;  // Not a code block
};

const parseNotFaq = (mdContent) => {
    const blocks = [];
    let listItems = [];
    const lines = mdContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let block;

        // Check for code block first
        const codeBlockResult = parseCodeBlock(lines, i);
        if (codeBlockResult) {
            blocks.push(codeBlockResult.block);
            i = codeBlockResult.newIndex - 1;  // Update the index to after the code block, -1 since the loop will increment
            continue;
        }

        if (block = parseHeader(line)) {
            blocks.push(block);
            continue;
        }

        if (block = parseImage(line)) {
            blocks.push(block);
            continue;
        }

        if (line[0] === ">") {
            continue;
        }

        const listItem = parseListItem(line);
        if (listItem) {
            listItems.push(convertMdtoHtml(listItem));
            continue;
        }

        const listBlock = processListItems(listItems);
        if (listBlock) {
            blocks.push(listBlock);
            listItems = [];
        }

        if (block = parseParagraph(line)) {
            blocks.push(block);
        }
    }

    const listBlock = processListItems(listItems);
    if (listBlock) {
        blocks.push(listBlock);
    }

    return blocks;
}

export default parseNotFaq;