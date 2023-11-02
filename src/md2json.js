import { v4 as uuidv4 } from 'uuid';

export default function md2json(md_text) {
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
      "sectionId": uuidv4(),
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

