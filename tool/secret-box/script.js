
import { db } from '../../assets/js/firebase-config.js';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function initSecretBox() {
    // 1. DOM Elements
    const form = document.getElementById('secret-form');
    const secretDataInput = document.getElementById('secret-data');
    const secretKeyInput = document.getElementById('secret-key');
    const loadSecretsBtn = document.getElementById('load-secrets');
    const secretList = document.getElementById('secret-list');

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
            alert('데이터와 비밀키를 모두 입력해주세요.');
            return;
        }

        try {
            await addDoc(collection(db, 'secrets'), {
                data: data,
                key: key,
                timestamp: serverTimestamp()
            });
            alert('데이터가 성공적으로 저장되었습니다!');
            secretDataInput.value = '';
            secretKeyInput.value = '';
            loadSecrets(); // Refresh the list
        } catch (e) {
            console.error("데이터 저장 중 오류 발생: ", e);
            alert('데이터 저장에 실패했습니다. 콘솔을 확인하세요.');
        }
    }

    async function loadSecrets() {
        secretList.innerHTML = '<li>로딩 중...</li>';

        try {
            const q = query(collection(db, 'secrets'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);

            secretList.innerHTML = '';
            if (querySnapshot.empty) {
                secretList.innerHTML = '<li>아직 저장된 비밀 데이터가 없습니다.</li>';
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
            secretList.innerHTML = '<li>데이터를 불러오는 데 실패했습니다.</li>';
        }
    }
}

initSecretBox();
