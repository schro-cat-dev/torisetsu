# 技術調査・検証・数理・AIの調査元一覧

調査日: 2026-09-08

## 読み方

`確認できたこと` は公開sourceに書かれている範囲を要約する。toolを実行して性能や精度を確認した結果ではない。

## 技術調査・意思決定

| source | 運営・区分 | 確認できたこと | 利用時の限界 |
|---|---|---|---|
| [ADR GitHub organization](https://adr.github.io/) | ADR community / 公式project | 重要な設計判断をcontext、rationale、trade-off、consequenceとともに記録する | 記録が最新実装と一致するかは別検査が必要 |
| [Architecture Decision Record examples](https://github.com/architecture-decision-record/architecture-decision-record) | OSS / primary repository | ADRのtemplate、例、関連toolを公開している | README自身がcritical systemへの適用前確認を求めている |
| [MADR](https://adr.github.io/madr/) | ADR community / official docs | Markdownでdecisionを記録し、選択肢と結果を残す | template利用だけではsourceの品質を保証しない |
| [Build Your Own Radar](https://github.com/thoughtworks/build-your-own-radar) | Thoughtworks / OSS | 技術候補をringとquadrantで可視化する | radar上の位置は採否根拠や検証結果ではない |

## 技術検証

| source | 運営・区分 | 確認できたこと | 利用時の限界 |
|---|---|---|---|
| [Reproducible Builds documentation](https://reproducible-builds.org/docs/) | Reproducible Builds project / official docs | 他者がbuild環境を再現するための戦略とbuild system上の論点を整理する | bit-for-bit再現と実行時挙動の一致は別問題 |
| [Hypothesis](https://github.com/HypothesisWorks/hypothesis) | OSS / primary repository | property-based testingで入力例を生成・縮小する | propertyの定義漏れは検出できない |
| [OSS-Fuzz](https://google.github.io/oss-fuzz/) | Google / official docs | fuzz engine、sanitizer、分散実行を組み合わせ継続的に不具合を探索する | 対象外経路やoracle不足は残る。closed sourceは別構成が必要 |
| [Jepsen](https://github.com/jepsen-io/jepsen) | OSS / primary repository | 分散systemへfaultを与え、履歴から整合性を検査する | test modelと実運用障害の網羅性は別途評価が必要 |
| [TLA+](https://lamport.azurewebsites.net/tla/high-level-view.html) | Leslie Lamport / primary docs | codeより上位の抽象modelで状態遷移とpropertyを検査する | 有限modelや抽象化で捨てた挙動を含め、実装全体の証明ではない |

## 数理・形式検証

| source | 運営・区分 | 確認できたこと | 利用時の限界 |
|---|---|---|---|
| [Lean reference](https://lean-lang.org/doc/reference/latest/) | Lean project / official docs | dependent type theoryに基づく対話的定理証明を数学とsoftware verificationへ使える | formalizeしていない前提や実装との対応は保証されない |
| [Z3](https://github.com/Z3Prover/z3) | Z3 project / primary repository | SMT solverとして制約の充足可能性を探索する | encodingが誤っていれば正しいsolver結果でも目的を証明しない |
| [SymPy gotchas](https://docs.sympy.org/latest/explanation/gotchas.html) | SymPy project / official docs | 構造的一致、symbolic equality、float精度の違いを説明する | simplify結果だけを独立証明にしない |
| [SciPy optimize](https://docs.scipy.org/doc/scipy/reference/optimize.html) | SciPy project / official docs | local/global最適化、制約付き最適化、root findingを提供する | solverごとの停止条件、局所解、scale、初期値を別確認する |
| [SciPy integrate](https://docs.scipy.org/doc/scipy/tutorial/integrate.html) | SciPy project / official docs | 数値積分と誤差推定を提供し、samplingが重要領域を見落とす例も示す | 返却誤差だけで任意の被積分関数の精度は保証されない |
| [IntervalArithmetic.jl](https://juliaintervals.github.io/IntervalArithmetic.jl/stable/manual/api/) | JuliaIntervals / official docs | 真値を含む区間で計算するvalidated numericsを提供する | model誤り、区間膨張、設定差は別途扱う |
| [OR-Tools](https://github.com/google/or-tools) | Google / primary repository | routing、scheduling、linear/integer programming等のsolver群を提供する | feasibleとoptimal、time limit終了を分けて判定する必要がある |

## AI評価

| source | 運営・区分 | 確認できたこと | 利用時の限界 |
|---|---|---|---|
| [Inspect AI](https://inspect.aisi.org.uk/) | UK AI Security Institute / official docs | dataset、solver、scorer、tool、agentを組み合わせ評価を構成する | evaluator設計とmodel/provider差の妥当性は利用側の責務 |
| [OpenAI Evals repository](https://github.com/openai/evals) | OpenAI / primary repository | eval frameworkとbenchmark registryを公開する | repositoryのtaskが対象業務を代表するとは限らない |
| [OpenAI evals guide](https://platform.openai.com/docs/guides/evals) | OpenAI / official docs | eval作成、実行、結果分析のworkflowを説明する | provider固有機能と一般原則を区別する |
| [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | EleutherAI / primary repository | zero/few-shotを含むLM評価taskとYAML設定を扱う | task version、prompt、few-shot条件を固定しない比較は無効 |
| [HELM](https://crfm.stanford.edu/helm/) | Stanford CRFM / official site | 多数のscenario、metric、modelを再現可能かつ透明に比較する | leaderboard順位を個別業務の採否へ直接使わない |
| [MLPerf Inference rules](https://github.com/mlcommons/inference_policies/blob/master/inference_rules.adoc) | MLCommons / official rules | system under test、scenario、quality、latency、再現性、audit条件を定義する | MLPerf準拠結果と独自workload評価を混同しない |
| [promptfoo](https://github.com/promptfoo/promptfoo) | OSS / primary repository | prompt/model比較、assertion、red-team評価を設定駆動で実行する | plugin、provider、外部送信、graderの権限を確認する |
| [Phoenix](https://github.com/Arize-ai/phoenix) | Arize AI / primary repository | tracing、evaluation、experiment、observabilityを扱う | telemetryと保存先、運用データの機密性を導入前に確認する |

## 導入前に再確認すること

- 現行version、release note、archive状態。
- license本体とdataset、model、ruleごとの追加条件。
- network送信、telemetry、credential、container、GPU権限。
- CLIとresult schemaの破壊的変更。
- offline実行可否、resource上限、費用上限。
- toolのPASSが示す範囲と、示さない範囲。
