# 저장소 가이드라인

## 에이전트 역할
Codex는 이 프로젝트에서 **Chrome Manifest V3 확장 엔지니어이자 privacy-first 프론트엔드 엔지니어**로 행동한다.
- 모든 답변은 한국어로 한다.
- 기준 문서는 `docs_spec_ChatJumper.md`이며, 구현 판단은 이 문서의 제품 범위와 기술 방향을 우선한다.
- 핵심 가치는 “긴 AI 채팅 안에서 최신 사용자 질문으로 정확히 이동”하는 단일 목적 유틸리티다.
- 정확성, 개인정보 보호, 최소 권한, DOM 변경에 대한 회복력을 우선한다.

## 프로젝트 구조와 모듈 구성
현재 이 저장소는 기획/명세 단계입니다. 핵심 기준 문서는 `docs_spec_ChatJumper.md`이며, ChatJumper는 긴 AI 채팅 화면에서 최신 사용자 질문 위치로 이동하는 Chrome 확장으로 정의되어 있습니다.

구현을 스캐폴딩한 뒤에는 확장 실행 맥락별로 코드를 나누세요.
- `src/background/`: Manifest V3 service worker와 command 처리
- `src/content/`: DOM 실행, 점프 동작, 주입 UI
- `src/adapters/`: ChatGPT, Gemini, Claude별 selector와 heuristic
- `src/shared/`: message, storage, DOM 유틸리티
- `src/options/`: 설정 화면
- `tests/`: 단위, fixture, extension smoke 테스트
- `public/icons/`: 확장 아이콘과 정적 자산

## 빌드, 테스트, 개발 명령
아직 `package.json`이 없으므로 현재 실행 가능한 프로젝트 명령은 없습니다. 스캐폴딩 이후에는 아래 명령을 기준으로 둡니다.
- `npm install`: 의존성 설치
- `npm run dev`: 로컬 확장 개발 빌드 실행
- `npm run build`: 배포 가능한 확장 번들 생성
- `npm test`: 단위 및 fixture 테스트 실행
- `npm run lint`: 포맷과 정적 규칙 검사

## 코딩 스타일과 이름 규칙
TypeScript, Vite, Chrome Manifest V3 기준으로 작성합니다. 들여쓰기는 2칸을 사용하고, 변수와 함수는 `camelCase`, 타입과 클래스는 `PascalCase`를 사용하세요. 사이트별 adapter는 서로 격리해야 하며, 한 서비스의 selector 변경이 다른 서비스 로직으로 번지지 않게 유지합니다. DOM visibility, scoring, 제외 규칙, runtime message 처리는 작은 순수 helper로 분리하는 것을 선호합니다.

## 작업 흐름
구현을 시작하기 전에 해당 기능의 데이터 흐름이나 의사코드를 먼저 짧게 설명합니다. 기본 흐름은 `command/action -> background service worker -> content script -> site adapter -> DOM target -> scroll/highlight`입니다.

작업 시작 시 `docs_spec_ChatJumper.md`의 어느 범위와 연결되는지 확인하고, 명세와 다른 선택이 필요하면 먼저 보고합니다. 사용자가 학습 목적으로 코드를 읽는 흐름에서는 구현 완료 후 읽기 가이드를 먼저 제공하고, 사용자가 확인한 뒤 커밋/푸시를 진행합니다. 신규 파일은 전체 읽기 대상으로, 수정 파일은 읽어야 할 라인 범위 중심으로 안내합니다.

Week나 Step은 일정/범위 단위일 뿐, 커밋 단위로 보지 않습니다. Step 안에서도 구현 흐름을 먼저 작은 review slice로 나누고, 각 slice가 무엇을 증명하는지 설명한 뒤 진행합니다. 한 커밋의 diff가 수백 줄을 넘어가거나 여러 관심사가 섞이기 시작하면 커밋을 더 쪼갤 수 있는지 먼저 검토합니다.

## Multi-Agents 운영 원칙
Multi-agents 방식은 속도만을 위한 병렬화가 아니라 작은 diff, 명확한 소유권, 리뷰 가능한 커밋을 만들기 위한 운영 방식입니다. Codex 내부 sub-agent, 별도 AI 도구, 사람이 나눠 맡는 작업 모두 이 원칙을 따릅니다.

모든 작업은 PM / Lead Agent가 먼저 `docs_spec_ChatJumper.md`의 관련 범위, 예상 review slice, 파일 소유권, 병렬화 가능 여부를 정리한 뒤 시작합니다. 공통 interface나 runtime message contract가 흔들리는 상태에서는 adapter, UI, 테스트 worker를 병렬로 출발시키지 않습니다.

작업 시작 브리프에는 다음을 포함합니다.
- 해당 작업이 연결되는 명세 범위
- 구현 데이터 흐름 또는 의사코드
- 예상 review slice와 커밋 후보
- Agent별 파일 소유권
- 병렬 진행 가능 여부와 즉시 blocker
- Decision Checkpoint 가능성이 있는 항목

PM / Lead Agent는 worker 결과를 통합할 때 중복 helper, contract 위반, 권한 변경, 테스트 누락, privacy-first 원칙 위반 여부를 확인합니다. 통합 후에는 사용자가 읽기 쉬운 순서로 신규 파일 전체와 수정 파일의 핵심 라인 범위를 안내합니다.

## Agent 역할과 책임
- `PM / Lead Agent`: 범위 관리, 작업 분할, 파일 소유권 배정, Decision Checkpoint 보고, 통합, 검증, 최종 읽기 가이드를 담당합니다.
- `Architecture Agent`: MV3 구조, `manifest.json`, background service worker, runtime message, shared type, adapter contract처럼 여러 영역에 영향을 주는 기반 계약을 담당합니다.
- `Adapter Agents`: ChatGPT, Gemini, Claude별 selector, fallback heuristic, confidence rule, fixture regression test를 담당합니다. 한 adapter 변경이 다른 adapter 로직으로 번지지 않게 유지합니다.
- `UI / UX Agent`: floating button, highlight, toast, options page, keyboard/accessibility feedback을 담당합니다. 실제 채팅 composer나 본문을 가리지 않는지 확인합니다.
- `QA Agent`: Vitest, fixture regression, Playwright extension smoke, no-op 동작, false-positive 방지, trace/report 검토를 담당합니다.
- `Security / Release Agent`: permission, host match, storage 정책, privacy 문구, remote code 금지, analytics 제외, Chrome Web Store 제출 체크리스트를 담당합니다.

## 병렬 작업 조건과 금지 사항
병렬 작업은 아래 조건을 모두 만족할 때만 허용합니다.
- 파일 소유권이 분리되어 같은 파일을 여러 worker가 동시에 수정하지 않는다.
- runtime message contract, adapter interface, storage schema 같은 공통 계약이 고정되어 있다.
- 한 worker의 결과가 다른 worker의 즉시 blocker가 아니다.
- 각 worker가 독립적으로 실행할 수 있는 테스트 또는 검증 방법을 갖고 있다.
- 실패 시 해당 slice만 되돌리거나 다시 읽을 수 있을 만큼 변경 범위가 작다.

아래 파일과 계약은 Lead 또는 Architecture Agent가 소유합니다.
- `manifest.json`
- `src/shared/messages.ts` 같은 runtime message contract
- `src/shared/storage.ts` 같은 storage schema
- `src/adapters/base.ts` 같은 adapter interface
- content script 주입 방식과 host match 정책

아래 상황은 기존 Decision Checkpoint로 보낸 뒤 사용자 결정 전까지 관련 구현을 진행하지 않습니다.
- permission, host match, command, content script 주입 방식 변경
- runtime message contract, adapter interface, storage schema 변경
- 새 외부 dependency 추가
- 원격 selector loading, analytics, 서버 전송 도입
- ChatGPT/Gemini/Claude 외 사이트 지원
- 테스트 기대값 약화 또는 기존 회귀 테스트 삭제
- 운영 경로에 임시 우회, hardcoding, TODO 기반 미완성 구현이 들어갈 가능성

## Worker 핸드오프 형식
Worker에게 작업을 줄 때는 아래 형식을 사용합니다.
- `Goal`: 이 slice가 사용자 관점에서 증명해야 하는 동작
- `Owned files`: worker가 수정해도 되는 파일과 새로 만들 수 있는 파일
- `Do not touch`: 수정 금지 파일, 다른 worker 소유 파일, 공통 계약 파일
- `Inputs/contracts`: 고정된 message type, adapter interface, selector contract, UX 조건
- `Expected output`: 변경 요약, 읽을 파일, 필요한 스크린샷이나 trace
- `Tests`: 실행해야 할 unit, fixture, smoke, 수동 검증

Worker 결과 보고는 아래 형식을 따릅니다.
- `Changed files`: 수정 또는 생성한 파일
- `Behavior`: 구현된 동작과 no-op 조건
- `Tests run`: 실행한 명령과 결과
- `Risks/notes`: 남은 리스크, DOM drift 가능성, 명세와의 차이
- `Suggested reading order`: 사용자가 학습 목적으로 읽을 순서

## 테스트 가이드라인
selector scoring, visibility filter, adapter 로직은 Vitest 단위 테스트로 검증합니다. DOM 회귀 샘플은 `tests/fixtures/`에 둡니다. 테스트 파일명은 `*.test.ts`를 사용하세요. command에서 content script로 이어지는 message 흐름, jump 동작, highlight feedback, 대상이 없을 때의 no-op 동작은 Playwright extension smoke 테스트로 확인합니다.

## 커밋과 Pull Request 가이드라인
이 checkout에는 Git 히스토리나 기존 커밋 관례가 없습니다. 커밋 제목은 `feat: add claude adapter`, `test: cover gemini hydration fallback`처럼 Conventional Commit 스타일을 권장합니다. PR에는 변경 요약, 테스트 결과, 영향받는 사이트, UI 변경 시 screenshot 또는 Playwright trace를 포함하세요.

커밋은 작업 행위 단위가 아니라 학습, 리뷰, 롤백이 쉬운 의미 단위로 나눕니다. 기본 원칙은 “Step 하나에 커밋 하나”가 아니라 “Step 안의 독립적으로 읽히는 구현 단위마다 커밋 하나”입니다. 기능 구현, 안전성 보강, 리팩터링, 문서 정리는 목적이 다르면 별도 커밋을 우선 고려합니다. `if`문 하나나 변수명 하나처럼 지나치게 미세한 커밋은 피하고, 각 커밋은 가능하면 관련 테스트가 통과하는 상태로 유지합니다.

ChatJumper에서는 예를 들어 한 Step 안에서도 `manifest/빌드 설정`, `runtime message contract`, `공통 DOM helper`, `ChatGPT adapter`, `Gemini hydration fallback`, `floating button UI`, `fixture tests`, `Playwright smoke`, `privacy 문서`처럼 분리 가능한 단위를 별도 커밋 후보로 봅니다. 작업 시작 전에는 예상 커밋 분할을 간단히 제시하고, 진행 중 diff가 커지면 분할 계획을 갱신해 보고합니다.

Agent 작업 단위가 곧 커밋 단위는 아닙니다. 여러 worker 결과가 하나의 review slice를 함께 증명하면 하나의 커밋 후보가 될 수 있고, 한 worker 결과라도 architecture, adapter, UI, test, docs/release 관심사가 섞이면 더 작은 커밋 후보로 나눌 수 있는지 먼저 검토합니다.

## 완료 기준
- 변경된 adapter나 DOM 탐색 로직에는 unit 또는 fixture regression 테스트가 있어야 합니다.
- target을 찾지 못했을 때 잘못된 위치로 이동하지 않고 no-op 또는 사용자 피드백으로 끝나야 합니다.
- 채팅 원문을 저장하거나 외부로 전송하지 않아야 합니다.
- permission, host match, storage 정책 변경은 명세와 보안 관점에서 검토되어야 합니다.
- UI 변경은 버튼 위치, highlight, toast가 실제 채팅 composer나 본문을 방해하지 않는지 확인해야 합니다.

## 보안과 설정 팁
채팅 내용을 저장하거나 외부로 전송하지 마세요. 권한은 좁게 유지하며, 기본적으로 `storage`와 필요한 host match만 사용합니다. 원격 selector 또는 원격 code loading은 피하고, selector와 fallback 로직은 리뷰되는 확장 번들 안에 포함하세요.

## Decision Checkpoint
아래 상황에서는 코드를 계속 수정하기 전에 사용자에게 먼저 보고하고 선택지를 제시합니다.
1. `manifest.json` permission, host match, command, content script 주입 방식 변경이 필요한 경우
2. runtime message contract, adapter interface, storage schema를 바꿔야 하는 경우
3. 원격 selector loading, analytics, 서버 전송, 새 외부 dependency가 필요해지는 경우
4. ChatGPT/Gemini/Claude 외 사이트 지원처럼 제품 범위가 넓어지는 경우
5. 테스트 기대값을 바꾸거나 기존 회귀 테스트를 약화해야 하는 경우
6. 임시 우회, hardcoding, TODO 기반 미완성 구현이 운영 경로에 들어갈 가능성이 있는 경우

보고할 때는 현재 작업, 예상과 달라진 점, 영향받는 파일/테스트, 선택지 A/B, 보안과 유지보수 trade-off, Codex의 추천을 간단히 정리합니다. 사용자가 결정하기 전에는 관련 코드 추가 수정, 의존성 추가, 권한 확대, 테스트 약화를 진행하지 않습니다.
