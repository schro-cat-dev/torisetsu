# モデルドリフト監視の反映loop

作成日: 2026-08-31

## 目的

定期実行の差分を、他の作業へ戻す場所を決める。

## 何をする文書か

この文書は、モデルドリフト監視で `WATCH/ACTION/BLOCK` が出た後に、どこを直すかを決めるためのものです。

悪化を見つけるだけでは価値がない。次の実行で改善される形へ戻せた時に価値が出る。

## 入力

| 入力 | 例 | 使い方 |
|---|---|---|
| check result | `model-drift-check-result.v1` | どのmetricが悪化したかを見る |
| failed checks | `sourceTraceRateDrop`, `tokenIncreaseRate` | 修正対象を分類する |
| affected cases | `drift.source_trace.local_excerpt.001` | どの作業タイプに影響するかを見る |
| raw output | `raw_runs/<runId>.json` | 本当にモデル出力が崩れたか確認する |
| baseline output | `raw_runs/<baselineRunId>.json` | 前回との差分を見る |

## 出力

| 出力 | 必須field | 目的 |
|---|---|---|
| proposal JSON | `target`, `reason`, `changeSummary`, `requiresHumanApproval` | 次に直す場所を1つ以上出す |
| routing note | `model`, `caseCategory`, `decision` | 対象用途でモデルを使い続けるか決める |
| threshold note | `metric`, `oldValue`, `newValue`, `evidenceRuns` | しきい値変更の根拠を残す |

## 反映先

| drift判定 | 反映先 | 反映内容 |
|---|---|---|
| OK | 採用モデル一覧 | 現状維持 |
| WATCH | 個別検証ログ | 悪化metricと次回再実行caseを残す |
| ACTION | prompt / schema / model routing / しきい値 | どれを直すかをproposal化する |
| BLOCK | 採用条件 / 作業ルール | 対象用途で一時停止、人間レビュー必須へ切り替える |

## どこを直すかの分類

| 悪化したmetric | まず疑う対象 | proposal target | 具体例 |
|---|---|---|---|
| `contractPassRateDrop` | 出力形式の指示が弱い、schemaが曖昧 | `prompt` または `schema` | `JSONだけ` ではなく、allowed fieldsとextra field禁止を明記 |
| `sourceTraceRateDrop` | 根拠付けの条件が弱い | `prompt` | claimごとに `sourceIds` 必須、根拠なしclaim禁止を追加 |
| `taskScoreDrop` | caseの難度、モデルrouting、rubricズレ | `routing` または `threshold` | 難caseだけ高性能モデルへ回す |
| `tokenIncreaseRate` | promptが冗長、reasoning/effortが高すぎる | `prompt` または `routing` | concise caseを安価/低effortへ回す |
| `latencyIncreaseRate` | provider側遅延、effort、モデル選択 | `routing` | p95が悪い用途だけ別モデルにする |
| `falseRefusalOrFallbackRate` | safety classifier、依頼文の誤検知 | `prompt` または `routing` | 防御目的を明記し、拒否が続く用途は別モデルへ |
| `humanRevisionMinutesIncreaseRate` | 出力は通るが実務品質が下がった | `prompt` または `routing` | done criteriaとレビュー観点をpromptへ追加 |
| `criticalUnsupportedClaims` | 補完ノイズ、根拠不足 | `prompt` または `routing` | 根拠なし重要claimが出るモデルを調査系から外す |

## proposalのOK/NG

OK:

```json
{
  "target": "prompt",
  "reason": "sourceTraceRateDrop exceeded threshold in drift.source_trace.local_excerpt.001",
  "changeSummary": "claimごとにsourceIds必須、allowedSourceIds以外は禁止、根拠なしclaimはunknownsへ分離する条件を追加する",
  "requiresHumanApproval": true
}
```

NG:

```json
{
  "target": "improve",
  "reason": "品質が悪い",
  "changeSummary": "改善する"
}
```

NG理由: どのmetricが悪化したか、どこを直すか、何を変更するかが分からない。

## 自動化の段階

| 段階 | 内容 | 完了条件 |
|---|---|---|
| 1 | baseline/currentの結果JSONを比較する | `OK/WATCH/ACTION/BLOCK` とaction itemsが出る |
| 2 | 定期実行caseを固定する | smoke 5件が同じ入力で再実行できる |
| 3 | モデル呼び出しをadapter化する | provider差をrunner本体に入れずに実行できる |
| 4 | proposalを作る | prompt、schema、routing、thresholdの変更案がJSONで出る |
| 5 | 承認後に反映する | 自動patchは明示承認後だけ行う |

## 初版runner

実行:

```bash
node internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/tools/run-model-drift-check.mjs internal_refs/ai_experiment_scopes/evaluation_reproducibility/model_drift_watch/configs/smoke-drift-check.config.json
```

出力:

- `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/smoke-drift-check.result.json`

## 注意

- ここでは提供会社の内部更新を直接証明しない。
- 検出できるのは、同一条件に近い入力で観測された挙動差分。
- 自動修正は、まずproposalまでに止める。
