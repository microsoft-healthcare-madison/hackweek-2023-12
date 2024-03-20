# day-2-answer-suggestion

## Process Flow

To extract health information from an Electronic Health Records (EHR), we use a structured three-stage process, with LLM prompts at each stage:

1. **Source Data Retrieval**
   - Begin with **keyword generation** related to the health question.
   - Follow with a **search** by these keywords to find relevant EHR data.

2. **Target Representation Modeling**
   - Create structured templates for data organization.
   - Set detailed extraction instructions for the model.

3. **Processing and Summarization**
   - Process all identified source data, abstracting into templates by following instructions.
   - Summarize the processed data to directly answer the health question.

## Examples

#### Detailed question

["Provide all details necessary to determine the patient's breast cancer stage"](outputs/provide-all-details-needed-to-determine-the-breast-cancer-stage.md)


#### Asking a single question
```sh
bun run --watch src/index.ts --patient sample-patient-1/  --question "what stage breast cancer was found?"
```

#### Asking a multi-part question from an external questionnaire

```sh
bun run --watch src/index.ts  --patient sample-patient-1/  --questionnairefile questionnaires/biopsy.json  
```

## Setup
Include OPENAI env vars in `.env.local`:
```
OPENAI_API_KEY=
OPENAI_API_ORG=
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run --watch index.ts
```

This project was created using `bun init` in bun v1.0.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
