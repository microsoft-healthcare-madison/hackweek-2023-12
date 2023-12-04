import React, { useEffect, useState, useContext } from 'react';
import { SmartFormsRenderer, getResponse } from '@aehrc/smart-forms-renderer';
import './App.css'


import generate from './prompts/generate'

console.log(import.meta.env)

import { OpenAI } from "openai";

let client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  organization: import.meta.env.VITE_OPENAI_API_ORG,
  dangerouslyAllowBrowser: true
})

// ActionItem Component
const ActionItem = ({ action, onApply, onAdjust, onIgnore }) => {
    return (
        <div className="flex items-center justify-between p-2 border-b">
            <div>{action.name}</div>
            <div>
                <button onClick={() => onApply(action)} className="px-2 py-1 mr-1 bg-green-500 text-white rounded">Apply</button>
                <button onClick={() => onAdjust(action)} className="px-2 py-1 mr-1 bg-blue-500 text-white rounded">Adjust</button>
                <button onClick={() => onIgnore(action)} className="px-2 py-1 bg-red-500 text-white rounded">Ignore</button>
            </div>
        </div>
    );
};

// Category Component
const Category = ({ categoryName, actions, onAction }) => {
    return (
        <div className="mb-4">
            <h3 className="px-2 py-1 text-lg font-semibold bg-gray-200">{categoryName}</h3>
            {actions.map((action, index) => (
                <ActionItem
                    key={index}
                    action={action}
                    onApply={onAction.apply}
                    onAdjust={onAction.adjust}
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
        <div className="p-4 border-l border-r">
            <div className="mb-4 h-5/6 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className="p-2 bg-gray-100 my-2 rounded">{msg}</div>
                ))}
            </div>
            <form onSubmit={handleSendMessage}>
                <input type="text" name="message" className="p-2 border w-full rounded" placeholder="Type your message here..." />
            </form>
        </div>
    );
};

// Preview Component
const Preview = (props) => {
    return (
        <div id="formcontainer" className="p-4 bg-gray-100 h-full">
         <SmartFormsRenderer questionnaire={props.questionnaire}/>
        </div>
    );
};

// Main App Component
const App = () => {
    // Sample categories and actions
    const categories = {
        "Category 1": [{ name: "Action 1.1" }, { name: "Action 1.2" }],
        "Category 2": [{ name: "Action 2.1" }, { name: "Action 2.2" }]
    };

    const [welcome, setWelcome] = useState("Welcome Message...")
    const [startingForm, setStartingForm] = useState(null);
    const [pastedText, setPastedText] = useState("");
    const [questionnaire, setQuestionnaire] = useState({})


    useEffect(()=>{
        if (!startingForm) return;
      (async function(){
        const result = await  generate(client, startingForm);
        console.log("Result", result)
        setQuestionnaire(result.json)
       })()
    
    }, [startingForm])

    const handleAction = {
        apply: (action) => console.log("Apply", action),
        adjust: (action) => console.log("Adjust", action),
        ignore: (action) => console.log("Ignore", action)
    };

    return startingForm ? (
        <div style={{
            display: 'flex',
            flexDirection: 'column'

        }}>
            <div style={{flex: 1}}>
                {/* Left Pane: Categories and Actions */}
          {welcome}
                {Object.entries(categories).map(([categoryName, actions], index) => (
                    <Category
                        key={index}
                        categoryName={categoryName}
                        actions={actions}
                        onAction={handleAction}
                    />
                ))}
            </div>
            <div style={{flex: 1}}>
                {/* Center Pane: Chat Dialog */}
                <ChatDialog />
            </div>
            <div style={{flex: 1}}>
                {/* Right Pane: Preview */}
                <Preview questionnaire={questionnaire}/>
            </div>
        </div>
    ) : (
        <div>
            Welcome. Please paste some form text to start with
            <textarea onChange={function(e){
                console.log("OC", e);
                setPastedText(e.target.value)
            }} value={pastedText}></textarea>
            <button onClick={function(e){
                console.log("Welcome", pastedText)
                setStartingForm(pastedText)
                }}>Begin</button>

        </div>
    );
};

export default App;
