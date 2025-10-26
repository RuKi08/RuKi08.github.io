# 도구 디자인 시스템 명세서

이 문서는 프로젝트의 모든 도구가 따라야 할 디자인 시스템, 코드 구조, 규칙을 상세히 정의합니다.

## 1. 기본 구조

모든 도구는 `tool/` 디렉토리 내에 고유한 하위 디렉토리를 가지며, `index.html`과 `tool.json` 파일을 포함해야 합니다.

```
tool/
└───my-new-tool/      # 예: "새로운 도구"
    ├───index.html    # 도구의 UI와 기능 구현
    └───tool.json     # 도구의 메타데이터
```

## 2. `tool.json` 파일

도구 목록 페이지(`tool/index.html`)에 표시될 정보를 정의합니다.

- `name` (string): 도구의 이름
- `description` (string): 도구에 대한 간략한 설명
- `icon` (string): [Font Awesome](https://fontawesome.com/) 아이콘 클래스

**예시:**
```json
{
  "name": "텍스트 뒤집기",
  "description": "입력한 텍스트를 뒤집어 줍니다.",
  "icon": "fa-solid fa-retweet"
}
```

## 3. `description.md` 파일 (상세 설명)

각 도구 디렉토리에는 `description.md` 파일을 추가하여, 도구 카드 아래에 표시될 상세 설명과 사용법을 작성합니다.

### `description.md` 작성 양식

```markdown
### 상세 설명

이 도구는 어떤 배경에서 만들어졌고, 어떤 기술적 원리로 동작하는지에 대한 상세한 설명을 작성합니다.

### 사용 방법

1.  첫 번째 입력 필드에 값을 입력합니다.
2.  '변환' 버튼을 클릭합니다.
3.  결과 필드에서 변환된 값을 확인하고 복사할 수 있습니다.

- **옵션 A**: 이 옵션은 ... 기능을 합니다.
- **옵션 B**: 저 옵션은 ... 기능을 합니다.
```

## 4. `index.html` 표준 구조

모든 도구는 다음의 표준 HTML 구조와 시맨틱을 따라야 합니다.

### 최종 템플릿

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>도구 이름</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        /* 이 도구에만 필요한 최소한의 스타일을 여기에 작성 */
    </style>
</head>
<body>
    <header>
        <div class="logo">도구 이름</div>
        <button id="theme-toggle">☀️</button>
    </header>

    <main>
        <section id="tool-id" class="page-section active">
            <!-- Tool Card -->
            <div class="tool-card">
                <form id="tool-form">
                    <!-- UI 요소들은 여기에 배치 -->
                </form>
            </div>

            <!-- Description Card -->
            <div id="tool-description" class="tool-card" style="display: none;"></div>
        </section>
    </main>

    <script type="module">
        import { initTheme } from '../../assets/js/modules/theme.js';

        function initMyNewTool() {
            // ... (1, 2, 3, 4)
        }

        async function loadDescription() {
            const descriptionEl = document.getElementById('tool-description');
            try {
                const response = await fetch('./description.md');
                if (!response.ok) return; // 파일이 없으면 그냥 넘어감
                
                const markdown = await response.text();
                descriptionEl.innerHTML = marked.parse(markdown);
                descriptionEl.style.display = 'block';
            } catch (error) {
                console.error('Error loading description:', error);
                // 에러 발생 시 설명 카드 숨김
                descriptionEl.style.display = 'none';
            }
        }

        initTheme();
        initMyNewTool();
        loadDescription();
    </script>
</body>
</html>
```

- **`.tool-card`**: 도구와 설명을 위한 두 개의 분리된 카드에 모두 이 클래스를 사용합니다.
- **`#tool-description`**: 설명 카드로 사용되며, `description.md` 파일이 성공적으로 로드된 후에만 JavaScript에 의해 화면에 표시됩니다.

## 5. CSS 디자인 시스템

`assets/css/tool-page.css`에 정의된 공통 클래스를 사용하여 일관된 디자인을 유지합니다. **인라인 스타일 사용은 지양합니다.**

- **`.tool-card`**: 기본 카드 스타일.
    - **`.tool-card.text-center`**: 내부 텍스트와 요소들을 가운데 정렬합니다.
- **간격**: `.tool-card > * + *` 규칙에 의해 카드 내의 직계 자식 요소들 사이에는 `1rem`의 상단 마진이 자동으로 적용됩니다. `<form>` 내부도 마찬가지입니다.
- **`.input-group`**: `label`과 `input`, 또는 여러 `input`들을 그룹화할 때 사용합니다.
- **`.button-group`**: 여러 버튼을 그룹화할 때 사용합니다. `display: flex`가 적용됩니다.
- **`.notice`**: 작은 회색 폰트의 알림 텍스트 스타일입니다.
- **`.preview-box`**: 미리보기 영역을 위한 컨테이너입니다. (예: QR코드, 색상 견본)
- **`.file-upload-label`**: `<input type="file">`을 대체하는 커스텀 버튼 스타일입니다. 실제 `input`은 `.hidden-input` 클래스를 추가하여 숨깁니다.
- **`.tool-description`**: 상세 설명 영역의 스타일입니다. `.tool-card`와 유사하지만, 사용자가 내용을 읽기 편하도록 최적화됩니다.

## 6. JavaScript 코드 구조

모든 도구의 스크립트는 `init<ToolName>` 함수로 감싸야 하며, 내부 구조는 다음 순서를 따릅니다.

```javascript
function initMyTool() {
    // 1. DOM 요소 조회
    const form = document.getElementById('tool-form');
    const input = document.getElementById('my-input');
    const output = document.getElementById('my-output');

    // 2. (선택) 상태 변수 (State)
    let isProcessing = false;

    // 3. 이벤트 리스너 등록
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        doSomething();
    });

    // 4. 핵심 로직 함수 (Functions)
    function doSomething() {
        if (isProcessing) return;
        output.textContent = input.value.split('').reverse().join('');
    }
}
```

## 7. 새 도구 추가 절차

1.  `tool/` 아래에 도구 이름으로 새 디렉토리를 생성합니다.
2.  `index.html`, `tool.json`, **`description.md`** 파일을 생성합니다.
3.  각 파일의 내용을 이 명세서의 가이드에 따라 작성합니다.
4.  `assets/js/tool-loader.js`의 `tool` 배열에 새 도구의 디렉토리 이름을 추가합니다.
