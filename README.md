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

* Day 3: UX for filling forms (with auto-population assistance)
