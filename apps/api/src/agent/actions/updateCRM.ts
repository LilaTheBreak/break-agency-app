export default {
  name: "updateCRM",
  description: "Pushes extracted data into CRM",
  async run({ deal }) {
    return { status: "noop", deal };
  }
};
