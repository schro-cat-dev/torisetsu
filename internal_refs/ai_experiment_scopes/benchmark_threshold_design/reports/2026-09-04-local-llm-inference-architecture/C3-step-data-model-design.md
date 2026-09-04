# C3. ステップ・データモデル設計

## 目的

モデル評価からfield lineage harness接続までの最小ステップと、保存するデータ形状を決める。

## ステップ

| Step | 名前 | 入力 | 出力 | 完了条件 |
|---|---|---|---|---|
| S1 | model catalog作成 | model card、LICENSE、実行方式 | `model_catalog.json` | licenseとsizeが埋まる |
| S2 | resource probe | local/Colab環境 | `resource_probe.result.json` | RAM、CPU/GPU、diskが出る |
| S3 | smoke inference | 短いprompt | `smoke.result.json` | JSONが壊れず返る |
| S4 | field classification | field候補 | `field_classification.result.json` | 分類とconfidenceが出る |
| S5 | lineage proposal | field候補と近傍コード | `lineage_proposal.result.json` | edge候補が出る |
| S6 | static verification | AST/LSP/schema | `lineage_verified.result.json` | confirmed/inferredが分かれる |
| S7 | benchmark summary | S1-S6の結果 | `model_eval_summary.md` | 採用/保留/除外が分かる |
| S8 | external consumer verification | `lineage_verified.result.json` | `consumer_check.result.json` | 下流がparse、保存、表示できる |

## モデルサイズとリソース目安

| サイズ | 4bit時の目安 | 使い所 | 注意 |
|---|---|---|---|
| 0.3B-0.7B | 1-2GB RAM級 | 疎通、短い分類、JSON整形 | 長文構造化は弱い |
| 1B-1.5B | 2-4GB RAM級 | 短いreasoning、field分類 | 複雑な依存判断は弱い |
| 3B | 4-8GB RAM級 | 実用最小候補 | CPUでは遅いことがある |
| 7B-8B | 8-16GB RAM/VRAM級 | コード理解、レビュー補助 | 常用コストを測る |
| 14B | 16-32GB級 | 強めの推論 | ローカル環境依存が大きい |
| 20B MoE | 16GB以上目安 | 強めreasoning | 小型候補ではなく上位比較 |

## 今回の実測と公式目安

| model | 条件 | memory / RAM | 速度 | 判断 |
|---|---|---:|---:|---|
| `Qwen/Qwen3-0.6B` | Colab無料CPU、実測 | 約3.08-3.13GB RAM | 約1.93-4.49 tokens/sec | 動くが、長文構造化生成では比較優先度低 |
| `Qwen/Qwen3-0.6B` | 公式Transformers BF16 GPU、input length 1 | 1394MB GPU memory | 公式表参照 | 疎通より速いGPU条件の目安 |
| `Qwen/Qwen3-0.6B` | 公式Transformers BF16 GPU、input length 30720 | 4755MB GPU memory | 公式表参照 | 長い入力ではKV cache等でmemoryが増える |
| `Qwen/Qwen3-4B` | 公式Transformers BF16 GPU、input length 1 | 7973MB GPU memory | 45.94 tokens/sec | 品質比較の第一候補だがCPU無料枠向きではない |
| `Qwen/Qwen3-4B` | 公式Transformers AWQ-INT4 GPU、input length 1 | 2915MB GPU memory | 51.57 tokens/sec | 量子化なら試しやすい |
| `Qwen/Qwen3-4B` | 公式Transformers AWQ-INT4 GPU、input length 30720 | 7742MB GPU memory | 481.69 tokens/sec | 長文入力はmemoryが増える |

注意:

- 上のQwen公式値はGPU benchmarkであり、Colab無料CPUの速度とは直接比較しない。
- 今回のCPU実測では、0.6Bでも2000 token生成に約14分かかった。
- 品質改善のために4B/7B級へ上げる場合、GPUまたは量子化ローカル実行を前提にする。

## field lineage データ例

```json
{
  "schemaVersion": "field-lineage-record.v1",
  "lineageId": "LIN-create-user-display-name-001",
  "source": {
    "fieldRef": "F1",
    "expression": "req.body.name",
    "file": "src/routes/users.ts",
    "line": 12,
    "origin": "http.request.body",
    "originDomain": "user",
    "fieldCategory": "domain"
  },
  "hops": [
    {
      "from": "F1",
      "to": "F2",
      "toExpression": "input.displayName",
      "transformKind": "rename",
      "evidenceState": "INFERRED",
      "confidence": 0.78
    },
    {
      "from": "F2",
      "to": "F3",
      "toExpression": "prisma.user.data.name",
      "transformKind": "rename_to_storage_column",
      "evidenceState": "EXTRACTED",
      "confidence": 0.91
    }
  ],
  "sink": {
    "fieldRef": "F3",
    "sinkType": "database",
    "system": "prisma",
    "model": "User",
    "column": "name",
    "file": "prisma/schema.prisma",
    "line": 18
  },
  "verification": {
    "status": "needs_review",
    "staticChecks": ["schema_column_exists"],
    "missingChecks": ["validator_required_match"]
  }
}
```

## field分類

| 分類 | 意味 | 例 |
|---|---|---|
| `domain` | 業務上の意味を持つ | `displayName`, `email`, `jobTitle` |
| `system` | システム制御用 | `tenantId`, `version`, `status` |
| `meta` | 記録・監査用 | `createdAt`, `updatedBy`, `sourceTool` |
| `security` | 権限・秘密・認証に関わる | `role`, `token`, `passwordHash` |
| `derived` | 計算・変換で作られる | `fullName`, `score`, `normalizedEmail` |

## micro-context評価case

```json
{
  "schemaVersion": "local-llm-field-lineage-eval-case.v1",
  "caseId": "create-user.display-name.001",
  "promptType": "field_lineage_proposal",
  "expected": {
    "jsonParse": true,
    "requiredFields": ["edges", "unknowns"],
    "minConfidenceForConfirmed": 0.8,
    "mustNotConfirmWithoutEvidence": true,
    "expectedCategories": {
      "req.body.name": "domain",
      "prisma.user.data.name": "domain"
    }
  },
  "metrics": {
    "maxLatencySeconds": 30,
    "maxRamGb": 8,
    "minJsonPassRate": 0.95,
    "minClassificationAccuracy": 0.85
  }
}
```

## モデル比較キュー

| 優先 | model | 評価粒度 | 見ること |
|---:|---|---|---|
| 1 | `Qwen/Qwen3-0.6B` | C0-C1 | 最小分類とJSON下限 |
| 2 | `Qwen/Qwen3-1.7B` | C0-C2 | 0.6Bとの差分 |
| 3 | `HuggingFaceTB/SmolLM3-3B` | C0-C3 | local実用最小として十分か |
| 4 | `Qwen/Qwen3-4B-Instruct-2507` | C0-C3 | 日本語・構造化出力の改善 |
| 5 | `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B` | C0-C4 | reasoningで曖昧caseが改善するか |
| 6 | `microsoft/Phi-4-mini-instruct` | C0-C3 | MIT候補として比較 |

## 性能十分性の合格ライン

| 指標 | 初期OK | 理由 |
|---|---:|---|
| JSON parse成功率 | 95%以上 | 下流runnerが止まると使えない |
| 必須field充足率 | 95%以上 | 保存契約を守る必要がある |
| field分類正解率 | 85%以上 | domain/system/meta/security分類に使うため |
| 未検証断定率 | 0% | 根拠なし確定を保存しないため |
| C0-C2平均latency | 30秒以内 | 反復評価に耐えるため |
| RAM | 8GB以内を優先 | ローカル常用の現実性を見るため |

## fine-tuning方針

| 対象 | やること | やらないこと |
|---|---|---|
| 初期 | LoRA/QLoRAで分類・edge候補へ特化 | base modelをゼロから学習しない |
| データ | 100-500件の高品質caseで開始 | 雑な会話ログをそのまま入れない |
| 出力 | JSON schema固定 | 自由作文で評価しない |
| 評価 | holdout caseで正解比較 | 学習データと同じcaseだけで判断しない |
