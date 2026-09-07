# テスト設計とTDDの判断根拠

## 結論

熟練者の判断は、網羅的にcaseを増やすことではない。変更契約と失敗仮説を特定し、riskに応じて技法とtest levelを選び、最小の重複で観察可能な証拠を作ることです。TDDはその設計済みbehaviorをRed / Green / Refactorで実装へ接続する。

## 一次資料から採用した内容

| 出典 | 確認した事実 | 今回の採用 |
|---|---|---|
| [ISTQB CTFL v4.0.1](https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf) | 同値分割、境界値、決定表、状態遷移を区別し、riskのlikelihoodとimpactがtest scope、level、technique、coverage、priorityへ影響する | 欠陥仮説に合う技法だけ選び、`likelihood * impact`を判断材料にする |
| [Agile Alliance: TDD](https://agilealliance.org/glossary/tdd/) | 1つのtestを追加し、失敗確認、通す最小実装、refactor、反復の順で進める | slice単位のRed / Green / Refactorと実結果を必須化する |
| [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/) | 利用方法に近いtestほど利用時の信頼を与えやすい | UIの価値とevent配線は少数のcomponent/E2Eで確認する |
| [JSON Schema 2020-12 Core](https://json-schema.org/draft/2020-12/json-schema-core) | properties、items、additionalProperties等でJSON構造の適用範囲を宣言できる | backend/frontend間の構造契約をJSON Schemaとして共有する |
| [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) | 構造化入力はschema、型、min/max、許可値で検証し、denylistよりallowlistを主にする | 未知type/propertyを黙殺せず、件数、長さ、protocolを許可制にする |
| [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) | frameworkにもescape hatchとURL処理の穴があり、untrusted URLはsafe schemeをallowlistする | raw HTMLを無効化し、URL schemeを描画直前にも確認する |
| [React DOM common components](https://react.dev/reference/react-dom/components/common) | untrustedな`dangerouslySetInnerHTML`はXSS riskになる | Markdown描画で`dangerouslySetInnerHTML`を使わない |
| [OWASP ASVS 5.0.0](https://owasp.org/www-project-application-security-verification-standard/) | application security controlを検証要件として整理する標準を提供する | 認証、認可、入力、機密data、resource消費を独立check群にする |
| [OWASP WSTG](https://wstg.owasp.org/) | web applicationのsecurity test scenarioと実施観点を体系化する | 正常入力だけでなく、迂回、改ざん、未知値、過大入力をcase化する |
| [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) | object/function/property認可、resource消費、SSRF等をAPI固有riskとして扱う | security checkを認証だけにまとめず、認可、resource、outbound URLへ分ける |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) | HTTP method、status、header等の意味を定義する | request/response契約とstatus matrixを通信testの別項目にする |
| [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html) | HTTP API errorをmachine-readableなproblem detailsとして表現する形式を定義する | statusとerror body schemaを同時に確認する |
| [Go Fuzzing](https://go.dev/doc/tutorial/fuzz) | seed corpusから入力を変異させ、失敗入力を再現可能な回帰dataとして保存できる | parser/validatorの未知入力を`PARSE-003`として独立させる |
| [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | secure software developmentを組織的なpracticeとtaskへ分ける | securityを実装者の記憶に任せず、profileと証跡を残すgateにする |
| [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/) | traces、metrics、logsを観測signalとして区別する | failure時に相関可能なlog/metric/traceと機密data非露出を確認する |
| [AWS: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) | retryの競合集中を減らすためbackoffとjitterが使われる | timeout、retry対象、上限、idempotencyを通信・回復testへ分ける |

## 二段階catalogへの反映

- 上位は6 review domainと24 review group、下位は42 atomic checkとした。
- 1 atomic checkは1 groupだけに所属させる。module type、risk trigger、flow type、system concernはgroup IDを参照する。
- Go validatorはgroup内の全checkへtest evidenceまたはowner・再確認条件付きwaiverを要求する。
- 全system concernは、選択groupで確認するか、理由付き対象外へ分類する。未分類は失敗にする。
- 人向け日本語一覧はcatalogから生成し、42 IDがそれぞれ1回だけ掲載される構造にする。

## 適用範囲

- 一般skill: risk、technique、test level、TDD実行証跡。
- 対象側: schema version、section type、上限値、UI状態、command、fixture。
- backend: JSON Schemaによる構造検証と拒否。ReactやMarkdown描画を知らない。
- frontend: 受信値の再検証、正規化、renderer選択、描画直前のURL/HTML防御。

## 採用しない一般化

- すべての変更へE2Eを追加しない。
- test数やcoverage率だけで完了判定しない。
- security ruleをrisk scoreだけで省略しない。
- 対象固有の値をskillや共通runnerへ埋め込まない。
- 人間の違和感を、そのまま自動testで検出できるとは扱わない。

## 実行基盤の依存境界

- 共通の設計record検証、command実行、結果JSON生成、テキストgateはGo標準ライブラリだけで実装する。
- 対象path、実行command、timeout、期待終了code、出力上限はJSONから注入し、Go本体へ個別値を置かない。
- React/TypeScript固有のtest runnerやcompilerは再実装しない。対象側の依存としてGo runnerから起動する。
- したがって「依存なし」は共通基盤自身のbuild/test/runtimeを指し、検証対象アプリのtoolchainを隠す意味ではない。
