# day-2-answer-suggestion

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
