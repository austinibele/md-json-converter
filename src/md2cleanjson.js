import parseMarkdown from "./md2cleanjson/parseMarkdown.js";
import convertToJSON from "./md2cleanjson/convertToJson.js";

export default function md2cleanjson(markdownContent) {
    const blocks = parseMarkdown(markdownContent);
    const output = convertToJSON(blocks);
    return JSON.stringify(output, null, 2)
}
