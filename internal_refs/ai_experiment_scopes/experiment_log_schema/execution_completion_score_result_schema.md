# Execution Completion Score Result Schema

作成日: 2026-08-31

## 目的

`execution-completion-record.v1` を採点した結果を保存する。

## schemaVersion

`execution-completion-score-result.v1`

## 判定

| status | 条件 |
|---|---|
| PASS | score >= 85 かつBLOCK項目なし |
| WATCH | score >= 70 |
| ACTION | score >= 50 |
| BLOCK | score < 50 またはBLOCK項目失敗 |

## 注意

- `completion.doneCriteriaMet` がfalseなら、原則として完了扱いにしない。
- scoreは自己満足用ではなく、次loopで直す箇所を決めるために使う。
