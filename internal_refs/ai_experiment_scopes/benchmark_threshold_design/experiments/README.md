# ベンチマーク実測置き場

このディレクトリには、対象ごとの実測結果を置く。

## ファイル名例

```text
2026-08-25-phase1-todo-review-baseline.md
2026-08-25-phase1-todo-review-repeat-1.md
```

## 最小記録

```text
対象:
閾値版:
入力:
実測値:
解釈:
閾値との差:
次の修正:
```

## 対象別の実測

| 対象 | ディレクトリ | 見ること |
|---|---|---|
| ハーネス改善効果 | `harness_effectiveness/` | 修正回数、所要時間、品質条件通過率の改善履歴 |
| OSS LLM Colab試行 | `oss_llm_colab/` | Colab無料CPUでのmodel load、推論時間、出力契約、失敗内容 |

## OSS LLM Colab試行

- [Qwen3 0.6B Colab CPU Summary](oss_llm_colab/2026-09-04-qwen3-0-6b-colab-cpu-summary.md): 基礎検証の結論、実測一覧、次フェーズ。
- [Qwen3 0.6B Colab CPU Minimal Inference](oss_llm_colab/2026-09-04-qwen3-0-6b-colab-cpu-minimal-inference.md): 実行結果、prompt修正、失敗観察、評価軸混同の証跡。
