---
name: quality-harness-documentation-governance
description: "Use when creating, modifying, reviewing, or documenting a quality harness, verification gate, test suite, check script, evidence summary, quality report, or validation plan that needs concrete quality viewpoints, check items, rationale, commands, expected results, actual results, residual risks, and next improvements."
---

# Quality Harness Documentation Governance

この skill は、品質ハーネスの説明粒度をそろえるために使う。

## 1. スコープ

対象:
- 品質ハーネス。
- テスト、check script、検証ゲート。
- 検証結果の summary、証跡、残リスク。

対象外:
- ローカルサービスの起動、終了、cleanup。
- dev時のサーバーログ設計。

## 2. 必須項目

品質ハーネスを作ったら、次を具体的に書く。

| 項目 | 書くこと |
|---|---|
| 観点 | 何の品質を見るか。例: 型、安全性、API契約、UI操作 |
| 確認項目 | 具体的に何を確認するか |
| 判断根拠 | なぜその確認で現実的に十分と言えるか |
| 実現方法 | どのコマンド、テスト、scriptで確認するか |
| 期待結果 | OKの条件 |
| 実結果 | 実行結果、summary、ログ |
| 残リスク | まだ見ていないこと |
| 次の改善 | 足すなら何を足すか |

## 3. 未対応の扱い

ここでの `未対応` は、品質ハーネス説明の不足だけを指す。

例:
- `未対応: API失敗時のUI表示を実ブラウザで確認していない`
- `未対応: 判断根拠がコマンド名だけで、品質観点と結びついていない`
- `未対応: summaryはあるが、残リスクが粗い`

runtime、logger、起動終了の不足は、この skill に混ぜない。
