import dotenv from "dotenv";
import { createFactModelForQuestion, identifyKeywordsForQuestion } from "./prompts";
import { Keywords } from "./types";
dotenv.config();

interface Questionnaire {
  resourceType: "Questionnaire";
  item: any[];
}
function extractItemFromQuestionnaire(q: Questionnaire, linkId: string) {
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

function applyRegex(expression: Keywords | string, input: string): boolean {
  if (typeof expression === 'string') {
    const regex = new RegExp(expression, 'gim');
    return regex.test(input);
  }

  if ("or" in expression) {
    return expression.or.some((exp: any) => applyRegex(exp, input));
  }

  if ("and" in expression) {
    return expression.and.every((exp: any) => applyRegex(exp, input));
  }

  return false;
}

// debug with a random medical quesiton
const debug = await identifyKeywordsForQuestion({text: "what stage was the breast cancer at the time of diagnosis?"})
console.log(debug)

const debug2 = await createFactModelForQuestion({text: "what stage was the breast cancer at time of diagnosis?"})
console.log(debug2)

