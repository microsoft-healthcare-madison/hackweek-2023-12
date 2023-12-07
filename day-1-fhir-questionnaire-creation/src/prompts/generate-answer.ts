// Answer Generation based on AI processing
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from "fhir/r4";
import {
  evaluateChatPromptGpt4,
  evaluateChatPromptGpt35,
} from "./openai-helper";

// Fake source for the patient data to use
import ipsBundle from "../../../samples/ips-bundle.json";
import { KeyQuestionnaire, findItem, findKeyedItem } from "./questionnaire-helpers";

var generationCounter = 0;

interface AnswerSuggestions {
  options: {
    questionText?: string; // NOT IN OpenAI Query (added in to help with debugging)
    answerText: string; // suggested answer to apply to the question
    label: string; // markdown description providing consise reasoning as to why the answer should be used
    source: string; // which parts of the patient data were used to generate the answer
    confidence: number; // confidence level of the answer based on provided answer data
  }[];
}

const suggestionSchema = `interface AnswerSuggestions {
  options: {
    answerText: string; // suggested answer to apply to the question
    label: string; // markdown description providing consise reasoning as to why the answer should be used
    source: string; // which parts of the patient data were used to generate the answer
    confidence: number; // confidence level of the answer based on provided answer data
  }[];
}`;

// Generate an answer to a question based on the current state of the questionnaire and some external data
export async function GenerateSuggestedAnswer(
  questionnaire: Questionnaire,
  currentResponse: QuestionnaireResponse,
  currentAnswer: QuestionnaireResponseItem,
  linkId: string
): Promise<QuestionnaireResponseItem | undefined> {
  var keyQ = KeyQuestionnaire(questionnaire);
  const kItemDef = findKeyedItem(keyQ, linkId);
  const itemDef = findItem(questionnaire.item, linkId);
  if (!itemDef) {
    console.log("Unable to find itemDef for linkId: ", linkId);
    return;
  }
  generationCounter++;

  if (false){
    // Short circuit the generation so that we can test quicker
    let newAnswer: QuestionnaireResponseItem = {
      linkId: itemDef.linkId,
      text: itemDef.text,
      answer: [{ valueString: "test me" + generationCounter }],
    };
    console.log("newAnswer: ", newAnswer);
    return newAnswer;

  }


  let generatedAnswer = "part 1";
  const systemPrompt =
    "You are a consise assistant helping a patient fill out a questionnaire. The patient has provided the following information from a fhir IPS bundle\n\n" +
    "```json\n\n" +
    JSON.stringify(ipsBundle, null, 2) +
    "\n\n" +
    "```\n\n" +
    "provide responses using the typescript interface below\n\n" +
    suggestionSchema;

  const otherQuestionsInGroup = kItemDef?.parent?.itemDef.item?.filter((i)=>{return i.linkId != kItemDef.itemDef.linkId})
                                .map((i) => { return " * " + i.text;}).join("\r\n");
  let possibleAnswers: AnswerSuggestions = await evaluateChatPromptGpt4(
    systemPrompt,
    "The patient is trying to enter a response to the following question:\n\n" + itemDef.text,
    "What suggested answers could you provide to the patient based on their data?\r\n"
    +"Careful to ensure that the answer doesn't clash with anwsers to other questions already in this section:\r\n"
    + otherQuestionsInGroup
  );

  possibleAnswers.options.map(i => i.questionText = itemDef.text);
  console.log("possibleAnswers to "+linkId+" : ", possibleAnswers);
  // likely need to do type conversions here too.

  if (possibleAnswers){
    generatedAnswer = possibleAnswers.options[0].answerText;
  }

  if (currentAnswer?.answer) {
    let newAnswer: QuestionnaireResponseItem = JSON.parse(
      JSON.stringify(currentAnswer)
    );
    if (!newAnswer.answer)
      newAnswer.answer = [{ valueString: generatedAnswer }];
    else {
      if (newAnswer.answer[0].valueString)
        newAnswer.answer[0].valueString = generatedAnswer;
    }
    return newAnswer;
  } else {
    // We need to create a new answer to inject into the response (at the correct location)
    let newAnswer: QuestionnaireResponseItem = {
      linkId: itemDef.linkId,
      text: itemDef.text,
      answer: [{ valueString: generatedAnswer }],
    };
    console.log("newAnswer: ", newAnswer);
    return newAnswer;
  }
  return undefined;
}
