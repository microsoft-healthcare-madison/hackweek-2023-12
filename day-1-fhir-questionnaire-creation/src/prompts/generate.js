import { OpenAI } from "openai";
const schema = `{
  "resourceType" : "Questionnaire",
  // from Resource: id, meta, implicitRules, and language
  // from DomainResource: text, contained, extension, and modifierExtension
  "url" : "<uri>", // Canonical identifier for this questionnaire, represented as an absolute URI (globally unique)
  "identifier" : [{ Identifier }], // Business identifier for questionnaire
  "version" : "<string>", // Business version of the questionnaire
  // versionAlgorithm[x]: How to compare versions. One of these 2:
  "versionAlgorithmString" : "<string>",
  "versionAlgorithmCoding" : { Coding },
  "name" : "<string>", // I Name for this questionnaire (computer friendly)
  "title" : "<string>", // Name for this questionnaire (human friendly)
  "derivedFrom" : ["<canonical(Questionnaire)>"], // Based on Questionnaire
  "status" : "<code>", // I R!  draft | active | retired | unknown
  "experimental" : <boolean>, // For testing purposes, not real usage
  "subjectType" : ["<code>"], // Resource that can be subject of QuestionnaireResponse
  "date" : "<dateTime>", // Date last changed
  "publisher" : "<string>", // Name of the publisher/steward (organization or individual)
  "contact" : [{ ContactDetail }], // Contact details for the publisher
  "description" : "<markdown>", // Natural language description of the questionnaire
  "useContext" : [{ UsageContext }], // The context that the content is intended to support
  "jurisdiction" : [{ CodeableConcept }], // Intended jurisdiction for questionnaire (if applicable)
  "purpose" : "<markdown>", // Why this questionnaire is defined
  "copyright" : "<markdown>", // Use and/or publishing restrictions
  "copyrightLabel" : "<string>", // Copyright holder and year(s)
  "approvalDate" : "<date>", // When the questionnaire was approved by publisher
  "lastReviewDate" : "<date>", // When the questionnaire was last reviewed by the publisher
  "effectivePeriod" : { Period }, // When the questionnaire is expected to be used
  "code" : [{ Coding }], // Concept that represents the overall questionnaire
  "item" : [{ // Questions and sections within the Questionnaire
    "linkId" : "<string>", // I R!  Unique id for item in questionnaire
    "definition" : "<uri>", // ElementDefinition - details for the item
    "code" : [{ Coding }], // I Corresponding concept for this item in a terminology
    "prefix" : "<string>", // E.g. "1(a)", "2.5.3"
    "text" : "<string>", // Primary text for the item
    "type" : "<code>", // I R!  group | display | boolean | decimal | integer | date | dateTime +
    "enableWhen" : [{ // I Only allow data when
      "question" : "<string>", // R!  The linkId of question that determines whether item is enabled/disabled
      "operator" : "<code>", // I R!  exists | = | != | > | < | >= | <=
      // answer[x]: Value for question comparison based on operator. One of these 10:
      "answerBoolean" : <boolean>,
      "answerDecimal" : <decimal>,
      "answerInteger" : <integer>,
      "answerDate" : "<date>",
      "answerDateTime" : "<dateTime>",
      "answerTime" : "<time>",
      "answerString" : "<string>",
      "answerCoding" : { Coding },
      "answerQuantity" : { Quantity },
      "answerReference" : { Reference(Any) }
    }],
    "enableBehavior" : "<code>", // I all | any
    "disabledDisplay" : "<code>", // hidden | protected
    "required" : <boolean>, // I Whether the item must be included in data results
    "repeats" : <boolean>, // I Whether the item may repeat
    "readOnly" : <boolean>, // I Don't allow human editing
    "maxLength" : <integer>, // I No more than these many characters
    "answerConstraint" : "<code>", // I optionsOnly | optionsOrType | optionsOrString
    "answerValueSet" : "<canonical(ValueSet)>", // I ValueSet containing permitted answers
    "answerOption" : [{ // I Permitted answer
      // value[x]: Answer value. One of these 6:
      "valueInteger" : <integer>,
      "valueDate" : "<date>",
      "valueTime" : "<time>",
      "valueString" : "<string>",
      "valueCoding" : { Coding },
      "valueReference" : { Reference(Any) },
      "initialSelected" : <boolean> // Whether option is selected by default
    }],
    "initial" : [{ // I Initial value(s) when item is first rendered
      // value[x]: Actual value for initializing the question. One of these 12:
      "valueBoolean" : <boolean>,
      "valueDecimal" : <decimal>,
      "valueInteger" : <integer>,
      "valueDate" : "<date>",
      "valueDateTime" : "<dateTime>",
      "valueTime" : "<time>",
      "valueString" : "<string>",
      "valueUri" : "<uri>",
      "valueAttachment" : { Attachment },
      "valueCoding" : { Coding },
      "valueQuantity" : { Quantity },
      "valueReference" : { Reference(Any) }
    }],
    "item" : [{ Content as for Questionnaire.item }] // Nested questionnaire items
  }]
}`
/**
 *
 * @param {OpenAI} client
 * @param {string} formText
 */
export async function generate(client, formText) {
    if (false) return {json: {"resourceType":"Questionnaire","id":"personalCharacteristics","title":"Personal Characteristics","status":"active","subjectType":["Patient"],"date":"2023-04-01","item":[{"linkId":"1","text":"Are you Hispanic or Latino?","type":"choice","required":false,"repeats":false,"answerOption":[{"valueString":"Yes"},{"valueString":"No"},{"valueString":"I choose not to answer this question"}]},{"linkId":"2","text":"Which race(s) are you? Check all that apply","type":"choice","required":false,"repeats":true,"answerOption":[{"valueString":"Asian"},{"valueString":"Native Hawaiian"},{"valueString":"Pacific Islander"},{"valueString":"Black/African American"},{"valueString":"White"},{"valueString":"American Indian/Alaskan Native"},{"valueString":"Other"},{"valueString":"I choose not to answer this question"}]},{"linkId":"3","text":"At any point in the past 2 years, has season or migrant farm work been your or your family's main source of income?","type":"choice","required":false,"repeats":false,"answerOption":[{"valueString":"Yes"},{"valueString":"No"},{"valueString":"I choose not to answer this question"}]},{"linkId":"4","text":"Have you been discharged from the armed forces of the United States?","type":"choice","required":false,"repeats":false,"answerOption":[{"valueString":"Yes"},{"valueString":"No"},{"valueString":"I choose not to answer this question"}]},{"linkId":"5","text":"What language are you most comfortable speaking?","type":"string","required":false,"repeats":false},{"linkId":"6","text":"How many family members, including yourself, do you currently live with?","type":"integer","required":false,"repeats":false},{"linkId":"7","text":"What is your housing situation today?","type":"choice","required":false,"repeats":false,"answerOption":[{"valueString":"I have housing"},{"valueString":"I do not have housing (staying with others, in a hotel, in a shelter, living outside on the street, on a beach, in a car, or in a park)"},{"valueString":"I choose not to answer this question"}]}]}}
    let messages = [
    {
        role: "system",
        content:
          `You are a clinical informatics assistant familiar with FHIR. You know the full Questionnaire data model:
${schema}
`,
      },
      {
        role: "user",
        content: `Please turn the following free-text form into a FHIR Questionnaire.
        
* Do not invent "Codings"; just use strings if there is no specified standardized code
* Populate linkIds enableWhen, etc.
* Do not invent placeholder data.
* Always set "repeats" for questions that allow more than one answer

${"```"}
${formText}
${"```"}

Respond with a FHIR JSON Questionnaire object.`
      },
    ]

    let validationResponse;
    const MAX_ATTEMPTS = 3;
    let attempts = 0;
    let initialJson;
    do {
        let response = await client.chat.completions.create({
            // model: "gpt-4-1106-preview",
             model: "gpt-3.5-turbo-1106",
            temperature: 1.0,
            response_format: {type:'json_object'},
            messages
        });
        initialJson = JSON.parse(response.choices[0].message.content);
        validationResponse = await validate(initialJson);
        if (attempts > 0) {
            messages = messages.slice(0, -2)
        }
        attempts++
        messages.push({role: "system", content: JSON.stringify(initialJson)})
        messages.push({role: "user", content: `Here is the validation result for your resoure:
${"```json"}
${JSON.stringify(validationResponse, null, 2)}
${"```"}

Please fix any errors.
`})
        console.log("Attempt", attempts, initialJson)
        console.log(validationResponse)
    } while (attempts < MAX_ATTEMPTS && validationResponse.issue.some(i => ["fatal", "error"].includes(i.severity)))

    return  {
        validation: validationResponse,
        json: initialJson
    }
}

async function validate(r) {
    const result = await fetch('https://hapi.fhir.org/baseR4/Questionnaire/$validate', {
        method: 'POST',
        headers: {
            "content-type": "application/json+fhir",
            "accept": "application/json+fhir"
        },
        body: JSON.stringify(r)
    })

    const resultJson = await result.json()
    delete resultJson.text
    resultJson.issue = resultJson.issue.filter(i => !i.diagnostics.match("dom-6"))
    return resultJson
}
/**
 *
 * @param {OpenAI} client
 * @param {string} formText
 */

export async function refine(client, questionnaire) {
    console.log("Refining", questionnaire.item)
    if (false) return {categories: [
    {
        "title": "Inclusive Language",
        "suggestions": [
            {
                "label": "Clarify 'Hispanic or Latino'",
                "linkId": "1",
                "patch": [
                    {
                        "op": "replace",
                        "path": "/text",
                        "value": "Do you identify as Hispanic, Latino/a, or of Spanish origin?"
                    }
                ]
            },
            {
                "label": "Add 'Decline to State' option",
                "linkId": "2",
                "patch": [
                    {
                        "op": "replace",
                        "path": "/answerOption/7/valueString",
                        "value": "Decline to State"
                    }
                ]
            },
            {
                "label": "Revise 'Discharged from armed forces' text",
                "linkId": "4",
                "patch": [
                    {
                        "op": "replace",
                        "path": "/text",
                        "value": "Have you served in the armed forces of the United States?"
                    }
                ]
            }
        ]
    },
    {
        "title": "Ambiguous Language",
        "suggestions": [
            {
                "label": "Define 'family member'",
                "linkId": "6",
                "patch": [
                    {
                        "op": "add",
                        "path": "/text",
                        "value": "How many individuals, including yourself, do you currently live with? Please include those you consider family members."
                    }
                ]
            },
            {
                "label": "Clarify 'I have housing'",
                "linkId": "7",
                "patch": [
                    {
                        "op": "replace",
                        "path": "/answerOption/0/valueString",
                        "value": "I have stable housing"
                    }
                ]
            },
            {
                "label": "Detail 'I do not have housing' options",
                "linkId": "7",
                "patch": [
                    {
                        "op": "replace",
                        "path": "/answerOption/1/valueString",
                        "value": "I do not have stable housing (e.g., staying with others, in a hotel, in a shelter, living outside)"
                    }
                ]
            }
        ]
    },
    {
        "title": "Missing Questions",
        "suggestions": [
            {
                "label": "Add 'Gender Identity' question",
                "linkId": "end",
                "patch": [
                    {
                        "op": "add",
                        "path": "/-",
                        "value": {
                            "linkId": "8",
                            "text": "What is your gender identity?",
                            "type": "choice",
                            "required": false,
                            "repeats": false,
                            "answerOption": [
                                {
                                    "valueString": "Male"
                                },
                                {
                                    "valueString": "Female"
                                },
                                {
                                    "valueString": "Transgender"
                                },
                                {
                                    "valueString": "Non-Binary"
                                },
                                {
                                    "valueString": "Prefer to self-describe:_____"
                                },
                                {
                                    "valueString": "Prefer not to say"
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "label": "Add 'Sexual Orientation' question",
                "linkId": "end",
                "patch": [
                    {
                        "op": "add",
                        "path": "/-",
                        "value": {
                            "linkId": "9",
                            "text": "What is your sexual orientation?",
                            "type": "choice",
                            "required": false,
                            "repeats": false,
                            "answerOption": [
                                {
                                    "valueString": "Heterosexual (straight)"
                                },
                                {
                                    "valueString": "Homosexual (gay or lesbian)"
                                },
                                {
                                    "valueString": "Bisexual"
                                },
                                {
                                    "valueString": "Other"
                                },
                                {
                                    "valueString": "Prefer not to say"
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "label": "Add 'Disability Status' question",
                "linkId": "end",
                "patch": [
                    {
                        "op": "add",
                        "path": "/-",
                        "value": {
                            "linkId": "10",
                            "text": "Do you consider yourself to have a disability?",
                            "type": "choice",
                            "required": false,
                            "repeats": false,
                            "answerOption": [
                                {
                                    "valueString": "Yes"
                                },
                                {
                                    "valueString": "No"
                                },
                                {
                                    "valueString": "Prefer not to say"
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    }
]}
    const messages = [
    {
        role: "system",
        content:
          `You are a clinical informatics assistant familiar with FHIR. You know the Questionnaire resource is ${schema}`,
      },
      {
        role: "user",
        content: `I have a draft of a FHIR Questionnaire Items Array:
${"```"}
${JSON.stringify(questionnaire.item, null, 2)}
${"```"}

Now output any high-impact suggestions you might have for the following
categories:

* Inclusive Language
* Ambiguous Language
* Other

The suggestions within each category need to be specific. Each will have a user-facing label that explains the full change, and a JSON Patch expression that implements the suggestion.

Your response is a JSON object following this Response interface

interface Response {
    categories: {
        title: string, // Very short category label
        suggestions: { // each suggestion can only patch a single existing Questionnaire Item
            label: string, // brief user-facing label for this suggestion that describes the full change. User will make decisions based on this
            linkId: string, // which item to modify
            patch: { // applies directly to the item with the linkId specified
                op: "add" | "remove" | "replace",
                path?: string, // path within the item
                value?: string
            }[] // RFC6902 JSON Patch array, patching the item with the specified linkId
        }[]
    }[]
}

Respond with a JSON Response object.`
      },
    ]
        let response = await client.chat.completions.create({
            // model: 'gpt-4-1106-preview',
            model: "gpt-3.5-turbo-1106",
            temperature: 1.0,
            response_format: {type:'json_object'},
            messages
        });

        let ideas = JSON.parse(response.choices[0].message.content);
        console.log("IDEAS", ideas)

    return ideas 
}

