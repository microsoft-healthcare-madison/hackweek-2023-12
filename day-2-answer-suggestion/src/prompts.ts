import OpenAI from "openai";
import { QuestionnaireItem } from "./types";
import { ChatCompletionMessage } from "openai/resources/index.mjs";
import { CacheManager } from "./CacheManager";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_API_ORG,
});

const kwCache = new CacheManager("kwCache.json");

export async function identifyKeywordsForQuestion(
  q: QuestionnaireItem,
  config?: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    const cachedResult = kwCache.get(q.text);
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
          "You are a clinical data abstraction expert with deep knowledge of EHR formats, semantic search, tf–idf, and typescript interfaces",
      },

      {
        role: "user",
        content: `Based on the my question, please identify a query we can use to search the EHR for relevant snippets of information.

Your query should use "and" and "or" tree structure help us find relevant information. Keep them simple and short, and broad. 

## Step 1. Break the question into essential noun concepts

Focus on essential concepts that will appear explicitly in EHR.

Omit any implicit concepts like "diagnosis", "treatment", etc.

For example, for a question like "any history of head injury" -- the words "any history" are not part of the noun concept. The core noun concept is "head injury", so we'll AND a subquery for "head" with a subquery for "injury", then OR in any specific additoinal terms for head injury.

* NEVER query for words "record", "history", "diagnosis", "prescription", "treatment"; these are implicit concepts.

* NEVER query for like "when" or "in what year"; these are impliclit concepts. 

## Step 2. Create queries to triangulate each noun concept
* All keywords should be stemmed -- strip suffixes like "ing" and remove plurals
* Use many clinical expressions, synonyms, and related terms
* Include clinical abbreviations and acronyms and patient-friendly terms
* Expand categories into specific examples with "or"

Your output uses JSON in the following format:

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
          ],
        }),
      },
      { role: "user", content: JSON.stringify(q.text) },
    ],
  });
  const ret = JSON.parse(response.choices[0].message.content!);
  kwCache.set(q.text, ret);
  return ret;
}

const factModelCache = new CacheManager("factModelCache.json");

export async function createFactModelForQuestion(
  q: QuestionnaireItem,
  config?: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    const cachedResult = factModelCache.get(q.text);
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
* Model components and inputs that can help answer the question even if no direct answer is present in the EHR
* All elements should be optional if they might ever be missing from the EHR when a fact is being created.
* If you have several distinct fact types, define FactModel as a disjoint union of those types.

Begin your output with a ${"```typescript"} code block with an interface named FactModel, including dependent interfaces or types. The data abstraction team will create FactModel[] arrays for each chunk of EHR the process, so your FactModel does not need internal arrays.

Provide detailed commentary as instructions for the data abstraction team. They will be working with plain text EHR chunks, so include sufficient context to guide them in:
 * Identifying relevant information.
 * Determining when to create facts and when to discard irrelevant data.
`,
    },
    { role: "user", content: JSON.stringify(q) },
  ];
  // console.log(messages)
  const response = await client.chat.completions.create({
    // model: "gpt-3.5-turbo-1106",
    model: "gpt-4-1106-preview",
    temperature: 0.9,
    messages: messages as ChatCompletionMessage[],
  });
  const ret = response.choices[0].message.content;
  factModelCache.set(q.text, ret);
  return ret;
}

const factCache = new CacheManager("factCache.json");
export async function ehrChunkToFacts(
  instructions: string,
  ehrChunk: string,
  config?: { skipCache: boolean }
) {
  if (!config?.skipCache) {
    const cachedResult = factCache.get(instructions + ehrChunk);
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
          `Here is an EHR chunk. Perform abstractions and return a a JSON object with {"result": FactModel[]}. The FactModel[] array can have 0, 1, or more elements\n\n---\n` +
          ehrChunk,
      },
    ],
  });
  const ret = JSON.parse(response.choices[0].message.content!);
  factCache.set(instructions + ehrChunk, ret);
  return ret;
}

const finalAnswerCache = new CacheManager("finalAnswerCache.json");

export async function createAnswerToQuestion(
  q: QuestionnaireItem,
  facts: any[],
  config?: { skipCache: boolean }
) {
  const factsString = JSON.stringify(facts, null, 2);
  if (!config?.skipCache) {
    const cachedResult = finalAnswerCache.get(q.text + factsString);
    if (cachedResult) {
      return cachedResult;
    }
  }

  const response = await client.chat.completions.create({
    model: "gpt-4-1106-preview",
    // model: "gpt-3.5-turbo-1106",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a clinical informatics expert with deep knowledge of EHR formats and FHIR.",
      },
      {
        role: "user",
        content: `

# Question
${JSON.stringify(q, null, 2)}

# Facts
${factsString}

# Answer format

Based on my question, please create an answer, using the supplied facts.

Output a JSON QuestionnaireResponse.item like

{ // Groups and questions
    "linkId" : "<string>", // R!  Pointer to specific item from Questionnaire
    "definition" : "<uri>", // ElementDefinition - details for the item
    "text" : "<string>", // Name for group or question text
    "answer" : [{ // The response(s) to the question
      // value[x]: Single-valued answer to the question. One of these 12:
      "valueBoolean" : <boolean>,
      "valueDecimal" : <decimal>,
      "valueInteger" : <integer>,
      "valueDate" : "<date>",
      "valueDateTime" : "<dateTime>",
      "valueTime" : "<time>",
      "valueString" : "<string>",
      "valueUri" : "<uri>",
      "valueAttachment" : { Attachment },
      "valueCoding" : { Coding },
      "valueQuantity" : { Quantity },
      "valueReference" : { Reference(Any) },
      "item" : [{ Content as for QuestionnaireResponse.item }] // Nested groups and questions
    }
`,
      },
    ],
  });

  const ret = JSON.parse(response.choices[0].message.content!);
  finalAnswerCache.set(q.text + factsString, ret);
  return ret;
}
