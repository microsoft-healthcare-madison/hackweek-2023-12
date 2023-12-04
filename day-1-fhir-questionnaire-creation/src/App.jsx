import React, { useEffect, useState, useContext } from "react";
import { SmartFormsRenderer, getResponse } from "@aehrc/smart-forms-renderer";
import "./App.css";
import jsonpatch from "jsonpatch";

import { generate, refine } from "./prompts/generate";

console.log(import.meta.env);

import { OpenAI } from "openai";

let client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  organization: import.meta.env.VITE_OPENAI_API_ORG,
  dangerouslyAllowBrowser: true,
});

// ActionItem Component
const ActionItem = ({ categoryName, action, onApply, onIgnore }) => {
  return (
    <div>
      <div>{action.label}</div>
      <div>{JSON.stringify(action.patch)}</div>
      <div>
        <button
          onClick={() => onApply(action, categoryName)}
        >
          Apply
        </button>
        <button
          onClick={() => onIgnore(action, categoryName)}
        >
          Ignore
        </button>
      </div>
    </div>
  );
};

// Category Component
const Category = ({ categoryName, actions, onAction }) => {
  return (
    <div>
      <h3 >
        {categoryName}
      </h3>
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
const ChatDialog = () => {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const message = event.target.message.value;
    setMessages([...messages, message]);
    event.target.reset();
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
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
      <SmartFormsRenderer questionnaire={props.questionnaire} />
    </div>
  );
};

// Main App Component
const App = () => {

  const [categories, setCategories] = useState([]);
  const [startingForm, setStartingForm] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [questionnaire, setQuestionnaire] = useState({});

  useEffect(() => {
    if (!startingForm) return;
    (async function () {
      const result = await generate(client, startingForm);
      console.log("Result", result);
      setQuestionnaire(result.json);
      const refineIdeas = await refine(client, result.json);
      setCategories(
        Object.fromEntries(
          refineIdeas.categories.map((c) => [c.title, c.suggestions])
        )
      );
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
      const newItem = jsonpatch.apply_patch(
        questionnaire.item.find((i) => i.linkId === action.linkId),
        action.patch
      );
      console.log("Applied patch", newItem);
      setQuestionnaire({
        ...questionnaire,
        item: questionnaire.item.map((i) => {
          if (action.linkId === i.linkId) {
            return newItem;
          }
          return i;
        }),
      });
      removeAction(action, categoryName);
    },
    ignore: (action, categoryName) => {
      removeAction(action, categoryName);
    },
  };

  return startingForm ? (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
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
        <ChatDialog />
      </div>
      <div style={{ flex: 1 }}>
        {/* Right Pane: Preview */}
        <Preview questionnaire={questionnaire} />
      </div>
    </div>
  ) : (
    <div>
      Welcome. Please paste some form text to start with
      <br/>
      <textarea
        onChange={function (e) {
          console.log("OC", e);
          setPastedText(e.target.value);
        }}
        value={pastedText}
      ></textarea>
      <br/>
      <button
        onClick={function (e) {
          console.log("Welcome", pastedText);
          setStartingForm(pastedText);
        }}
      >
        Begin
      </button>
    </div>
  );
};

export default App;
