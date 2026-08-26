---
name: config-driven-harness-tooling
description: "Use when creating, modifying, or reviewing harness tools, check scripts, quality gates, reusable runners, policy/scenario/contract driven checks, or config-injected tooling where concrete rules must live outside the tool body."
---

# Config Driven Harness Tooling

この skill は、ハーネス用ツールを `汎用runner + 外部config` で作るために使う。

## 結論

- ツール本体は、共通処理、入力検証、結果出力だけを持つ。
- 具体ルール、対象scope、path、しきい値、期待値は、config、policy、scenario、contract 側に置く。
- 新しい対象を足す時に、runner本体を変えない形を目指す。

## 進め方

1. 何を使い回したいかを1文で書く。
2. runner本体が持つ責務を決める。
3. 対象固有の値を config / policy / scenario / contract へ出す。
4. 入力configの schemaVersion と必須fieldを検証する。
5. 実行結果を同じ形式で出す。
6. 新しい対象をconfig追加だけで動かせるか確認する。

## 分け方

| 層 | 持つもの | 持たないもの |
|---|---|---|
| runner本体 | 共通処理、入力検証、結果出力 | 対象固有path、個別ルール、個別しきい値 |
| config / policy / scenario / contract | 対象、scope、path、ルール、期待値 | 共通runnerの処理ロジック |
| result | 実行結果、失敗箇所、証跡 | 判断できない文章だけの報告 |

OK:
- `run-text-quality-gate.mjs` がconfigを読み、文字列ルールを共通処理で確認する。
- `sample-text-gate.config.json` が対象ファイル、必須文字列、禁止文字列を持つ。

NG:
- runner本体に `TodoListItem`、`80文字`、`local-api/data/todos.json` を直書きする。

## 動くサンプル

このskillには、汎用テキスト品質ゲートのrunnerを含める。

実行:

```bash
node .agents/skills/config-driven-harness-tooling/scripts/run-text-quality-gate.mjs .agents/skills/config-driven-harness-tooling/references/sample-text-gate.config.json
```

確認できること:

- runner本体は、サンプル対象を知らない。
- 対象ファイルとルールはconfigから渡される。
- OK/NGはJSONで返る。

## 参照

詳しい設計例が必要な時だけ読む:

- `references/config-driven-tooling-pattern.md`

## 完了条件

- [ ] runner本体に対象固有path、個別ルール、個別しきい値がない。
- [ ] config側に対象、scope、ルール、期待値がある。
- [ ] schemaVersion を検証している。
- [ ] OK/NG結果が同じ形式で出る。
- [ ] 新しい対象を足してもrunner本体のdiffがゼロに近い。
