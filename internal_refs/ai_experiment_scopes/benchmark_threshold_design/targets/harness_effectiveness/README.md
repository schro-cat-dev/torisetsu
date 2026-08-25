# ハーネス改善効果ベンチマーク

## 目的

ハーネス改善により、修正回数、作業時間、人間レビュー負荷、品質条件通過率が実際に改善しているかを見る。

## 見たいゴール

次のような改善履歴が複数本出てくる状態を目指す。

```text
以前: 修正5回、3時間
↓
Harness改善
↓
改善後: 修正1回、45分、品質条件100%通過
```

これは固定の達成ラインではなく、ハーネスが効いているかを見るための実測イメージとして扱う。

## 指標

| 指標 | field | 意味 | 見方 |
|---|---|---|---|
| 修正依頼回数 | `revision_requests` | ユーザーが修正を依頼した回数 | 少ないほどよい |
| 所要時間 | `elapsed_minutes` | 依頼から一旦完了までの時間 | 短いほどよい |
| 品質条件通過率 | `quality_pass_rate` | 定義済み品質条件の通過率 | 高いほどよい |
| 人間レビュー追加検出数 | `human_only_findings` | Harnessが拾えず人間が見つけた不足 | 少ないほどよい |
| 改善履歴数 | `confirmed_history_count` | 改善前後を比較できる履歴数 | 多いほど信頼しやすい |

## 暫定閾値

実測3本未満では、合否ではなく観察目安として扱う。

| ルール | field | operator | 値 | 単位 | scope | 根拠 | 検証 | 残リスク |
|---|---|---:|---:|---|---|---|---|---|
| `harness_effectiveness.revision_request_reduction` | `revision_request_reduction_rate` | `>=` | 60 | % | 同種タスクの改善前後比較 | 例: 5回から1回は80%減 | 実測履歴で計算 | タスク難易度差でぶれる |
| `harness_effectiveness.elapsed_time_reduction` | `elapsed_time_reduction_rate` | `>=` | 50 | % | 同種タスクの改善前後比較 | 例: 180分から45分は75%減 | 実測履歴で計算 | 待ち時間や外部要因でぶれる |
| `harness_effectiveness.quality_pass_rate` | `quality_pass_rate` | `==` | 100 | % | 定義済み品質条件があるタスク | 合流できる品質を守るため | 品質条件表で確認 | 条件自体が薄いと100%でも弱い |
| `harness_effectiveness.confirmed_history_count` | `confirmed_history_count` | `>=` | 3 | 本 | 同じ改善方針の効果確認 | 1本だけでは偶然を排除しにくい | 履歴ファイル数で確認 | サンプルが少ない間は仮説止まり |

## 計算方法

```text
revision_request_reduction_rate =
  (before_revision_requests - after_revision_requests) / before_revision_requests * 100

elapsed_time_reduction_rate =
  (before_elapsed_minutes - after_elapsed_minutes) / before_elapsed_minutes * 100

quality_pass_rate =
  passed_quality_conditions / total_quality_conditions * 100
```

## 境界値メモ

| case | 入力 | 期待結果 | 理由 |
|---|---|---|---|
| ちょうど60%減 | `revision_request_reduction_rate = 60` | OK | operatorが `>=` のため |
| 59.9%減 | `revision_request_reduction_rate = 59.9` | 注意 | 暫定目安に届かないため |
| 品質100% | `quality_pass_rate = 100` | OK | 合流条件を満たすため |
| 品質99% | `quality_pass_rate = 99` | NG寄り | どの条件が落ちたか確認が必要 |

## 非ゴール

- 公開AIベンチマークの点数を測る場所ではない。
- ハーネス単体の検出力だけを見る場所ではない。ハーネス単体は `../harness_quality/` で見る。
- 1回の成功だけで、仕組みが完成したと判断しない。
