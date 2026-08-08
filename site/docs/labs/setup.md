---
id: setup
title: 실습 환경 구성
sidebar_label: 실습 환경 구성
sidebar_position: 0
description: flex, bison, C 컴파일러를 설치하고 예제 저장소를 빌드하는 방법 (macOS · Linux · WSL · Docker).
---

# 실습 환경 구성

이 교안의 모든 실습은 **flex + bison + C 컴파일러 + make** 만 있으면 돌아간다.
추가 라이브러리는 쓰지 않는다.

---

## 1. 도구 설치

### macOS

macOS에는 Xcode Command Line Tools를 설치하면 flex와 bison이 함께 들어온다.

```bash
xcode-select --install
```

설치 후 확인:

```bash
flex --version    # flex 2.6.4 Apple(flex-35)
bison --version   # bison (GNU Bison) 2.3
cc --version
make --version
```

:::caution[macOS의 bison은 2.3으로 오래되었다]
Apple이 번들하는 bison은 GPLv2 시절 버전인 **2.3**이다.
교안의 예제는 이 버전에서도 동작하도록 작성했지만,
`%define api.value.type`, `%locations`의 최신 문법,
`bison -Wcounterexamples`(충돌 반례 자동 생성) 같은 최신 기능은 쓸 수 없다.

최신 bison(3.8+)을 쓰고 싶다면 Homebrew로 설치하고 PATH 앞에 둔다.

```bash
brew install bison flex
echo 'export PATH="/opt/homebrew/opt/bison/bin:/opt/homebrew/opt/flex/bin:$PATH"' >> ~/.zshrc
exec zsh
bison --version   # bison (GNU Bison) 3.8.2
```

`-Wcounterexamples`는 shift/reduce 충돌이 났을 때
**실제로 충돌하는 입력 예시를 만들어서 보여 준다.**
[충돌과 우선순위](/docs/yacc/conflicts-and-precedence) 장에서 크게 도움이 되므로
가능하면 최신 bison을 권한다.
:::

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y flex bison build-essential
```

### Fedora / RHEL

```bash
sudo dnf install -y flex bison gcc make
```

### Windows (WSL 권장)

Windows에서는 **WSL2 + Ubuntu**를 쓰는 것이 가장 마찰이 적다.

```powershell
wsl --install -d Ubuntu
```

설치 후 Ubuntu 셸에서 위의 apt 명령을 그대로 실행한다.

WSL을 쓸 수 없다면 [MSYS2](https://www.msys2.org/)를 설치하고:

```bash
pacman -S flex bison gcc make
```

### Docker (설치가 곤란할 때)

```bash
docker run --rm -it -v "$PWD":/work -w /work debian:stable-slim bash -lc \
  'apt update && apt install -y flex bison build-essential && exec bash'
```

---

## 2. 설치 확인

다음 한 줄짜리 flex 프로그램이 빌드되면 준비 끝이다.

```bash
cat > /tmp/hello.l <<'EOF'
%%
[a-zA-Z]+   { printf("WORD(%s)\n", yytext); }
[0-9]+      { printf("NUM(%s)\n", yytext); }
.|\n        { /* 무시 */ }
%%
int yywrap(void) { return 1; }
int main(void) { yylex(); return 0; }
EOF

flex -o /tmp/hello.c /tmp/hello.l
cc -o /tmp/hello /tmp/hello.c
echo "abc 123 x9" | /tmp/hello
```

기대 출력:

```
WORD(abc)
NUM(123)
WORD(x)
NUM(9)
```

:::note[`yywrap`이 뭔가요?]
flex가 입력 끝(EOF)에 도달하면 `yywrap()`을 호출한다.
0을 반환하면 "다른 파일을 이어서 읽겠다", 1을 반환하면 "여기서 끝"이라는 뜻이다.
정의하지 않으면 `-lfl` 라이브러리를 링크해야 하는데,
플랫폼마다 이름이 달라(`-lfl`, `-ll`) 번거롭다.
그래서 이 교안의 예제는 항상 `yywrap`을 직접 정의하거나
`%option noyywrap`을 쓴다.
:::

---

## 3. 저장소 내려받기

실습 코드는 전부 공개 저장소에 있다.

> **[kokoa-study-room/compiler-study-site](https://github.com/kokoa-study-room/compiler-study-site)**

```bash
git clone https://github.com/kokoa-study-room/compiler-study-site.git
cd compiler-study-site
```

`git` 이 없다면 [zip 으로 내려받아도](https://github.com/kokoa-study-room/compiler-study-site/archive/refs/heads/main.zip) 된다.
실습에 git 자체가 필요하지는 않다.

**받은 뒤 바로 확인해 보자.**

```bash
cd examples
make test
```

이렇게 나오면 환경이 다 갖춰진 것이다.

```
== test 01-lex-wordcount
  ok    basic
  ok    empty
  ...
모든 예제 테스트 통과
```

:::caution[여기서 막히면 도구 설치를 다시 보자]
| 증상 | 원인 | 할 일 |
|---|---|---|
| `flex: command not found` | flex 미설치 | [1절](#1-도구-설치) |
| `bison: command not found` | bison 미설치 | [1절](#1-도구-설치) |
| `make: *** No rule to make target` | 다른 디렉터리에 있다 | `examples/` 안인지 확인 |
| `cc: command not found` | C 컴파일러 미설치 | macOS는 `xcode-select --install` |
| 테스트만 `FAIL` | 도구 버전 차이 | 아래 [주의] 참고 |
:::

:::note[테스트가 실패해도 대부분은 정상이다]
`make test` 는 출력을 **한 글자까지** 비교한다.
flex·bison 버전이 다르면 진단 메시지의 표현이 조금 달라질 수 있다.

빌드가 되고 프로그램이 돌아간다면 학습에는 지장이 없다.
차이가 궁금하면 `diff` 결과를 그대로 읽어 보자 — 대개 오류 문구 한 줄이다.
:::

### 최신 내용 받기

교안과 예제는 계속 손보고 있다. 나중에 다시 볼 때는 이렇게 갱신한다.

```bash
git pull
cd examples && make clean && make test
```

`make clean` 을 먼저 하는 이유는, flex·bison 이 만든 `.c` 파일과 실행 파일이
저장소에 들어 있지 않고 **빌드할 때마다 새로 생기기** 때문이다.
옛 산출물이 남아 있으면 `make` 가 다시 만들지 않을 수 있다.

### 사이트 소스도 함께 들어 있다

같은 저장소의 `site/` 아래에 이 교안 자체가 들어 있다.
문서를 고쳐 보거나 로컬에서 띄워 보고 싶다면:

```bash
cd site
bun install
bun start          # http://localhost:3000
```

[bun](https://bun.sh/) 이 필요하다. 실습만 할 것이라면 없어도 된다.

---

## 4. 예제 저장소 구조

내려받은 저장소는 이렇게 생겼다.

```
compiler-study-site/
├── examples/             # ← 실습 코드는 전부 여기
├── site/                 # 이 교안의 소스 (Docusaurus)
├── research/             # 최신 동향 조사 메모
├── PROGRESS.md           # 작업 기록
└── README.md
```

실습에서 쓰는 것은 `examples/` 하나다.

```
examples/
├── Makefile              # 전체 빌드/테스트 진입점
├── common/               # 여러 예제가 공유하는 헬퍼
├── 01-lex-wordcount/     # 단어·줄·문자 수 세기
├── 02-lex-tokenizer/     # C 부분집합 토크나이저
├── 03-dfa-by-hand/       # DFA를 직접 코딩한 수 인식기
├── 04-lex-states/        # 시작 조건으로 주석·문자열 처리
├── 05-recursive-descent/ # 손으로 쓴 LL(1) 계산기
├── 06-lr-table-driven/   # 손으로 쓴 표 구동 LR 파서
├── 07-yacc-calc/         # flex + bison 계산기
├── 08-mini-compiler/     # AST → 3-주소 코드 미니 컴파일러
├── 09-lex-reentrant/     # 재진입 스캐너 (인스턴스 여러 개)
├── 10-operator-precedence/  # 우선 관계 표 구동 파서
└── 11-attribute-eval/    # 속성 평가 순서 (위상 정렬)
```

각 디렉터리에는 다음이 들어 있다.

| 파일 | 역할 |
|---|---|
| `Makefile` | `make` — 빌드, `make test` — 테스트, `make clean` — 정리 |
| `*.l`, `*.y`, `*.c` | 소스 |
| `tests/*.in` | 테스트 입력 |
| `tests/*.expected` | 기대 출력 |
| `README.md` | 이 예제가 무엇을 보여 주는지 |

---

## 5. 전체 빌드와 테스트

저장소 루트에서:

```bash
cd examples
make          # 전체 예제 빌드
make test     # 전체 테스트 실행
make clean    # 생성물 삭제
```

개별 예제만:

```bash
cd examples/01-lex-wordcount
make
make test
./wordcount < tests/basic.in
```

테스트는 `프로그램 < tests/X.in` 의 출력을 `tests/X.expected` 와
`diff` 로 비교하는 단순한 방식이다. 통과하면 `ok`, 실패하면 차이를 출력한다.

---

## 6. 도구 내부를 들여다보는 옵션

교안에서 이론과 도구를 대조할 때 자주 쓰게 될 옵션들이다.
지금 외울 필요는 없고, 해당 장에서 다시 안내한다.

### flex

| 옵션 | 하는 일 |
|---|---|
| `flex -v foo.l` | 생성된 DFA의 통계(상태 수, 테이블 크기) 출력 |
| `flex -T foo.l` | **NFA/DFA 구성 과정 전체를 덤프** — 부분집합 구성을 눈으로 확인 |
| `flex -d foo.l` | 실행 중 어떤 규칙이 매치되는지 추적 출력 |
| `flex -s foo.l` | 기본 규칙(`ECHO`)이 쓰이면 경고 — 규칙 누락 탐지에 유용 |
| `flex -Cf` / `-CF` | 테이블 압축을 포기하고 최대 속도로 |

### bison

| 옵션 | 하는 일 |
|---|---|
| `bison -v foo.y` | **`foo.output` 생성** — 모든 LALR 상태와 항목 집합, 액션 표 |
| `bison -d foo.y` | 토큰 정의 헤더(`foo.tab.h`) 생성 — lex와 공유용 |
| `bison -t foo.y` | 디버그 코드 포함 (`yydebug = 1` 로 켜서 파스 추적) |
| `bison -Wcounterexamples` | 충돌 시 실제 충돌 입력 예시 생성 (bison 3.8+) |
| `bison -g foo.y` | 오토마타를 Graphviz `.dot` 로 출력 |

:::tip[지금 바로 해 볼 것]
`bison -v` 로 나오는 `.output` 파일을 한 번 열어 보자.
`State 0`, `State 1` … 아래에 적힌 것이
[LR 구문 분석](/docs/parsing/lr-parsing) 장에서 손으로 만들게 될
**항목 집합(item set)** 바로 그것이다.
지금은 외계어로 보이겠지만, 4부를 마치면 전부 읽힌다.
:::

---

## 7. 편집기 설정 (선택)

`.l`과 `.y` 파일에 문법 하이라이팅을 붙이면 훨씬 편하다.

- **VS Code** — [Yash](https://marketplace.visualstudio.com/items?itemName=daohong-emilio.yash)
  확장이 lex/yacc 문법 하이라이팅과 오류 표시를 제공한다.
- **Vim/Neovim** — `lex`와 `yacc` 문법 파일이 기본 포함되어 있다.
- **Emacs** — `bison-mode` 패키지.

---

## 문제 해결

**`flex: command not found`**
설치가 안 되었거나 PATH에 없다. `which flex` 로 확인하고 위의 설치 절차를 다시 밟자.

**`ld: library not found for -lfl`**
`yywrap` 미정의 문제다. `.l` 파일 선언부에 `%option noyywrap` 을 추가하거나
`int yywrap(void) { return 1; }` 을 직접 정의하자.

**`y.tab.h: No such file or directory`**
`bison -d` 를 빼먹었다. lex 파일이 토큰 상수를 쓰려면
bison이 헤더를 먼저 생성해야 한다. Makefile의 의존 순서를 확인하자.

**`conflicts: N shift/reduce`**
경고이지 오류가 아니다. bison은 기본적으로 shift를 택해 계속 진행한다.
다만 의도한 동작인지 반드시 확인해야 한다.
`bison -v` 로 `.output` 을 보고 어느 상태에서 났는지 찾자.
[충돌과 우선순위](/docs/yacc/conflicts-and-precedence) 장에서 자세히 다룬다.

**macOS에서 bison 3을 설치했는데 여전히 2.3이 잡힌다**
`/usr/bin` 이 PATH에서 Homebrew 경로보다 앞에 있다.
`echo $PATH` 로 순서를 확인하고 위의 `export PATH=...` 를 셸 설정 파일 **끝에** 두자.

---

환경이 준비되었다면 [1장 컴파일러 개요](/docs/foundations/compiler-overview)부터 읽어 나가고,
3부에 도달하면 [LEX 실습](/docs/labs/lex-labs)으로 돌아오면 된다.

