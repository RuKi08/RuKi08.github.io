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
    loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.js')
        .then(() => {
            setupQrCodeGenerator();
        })
        .catch(error => {
            console.error("Error loading qrcode.js library:", error);
            const qrDisplay = document.getElementById('qrcode-display');
            if (qrDisplay) {
                qrDisplay.innerHTML = '<p>QR 코드 라이브러리를 로드하는 중 오류가 발생했습니다.</p>';
            }
        });
}

function setupQrCodeGenerator() {
    // 1. DOM Elements
    const form = document.getElementById('qr-form');
    const qrInput = document.getElementById('qr-input');
    const qrDisplay = document.getElementById('qrcode-display');

    // 2. Event Listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        generateQrCode();
    });

    // 3. Functions
    function generateQrCode() {
        const inputText = qrInput.value.trim();
        if (!inputText) {
            alert('텍스트나 URL을 입력해주세요.');
            return;
        }

        // Check if the qrcode function is available
        if (typeof qrcode !== 'function') {
            qrDisplay.innerHTML = `<p>QR 코드 라이브러리를 로드할 수 없습니다. 인터넷 연결을 확인하세요.</p>`;
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
            qrDisplay.innerHTML = `<p>QR 코드 생성 중 오류 발생: ${e.message}</p>`;
        }
    }
}