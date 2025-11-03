
export function init() {
    // 1. DOM Elements
    const charInput = document.getElementById('char-input');
    const codeOutput = document.getElementById('code-output');
    const toCodeBtn = document.getElementById('to-code-btn');
    const toCharBtn = document.getElementById('to-char-btn');
    const i18nData = document.getElementById('i18n-data');

    // 2. Event Listeners
    toCodeBtn.addEventListener('click', convertToCode);
    toCharBtn.addEventListener('click', convertToChar);

    // 3. Functions
    function convertToCode() {
        const inputText = charInput.value;
        if (!inputText) return;

        try {
            const codes = [];
            for (let i = 0; i < inputText.length; i++) {
                codes.push(inputText.charCodeAt(i));
            }
            codeOutput.value = codes.join(', ');
        } catch (e) {
            codeOutput.value = i18nData.dataset.errorMessage.replace('{error}', e.message);
        }
    }

    function convertToChar() {
        const inputCodes = codeOutput.value;
        if (!inputCodes) return;
        
        try {
            const codes = inputCodes.split(',').map(s => parseInt(s.trim()));
            let chars = '';
            for(const code of codes) {
                if(isNaN(code)) throw new Error (i18nData.dataset.errorNan);
                chars += String.fromCharCode(code);
            }
            charInput.value = chars;
        } catch (e) {
            charInput.value = i18nData.dataset.errorMessage.replace('{error}', e.message);
        }
    }
}
