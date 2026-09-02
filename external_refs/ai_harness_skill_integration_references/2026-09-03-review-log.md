# 外部AIハーネス・skill候補 講評ログ

作成日: 2026-09-03

## 目的

外部repo / docsを見た結果を、URL一覧ではなく採用判断ログとして残す。

この文書では、外部成果物をそのまま取り込むかではなく、次を分けて判断する。

- 事実: README、docs、repo構成から確認できたこと。
- 講評: このrepoのskill / harness運用から見た評価。
- 扱い: 採用、参照、保留、除外の判断。

## 前提

- 外部repoは原則としてinstall / copy / vendoringしない。
- license、外部通信、MCP、実行script、secret入力、生成物の出どころを確認する。
- 自作できる小さなtoolは、外部依存よりローカル実装を優先する。
- 自作ベンチ上の優位主張は、採用判断の強い根拠にしない。
- 見る価値は、構成、再現手順、安全境界、失敗条件、負けた条件が読めるかで判断する。

## 結論

| 区分 | 対象 | 判断 |
|---|---|---|
| 継続調査 | `UKGovernmentBEIS/inspect_ai` | 評価設計の参照として良い。依存導入は後回し。 |
| 継続調査 | `GoogleCloudPlatform/evalbench` | agentic eval / CLI比較の参照として良い。adapter前提。 |
| 継続調査 | `promptfoo/promptfoo` | prompt / provider比較の軽いpilot候補。 |
| 構造参照 | `addyosmani/agent-skills` | 公開skill集としては良い。構造だけ参考にする。 |
| 部分参照 | `obra/superpowers` | TDD / debuggingの強制力は参考になる。丸ごと採用は硬い。 |
| 設計参照 | `alibaba/open-code-review` | 決定的処理 + agent分離の参考。導入より自作優先。 |
| 条件付き | `meridianlabs-ai/inspect-skills` | Inspect AIを使う場合だけ有用。 |
| 条件付き | `Arize-ai/phoenix` | run数が増えた後のtrace検索候補。v1では不要。 |
| 除外 | `composio-community/awesome-codex-skills` | 評価 1/10。薄い。使わない。 |
| 除外 | `anthropics/skills` | 評価 1/10。このrepoのskill移行元としては薄い。 |
| 除外 | `microsoft/SkillOpt` | repoとして評価 1/10。姿勢と見せ方が採用判断に合わない。 |

## 講評ログ

| source | 確認した面 | 事実 | 講評 | このrepoでの扱い |
|---|---|---|---|---|
| `GoogleCloudPlatform/evalbench`<br>https://github.com/GoogleCloudPlatform/evalbench | README / repo説明 | NL2SQL、agentic evaluations、Codex CLI / Claude Code / Gemini CLI、sandbox、fake MCP、token / latency / tool callに言及。 | このrepoの `case -> raw log -> grader -> observation` に近い。直接導入ではなく、出力をlocal observationへ写すadapter候補。 | 継続調査。L0-L3 pilot候補。 |
| `google/agents-cli`<br>https://github.com/google/agents-cli | README / skill構成 | skills、eval command、eval compare、eval analyze、observability系skillに言及。 | Google系のskill粒度、eval、observabilityの切り方を見る価値はある。ただしそのままinstallする対象ではない。 | 構造参照。必要skillだけ読む。 |
| `promptfoo/promptfoo`<br>https://github.com/promptfoo/promptfoo | README / docs | 宣言的configでprompt、model、provider比較、CI/CD、red teamingに言及。 | smoke caseと相性がよい。red teamは重いので後回し。出力JSONをlocal schemaに変換できるかを見る。 | 軽いpilot候補。 |
| `UKGovernmentBEIS/inspect_ai`<br>https://github.com/UKGovernmentBEIS/inspect_ai | README / docs / `.claude/skills` | Task、Dataset、Solver、Scorer、Logs、Analysis、Sandbox、tool use、multi-turn、model-graded evalに言及。 | かなり良い。見るべき中心は `.claude/skills` ではなく、評価構造とlog / scorer設計。依存は重いが、設計参照として価値が高い。 | 継続調査。grader設計比較に使う。 |
| `Arize-ai/phoenix`<br>https://github.com/Arize-ai/phoenix | README | OpenTelemetry trace、evaluation、datasets、experiments、prompt managementに言及。 | file ledgerで足りる段階では不要。runが増えて検索がつらくなったら候補。 | v1保留。 |
| Google ADK eval docs<br>https://github.com/google/adk-docs/blob/main/docs/evaluate/index.md | eval docs | trajectory / tool use、final response、evalset、criteria、`adk eval` に言及。 | ADK agentを作るなら有用。今は評価項目の設計参照で十分。 | 条件付き参照。 |
| `GoogleCloudPlatform/agent-starter-pack`<br>https://github.com/GoogleCloudPlatform/agent-starter-pack | README | maintenance mode、active developmentは `agents-cli` へ移行、CI/CD、evaluation、observability、deployment templateに言及。 | 新規導入対象ではない。移行判断やtemplate構成の参考だけ。 | 低優先参照。 |
| SWE-bench harness docs<br>https://www.swebench.com/SWE-bench/api/harness/ | docs | `run_evaluation`、grading、reporting、log parserなどのharness APIに言及。 | GitHub issue修正の評価やpatch評価を作る時に見る。今のskill移行とは別。 | 条件付き参照。 |
| `confident-ai/deepeval`<br>https://github.com/confident-ai/deepeval | README | pytest-like LLM eval、G-Eval、task completion、answer relevancy、hallucination、JSON correctnessに言及。 | LLM-as-judge比率が高い。機械判定で足りない時だけ使う。初期には不要。 | 保留。 |
| Ragas docs<br>https://docs.ragas.io/en/v0.3.4/tutorials/rag/ | docs | RAG向けのfaithfulness、context precision / recallなどに言及。 | RAG対象が出るまでは不要。今のモデルドリフトsmokeには入れない。 | 保留。 |
| `langchain-ai/langgraph`<br>https://github.com/langchain-ai/langgraph | README | stateful agent runtime、durable execution、human-in-the-loop、memoryに言及。 | 評価ハーネスではなくruntime。今回のskill移行・評価候補とは別管理。 | 今回対象外。 |
| `anthropics/skills`<br>https://github.com/anthropics/skills | README / skill集 | Claude Code plugin marketplace、document-skills、example-skillsに言及。 | 評価 1/10。形式参照はできるが、このrepoのskill移行元としては薄い。実務上の判断、根拠確認、失敗時の扱いが不足。 | 除外。使わない。 |
| `composio-community/awesome-codex-skills`<br>https://github.com/composio-community/awesome-codex-skills | README / `lead-research-assistant/SKILL.md` | 個別skillは用途説明、手順、出力テンプレート中心。 | 評価 1/10。情報源の信頼度、検索手順、スコア算出、鮮度、重複排除、失敗時の扱い、検証方法が薄い。 | 除外。使わない。 |
| `addyosmani/agent-skills`<br>https://github.com/addyosmani/agent-skills | README / `code-review-and-quality` / `spec-driven-development` | 25前後のskills、slash commands、verification gates、anti-rationalization、red flagsに言及。 | 公開skill集としてはかなり良い。特に `When to Use`、手順、verification、red flagsの揃え方は参考になる。ただしこのrepoの方が、ユーザー文脈、ログ、汎用runner、検証証跡に深く寄っている。 | 構造だけ参照。丸ごと採用しない。 |
| `obra/superpowers`<br>https://github.com/obra/superpowers | README / TDD / systematic debugging skill | TDD、systematic debugging、planning、subagent-driven development、review workflowに言及。 | 強いが硬い。AIの雑な飛びつきを止めるには効くが、このrepoの軽量・高速・自作ツール方針とは衝突しやすい。 | TDD / debuggingの強制文だけ部分参照。 |
| `alibaba/open-code-review`<br>https://github.com/alibaba/open-code-review | README / repo構成 | Go実装。`cmd/`、`internal/`、`.opencodereview`、`plugins`、`skills` があり、deterministic file selection、file bundling、rule matching、positioning / reflection、JSON出力に言及。 | skill集ではなく実ツール。決定的処理 + agentの分離は良い。ただし自作できる範囲で、導入するよりローカル実装の方が制御・品質・安全性を担保しやすい。 | 設計思想だけ参照。導入しない。 |
| `meridianlabs-ai/inspect-skills`<br>https://github.com/meridianlabs-ai/inspect-skills | README | `map-inspect-packages`、`reading-logs`、`analyzing-logs`、`babysitting-evals` の4skillに言及。 | Inspect AIを実際に使うなら有用。Inspectを使わない段階では狭すぎる。 | Inspect採用時だけ参照。 |
| `microsoft/SkillOpt`<br>https://github.com/microsoft/SkillOpt | README / project page / docs | skillをtrainable stateとして扱い、rollout、reflection、bounded edit、held-out validation gate、SkillOpt-Sleepに言及。 | repoとして評価 1/10。構成がぱっと読みにくく、自作ベンチでの優位主張や動画訴求が強く、採用判断の姿勢に合わない。概念を使うとしても外部repo参照ではなく、自前の一般設計語彙として扱う。 | 除外。概念だけ抽象化可能。 |
| `vercel-labs/agent-skills`<br>https://github.com/vercel-labs/agent-skills | README | Vercel optimize、React / Next.js best practices、web design guidelinesなどに言及。 | Vercel / Next / frontend領域では使える可能性がある。汎用skill移行元ではない。 | frontend / Vercel時だけ参照。 |

## 残すべき判断基準

| 基準 | OK | NG |
|---|---|---|
| 内容の厚み | 失敗条件、検証方法、出力契約、除外条件がある | 用途説明と手順テンプレだけ |
| 安全性 | 外部通信、secret、MCP、scriptの境界が明記されている | install前提だけで安全境界が薄い |
| 再現性 | 固定dataset、config、result、logがある | 文章上のベストプラクティスだけ |
| 姿勢 | 負けた条件、限界、第三者再現、外部ベンチがある | 自作ベンチで「一番良い」を強く押す |
| local fit | local schema / runner / policyへ分けられる | 外部toolの世界観に寄せないと使えない |

## 次に見る順番

1. `UKGovernmentBEIS/inspect_ai`: Task / Dataset / Solver / Scorer / Logs / Analysis。
2. `GoogleCloudPlatform/evalbench`: agentic evaluationのdataset、result、tool call trace。
3. `promptfoo/promptfoo`: configとJSON出力。
4. `addyosmani/agent-skills`: skillの構造、red flags、verificationの書き方。
5. `alibaba/open-code-review`: 決定的処理 + agent分離の設計だけ。

## 使わないもの

- `anthropics/skills`
- `composio-community/awesome-codex-skills`
- `microsoft/SkillOpt`
- `awesome-*` 系の一覧repoやdirectory site

理由:

- 薄いskillを混ぜると、発火だけ増えて成果物品質が上がらない。
- 外部repoを取り込むと、権利、外部通信、secret、MCP、実行scriptの確認コストが増える。
- このrepoでは、必要な観点を自前のskill、policy、scenario、runnerに落とす方が速くて安全。
