const parseQuestion = (mdContent) => {
    const blocks = []
    blocks.push({
        type: "header",
        level: 5,
        text: mdContent
    });
    return blocks
}

export default parseQuestion;
