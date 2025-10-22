import { db } from '../firebase-config.js';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

export function initSecretBox() {
    if (!db) {
        console.error("Firestore DB 객체를 찾을 수 없습니다. firebase-config.js를 확인하세요.");
        // Firebase가 초기화되지 않았다면 SecretBox 기능 비활성화
        const saveBtn = document.getElementById('save-secret');
        const loadBtn = document.getElementById('load-secrets');
        if(saveBtn) saveBtn.disabled = true;
        if(loadBtn) loadBtn.disabled = true;
        return;
    }

    const secretDataInput = document.getElementById('secret-data');
    const secretKeyInput = document.getElementById('secret-key');
    const saveSecretBtn = document.getElementById('save-secret');
    const loadSecretsBtn = document.getElementById('load-secrets');
    const secretList = document.getElementById('secret-list');

    if (!saveSecretBtn) return; // SecretBox 섹션이 없을 경우 중단

    saveSecretBtn.addEventListener('click', async () => {
        const data = secretDataInput.value;
        const key = secretKeyInput.value;

        if (!data) {
            alert('데이터를 입력해주세요.');
            return;
        }
        if (!key) {
            alert('비밀키를 입력해주세요.');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'secrets'), {
                data: data,
                key: key,
                timestamp: serverTimestamp()
            });
            alert('데이터가 성공적으로 저장되었습니다! 문서 ID: ' + docRef.id);
            secretDataInput.value = '';
            secretKeyInput.value = '';
            loadSecretsBtn.click();
        } catch (e) {
            console.error("데이터 저장 중 오류 발생: ", e);
            alert('데이터 저장에 실패했습니다. 콘솔을 확인하세요.');
        }
    });

    loadSecretsBtn.addEventListener('click', async () => {
        secretList.innerHTML = '';

        try {
            const q = query(collection(db, 'secrets'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(q);

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
            alert('데이터를 성공적으로 불러왔습니다.');
        } catch (e) {
            console.error("데이터 로드 중 오류 발생: ", e);
            alert('데이터 로드에 실패했습니다. 콘솔을 확인하세요.');
        }
    });
}
