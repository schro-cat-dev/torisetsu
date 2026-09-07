# UI品質ハーネス

## この文書で分かること

この文書は、初めて触る開発者がUI品質ハーネスの目的、現在地、構成を確認するための入口です。

この仕組み（UI品質ハーネス）は、UIの情報、配置、操作、状態、アクセシビリティ、一貫性を、設定ファイルとブラウザーテストからまとめて確認します。すべての良し悪しを自動決定するものではなく、業務らしさや固有の味は根拠付きの判断レビューとして扱います。

現在接続している対象は、`harness_lab/todo_frontend`のローカル実験用TODOアプリです。

初回準備、実行、結果確認、失敗対応、別projectへの導入は、[UI品質ハーネス利用ガイド](getting-started.md)を上から順に読んでください。

## 現在の判定

2026-09-07の厳格監査で見つかったローカル実装上のP0〜P2を是正した。最終確認では、5証跡source、13 rule、2 scenario、12 gateがすべてpassedになった。

- 完成条件: [completion-contract.md](completion-contract.md)
- 実測結果: [verification/2026-09-07-completion-evidence.md](verification/2026-09-07-completion-evidence.md)
- 元監査と是正対応: [2026-09-07-strict-audit.md](audits/2026-09-07-strict-audit.md)

GitHub Actionsの実run、required check設定、Safari/Firefox、実機、screen reader手動確認はローカル完成範囲外で、未確認のまま残す。

## 最短実行

準備済みなら、リポジトリrootから次を実行します。

```bash
npm --prefix harness_lab/todo_frontend run typecheck
npm --prefix harness_lab/todo_frontend run check:ui-quality
```

成功条件は最後の`status: ok`です。準備、結果の読み方、失敗時の確認先は[利用ガイド](getting-started.md)にあります。

## 方針

- runner本体に、画面名、path、文言、しきい値、業務固有ルールを直書きしない。
- 具体ルールは `profile`、`policy`、`scenario`、`contract` 側に置く。
- runnerは、入力検証、参照整合性、結果出力だけを持つ。
- Playwright、axe、ARIA snapshot、screenshot比較などは、後段のadapterとして接続する。
- 業務らしさ、ブランド感、情報量の最終妥当性は、完全自動化せず `judgment` として残す。

## 用語

| 用語 | この文書での意味 | 具体例 |
|---|---|---|
| profile | 何をどの基準で確認するかをまとめたJSON | `project_profiles/todo_frontend/todo-frontend.ui-quality-profile.json` |
| policy | しきい値や禁止条件を書いたJSON | visual差分率、layout距離 |
| scenario | 利用者の操作手順と期待状態を書いたデータ | 作成、編集、error後のretry |
| adapter | Playwrightやaxeなど外部toolとの接続設定 | `adapters/todo-a11y.tool.json` |
| gate | 複数の確認結果をまとめた最終判断項目 | アクセシビリティ、操作フロー |
| evidence source | gateの判断に使った証跡の出どころ | DOM snapshot、browser flow |

## 構成

| パス | 役割 |
|---|---|
| `design.md` | UI品質ハーネスの分離設計 |
| `getting-started.md` | 初回準備、実行、結果確認、失敗対応、別projectへの導入 |
| `contracts/ui-quality-profile.schema.json` | profile JSONの入力契約 |
| `contracts/ui-quality-result.schema.json` | runner結果JSONの出力契約 |
| `contracts/ui-quality-aggregate-result.schema.json` | 最終集約結果の出力契約 |
| `contracts/ui-quality-assertions.contract.json` | assertionごとのparams契約 |
| `contracts/ui-tool-adapter.schema.json` | 外部tool adapter configの契約 |
| `contracts/ui-dom-snapshot.schema.json` | DOM snapshotの入力契約 |
| `contracts/ui-quality-adapter-result.schema.json` | adapter結果の出力契約 |
| `contracts/ui-judgment-review.schema.json` | 判断レビューの入力契約 |
| `samples/collection-list.ui-quality-profile.json` | 汎用的な一覧画面のsample profile |
| `samples/adapters/*.tool.json` | Playwright/axe等を接続するためのsample adapter config |
| `fixtures/collection-list.dom-snapshot.json` | DOM snapshot adapter用fixture |
| `project_profiles/todo_frontend/` | 既存TODO実験アプリへ接続するprofileとadapter config |
| `tools/run-ui-quality-profile.mjs` | profileの整合性を検査する最小runner |
| `tools/run-ui-dom-snapshot.mjs` | DOM snapshotから情報量・配置・構成を一次検査するadapter |
| `tools/run-ui-judgment-review.mjs` | 判断レビューsheetの整合性を検査するadapter |
| `tools/run-ui-quality-harness.mjs` | 全adapterを実行してrule、scenario、gateを最終判定する共通engine |
| `runbooks/pre-push-integration.md` | pre-push/CIへの接続方法 |
| `runbooks/*.command-plan.json` | 既存Go command runnerから呼べる実行計画 |
| `.github/workflows/ui-quality-harness.yml` | GitHub ActionsでUI品質ハーネスを実行するworkflow |
| `.ui-quality-runs/` | 自動生成resultとlogの保存先。git対象外 |
| `progress-checklist.md` | 進捗と残作業の一覧 |
| `completion-contract.md` | 完成扱いにするためのC-01〜C-22の受け入れ条件 |
| `audits/2026-09-07-strict-audit.md` | 元要求、設計、実装、接続、証跡を照合した厳格監査 |

## 現時点の自動化範囲

できること:

- `schemaVersion` の確認。
- `gateId`、`evidenceSourceIds`、`scenarioIds` の参照整合性確認。
- `evidenceSources[].configRef` の存在確認。
- adapter configと全入出力Schemaの実行時確認。
- ID重複の検出。
- `auto`、`semi_auto`、`judgment` の分類。
- DOM snapshotによる必須情報、不要情報、表示文字量、主従順、近接距離、同一役割patternの一次検査。
- 判断レビューsheetのrubric参照、根拠、未確認点の確認。
- command失敗、timeout、依存失敗の区別。
- 5証跡sourceを13 rule、2 scenario、12 gateへ集約した最終結果JSONの出力。

接続済み:

- 実ブラウザ操作とaxe実行は、既存TODO実験アプリの外部tool configへ接続済み。実行OK確認済み。
- screenshot evidenceとbounding-box確認は、既存TODO実験アプリの `check:browser-layout` へ接続済み。実行OK確認済み。
- 実DOM抽出器は、既存TODO実験アプリの `check:dom-snapshot` へ接続済み。実行OK確認済み。
- visual regressionは全routeと主要stateをmobile/desktopの22 caseで比較する。
- `.git/hooks/pre-push`、共有sample、CI、ローカルcommandは同じ `check:ui-quality` を呼ぶ。
- CI workflowは追加済み。

まだしないこと:

- AIレビューの呼び出し。

人とAIの判断レビューは同じSchemaと証跡条件で扱う。現在はAI review JSONを入力済みだが、AIを人より下位の主体としては扱わない。外部AI APIの自動呼び出しは行わない。
