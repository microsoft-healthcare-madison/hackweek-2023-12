# day-2-answer-suggestion

## Examples

#### Inline simple question
```sh
bun run --watch src/index.ts --patient sample-patient-1/  --question "what stage breast cancer was found?"
```

See [example output](./outputs/inline.txt)

#### Multi-part question from external file

```sh
bun run --watch src/index.ts  --patient sample-patient-1/  --questionnairefile questionnaires/biopsy.json  
```

See [example output](./outputs/external.txt)


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
