```sh
bun run --watch src/index.ts \
  --patient sample-patient-1/ \
  --question "Provide all details necessary to determine the patient's breast cancer stage"
```

EHR Size 23

Generating keywords

```js
{
  and: [
    {
      or: [ "breast cancer", "malignant neoplasm of breast", "carcinoma of breast" ]
    }, {
      or: [ "tumor size", "TNM", "lymph node status", "metastasis", "grade", "ER status", "PR status", "HER2/neu status",
        "molecular subtype", "oncotype DX", {
          and: [
            {
              or: [ "estrogen", "progesterone" ]
            }, {
              or: [ "receptor", "status", "positive", "negative" ]
            }
          ]
        }, {
          and: [ "HER2", {
              or: [ "status", "positive", "negative", "equivocal", "overexpression", "amplification"
              ]
            } ]
        }, {
          or: [ "biopsy", "imaging", "mammogram", "ultrasound", "MRI", "CT scan", "PET scan" ]
        }, {
          or: [ "lymphadenopathy", {
              and: [ "axillary", "lymph", "nodes" ]
            }, "sentinel node biopsy", "lymph node dissection"
          ]
        }, {
          or: [
            {
              and: [ "distant", "metastases" ]
            }, "metastatic sites", {
              and: [ "bone", "metastas" ]
            }, {
              and: [ "brain", "metastas" ]
            }, {
              and: [ "liver", "metastas" ]
            }, {
              and: [ "lung", "metastas" ]
            }
          ]
        } ]
    }
  ]
}
```

Matching chunks 1
Generating abstraction instructions

```typescript
// Define basic primitives that we would expect across different facts
type ISODateString = string; // e.g., "2021-03-14"
type NumericRange = { low: number; high?: number };

// Interfaces for different possible observations and facts related to breast cancer staging
interface TumorSize {
  type: "TumorSize";
  size: NumericRange; // tumor size in millimeters
  dateObserved?: ISODateString;
}

interface LymphNodeInvolvement {
  type: "LymphNodeInvolvement";
  numberOfNodes: number; // number of lymph nodes involved
  dateObserved?: ISODateString;
}

interface Metastasis {
  type: "Metastasis";
  present: boolean; // presence of distant metastasis
  dateObserved?: ISODateString;
}

interface ERStatus {
  type: "ERStatus";
  status: "Positive" | "Negative"; // estrogen receptor status
  dateObserved?: ISODateString;
}

interface PRStatus {
  type: "PRStatus";
  status: "Positive" | "Negative"; // progesterone receptor status
  dateObserved?: ISODateString;
}

interface HER2Status {
  type: "HER2Status";
  status: "Positive" | "Negative" | "Equivocal"; // HER2/neu receptor status
  dateObserved?: ISODateString;
}

interface BiopsyResult {
  type: "BiopsyResult";
  histology: string; // histological type of breast cancer
  grade: number; // tumor grade
  dateObserved?: ISODateString;
}

// Disjoint union of fact type interfaces
type FactModel = TumorSize | LymphNodeInvolvement | Metastasis | ERStatus | PRStatus | HER2Status | BiopsyResult;

// Example FactModel array for a patient's data chunk:
// const patientFacts: FactModel[] = [...];
```

### Instructions for the Data Abstraction Team

When reviewing plain text EHR data, the team is tasked with extracting facts relevant to determining a patient's breast cancer stage. Each fact extracted should be represented by an instance of one of the interfaces above, collectively forming an array of type `FactModel[]`.

#### Identifying Relevant Information

1. **Tumor Size**: Look for mentions of tumor measurements. Record the smallest and largest dimension if a range is given, or the single measurement if not, with the associated date if available.
   
2. **Lymph Node Involvement**: Identify any numerical data related to lymph nodes affected by cancer. The number of nodes and date of observation are important.

3. **Metastasis**: Search for discussions of scans or tests that indicate the presence or absence of cancer spread beyond the breast and regional lymph nodes.

4. **ER Status**: Note any references to estrogen receptor tests. These may be recorded as "ER positive/negative".

5. **PR Status**: Similarly, look for progesterone receptor test results, recorded as "PR positive/negative".

6. **HER2 Status**: Extract information on HER2/neu status, which may be indicated as "HER2 positive/negative/equivocal".

7. **Biopsy Result**: If a pathology report is present, collect details on histological type and grade of cancer.

#### Determining When to Create Facts

- Create a new fact when you encounter clearly documented, unambiguous data that corresponds to one of the interfaces.
- A fact instance should be created even if only partial information is available; fill in as much as possible.
- If a date is not explicitly associated with an observation, do not fabricate one. Leave the `dateObserved` field unset.
- If the information is ambiguous or requires inference beyond simple extraction, consult a supervisor before creating a fact.
- Do not create duplicate facts. If the same information appears in multiple places, create only one instance unless the information has been updated or changed.
  
#### Discarding Irrelevant Data

- If data does not clearly relate to one of the interfaces or is not related to breast cancer staging, it should not be abstracted.
- Irrelevant information might include other medical conditions, treatments not related to breast cancer, or administrative details.
- When in doubt about the relevance of a piece of information, seek clarification from a supervisor.

It is crucial for the abstraction team to be thorough and precise, ensuring that the data populating the database enables an accurate determination of breast cancer stage. Each fact contributes to a more complete picture of the patient's condition.

----

Abstracting into FactModel[]
Total fact count 7
All Facts

```js
[
  {
    type: "TumorSize",
    size: {
      low: 20
    },
    dateObserved: "2023-11-15"
  }, {
    type: "LymphNodeInvolvement",
    numberOfNodes: 0,
    dateObserved: "2023-11-15"
  }, {
    type: "Metastasis",
    present: false,
    dateObserved: "2023-11-15"
  }, {
    type: "ERStatus",
    status: "Positive",
    dateObserved: "2023-11-15"
  }, {
    type: "PRStatus",
    status: "Positive",
    dateObserved: "2023-11-15"
  }, {
    type: "HER2Status",
    status: "Negative",
    dateObserved: "2023-11-15"
  }, {
    type: "BiopsyResult",
    histology: "invasive ductal carcinoma",
    grade: 2,
    dateObserved: "2023-11-15"
  }
]
```

Generating final answer to question

```js
{      
  linkId: "1",
  text: "Patient's Breast Cancer Stage",
  item: [
    {
      linkId: "1.1",
      text: "Tumor Size",
      answer: [
        {
          valueQuantity: {
            value: 20,
            unit: "mm",
            system: "http://unitsofmeasure.org",
            code: "mm"
          }
        }
      ]
    }, {
      linkId: "1.2",
      text: "Lymph Node Involvement",
      answer: [
        {
          valueInteger: 0
        }
      ]
    }, {
      linkId: "1.3",
      text: "Metastasis",
      answer: [
        {
          valueBoolean: false
        }
      ]
    }, {
      linkId: "1.4",
      text: "ER Status",
      answer: [
        {
          valueString: "Positive"
        }
      ]
    }, {
      linkId: "1.5",
      text: "PR Status",
      answer: [
        {
          valueString: "Positive"
        }
      ]
    }, {
      linkId: "1.6",
      text: "HER2 Status",
      answer: [
        {
          valueString: "Negative"
        }
      ]
    }, {
      linkId: "1.7",
      text: "Histology",
      answer: [
        {
          valueString: "invasive ductal carcinoma"
        }
      ]
    }, {
      linkId: "1.8",
      text: "Grade",
      answer: [
        {
          valueInteger: 2
        }
      ]
    }
  ]
}
```
