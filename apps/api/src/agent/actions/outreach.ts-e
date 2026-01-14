export default {
  name: "outreach",
  description: "Draft outreach messages",
  async run({ user, llm }) {
    const prompt = `
Generate outreach options for this creator.
Return JSON: { "subject": "", "body": "" }

Creator:
${JSON.stringify(user || {}, null, 2)}
`;

    if (llm?.promptJSON) {
      return await llm.promptJSON(prompt);
    }

    return { subject: "Intro from creator", body: "We'd love to explore a collab." };
  }
};
