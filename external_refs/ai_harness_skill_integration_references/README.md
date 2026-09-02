# AIハーネス・Skill外部統合参照

作成日: 2026-08-31

## 目的

Googleや外部の評価ハーネス、agent framework、skill集を調査し、このリポジトリのハーネスへ統合する候補を決める。

ここでの統合は、外部repoをそのまま採用することではない。外部repoの使える部分を、既存の `case -> raw log -> grader -> observation -> check result -> proposal` の流れへ接続できる形にすること。

関連ログ:

- [2026-09-03-review-log.md](2026-09-03-review-log.md): 外部候補を見た後の講評、採用判断、除外理由。

## 講評ログの反映状況

2026-09-03時点の講評は、この文書の候補表と除外扱いへ反映済み。

| 反映内容 | 反映先 |
|---|---|
| `anthropics/skills` と `composio-community/awesome-codex-skills` を評価 1/10、使わない扱いに変更 | `今回の除外扱い`、`推奨候補`、`調査元` |
| `microsoft/SkillOpt` はrepoとして評価 1/10、除外扱い | [2026-09-03-review-log.md](2026-09-03-review-log.md) |
| `addyosmani/agent-skills` は構造参照、`obra/superpowers` は部分参照、`alibaba/open-code-review` は設計参照 | [2026-09-03-review-log.md](2026-09-03-review-log.md) |
| 外部repoは原則install / copy / vendoringせず、設計観点だけ参照する | [2026-09-03-review-log.md](2026-09-03-review-log.md) |

## 対象

- LLM / agent の評価ハーネス。
- prompt、model、agent workflow の比較ツール。
- coding agent が読む skill / plugin / instruction 集。
- trace、token、latency、tool call、結果保存を扱う観測基盤。

## 非ゴール

- 外部repoを無条件で依存に入れる。
- Google Cloud、Vertex AI、SaaSへすぐ接続する。
- secret、課金、deploy、本番データを使う。
- 既存のローカルハーネスを外部ツールに置き換える。

## 統合判断の基準

| 観点 | 見ること | OK条件 |
|---|---|---|
| 信頼性 | 公式組織、更新状況、license、issue状況 | 出所とlicenseが確認できる |
| 既存設計との相性 | case、grader、result、traceへ分けられるか | local schemaへ変換できる |
| 再現性 | 同じ入力で繰り返し実行できるか | configまたはdatasetで固定できる |
| 費用制御 | API keyなし、local、fixture、dry runがあるか | 無課金または低課金でpilot可能 |
| 観測値 | token、latency、tool call、status、scoreを取れるか | model drift metricsへ写せる |
| 導入コスト | 既存Node/Python構成に足せるか | 小さいpilotを1日以内に作れる |
| ロックイン | 特定cloudやproviderに寄りすぎないか | adapter経由で隔離できる |

## 信用チェック

| ランク | 条件 | 今回の扱い |
|---|---|---|
| A | 公式組織または公的機関のrepo/docs。license、実行方法、評価対象が確認できる | 主要な事実根拠に使う |
| B | 広く使われているOSS。docs、license、実行方法が確認できる | pilot候補にする |
| C | 個人記事、非公式mirror、出所不明のまとめ | 事実根拠に使わない |

今回のA扱い:

- `google/agents-cli`
- `GoogleCloudPlatform/evalbench`
- Google ADK eval docs
- `GoogleCloudPlatform/agent-starter-pack`
- `UKGovernmentBEIS/inspect_ai`
- SWE-bench harness docs

今回のB扱い:

- `promptfoo/promptfoo`
- `Arize-ai/phoenix`
- `confident-ai/deepeval`
- Ragas docs
- `langchain-ai/langgraph`

今回の除外扱い:

- `composio-community/awesome-codex-skills`: 評価 1/10。個別skillの内容が薄く、実務用の根拠確認、失敗時の扱い、出力契約が不足するため使わない。
- `anthropics/skills`: 評価 1/10。公開skill集としての形式参照はできるが、このリポジトリのskill移行元としては薄いため使わない。

注意:

- Bでも採用不可ではない。実行結果をlocal schemaへ変換でき、licenseと運用コストを確認できればpilot対象にする。
- Aでも無条件採用しない。Google Cloud認証、課金、deployが必要なものはv1では直接実行しない。

## この文書の完了条件

| ID | 完了条件 | 判定方法 |
|---|---|---|
| EIP-01 | 何を調査するための文書か分かる | `目的` と `対象` がある |
| EIP-02 | 外部repoをなぜ見るか分かる | 推奨候補ごとに `調査・統合する理由` がある |
| EIP-03 | 何を統合するか分かる | 推奨候補ごとに `推奨する統合` がある |
| EIP-04 | どの順で動くか分かる | `最初の実行順` がある |
| EIP-05 | タスク化されている | `EXT-*` のすることリストがある |
| EIP-06 | 統合可否の線引きがある | `統合しない条件` がある |
| EIP-07 | 根拠を後から確認できる | `調査元` にURLと使った事実がある |

## 推奨候補

優先度は `このリポジトリのAI評価・skill運用へ統合する視点` で、5が高い。

| 優先 | repo / docs | 種別 | 確認できた事実 | 調査・統合する理由 | 推奨する統合 |
|---:|---|---|---|---|---|
| 5 | `GoogleCloudPlatform/evalbench`<br>https://github.com/GoogleCloudPlatform/evalbench | agentic eval / DB eval harness | Google Cloud Platform配下。NL2SQL/database評価と、Gemini CLI、Claude Code、Codex CLIなどを動かすagentic evaluationsを持つ。scenario、conversation plan、tool call、latency、token、sandbox、fake MCPに言及がある。 | 今のモデルドリフト監視で欲しい `複数agent CLI比較`、`tool call trace`、`token/latency`、`offline stub` に近い。 | L0からL3のpilot対象。`EvalBench result -> model-drift-watch-observation.v1` へ変換するadapterを作る。 |
| 5 | `google/agents-cli`<br>https://github.com/google/agents-cli | Google agent CLI / skills | Google配下。Codex、Claude Code、Gemini CLI等で使うskillsを含む。eval run、eval compare、eval analyze、skill management、observability系skillがある。 | Google系agent開発で、skillの粒度、eval、observability、deployをどう分けているか参照できる。skill統合の設計材料になる。 | 直接install前に、`skills/google-agents-cli-eval` と `google-agents-cli-observability` を読み、ローカルskillへの翻訳候補を作る。 |
| 5 | `promptfoo/promptfoo`<br>https://github.com/promptfoo/promptfoo | prompt / model eval / red team | MIT license。CLIと宣言的configで、OpenAI、Anthropic、Gemini等を比較し、CI/CDやred teamingも扱う。 | prompt、model、provider比較をconfig化しやすい。既存の `smoke case` と相性がよい。 | `promptfooconfig.yaml` pilotを作り、出力JSONをlocal observationへ変換する。red teamは後回し。 |
| 4 | `UKGovernmentBEIS/inspect_ai`<br>https://github.com/UKGovernmentBEIS/inspect_ai | LLM evaluation framework | UK AI Security Institute作成。prompt engineering、tool usage、multi-turn dialog、model-graded eval、拡張Python package、200件超のpre-built evalに言及がある。 | 評価設計の品質が高い参照になる。tool use、multi-turn、scorer分離を既存grader設計の比較対象にできる。 | すぐ依存追加せず、grader設計とcase formatの比較資料として読む。必要ならPython pilotを作る。 |
| 4 | `Arize-ai/phoenix`<br>https://github.com/Arize-ai/phoenix | observability / eval / dataset / experiment tracking | open-source AI observability。OpenTelemetry trace、evaluation、versioned datasets、experiments、prompt management、OpenAI/Anthropic/Google ADK等のintegrationsに言及がある。 | 現在はfile ledgerで足りるが、runが増えるとtrace検索とdataset管理が必要になる。 | v1では採用しない。model drift runが20本を超えたら、local Phoenixでtrace保存をpilotする。 |
| 4 | Google ADK eval docs<br>https://github.com/google/adk-docs/blob/main/docs/evaluate/index.md | ADK agent evaluation | ADKはagent evaluationでtrajectory/tool useとfinal responseを分け、test files、evalset、CLI `adk eval`、criteriaを持つ。 | Gemini/ADK agentを作る場合、評価caseとtrajectoryの考え方がそのまま使える。 | ADK agentを作る段階で統合。今は評価項目の設計参照にする。 |
| 3 | `GoogleCloudPlatform/agent-starter-pack`<br>https://github.com/GoogleCloudPlatform/agent-starter-pack | Google agent project template | Google Cloud Platform配下。READMEでmaintenance modeと、active developmentが `agents-cli` へ移ったことが明記されている。CI/CD、evaluation、observability、deployment templateを持つ。 | 既存Google agent projectの構造や移行判断の参照になる。ただし新規導入の第一候補ではない。 | 新規導入はしない。template構成とmigration観点だけ読む。 |
| 3 | SWE-bench harness docs<br>https://www.swebench.com/SWE-bench/api/harness/ | coding benchmark harness | `run_evaluation`、grading、reporting、log parserなどのharness APIがある。 | 実GitHub issue修正の評価方法、patch評価、run log設計の参照になる。 | 汎用導入はしない。coding task benchmarkを作る時に、ログとreport形式を参照する。 |
| 3 | `confident-ai/deepeval`<br>https://github.com/confident-ai/deepeval | LLM unit testing / metrics | Pytestに近いLLM評価、G-Eval、task completion、answer relevancy、hallucination、JSON correctness、CI/CD、OpenAI/Anthropic/Google ADK integrationsに言及がある。 | PythonでLLM unit testを書きたい場合に使いやすい。 | LLM-as-judge比率が高いので、初期v1では採用しない。機械判定で足りない評価だけ後でpilotする。 |
| 2 | `explodinggradients/ragas`<br>https://docs.ragas.io/en/v0.3.4/tutorials/rag/ | RAG evaluation | RAG向けにcontext precision、context recall、faithfulness、response relevancy等を扱う。 | RAGや検索拡張を作る場合に必要になる。 | RAG対象が出るまで保留。今のモデルドリフトsmokeには入れない。 |
| 2 | `langchain-ai/langgraph`<br>https://github.com/langchain-ai/langgraph | stateful agent runtime | 長時間・状態ありagent、durable execution、human-in-the-loop、memory、debuggingに言及がある。 | agent orchestrationを作る時の実装候補。評価ハーネスそのものではない。 | 評価基盤ではなくruntime候補として別管理。今回の統合対象からは外す。 |
| 1 | `anthropics/skills`<br>https://github.com/anthropics/skills | Claude skill set / plugin marketplace | Claude Code、Claude.ai、APIで使うskill sets。Claude Code plugin marketplaceとして追加できる。document-skills、example-skillsに言及がある。 | 形式参照はできるが、実務上の判断、根拠確認、失敗時の扱いが薄い。 | 評価 1/10。使わない。 |
| 1 | `composio-community/awesome-codex-skills`<br>https://github.com/composio-community/awesome-codex-skills | community Codex skill collection | 個別skill例では用途説明、手順、出力テンプレートが中心。 | 実務用skillに必要な根拠URL、スコア算出、鮮度、除外条件、検証方法が不足する。 | 評価 1/10。使わない。 |

## 追加確認候補の扱い

2026-09-03に追加で確認した候補。詳細な講評は [2026-09-03-review-log.md](2026-09-03-review-log.md) に残す。

| repo / docs | 扱い | 理由 |
|---|---|---|
| `addyosmani/agent-skills`<br>https://github.com/addyosmani/agent-skills | 構造参照 | 公開skill集としては比較的良い。`When to Use`、手順、verification、red flagsの揃え方だけ参考にする。 |
| `obra/superpowers`<br>https://github.com/obra/superpowers | 部分参照 | TDD / debuggingの強制力は参考になるが、運用思想が硬いため丸ごと採用しない。 |
| `alibaba/open-code-review`<br>https://github.com/alibaba/open-code-review | 設計参照 | Go実装の実ツール。決定的処理 + agent分離は参考になるが、導入より自作を優先する。 |
| `meridianlabs-ai/inspect-skills`<br>https://github.com/meridianlabs-ai/inspect-skills | 条件付き参照 | Inspect AIを使う場合だけ、eval log運用skillとして見る。 |
| `vercel-labs/agent-skills`<br>https://github.com/vercel-labs/agent-skills | 条件付き参照 | React / Next / Vercel領域に限って見る。汎用skill移行元にはしない。 |
| `microsoft/SkillOpt`<br>https://github.com/microsoft/SkillOpt | 除外 | repoとして評価 1/10。構成がぱっと読みにくく、自作ベンチ優位の訴求が強いため採用判断に合わない。 |
| `awesome-*` 系の一覧repo / directory site | 除外 | リンク集は薄いskillを混ぜる入口になりやすい。原則として採用判断の根拠にしない。 |

## 結論

最初に統合する候補は、次の3つに絞る。

1. `GoogleCloudPlatform/evalbench`
2. `google/agents-cli`
3. `promptfoo/promptfoo`

理由:

- `EvalBench` は、Codex CLI、Claude Code、Gemini CLIを同じagentic evaluationで扱う方向が今の検証目的に近い。
- `agents-cli` は、Google側のskill、eval、observabilityの分け方を参照できる。
- `promptfoo` は、prompt/model/provider比較を宣言的configで回しやすく、現行のsmoke caseと接続しやすい。

`Inspect AI` と `Phoenix` は第2候補にする。評価設計やtrace管理として有用だが、最初に入れると依存と運用が重くなる。

## 統合方針

| レベル | 内容 | このリポジトリでの扱い |
|---|---|---|
| L0 調査 | README、docs、license、実行前提、出力形式を読む | このファイルへ根拠を残す |
| L1 参照 | 外部repoの良い型だけ取り出す | local docs / schemaへ反映する |
| L2 wrapper | 外部CLIをlocal harnessから呼ぶ | `external-tool-spec` で実行する |
| L3 adapter | 外部resultをlocal schemaへ変換する | `model-drift-watch-observation.v1` へ写す |
| L4 依存採用 | packageとして正式に依存へ入れる | pilot結果と手動承認後だけ |

v1では L0 から L3 までを対象にする。L4は、実行結果、導入コスト、保守コストを見てから判断する。

## することリスト

| ID | タスク | 優先度 | 想定時間 | ユーザー依頼との関係 | 完了条件 | やらない場合のリスク |
|---|---|---:|---:|---|---|---|
| EXT-01 | 外部repo候補のsource catalogをJSON化する | 5 | 45分 | おすすめrepoの根拠を固定する | repo URL、license、用途、統合候補、採用判断がJSONで残る | 後で参照理由が曖昧になる |
| EXT-02 | `EvalBench` の出力形式とagentic dataset形式を読む | 5 | 1.5時間 | Codex/Claude/Gemini比較の候補確認 | local adapterで必要なfield一覧が出る | CLI比較を自作しすぎる |
| EXT-03 | `promptfoo` の最小config pilotを作る | 5 | 2時間 | prompt/model比較を低コストで回す | smoke 1件をpromptfooで実行またはAPIなしskipできる | provider比較がlocal schemaだけに閉じて遅くなる |
| EXT-04 | `agents-cli` のskill構成を調査する | 5 | 1.5時間 | Google系skill統合候補の確認 | 取り込む候補、取り込まない候補、理由が表になる | skill導入が雰囲気判断になる |
| EXT-05 | 外部resultをlocal observationへ変換するadapter設計を作る | 5 | 1時間 | model drift watchへの接続 | input/output schemaとNG例がある | 外部ツール結果が台帳に残らない |
| EXT-06 | `Inspect AI` のscorer/case設計をgrader設計と比較する | 4 | 1時間 | grader品質の比較参照 | local graderへ足す候補と足さない候補が分かる | 評価設計が独自基準だけになる |
| EXT-07 | `Phoenix` のtrace保存を後段候補として評価する | 3 | 1時間 | 実行ログ増加時の検索性 | 導入判断条件が決まる | run数が増えた時にログ探索が重くなる |
| EXT-08 | `Anthropic skills` と `awesome-codex-skills` を除外候補として記録する | 1 | 15分 | 薄い公開skill集を混ぜない | 評価 1/10、使わない理由が残る | 外部skillをそのまま混ぜる危険が残る |
| EXT-09 | 外部統合pilot結果を `benchmark_threshold_design/experiments/` に残す | 5 | 30分 | 証跡管理 | 実行コマンド、結果、判断、残リスクが残る | 導入判断を後から検証できない |

## 最初の実行順

1. `EXT-01` でsource catalogを作る。
2. `EXT-02` で `EvalBench` を読む。
3. `EXT-05` で `EvalBench -> observation` adapter設計を書く。
4. `EXT-03` で `promptfoo` の最小pilotを作る。
5. `EXT-04` で `agents-cli` skillを読む。
6. `EXT-09` でpilot結果を保存する。

この順番にする理由:

- 先に候補一覧を固定しないと、途中で調査対象が増え続ける。
- `EvalBench` は今のCLI比較と近いため、最初に適合性を見る。
- `promptfoo` はprompt/model比較の導入が軽い。
- `agents-cli` はskill設計参照として有用だが、いきなりinstallしない。

## 統合時の入出力

### 外部repo source catalog

```json
{
  "schemaVersion": "external-ai-harness-source-catalog.v1",
  "createdAt": "2026-08-31",
  "sources": [
    {
      "sourceId": "googlecloudplatform.evalbench",
      "url": "https://github.com/GoogleCloudPlatform/evalbench",
      "type": ["agentic-eval", "db-eval"],
      "verifiedFacts": [
        "GoogleCloudPlatform organization",
        "agentic evaluations mention Gemini CLI, Claude Code, Codex CLI",
        "records text, tool calls, latency, tokens"
      ],
      "integrationDecision": "pilot-first",
      "targetLocalSchema": "model-drift-watch-observation.v1"
    }
  ]
}
```

### 外部result adapter

```json
{
  "schemaVersion": "external-harness-result-adapter.v1",
  "adapterId": "evalbench-to-model-drift-observation",
  "input": {
    "sourceTool": "GoogleCloudPlatform/evalbench",
    "resultFile": "<external-result.json>"
  },
  "output": {
    "schemaVersion": "model-drift-watch-observation.v1",
    "metrics": [
      "contractPassRate",
      "sourceTraceRate",
      "taskRubricScore",
      "totalTokens",
      "latencyMs",
      "refusalOrFallbackRate"
    ]
  }
}
```

## 統合しない条件

| 条件 | 判断 |
|---|---|
| secretやcloud認証が必須 | v1では統合しない |
| local fixture / dry runがない | 後回し |
| resultをJSONで取り出せない | wrapperかparserを作れるか確認してから判断 |
| LLM-as-judgeだけで機械判定が弱い | 直接graderにはしない |
| licenseや運用元が不明 | 採用しない |
| 既存schemaへ写せない | 調査メモ止まり |

## 証跡の保存先

| 内容 | 保存先 |
|---|---|
| 外部repo調査 | `external_refs/ai_harness_skill_integration_references/` |
| 統合設計 | `internal_refs/ai_experiment_scopes/skill_orchestration_harness/` |
| 実行結果 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/` |
| モデル比較結果 | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/experiments/model_drift_watch/` |
| skill化する判断 | `.agents/skills/` または `skill_drafts/` |

## 調査元

| source | URL | この文書で使った事実 |
|---|---|---|
| Google agents-cli | https://github.com/google/agents-cli | skills、eval command、Codex/Claude Code/Gemini CLI対応、local/cloud条件 |
| Google EvalBench | https://github.com/GoogleCloudPlatform/evalbench | NL2SQL、agentic evaluations、CLI対象、sandbox、fake MCP、token/latency/tool call |
| Google ADK eval docs | https://github.com/google/adk-docs/blob/main/docs/evaluate/index.md | trajectory/tool use、final response、evalset、criteria、`adk eval` |
| Google Agent Starter Pack | https://github.com/GoogleCloudPlatform/agent-starter-pack | maintenance mode、`agents-cli` への移行、CI/CD、evaluation、observability、template構成 |
| promptfoo | https://github.com/promptfoo/promptfoo | prompt/model/provider比較、declarative config、CI/CD、red teaming |
| Inspect AI | https://github.com/UKGovernmentBEIS/inspect_ai | LLM eval、tool usage、multi-turn、model-graded eval、pre-built evals |
| Phoenix | https://github.com/Arize-ai/phoenix | tracing、evaluation、datasets、experiments、prompt management、provider integrations |
| Anthropic skills | https://github.com/anthropics/skills | Claude Code plugin marketplace、document-skills、example-skills。評価 1/10、使わない |
| Composio awesome-codex-skills | https://github.com/composio-community/awesome-codex-skills | community Codex skill collection。評価 1/10、使わない |
| SWE-bench harness | https://www.swebench.com/SWE-bench/api/harness/ | coding benchmark harness、grading、reporting、run evaluation API |
| DeepEval | https://github.com/confident-ai/deepeval | pytest-like LLM eval、metrics、JSON correctness、provider integrations |
| Ragas docs | https://docs.ragas.io/en/v0.3.4/tutorials/rag/ | RAG metrics、faithfulness、context precision/recall |
| LangGraph | https://github.com/langchain-ai/langgraph | stateful agent runtime、durable execution、human-in-the-loop |

## 次に作るもの

- `external-ai-harness-source-catalog.v1` の実ファイル。
- `external-harness-result-adapter.v1` のschema。
- `promptfoo` 用の最小pilot config。
- `EvalBench` 結果をlocal observationへ変換するadapter設計。
- `agents-cli` skillから取り込む候補表。
