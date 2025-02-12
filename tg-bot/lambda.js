const { webhookHandler } = require("./bot");

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));
  return await webhookHandler(event);
};
