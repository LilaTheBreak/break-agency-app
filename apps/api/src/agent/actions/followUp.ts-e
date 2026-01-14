export default {
  name: "followUp",
  description: "Creates a follow-up draft",
  async run({ context }) {
    const brand = context?.brand || "the brand";
    return {
      subject: `Checking in about our collaboration with ${brand}`,
      body: "Just bumping this to the top of your inbox — keen to keep things moving!"
    };
  }
};
