'use strict';

var uuid = require('uuid');

const blocksToMarkdown = blocks => {
  let mdContent = '';
  for (const block of blocks) {
    if (block.type === "simpleImage") {
      mdContent += `![${block.caption}](${block.url})\n<${block.caption}\n\n`;
    }
    if (block.type === "header") {
      mdContent += `${'#'.repeat(block.level)} ${block.text}\n\n`;
    } else if (block.type === "image") {
      mdContent += `![${block.caption}](${block.url})\n<${block.caption}\n\n`;
    } else if (block.type === "paragraph") {
      let text = block.text;

      // Convert <a> tags to markdown links
      text = text.replace(/<a href="([^"]+)">([^<]+)<\/a>/g, '[$2]($1)');

      // Convert <b> and <i> tags to markdown bold and italic syntax
      text = text.replace(/<b>([^<]+)<\/b>/g, '**$1**');
      text = text.replace(/<i>([^<]+)<\/i>/g, '*$1*');
      mdContent += `${text}\n\n`;
    } else if (block.type === "list") {
      for (const item of block.items) {
        if (item.match(/^\d\.\s/)) {
          // Check for ordered list
          mdContent += `${item}\n`;
        } else {
          mdContent += `- ${item}\n`;
        }
      }
      mdContent += '\n';
    } else if (block.type === "code") {
      mdContent += "```\n" + block.code + "\n```\n\n";
    }
  }
  return mdContent.trim(); // Remove trailing new lines
};

const convertFromJSON = jsonData => {
  const blocks = [];
  for (const block of jsonData.blocks) {
    if (block.type === "header") {
      blocks.push({
        type: "header",
        text: block.data.text,
        level: block.data.level
      });
    } else if (block.type === "image") {
      let url = block.data.url ? block.data.url : block.data.file.url;
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
      });
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

function cleanjson2md(data) {
  const blocks = convertFromJSON(data);
  const markdown = blocksToMarkdown(blocks);
  return markdown;
}

function json2md(data) {
  let markdown = "";
  for (const section of data.content) {
    if (section.type === "default") {
      markdown += `## ${section.header}\n${section.text}\n`;
    } else if (section.type === "faq") {
      markdown += `## ${section.header}\n`;
      for (let i = 0; i < section.questions.length; i++) {
        markdown += `<question>\n${section.questions[i]}\n</question>\n`;
        markdown += `<answer>\n${section.answers[i]}\n</answer>\n`;
      }
    }
  }
  return markdown;
}

const parseHeader = line => {
  const headerMatch = line.match(/^(#{1,6})\s(.+)$/);
  if (headerMatch) {
    return {
      type: "header",
      level: headerMatch[1].length,
      text: headerMatch[2]
    };
  }
};
const parseImage = line => {
  const imageMatch = line.match(/!\[([^\]]+)\]\(([^)]+)\)/);
  if (imageMatch) {
    return {
      type: "image",
      url: imageMatch[2],
      caption: imageMatch[1]
    };
  }
};
const parseListItem = line => {
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
const convertMdtoHtml = line => {
  // Replace bold markdown with HTML <b> tags
  line = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  line = line.replace(/__(.*?)__/g, '<b>$1</b>');

  // Replace italic markdown with HTML <i> tags
  // Updated regex pattern for italics, accounting for edge cases and ignoring underscores in words/identifiers
  const italicRegex = /(?<!\w)(?<!\\)_([^\s_](?:.*?[^\s_])?)(?<!\\)_(?!\w)/g;
  line = line.replace(italicRegex, function (match, content) {
    // The "content" captured group contains the text to be italicized
    return `<i>${content}</i>`;
  });

  // Replace markdown links with HTML <a> tags
  line = line.replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return line;
};
const parseParagraph = line => {
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

const processListItems = listItems => {
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
    currentIndex++; // Move to next line
    while (currentIndex < lines.length && lines[currentIndex].trim() !== "```") {
      codeLines.push(lines[currentIndex]);
      currentIndex++;
    }
    if (currentIndex < lines.length) {
      currentIndex++; // Skip the ending ```
    }

    return {
      block: {
        type: "code",
        code: codeLines.join("\n")
      },
      newIndex: currentIndex // return the updated index
    };
  }

  return null; // Not a code block
};

const parseNotFaq = mdContent => {
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
      i = codeBlockResult.newIndex - 1; // Update the index to after the code block, -1 since the loop will increment
      continue;
    }

    // Check for listItem and **listBlock** before header, otherwise header could be appended before list items, which is out of order
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
    if (block = parseParagraph(line)) {
      blocks.push(block);
    }
  }
  const listBlock = processListItems(listItems);
  if (listBlock) {
    blocks.push(listBlock);
  }
  return blocks;
};

const parseQuestion = mdContent => {
  const blocks = [];
  blocks.push({
    type: "header",
    level: 5,
    text: mdContent
  });
  return blocks;
};

function extractQuestionsAndAnswers(str) {
  const startTag = "<question>";
  const endTag = "</answer>";
  const startIndex = str.indexOf(startTag);
  const endIndex = str.lastIndexOf(endTag);
  let questionsAndAnswers;
  if (startIndex === -1 || endIndex === -1) {
    questionsAndAnswers = "";
    return {
      before: str,
      after: "",
      questionsAndAnswers: questionsAndAnswers
    };
  } else {
    questionsAndAnswers = str.slice(startIndex, endIndex + endTag.length);
    let before = str.slice(0, startIndex);
    let after = str.slice(endIndex + endTag.length);
    return {
      before: before,
      after: after,
      questionsAndAnswers: questionsAndAnswers
    };
  }
}
function extractQAList(str) {
  const questionPattern = /<question>([\s\S]*?)<\/question>/g;
  const answerPattern = /<answer>([\s\S]*?)<\/answer>/g;
  let questions = [];
  let answers = [];
  let match;
  while (match = questionPattern.exec(str)) {
    questions.push(match[1].trim());
  }
  while (match = answerPattern.exec(str)) {
    answers.push(match[1].trim());
  }
  return questions.map((question, index) => ({
    question,
    answer: answers[index]
  }));
}
const parseMarkdown = mdContent => {
  const {
    before,
    after,
    questionsAndAnswers
  } = extractQuestionsAndAnswers(mdContent);
  let blocks = [];
  blocks.push(...parseNotFaq(before));
  if (questionsAndAnswers !== "") {
    const QAList = extractQAList(questionsAndAnswers);
    for (let i = 0; i < QAList.length; i++) {
      blocks.push(...parseQuestion(QAList[i].question));
      blocks.push(...parseNotFaq(QAList[i].answer));
    }
  }
  if (after !== "") {
    blocks.push(...parseNotFaq(after));
  }
  return blocks;
};

const generateBlockId$1 = () => {
  return Math.random().toString(36).substr(2, 10);
};
const convertToJSON = blocks => {
  const data = {
    time: Date.now(),
    blocks: [],
    version: "2.28.2"
  };
  for (const block of blocks) {
    if (block.type === "header") {
      data.blocks.push({
        id: generateBlockId$1(),
        type: "header",
        data: {
          text: block.text,
          level: block.level
        }
      });
    } else if (block.type === "image") {
      data.blocks.push({
        id: generateBlockId$1(),
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
        id: generateBlockId$1(),
        type: "paragraph",
        data: {
          text: block.text
        }
      });
    } else if (block.type === "list") {
      data.blocks.push({
        id: generateBlockId$1(),
        type: "list",
        data: {
          style: "ordered",
          items: block.items
        }
      });
    } else if (block.type === "code") {
      data.blocks.push({
        id: generateBlockId$1(),
        type: "code",
        data: {
          code: block.code
        }
      });
    }
  }
  return data;
};

function md2cleanjson(markdownContent) {
  const blocks = parseMarkdown(markdownContent);
  const output = convertToJSON(blocks);
  return JSON.stringify(output, null, 2);
}

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
  };
  blocks.push(titleBlock);
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
    };
    blocks.push(ogImageBLock);
  }
  return blocks;
}
function json2cleanjson(data) {
  const titleBlocks = {
    "time": Date.now(),
    "blocks": parseMetadata(data.metadata),
    "version": "2.28.2"
  };
  const markdown = json2md(data);
  const bodyBlocks = JSON.parse(md2cleanjson(markdown));
  return {
    titleBlocks,
    bodyBlocks
  };
}

function md2json(md_text) {
  const createTime = new Date().toISOString();
  let content = [];

  // Split by headers to extract sections
  if (!md_text.startsWith("\n")) {
    md_text = "\n" + md_text;
  }
  const sections = md_text.split('\n## ').slice(1);
  sections.forEach(sec => {
    const headerEndIndex = sec.indexOf('\n'); // Find the end of the header
    const header = sec.substring(0, headerEndIndex); // Get the header
    const text = sec.substring(headerEndIndex + 1); // Get the text after the header

    let contentDict = {
      "sectionId": uuid.v4(),
      "type": "default",
      "header": header,
      "text": text,
      "summary": "",
      "lastEdited": createTime
    };

    // If it's FAQ section
    if (header.includes("<faq>")) {
      contentDict["header"] = contentDict["header"].replace("<faq>", "").replace("</faq>", "");
      contentDict["type"] = "faq";
      const questionRegex = /<question>\n?(.*?)\n?<\/question>/gs;
      const answerRegex = /<answer>\n?(.*?)\n?<\/answer>/gs;
      contentDict["questions"] = [...text.matchAll(questionRegex)].map(match => match[1].trim());
      contentDict["answers"] = [...text.matchAll(answerRegex)].map(match => match[1].trim());
    }
    content.push(contentDict);
  });
  return content;
}

exports.cleanjson2md = cleanjson2md;
exports.json2cleanjson = json2cleanjson;
exports.json2md = json2md;
exports.md2cleanjson = md2cleanjson;
exports.md2json = md2json;
