import blocksToMarkdown from "./cleanjson2md/blocksToMarkdown.js";
import convertFromJSON from "./cleanjson2md/convertFromJson.js";

export default function cleanjson2md(data) {
    const blocks = convertFromJSON(data)
    const markdown = blocksToMarkdown(blocks)
    return markdown
}
