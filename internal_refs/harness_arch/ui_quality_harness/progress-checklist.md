# UI品質ハーネス進捗チェックリスト

更新日: 2026-09-07

## 現在地

ローカル実装の完成条件C-01〜C-22を満たした。`profile JSON`から5証跡sourceを実行し、13 rule、2 scenario、12 gateへ集約する最終入口まで接続済み。

最終実行は`status: ok`、全rule・scenario・gateがpassed。実行前後の`git status`差分は0件だった。

監査結果: [audits/2026-09-07-strict-audit.md](audits/2026-09-07-strict-audit.md)

完成条件の正本: [completion-contract.md](completion-contract.md)

## 残り

ローカル完成範囲の必須実装は0件。

以下の「完了」表は初回実装時の判定履歴であり、現在の完了判定には使わない。

運用・品質の残リスクは次の通り。

| 状態 | 残り | 扱い |
|---|---|---|
| 運用判断待ち | 共有hook方式 | sampleは保存済み。husky等は未導入 |
| 運用判断待ち | Ubuntu上のCI実runは成功済み。必須check化は未確認 | GitHub側branch protectionで決める |
| 対象外 | Safari/Firefox/mobile実機、支援技術による手動a11y確認 | 必要時に別gate化 |

## 初回実装時チェックリスト（監査前の判定履歴）

| 状態 | 項目 | できていること | 残り |
|---|---|---|---|
| 完了 | 分離ディレクトリ | `internal_refs/harness_arch/ui_quality_harness/` を作成 | なし |
| 完了 | 設計doc | `docs / profile / runner / adapter / result` の分離線を記載 | なし |
| 完了 | 入力契約 | `ui-quality-profile.schema.json` を作成 | schema自動検証runnerへの組み込みは後続 |
| 完了 | 出力契約 | `ui-quality-result.schema.json` を作成 | schema自動検証runnerへの組み込みは後続 |
| 完了 | adapter契約 | `ui-tool-adapter.schema.json` を作成 | なし |
| 完了 | adapter結果契約 | `ui-quality-adapter-result.schema.json` を作成 | なし |
| 完了 | DOM snapshot契約 | `ui-dom-snapshot.schema.json` を作成 | なし |
| 完了 | 判断レビュー契約 | `ui-judgment-review.schema.json` を作成 | なし |
| 完了 | sample profile | 一覧画面向けの汎用sample profileを作成 | なし |
| 完了 | sample adapter | browser flow / accessibility audit のsample adapterを作成 | 実commandはproject側で設定 |
| 完了 | 最小runner | profileのID重複、参照切れ、分類不正を検査 | 外部tool実行はadapter側で扱う |
| 完了 | configRef検査 | `evidenceSources[].configRef` の存在と基本契約を確認 | adapter schema全項目の完全検証は後続 |
| 完了 | result出力 | profile、DOM、judgment、browser evidence、pre-push lightの結果を生成 | なし |
| 完了 | 汎用性確認 | runnerに対象固有語が入っていないことを `rg` で確認 | 追加adapter時も継続確認 |
| 完了 | DOM snapshot adapter | 必須情報、不要情報、表示文字量、主従順、近接距離、同一役割patternを見る | 実DOM抽出器へ接続済み |
| 完了 | Playwright adapter | 既存TODO実験アプリの `check:browser-e2e` へ接続し、実行OKを確認 | 他project用profileは後続 |
| 完了 | axe adapter | 既存TODO実験アプリの `check:browser-a11y` へ接続し、実行OKを確認 | 支援技術の手動確認は対象外 |
| 完了 | screenshot/bounding-box adapter | `check:browser-layout` を追加し、375x800/1280x900、横はみ出し、近接距離、screenshot evidenceを確認 | visual regressionへ接続済み |
| 完了 | judgment review sheet | 業務らしさ、目的適合、情報量の最終妥当性を見る契約とsampleを作成 | 実レビュー記入は後続 |
| 完了 | project導入profile | `todo_frontend` 用profileを作成し、既存browser profileの証跡を反映 | 他project用profileは後続 |
| 完了 | CI/pre-push連携 | runbook、command plan、sample hook、実hook、CI workflowを作成 | 共有hook方式とbranch protectionは運用判断 |

## 次に行うなら（完成範囲外）

1. GitHubへpush後、workflow実runを確認する。
2. 必要ならbranch protectionで`UI Quality Harness`をrequired checkにする。
3. Safari/Firefox、実機、screen reader手動確認を別gateとして追加する。

## 現時点の実行コマンド

```bash
npm --prefix harness_lab/todo_frontend run typecheck
npm --prefix harness_lab/todo_frontend run check:ui-quality
```

期待結果:

```json
{
  "status": "ok",
  "sourceCount": 5,
  "ruleCount": 13,
  "scenarioCount": 2,
  "gateCount": 12
}
```
