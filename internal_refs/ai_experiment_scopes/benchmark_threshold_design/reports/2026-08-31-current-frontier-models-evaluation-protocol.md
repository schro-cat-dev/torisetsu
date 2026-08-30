# 現行フロンティアモデル調査と検証プロトコル初版

作成日: 2026-08-31 JST

## 1. 結論

現時点の公開情報だけで、GPT-5.5、GPT-5.6、Claude Opus 5、Claude Fable 5 の「内部アーキテクチャ」を重み数、層数、MoE構成などまで事実として比較することはできない。各社が公開しているのは主に、モデルID、価格、context、出力上限、reasoning/thinking設定、利用可能機能、安全機構、ベンチ結果、system cardである。

そのため、次の方針で進める。

1. 未公開の内部構造推測は採用しない。
2. 公開ベンチは参考にするが、採用判断の主軸にしない。
3. このリポジトリの実作業に近い入力を固定し、出力契約、根拠、再現性、修正コストで判定する。
4. モデル比較は「一番賢いらしい」ではなく、同じ関門を同じ条件で通せるかで見る。

ユーザーの考え方に合わせるなら、これは「科挙」そのものではなく、AI出力を採用するための共通入試に近い。モデル名に関係なく、入出力がブレるなら、共通の規格と検査項目を置き、通ったものだけ採用する。

## 2. 信頼度の扱い

| 信頼度 | 情報源 | 採用方法 |
|---|---|---|
| A | OpenAI Docs、Claude Platform Docs、Anthropic公式system card/公式記事 | 事実の根拠に使う |
| B | SWE-bench、Terminal-Bench、Artificial Analysisなど独立ベンチ運営 | 公開ベンチの性質と傾向を見る |
| C | 個人ブログ、非公式まとめ、GitHub推測実装 | 論点発見だけに使う。事実認定には使わない |

注意: 非公式GitHub等で「Fable 5は何兆パラメータ」「MoE構成はこう」などの推測が見つかるが、公式根拠がない限り採用しない。

## 3. モデル別の公開事実

### 3.1 OpenAI GPT-5.6

| 項目 | 公開情報 |
|---|---|
| 代表モデル | `gpt-5.6-sol` |
| alias | `gpt-5.6` は `gpt-5.6-sol` にrouteされる |
| 位置づけ | GPT-5.6 familyのflagship |
| context window | 1,050,000 tokens |
| max output | 128,000 tokens |
| knowledge cutoff | 2026-02-16 |
| reasoning effort | `none`, `low`, `medium`, `high`, `xhigh`, `max` |
| 価格 | input $4/MTok、cached input $0.40/MTok、output $20/MTok |
| 特徴 | Programmatic Tool Calling、Multi-agent beta、explicit prompt caching、persisted reasoning、max reasoning effort |
| 安全機構 | cyber/biology misuse classifiersにより拒否・遅延が起きることがある |

根拠:
- OpenAI Docs: `gpt-5.6-sol` model page: https://developers.openai.com/api/docs/models/gpt-5.6-sol
- OpenAI Docs: latest model guidance: https://developers.openai.com/api/docs/guides/latest-model

### 3.2 OpenAI GPT-5.5

| 項目 | 公開情報 |
|---|---|
| model ID | `gpt-5.5` |
| 位置づけ | complex professional work向けflagship |
| context window | 1,050,000 tokens |
| max output | 128,000 tokens |
| knowledge cutoff | 2025-12-01 |
| reasoning effort | `none`, `low`, `medium`, `high`, `xhigh` |
| 価格 | input $5/MTok、cached input $0.50/MTok、output $30/MTok |
| 注意 | 272K input tokens超のpromptは追加課金条件あり |

根拠:
- OpenAI Docs: `gpt-5.5` model page: https://developers.openai.com/api/docs/models/gpt-5.5

### 3.3 Claude Opus 5

| 項目 | 公開情報 |
|---|---|
| model ID | `claude-opus-5` |
| 位置づけ | complex agentic coding and enterprise work向け |
| context window | 1M tokens |
| max output | 128K tokens |
| knowledge cutoff | 2026-05 |
| training data cutoff | 2026-05 |
| thinking | Adaptive |
| default effort | `high` |
| 価格 | input $5/MTok、output $25/MTok |
| 比較 | Anthropicは、Fable 5に近いfrontier intelligenceを半額で提供するモデルとして位置づけている |

根拠:
- Claude Platform Docs: Claude Opus 5 overview: https://platform.claude.com/docs/en/models/opus-5/overview
- Anthropic公式記事: Introducing Claude Opus 5: https://www.anthropic.com/news/claude-opus-5

### 3.4 Claude Fable 5

| 項目 | 公開情報 |
|---|---|
| model ID | `claude-fable-5` |
| 位置づけ | Anthropicの最も高性能な一般提供モデル |
| context window | 1M tokens |
| max output | 128K tokens |
| knowledge cutoff | 2026-01 |
| training data cutoff | 2026-01 |
| thinking | Adaptive, always on |
| default effort | `high` |
| 価格 | input $10/MTok、output $50/MTok |
| latency | Claude lineup内ではSlower |
| 安全機構 | safety classifiersにより拒否・fallbackが起きる |
| Mythos 5との関係 | Mythos 5は同じ基盤モデルで、一部safeguardが外された限定提供版 |

根拠:
- Claude Platform Docs: Claude Fable 5 overview: https://platform.claude.com/docs/en/models/fable-5/overview
- Anthropic公式記事: Claude Fable 5 and Mythos 5: https://www.anthropic.com/news/claude-fable-5-mythos-5
- Anthropic公式記事: Fable 5 cyber safeguards: https://www.anthropic.com/news/fable-safeguards-jailbreak-framework
- Anthropic公式記事: Improving Fable 5 biology safeguards: https://www.anthropic.com/news/improving-fable-5-s-biology-safeguards

## 4. 内部アーキテクチャについて言えること

### 4.1 断定できること

OpenAI側は、GPT-5.6で開発者向けの実行・制御機能が増えている。具体的には、Programmatic Tool Calling、Multi-agent beta、explicit prompt caching、persisted reasoning、`max` reasoning effort が公開されている。これはモデル内部の層構造ではなく、実行時の使い方と制御面の公開情報である。

Anthropic側は、Claude Opus 5とFable 5でAdaptive thinkingとeffortを公開している。Fable 5は安全分類器が組み込まれ、危険領域では拒否またはfallbackが発生する。Mythos 5はFable 5と同じ基盤モデルだが、限定提供で一部safeguardが外される。

### 4.2 断定しないこと

次は公開根拠がないため、このレポートでは採用しない。

- パラメータ数。
- layer数。
- MoEかdenseか。
- active parameters。
- training compute。
- 詳細なpretraining/post-training recipe。
- safety classifierの完全な判定式。

## 5. 公開ベンチの読み方

公開ベンチは有用だが、そのまま採用判断に使うと危ない。理由は、実行環境、agent harness、tool権限、試行回数、grader、モデル設定が揃っていないことがあるため。

参考にするベンチ:

| ベンチ | 何を見るか | 注意 |
|---|---|---|
| SWE-bench Verified | 実GitHub issueの解決率 | harness差、agent差を見る |
| Terminal-Bench | terminal上のagent work | バージョン差とタスク漏洩対策を見る |
| Artificial Analysis Intelligence Index | 複数evalの独立集計 | 指標構成が自分の業務と一致するとは限らない |
| GDPval-AA / AA-Briefcase | knowledge work系 | 業務成果物寄りの参考値として見る |
| Frontier-Bench / CursorBench | agentic coding | 新しいほど過学習リスクは下がるが、公開情報の詳細差に注意 |

根拠:
- SWE-bench: https://www.swebench.com/
- Terminal-Bench: https://www.tbench.ai/
- Artificial Analysis: https://artificialanalysis.ai/
- Artificial Analysis Openness Index methodology: https://artificialanalysis.ai/methodology/openness-index

## 6. 採用する検証プロトコル

### 6.1 基本ルール

同じ入力、同じ制約、同じ出力契約、同じgraderで比較する。

通過条件は3層に分ける。

| 層 | 目的 | 判定 |
|---|---|---|
| Gate 0: 事実・出典 | 存在しない事実を混ぜない | URL、日付、source tier、未確認ラベルがある |
| Gate 1: 出力契約 | 形を守る | JSON schemaまたはMarkdown templateを100%満たす |
| Gate 2: 実務品質 | 実際に使える | task別rubricで合格し、人間修正が少ない |

### 6.2 初期しきい値

| ID | 指標 | 条件 | 初期値 | 理由 |
|---|---|---:|---:|---|
| `model_eval.contract_pass_rate` | 出力契約通過率 | `==` | 100% | 形がブレると後続処理に流せない |
| `model_eval.critical_unsupported_claims` | 重要claimの根拠なし件数 | `==` | 0件 | 事実調査では最優先 |
| `model_eval.source_trace_rate` | claimからsourceへ辿れる率 | `>=` | 95% | 軽微な一般説明以外は辿れる状態にする |
| `model_eval.task_pass_rate` | task rubric合格率 | `>=` | 80% | 初期比較用。3回以上の実測で更新する |
| `model_eval.repeat_pass_count` | 同一case 3回実行で合格した回数 | `>=` | 3/3 | ブレを採用前に見る |
| `model_eval.human_revision_minutes` | 人間修正時間 | `<=` | baselineの70% | モデル変更の価値を時間で見る |
| `model_eval.cost_per_passed_case` | 合格caseあたり費用 | `<=` | baselineの120% | 高性能でも費用が膨らみすぎるなら用途限定 |
| `model_eval.false_refusal_or_fallback_rate` | 正当タスクで拒否/fallbackした率 | `<=` | 5% | 実務が止まるモデルは用途を分ける |

注意: 初期値は合格ラインではなく観察目安。最低3回の比較セットが溜まったら更新する。

## 7. ベンチケース設計

### 7.1 ケース種別

| case type | 測るもの | 入力例 | 期待出力 |
|---|---|---|---|
| `fact_research` | 根拠付き調査 | 最新モデル仕様を調べる | source付き要約、未公開事項の明示 |
| `code_patch` | 小さな実装 | 既存repoの1 bugを直す | diff、テスト結果、残リスク |
| `review_audit` | レビュー精度 | 意図的にbugを埋めたPR | 重要度、根拠行、修正案 |
| `harness_design` | 汎用runner設計 | 固定値混入したcheck script | config分離案、schema、検証手順 |
| `long_context_following` | 長文指示順守 | AGENTS.md + 具体作業 | ログ追記、禁止事項順守、ノイズ少 |
| `output_stability` | 出力ブレ | 同一promptを3回 | 同一schema、結論の矛盾0 |
| `safety_boundary` | 拒否/fallback影響 | 防御的security review | 正当作業が止まらないか |
| `cost_latency` | 実用コスト | 同じcaseを各effortで実行 | cost、latency、token、合格率 |

### 7.2 入力データ形式案

```json
{
  "schemaVersion": "model-eval-case.v1",
  "caseId": "fact_research.current_models.001",
  "taskType": "fact_research",
  "prompt": "GPT-5.6とClaude Fable 5の公開仕様を根拠付きで比較してください。",
  "constraints": [
    "公開根拠がない内部構造は断定しない",
    "source tierをA/B/Cで付ける",
    "未確認事項を明示する"
  ],
  "expectedOutputContract": "model-eval-report.v1",
  "grading": {
    "contractPass": true,
    "criticalUnsupportedClaimsMax": 0,
    "sourceTraceRateMin": 0.95,
    "humanReviewRequired": true
  }
}
```

### 7.3 出力結果形式案

```json
{
  "schemaVersion": "model-eval-result.v1",
  "runId": "2026-08-31T090000+09:00.gpt-5.6-sol.fact_research.current_models.001.r1",
  "model": "gpt-5.6-sol",
  "settings": {
    "reasoningEffort": "high",
    "temperature": 0
  },
  "caseId": "fact_research.current_models.001",
  "passed": false,
  "scores": {
    "contractPass": 1,
    "sourceTraceRate": 0.92,
    "taskRubricScore": 0.78
  },
  "violations": [
    {
      "policyId": "critical_unsupported_claim",
      "severity": "HIGH",
      "message": "Fable 5のパラメータ数を根拠なしに断定した"
    }
  ],
  "cost": {
    "inputTokens": 12000,
    "outputTokens": 3000,
    "usd": 0.108
  },
  "latencyMs": 42000,
  "humanReview": {
    "minutes": 12,
    "revisionCount": 3
  }
}
```

## 8. 実行順

1. `cases/` に10件のpilot caseを作る。
2. 各caseにexpected output contractとgraderを付ける。
3. GPT-5.5、GPT-5.6 Sol、Claude Opus 5、Claude Fable 5で同じcaseを3回ずつ実行する。
4. まず機械判定でGate 0とGate 1を見る。
5. Gate 2は人間レビューを入れ、修正時間と修正回数を記録する。
6. 3回分の結果で、合格率、ブレ、費用、拒否/fallbackを比較する。
7. 用途別に採用モデルを分ける。

## 9. 初期の用途別仮説

これはまだ実測前の仮説。

| 用途 | 第一候補 | 理由 | 要検証点 |
|---|---|---|---|
| 根拠付き調査 | GPT-5.6 Sol / Claude Opus 5 | 長文・tool・出典整理が重要 | 根拠なし断定、source trace |
| repo内実装 | GPT-5.6 Sol / Claude Opus 5 | agentic coding向け公開位置づけ | テスト実行、差分最小化 |
| UI/文章の仕上げ | GPT-5.6 Sol | OpenAI Docsがfrontend design改善を明記 | 実際のUI修正で過剰装飾しないか |
| 高難度の長時間作業 | Claude Fable 5 | Anthropicが高性能な一般提供モデルと位置づけ | 価格、latency、fallback |
| コスト重視の定常処理 | GPT-5.6 Terra/LunaまたはClaude Sonnet 5 | 価格と速度 | 今回対象外だが比較枠に入れる価値あり |

## 10. 次に作るもの

最小で次を作る。

| 成果物 | path案 | 目的 |
|---|---|---|
| case集 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/targets/model_eval_cases.md` | 何を測るか固定 |
| result schema | `internal_refs/ai_experiment_scopes/experiment_log_schema/model_eval_result_schema.md` | 実行結果の形を固定 |
| threshold追記 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/threshold_registry.md` | 今回のしきい値を台帳化 |
| version ledger追記 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/version_ledger.md` | いつ、なぜ追加したか残す |
| 初回pilot結果 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/` | 実測値を保存 |

## 11. 追加検証: 費用対品質

追加で見るべき中心論点は、「高価なモデルが本当に高い実務品質を出すのか」「安価なモデルでも、ゴール、チェックリスト、出力schema、評価基準を固定すれば同等品質を出せるのか」である。

この検証では、同じcaseを次の4条件で実行する。

| 条件 | 入力 |
|---|---|
| A | 自由promptのみ |
| B | ゴールと完了条件を追加 |
| C | B + チェックリスト |
| D | C + 出力schema + 評価基準 |

見る指標:

- `model_eval.token_reduction_rate`: baseline比のtoken削減率。初期目安は `>= 50%`。
- `model_eval.quality_retention_rate`: 高価モデルbaselineに対する品質維持率。初期目安は `>= 90%`。
- `model_eval.cheap_model_parity_rate`: 安価モデルが高価モデル同等と判定されたcase率。初期目安は `>= 70%`。
- `model_eval.scope_drift_count`: 依頼範囲外へ勝手に広げた件数。初期目安は `== 0件`。
- `model_eval.conclusion_conflict_count`: 同一case 3回実行で結論が矛盾した件数。初期目安は `== 0件`。

詳細は `targets/model_cost_quality_hypotheses.md` に分ける。

## 12. 残リスク

- 各社のsystem cardやモデルページは更新されるため、実行直前に再確認が必要。
- API availability、plan availability、価格は契約・地域・時期で変わる可能性がある。
- 公開ベンチは自分たちの実務品質を直接保証しない。
- Fable 5は安全機構が強いため、正当なsecurity/coding作業でもfallbackや拒否が起きる可能性がある。
- GPT-5.6のsafeguardもdual-use領域で遅延・拒否を起こす可能性がある。

## 13. 採用判断

次の条件を満たすまで、モデル変更を「本採用」としない。

1. pilot 10 cases x 3 runsでGate 0/1をすべて通る。
2. Gate 2のtask pass rateが80%以上。
3. 重要claimの根拠なし断定が0件。
4. 人間修正時間が現baselineより30%以上減る。
5. cost per passed caseがbaselineの120%以内。
6. 正当タスクでの拒否/fallbackが5%以下、または用途別routingで回避できる。
