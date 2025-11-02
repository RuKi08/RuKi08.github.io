
export function init() {
    // 1. DOM Elements
    const imageInput = document.getElementById('image-input');
    const formatSelect = document.getElementById('format-select');
    const convertBtn = document.getElementById('convert-btn');
    const preview = document.getElementById('preview');
    const downloadLink = document.getElementById('download-link');
    const fileNameDisplay = document.getElementById('file-name');
    
    // 2. State
    let originalFile = null;

    // 3. Event Listeners
    imageInput.addEventListener('change', handleFileSelect);
    convertBtn.addEventListener('click', convertImage);

    // 4. Functions
    function handleFileSelect(e) {
        originalFile = e.target.files[0];
        if (originalFile) {
            fileNameDisplay.textContent = originalFile.name;
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(originalFile);
            downloadLink.style.display = 'none';
        }
    }

    function convertImage() {
        if (!originalFile) {
            alert('먼저 이미지 파일을 선택해주세요.');
            return;
        }

        const image = new Image();
        image.src = preview.src;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            const targetFormat = formatSelect.value;
            const dataUrl = canvas.toDataURL(`image/${targetFormat}`);
            
            const originalFileName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
            downloadLink.href = dataUrl;
            downloadLink.download = `${originalFileName}.${targetFormat}`;
            downloadLink.style.display = 'inline-block';
            downloadLink.textContent = `변환된 이미지 다운로드 (${targetFormat.toUpperCase()})`;
        };
    }
}
