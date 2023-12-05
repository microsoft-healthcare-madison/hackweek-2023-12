# Fun with Forms and LLMs

* Day 1: Creating FHIR Questionnaires from unstructured sources


```mermaid
stateDiagram

    w: Welcome Screen
    u: Upload form
    g: Generate Questionnaire
    v: Validate Questionnaire
    r: Render Questionnaire
    i: Iterate with User

    [*] --> w
    w --> u

    u --> g
    g --> v
    v --> g

    v --> r
    r --> i
    i --> g

    i --> [*]
```


* Day 2: Auto-populating items based on EHR data

```mermaid
flowchart TD
    A[Questionnaire] --> C[Break into individual items]
    subgraph Processing for Each Question
        D["Generate *keywords* to identify\nCandidate EHR Snippets\n(Alt: Use Embeddings)"]
        E[Generate *fact model* for abstracting\nCandidate EHR Snippets]
        D --> F[Abstract all Candidate Snippets into\nfact model]
        E --> F
    F --> H[Summarize set of facts into\nPrepopulation Suggestions]
    end
    C --> D
    C --> E
    H --> I[End]
```

* Day 3: UX for filling forms (with auto-population assistance)


---

Discovered issues / open problems

* Processing of form text is often cut off with comments like "// additional items in same format".
