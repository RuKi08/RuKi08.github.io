document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const themeToggle = document.getElementById('theme-toggle');

    // --- Navigation Logic ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            pageSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');
        });
    });
    // Set initial active link
    document.querySelector('.nav-link[data-target="home"]').classList.add('active');


    // --- Dark Mode Toggle Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '🌙';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.textContent = '☀️';
        }
    };

    themeToggle.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);


    // --- AllTheTools: Text Reverser Logic ---
    const textReverserBtn = document.getElementById('text-reverser-btn');
    textReverserBtn.addEventListener('click', () => {
        const input = document.getElementById('text-reverser-input');
        const output = document.getElementById('text-reverser-output');
        output.textContent = input.value.split('').reverse().join('');
    });


    // --- SecretBox Logic (Firebase Ready) ---
    // TODO: Firebase 설정 코드를 여기에 추가할 것
    // TODO: Firebase 설정 코드는 index.html로 이동했습니다.
     // 이 스크립트에서 Firestore를 사용하기 위해 db 변수를 초기화합니다.
    let db;
    try {
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase가 초기화되지 않았습니다. index.html에 SDK 코드가 올바르게 포함되었는지 확인하세요.");
    }

    document.addEventListener('DOMContentLoaded', () => {
        const saveSecretBtn = document.getElementById('save-secret');
        const loadSecretsBtn = document.getElementById('load-secrets');

        saveSecretBtn.addEventListener('click', () => {
            const data = document.getElementById('secret-data').value;
            const key = document.getElementById('secret-key').value;

            if (!data) {
                alert('데이터를 입력해주세요.');
                return;
            }

            console.log("저장할 데이터:", data, "비밀키:", key);
            // TODO: 이 데이터를 Firestore 'secrets' 컬렉션에 저장
            alert('데이터가 (콘솔에) 임시 저장되었습니다.');
        });

        loadSecretsBtn.addEventListener('click', () => {
            console.log("데이터 로드 시도");
            // TODO: Firestore 'secrets' 컬렉션에서 모든 문서(데이터만) 가져오기
            // TODO: 가져온 데이터를 #secret-list 내부에 <li> 항목으로 표시 (비밀키는 절대 표시 금지)
            
            // Placeholder data
            const secretList = document.getElementById('secret-list');
            secretList.innerHTML = '<li>Firestore에서 불러온 첫 번째 비밀 데이터입니다.</li>' +
                                '<li>두 번째 데이터 조각입니다.</li>';
        });
    });

});
