# 分野別調査カバレッジ

調査日: 2026-09-08

## 判定方法

この表はsource数ではなく、意思決定に必要な分類を埋めたかを示す。`対象別`は、共通資料だけでは結論を出せず、実案件の用途、データ、危害、規制、実行環境に合わせた追加調査が必要という意味です。

| 領域 | 分類 | 主な根拠 | 状態 | 残る作業 |
|---|---|---|---|---|
| 技術調査 | 調査質問、選定・除外、報告 | PRISMA 2020 | 共通原則あり | software調査へ適用するときの対象別調整 |
| 技術調査 | sourceの由来と変更履歴 | W3C PROV | 共通原則あり | 保存形式と保持期間の決定 |
| 技術調査 | artifactの再現・再利用 | ACM artifact review | 共通原則あり | 対象artifactでの第三者再現 |
| 技術調査 | 代替案、費用、効果、リスク | NASA decision analysis | 共通原則あり | 対象案件の評価軸と重み |
| 技術調査 | 判断記録と再評価 | ADR、MADR | 共通原則あり | 有効期限と再確認trigger |
| 技術検証 | 仮説、対照、実験計画 | NIST DOE | 共通原則あり | sample数と交絡要因の設計 |
| 技術検証 | buildと実行の再現 | Reproducible Builds、ACM | 共通原則あり | 実環境の固定と第三者実行 |
| 技術検証 | 入力探索 | Go fuzzing、property-based testing | 共通原則あり | propertyとseed corpusの対象別設計 |
| 技術検証 | oracle不足への対処 | metamorphic testing、differential testing | 共通原則あり | 独立実装・変換関係の妥当性確認 |
| 技術検証 | 並行・分散・障害 | Go race detector、Jepsen、Chaos Engineering | 共通原則あり | 実運用に近い負荷と障害範囲 |
| 技術検証 | 抽象modelと状態遷移 | TLA+ | 共通原則あり | 抽象化と実装の対応確認 |
| 数理 | model、単位、前提、制約 | ASME V&V、NIST VVUQ | 共通原則あり | ドメイン方程式と実測dataの妥当性 |
| 数理 | 浮動小数点と例外 | IEEE 754、Goldberg | 共通原則あり | 実装言語・hardware固有の確認 |
| 数理 | 数値解法、収束、最適性 | SciPy、OR-Tools | 共通原則あり | solver別statusと停止条件の検証 |
| 数理 | 不確かさと感度 | NIST measurement uncertainty、ASME VVUQ | 共通原則あり | 入力分布、相関、許容幅の根拠 |
| 数理 | 統計的実験 | NIST Engineering Statistics Handbook | 共通原則あり | sampling、検出力、実務上の差の定義 |
| 数理 | 証明と制約充足 | Lean、Z3 | 共通原則あり | 形式化していない前提と実装対応 |
| AI | riskとTEVV lifecycle | NIST AI RMF、AIRC | 共通原則あり | 利用文脈ごとの危害と責任者 |
| AI | dataset・modelの説明責任 | Datasheets、Model Cards | 共通原則あり | 個別dataの権利、偏り、対象外用途 |
| AI | benchmarkと実験実行 | Inspect AI、HELM、MLPerf等 | 共通原則あり | local taskを表す非公開case |
| AI | contaminationと過適合 | contamination研究、holdout運用 | 共通原則あり | 対象modelの学習dataが非公開な場合の扱い |
| AI | graderと人間評価 | MT-Bench、judge bias研究 | 共通原則あり | rubric別の一致率、再判定条件 |
| AI | agent、tool、RAG | Inspect AI、実行trace | 部分的 | 対象tool権限と業務workflowの確認 |
| AI | production運用 | ML Test Score、Rules of ML | 共通原則あり | SLO、cost、drift、rollback条件 |
| 全領域 | 研究から実用化への移行 | NASA TRL、ACM、NIST、ML運用資料 | 共通契約あり | 対象別の合否値と承認者 |

## 意図的に共通化しないもの

- 医療、金融、建築、製造など各業界の法令・認証・専門model。
- 個別modelやdatasetの正しさ、安全性、利用許諾。
- 実運用のSLO、費用上限、危害の許容値。
- 非公開の攻撃case、内部system構成、熟練者の判定手順。

これらは共通ハーネスへ固定値として埋めず、対象profile、policy、scenarioから渡す。
