const OpenAI = require("openai") ;

const OpenAi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports={
    OpenAi
}