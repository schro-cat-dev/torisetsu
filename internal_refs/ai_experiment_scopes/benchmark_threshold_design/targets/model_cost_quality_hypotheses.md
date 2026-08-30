# モデル費用対品質の検証仮説

作成日: 2026-08-31

## 目的

高価な高性能モデルが本当に実務上の品質差を出しているのか、それとも安価なモデルでも、ゴール、チェックリスト、出力契約、評価方法を固定すれば近い品質を低コストで出せるのかを検証する。

## 仮説

| ID | 仮説 | 見る指標 |
|---|---|---|
| `cost_quality.goal_clarity` | ゴールと合格条件を明確にすると、高価モデルとの差が縮む | task pass rate、human revision minutes |
| `cost_quality.contract_effect` | 出力契約を固定すると、安価モデルでも後続処理に流せる | contract pass rate、schema violation count |
| `cost_quality.context_structure` | 入力情報を構造化すると、補完ノイズが減る | unsupported claims、noise ratio |
| `cost_quality.expensive_model_noise` | 高価モデルは補完能力が高い分、余計な推測も増える場合がある | unsupported claims、scope drift count |
| `cost_quality.cheap_model_parity` | 特定タスクでは安価モデルが高価モデルと同等品質に達する | cheap model parity rate、cost per passed case |
| `cost_quality.variance_problem` | 高性能モデルでも、同一promptへの出力ブレが採用リスクになる | repeat pass count、conclusion conflict count |

## 追加で見るべきもの

| 観点 | なぜ必要か | 具体的な測定 |
|---|---|---|
| baseline | 比較対象がないと安くなったか分からない | 現在の標準モデルのcost、時間、修正回数 |
| ablation | 何が効いたか分ける | `自由prompt`、`goalあり`、`checklistあり`、`schemaあり` を比較 |
| routing | 全部を高価モデルに投げない | easy/medium/hardでモデルを分け、合格率と費用を見る |
| judge bias | 採点AIの偏りを避ける | 機械判定 + 人間レビューを分ける |
| refusal/fallback | 安全機構で実務が止まらないか見る | 正当タスクでの拒否/fallback率 |
| latency | 高品質でも遅すぎると使えない | p50/p95 latency |

## 検証パターン

同じcaseを次の4条件で実行する。

| 条件 | 入力 |
|---|---|
| A | 自由promptのみ |
| B | ゴールと完了条件を追加 |
| C | B + チェックリスト |
| D | C + 出力schema + 評価基準 |

期待する見方:

- Dで安価モデルの合格率が大きく上がるなら、プロンプトと評価契約の効果が強い。
- Dでも高価モデルだけが通るなら、モデル能力差が実務上も効いている。
- 高価モデルでunsupported claimsやscope driftが増えるなら、補完力がノイズ化している可能性がある。

## 初期判定

| 判定 | 条件 |
|---|---|
| 安価モデルで採用可 | 品質維持率 `>= 90%`、費用削減率 `>= 50%`、重要claim根拠なし `== 0件` |
| 高価モデルを用途限定採用 | 難caseだけtask pass rateが `>= 10pt` 高く、修正時間が `>= 30%` 減る |
| 高価モデルを採用しない | 品質差が `5pt` 未満で、費用が `2倍` 以上 |

## 注意

これは仮説であり、実測前の結論ではない。特に「最近のAIモデル開発の課題」「今後改善見込みが薄い」は、公開情報だけでは断定しない。ここでは観察可能な出力ブレ、根拠なし補完、scope drift、修正時間として測る。
