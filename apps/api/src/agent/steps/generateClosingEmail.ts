export default {
  name: "generateClosingEmail",
  async run({ terms, llm }) {
    const prompt = `
Write a friendly, professional email confirming the final deal terms:

${JSON.stringify(terms, null, 2)}

Return:
{
  "subject": string,
  "body": string
}
    `;
    return llm?.promptJSON ? llm.promptJSON(prompt) : null;
  }
};
