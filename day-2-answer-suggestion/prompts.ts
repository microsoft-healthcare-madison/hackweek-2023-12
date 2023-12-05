import OpenAI from "openai";
import { QuestionnaireItem } from "./types";
import { writeFileSync, readFileSync, existsSync } from "fs";
import crypto from "crypto";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_API_ORG,
});

class CacheManager {
  private cache: Record<string, any>;
  private cacheFile: string;

  constructor(cacheFile: string) {
    this.cacheFile = cacheFile;
    if (existsSync(cacheFile)) {
      const data = readFileSync(cacheFile, "utf-8");
      this.cache = JSON.parse(data);
    } else {
      this.cache = {};
    }
  }

  get(key: string): any {
    const hashedKey = this.hashKey(key);
    return this.cache[hashedKey] || null;
  }

  set(key: string, value: any): void {
    const hashedKey = this.hashKey(key);
    this.cache[hashedKey] = value;
    this.saveCache();
  }

  private saveCache(): void {
    writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
  }

  private hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }
}

const cacheManager = new CacheManager("kwCache.json");

export async function identifyKeywordsForQuestion(
  q: QuestionnaireItem,
  config: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    const cachedResult = cacheManager.get(q.text);
    if (cachedResult) {
      return cachedResult;
    }
  }

  const response = await client.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    model: "gpt-4-1106-preview",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a clinical data abstraction expert with deep knowledge of EHR formats and typescript interfaces",
      },

      {
        role: "user",
        content: `Based on the my question, please identify a set of keywords we can use to search the EHR for relevant snippets of information:

Your keywords should use ands and ors help us find the most relevant information. Keep them simple and short.  Use ands/ors to express elegant logic. Use many synonyms and related terms.

* All keywords should be stemmed -- strip suffixes, remove plurals
* Use many clinical expressions, synonyms, and related terms
* Use proper clinical terms as well as patient friendly terms
* Anticipate the concrete words or phrases that could appear in EHR relevant to this question
    *  make keywords for all of them
* Re: medications, generate many keywords for
    * classes
    * specific brand names
    * specific generic names
* Assume the EHR data may not use terms directly from the question; imagine what terms could appear

Your ouptput uses JSON in the following format:

type Keywords {
    and:(string | Keywords)[];
} | {
    or: (string | Keywords)[];
}
`,
      },
      { role: "user", content: "Have you ever had a head injury?" },
      {
        role: "system",
        content: JSON.stringify({
          or: [
            "TBI",
            "concussion",
            {
              and: [
                { or: ["head", "brain", "skull"] },
                { or: ["injury", "trauma", "accident", "fracture"] },
              ],
            },
          ],
        }),
      },
      {
        role: "user",
        content: "Have you ever taken medication for high blood pressure?",
      },
      {
        role: "system",
        content: JSON.stringify({
          or: [
            "antihypertens",
            "bp med",
            "blood pressure med",
            {
              or: [
                "ACE",
                "ARB",
                "angiotensin",
                "beta block",
                "diuretic",
                "calcium channel block",
                "renin inhibitor",
                "alpha block",
                "vasodilat",
              ],
            },
            {
              or: [
                "lisinopril",
                "losartan",
                "amlodipine",
                "hydrochlorothiazide",
                "metoprolol",
                "atenolol",
                "enalapril",
                "valsartan",
                "diltiazem",
                "spironolactone",
                "furosemide",
                "ramipril",
                "bisoprolol",
                "propranolol",
              ],
            },
            {
              and: [
                {
                  or: ["hypertension", "blood pressure"],
                },
                {
                  or: ["med", "treatment", "drug", "management"],
                },
              ],
            },
          ],
        }),
      },
      { role: "user", content: q.text },
    ],
  });
  const ret = JSON.parse(response.choices[0].message.content!);
  cacheManager.set(q.text, ret);
  return ret;
}

const factModelCacheManager = new CacheManager("factModelCache.json");

export async function createFactModelForQuestion(
  q: QuestionnaireItem,
  config: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    const cachedResult = factModelCacheManager.get(q.text);
    if (cachedResult) {
      return cachedResult;
    }
  }
    const messages = [
      {
        role: "system",
        content:
          "You are a clinical data abstraction expert with deep knowledge of EHR formats and typescript interfaces",
      },
      {
        role: "user",
        content: `
Based on my question, I need a "fact model" and data abstraction instructions for an EHR data abstraction team. The team will process EHR data in chunks, populating instances of the fact model. Their parallel work demands a fact model suitable for monotonic aggregation. The fact model should consist of TypeScript interfaces for populating a database to answer the clinical question.

* Do not include elements for patient identification; the abstraction team will always be working in the context of a single patient.
* Account for dates because downstream summarization may depend on them
* All elements should be optional if they might ever be missing from the EHR when a fact is being created.
* If you have several distinct fact types, define FactModel as a disjoint union of those types.

Begin your output with a ${"```typescript"} code block with an interface named FactModel, including dependent interfaces or types. The data abstraction team will create FactModel[] arrays for each chunk of EHR the process, so your FactModel does not need internal arrays.

Provide detailed commentary as instructions for the data abstraction team. They won't see the original question, so include sufficient context to guide them in:
 * Identifying relevant information.
 * Determining when to create facts and when to discard irrelevant data.
`,
      },
      { role: "user", content: q.text },
    ]
    console.log(messages)
  const response = await client.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    model: "gpt-4-1106-preview",
    temperature: 0.9,
    messages: messages as ChatCompletionMessage[],
  });
  const ret = response.choices[0].message.content;
  factModelCacheManager.set(q.text, ret);
  return ret;
}

const abstractionCacheManager = new CacheManager("abstractionCache.json");

export async function createAbstractionForEhrChunk(
  instructions: string,
  ehrChunk: string,
  config: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    let cacheKey = `${instructions}${ehrChunk}`;
    cacheKey = crypto.createHash("md5").update(cacheKey).digest("hex");
    const cachedResult = abstractionCacheManager.get(instructions + ehrChunk);
    if (cachedResult) {
      return cachedResult;
    }
  }

  const response = await client.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    model: "gpt-4-1106-preview",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are the leader of a clinical data abstraction expert with deep knowledge of EHR formats and typescript interfaces.",
      },
      {
        role: "user",
        content: instructions,
      },
      {
        role: "user",
        content:
          `Here is an EHR chunk. Perform abstractions and return a JSON FactModel[] array with 0, 1, or more elements\n\n---\n` +
          ehrChunk,
      },
    ],
  });
  const ret = JSON.parse(response.choices[0].message.content!);
  abstractionCacheManager.set(instructions + ehrChunk, ret);
  return ret;
}
