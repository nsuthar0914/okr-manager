import type { NextApiRequest, NextApiResponse } from 'next'
import {Configuration, OpenAIApi} from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateObjective(suggestion: string): Promise<(string)> {
    const prompts = `My focus area is:\n- ${suggestion}\nProvide the title for an objective that I can target for personal developent?\n`;
    let objective: any;
    // console.log(userprompts, prompts)
    try {
      const responses = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompts,
        temperature: 0,
        max_tokens: 256,
      });
      console.log(responses.data.choices)
      objective = responses.data.choices[0].text?.trim();
    } catch (error: any) {
      if (error.response) {
        console.error(error.response.status);
        console.error(error.response.data);
      } else {
        console.error(error.message);
      }
    }
  
    return objective;
  }

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    // console.log(req)
    const objective = await generateObjective(req.body.suggestion);
    res.status(200).json({objective})
  }