# レビュー文書とskill対応表

このファイルは、TODOアプリとハーネスをレビューする時に、どの文書とskillを見るかを迷わないための入口です。

優先度とおすすめ度は5が高い。

## 1. 結論

- レビュー用ドキュメントは作成済み。
- UIフィードバック用のrepo内skillは、今回 `ui-value-design-review` として追加済み。
- 別プロジェクトのskillをそのまま移植した状態ではない。
- 今回の不足は、レビュー文書とskillの対応表がなかったこと。

## 2. 次回の最初に見る順番

| 順番 | 見るもの | 目的 |
|---:|---|---|
| 1 | `.agents/skills/ui-value-design-review/SKILL.md` | UIフィードバックを、価値、設計パターン、UX観点、ハーネス条件へ変換する |
| 2 | `.agents/skills/ui-value-design-review/references/ui-tacit-knowledge-cheatsheet.md` | 暗黙知を、状況、原文、観点、修正、価値、ハーネス条件へ分ける |
| 3 | `ui-feedback-review-checklist.md` | ユーザー指摘、修正方向、確認方法、状態を見る |
| 4 | `component-purpose-checklist.md` | UI部品ごとの目的、背景、効果、定量条件を見る |
| 5 | `component-relation-map.md` | 画面、状態、API、保存、ハーネスの関係を見る |
| 6 | `quality-harness-spec.md` | どの確認を機械で保証しているかを見る |

## 3. レビュー文書

| ファイル | 何を見るか | 今回の使い所 |
|---|---|---|
| `quality-management-plan.md` | 全体の品質ゲート | どの確認が済みで、何が未確認かを見る |
| `component-purpose-checklist.md` | UI部品ごとの目的、背景、効果、条件 | `Quality Harness` 表示、詳細位置、入力metaの妥当性を見る |
| `component-relation-map.md` | UI、状態、API、保存、ハーネスの関係 | 分類追加でどこへ波及するかを見る |
| `ui-feedback-review-checklist.md` | 画面フィードバックごとの修正方向と確認方法 | ユーザー指摘を実装とE2Eへつなぐ |
| `quality-harness-spec.md` | ハーネスが何をどう確認するか | `check:browser-quality` やAPI contractの確認内容を見る |
| `pre-push-ai-concept-gate.md` | push/PR前のAI概念チェック | 人間の違和感と機械判定を混ぜていないかを見る |
| `pre-push-ai-check-cheatsheet.md` | AIへ渡す確認表 | push前にAIが何を見るかを固定する |
| `artifact-version-ledger.md` | versionごとの変更、検証、残リスク | `0.8.2` の修正内容と証跡を残す |
| `ui-feedback-work-log.md` | 作業時間と遅くなった理由 | 次回の作業分割を改善する |
| `.agents/skills/ui-value-design-review/references/ui-tacit-knowledge-cheatsheet.md` | UI暗黙知をどう残すか | ユーザーの違和感を次回使える判断材料に変換する |

## 4. repo内skill

| skill | 役割 | 優先度 | おすすめ度 | 備考 |
|---|---|---:|---:|---|
| `ui-value-design-review` | UIの価値、導線、配置、入力meta、ノイズを見る | 5 | 5 | 今回追加 |
| `alignment-gap-review` | 提供価値、目的、対象、前提、粒度、観点のズレを見る | 5 | 5 | 既存 |
| `quality-harness-documentation-governance` | ハーネス仕様の観点、確認項目、根拠、証跡を書く | 5 | 5 | 既存 |
| `task-output-format-governance` | ユーザー指定の出力型、粒度、具体例を守る | 5 | 5 | 既存 |
| `cognitive-model-calibration` | 認知ズレ、説明粒度、具体例不足をケース化する | 5 | 5 | 既存 |

## 5. 今回のskill出力

`ui-value-design-review` で、ユーザーフィードバックを次の形へ変換した。

| フィードバック | 変換後の確認条件 | 実装方向 |
|---|---|---|
| `/todos/new` に移っても画面が変わらない | `/todos/new` で `新しいTODO` が表示される | 作成フォームを作成ルートだけに表示 |
| `Quality Harness` が不要 | 画面とブラウザタイトルに `Quality Harness` が表示されない | 内部成果物名をヘッダーと `index.html` から削除 |
| 詳細が右上に出る | 詳細は対象カード内で開閉される | カード本文クリックで行内トグルにする |
| 詳細/閉じるボタンが重複する | 右側の詳細ボタンを消す | カード本文と小さい `+ / -` 表示に寄せる |
| 必須/任意と文字数が見えない | `必須/任意` badge と `0 / 80文字` などを表示 | `todoFormMeta.ts` から表示とvalidationへ反映 |
| 分類を自由追加したい | `categories.json` から分類を読み、追加できる | `GET/POST /api/categories`、`categoryId`、分類色を追加 |
| デフォルト分類は変更不可にしたい | `プライベート / 仕事 / 日常` は `locked: true` | `categories.json` に固定分類を保存 |
| 再読み込みボタンが必要か疑問 | 通常UIには表示しない | 失敗時の `もう一度試す` に寄せる |
| 完了済みを別で見たい | 完了済み画面で `completedAt` の新しい順に表示する | `/todos/completed` と `filterTodosByViewMode` を追加 |

TDD/E2E修正ケース:

| ケース | 参照 | 価値 |
|---|---|---|
| 削除後の確認対象を `page.getByText` から `.todo-item` に変更 | `.agents/skills/ui-value-design-review/references/2026-08-27-e2e-locator-correction-case.md` | 完了条件に近い対象を確認し、テストの曖昧さを減らす |

## 6. 現時点の未完了

- Safari、Firefox、mobile実機の確認は今回の対象外。
- 分類の編集/削除は未対応。今回は分類追加と紐づけまで。
- 検索、絞り込み、並び替えのURL query同期は未対応。
