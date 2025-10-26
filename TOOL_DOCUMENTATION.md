# 프로젝트 디자인 시스템 및 개발 가이드

이 문서는 프로젝트의 일관된 디자인과 코드 품질을 유지하기 위한 모든 규칙과 명세를 정의합니다.

## 1. 파일 구조

프로젝트의 기본 파일 구조는 다음과 같습니다.

```
my-web/
├── assets/
│   ├── css/
│   │   ├── style.css         # 모든 스타일 규칙
│   │   └── variables.css     # 색상, 폰트 등 디자인 변수
│   └── js/
│       ├── common-components.js # 공통 헤더/푸터 생성
│       ├── tool-loader.js       # 도구 목록 페이지 로직
│       └── modules/
│           └── theme.js         # 다크/라이트 모드 로직
├── home/
│   └── index.html
├── portfolio/
│   └── index.html
└── tool/
    ├── index.html          # 도구 목록 페이지
    └── [tool-name]/        # 개별 도구 디렉토리
        ├── index.html
        ├── tool.json
        └── description.md
```

## 2. 데이터 파일 명세

### `tool.json`

각 도구의 메타데이터를 정의합니다.

- `name` (string): 도구의 이름
- `description` (string): 도구 목록에 표시될 한 줄 설명
- `icon` (string): Font Awesome 아이콘 클래스
- `tags` (string[]): 검색 및 필터링을 위한 키워드 태그

**예시:**
```json
{
  "name": "QR 코드 생성기",
  "description": "URL이나 텍스트를 즉시 QR 코드로 변환합니다.",
  "icon": "fa-solid fa-qrcode",
  "tags": ["generator", "image", "qr"]
}
```

### `description.md`

각 도구의 상세 정보를 Markdown 형식으로 작성합니다. 기술적 원리보다는 사용자에게 유용한 정보를 중심으로 작성합니다.

**권장 형식:**
```markdown
### 주요 기능

이 도구가 사용자에게 제공하는 핵심적인 기능들을 목록 형식으로 설명합니다.

- **기능 1**: 이런 기능입니다.
- **기능 2**: 저런 기능입니다.

### 사용 팁

사용자가 이 도구를 더 효과적으로 사용할 수 있는 팁이나 숨겨진 기능을 알려줍니다.

- URL을 입력할 때는 `https://`를 포함하는 전체 주소를 입력해야 더 정확하게 인식됩니다.
- 생성된 이미지는 마우스 오른쪽 버튼으로 클릭하여 저장할 수 있습니다.
```

## 3. 페이지 표준 구조

모든 페이지(`home`, `portfolio`, 개별 도구 페이지 등)는 다음 표준 구조를 따라야 합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>페이지 제목</title>
    <link rel="stylesheet" href="../assets/css/style.css"> <!-- 경로에 주의 -->
    <!-- 페이지 전용 스크립트가 있다면 여기에 추가 -->
</head>
<body>
    <!-- 공통 헤더와 푸터는 스크립트로 자동 삽입됩니다 -->
    <main>
        <section class="page-section active">
            <div class="content-container">
                <h2>페이지 제목</h2>
                <!-- 이 안에 카드 등 페이지 콘텐츠 배치 -->
            </div>
        </section>
    </main>

    <script type="module">
        import { createHeader, createFooter } from '../assets/js/common-components.js';
        import { initTheme } from '../assets/js/modules/theme.js';

        // 1. 공통 컴포넌트 렌더링
        document.body.prepend(createHeader());
        document.body.append(createFooter());

        // 2. 테마 초기화
        initTheme();

        // 3. 이 페이지의 고유 스크립트 실행 (예: initMyTool())
    </script>
</body>
</html>
```

## 4. CSS 디자인 시스템

모든 시각적 요소는 `style.css`와 `variables.css`에 정의된 규칙을 따릅니다. **개별 페이지에 `<style>` 태그나 인라인 `style` 속성을 사용하는 것은 금지됩니다.**

- **`.content-container`**: 페이지의 메인 콘텐츠를 감싸는 중앙 정렬 컨테이너입니다. `max-width: 800px`를 가집니다.
- **`.tool-card`**: 도구 UI 또는 설명 내용을 담는 기본 카드 컴포넌트입니다.
- **`<h2>`**: `.content-container` 내부의 최상위 제목으로 사용됩니다.
- **폼 요소**: `input`, `button`, `select`, `textarea` 등은 모두 일관된 디자인이 적용되어 있습니다.
- **유틸리티 클래스**: `.w-100` (width 100%), `.mt-2` (margin-top 2rem), `.mx-auto` (좌우 margin auto) 등 재사용 가능한 클래스를 활용합니다.

## 5. JavaScript 실행 구조

- **공통 로직**: 모든 페이지는 `common-components.js`를 통해 헤더/푸터를, `theme.js`를 통해 테마 기능을 부여받습니다.
- **고유 로직**: 각 페이지의 고유 기능은 `init<PageName>()` 형태의 함수로 작성하여 실행합니다. (예: `initColorConverter()`)
- **`tool-loader.js`**: `tool/index.html` 페이지의 모든 동적 기능(툴 목록 로딩, 태그 필터링 등)을 담당합니다.