# 4領域の公開調査結果

調査日: 2026-09-08

## 共通して必要なもの

4領域すべてで、次の分離が必要になる。

| 対象 | 記録する内容 | 混ぜないもの |
|---|---|---|
| input identity | source revision、dataset revision、model、式、実行対象 | 「最新」「同じもの」という曖昧な表現 |
| method | 調査手順、command、solver、grader、比較方法 | 実行していない予定 |
| result | 値、exit code、反例、引用、trace | 根拠のない合否 |
| limitation | 未確認、探索範囲、近似、取得失敗 | 不合格や該当なしとの混同 |
| decision | 採用、条件付き採用、不採用 | sourceやtool自身の主張 |

## 技術調査

- 検索語、選定・除外、件数、更新差分を残す。source一覧だけでは調査の再現にならない。
- 重要な判断は、選択肢だけでなくcontext、根拠、trade-off、結果を残す。
- sourceの公開日と確認日を分け、取得失敗を「情報なし」と扱わない。
- 公式仕様、実装、issue、論文は証拠の種類が異なる。相互に置き換えない。
- 技術レーダーは棚卸しと再評価に向くが、採否根拠そのものにはならない。

## 技術検証

- 仮説は、観測可能な期待値と反証条件へ変換してから実行する。
- positive controlとnegative controlを置き、ハーネス自身が成功・失敗を識別できるか確認する。
- 再現可能性にはsourceだけでなくbuild環境、dependency、時刻、乱数、外部サービス状態が影響する。
- property-based test、fuzzing、fault injection、model checkingは検出対象が異なる。
- 正解を直接計算できない場合は、性質、入力変換前後の関係、独立実装間の差をoracleとして使う。ただしoracle自体の妥当性を別に確認する。
- 小さいmodelで性質を確認しても、実システム全体の正しさを証明したことにはならない。

## 数理検証

- 記号、単位、座標系、定義域、制約、許容差を先に固定する。
- symbolic equality、floating-point equality、近似一致を区別する。
- verification、validation、uncertainty quantificationを分ける。計算が式どおりでも、式が現実を表すとは限らない。
- solverのsuccessは、制約充足、最適性、数値安定性、モデル妥当性を同時には保証しない。
- interval arithmetic、独立再計算、感度分析、退化ケースは異なる失敗を検出する。
- 相関、統計的有意差、実務上意味のある差、因果関係を同じ結論にしない。

## AI評価

- model、provider、取得可能なversion、prompt、tool、dataset、graderを別々に版管理する。
- datasetとmodelには、由来、想定用途、対象外用途、評価条件、既知の限界を残す。
- task品質、安全性、速度、費用、再現性は一つのscoreへ潰さない。
- model graderは有用だが、自己評価、同系統model、曖昧rubricによる偏りを残す。
- benchmarkの比較には、同じ前処理、入力順、sample集合、scenario、quality条件が必要になる。
- test dataをprompt調整や採否判断へ使い続けると、評価集合への過適合が起きる。
- agentは最終回答だけでなく、tool選択、引数、停止、retry、外部作用、部分障害のtraceを評価する。
- offline scoreと本番価値を分け、data drift、training-serving skew、silent failure、rollbackを運用側で確認する。

## 研究開発と実用化

- 二領域は統合できるが、評価責務は統合しない。
- 研究側は仮説、比較、再現、限界を確定し、実用化側は利用者価値、SLO、安全、費用、保守、停止を検証する。
- 合流時には研究指標と本番要件の対応、環境差、未確認条件、artifact identityを引き渡す。
- 本番の失敗は研究caseへ戻せるが、個人情報や運用秘密をそのまま研究dataにしない。
- gateごとの結果を保持し、研究合格を本番合格へ自動変換しない。

## 自動化の境界

自動化しやすいもの:

- schema、必須field、revision、checksum、command、exit code。
- 数値範囲、制約違反、形式違反、既知caseの回帰。
- tool出力の共通resultへの変換。

人の判断を残すもの:

- sourceの信頼性と利害関係。
- モデル化で捨てた前提が妥当か。
- 数値差が業務上重要か。
- AI出力が利用文脈で有害または誤解を招くか。
- toolの対象外を許容できるか。
