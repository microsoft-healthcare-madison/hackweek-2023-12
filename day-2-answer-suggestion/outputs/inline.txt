EHR Size 22
Generating keywords
{
  and: [
    {
      or: [ "breast" ]
    }, {
      or: [ "cancer", "carcinoma", "neoplasm", "malignancy" ]
    }, {
      or: [ "stage", "staging" ]
    }, {
      or: [ "I", "1", "II", "2", "III", "3", "IV", "4", "T1", "T2", "T3", "T4", "N0", "N1", "N2", "N3", "M0", "M1" ]
    }
  ]
}
Matching chunks 1
Generating abstraction instructions
```typescript
// FactModel represents the data model for abstracting facts from EHR Data.
// Its main purpose is to record information related to the staging of breast cancer.

interface ClinicalObservation {
  date?: Date; // Observation date, should be included when possible.
  value?: string | number; // The value or description of the observation.
  code?: string; // The standardized code (e.g., LOINC, SNOMED) identifying the observation.
}

interface TumorCharacteristics {
  size?: number; // The size of the tumor in millimeters. 
  location?: string; // The specific location of the tumor within the breast.
  type?: string; // The type of tumor (e.g., Invasive Ductal Carcinoma, IDC).
}

interface LymphNodeStatus {
  numberOfNodesExamined?: number; // The number of lymph nodes examined.
  numberOfNodesInvolved?: number; // The number of lymph nodes involved with cancer.
}

interface MetastasisStatus {
  site?: string; // The site of metastasis (e.g., bone, lungs)
  dateDetected?: Date; // The date when metastasis was detected.
}

interface PathologyReport {
  tumorCharacteristics?: TumorCharacteristics;
  lymphNodeStatus?: LymphNodeStatus;
  metastasisStatus?: MetastasisStatus;
}

interface BreastCancerStage {
  stage?: string; // The overall clinical or pathological stage, if explicitly stated (e.g., Stage IIA).
  tnmClassification?: string; // The TNM classification, if provided.
}

interface FactModel {
  clinicalObservations?: ClinicalObservation[];
  pathologyReport?: PathologyReport;
  breastCancerStage?: BreastCancerStage;
  // Add other relevant interfaces here, following the same pattern.
}

// Instructions for the data abstraction team:

// 1. Identifying relevant information:
//    - Look for any observations, measurements, or notes related to breast cancer staging.
//    - Relevant data may include tumor size, lymph node involvement, the presence of metastasis, 
//      and explicit staging documentation.

// 2. Determining when to create facts:
//    - Create a FactModel instance whenever you encounter relevant data.
//    - The clinicalObservation field should be populated with individual observations related to the cancer.
//    - Use the pathologyReport field to record specific information about the tumor, lymph nodes, and metastasis.
//    - If the patient's medical record includes an explicit cancer stage, use the breastCancerStage field.
//    - If any elements are missing from the EHR at the time of abstraction, leave them undefined (hence their optional nature).

// 3. Discarding irrelevant data:
//    - If the data does not pertain to breast cancer staging, it is likely not relevant to the clinical question and should be omitted.
//    - Avoid duplication of information by ensuring each fact is recorded once.

// Additional Context:
//    - This model assumes a team working on discrete chunks of EHR data per patient, focusing on breast cancer staging facts.
//    - Aggregation will occur downstream, so facts should be recorded as atomic elements without concern for summarization.
//    - Monotonic aggregation means that the team should not remove or alter facts once they are recorded.
```

**Note:** The model presented here abstracts relevant information from EHR for the purpose of determining the stage of breast cancer found in a patient. Since each element is optional, this model allows for partial information and accommodates the incremental addition of data as it becomes available. The team should be aware that EHR data is often fragmented and may require synthesis from multiple sources within the record.
Abstracting into FactModel[]
Total fact count 1
All Facts [
  {
    pathologyReport: {
      tumorCharacteristics: {
        size: 20,
        type: "Invasive Ductal Carcinoma"
      },
      lymphNodeStatus: {
        numberOfNodesExamined: 0,
        numberOfNodesInvolved: 0
      },
      metastasisStatus: {
        site: ""
      }
    },
    breastCancerStage: {
      tnmClassification: "T2N0M0"
    },
    clinicalObservations: [
      {
        date: "2023-11-15",
        value: "Palpable lump in the right breast",
        code: ""
      }, {
        date: "2023-11-15",
        value: "ER Positive",
        code: ""
      }, {
        date: "2023-11-15",
        value: "PR Positive",
        code: ""
      }, {
        date: "2023-11-15",
        value: "HER2/neu Negative",
        code: ""
      }
    ]
  }
]
Generating final answer to question
{
  linkId: "breastCancerStage",
  definition: "http://hl7.org/fhir/StructureDefinition/oncology-BreastCancerStage",
  text: "What stage breast cancer was found?",
  answer: [
    {
      valueString: "Stage II"
    }
  ]
}
