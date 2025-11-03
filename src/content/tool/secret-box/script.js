
import { db } from '../../assets/js/firebase-config.js';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export function init() {
    // 1. DOM Elements
    const form = document.getElementById('secret-form');
    const secretDataInput = document.getElementById('secret-data');
    const secretKeyInput = document.getElementById('secret-key');
    const loadSecretsBtn = document.getElementById('load-secrets');
    const secretList = document.getElementById('secret-list');
    const i18nData = document.getElementById('i18n-data');

    // 2. Firebase Check
    if (!db) {
        console.error("Firestore DB 객체를 찾을 수 없습니다. firebase-config.js를 확인하세요.");
        form.querySelector('button').disabled = true;
        loadSecretsBtn.disabled = true;
        return;
    }

    // 3. Event Listeners
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSecret();
    });
    loadSecretsBtn.addEventListener('click', loadSecrets);

    // 4. Functions
    async function saveSecret() {
        const data = secretDataInput.value;
        const key = secretKeyInput.value;

        if (!data || !key) {
            alert(i18nData.dataset.alertEnterAll);
            return;
        }

        try {
            await addDoc(collection(db, 'secrets'), {
                data: data,
                key: key,
                timestamp: serverTimestamp()
            });
            alert(i18nData.dataset.alertSaved);
            secretDataInput.value = '';
            secretKeyInput.value = '';
            loadSecrets(); // Refresh the list
        } catch (e) {
            console.error("데이터 저장 중 오류 발생: ", e);
            alert(i18nData.dataset.alertSaveFailed);
        }
    }

    async function loadSecrets() {
        secretList.innerHTML = `<li>${i18nData.dataset.loading}</li>`;

        try {
            const q = query(collection(db, 'secrets'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);

            secretList.innerHTML = '';
            if (querySnapshot.empty) {
                secretList.innerHTML = `<li>${i18nData.dataset.noData}</li>`;
                return;
            }

            querySnapshot.forEach((doc) => {
                const secret = doc.data();
                const listItem = document.createElement('li');
                listItem.textContent = secret.data;
                secretList.appendChild(listItem);
            });
        } catch (e) {
            console.error("데이터 로드 중 오류 발생: ", e);
            secretList.innerHTML = `<li>${i18nData.dataset.alertLoadFailed}</li>`;
        }
    }
}
