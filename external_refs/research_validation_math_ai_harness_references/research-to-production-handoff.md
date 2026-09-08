# 研究開発と実用化の接続

調査日: 2026-09-08

## 結論

研究開発と実用化は統合できる。ただし、一つの総合scoreへ混ぜるのではなく、別々の評価結果を引き渡し契約で接続する。

```text
研究質問
  -> 仮説・新規性・反証条件
  -> 再現可能な検証
  -> 実用化候補としての引き渡し
  -> 本番相当の性能・安全・費用検証
  -> 限定公開とrollback確認
  -> 運用監視と再評価
```

研究で良い結果が出ても、本番で必要な可用性、安全性、費用、保守性を満たすとは限らない。逆に、実用上有効でも、研究上の新規性や一般化可能性を証明したことにはならない。

## 二つの評価レーン

| レーン | 主な問い | 主な証拠 | 合格しても証明しないこと |
|---|---|---|---|
| 研究開発 | 仮説は支持されたか。既存法より何が変わるか。反例は何か | protocol、raw data、code、seed、比較対象、統計、不確かさ、再現結果 | 本番の可用性、費用、安全性、運用可能性 |
| 実用化 | 対象利用者と実環境で価値を出し、安全に運用・停止できるか | requirement、SLO、負荷、failure test、security、cost、canary、monitoring、rollback | 学術的新規性、他条件への一般化、因果関係 |

## 合流点

### 1. 研究開始

- 判断する仮説と反証条件を先に決める。
- baseline、比較対象、dataの選定・除外条件を固定する。
- 成功時に誰が何を判断するかを決める。

### 2. 研究結果の確定

- raw data、code、環境、乱数、変更履歴を特定できる。
- 主要結果を再実行でき、失敗や反例も残っている。
- 結論の適用範囲と未確認条件が明記されている。

### 3. 実用化候補への引き渡し

- 研究指標を利用者価値またはsystem要件へ対応づける。
- 研究環境と本番環境の差を列挙する。
- 精度だけでなく、速度、費用、安全、privacy、保守、停止方法を対象に加える。
- 採用、追加検証、保留、中止を別の状態として記録する。

### 4. 本番前検証

- 本番相当data、hardware、依存service、同時実行数で再測定する。
- silent failure、data/model drift、training-serving skew、部分障害を確認する。
- canaryの拡大条件、中止条件、rollback手順、監視責任者を決める。

### 5. 運用から研究への戻り

- 本番で見つかった失敗を、個人情報を除いた再現caseへ変換する。
- 分布変化や前提破れを、新しい研究質問または回帰testへ戻す。
- 本番KPIの改善だけで因果を断定せず、必要なら対照実験を行う。

## 引き渡しdata例

`handoff`は研究成果を実用化側へ渡すJSONです。値は対象profileから注入し、共通runnerへ直書きしない。

```json
{
  "schemaVersion": "research-production-handoff.v1",
  "handoffId": "handoff-immutable-id",
  "candidate": {
    "identity": "candidate-id",
    "revision": "immutable-revision"
  },
  "researchEvidence": {
    "claim": "observable claim",
    "artifactRefs": ["checksum-protected-reference"],
    "testedConditions": ["recorded condition"],
    "limitations": ["untested condition"],
    "reproductionStatus": "independently_reproduced"
  },
  "productionTarget": {
    "useCase": "specific user workflow",
    "successMetricRefs": ["metric with unit"],
    "harmScenarioRefs": ["scenario reference"],
    "sloRefs": ["versioned SLO"],
    "costBudgetRef": "versioned budget"
  },
  "gateResults": {
    "researchValidity": {"status": "pass", "evidenceRefs": ["evidence:research"]},
    "reproducibility": {"status": "pass", "evidenceRefs": ["evidence:reproduction"]},
    "translationReview": {"status": "pass", "evidenceRefs": ["evidence:mapping"]},
    "productionQualification": {"status": "inconclusive", "evidenceRefs": ["evidence:preproduction"]},
    "controlledRelease": {"status": "not_started", "evidenceRefs": []},
    "operationalAcceptance": {"status": "not_started", "evidenceRefs": []}
  },
  "decision": "additional_verification",
  "decisionOwner": "product-owner-role",
  "nextAction": "complete production qualification",
  "expiresAt": "2026-10-08",
  "rollbackOwner": "operations-role",
  "resultPath": "injected-result-path"
}
```

## 状態を混ぜない

許可する状態例:

- `pass`: 定義済みの条件を証拠が満たした。
- `fail`: 条件を満たさない観測があった。
- `inconclusive`: 実行したが証拠が足りない、または矛盾がある。
- `not_started`: まだ評価していない。
- `not_applicable`: 対象外である根拠がある。

`研究成功 = 本番投入可`、`benchmark上位 = 利用者価値あり`、`canary無事故 = 安全性証明`という変換は禁止する。

## 自動化と人の判断

自動化できるもの:

- schema、必須項目、revision、checksum、証拠参照の存在。
- gateの順序、未完了gate、期限切れwaiver、異なるtarget revisionの混入。
- 負荷、精度、費用、latencyなど、定義済みmetricのしきい値判定。

人が判断するもの:

- 研究結果をどの利用者価値へ結び付けるか。
- model化で捨てた前提を本番で許容できるか。
- 残る危害と不確かさを誰が受容できるか。
- 研究を続ける価値と、実装・運用costのtrade-off。

## 公開根拠

- NASAのTRLは技術成熟度を、実績と想定運用条件での実証に結び付ける。
- ACMのartifact reviewは論文の採否とartifactの利用可能性・再現性を分けて扱う。
- NIST AI RMFはAI riskをlifecycle全体で管理し、TEVVを文書化された反復可能な活動として扱う。
- GoogleのML運用資料は、offline実験とは別にpipeline、monitoring、skew、canary、rollbackを必要としている。

詳細URLは[source catalog](source-catalog.md)にまとめる。
