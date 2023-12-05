import dotenv from "dotenv";
import {
  ehrChunkToFacts,
  createAnswerToQuestion,
  createFactModelForQuestion,
  identifyKeywordsForQuestion,
} from "./prompts";
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
  if (typeof expression === "string") {
    const regex = new RegExp(expression, "gim");
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

import fs from "fs";
import path from "path";

class PatientFile {
  public ehr: {
    filename: string;
    part: number;
    type: "note" | "fhir";
    content: string;
  }[] = [];

  constructor(private dir: string) {
    this.readFiles();
  }

  get ehrChunks() {
    return this.ehr.map((e) => ({
      ...e,
      contentString:
        typeof e.content === "string" ? e.content : JSON.stringify(e.content),
    }));
  }

  readFiles() {
    const files = fs.readdirSync(this.dir);
    files.forEach((file) => {
      const filePath = path.join(this.dir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      if (file.endsWith(".md") || file.endsWith(".txt")) {
        for (let i = 0; i < content.length; i += 10000) {
          this.ehr.push({
            filename: file,
            part: i,
            type: "note",
            content: content.slice(i, i + 10000),
          });
        }
      } else if (file.endsWith(".json")) {
        const jsonContent = JSON.parse(content);
        if (jsonContent.resourceType === "Bundle" && jsonContent.entry) {
          jsonContent.entry.forEach((entry: any, i: number) => {
            this.ehr.push({
              filename: file,
              part: i,
              type: "fhir",
              content: entry.resource,
            });
          });
        } else {
          this.ehr.push({
            filename: file,
            part: 0,
            type: "fhir",
            content: jsonContent,
          });
        }
      }
    });
  }
}

import { program } from "commander";

program
  .option("-p, --patient <type>", "Patient directory name")
  .option("-q, --question <type>", "Questionnaire item text")
  .option("-qf, --questionnairefile <type>", "Questionnaire JSON file (will take first item only)");
program.parse(process.argv);
const options = program.opts();

const p = new PatientFile(options.patient);
console.log("EHR Size", p.ehr.length);

const item = options.question ? ({text: options.question}) :
 JSON.parse(fs.readFileSync(options.questionnairefile, "utf-8")).item[0];

console.log("Generating keywords");
const keywords: any = await identifyKeywordsForQuestion(item);
console.log(keywords);

const chunksToAbstract = p.ehrChunks.reduce((acc, ehr) => {
  const { contentString } = ehr;
  if (applyRegex(keywords, contentString)) {
    acc.push(ehr);
  }
  return acc;
}, [] as any);

console.log("Matching chunks", chunksToAbstract.length);

if (chunksToAbstract.length === 0) {
  console.log("No matching chunks found");
  process.exit(0);
}

console.log("Generating abstraction instructions");
const abstractionInstructions = await createFactModelForQuestion(item);
console.log(abstractionInstructions);

console.log("Abstracting into FactModel[]");
const abstracted = (
  await Promise.all(
    chunksToAbstract.map(
      async ({ contentString }: { contentString: string }) => {
        let ret = await ehrChunkToFacts(
          abstractionInstructions,
          contentString
        );
        // console.log(ret);
        return ret.result;
      }
    )
  )
).flat();

console.log("Total fact count", abstracted.length);
console.log("All Facts", abstracted);
console.log("Generating final answer to question")

const finalAnswer = await createAnswerToQuestion(
  item,
  abstracted
);

console.log(finalAnswer);
