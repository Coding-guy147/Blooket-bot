
(() => {
    let text_1 = "";
    let text_2 = "";
    let text_3 = "";
    let text_4 = "";
    let question_text = ""; 
    let mathTarget = null;
    
    let lastQuestion = "";
    const knownAnswers = {};
    
    function donothing(){}

    function centerClick() {
        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const target = document.elementFromPoint(x, y) || document.body;
        
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(eventType => {
            const ev = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                buttons: 1
            });
            target.dispatchEvent(ev);
        });
    }

    function nativeClick(element) {
        if (!element) return;
        const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
        events.forEach(eventType => {
            const ev = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true,
                buttons: 1
            });
            element.dispatchEvent(ev);
        });
    }


    function setNativeValue(element, value) {
        if (!element) return;

        // 1. Hard focus onto the input element
        element.focus();

        // 2. Combine the target value and the missing space character directly
        const valueWithSpace = value + " ";

        // 3. Force the full value string past the React input tracking layers
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
            nativeSetter.call(element, valueWithSpace);
        } else {
            element.value = valueWithSpace;
        }

        // 4. Fire standard input and change hooks back-to-back to unlock the submit state
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputEvent.simulated = true;
        element.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        element.dispatchEvent(changeEvent);

        // 5. Fire sequential physical keyboard trackers for the final space interaction
        ['keydown', 'keypress', 'keyup'].forEach(type => {
            element.dispatchEvent(new KeyboardEvent(type, {
                key: ' ',
                code: 'Space',
                keyCode: 32,
                which: 32,
                bubbles: true,
                cancelable: true
            }));
        });

        console.log(`Blooket text field updated with answer and space: "${valueWithSpace}"`);
    }



    function get_buttons(){
        const answerButtons = document.querySelectorAll('button[class^="_answerButton_"]');
        const typingInput = document.querySelector('input[class*="input"], input[type="text"]');
        
        if (answerButtons.length === 0 && !typingInput) return;   

        if (answerButtons.length > 0) {
            answerButtons.forEach((button, index) => {
                button.id = `aButton${index + 1}`; 
            });

            if (answerButtons[0]) text_1 = answerButtons[0].innerText.trim();
            if (answerButtons[1]) text_2 = answerButtons[1].innerText.trim();
            if (answerButtons[2]) text_3 = answerButtons[2].innerText.trim();
            if (answerButtons[3]) text_4 = answerButtons[3].innerText.trim();
        }

        const parentDiv = document.querySelector('[class*="questionText"]');
        let innerDiv = null;

        if (parentDiv) {
            innerDiv = parentDiv.querySelector('div, span') || parentDiv;
        }

        let found_typer_question = false;
        let foundMath = false;

        try {
            const question_div = document.querySelector('div[class^="_questionText_"] div');
            if (question_div && question_div.innerText.trim() !== "") {
                question_text = question_div.innerText.trim();
                found_typer_question = true;
                if (question_text !== lastQuestion) {
                    console.log(`Active Text question detected: "${question_text}"`);
                    lastQuestion = question_text;
                }
            }
        } catch (error) {}

        try {
            const math_div = document.querySelector('span[class*="mq-selectable"], [class*="math"], [class*="LaTeX"]');
            if (math_div && math_div.innerText.trim() !== "") {
                question_text = math_div.innerText.trim();
                mathTarget = math_div;
                foundMath = true;
                
                if (question_text !== lastQuestion) {
                    console.log(`Active Math question detected: "${question_text}"`);
                    lastQuestion = question_text;
                }
            }
        } catch (error) {}

        if (!foundMath && !found_typer_question && innerDiv) {
            innerDiv.id = "question";
            question_text = innerDiv.innerText.trim();
            mathTarget = innerDiv;
            
            if (question_text !== lastQuestion && question_text !== "") {
                console.log(`Active Text question detected: "${question_text}"`);
                lastQuestion = question_text;
            }
        } else if (!foundMath && !found_typer_question && !innerDiv) {
            return;
        }

        if (answerButtons.length > 0) {
            answerButtons.forEach(button => {
                if (!button.dataset.listenerAttached) {
                    button.dataset.listenerAttached = "true";
                    button.addEventListener('click', () => {
                        const chosenText = button.innerText.trim();
                        if (question_text !== "") {
                            knownAnswers[question_text] = chosenText;
                            console.log(`Saved New Answer -> [${question_text}]: "${chosenText}"`);
                        }
                    });
                }
            });

            const savedAnswer = knownAnswers[question_text];
            if (savedAnswer && question_text !== "") {
                answerButtons.forEach(button => {
                    if (button.innerText.trim() === savedAnswer) {
                        button.style.outline = "4px solid #00ff00";
                        nativeClick(button);
                        
                        setTimeout(() => {
                            centerClick();
                        }, 400); 
                    }
                });
            }
        } else if (typingInput) {
            if (!typingInput.dataset.listenerAttached) {
                typingInput.dataset.listenerAttached = "true";
                
                const saveInputAnswer = () => {
                    const typedText = typingInput.value.trim();
                    if (question_text !== "" && typedText !== "") {
                        knownAnswers[question_text] = typedText;
                        console.log(`Saved New Typing Answer -> [${question_text}]: "${typedText}"`);
                    }
                };

                typingInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveInputAnswer();
                });

                // Looser selector match for registering manual click answers
                const submitButton = document.querySelector('[class*="typingAnswerButton"], [class*="typingAnswerWrapper"] button, [class*="typingAnswerWrapper"] img');
                if (submitButton) {
                    submitButton.addEventListener('click', saveInputAnswer);
                }
            }

            const savedAnswer = knownAnswers[question_text];
            if (savedAnswer && question_text !== "" && typingInput.value === "") {
                typingInput.focus();
                
                // 1. Fire our working text + space validation engine
                setNativeValue(typingInput, savedAnswer);
                typingInput.style.outline = "4px solid #00ff00";
                
                // 2. Wait for React state to cycle
                setTimeout(() => {
                    // Try to find the button using alternative structural paths if the exact class string fails
                    const submitButton = document.querySelector('[class*="typingAnswerButton"]') || 
                                         document.querySelector('div[class*="typingAnswerWrapper"] button') ||
                                         document.querySelector('div[class*="typingAnswerWrapper"] img');

                    if (submitButton) {
                        console.log("Blooket submit button found! Triggering native interactions...");
                        nativeClick(submitButton);
                        if (typeof submitButton.click === 'function') submitButton.click();
                        
                        // If it's a structural child, click the clickable wrapper parent as well
                        const parentButton = submitButton.closest('button') || submitButton.parentElement;
                        if (parentButton && parentButton !== submitButton) {
                            nativeClick(parentButton);
                            if (typeof parentButton.click === 'function') parentButton.click();
                        }
                    } else {
                        console.log("Submit button missing. Simulating structural form submission fallback...");
                        
                        // Better Enter Key Simulation: modern frameworks check event properties heavily
                        const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
                        typingInput.dispatchEvent(new KeyboardEvent('keydown', enterOpts));
                        typingInput.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
                        typingInput.dispatchEvent(new KeyboardEvent('keyup', enterOpts));
                    }
                    
                    setTimeout(() => centerClick(), 400);
                }, 450);
            }
        }
    }
    

    function auto_pick_rewards() {
        const chest_1 = document.querySelector('div[class^=_choice1_]');
        const chest_2 = document.querySelector('div[class^=_choice2_]');
        const chest_3 = document.querySelector('div[class^=_choice3_]');
        if (!chest_1 || !chest_2 || !chest_3) {

            const rewardsScreenContainer = document.querySelector('[class*="feedback"], div[style*="position: absolute"] div[class*="text"], div[class^="_text_"]');
            if (rewardsScreenContainer) {
                centerClick();
            }
        
            return;
        }
        
        console.log("Reward choices found. Selecting...");
let rand = Math.floor(Math.random() * 3) + 1;
if (rand === 1) {
nativeClick(chest_1);
} else if (rand === 2) {
nativeClick(chest_2);
} else {
nativeClick(chest_3);
}
setTimeout(() => {
centerClick();
}, 1000);
}

function check_for_swap(){
    const playertochoosefrom = document.querySelectorAll('button[class^="playerContainer_"')[0];
                if (!playertochoosefrom){
                    return
                }

                playertochoosefrom.click();
}







setInterval(() => {
get_buttons();
auto_pick_rewards();
check_for_swap();

}, 500);
})();
