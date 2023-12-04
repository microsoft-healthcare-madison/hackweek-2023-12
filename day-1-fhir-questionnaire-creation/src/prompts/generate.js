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
    const messages = [
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
            model: "gpt-3.5-turbo-1106",
            temperature: 1.0,
            response_format: {type:'json_object'},
            messages
        });

        initialJson = JSON.parse(response.choices[0].message.content);
        validationResponse = await validate(initialJson);
        attempts++
        messages.push({role: "user", content: `Here is the validation result for that resoure:
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

Please ouptut 3 categories of things I can improve in this questionnaire, with 2+
suggestions in each category. Here are some ideas about where to start:

* Wording / language / clarity / inclusiveness
* Missing items we should ask about
* Logic like enableWhen that we should include

But use your own judgment to come up with categories based on the content you observe.

Your response is a JSON object following this Response interface

interface Response {
    categories: {
        shortTitle: string,
        suggestions: {
            text: string,
            type: "AddItem" |  "EditItemText",
            itemLinkId: string.
            itemText: string?
        }[]
    }[]
}
Respond with a JSON Response object.`
      },
    ]
        let response = await client.chat.completions.create({
            model: 'gpt-4-1106-preview',
            temperature: 1.0,
            response_format: {type:'json_object'},
            messages
        });

        let ideas = JSON.parse(response.choices[0].message.content);
        console.log("IDEAS", ideas)

    return ideas 
}

