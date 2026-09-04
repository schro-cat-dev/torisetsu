# Qwen3 0.6B Colab CPU Minimal Inference

作成日: 2026-09-04 JST

## 対象

Colab無料CPUで `Qwen/Qwen3-0.6B` を読み込み、短いprompt 2件を `model.generate(...)` で実行した結果。

## 入力

| case_id | 入力概要 |
|---|---|
| `reasoning.short.001` | 0円、30分以内、記録ありの3ステップ作業計画を依頼 |
| `json.contract.001` | `summary`、`risks`、`next_action` のJSONだけを依頼 |

## 実測値

| case_id | generation_seconds | new_tokens | tokens_per_second | ram_used_gb |
|---|---:|---:|---:|---:|
| `reasoning.short.001` | 57.83 | 160 | 2.77 | 3.12 |
| `json.contract.001` | 35.42 | 160 | 4.52 | 3.12 |

補足:

- model loadは29.27秒。
- 2件のgeneration合計は93.25秒。
- model loadから2件のgenerationまでの計測済み時間は少なくとも122.52秒。
- 旧版セルではセル全体時間を出していないため、正確なwall timeは未記録。

## 出力概要

| case_id | 出力概要 |
|---|---|
| `reasoning.short.001` | `<think>` で考え始めたが、3ステップ回答へ到達する前に160 tokenで終了 |
| `json.contract.001` | `<think>` でJSON内容を考え始めたが、JSON本体へ到達する前に160 tokenで終了 |

## 解釈

- CPU上で `Qwen/Qwen3-0.6B` が文章生成できることは確認できた。
- ただし、2件とも `new_tokens=160` で上限に到達しているため、出力が途中で切れている可能性が高い。
- 2件とも最終回答へ到達していないため、タスク成功とは判定しない。
- `json.contract.001` はJSONとしてparseできないため、契約遵守はNG。
- 実運用判定には進めず、thinking抑制とセル全体時間の計測を入れた新版セルで再測定する。

## 次の修正

1. `enable_thinking=False` を付けた新版セルで再実行する。
2. `cell_total_seconds`、`case_total_seconds`、`generation_seconds` を分けて記録する。
3. `hit_max_new_tokens=true` の場合は、出力が途中で切れていないかを人間が確認する。

## 再測定

実行日: 2026-09-04

修正版セルで `enable_thinking=False` を指定し、セル全体時間とcase別時間を出した。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---|
| `reasoning.short.001` | 43.46 | 43.47 | 53 | 160 | 3.68 | 3.08 | true |
| `json.contract.001` | 16.53 | 16.54 | 35 | 71 | 4.29 | 3.09 | false |

セル全体:

```text
cell_total_seconds: 60.01
max_new_tokens: 160
```

解釈:

- `reasoning.short.001` は3ステップ構造が出始めたが、160 tokenで途中終了した。
- `json.contract.001` はJSON形式で停止したが、内容は入力と関係が薄く、品質としては弱い。
- thinking抑制は効いており、前回の `<think>` 途中終了よりは改善した。
- 次は `max_new_tokens=320` 以上で短文計画を再試行するか、落語学習promptで長めの構造化出力を見る。

## 再測定 repeat 2

実行日: 2026-09-04

同じcellを再実行した結果。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---|
| `reasoning.short.001` | 44.01 | 44.02 | 53 | 160 | 3.64 | 3.11 | true |
| `json.contract.001` | 16.07 | 16.07 | 35 | 71 | 4.42 | 3.11 | false |

セル全体:

```text
cell_total_seconds: 60.09
max_new_tokens: 160
```

解釈:

- 1回目と2回目で、速度と出力傾向はほぼ同じ。
- `do_sample=False` なので、同じ入力では再現性が高い。
- `reasoning.short.001` は2回連続で160 token上限に到達しているため、現在の上限では不足。
- `json.contract.001` は2回連続で同じ英語JSONを返しているため、prompt修正なしでは日本語JSON評価には使いにくい。

日本語対応について:

- `json.contract.001` は日本語指示に対して英語で返している。
- これは「日本語非対応」とは断定しない。
- 現時点の判定は「日本語指示追従が弱い、またはpromptが不足していて英語の一般文を作った」。
- 次は、日本語指定、英語禁止、topic、入力本文を明示したJSON caseで再試行する。

## max_new_tokens 320 再試行

実行日: 2026-09-04

短文計画caseを `max_new_tokens=320` へ増やして再実行した。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `reasoning.short.001` | 84.76 | 84.77 | 53 | 320 | 0 | 3.78 | 3.08 | true |
| `json.contract.001` | 15.82 | 15.83 | 35 | 71 | 89 | 4.49 | 3.09 | false |

セル全体:

```text
cell_total_seconds: 100.6
default_max_new_tokens: 320
```

解釈:

- `reasoning.short.001` は3ステップ目まで出たため、160 tokenより改善した。
- ただし、320 tokenでも上限に到達しているため、まだ出力上限不足の可能性が高い。
- 内容は同じ要素の繰り返しが目立つ。次は単にtokenを増やすだけでなく、重複禁止、各ステップの行数、全体文字数をpromptへ入れる。
- `json.contract.001` は前回と同じ英語JSON傾向であり、日本語JSON評価には使いにくい。

## max_new_tokens 860 再試行

実行日: 2026-09-04

短文計画caseとJSON caseを `max_new_tokens=860` で再実行した。

| case_id | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `reasoning.short.001` | 122.97 | 122.97 | 53 | 351 | 509 | 2.85 | 3.08 | false |
| `json.contract.001` | 22.92 | 22.92 | 35 | 71 | 789 | 3.10 | 3.09 | false |

セル全体:

```text
cell_total_seconds: 145.9
default_max_new_tokens: 320
case max_new_tokens: 860
```

解釈:

- セル全体は145.9秒、約2分25.9秒。
- `reasoning.short.001` は351 tokenで止まり、860 token上限には到達していない。
- `json.contract.001` は71 tokenで止まり、860 token上限には到達していない。
- `reasoning.short.001` は完結したが、各stepの中身が重複している。
- `json.contract.001` は英語の `Language mismatch` 内容になっているが、promptに要約対象本文がなく、旧実行は `do_sample=False` だったため、この結果だけで言語能力を判定しない。

## 公式推奨との差分

- ここまでの再測定は `do_sample=False` のgreedy decodingで実行していた。
- Qwen公式model cardでは、non-thinking modeは `Temperature=0.7`、`TopP=0.8`、`TopK=20`、`MinP=0` が推奨されている。
- Qwen公式model cardは、greedy decodingが性能劣化や反復につながる可能性に触れている。
- そのため、`Language mismatch` と反復は、model能力だけでなく、prompt不足と生成preset不一致を含む結果として扱う。
- 次の実測は、公式寄せpresetと、日本語指定・英語禁止・入力本文ありのJSON caseで分けて実行する。

## 実用タスク rakugo.learning.plan.001

実行日: 2026-09-04

落語学習を題材に、少し長めの日本語構造化出力を確認した。

| case_id | requested_max_new_tokens | effective_max_new_tokens | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.001` | 1200 | 1200 | 171.52 | 171.53 | 330 | 636 | 564 | 3.71 | 3.12 | false |

セル全体:

```text
cell_total_seconds: 171.53
default_max_new_tokens: 1200
model_context_limit: 40960
```

出力概要:

- `## 全体ステップ`、`## 反応の良さ`、`## 話の強弱と起承転結`、`## 盛り上がりの作り方`、`## 1人で練習できる詳細タスク5個`、`## 評価指標` は出た。
- 1200 token上限には到達していない。
- ただし「自然にできる」「質が向上する」の反復が多い。
- 練習タスク5個は出たが、各タスクの `目的 / 手順 / 完了条件` は分離されていない。
- `5段階評価基準` はpromptに入っていなかったため出ていない。

次の修正:

- `max_new_tokens` を1600にする。
- 出力形式に `5段階評価基準` と `この回答の自己チェック` を追加する。
- 各score 1から5に「満たしている条件」をチェックリスト形式で出させる。
- 反復を減らすため、抽象文のNG/OK例、重複回避ルール、見出しごとの主語の違いをpromptへ入れる。
- `話の強弱`、`起承転結`、`盛り上がり` は別軸に分ける。評価軸同士の関係は、点数基準ではなく `評価軸間の関係` として別に書かせる。

## 実用タスク rakugo.learning.plan.scored.001

実行日: 2026-09-04

5段階評価、自己チェック、反復抑制、Qwen公式寄せpresetを入れたpromptで実行した。

| case_id | requested_max_new_tokens | effective_max_new_tokens | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.scored.001` | 1600 | 1600 | 672.79 | 672.82 | 1214 | 1600 | 0 | 2.38 | 3.13 | true |

生成preset:

```json
{
  "do_sample": true,
  "temperature": 0.7,
  "top_p": 0.8,
  "top_k": 20,
  "min_p": 0
}
```

出力概要:

- `cell_total_seconds=672.83` 秒、約11分12.83秒。
- `prompt_tokens=1214` で、前回の330 tokenより大きく増えた。
- `new_tokens=1600`、`remaining_new_token_budget=0`、`hit_max_new_tokens=true` のため途中で切れている。
- `5段階評価基準` の途中で止まり、`この回答の自己チェック` には到達していない。
- `話の強弱`、`起承転結`、`盛り上がり` のscore条件に重複と混同がある。

AI目線の仮評価:

| field | score | 理由 |
|---|---:|---|
| `structure_score` | 2 | 見出しは出たが、評価基準途中で切れ、自己チェックが欠けた |
| `detail_score` | 2 | 一部具体例はあるが、抽象語と反復が多い |
| `practical_score` | 2 | 5タスクは出たが、手順が似ていて使い分けにくい |
| `transfer_score` | 2 | 転用に触れているが、場面別の具体例が少ない |
| `speed_score` | 1 | 11分超で、Colab CPUの反復実験には重い |

次の修正:

- `本文生成`、`評価基準生成`、`自己チェック` を別caseに分ける。
- 1回のpromptで全項目を出させる場合は、評価軸ごとにtokenを消費しすぎるため、1200から1600 tokenでは不足しやすい。
- `話の強弱`、`起承転結`、`盛り上がり` のscore条件は、それぞれの軸だけで判定させる。

評価軸混同の具体例:

| 評価軸 | 何を見るか | 今回混ざった例 | 修正後の例 |
|---|---|---|---|
| `話の強弱` | 声の大きさ、速さ、間、語尾 | score条件に `起承転結` と `盛り上がり` が入った | `声を強くした場所と間を置いた場所を3つ説明できる` |
| `起承転結` | 話の順番と役割 | score条件に `盛り上がり` が入った | `起=状況、承=追加、転=ズレ、結=短い落ちが分かれている` |
| `盛り上がり` | 聞き手の期待、ズレ、反応の山 | score条件に `起承転結` が入った | `相手の予想を作り、少しずらし、落ちの前に間を置ける` |

出力本文:

```markdown
## 全体ステップ
1. 落語の基本を学び、その意味と使い方を理解する。
2. 落語の役割と現実世界での会話への関連性を意識する。
3. 落語の強弱と起承転結を練習し、自然に取り入れる。
4. 盛り上がりの話し方と要素を学び、会話の質を向上させる。
5. 1人で練習できるタスクを5つを作成し、実践に活かす。

## 反応の良さ
- 落語の意味を理解し、現実世界での会話に適応できる。
- 言語の強弱と起承転結を意識し、会話の質が向上する。
- 盛り上がりの話し方を学び、会話の質と流れが向上する。

## 話の強弱と起承転結
- 強さ：言葉の意味や役割を明確にし、会話の焦点を示す。
- 起承転結：言葉の流れを明確にし、会話の流れが自然にできる。
- 試し方：語句の順序や関係性を意識し、会話の流れが自然にできる。

## 盛り上がりの作り方
- 盛り上がりの話し方：会話の終わりに自然な結びをつける。
- 要素：結びの意味や役割を明確にし、会話の終わりが自然にできる。
- セルコツ：会話の終わりに自然な結びをつける。

## 1人で練習できる詳細タスク5個
1. 落語の意味と役割を学び、会話に適応する。
2. 言語の強弱と起承転結を練習し、会話の流れが自然にできる。
3. 盛り上がりの話し方を学び、会話の質が向上する。
4. 落語の現実世界での会話への取り入れ方を練習し、会話が自然にできる。
5. 言語の使い方を確認し、会話が自然にできる。

## 評価指標
- 言語の意味と役割を理解し、現実世界での会話に適応できる。
- 言語の強弱と起承転結を意識し、会話の流れが自然にできる。
- 盛り上がりの話し方を学び、会話の質が向上する。
- 言語の使い方を確認し、会話が自然にできる。
```

## 実用タスク rakugo.learning.plan.scored.001 v3

実行日: 2026-09-04

評価軸分離、中学生向け説明、NG/OK例を追加したpromptで再実行した。

| case_id | requested_max_new_tokens | effective_max_new_tokens | generation_seconds | case_total_seconds | prompt_tokens | new_tokens | remaining_new_token_budget | tokens_per_second | ram_used_gb | hit_max_new_tokens |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `rakugo.learning.plan.scored.001` | 1600 | 1600 | 827.81 | 827.88 | 1906 | 1600 | 0 | 1.93 | 3.13 | true |

セル全体:

```text
cell_total_seconds: 827.9
default_max_new_tokens: 1600
model_context_limit: 40960
context_available_new_tokens: 39054
```

出力概要:

- `cell_total_seconds=827.9` 秒、約13分47.9秒。
- `prompt_tokens=1906` で、v2の `1214` よりさらに増えた。
- `new_tokens=1600`、`remaining_new_token_budget=0`、`hit_max_new_tokens=true` のため途中で切れている。
- `5段階評価基準` の `score 4` 途中で切れ、`この回答の自己チェック` と `評価軸間の関係` には到達していない。
- `反応の良さ`、`話の強弱`、`起承転結`、`盛り上がり` の間で、評価軸混同が残った。
- 5つの練習タスクは、同じ手順と完了条件の反復が多く、ケースごとの使い分けが弱い。
- `聽いている人` のような不自然な表記が混ざった。

v3で足りなかったもの:

| 不足 | 具体例 |
|---|---|
| チェックシート | `見ること / OK例 / NG例 / 記録する値` が分かれていない |
| 具体的な言い回し | 実際に口に出せるセリフが少ない |
| ケース練習 | 場面ごとの `起 / 承 / 転 / 結` の流れが薄い |
| 挟む内容 | 会話のどこに何を入れるかが弱い |
| 根拠 | なぜそれが良いか、なぜ面白いかの説明が足りない |

AI目線の仮評価:

| field | score | 理由 |
|---|---:|---|
| `structure_score` | 2 | 見出しは出たが、評価基準途中で切れ、自己チェックと評価軸間の関係が欠けた |
| `detail_score` | 2 | 具体例は増えたが、ケース別の言い回し、挟む内容、根拠が足りない |
| `practical_score` | 2 | 5タスクは出たが、同じ手順が反復され、練習として使い分けにくい |
| `transfer_score` | 2 | 日常会話への転用は書かれたが、場面別の会話例が薄い |
| `speed_score` | 1 | 約13分48秒で、Colab CPUの反復実験には重い |

判断:

- Colab無料CPUでの `Qwen/Qwen3-0.6B` 基礎実行、短文推論、長めpromptの挙動確認は完了。
- 長い日本語構造化promptを一発で完了品質へ持っていく用途では弱い。
- 次は `rakugo.learning.case.practice.001` として、ケース練習、言い回し、根拠だけを出すpromptに分ける。初期値は `max_new_tokens=2000`、重い場合は `1600` に下げる。
