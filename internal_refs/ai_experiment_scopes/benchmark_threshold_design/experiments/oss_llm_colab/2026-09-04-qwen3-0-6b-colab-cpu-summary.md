# Qwen3 0.6B Colab CPU Summary

作成日: 2026-09-04 JST

## 結論

Colab無料CPUで `Qwen/Qwen3-0.6B` を読み込み、短文推論と長めの日本語構造化promptを動かすところまでは確認できた。

このフェーズは完了扱いでよい。

ただし、性能評価としては「動くが、長い日本語構造化初稿を一発で任せるには弱い」。次はpromptを大きくするより、出力タスクを小さく分けて測る。

## 実測一覧

| run | case | prompt_tokens | new_tokens | generation_seconds | cell_total_seconds | tokens_per_second | hit_max_new_tokens | 観察 |
|---|---|---:|---:|---:|---:|---:|---|---|
| load | model load | - | - | - | 29.27 | - | - | RAM 3.08GBで読み込み成功 |
| smoke 160 | `reasoning.short.001` | 53 | 160 | 43.46 | 60.01 | 3.68 | true | 途中切れ |
| smoke 160 | `json.contract.001` | 35 | 71 | 16.53 | 60.01 | 4.29 | false | JSON形式だが内容は弱い |
| smoke 320 | `reasoning.short.001` | 53 | 320 | 84.76 | 100.6 | 3.78 | true | まだ途中切れ |
| smoke 860 | `reasoning.short.001` | 53 | 351 | 122.97 | 145.9 | 2.85 | false | 完結したが反復あり |
| rakugo v1 | `rakugo.learning.plan.001` | 330 | 636 | 171.52 | 171.53 | 3.71 | false | 見出しは出たが浅い |
| rakugo v2 | `rakugo.learning.plan.scored.001` | 1214 | 1600 | 672.79 | 672.83 | 2.38 | true | 評価基準途中で切れた |
| rakugo v3 | `rakugo.learning.plan.scored.001` | 1906 | 1600 | 827.81 | 827.9 | 1.93 | true | 評価軸分離後も混同と反復が残った |

## 分かったこと

- `max_new_tokens` を増やすと、途中切れは減ることがある。
- ただし、長いpromptで要求を増やすと、prompt tokenが増え、CPU推論は遅くなる。
- `1600` tokenでも、評価基準、自己チェック、評価軸間の関係まで一発で出すには足りなかった。
- 指示を増やしても、0.6Bでは評価軸混同と反復を十分には抑えられなかった。
- `Language mismatch` のJSON出力は、旧promptの入力不足と旧presetの影響を含むため、日本語非対応とは断定しない。

## AI目線の仮評価

| 評価 | score | 理由 |
|---|---:|---|
| 実行可能性 | 4 | Colab無料CPUでloadとgenerateはできた |
| 短文推論 | 3 | 短い出力なら完結するが、内容品質は安定しない |
| 長文構造化 | 2 | 見出しは出るが、反復、浅さ、途中切れが残る |
| 日本語実用性 | 2 | 日本語は出るが、不自然な表記と抽象表現が混ざる |
| 反復実験速度 | 1 | 1600 token級で11分から14分かかる |

## 今回の完了条件

- Colab無料CPU環境を記録した。
- `Qwen/Qwen3-0.6B` のmodel loadを記録した。
- 短文推論を `160/320/860` token条件で記録した。
- `max_new_tokens` とcontext上限の扱いを記録した。
- Qwen公式寄せpresetを使った長めpromptを記録した。
- v3の実行結果から、長い一発prompt方式の限界を記録した。
- 次フェーズ用の `rakugo.learning.case.practice.001` promptをrunbookに追加した。

## 次フェーズ

| step | やること | 理由 |
|---|---|---|
| 1 | `rakugo.learning.case.practice.001` を実行する | 言い回し、ケース練習、会話の流れ、根拠だけに絞って見る。初期値は `max_new_tokens=2000`、重ければ `1600` に下げる |
| 2 | 本文、評価基準、自己チェックを別caseに分ける | 一発promptの途中切れと混同を避ける |
| 3 | 日本語JSON caseを作り直す | `Language mismatch` がprompt不足かを切り分ける |
| 4 | 簡易checkerを作る | 見出し不足、score重複、途中切れを人手だけにしない |
| 5 | Colab GPUまたはローカル量子化と比較する | CPU性能の影響を切り分ける |

## 関連リンク

- [Runbook](../../runbooks/2026-09-04-oss-llm-colab-local-runbook.md)
- [Experiment Log](2026-09-04-qwen3-0-6b-colab-cpu-minimal-inference.md)
