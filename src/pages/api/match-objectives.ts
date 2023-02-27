// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as math from 'mathjs';
import {Configuration, OpenAIApi} from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export interface User {
  id: string;
  objectives: string[];
}

export interface ThemeMatch {
  theme: string;
  score: number;
  objective: string;
}

export interface UserMatch {
  user: User;
  themeScores: {theme: string; score: number; objective: string;}[];
}

interface Embedding {
  object: string;
  index: number;
  embedding: number[];
}

async function findThemes(objectives: string[]): Promise<(string)[]> {
  const prompts = `My objectives are:\n- ${objectives.join('\n- ')}\nList unique development areas to which they belong to?\n`;
  let themes: any[] = [];
  // console.log(userprompts, prompts)
  try {
    const responses = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompts,
      temperature: 0,
    });
    themes = ([] as string[]).concat(...responses.data.choices.map((choice) => choice.text?.trim().split('\n') || []));
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.status);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }

  return themes.filter(<S>(value: S | undefined): value is S => value != null).filter(x => isNaN(x));
}

async function generateEmbeddings(texts: string[]): Promise<Record<string, Embedding>> {
  // Use the OpenAI Embedding API to generate embeddings for all texts
  const response = await openai.createEmbedding({input: texts, model: "text-embedding-ada-002"});
  const embeddings: any = {};
  response.data.data.forEach((embedding, i) => {
    embeddings[texts[i]] = embedding;
  });
  return embeddings;
}

function generateSimilarityScores(objectives: string[], themes: string[], embeddings: Record<string, Embedding>): number[][] {
  // Compute similarity scores between all pairs of objectives and themes
  const similarityScores: any[][] = [];
  objectives.forEach(objective => {
    const row = themes.map(theme => {
      const similarity = math.dot(embeddings[objective].embedding, embeddings[theme].embedding);
      return similarity > 0 ? similarity : 0;
    });
    similarityScores.push(row);
  });
  return similarityScores;
}

function generateThemeMatches(objectives: string[], themes: string[], similarityScores: number[][]): ThemeMatch[] {
  // Generate theme matches by selecting the best match for each theme
  const themeMatches: ThemeMatch[] = [];
  themes.forEach((theme, j) => {
    let bestMatch = '';
    let bestScore = 0;
    similarityScores.forEach((row, i) => {
      if (row[j] > bestScore) {
        bestMatch = objectives[i];
        bestScore = row[j];
      }
    });
    themeMatches.push({ theme, objective: bestMatch, score: bestScore });
  });
  return themeMatches;
}

function generateUserMatches(users: User[], themes: string[], similarityScores: number[][]): UserMatch[] {
  const userMatches: UserMatch[] = [];
  let k = 0;
  for (let i = 0; i < users.length; i++) {
    const userMatch: UserMatch = {
      user: users[i],
      themeScores: []
    };
    let l = 0;
    while (l < users[i].objectives.length) {
      let bestMatch = '';
      let bestScore = 0;
      for (let j = 0; j < themes.length; j++) {
        const themeScore = similarityScores[k + l][j];
        if (themeScore > bestScore) {
          bestMatch = themes[j];
          bestScore = themeScore;
        }
      }
      userMatch.themeScores.push({ theme: bestMatch, score: bestScore, objective: users[i].objectives[l]});
      l++;
    }
    
    k = k + users[i].objectives.length;
    userMatch.themeScores.sort((a, b) => b.score - a.score);
    userMatches.push(userMatch);
  }

  return userMatches;
}


async function alignAndMatch(users: User[]): Promise<{ themeMatches: ThemeMatch[], userMatches: UserMatch[], themes: string[] }> {
  const objectives = users.flatMap(user => user.objectives);
  // Find themes from user objectives
  const themes: string[] = await findThemes(objectives);
  console.log(themes)
  const embeddings = await generateEmbeddings([...objectives, ...themes]);
  console.log(embeddings)
  // Compute similarity scores for all pairs of objectives and themes
  const similarityScores = generateSimilarityScores(objectives, themes, embeddings);
  console.log(similarityScores)
  // Generate matches between users and themes
  const themeMatches = generateThemeMatches(objectives, themes, similarityScores);
  console.log(themeMatches)
  const userMatches = generateUserMatches(users, themes, similarityScores);
  console.log(userMatches)
  return { themeMatches, userMatches, themes };
}



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // console.log(req)
  const matchData = await alignAndMatch(req.body.users);
  res.status(200).json(matchData)
}
