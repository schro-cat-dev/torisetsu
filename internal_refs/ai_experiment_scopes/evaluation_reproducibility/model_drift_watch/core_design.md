# モデルドリフト監視のコア設計

作成日: 2026-08-31

## 結論

この仕組みのコアは、モデルAPI adapterではない。コアは、同じ入力を同じ評価規格へ通し、観測値、差分、判断、改善案を同じ形で残すこと。

この文書は、次を決めるための設計書です。

- どのAIモデルを監視対象にするか。
- 何を「性能や挙動が変わった」と見るか。
- どの条件を満たしたら、監視v1を完了扱いにするか。
- 悪化した時に、prompt、schema、routing、thresholdのどれを直すか。

## 一文で言うと

固定caseをモデルに投げ、出力をgraderで数値化し、baselineとの差分をしきい値で判定し、改善案として次の実行へ戻す。

## 何をするためのものか

この仕組みは、AIモデルを「名前」や「公開ベンチの印象」ではなく、自分たちの作業で使えるかどうかで判断するためのものです。

具体的には、次の判断に使う。

| 判断 | 例 | 必要な出力 |
|---|---|---|
| 採用継続 | 今の標準モデルを使い続けてよいか | `OK` または `WATCH` と理由 |
| 採用停止 | この用途で一時的に使うのを止めるべきか | `BLOCK` と対象case |
| 用途分担 | 高価モデルと安価モデルをどう分けるか | task別score、cost、latency |
| prompt修正 | モデルが勝手に補完するならpromptを直すべきか | unsupported claims、scope drift |
| schema修正 | 出力形式が崩れるならschemaを強くするべきか | contract pass rate |
| routing修正 | easy taskを安価モデルへ回せるか | cheap model parity、cost per passed case |
| threshold修正 | しきい値が厳しすぎる/甘すぎるか | 3回以上の実測差分 |

## 対象モデル

v1で扱う対象は、一般的な「AIモデル全部」ではない。APIで同じcaseを投げられ、usage、latency、出力を保存できるLLMだけを対象にする。

初期対象は次の通り。

| provider | model | 役割 | v1で見ること | 状態 |
|---|---|---|---|---|
| OpenAI | `gpt-5.6-sol` | 高性能baseline候補 | 高難度caseの品質、token、latency | 公式docsでmodel ID確認 |
| OpenAI | `gpt-5.6-terra` | 中間cost候補 | Solに近い品質を低costで出せるか | 公式docsでmodel ID確認 |
| OpenAI | `gpt-5.6-luna` | 安価候補 | contract固定でどこまで実務品質を保てるか | 公式docsでmodel ID確認 |
| OpenAI | `gpt-5.5` | 比較候補 | 利用可能なら旧/別世代baselineとして比較 | API availability確認が必要 |
| Anthropic | `claude-opus-5` | Claude高性能baseline候補 | agentic/coding系、長文指示順守 | 公式docsでmodel ID確認 |
| Anthropic | `claude-fable-5` | Claude最上位/高cost候補 | 高costに見合う改善があるか、拒否/fallbackが増えないか | 公式docsでmodel ID確認 |

`gpt-5.5` は、この文書だけでは存在・利用可能を完了扱いにしない。adapter実装時に API の model list または公式docsで利用可能性を確認し、使えない場合は `SKIP` として記録する。

参考にした公式情報:

- OpenAI Models: `gpt-5.6-sol`、`gpt-5.6-terra`、`gpt-5.6-luna` のmodel ID、context、output、価格、reasoning設定。
- Anthropic Claude migration docs: `claude-opus-5`、`claude-fable-5` のmodel ID、1M context、128K output、thinking/effort、価格、fallback/拒否まわり。

## この仕組みが満たすべき要件

| ID | 要件 | OK条件 |
|---|---|---|
| R-01 | 同じ入力で比較できる | case IDごとにpromptが固定され、変更時はversionが上がる |
| R-02 | 出力形式の崩れを検知できる | JSON parse、required fields、extra fields、Markdown混入を機械判定できる |
| R-03 | 根拠なしclaimを検知できる | source付きcaseでclaimごとのsource IDを数えられる |
| R-04 | 実務品質を点数化できる | caseごとのrubric scoreを100点換算できる |
| R-05 | costを比較できる | provider usageからinput/output/total tokenを保存する |
| R-06 | latencyを比較できる | request開始から終了までのmsを保存する |
| R-07 | refusal/fallbackを検知できる | 正当caseで拒否、fallback、stop reasonを記録する |
| R-08 | 人間修正コストを入れられる | 未測定を0扱いせず、measured/unmeasuredを分ける |
| R-09 | baselineとの差分を出せる | observation同士を比較し、drop/increaseを計算する |
| R-10 | 運用判断へつなげる | `OK/WATCH/ACTION/BLOCK` のどれかを出す |
| R-11 | 改善対象を分けられる | `prompt/schema/routing/threshold` のどれを直すかproposalに出す |
| R-12 | 証跡が残る | raw output、observation、check result、proposalを保存する |

## 完了したら何がOKになるか

v1が完了すると、次の問いにファイルとコマンドで答えられる。

| 問い | OK例 |
|---|---|
| 今日の `gpt-5.6-sol` は前回と比べて崩れていないか | `model-drift-check-result.v1.status == "OK"` |
| `claude-fable-5` は高いだけでなく品質差を出したか | task score、human revision minutes、cost per passed caseで比較できる |
| 安価モデルへroutingしてよいcaseはあるか | contract pass 100%、critical unsupported claims 0、品質維持率90%以上 |
| 悪化した時に何を直すべきか | proposalの `target` が `prompt/schema/routing/threshold` のどれかになる |
| モデル更新らしき挙動差分を後から追えるか | baseline/current observationとraw outputが保存されている |

## 完了扱いにしない例

| 状態 | なぜ未完了か |
|---|---|
| case説明だけあり、JSONがない | 同じ入力で再実行できない |
| adapterだけある | 出力を同じ評価規格へ通せない |
| graderが文章評価だけ | 機械比較と定期監視に使えない |
| OK/WATCH/ACTION/BLOCKのfixtureがない | 判定ロジックが再現できない |
| ACTION/BLOCK後のproposalがない | 悪化を改善loopへ戻せない |
| 実行結果の保存先がばらばら | 後から比較・監査できない |

## コア部品

| 順 | 部品 | 役割 | 変えてよいか |
|---:|---|---|---|
| 1 | case set | 同じ入力を毎回使う | case追加は可。既存caseの意味変更はversion更新 |
| 2 | output contract | 出力形式を固定する | 原則固定。変更時はversion更新 |
| 3 | raw run log | モデルの生出力とusageを残す | 保存形式は固定 |
| 4 | grader | 生出力を同じ採点規格に通す | 採点項目追加は可。既存意味変更はversion更新 |
| 5 | observation | 1回分の観測値を保存する | schema固定 |
| 6 | drift check | baselineとcurrentを比較する | しきい値は実測で更新可 |
| 7 | action proposal | prompt/schema/routing/thresholdの改善案を出す | 自動適用はしない |
| 8 | experiment ledger | 実行結果と判断履歴を残す | 保存先固定 |

## データの流れ

```text
case set
  -> provider adapter
  -> raw run log
  -> grader
  -> model-drift-watch-observation.v1
  -> drift check
  -> model-drift-check-result.v1
  -> action proposal
  -> human-approved update
```

## 変えない芯

| 芯 | 理由 |
|---|---|
| 同じcaseを使う | 入力が変わるとモデル差分か入力差分か分からない |
| output contractを固定する | 後続処理に流せるかを見たい |
| graderを固定する | 採点者が変わると比較できない |
| observation schemaを固定する | モデルやproviderが違っても同じ表で比較するため |
| drift statusを固定する | `OK/WATCH/ACTION/BLOCK` で運用判断へつなぐため |
| 実行結果を保存する | 後から差分と判断理由を追えるようにするため |

## 変えてよい部分

| 変えてよいもの | 条件 |
|---|---|
| model名 | config変更で差し替える |
| provider adapter | observation schemaを守る |
| prompt | versionを上げ、変更理由を残す |
| しきい値 | 実測3回以上、変更理由、残リスクを残す |
| case追加 | 既存caseの意味を壊さない |

## 最小v1で本当に作るもの

| 優先 | 作るもの | 完了条件 |
|---:|---|---|
| 1 | `cases/smoke.v1.json` | 5件のcaseがschema通過 |
| 2 | case schema checker | case不足を機械で落とせる |
| 3 | raw output fixture | graderの入力になるサンプルがある |
| 4 | grader | observation metricsを生成できる |
| 5 | drift check fixture | OK/WATCH/ACTION/BLOCKを全部再現 |
| 6 | proposal generator | ACTION/BLOCK時に改善案JSONを出せる |
| 7 | provider adapter | API keyありで実model、なしでSKIPを明示 |

## 何ができたら価値が出るか

- 同じモデル名でも、前より出力契約が壊れたか分かる。
- 根拠なしclaimが増えたか分かる。
- tokenやlatencyが悪化したか分かる。
- 人間の修正時間が増えたか分かる。
- 悪化時に、prompt、schema、routing、thresholdのどこを直すべきか分かる。

## 何がないと失敗するか

- caseが固定されていない。
- graderが毎回変わる。
- raw outputを残していない。
- observationとcheck resultが混ざっている。
- ACTION/BLOCKが出ても改善案に接続しない。
- しきい値を気分で変える。
