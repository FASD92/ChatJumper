# ChatJumper

ChatJumper is a privacy-first Chrome extension that helps users return to the latest user question inside long AI chat conversations.

## Language

**확장 프로그램**:
Chrome에 설치되어 ChatJumper의 점프 기능과 설정 UI를 제공하는 배포 단위.
_Avoid_: 플러그인, plugin

**ChatJumper**:
긴 AI 채팅에서 최신 사용자 질문으로 이동하는 Chrome 확장 프로그램의 제품명.
_Avoid_: AI Chat Jump

**Product Site**:
ChatJumper의 기능, 개인정보 처리, 지원 방법을 설명하는 공개 웹페이지.
_Avoid_: 설명 페이지, landing page, marketing site

**Product Site Host**:
Product Site를 공개하는 정적 호스팅 위치. 첫 출시에서는 같은 GitHub repository의 GitHub Pages를 기준으로 한다.
_Avoid_: backend hosting, separate marketing site host

**Public Source Repository**:
첫 출시에서 확장 프로그램 코드, Product Site, 이슈 지원 경로를 함께 공개하는 GitHub repository.
_Avoid_: private release repo, separate site repo

**Primary Site Language**:
Product Site에서 기본으로 제공하는 언어. 보조 언어는 첫 출시 이후 별도 페이지나 섹션으로 확장할 수 있다.
_Avoid_: only language, locale implementation

**Localized Product Site**:
Product Site를 둘 이상의 언어로 제공하는 공개 웹페이지 구성. 첫 출시에서는 영어를 기본으로, 한국어를 보조 언어로 제공한다.
_Avoid_: full i18n platform, Store listing localization

**English Root Site**:
Product Site의 루트 URL을 영어 기본 페이지로 두고, 한국어 페이지는 `/ko` 경로 아래에 두는 URL 구성.
_Avoid_: language picker root, JS-only language switch

**Low-Cost Launch**:
반복 운영비와 운영 표면을 최소화하는 출시 방식. 필수 배포 비용 외의 유료 인프라는 첫 출시 범위에 포함하지 않는다.
_Avoid_: full launch, paid hosting launch

**Popup**:
확장 프로그램 아이콘을 클릭했을 때 열리는 짧은 작업용 UI. 자주 바꾸는 설정과 즉시 실행 액션만 담는다.
_Avoid_: settings page, full options

**Toolbar Button**:
브라우저 상단 툴바에 표시되는 ChatJumper 확장 프로그램 아이콘.
_Avoid_: popup button, floating button

**Composer Button**:
지원 사이트의 메시지 입력 영역 근처에 삽입되는 ChatJumper 점프 버튼.
_Avoid_: floating button, overlay button

**Options Page**:
Popup에 넣기에는 긴 설명이나 낮은 빈도의 설정을 관리하는 별도 설정 화면.
_Avoid_: popup, modal

**Quick Setting**:
Popup에서 즉시 켜고 끌 수 있는 자주 쓰는 사용자 설정.
_Avoid_: advanced setting, configuration item

**Settings Surface**:
사용자가 ChatJumper 설정을 확인하거나 변경하는 공식 UI 위치. Popup과 Options Page는 서로 다른 Settings Surface다.
_Avoid_: settings copy, duplicated UI

**Local Setting**:
현재 Chrome 브라우저 프로필 안에만 보관되는 ChatJumper 사용자 설정.
_Avoid_: synced setting, cloud setting

**First Launch Site**:
Chrome Web Store 첫 출시에서 실제로 지원하고 스토어 문구와 스크린샷에 포함하는 AI 채팅 서비스.
_Avoid_: MVP site, initial target

**Coming Soon Support**:
첫 출시에는 동작한다고 약속하지 않지만 Product Site나 출시 문구에서 이후 지원 예정으로 표시하는 서비스 상태.
_Avoid_: planned support, supported

**Support Channel**:
사용자가 ChatJumper 문제, 문의, 개인정보 요청을 보낼 수 있는 공식 경로.
_Avoid_: feedback sink, contact method

**Free Launch**:
첫 출시에서 결제, 로그인, 라이선스 체크 없이 모든 기능을 제공하는 출시 방식.
_Avoid_: paid launch, freemium launch

**Pre-Store CTA**:
Chrome Web Store URL이 생기기 전 Product Site에 표시하는 설치 안내 상태. 첫 출시 준비 중에는 Chrome Web Store 공개 예정 문구로 표시한다.
_Avoid_: manual zip install CTA, fake install link

**Local Release Note**:
Chrome Web Store 제출 준비 체크리스트, asset inventory, 공개 URL 상태처럼 공개 repository에 남기지 않는 로컬 전용 출시 메모.
_Avoid_: public release checklist, committed submission notes
