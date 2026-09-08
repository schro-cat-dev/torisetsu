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
| [PRISMA 2020](https://www.prisma-statement.org/prisma-2020) | PRISMA Executive / reporting guideline | systematic reviewの理由、方法、結果をchecklistとflowで完全に報告する枠組みを提供する | 主対象は介入効果のsystematic review。software技術調査には項目の調整が必要 |
| [W3C PROV Overview](https://www.w3.org/TR/prov-overview/) | W3C / standard family | dataや成果物に関わったentity、activity、agentの由来を交換可能な形で表現する | 来歴を記録しても、source内容の真実性は保証しない |
| [ACM Artifact Review and Badging](https://www.acm.org/publications/policies/artifact-review-and-badging-current) | ACM / publication policy | artifactのavailable、functional、reusableと、結果のreproduced、replicatedを分けて評価する | 論文の主張審査とartifact評価は別であり、badgeだけで実用性は決まらない |
| [NASA Decision Analysis](https://www.nasa.gov/reference/6-8-decision-analysis/) | NASA / official handbook | 代替案をcriteria、費用、効果、risk、不確かさで比較する方法を整理する | 重みと選択規則は対象systemと意思決定者に依存する |
| [NASA Technology Readiness Levels](https://www.nasa.gov/reference/system-engineering-handbook-appendix/) | NASA / official handbook | 技術成熟度を、分析、試作、関連環境・運用環境での実証段階として区別する | TRLは価値、安全、費用、製品全体の準備完了を単独では保証しない |

## 技術検証

| source | 運営・区分 | 確認できたこと | 利用時の限界 |
|---|---|---|---|
| [Reproducible Builds documentation](https://reproducible-builds.org/docs/) | Reproducible Builds project / official docs | 他者がbuild環境を再現するための戦略とbuild system上の論点を整理する | bit-for-bit再現と実行時挙動の一致は別問題 |
| [Hypothesis](https://github.com/HypothesisWorks/hypothesis) | OSS / primary repository | property-based testingで入力例を生成・縮小する | propertyの定義漏れは検出できない |
| [OSS-Fuzz](https://google.github.io/oss-fuzz/) | Google / official docs | fuzz engine、sanitizer、分散実行を組み合わせ継続的に不具合を探索する | 対象外経路やoracle不足は残る。closed sourceは別構成が必要 |
| [Jepsen](https://github.com/jepsen-io/jepsen) | OSS / primary repository | 分散systemへfaultを与え、履歴から整合性を検査する | test modelと実運用障害の網羅性は別途評価が必要 |
| [TLA+](https://lamport.azurewebsites.net/tla/high-level-view.html) | Leslie Lamport / primary docs | codeより上位の抽象modelで状態遷移とpropertyを検査する | 有限modelや抽象化で捨てた挙動を含め、実装全体の証明ではない |
| [NIST Design of Experiments](https://www.itl.nist.gov/div898/handbook/pri/section1/pri1.htm) | NIST / official handbook | 目的、因子、実験計画、前提確認、分析を事前設計して有効な結論を得る手順を示す | 実験designは測定器、sample、交絡、対象domainに合わせる必要がある |
| [Go Fuzzing](https://go.dev/doc/security/fuzz/) | Go project / official docs | coverage-guided fuzzing、失敗入力の縮小、seed corpusによる回帰を標準toolchainで扱う | 実行時間と到達経路に依存し、発見なしは欠陥なしを意味しない |
| [Go Race Detector](https://go.dev/doc/articles/race_detector) | Go project / official docs | 実行された経路のdata raceを検出し、競合accessのstack traceを出す | 未実行経路のraceは検出せず、実行costも通常testより高い |
| [A Survey on Metamorphic Testing](https://doi.org/10.1109/TSE.2016.2532875) | IEEE TSE / peer-reviewed survey | 個別出力の正解が不明な問題で、入力変換と出力関係を使う検証を体系化する | metamorphic relationが誤っていれば正しい実装を誤判定できる |
| [Finding and Understanding Bugs in C Compilers](https://users.cs.utah.edu/~regehr/papers/pldi11-preprint.pdf) | PLDI paper / primary research | 複数実装の同一入力結果を比べるrandomized differential testingでcompiler bugを発見した | 比較対象が同じ誤りを持つ場合や、許容差のある結果には独立oracleが必要 |
| [Principles of Chaos Engineering](https://principlesofchaos.org/) | community principles / public specification | steady stateを定義し、現実的な障害を制御実験として与えてsystemの弱点を探す | 本番影響、blast radius、停止条件、承認を別に設計する必要がある |
| [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) | NIST / standard guidance | software lifecycleへsecurity基準、開発環境保護、脆弱性再発防止を統合する | high-level frameworkであり、個別test caseやtoolを自動決定しない |

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
| [IEEE 754-2019](https://standards.ieee.org/ieee/754/6210/) | IEEE / active standard | 浮動小数点形式、演算、丸め、例外と既定処理を定義する | model妥当性やalgorithmのconditioningは規格適合だけでは決まらない |
| [What Every Computer Scientist Should Know About Floating-Point Arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) | ACM Computing Surveys paper / public reprint | rounding error、ulp、guard digit、cancellation、special valueの影響を解説する | 実対象の誤差上限は式、入力範囲、実装ごとに導出する必要がある |
| [NIST Measurement Uncertainty](https://www.nist.gov/itl/sed/topic-areas/measurement-uncertainty) | NIST / official guidance | measurement modelとTaylor法・Monte Carlo法による不確かさ伝播を整理する | 入力分布、相関、model形状が不適切なら推定も不適切になる |
| [ASME Verification, Validation and Uncertainty Quantification](https://www.asme.org/codes-standards/publications-information/verification-validation-uncertainty) | ASME / standards overview | verification、実験dataに対するvalidation、uncertainty quantificationを別活動として扱う | 業界別standardと要求される厳密さは利用文脈に合わせる必要がある |
| [ASME V&V 40](https://www.asme.org/codes-standards/find-codes-standards/assessing-credibility-of-computational-modeling-through-verification-and-validation-application-to-medical-devices?productKey=C08418) | ASME / consensus standard | model依存度と誤判断の影響に応じてcredibility活動の厳密さを決めるrisk-based frameworkを示す | 医療機器向けであり、他領域には概念をそのまま規制要件として適用しない |
| [Sandia Verification and Validation](https://www.sandia.gov/research/publications/details/verification-validation-and-predictive-capability-in-computational-engineer-2003-02-01/) | Sandia National Laboratories / technical report | 計算modelの数値的正確さと、実験dataに対するmodel妥当性を分離する | 対象modelの正しい現象表現にはdomain専門家と実験設計が必要 |
| [NIST Engineering Statistics Handbook](https://www.itl.nist.gov/div898/handbook/) | NIST/SEMATECH / official handbook | sampling、EDA、measurement、DOE、modeling、process controlの実務手順を提供する | 手法の前提とdata生成過程を確認せず適用すると結論を誤る |

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
| [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) | NIST / voluntary framework | Govern、Map、Measure、Manageを通じてAI riskをlifecycle全体で扱う | generic frameworkであり、用途固有の危害、metric、合否値は利用側が定義する |
| [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | NIST AIRC / official guidance | TEVVを客観的、反復可能、文書化されたprocessとして計画・実行する | 評価可能な要求へ変換できていない概念は自動検査できない |
| [NIST AI Metrology Center](https://airc.nist.gov/metrology/) | NIST AIRC / resource catalog | trustworthiness特性、lifecycle、用途からmetric・method・tool候補を探索できる | 掲載はNISTによる適合性や妥当性の保証ではない |
| [NIST Dioptra](https://pages.nist.gov/dioptra/) | NIST / official test platform | 再現可能・追跡可能なAI risk評価workflowを構成し、dataset、model、attack、defenseを交換できる | microservice・container構成を必要とし、Go coreへ直接依存させない |
| [NIST TEVV-Athlon initial draft](https://www.nist.gov/artificial-intelligence/ai-research/tevv-athlon-framework-evaluating-ai-systems) | NIST / initial public draft | 多様なAI systemへ適用する4段階のcustom assessment設計を提案する | 2026-09-08時点でpublic comment中のdraftであり、確定standardとして扱わない |
| [Model Cards for Model Reporting](https://research.google/pubs/model-cards-for-model-reporting/) | peer-reviewed paper / primary research | 想定用途、対象外用途、評価手順、subgroup別性能、限界をmodelとともに報告する | cardの自己申告内容と実測結果は別に確認する |
| [Datasheets for Datasets](https://arxiv.org/abs/1803.09010) | peer-reviewed paper / primary research | datasetの動機、構成、収集、前処理、利用、配布、保守を質問形式で記録する | 記載が完全・正確か、権利や偏りが許容可能かは別審査が必要 |
| [The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) | IEEE Big Data paper / primary research | production MLに必要なdata、model、pipeline testとmonitoringを28項目に整理する | rubricは開始点であり、system固有riskとSLOを置き換えない |
| [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) | Google / engineering guidance | end-to-end pipeline、simple baseline、held-out確認、silent failure監視、training-serving skew対策を示す | Googleでの経験則を対象組織の制約なしに規則化しない |
| [Productionization](https://developers.google.com/machine-learning/managing-ml-projects/production) | Google / engineering guidance | resource、logging、drift、quality、latency、canary、approval、rollbackを本番準備として扱う | 具体的なしきい値と運用責任は対象systemで決める |
| [Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685) | NeurIPS paper / primary research | strong LLM judgeと人間選好の一致を調べ、position、verbosity、self-enhancement biasを示す | 対象rubric・言語・modelでhuman calibrationなしに一般化しない |
| [NLP Evaluation in Trouble](https://arxiv.org/abs/2310.18018) | EMNLP paper / primary research | benchmark contaminationの段階と、評価結果が過大になるriskを整理する | closed modelの学習dataが不明な場合、完全な検出は困難 |
| [METR Task Completion Time Horizons](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) | METR / empirical research | 人間専門家の所要時間とagent成功率の関係を使い、長いtaskの能力を測る | software・reasoning task中心で、実業務価値や他domainへ直接一般化できない |

## 導入前に再確認すること

- 現行version、release note、archive状態。
- license本体とdataset、model、ruleごとの追加条件。
- network送信、telemetry、credential、container、GPU権限。
- CLIとresult schemaの破壊的変更。
- offline実行可否、resource上限、費用上限。
- toolのPASSが示す範囲と、示さない範囲。
- standard、final publication、draft、vendor guidance、研究論文、OSS READMEの区分。
