# 03 · DFA를 손으로 구현하기

flex 없이, 5장에서 배운 DFA를 그대로 C 코드로 옮긴다.

## 보는 것

- **전이표 구동(table-driven)** — flex 가 생성하는 코드의 원리
- **직접 코딩(direct-coded)** — re2c 가 생성하는 코드의 원리
- 두 구현이 **항상 같은 답**을 낸다는 확인 (같은 DFA의 두 표현)
- **문자 클래스 압축** — 128열 대신 5열이면 충분하다 (flex 의 동등 클래스)
- **죽은 상태(dead state)** 와 조기 종료
- 5장의 `(a|b)*abb` DFA를 옮긴 코드

## 실행

```bash
make && make test
./dfa    < tests/numbers.in
./dfa -t < tests/trace.in     # 상태 전이 추적
```
