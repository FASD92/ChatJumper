# ChatJumper Chrome Web Store Release Plan

이 문서는 ChatJumper의 첫 Chrome Web Store 출시를 위한 제품 범위, 공개 페이지, 설정 UI, 스토어 준비물, 완료 기준을 정리한다. 기준 제품명은 `ChatJumper`이며, 첫 출시는 저비용, privacy-first, ChatGPT-only 범위로 진행한다.

## 출시 원칙

- 첫 출시는 Chrome 데스크톱용 확장 프로그램으로 제한한다.
- 서버 백엔드, 계정, 로그인, 결제, 라이선스 체크, analytics는 포함하지 않는다.
- 사용자 설정은 `chrome.storage.local`에만 저장한다.
- 채팅 원문, 계정 정보, 입력 내용은 저장하거나 외부 서버로 전송하지 않는다.
- Gemini와 Claude는 첫 출시에서 지원한다고 말하지 않고 `Coming soon`으로만 표시한다.
- 첫 출시는 무료로 제공한다.

## 첫 출시 지원 범위

| 영역 | 결정 |
|---|---|
| First Launch Site | ChatGPT |
| Coming Soon Support | Gemini, Claude |
| 실행 경로 | Floating Button, Keyboard Shortcut |
| 설정 경로 | Toolbar Button -> Popup, Options Page |
| 저장소 | `chrome.storage.local` |
| Product Site | 같은 repo의 `site/` 정적 HTML/CSS |

## 사용자 진입점

### Toolbar Button

브라우저 상단 확장 프로그램 아이콘이다. 클릭하면 Popup을 연다. Popup은 설정 전용이며 `Jump now` 실행 버튼은 넣지 않는다.

### Popup

Popup은 자주 바꾸는 Quick Setting을 제공한다.

- Floating Button 표시
- 이동 후 highlight 표시
- 실패 시 toast 표시
- 현재 사이트에서 활성화
- 부드러운 스크롤 사용

### Floating Button

ChatGPT 화면 오른쪽 아래에 고정되는 점프 버튼이다. 버튼은 보라색 배경, 노란색 `J`, 적당한 radius를 가진 작은 사각형 형태로 만든다. ChatGPT composer 내부 버튼과 겹치지 않도록 composer DOM에는 삽입하지 않는다.

- 기본값은 표시 ON이다.
- ChatGPT 페이지에서 composer 위치를 찾지 못해도 floating button은 표시할 수 있다.
- 삽입 실패 시 페이지 toast는 띄우지 않는다.
- 삽입 실패 상태는 Popup 또는 Options Page에서만 보여준다.
- `aria-label`과 tooltip은 `Jump to latest question`으로 둔다.
- 첫 실행은 최신 사용자 질문으로 이동한다. 이후 반복 실행은 DOM 질문 목록을 매번 다시 수집하되, 직전 선택 target이 현재 DOM에 남아 있으면 그 위치를 우선하고, 없으면 직전 선택 인덱스를 기준으로 바로 이전 사용자 질문을 순회한다. 작은 wheel/touch 이동은 순회를 reset하지 않으며, `PageUp`, `PageDown`, `Home`, `End` 같은 명시적 scroll key에서만 다음 실행을 현재 viewport 기준으로 다시 시작한다.

### Keyboard Shortcut

단축키는 빠른 점프 실행 경로로 유지한다. 기본값은 manifest의 command 설정을 따른다.
Floating Button과 같은 이동 규칙을 사용하며, 매 실행 시 다시 수집한 질문 목록과 직전 선택 인덱스를 기준으로 이전 사용자 질문으로 이동한다.

## Options Page

Options Page는 상세 설정과 안내를 담당한다. Popup과 중복되는 설정은 허용하되 같은 `storage.local` key를 공유해야 한다.

포함 범위:

- Floating Button 표시
- Highlight 표시
- Toast feedback 표시
- Smooth scroll 사용
- ChatGPT 활성화
- Highlight duration
- Shortcut 안내
- Privacy/support 링크
- local-only 설명

## 기본 설정값

설치 직후 기본 설정은 적극 활성화한다.

| 설정 | 기본값 |
|---|---|
| ChatGPT 활성화 | ON |
| Floating Button 표시 | ON |
| Highlight 표시 | ON |
| Toast feedback 표시 | ON |
| Smooth scroll 사용 | ON |

Floating Button이 기본 ON이므로, ChatGPT composer와 겹치지 않는지 smoke test에 포함해야 한다.

## Product Site

Product Site는 같은 저장소의 `site/` 폴더에 정적 HTML/CSS로 만든다. 첫 출시에서는 별도 빌드 체인을 추가하지 않는다.

필수 페이지:

- `/`: 기능 설명, 설치 링크, 지원 사이트
- `/privacy`: 상세 개인정보 처리 원칙
- `/support`: GitHub Issues와 이메일 문의 안내

언어 정책:

- 영어를 기본 언어로 둔다.
- 한국어는 보조 언어로 추가할 수 있다.

지원 경로:

- GitHub Issues: 버그, selector drift, 기능 요청
- 이메일: 개인정보 문의, 스토어 문의, 비개발자 문의

## Chrome Web Store Listing

| 항목 | 결정 |
|---|---|
| 제품명 | ChatJumper |
| 카테고리 | Productivity |
| 가격 | 무료 |
| 첫 출시 지원 사이트 | ChatGPT |
| Gemini/Claude 표현 | Coming soon |

짧은 설명 초안:

```text
Stop losing your place in long ChatGPT chats. Jump back to your latest question instantly.
```

한국어 대응 문구:

```text
긴 ChatGPT 대화에서 위치를 잃지 마세요. 최신 질문으로 즉시 돌아갑니다.
```

## Privacy Policy 범위

`/privacy`에는 아래 내용을 명확히 포함한다.

- ChatJumper가 하는 일
- 현재 페이지 DOM에서 최신 사용자 질문 위치를 찾는다는 점
- `storage.local`에 사용자 설정만 저장한다는 점
- 채팅 원문, 계정 정보, 입력 내용은 저장하지 않는다는 점
- 외부 서버 전송이 없다는 점
- analytics가 없다는 점
- 요청 권한과 host match의 목적
- 지원 문의 경로
- 정책 변경 시 처리 방식

## 스토어 스크린샷

첫 출시 목표는 최소 3장이다.

1. 긴 ChatGPT 대화에서 위치를 잃은 상황
2. 점프 후 최신 질문 highlight
3. Popup 빠른 설정 UI

Options Page 스크린샷은 첫 제출에 필수로 보지 않는다. 완성도가 충분하면 추가할 수 있다.

## 제출 전 완료 기준

Chrome Web Store 제출 전에는 아래 항목을 완료한다.

- ChatGPT에서 Floating Button 동작
- 단축키 동작
- Popup 설정 저장
- Options Page 설정 저장
- Popup과 Options Page의 같은 설정 key 공유
- Product Site 3페이지
- 상세 Privacy Policy
- 스토어 스크린샷 3장
- 수동 smoke test
- Vitest unit/fixture regression
- Playwright extension smoke
- GitHub Actions build/test
- 버전 bump/release checklist
- Store listing 초안 리뷰

## 관련 ADR

- [ADR 0001: First launch supports ChatGPT only](./adr/0001-first-launch-chatgpt-only.md)
- [ADR 0002: Use local-only settings and no backend](./adr/0002-local-only-settings-and-no-backend.md)
- [ADR 0003: Use a static Product Site](./adr/0003-static-product-site.md)
