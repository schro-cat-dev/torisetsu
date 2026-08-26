# Skill Orchestration Harness Skill Draft

## 結論

AIの作業に、`ステップ層` と `ステート管理層` を入れる。

これにより、skillが増えても、必要なskillだけを必要な順番で使えるようにする。

## これは何か

これは将来のskill化候補であり、現時点では動くskillではない。

目的は、AIの内蔵 planning へそのまま任せず、ハーネス側で次を管理すること。

- 今の作業状態。
- 次に見るべき観点。
- 読むskill。
- 読まないskill。
- 次のステップへ進む条件。
- 止まる条件。

## 用語

| 用語 | 意味 | 例 |
|---|---|---|
| ステート | 今の作業状態 | 相談、設計、実装、検証、push |
| ステップ | その状態の中で行う小さい作業 | 提供価値確認、対象確認、dry-run |
| skill順序 | skillを読む順番 | chat-log → alignment-gap-review → project-workflow |
| 進行条件 | 次へ進んでよい条件 | 目的、対象、完了条件が見えている |
| 停止条件 | 進まず止める条件 | スコープ不明、破壊的操作、権限不明 |

## 基本ステート

| ステート | 目的 | 主に読むskill | 次へ進む条件 |
|---|---|---|---|
| 受付 | ユーザー依頼を受け取る | chat-log-discipline | 原文ログ対象を把握する |
| 分類 | 依頼の種類を分ける | task-output-format-governance | 雑談、相談、設計、実装、検証、pushを分ける |
| 相談 | 方向性を合わせる | alignment-gap-review | 提供価値、目的、対象が見える |
| 設計 | 作る前に構造を決める | alignment-gap-review, skill-portfolio-governance | 責務、依存、完了条件が見える |
| dry-run | 変更前に何をするか出す | project-workflow | 対象、変更、リスクが見える |
| 実行 | ファイル編集や実装をする | task-specific skill | 変更が完了する |
| 検証 | 完了条件を確認する | project-workflow, evidence-driven-verification | 実結果が出る |
| 記録 | ログ、証跡、次の改善を残す | chat-log-discipline | 会話ログと成果物が残る |
| push | commitしてpushする | project-workflow | status clean、push済み |

## skill順序の例

設計相談:

```text
1. chat-log-discipline
2. alignment-gap-review
3. skill-portfolio-governance
```

実装:

```text
1. chat-log-discipline
2. project-workflow
3. task-output-format-governance
4. task-specific skill
```

品質ハーネス改善:

```text
1. chat-log-discipline
2. quality-harness-documentation-governance
3. generic-engine-design
4. project-workflow
```

## 読まない判断

ステートに関係ないskillは読まない。

例:

- 相談中なら、runtime起動skillは読まない。
- READMEの文言調整なら、frontend実装skillは読まない。
- pushだけなら、設計系skillを読み直さない。

## ステップ内の分割

1つのステップが粗い場合は、さらに小さく分ける。

例:

```text
設計
  1. 提供価値を見る
  2. 対象を見る
  3. 前提を見る
  4. 粒度を見る
  5. 要素を見る
  6. 観点を見る
  7. 完了条件を見る
```

## 禁止

- 内蔵 planning の出力を、そのまま正として扱わない。
- Codex / Claude の標準的なplanningに、未検証のまま強く連携しない。
- skillを増やすだけで解決した扱いにしない。
- 構造化だけでコンテキスト最小化できると扱わない。
- 現在ステートに不要なskillを読み込まない。

## 出力フォーマット案

```text
現在ステート:
<相談 / 設計 / 実装 / 検証 / push>

今回読むskill:
- <skill名>: <読む理由>

今回読まないskill:
- <skill名>: <読まない理由>

ステップ:
1. <作業>
2. <作業>
3. <作業>

次へ進む条件:
- <条件>

止まる条件:
- <条件>
```

## 次の実験

| 実験 | 優先度 | おすすめ度 | 背景 |
|---|---:|---:|---|
| 手動でステート表を使う | 5 | 5 | まず効くかを軽く試すため |
| skill衝突ケースを作る | 4 | 5 | 読みすぎ、矛盾、発火衝突を再現するため |
| orchestration manifestを作る | 4 | 4 | 将来ツール化する入力形式を考えるため |
| 内蔵planningとの比較 | 3 | 4 | どこでノイズが増えるかを見るため |
