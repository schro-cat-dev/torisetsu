# E. 調査ログ

## 冒頭確認

| 項目 | 内容 |
|---|---|
| いつ | 2026-09-04 JST |
| なんのために | 小型LLM、推論アーキテクチャ、リソース、ライセンスをfield lineage harness開発前に整理するため |
| 目的達成 | 達成。候補モデル、リソース目安、責務分離、残リスクを文書化した |
| 方向性 | field lineage harness へ接続する調査として維持 |

## 調査元と確認事実

| source | 確認事実 | 信頼性 | 残リスク |
|---|---|---|---|
| Qwen3 official blog | Qwen3シリーズは2025-04-29リリース。0.6B、1.7B、4BなどをApache-2.0で公開。日本語を含む119言語・方言に言及 | 一次確認相当 | blogやmodel cardの更新可能性 |
| Qwen/Qwen3-0.6B Hugging Face | 0.6B parameters、Apache-2.0、context length 32,768、GQAなど | 一次確認相当 | model card更新の可能性 |
| Qwen/Qwen3-0.6B LICENSE | Apache License 2.0 | 一次確認相当 | 派生配布版は別確認 |
| Qwen3 speed benchmark | Qwen3-0.6BのTransformers BF16 GPU memoryはinput length 1で1394MB、input length 30720で4755MB。Qwen3-4BのTransformers BF16 GPU memoryはinput length 1で7973MB、AWQ-INT4は2915MB | 一次確認相当 | GPU benchmarkでありCPU実測とは直接比較しない |
| Qwen/Qwen3-4B-Instruct-2507 Hugging Face | Apache-2.0、4.0B、Instruct専用、non-thinkingのみ、native context 262144 | 一次確認相当 | 実運用品質は同一caseで要実測 |
| DeepSeek-R1-Distill-Qwen-7B Hugging Face | MIT、Qwen2.5派生のR1 distill、7B級 | 一次確認相当 | CPU無料枠では重い可能性が高い |
| SmolLM3-3B-GGUF Hugging Face | 3B級、Apache 2.0、Q4系は約1.7-1.9GB、Q8_0は約3.28GB、BF16は約6.16GB | 配布元確認 | GGUF配布者と元modelの差分確認が必要 |
| OpenAI gpt-oss紹介 | gpt-oss-20bは21B total / 3.6B active、Apache 2.0、16GB memory目安、MoE、128k context | 一次確認相当 | usage policyの確認が必要 |
| OpenAI Help Center gpt-oss | self-managed、Apache 2.0、customize可能、OpenAI API/ChatGPT提供ではない | 一次確認相当 | 提供形態の更新可能性 |
| DeepSeek-R1 Hugging Face / docs | R1は671B total / 37B active、distill版に1.5B/7B/8B/14B/32B/70B、MIT表示 | 一次確認相当 | DeepSeek系はモデルごとのLICENSE差分に注意 |
| microsoft/Phi-3.5-mini-instruct Hugging Face | 過去候補として確認。3.8B dense decoder-only Transformer、MIT、128K context、日本語含む多言語評価 | 一次確認相当 | 現在の比較候補は `microsoft/Phi-4-mini-instruct` を優先 |
| google/gemma-3-270m Hugging Face | 270M級、licenseはgemma、利用条件同意が必要 | 一次確認相当 | Apache/MITではない |
| meta-llama/Llama-3.2-1B Hugging Face | Llama 3.2 Community License、gated、利用条件あり | 一次確認相当 | Apache/MITではない |

## モデル候補の扱い

| model | 初期扱い | 理由 |
|---|---|---|
| `Qwen/Qwen3-4B-Instruct-2507` | 第一比較候補 | 0.6Bより大きく、Instruct専用でnon-thinkingのみ。品質を見るならここから |
| `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` | reasoning比較候補 | R1 distill系。評価理由、分解、自己チェックで試す。自然な日本語会話例の第一候補にはしない |
| `SmolLM3-3B` | 軽量比較候補 | 3B級でApache-2.0、量子化配布が扱いやすい |
| `microsoft/Phi-4-mini-instruct` | 強め小型候補 | MITかつ3.8B級。ただし英語中心の注意と `trust_remote_code=True` を確認 |
| `Qwen/Qwen3-1.7B` | 軽量上位候補 | 0.6Bとの差分を見る。長文構造化だけで十分性を判断しない |
| `Qwen/Qwen3-0.6B` | 下限確認済み、micro-case比較は継続 | 長文構造化は実測で品質対コストが見合いにくいが、最小入力/最小出力では別途見る |
| `gpt-oss-20b` | 上位比較 | 強いが重い。最初の常用候補ではない |
| `Gemma 3 270M` | 保留 | 小さいがGemma licenseで別確認 |
| `Llama 3.2 1B` | 保留 | Llama独自ライセンスで別確認 |

## 参考URL

- https://huggingface.co/Qwen/Qwen3-0.6B
- https://huggingface.co/Qwen/Qwen3-0.6B/blame/refs%2Fpr%2F21/LICENSE
- https://qwenlm.github.io/blog/qwen3/
- https://github.com/QwenLM/Qwen3/blob/main/docs/source/getting_started/speed_benchmark.md
- https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507
- https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
- https://huggingface.co/microsoft/Phi-4-mini-instruct
- https://huggingface.co/HuggingFaceTB/SmolLM3-3B
- https://huggingface.co/ggml-org/SmolLM3-3B-GGUF
- https://huggingface.co/Mungert/SmolLM3-3B-GGUF
- https://openai.com/index/introducing-gpt-oss/
- https://help.openai.com/en/articles/11870455
- https://api-docs.deepseek.com/news/news250120/
- https://huggingface.co/microsoft/Phi-3.5-mini-instruct
- https://huggingface.co/google/gemma-3-270m/tree/main
- https://huggingface.co/meta-llama/Llama-3.2-1B/tree/main
