import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [generatorType, setGeneratorType] = useState('predefined');
  const [apiKey, setApiKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(['apiKey'], res => {
      if (res.apiKey) {
        setApiKey(res.apiKey);
        setGeneratorType('api');
      }
      
    })
  }, [])

  const handleFill = () => {
    setErrorMessage(false);
    setLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        args: [apiKey, generatorType],
        function: fillInputs
      }).then((results) => {
        if(results[0]?.result?.errorMessage) {
          setErrorMessage(results[0]?.result?.errorMessage);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      })
    });
  };

  const handleReset = () => {
    setErrorMessage(false);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: resetInputs
      });
    });
  };

  const saveOpenApiKey = (value) => {
    chrome.storage.sync.set({apiKey: value}, () => {
      setApiKey(value);
    })
  }

  const fillInputs = async (apiKey, generatorType) => {
    let buildPrompt = () => {
      let prompt = `Given an array of objects that represent types of data and the amount of values I need, please send me a json of human readable values. format the json to have key value pairs where the key is the type and the value is an array of the human readable values. the length of values should equal to the amount from the given array. Instead of lorem ipsum, use names and quotes from random tv shows. Have passwords include uppercase letters, lowercase letters, numbers, and symbols. Have the textarea be a description of the show of at least 50 characters.`
      let buildPromptArray = [];

      const textInputLength = document.querySelectorAll('input[type="text"]').length;
      buildPromptArray.push({type: 'text', amount: textInputLength});
      
      const textareaLength = document.querySelectorAll('textarea').length;
      buildPromptArray.push({type: 'textarea', amount: textareaLength});

      const emailLength = document.querySelectorAll('input[type="email"]').length;
      buildPromptArray.push({type: 'email', amount: emailLength});

      const urlLength = document.querySelectorAll('input[type="url"]').length;
      buildPromptArray.push({type: 'url', amount: urlLength});
      
      const passwordLength = document.querySelectorAll('input[type="password"]').length;
      buildPromptArray.push({type: 'password', amount: passwordLength});

      prompt += JSON.stringify(buildPromptArray);
      
      return prompt;
    }
    
    let content;
    let errorMessage;
    const callChatGPT = async (key) => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}` 
        },
        body: JSON.stringify({
            model: `gpt-3.5-turbo`,
            messages: [{ role: "user", content: buildPrompt() }]
        })
      })
      await res.json().then(data => {
        if (data.error) {
          errorMessage = data.error.message;
        } else {
          content = JSON.parse(data?.choices[0]?.message?.content);
        }
      })
    };
    
    if (generatorType === 'api' && apiKey) {
      await callChatGPT(apiKey);
      if (errorMessage) return {errorMessage};
    } else if (generatorType === 'api' && !apiKey){
      return {errorMessage: 'Must enter API key'};
    }
    const generateRandomString = (length) => {
      const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    const generateRandomPhoneNumber = () => {
      // Generate the last 7 digits of the phone number
      const areaCode = '555';
      const centralOfficeCode = Math.floor(Math.random() * 900 + 100).toString(); // Generates a number between 100 and 999
      const lineNumber = Math.floor(Math.random() * 9000 + 1000).toString(); // Generates a number between 1000 and 9999
    
      // Concatenate the parts to form the complete phone number
      const phoneNumber = `${areaCode}-${centralOfficeCode}-${lineNumber}`;
    
      return phoneNumber;
    };

    const getRandomInt = (max) => {
      return Math.floor(Math.random() * max);
    };
    
    const generateRandomPassword = () => generateRandomString(10) + '!@#$%^&*()_+~'.charAt(Math.floor(Math.random() * 10));
    
    const generateRandomEmail = () => {
      const domains = ['example.com', 'test.com', 'sample.org', 'demo.net'];
      const username = generateRandomString(8);
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${username}@${domain}`;
    };

    document.querySelectorAll('input[type="text"]').forEach(input => {
      input.value = generatorType === 'api' ? content['text'].pop() : generateRandomString(10);
    });

    document.querySelectorAll('input[type="password"]').forEach(input => {
      input.value = generatorType === 'api' ? content['password'].pop() : generateRandomPassword();
    });
  
    document.querySelectorAll('input[type="email"]').forEach(input => {
      input.value = generatorType === 'api' ? content['email'].pop() : generateRandomEmail();
    });
  
    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.value = Math.floor(Math.random() * 100);
    });
  
    document.querySelectorAll('input[type="tel"]').forEach(input => {
      input.value = generateRandomPhoneNumber();
    });
  
    document.querySelectorAll('input[type="url"]').forEach(input => {
      input.value = generatorType === 'api' ? content['url'].pop() : `https://www.${generateRandomString(5)}.com`;
    });
  
    document.querySelectorAll('input[type="date"]').forEach(input => {
      input.value = new Date().toISOString().split('T')[0];
    });
  
    document.querySelectorAll('input[type="time"]').forEach(input => {
      input.value = new Date().toTimeString().split(' ')[0];
    });
  
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
      input.value = new Date().toISOString().slice(0, -1);
    });
  
    document.querySelectorAll('input[type="month"]').forEach(input => {
      const date = new Date();
      input.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
  
    document.querySelectorAll('input[type="week"]').forEach(input => {
      const date = new Date();
      const week = Math.ceil(((date - new Date(date.getFullYear(), 0, 1)) / 86400000 + date.getDay() + 1) / 7);
      input.value = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
    });
  
    document.querySelectorAll('input[type="color"]').forEach(input => {
      input.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    });
  
    const radioButtons = document.querySelectorAll('input[type="radio"]')
    const radioButtonLength = radioButtons.length;
    if (radioButtonLength) {
      const radioButtonIndex = getRandomInt(radioButtonLength);
      radioButtons[radioButtonIndex].checked = !radioButtons[radioButtonIndex].checked;
    }
  
    let checkBoxes = document.querySelectorAll('input[type="checkbox"]')
    let checkBoxesLength = checkBoxes.length;
    if (checkBoxesLength) {
      const checkBoxesIndex = getRandomInt(checkBoxesLength);
      checkBoxes[checkBoxesIndex].checked = !checkBoxes[checkBoxesIndex].checked;
    }
  
    document.querySelectorAll('select').forEach(select => {
      const options = select.children;
      const optionsLength = options.length;
      select.selectedIndex = getRandomInt(optionsLength);
    })
  
    document.querySelectorAll('textarea').forEach(textarea => {
      const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.';
      textarea.value = generatorType === 'api' ? content['textarea'].pop() : loremIpsum;
    });
  };

  const resetInputs = () => {
    document.querySelectorAll('form').forEach(form => {
      form.reset();
    });
  };

  return (
    <div className="App">
       <fieldset className='autofill-options'>
        <legend>Choose Autofill Method</legend>
        <label>
          <input type="radio" name="autofill-method" value="predefined" checked={generatorType === 'predefined'} onChange={() => setGeneratorType('predefined')}/>
          Use Built-in Generator
        </label>
        <label>
          <input type="radio" name="autofill-method" value="api" checked={generatorType === 'api'} onChange={() => setGeneratorType('api')}/>
          Use OpenAPI Key
          <br />
          <input className='api-key' type="password" name="api-key" id="api-key" placeholder="sk-***" onFocus={(() => setGeneratorType('api'))} onChange={(ev) => {saveOpenApiKey(ev.target.value)}} value={apiKey}/>
        </label>
      </fieldset>
      <div className="action-buttons">
        <button disabled={loading === true} onClick={handleFill}>{loading ? 'Filling in...' : 'Fill in'}</button>
        <button disabled={loading === true} onClick={handleReset}>Reset</button>
      </div>
      {errorMessage && 
        <div className="error-container">
          <span className="error-icon">
            <img src='/circle-exclamation-solid.svg' />
          </span>
          <span className="error-message">
            {errorMessage}
          </span>
        </div>
      }
      <hr />
      <a className="feedback-link" href="https://autofilly.dev/feedback" target="_blank">Feedback?</a>
    </div>
  );
}

export default App;
