import React, { useEffect, useState, useContext } from "react";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import DownloadIcon from "@mui/icons-material/Download";
import { SmartFormsRenderer, getResponse } from "@aehrc/smart-forms-renderer";
import "./App.css";
import jsonpatch from "jsonpatch";
import { setExtensionStringValue } from "fhir-extension-helpers";
import { structuredDataCapture } from "fhir-sdc-helpers";

import HackweekLogo from "./assets/HackweekLogo.png";
import { generate, refine, loadQuestionnaireFromUrl } from "./prompts/generate";
import { GenerateSuggestedAnswer } from "./prompts/generate-answer";
import {
  PatchQuestionnaire,
  PatchQuestionnaireResponse,
  findItem,
} from "./prompts/questionnaire-helpers";

// console.log(import.meta.env);

import { OpenAI } from "openai";

let client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  organization: import.meta.env.VITE_OPENAI_API_ORG,
  dangerouslyAllowBrowser: true,
});

function qrParsed(qrJsonText) {
  try {
    return JSON.parse(qrJsonText);
  } catch (err) {
    console.log(err);
  }
}

// ActionItem Component
const ActionItem = ({ categoryName, action, onApply, onIgnore }) => {
  return (
    <div className="action-item">
      <div>{action.label}</div>
      <div>
        <button
          onClick={() => onApply(action, categoryName)}
          className="px-2 py-1 mr-1 bg-green-500 text-white rounded"
        >
          Apply
        </button>
        <button
          onClick={() => onIgnore(action, categoryName)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Ignore
        </button>
      </div>
      <div className="action-patch">{JSON.stringify(action.patch)}</div>
    </div>
  );
};

// Category Component
const Category = ({ categoryName, actions, onAction }) => {
  return (
    <div className="action-category">
      <h3>{categoryName}</h3>
      {actions.map((action, index) => (
        <ActionItem
          key={index}
          action={action}
          categoryName={categoryName}
          onApply={onAction.apply}
          onIgnore={onAction.ignore}
        />
      ))}
    </div>
  );
};

// ChatDialog Component
const ChatDialog = ({ generatingForm, itemWithFocus }) => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const message = event.target.message.value;
    setMessages([...messages, message]);
    event.target.reset();
  };

  return (
    <div className="messages">
      <div>
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg}
          </div>
        ))}
      </div>
      {generatingForm ? <LinearProgress /> : <span />}
      <form onSubmit={handleSendMessage}>
        {itemWithFocus ? (
          <div className="message">
            <span className="message-title">Focus:</span>{" "}
            <span className="message-content">{itemWithFocus.text}</span>
          </div>
        ) : (
          <span />
        )}
        <input
          className="message"
          type="text"
          name="message"
          placeholder="Type your message here..."
        />
      </form>
    </div>
  );
};

// Preview Component
const Preview = (props) => {
  return (
    <div id="formcontainer">
      <SmartFormsRenderer
        onFocus={props.onFocus}
        questionnaire={props.questionnaire}
        questionnaireResponse={props.questionnaireResponse}
      />
    </div>
  );
};

// Main App Component
const App = () => {
  const [categories, setCategories] = useState([]);

  const [generatingForm, setGeneratingForm] = useState(false);
  const [generationMsg, setGenerationMsg] = useState(null);
  const [startingForm, setStartingForm] = useState(null);
  const [loadQuestionnaireUrl, setLoadQuestionnaireUrl] = useState(
    "https://fhir.forms-lab.com/Questionnaire/ips-prepop6"
  );
  const [pastedText, setPastedText] = useState(
    `Basic Demographics
  Patient name
  DOB
  Address
  Phone numbers
Contacts
  Name
  Phone Number
  Address
`
  );
  const [questionnaire, setQuestionnaire] = useState({});
  const [questionnaireResponse, setQuestionnaireResponse] = useState("");
  const [questionnaireResponseJson, setQuestionnaireResponseJson] =
    useState("");
  const [itemWithFocus, setItemWithFocus] = useState(null);
  const [generatedAnswers, setGeneratedAnswers] = useState([]);

  async function generateSuggestions(linkId) {
    if (itemWithFocus?.linkId == linkId) {
      // item already has focus, so don't re-fire the generation
      return;
    }
    const itemDef = findItem(questionnaire.item, linkId);
    setItemWithFocus(itemDef);

    const qr = getResponse();
    // if we have some form of suggestion, make it then update it
    let existingAnswer = findItem(qr.item, linkId);

    if (generatedAnswers.indexOf(linkId) >= 0 && existingAnswer?.answer) {
      console.log("Already generated suggestions for:", linkId);
      return;
    }

    console.log("Look for suggestions to:", linkId);
    setGeneratingForm(true);
    setGenerationMsg(
      "Reviewing patient data for " +
        (structuredDataCapture?.getShortTextExtension(itemDef) ??
          itemDef.text) +
        " ..."
    );
    const newAnswer = await GenerateSuggestedAnswer(
      questionnaire,
      qr,
      existingAnswer,
      linkId
    );
    setExtensionStringValue(
      newAnswer,
      "http://fhir.fhirpath-lab.com/StructureDefinition/ai-generated-answer",
      newAnswer.answer[0].valueString
    );

    if (newAnswer) {
      //if (existingAnswer) {
      const qrLatest = getResponse();
      const result = PatchQuestionnaireResponse(
        questionnaire,
        qrLatest,
        newAnswer
      );
      //}
      // patch in the answer into the response
      setQuestionnaireResponseJson(JSON.stringify(result, null, 2));

      let existingAnswers = generatedAnswers;
      existingAnswers.push(linkId);
      setGeneratedAnswers(existingAnswers);
    }
    setGeneratingForm(false);
    setGenerationMsg("");
  }

  useEffect(() => {
    if (!startingForm) return;
    (async function () {
      setGeneratingForm(true);
      const result = await generate(client, startingForm, (message) => {
        setGenerationMsg(message);
      });
      console.log("Result", result);
      setQuestionnaire(result.json);
      const refineIdeas = await refine(client, result.json, (message) => {
        setGenerationMsg(message);
      });
      setCategories(
        Object.fromEntries(
          refineIdeas.categories.map((c) => [c.title, c.suggestions])
        )
      );
      setGenerationMsg(null);
      setGeneratingForm(false);
    })();
  }, [startingForm]);

  function removeAction(action, categoryName) {
    setCategories({
      ...categories,
      [categoryName]: categories[categoryName].filter((a) => a !== action),
    });
  }

  const handleAction = {
    apply: (action, categoryName) => {
      console.log("Action", action);
      let itemToPatch = findItem(questionnaire.item, action.linkId);
      if (itemToPatch) {
        const newItem = jsonpatch.apply_patch(itemToPatch, action.patch);
        console.log("Applied patch", newItem);
        setQuestionnaire(PatchQuestionnaire(questionnaire, newItem));
        removeAction(action, categoryName);
      } else {
        setGenerationMsg("No item found for linkId: " + action.linkId);
        console.log("No item found for linkId", action.linkId);
      }
    },
    ignore: (action, categoryName) => {
      removeAction(action, categoryName);
    },
  };

  return questionnaire.resourceType ? (
    <div className="tri-pane-display">
      <div style={{ flex: 1 }}>
        {/* Left Pane: Categories and Actions */}
        {Object.entries(categories).map(([categoryName, actions], index) => (
          <Category
            key={index}
            categoryName={categoryName}
            actions={actions}
            onAction={handleAction}
          />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        {/* Center Pane: Chat Dialog */}
        <span className="generation-message">{generationMsg}</span>
        <ChatDialog
          generatingForm={generatingForm}
          itemWithFocus={itemWithFocus}
        />
        {/* <TextField
        multiline
        fullWidth
        minRows={5}
        maxRows={15}
        disabled
        value={JSON.stringify(questionnaire, null, 2)} /> */}
        <button
          onClick={function (e) {
            const qr = questionnaireResponseJson;
            try {
              setQuestionnaireResponse(JSON.parse(qr));
            } catch (err) {
              console.log(err);
            }
          }}
        >
          Update answers
        </button>
        <button
          onClick={function (e) {
            const qr = getResponse();
            console.log("Welcome", qr);
            setQuestionnaireResponseJson(JSON.stringify(qr, null, 2));
          }}
        >
          Get entered form data so far
        </button>
        <TextField
          multiline
          fullWidth
          rows={30}
          value={questionnaireResponseJson}
          onChange={(event) => {
            setQuestionnaireResponseJson(event.target.value);
          }}
        />
      </div>
      <div style={{ flex: 1 }} className="preview-pane">
        {/* Right Pane: Preview */}
        <Preview
          onFocus={(linkId) => {
            generateSuggestions(linkId);
          }}
          questionnaire={questionnaire}
          questionnaireResponse={questionnaireResponse}
        />
      </div>
    </div>
  ) : (
    <div className="welcome-page">
      <img className="hackweek-logo" src={HackweekLogo} />
      <div>
        <h2>Hackweek 2023</h2>
        Welcome. Please paste/enter a form in a text format to generate a<br />{" "}
        FHIR Questionnaire using OpenAI's GPT4...
        <br />
        <TextField
          multiline
          fullWidth
          size="small"
          minRows={10}
          maxRows={30}
          onChange={function (e) {
            setPastedText(e.target.value);
          }}
          value={pastedText}
          variant="outlined"
        ></TextField>
        <p className="generateButton">
          <button
            onClick={function (e) {
              console.log("Welcome", pastedText);
              setStartingForm(pastedText);
            }}
          >
            Generate form
          </button>
          <span className="generation-message">{generationMsg}</span>
        </p>
        {generatingForm ? <LinearProgress /> : <span />}
        <TextField
          fullWidth
          label="Load Questionnaire URL"
          variant="standard"
          helperText="Enter a URL to load an existing questionnaire definition from a server"
          onChange={function (e) {
            // console.log("OC", e);
            setLoadQuestionnaireUrl(e.target.value);
          }}
          value={loadQuestionnaireUrl}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={async function (e) {
                    setGeneratingForm(true);
                    setGenerationMsg("Loading questionnaire...");
                    console.log(
                      "Load questionnaire definition from: ",
                      loadQuestionnaireUrl
                    );
                    const loadedQuestionnaire = await loadQuestionnaireFromUrl(
                      loadQuestionnaireUrl
                    );
                    console.log("Loaded questionnaire", loadedQuestionnaire);
                    setQuestionnaire(loadedQuestionnaire);

                    // Grab the initial content from the form (generated by the renderer)
                    // (not pre-populated content)
                    const qr = getResponse();
                    // console.log("Welcome", qr);
                    setQuestionnaireResponseJson(JSON.stringify(qr, null, 2));

                    // Generate suggestions
                    // const refineIdeas = await refine(client, loadedQuestionnaire, (message) => {
                    //   setGenerationMsg(message);
                    // });
                    // setCategories(
                    //   Object.fromEntries(
                    //     refineIdeas.categories.map((c) => [
                    //       c.title,
                    //       c.suggestions,
                    //     ])
                    //   )
                    // );
                    setGenerationMsg(null);
                    setGeneratingForm(false);
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        ></TextField>
      </div>
    </div>
  );
};

export default App;
