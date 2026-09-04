# Qwen3 0.6B Colab CPU Summary

作成日: 2026-09-04 JST

## 結論

Colab無料CPUで `Qwen/Qwen3-0.6B` を読み込み、短文推論と長めの日本語構造化promptを動かすところまでは確認できた。

このフェーズは完了扱いでよい。

採用判断は `不採用`。

理由は、性能評価として「動くが、長い日本語構造化初稿を一発で任せるには弱い」ため。v4でケース練習に絞っても意味の保持が弱かったため、この0.6B CPU条件で一気に構造化して出させる方針は打ち止めでよい。

次は、小型LLMに生成させるより、独自に蓄積した引用、言い回し、判断基準、OK/NG例、根拠を引っ張ってくる方向へ切り替える。

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
| rakugo v4 | `rakugo.learning.case.practice.001` | 860 | 2000 | 846.69 | 846.78 | 2.36 | true | ケース練習に絞っても同文反復になった |

## 分かったこと

- `max_new_tokens` を増やすと、途中切れは減ることがある。
- ただし、長いpromptで要求を増やすと、prompt tokenが増え、CPU推論は遅くなる。
- `1600` tokenでも、評価基準、自己チェック、評価軸間の関係まで一発で出すには足りなかった。
- 指示を増やしても、0.6Bでは評価軸混同と反復を十分には抑えられなかった。
- promptをケース練習に絞っても、OK/NG例、会話の流れ、面白くなる根拠が同じ文に潰れた。
- 出力品質に対して実行時間が重く、システム部品として組み込む価値は低い。
- `Language mismatch` のJSON出力は、旧promptの入力不足と旧presetの影響を含むため、日本語非対応とは断定しない。

## モデルとリソース

| 項目 | 値 |
|---|---|
| model | `Qwen/Qwen3-0.6B` |
| 公開時期 | Qwen公式blogではQwen3シリーズが2025-04-29リリース。Hugging Faceのmodel cardでは、関連paper `Qwen3 Technical Report` が2025-05-14公開 |
| license | Apache-2.0 |
| parameters | 0.6B |
| context | model card上は32,768。2026-09-04時点の `config.json` 実確認では `max_position_embeddings=40960` |
| 公式GPU目安 | Qwen公式speed benchmarkのTransformers BF16では、input length 1でGPU memory 1394MB、input length 30720で4755MB |
| 今回のColab CPU実測 | CPU 2、RAM 12.67GB、model load後RAM約3.08GB、長文生成時RAM約3.13GB |
| 今回のCPU速度 | 長めpromptで約1.93から2.36 tokens/sec |

## AI目線の仮評価

| 評価 | score | 理由 |
|---|---:|---|
| 実行可能性 | 4 | Colab無料CPUでloadとgenerateはできた |
| 短文推論 | 3 | 短い出力なら完結するが、内容品質は安定しない |
| 長文構造化 | 1 | 見出しは出るが、反復、浅さ、途中切れ、意味保持の弱さが残る |
| 日本語実用性 | 2 | 日本語は出るが、不自然な表記と抽象表現が混ざる |
| 反復実験速度 | 1 | 1600 token級で11分から14分かかる |

## 今回の完了条件

- Colab無料CPU環境を記録した。
- `Qwen/Qwen3-0.6B` のmodel loadを記録した。
- 短文推論を `160/320/860` token条件で記録した。
- `max_new_tokens` とcontext上限の扱いを記録した。
- Qwen公式寄せpresetを使った長めpromptを記録した。
- v3の実行結果から、長い一発prompt方式の限界を記録した。
- v4の実行結果から、ケース練習へ絞っても意味保持が弱いことを記録した。

## 次フェーズ

| step | やること | 理由 |
|---|---|---|
| 1 | 独自引用・ナレッジ取得ツールを実用化する | 生成ではなく、蓄積済みの良い材料を引く方が品質とコストの釣り合いがよい |
| 2 | `citation-knowledge-item.v1` を決める | 引用、言い回し、根拠、OK/NG例を同じ型で扱う |
| 3 | `select-knowledge` と `render-context-pack` を作る | AIへ全部読ませず、今回必要な材料だけ渡す |
| 4 | `check-output-grounding` を作る | 出力がどの引用やナレッジに基づくか確認する |
| 5 | 小型LLMは分類、抽出、整形の補助に限定する | 長文生成より失敗範囲を小さくできる |

## 次に試すモデル候補

同じColab無料CPUで高品質化する前提では見ない。
品質を見るなら、GPUまたは量子化ローカル実行を前提にする。

| 優先 | model | license | 見る理由 | 注意 |
|---:|---|---|---|---|
| 5 | `Qwen/Qwen3-4B-Instruct-2507` | Apache-2.0 | Qwen3-0.6Bより明確に大きく、Instruct専用でnon-thinkingのみ。日本語を含む多言語・文章生成・指示追従の改善を見る第一候補 | Colab無料CPUでは重い。公式GPU benchmarkではTransformers BF16で約8GB級から見る |
| 4 | `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` | MIT | reasoning distill系。判断、分解、評価理由を出す用途で比較候補になる | 7Bで重い。会話文の自然さより推論寄りとして見る |
| 3 | `microsoft/Phi-4-mini-instruct` | MIT | 3.8Bで、制約環境と強いreasoningを意図したモデル | model card上、英語中心の注意があり、Transformers利用に `trust_remote_code=True` が出るためセキュリティ確認が必要 |
| 3 | `HuggingFaceTB/SmolLM3-3B` / GGUF | Apache-2.0 | 3B級で軽め。GGUF Q4_K_Mは約1.92GBで試しやすい | 日本語品質は要実測。採用候補というより軽量比較候補 |
| 2 | `Qwen/Qwen3-1.7B` | Apache-2.0 | 0.6Bより軽い上位候補として切り分けに使える | 今回の失敗を見る限り、長文構造化の本命にはしない |

現時点のおすすめ:

- 採用候補として最初に見るなら `Qwen/Qwen3-4B-Instruct-2507`。
- DeepSeekは、落語のような自然な会話例より、評価理由、分解、判定、自己チェックで試す。
- どのモデルでも、独自引用・ナレッジ取得を主役にし、LLMは整形と補助に寄せる。

## 候補モデル参照元

確認日: 2026-09-04

| source | URL | この文書で使った事実 |
|---|---|---|
| Qwen3 official blog | https://qwenlm.github.io/blog/qwen3/ | Qwen3シリーズは2025-04-29リリース。0.6B、1.7B、4Bなどのdense modelをApache-2.0で公開。日本語を含む119言語・方言に言及 |
| Qwen/Qwen3-0.6B | https://huggingface.co/Qwen/Qwen3-0.6B | Apache-2.0、0.6B、model card上のcontext lengthは32768、関連paperは2025-05-14公開 |
| Qwen3 speed benchmark | https://github.com/QwenLM/Qwen3/blob/main/docs/source/getting_started/speed_benchmark.md | Qwen3-0.6Bと4BのTransformers BF16/AWQ-INT4 GPU memory目安 |
| Qwen/Qwen3-4B-Instruct-2507 | https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507 | Apache-2.0、4.0B、Instruct専用、non-thinkingのみ、native context 262144 |
| DeepSeek-R1-Distill-Qwen-7B | https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B | MIT、Qwen2.5派生のR1 distill、7B級 |
| microsoft/Phi-4-mini-instruct | https://huggingface.co/microsoft/Phi-4-mini-instruct | MIT、3.8B、128K context、24 languages。ただし英語中心の注意と `trust_remote_code=True` の確認が必要 |
| SmolLM3-3B | https://huggingface.co/HuggingFaceTB/SmolLM3-3B | Apache-2.0、3B級 |
| SmolLM3-3B-GGUF | https://huggingface.co/ggml-org/SmolLM3-3B-GGUF | Apache-2.0、GGUF Q4_K_Mは約1.92GB、Q8_0は約3.28GB、F16は約6.16GB |

## 関連リンク

- [Runbook](../../runbooks/2026-09-04-oss-llm-colab-local-runbook.md)
- [Experiment Log](2026-09-04-qwen3-0-6b-colab-cpu-minimal-inference.md)
- [Citation Knowledge Retrieval Productization](../../../skill_orchestration_harness/citation-knowledge-retrieval-productization.md)
