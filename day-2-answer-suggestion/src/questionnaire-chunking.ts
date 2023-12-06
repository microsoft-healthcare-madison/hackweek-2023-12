import { structuredDataCapture } from "fhir-sdc-helpers";
import { Questionnaire, QuestionnaireItem } from "fhir/r4";
import { evaluateChatPromptGpt4, evaluateChatPromptGpt35 } from "./openai-helper";

let q = require("../examples/Questionnaire-mothers-live-birth.json");
// console.log('Questionnaire:', q);

/*
Larger Questionnaires are often structured into groups, and include display questions to provide context for the questions that follow.
Sometimes the display messages are inline, before or at the end of items.
Other times markdown is used too.

Good example of this is from the BFDR IG
http://build.fhir.org/ig/HL7/fhir-bfdr/Questionnaire-Questionnaire-mothers-live-birth.html
Which is loaded into this server:
https://sqlonfhir-r4.azurewebsites.net/fhir/Questionnaire/e275bef1851e4541888df9cc440922b2
https://hapi.fhir.org/baseR4/Questionnaire/bfdr-live-birth


// And the fetal loss version of the same thing
http://build.fhir.org/ig/HL7/fhir-bfdr/Questionnaire-Questionnaire-patients-fetal-death.html
https://sqlonfhir-r4.azurewebsites.net/fhir/Questionnaire/64e0b5ac2e794eca8b43bc8772f80937
https://hapi.fhir.org/baseR4/Questionnaire/38843006
*/

export interface ItemReviewThoughtChain {
  linkId: string;
  type: "string" | "boolean" | "group" | "display" | "question" | "decimal" | "integer" | "date" | "dateTime" | "time" | "text" | "url" | "choice" | "open-choice" | "attachment" | "reference" | "quantity";
  text: string;
  thoughtChain?: string;
  relatedItems?: QuestionnaireItem[];
  children?: ItemReviewThoughtChain[];
}

export function summarizeEntireQuestionnaire(q: Questionnaire): ItemReviewThoughtChain[] {
  if (q.item) return summarizeQuestionnaireItems(q.item);
  return [];
}

export function summarizeQuestionnaireItems(items: QuestionnaireItem[]): ItemReviewThoughtChain[] {
  let result:ItemReviewThoughtChain[] = [];
  for (let item of items) {
    result.push(summarizeQuestionnaireItem(item));
  }
  return result;
}

export function summarizeQuestionnaireItem(item: QuestionnaireItem): ItemReviewThoughtChain {
  // use the markdown first if that is available
  let md = structuredDataCapture.getMarkdown(item);
  if (md) md = "```\r\n" + md + "```";

  let result:ItemReviewThoughtChain = {
    linkId: item.linkId,
    type: item.type ?? 'question',
    text: md ?? item.text ?? '',
    // thoughtChain: '',
    // relatedItems: [],
  };
  
  if (item.item) {
    // walk into the child items
    result.children = summarizeQuestionnaireItems(item.item);
  }
  return result;
}

export function extractItemFromQuestionnaire(q: Questionnaire, linkId: string) {
  // consider the markdown text if present, otherwise use the text
  // display questions along the way should also be considered to be in context too
  // can the model be used to determine which questions the display is associated with.

  // How to associate questions in groups to get more context on the question?

  let result: any = null;
  for (let item of q.item) {
    if (item.linkId === linkId) {
      result = item;
    } else {
      result = extractItemFromQuestionnaire(item, linkId);
    }
    if (result) {
      break;
    }
  }
  return result;
}

// Now the actual reading of the questionnaire
let summary = summarizeEntireQuestionnaire(q);
console.log("------------------------------------------------------------");
console.log("Summary:", summary);

// And process the summary through GPT-3.5
const summarySystemPrompt = `You are a healthcare informaticist reviewing a questionnaire definition to ensure that it is precise and that guidance for entering each question can be understood in context.`;

const resultSchema = `interface Result {
  items: {
    linkId: string; // The linkId of an item in the questionnaire
    associatedNonDirectChildLinkIds: string[]; // the linkId of other items in the questionnaire that have some relationship with it, including if they just provide important context or information for how to answer the item. Might be ancestors, siblings, or children of the item with the provided linkId.
    summary: string; // a consise summary of the overall purpose of the item and its children (in markdown format), in the context of it's direct parent.
    associationReason: string; // how these items are associated and what guidance should be given to the user to enter the data (in markdown format)
  }[] // array of items
}`;

// make the format use the typescript interface
const queryPrompt =
  "Can you check the following questionnaire and return a json object that conforms to the following typescript interface:\r\n" +
  resultSchema;

import { createByModelName } from "@microsoft/tiktokenizer";
let tokenizer = await createByModelName("gpt-4-1106-preview");
var out1 = tokenizer.encode(
  summarySystemPrompt + "\r\n" + queryPrompt + "\r\n" + JSON.stringify(summary, null, 2)
);
// console.log(out1);
console.log("Token count", out1.length);

console.log("------------------------------------------------------------");
let result = await evaluateChatPromptGpt4(
  summarySystemPrompt,
  queryPrompt,
  JSON.stringify(summary, null, 2)
);
console.log("Result:", result);

// for (let r of result.items) {
//   if (r.associationReason) {
//     let tokens = tokenizer.encode(r.associationReason);
//     console.log(
//       "Token count: " + r.associationReason,
//       tokens.length,
//       r.tokenCount
//     );
//   }
// }
