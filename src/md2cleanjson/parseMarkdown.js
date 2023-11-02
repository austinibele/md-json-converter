import parseNotFaq from "./parseNotFaq.js";
import parseQuestion from "./parseQuestion.js";

function extractQuestionsAndAnswers(str) {
    const startTag = "<question>";
    const endTag = "</answer>";

    const startIndex = str.indexOf(startTag);
    const endIndex = str.lastIndexOf(endTag);

    let questionsAndAnswers;
    if (startIndex === -1 || endIndex === -1) {
        questionsAndAnswers = "";
        return {before: str, after: "", questionsAndAnswers: questionsAndAnswers}
    } else {
        questionsAndAnswers = str.slice(startIndex, endIndex + endTag.length);
        let before = str.slice(0, startIndex);
        let after = str.slice(endIndex + endTag.length)
        return {before: before, after: after, questionsAndAnswers: questionsAndAnswers}
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

const parseMarkdown = (mdContent) => {
    const { before, after, questionsAndAnswers } = extractQuestionsAndAnswers(mdContent);

    let blocks = [];
    blocks.push(...parseNotFaq(before));

    if (questionsAndAnswers !== "") {
        const QAList = extractQAList(questionsAndAnswers);
        for (let i = 0; i < QAList.length; i++) {
            blocks.push(...parseQuestion(QAList[i].question));
            blocks.push(...parseNotFaq(QAList[i].answer));
        }
    };
    
    if (after !== "") {
        blocks.push(...parseNotFaq(after));
    };
    return blocks;
};

export default parseMarkdown;