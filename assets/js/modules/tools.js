export function initTextReverser() {
    const textReverserBtn = document.getElementById('text-reverser-btn');
    if (!textReverserBtn) return;

    textReverserBtn.addEventListener('click', () => {
        const input = document.getElementById('text-reverser-input');
        const output = document.getElementById('text-reverser-output');
        if (input && output) {
            output.textContent = input.value.split('').reverse().join('');
        }
    });
}
