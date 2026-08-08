/*
 * 재진입(reentrant) 스캐너 — 스캐너 인스턴스를 여럿 동시에 굴린다.
 *
 *   %option reentrant  전역 변수를 yyscan_t 핸들 안으로 옮긴다.
 *   %option prefix     생성되는 이름의 yy 접두사를 바꾼다.
 *                      (한 프로그램에 스캐너가 둘 이상일 때 필요)
 *
 * 액션 안에서는 `yyscanner` 라는 인자를 언제나 쓸 수 있다.
 * 사용자 데이터는 YY_EXTRA_TYPE 로 붙인다.
 */
%option reentrant noyywrap nounput noinput
%option prefix="tk"

%{
#include <stdio.h>
#include <string.h>
#include "tok.h"

#define YY_EXTRA_TYPE struct stats *
%}

%%

[0-9]+          { tkget_extra(yyscanner)->nums++;  return T_NUM; }
[A-Za-z_][A-Za-z_0-9]*  { tkget_extra(yyscanner)->words++; return T_WORD; }
[ \t]+          { /* 무시 */ }
\n              { tkget_extra(yyscanner)->lines++; }
.               { tkget_extra(yyscanner)->other++; return T_OTHER; }

%%
