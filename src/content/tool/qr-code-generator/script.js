function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Avoid re-loading the script if it's already there
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function init() {
    const i18nData = document.getElementById('i18n-data');
    loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.js')
        .then(() => {
            setupQrCodeGenerator();
        })
        .catch(error => {
            console.error("Error loading qrcode.js library:", error);
            const qrDisplay = document.getElementById('qrcode-display');
            if (qrDisplay) {
                qrDisplay.innerHTML = `<p>${i18nData.dataset.errorLoadingLibrary}</p>`;
            }
        });
}

function setupQrCodeGenerator() {
    // 1. DOM Elements
    const form = document.getElementById('qr-form');
    const qrInput = document.getElementById('qr-input');
    const qrDisplay = document.getElementById('qrcode-display');
    const i18nData = document.getElementById('i18n-data');

    // 2. Event Listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        generateQrCode();
    });

    // 3. Functions
    function generateQrCode() {
        const inputText = qrInput.value.trim();
        if (!inputText) {
            alert(i18nData.dataset.alertEnterText);
            return;
        }

        // Check if the qrcode function is available
        if (typeof qrcode !== 'function') {
            qrDisplay.innerHTML = `<p>${i18nData.dataset.errorLoadingLibrary}</p>`;
            return;
        }

        try {
            qrDisplay.innerHTML = '';
            const qr = qrcode(0, 'M');
            qr.addData(inputText);
            qr.make();
            const imgTag = qr.createImgTag(8, 16);
            qrDisplay.innerHTML = imgTag;

        } catch (e) {
            qrDisplay.innerHTML = `<p>${i18nData.dataset.errorCreatingQr.replace('{error}', e.message)}</p>`;
        }
    }
}