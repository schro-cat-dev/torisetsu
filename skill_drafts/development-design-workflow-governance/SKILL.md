---
name: development-design-workflow-governance
description: "Use when planning, designing, implementing, reviewing, or estimating a development task from completion conditions backward: milestones, domain information, data intake, scope control, data models, logic flows, benchmarks, TDD, harness scripts, generic modules, pure core logic, main integration, implementation, and result review."
---

# Development Design Workflow Governance

このskillは、開発や設計を `完了条件` から逆算し、タスク、ドメイン、データ、モデル、フロー、ベンチマーク、TDD、ハーネス、実装、レビューまで一気通貫で進めるために使う。

## 1. 基本方針

- まず実際の工程と完了条件を確認する。
- 完了条件から逆算し、足りない情報、成果物、確認方法を一つずつ洗い出す。
- タスクをマイルストーンに分け、それぞれに完了条件、チェックリスト、見積もり、証跡を置く。
- ドメイン情報、データ受領、スコープ管理、データ型、ロジック、フロー、品質保証を混ぜずに扱う。
- コアロジックは副作用のない純粋な設計に寄せる。
- config、入力データ、環境差分、柔軟に変えたい値は別ファイルへ分ける。
- 共通処理やコアでない処理はモジュール化し、`main` や起動層で統合する。
- 実装後は、実データ、実行結果、原因位置、フロー外要因を分けてレビューする。

## 2. 最初に出す結論

作業前に、次を短く出す。

| 項目 | 書くこと |
|---|---|
| 結論 | 今やるべき進め方 |
| 対象 | 何を作る/直す/設計するか |
| 完了条件 | 何ができたら終わりか |
| マイルストーン | どの区切りで確認するか |
| 想定コスト | ざっくり時間/難しさ |
| 品質ゲート | 何を通れば次へ進めるか |
| ユーザー確認 | 判断が必要な未確定点 |

期限とマイルストーンが未指定なら、最初に短く確認する。ただし `今日中`、`一旦push`、`まずドラフト` などがある場合は、それを仮の期限/区切りとして扱う。

## 3. 進め方

1. 完了条件を決める。
2. 完了条件から逆算し、足りない情報を洗い出す。
3. マイルストーンタスクに分ける。
4. タスク別に、完了条件とチェックリストを作る。
5. ドメイン情報を集め、開発へ落とし込む。
6. データ受領、データsource、信頼できる正本を決める。
7. スコープを決め、やること/やらないことを分ける。
8. データ型モデルと入出力契約を定義する。
9. ロジックとフローをステップで分ける。
10. ベンチマーク、しきい値、TDD、ハーネスを設計する。
11. 汎用性をどこまで保証するか決め、工数を見積もる。
12. コアロジック、共通モジュール、main統合、外部I/Oを分けて実装する。
13. 実データと実行結果でレビューする。
14. 原因がフロー内か、フロー外かを見極める。
15. 不足を補い、次のバージョンへ進める。

## 4. マイルストーン表

優先度は5が高い。コストと恩恵は10が高い。

| milestone | 目的 | 完了条件 | チェック | 優先度 | コスト | 恩恵 | 証跡 |
|---|---|---|---|---:|---:|---:|---|
| M1 Scope | 対象と非対象を決める | やる/やらない/未定が分かれている | scope checklist | 5 | 2 | 9 | scope doc |
| M2 Domain | ドメインを開発へ変換する | 用語、業務ルール、例外がある | domain checklist | 5 | 4 | 10 | domain notes |
| M3 Data | データ受領と正本を決める | source、形式、欠損、機密が分かる | data intake checklist | 5 | 4 | 10 | data contract |
| M4 Model | 型と契約を作る | 入出力schemaと例がある | schema tests | 5 | 5 | 10 | model/schema |
| M5 Flow | ロジックをステップ化する | 正常系/異常系/境界がある | flow tests | 5 | 5 | 10 | flow map |
| M6 Benchmark | 品質を測る | 指標、しきい値、根拠がある | benchmark tests | 5 | 4 | 9 | benchmark spec |
| M7 Harness | 確認を自動化する | 実行scriptと結果証跡がある | harness run | 5 | 6 | 10 | run summary |
| M8 Implementation | 実装する | 完了条件とテストを満たす | tests/build | 5 | 7 | 10 | code/result |
| M9 Review | 結果を見直す | 原因位置と次の修正が分かる | review checklist | 5 | 3 | 9 | review notes |

## 5. タスク別チェックリスト

### 5.1 スコープ管理

- [ ] 目的が1文で書かれている。
- [ ] やることが箇条書きである。
- [ ] やらないことが箇条書きである。
- [ ] 未定事項がある。
- [ ] ユーザー判断が必要な点が分かる。
- [ ] スコープ外へ勝手に波及していない。

### 5.1.1 要件と処理の分類

システム開発では、要件や処理を最初に分類して扱う。分類は、情報管理と設計判断のために使う。アプリ内部で全分類情報をまとめて運搬するという意味ではない。

基本分類:

| 大分類 | 小分類 | 扱い |
|---|---|---|
| 機能要件 | ドメインコアロジック | 業務ルール、状態遷移、判定、不変条件。最重要のcore |
| 機能要件 | UI操作処理ロジック | 画面操作、状態管理、制御、ユーザーへの提供価値。core寄り |
| 機能要件 | 裏側のアルゴリズム系ロジック | ドメインコアとは別の計算、推定、探索、変換。core寄り |
| 機能要件 | DB保存、データ連携、周辺処理 | 保存、同期、連携、import/export。周辺処理として分離 |
| 機能要件 | 権限別アクセス要件 | 誰が、どのデータ/機能へ、どの条件でアクセスできるか |
| 非機能要件 | 連携処理 | 外部service、API、queue、batch、webhookなどとの接続 |
| 非機能要件 | 法務対応処理 | 同意、保存期間、削除、監査証跡、規約対応 |
| 非機能要件 | セキュリティ処理 | 認証、認可、多層防御、secret管理、入力検証 |
| 非機能要件 | スケール/同期制御 | 非同期、同期、帯域幅調整、retry、rate limit |
| 非機能要件 | 監査要件の実装処理 | 業務監査、システム監査、操作ログ、変更履歴 |

追加で見る候補:

| 候補 | 優先度 | おすすめ度 | 背景 |
|---|---:|---:|---|
| API/公開interface | 5 | 5 | UI、外部連携、他systemが受け取る入口/出口になる |
| observability | 4 | 5 | log、metrics、traceがないと原因箇所を追いにくい |
| reliability/recovery | 4 | 4 | retry、冪等性、復旧、backupがないと障害時に壊れやすい |
| data governance | 4 | 4 | 個人情報、保持期間、削除、maskingを後付けしにくい |
| accessibility/UX品質 | 4 | 4 | ユーザー提供価値や利用可能性に直結する |
| 運用/設定管理 | 3 | 4 | env、feature flag、deploy差分を分けないと管理が重くなる |

優先度は5が高い。ここでの優先度は `開発前に分類しないと後から設計や品質保証が崩れやすいか` の視点で見る。

coreの扱い:

- 基本coreは、`ドメインコアロジック`、`UI操作処理ロジック`、`裏側のアルゴリズム系ロジック` の3つを中心に見る。
- DB保存、データ連携、外部連携、法務、セキュリティ、監査、スケール処理は重要だが、ドメインコアそのものに混ぜない。
- 権限別アクセス要件は、機能要件として見つつ、セキュリティ要件とも関連づける。

設計に落とす時の形:

| 項目 | 書くこと |
|---|---|
| requirement id | `FR-CORE-001`、`NFR-SEC-001` のような一意ID |
| requirement kind | `functional` または `nonFunctional` |
| processing kind | `domainCore`、`uiOperation`、`algorithmCore`、`dataIntegration` など |
| core level | `core`、`core-adjacent`、`peripheral` |
| owner layer | `domain`、`ui`、`application`、`adapter`、`infrastructure` |
| access scope | 権限別アクセス要件が関係する場合に書く |
| benchmark | 品質を何で測るか |
| harness check | 何を自動確認するか |

分類データ例:

```json
{
  "schemaVersion": "requirement-processing-classification.v1",
  "items": [
    {
      "id": "FR-CORE-001",
      "requirementKind": "functional",
      "processingKind": "domainCore",
      "coreLevel": "core",
      "summary": "辞退済み候補者は面接予定を追加できない",
      "ownerLayer": "domain",
      "benchmark": "invalid_transition_rejection_rate == 100%",
      "harnessCheck": "state-transition-scenarios"
    },
    {
      "id": "FR-UI-001",
      "requirementKind": "functional",
      "processingKind": "uiOperation",
      "coreLevel": "core-adjacent",
      "summary": "保存中は二重送信できない",
      "ownerLayer": "ui",
      "benchmark": "double_submit_block_rate == 100%",
      "harnessCheck": "browser-e2e"
    },
    {
      "id": "NFR-SEC-001",
      "requirementKind": "nonFunctional",
      "processingKind": "security",
      "coreLevel": "peripheral",
      "summary": "採用担当者は自部署の候補者だけ閲覧できる",
      "ownerLayer": "application",
      "accessScope": "role=hiring_manager, resource=candidate, scope=own_department",
      "benchmark": "unauthorized_access_block_rate == 100%",
      "harnessCheck": "access-control-scenarios"
    }
  ]
}
```

権限別アクセス要件:

- [ ] actor/roleを決める。例: `admin`、`hiring_manager`、`interviewer`。
- [ ] resourceを決める。例: `candidate`、`job`、`interviewFeedback`。
- [ ] actionを決める。例: `read`、`create`、`update`、`delete`、`approve`。
- [ ] scopeを決める。例: `all`、`own_department`、`assigned_only`。
- [ ] deny条件を明示する。
- [ ] UI表示制御とserver側認可を分ける。
- [ ] 権限テストを用意する。

権限データ例:

```json
{
  "schemaVersion": "access-requirement.v1",
  "role": "interviewer",
  "resource": "candidate",
  "allowedActions": ["read", "comment"],
  "scope": "assigned_only",
  "deniedActions": ["delete", "changeStatus"],
  "serverSideAuthorizationRequired": true,
  "uiVisibilityRule": "hide_denied_actions"
}
```

ハーネスで確認すること:

| 確認 | OK条件 |
|---|---|
| classification coverage | 要件ごとに大分類、小分類、core levelがある |
| core separation | domain coreにDB、HTTP、logger、env、harnessが混ざっていない |
| access control | 権限別に許可/拒否scenarioがある |
| UI/server split | UI非表示だけで認可を済ませていない |
| benchmark mapping | 各分類に最低1つの評価軸か、不要理由がある |
| harness mapping | 自動確認できるものと人間確認するものが分かれている |

### 5.2 ドメイン情報

- [ ] ドメイン用語がある。
- [ ] 用語ごとの意味、背景、使う場面がある。
- [ ] 業務ルールがある。
- [ ] 例外パターンがある。
- [ ] 開発に落とす時の型、状態、イベント、制約がある。

例:

| ドメイン情報 | 開発への落とし込み |
|---|---|
| 候補者は選考ステータスを持つ | `Candidate.status` enum |
| 辞退後は面接予定を追加しない | state transition guard |
| 面接評価は後から監査できる必要がある | audit log model |

### 5.3 データ受領

- [ ] データsourceが分かる。
- [ ] 正本がどこか分かる。
- [ ] 形式が分かる。例: JSON、CSV、DB、API。
- [ ] 欠損値、異常値、重複の扱いがある。
- [ ] 機密情報、個人情報、ログ出力禁止項目が分かる。
- [ ] fixtureやサンプルデータがある。

最小データ契約例:

```json
{
  "schemaVersion": "candidate.v1",
  "requiredFields": ["id", "name", "status", "createdAt"],
  "allowedStatus": ["applied", "screening", "interview", "offer", "rejected", "withdrawn"],
  "piiFields": ["name", "email", "phone"]
}
```

### 5.4 データ型モデル

- [ ] entity、value object、DTO、view modelを分ける。
- [ ] 入力と出力を分ける。
- [ ] unknown fieldの扱いを決める。
- [ ] enum、date、nullable、単位を決める。
- [ ] schemaVersionを持つ。
- [ ] データ型定義モデルの参照番号を決める。
- [ ] 参照番号を、実行時のtrace IDや処理経路IDと混ぜていない。

例:

```ts
type CandidateStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

type Candidate = {
  id: string;
  name: string;
  status: CandidateStatus;
  createdAt: string;
  updatedAt: string;
};
```

### 5.4.1 データ型定義モデルの参照番号

`X1-Y1-Y2` のような連番を `-` でつないだ表記は、処理経路IDではなく、データ型定義モデルを参照する番号として扱う。

目的:

- どの中間データ型、入出力契約、受け渡しモデルを見ればよいかを一意に指定する。
- 同じ名前の型や似た処理が増えても、参照先が衝突しないようにする。
- 実装、テスト、ハーネス、ドキュメントから同じデータ型定義を参照できるようにする。

表記:

| 表記 | 扱い | 例 |
|---|---|---|
| `X1-Y1` | `X1` と `Y1` の間で使うデータ型定義モデルの参照番号 | API入力からhandler入力への変換型 |
| `X1-Y1-Y2` | `Y2` までに使う、または `Y1 -> Y2` で成立するデータ型定義モデルの参照番号 | handler出力からvalidator入力への型 |
| `X1-Y1-Y2-Y3` | さらに後段まで進んだ時のデータ型定義モデルの参照番号 | validator出力からusecase入力への型 |

注意:

- この番号は、実行時ログのtrace IDではない。
- この番号は、物理的な処理経路そのものを表すIDではない。
- 処理の並びを表記に借りるが、主目的は `データ型定義モデルを衝突なく参照すること`。
- 実行経路を管理するIDが必要な場合は、`traceId`、`flowRunId`、`routinePathId` など別名で分ける。

データ定義例:

```json
{
  "schemaVersion": "type-model-reference.v1",
  "referenceId": "X1-Y1-Y2",
  "kind": "dataTypeModelReference",
  "targetType": "ValidatedCreateTodoInput.v1",
  "fromRoutine": "Y1",
  "toRoutine": "Y2",
  "purpose": "Y1からY2へ渡す中間データ型定義を参照する"
}
```

### 5.4.2 ルーチンとデータ型定義モデルの対応

実際の呼び出しルーチンと、データ型定義モデルの参照番号を対応づける。これにより、実装、設計、テスト、ハーネス、レビューで同じ型定義を一意に参照できる。

扱い:

| 要素 | 意味 | 例 |
|---|---|---|
| routine id | 実際の処理単位、module、関数 | `X1`, `Y1`, `Y2` |
| type model ref | データ型定義モデルの参照番号 | `X1-Y1`, `X1-Y1-Y2` |
| routine link | どのroutine間で受け渡すか | `Y1 -> Y2` |
| schema path | 型定義や検証schemaの場所 | `contracts/X1-Y1-Y2.schema.json` |

参照番号の考え方:

- `X1-Y1` は、`X1` から `Y1` に渡すデータ型定義モデルを指す。
- `X1-Y1-Y2` は、`Y1` から `Y2` に渡すデータ型定義モデルを指す。
- `X1-Y1-Y2-Y3` は、`Y2` から `Y3` に渡すデータ型定義モデルを指す。
- 直前の2点だけでなく、上流からの連番を含めることで、別フローに同名routineが出ても衝突しにくくする。

設計台帳例:

```json
{
  "schemaVersion": "routine-type-model-map.v1",
  "flowName": "create-todo",
  "routines": [
    {
      "id": "X1",
      "module": "src/api/createTodoRoute.ts",
      "function": "handleCreateTodo",
      "calls": ["Y1"]
    },
    {
      "id": "Y1",
      "module": "src/features/todos/createTodoHandler.ts",
      "function": "createTodoHandler",
      "calls": ["Y2"]
    },
    {
      "id": "Y2",
      "module": "src/features/todos/validateCreateTodo.ts",
      "function": "validateCreateTodo",
      "calls": ["Y3"]
    },
    {
      "id": "Y3",
      "module": "src/features/todos/createTodoUsecase.ts",
      "function": "createTodoUsecase",
      "calls": ["Y4"]
    }
  ],
  "typeModels": [
    {
      "ref": "X1-Y1",
      "from": "X1",
      "to": "Y1",
      "name": "CreateTodoHttpInput",
      "schema": "contracts/X1-Y1.create-todo-http-input.schema.json"
    },
    {
      "ref": "X1-Y1-Y2",
      "from": "Y1",
      "to": "Y2",
      "name": "CreateTodoRawInput",
      "schema": "contracts/X1-Y1-Y2.create-todo-raw-input.schema.json"
    },
    {
      "ref": "X1-Y1-Y2-Y3",
      "from": "Y2",
      "to": "Y3",
      "name": "ValidatedCreateTodoInput",
      "schema": "contracts/X1-Y1-Y2-Y3.validated-create-todo-input.schema.json"
    }
  ]
}
```

TypeScriptでの実装イメージ:

```ts
type RoutineId = "X1" | "Y1" | "Y2" | "Y3";

type TypeModelRef =
  | "X1-Y1"
  | "X1-Y1-Y2"
  | "X1-Y1-Y2-Y3";

type RoutineLink = {
  from: RoutineId;
  to: RoutineId;
  typeModelRef: TypeModelRef;
};

const routineLinks: RoutineLink[] = [
  { from: "X1", to: "Y1", typeModelRef: "X1-Y1" },
  { from: "Y1", to: "Y2", typeModelRef: "X1-Y1-Y2" },
  { from: "Y2", to: "Y3", typeModelRef: "X1-Y1-Y2-Y3" }
];

const typeModelRegistry: Record<TypeModelRef, { name: string; schema: string }> = {
  "X1-Y1": {
    name: "CreateTodoHttpInput",
    schema: "contracts/X1-Y1.create-todo-http-input.schema.json"
  },
  "X1-Y1-Y2": {
    name: "CreateTodoRawInput",
    schema: "contracts/X1-Y1-Y2.create-todo-raw-input.schema.json"
  },
  "X1-Y1-Y2-Y3": {
    name: "ValidatedCreateTodoInput",
    schema: "contracts/X1-Y1-Y2-Y3.validated-create-todo-input.schema.json"
  }
};

function assertRoutineTypeModels() {
  for (const link of routineLinks) {
    const model = typeModelRegistry[link.typeModelRef];
    if (!model) {
      throw new Error(`Missing type model: ${link.typeModelRef}`);
    }
  }
}
```

ハーネスで確認すること:

| 確認 | OK条件 |
|---|---|
| routine id | 台帳内で重複しない |
| routine link | `from` と `to` が `routines` に存在する |
| type model ref | `typeModels.ref` に存在する |
| schema path | 実ファイルが存在する |
| code export | `module` に `function` が存在する |
| test mapping | `typeModelRef` に対応するテストがある |

確認結果例:

```json
{
  "schemaVersion": "routine-type-model-check-result.v1",
  "flowName": "create-todo",
  "checkedLinks": 3,
  "missingTypeModels": [],
  "missingSchemas": [],
  "missingTests": [],
  "status": "ok"
}
```

この方式で防ぎたいズレ:

- 実装では `Y1 -> Y2` に渡しているのに、ドキュメント上の型が別物になっている。
- テストが `ValidatedCreateTodoInput` を見ているつもりでも、実際は `CreateTodoRawInput` を見ている。
- 同じ `Y1 -> Y2` という名前の境界が別フローにもあり、型定義の参照が衝突する。
- レビュー時に「この中間データはどれか」を人間が探す必要がある。

### 5.5 ロジック/フロー

- [ ] 正常系をステップで書く。
- [ ] 異常系をステップで書く。
- [ ] 境界値を出す。
- [ ] どこで失敗したらどう戻すかを書く。
- [ ] フロー内原因とフロー外原因を分ける。

例:

```text
応募作成:
1. 候補者を選ぶ
2. 求人を選ぶ
3. 重複応募を確認する
4. Applicationを作成する
5. 選考ステータスを applied にする
6. audit log を残す
```

### 5.6 ベンチマーク/しきい値

- [ ] 何を測るかを書く。
- [ ] しきい値、operator、単位を書く。
- [ ] 根拠を書く。
- [ ] 正例、負例、境界例を作る。
- [ ] 実測が3回未満なら仮値として扱う。

初期値例:

| 指標 | operator | 値 | 単位 | 意味 |
|---|---|---:|---|---|
| must_quality_pass_rate | `==` | 100 | % | 必須品質条件は全通過 |
| human_only_findings_reduction | `>=` | 70 | % | 人間だけが見つける不足を減らす |
| revision_request_reduction | `>=` | 50 | % | 修正依頼を減らす |
| harness_detection_ratio | `>=` | 70 | % | 機械で拾えるものを増やす |

### 5.7 TDD/ハーネス

- [ ] テスト対象と要件が紐づいている。
- [ ] 実行scriptがある。
- [ ] 入力データ、期待結果、実結果が分かれる。
- [ ] summaryと詳細結果が分かれる。
- [ ] 失敗時にどこを直すか分かる。
- [ ] push/PR前のAIチェックがある。

ハーネス入力例:

```json
{
  "schemaVersion": "flow-scenario.v1",
  "name": "candidate-application-flow",
  "steps": [
    { "action": "createCandidate", "expect": { "status": "applied" } },
    { "action": "moveToInterview", "expect": { "status": "interview" } },
    { "action": "rejectCandidate", "expect": { "status": "rejected" } }
  ]
}
```

### 5.8 汎用性

- [ ] 汎用化する対象が2種類以上ある。
- [ ] 共通エンジンと個別データを分けている。
- [ ] configや入力値は別ファイルにある。
- [ ] エンジン本体に個別path、host、port、業務名が直書きされていない。
- [ ] 新しいケースを追加してもエンジン本体のdiffが0である。

汎用性レベル:

| レベル | 意味 | 受け入れ条件 |
|---|---|---|
| L0 | 単一用途 | 1ケースだけ動く |
| L1 | 入力データ差し替え | data/config追加で動く |
| L2 | adapter差し替え | JSON/CSV/APIなどsource追加に対応 |
| L3 | plugin/extension | 新しい実行moduleを追加できる |

原則:

- 実例が1つならL0かL1で止める。
- L2以上は、2種類以上の実データや実フローが見えてから検討する。
- 過剰な汎用化で実装が遅くなるなら、範囲を下げる。

### 5.9 実装

- [ ] コアロジックは純粋関数に寄せる。
- [ ] 外部I/Oはmain、adapter、repository、gatewayへ分ける。
- [ ] 共通処理はutility/moduleへ分ける。
- [ ] configや実行時入力は外部ファイルへ分ける。
- [ ] ドメインコアにメタ情報、I/O、外部連携、ハーネス都合の処理を混ぜていない。
- [ ] 統合ルーチン処理層で、core、adapter、contract、config、utilityを接続している。
- [ ] エラーは原因、対象、入力、次の行動が分かる形にする。
- [ ] ログにsecret、token、個人情報を出さない。

分離例:

```text
core/
  evaluateCandidate.ts       # 副作用なし
adapters/
  candidateJsonLoader.ts     # JSON読み込み
contracts/
  candidate.contract.json    # 入力契約
main.ts                      # 読み込み、実行、出力を統合
```

### 5.9.1 ドメインコアを汚さない分離

ドメインコアを作る時は、メタ情報、周辺utility、I/O、外部連携、ハーネス都合の処理を混ぜない。AIは周辺実装を増やしすぎることがあるため、最初に分離線を引く。

目的:

- ドメイン、業務ルール、重要な設計実装を純粋な状態で管理する。
- 使い回せる処理、I/O、外部とのやりとり、埋め合わせ処理は責務分離し、再利用できるようにする。
- `main` や統合ルーチン処理層で接続し、ドメインコアを周辺都合で汚さない。

分離:

| 層 | 持つもの | 持たないもの |
|---|---|---|
| domain core | 業務ルール、状態遷移、判定、計算、不変条件 | file path、HTTP、DB、logger、env、harness、trace、schema path |
| integration routine | 呼び出し順、adapter接続、contract参照、core呼び出し | 業務ルールそのもの |
| adapter/gateway | API、DB、file、外部serviceとのI/O | ドメイン判断 |
| utility/module | 汎用parse、format、date変換、result整形 | 特定ドメインの判断 |
| contracts/config | schema、type model ref、入力データ、しきい値 | 実行ロジック |
| harness/tests | 期待値、fixture、品質確認、TDD | 本番ドメイン処理 |

守ること:

- domain core は `domain types` と純粋utilityだけに依存する。
- domain core から `fs`、HTTP client、DB client、logger、env、CLI、harness、test fixture を呼ばない。
- `typeModelRef`、`routineId`、`schema path` は台帳やcontractに置き、domain coreへ埋め込まない。
- adapterやutilityは必要になった時に作る。まだ1箇所でしか使わない処理を、先に大きく抽象化しない。
- ただし、I/O、外部連携、ログ、日付、ID生成、format変換は、ドメインコアへ入れず周辺層へ出す。

悪い例:

```ts
// NG: ドメイン処理にI/O、logger、schema path、保存処理が混ざっている。
import { writeFileSync } from "node:fs";
import { logger } from "../logger";
import { saveTodo } from "../db/todoRepository";

export async function createTodo(input: unknown) {
  logger.info("createTodo:start");

  const schemaPath = "contracts/X1-Y1-Y2.create-todo-raw-input.schema.json";
  const todo = validateWithSchema(schemaPath, input);

  if (!todo.title) {
    throw new Error("title is required");
  }

  const saved = await saveTodo({
    ...todo,
    status: "todo",
    createdAt: new Date().toISOString()
  });

  writeFileSync("tmp/last-created-todo.json", JSON.stringify(saved));
  return saved;
}
```

困ること:

- ドメインルールが `title必須` なのか、DB保存なのか、ログなのか見えにくい。
- テスト時にDB、file、現在時刻、schema pathへ引っ張られる。
- 別アプリや別I/Oへ持っていく時、コアをそのまま使い回せない。

良い例:

```ts
// domain/createTodo.ts
export type CreateTodoInput = {
  title: string;
  description?: string;
  now: string;
};

export type Todo = {
  id: string;
  title: string;
  description?: string;
  status: "todo";
  createdAt: string;
};

export function createTodoCore(input: CreateTodoInput, id: string): Todo {
  const title = input.title.trim();

  if (!title) {
    throw new Error("title is required");
  }

  return {
    id,
    title,
    description: input.description,
    status: "todo",
    createdAt: input.now
  };
}
```

```ts
// routines/createTodoRoutine.ts
import { createTodoCore } from "../domain/createTodo";
import { loadSchema } from "../contracts/loadSchema";
import { createId } from "../utilities/createId";
import { saveTodo } from "../adapters/todoRepository";

const typeModelRef = "X1-Y1-Y2-Y3";

export async function createTodoRoutine(rawInput: unknown) {
  const input = loadSchema(typeModelRef).parse(rawInput);

  const todo = createTodoCore(
    {
      title: input.title,
      description: input.description,
      now: new Date().toISOString()
    },
    createId()
  );

  await saveTodo(todo);
  return todo;
}
```

```json
{
  "schemaVersion": "routine-type-model-map.v1",
  "routine": "createTodoRoutine",
  "typeModelRef": "X1-Y1-Y2-Y3",
  "core": "domain/createTodo.ts#createTodoCore",
  "adapters": ["adapters/todoRepository.ts#saveTodo"],
  "utilities": ["utilities/createId.ts#createId"],
  "contract": "contracts/X1-Y1-Y2-Y3.validated-create-todo-input.schema.json"
}
```

この例での役割:

| 対象 | 役割 |
|---|---|
| `createTodoCore` | ドメインコア。入力からTodoを作る純粋処理 |
| `createTodoRoutine` | 統合ルーチン処理層。schema、時刻、ID、保存を接続 |
| `loadSchema(typeModelRef)` | データ型定義モデル参照番号からcontractを読む |
| `saveTodo` | 外部I/O。DBやfile保存を担当 |
| `routine-type-model-map.v1` | routine、core、adapter、contractの対応台帳 |

ハーネスで確認すること:

| 確認 | OK条件 |
|---|---|
| core purity | domain coreが `fs`、HTTP、DB、env、logger、harnessをimportしていない |
| routine mapping | routine台帳に `core`、`typeModelRef`、`contract` がある |
| contract existence | `typeModelRef` に対応するschema fileが存在する |
| core test | domain coreをI/Oなしでテストできる |
| routine test | routineがadapter mockまたはfixtureで期待通り接続する |
| reuse check | 新しいI/Oを足してもdomain coreのdiffが0 |

### 5.10 レビュー

- [ ] 実データでどうだったかを見る。
- [ ] 得られた結果を数値と文章で残す。
- [ ] 原因がフロー内か、フロー外かを分ける。
- [ ] フロー内なら、どのstepかを特定する。
- [ ] フロー外なら、入力、前提、環境、ユーザー指示、AI解釈のどこかを見る。
- [ ] 次の修正、追加ベンチマーク、削るものを決める。

レビュー出力例:

```text
結果:
- scenario 12件中11件pass
- 失敗1件: rejected -> offer が通ってしまった

原因:
- フロー内: state transition guard の step 4

次の修正:
- rejected から offer へ移動する遷移をNGにする
- 境界テストを1件追加する
```

## 6. 見積もり

見積もりは粗くてよいが、根拠を1文で添える。

| コスト | 目安 | 例 |
|---:|---|---|
| 1 | 15分以内 | 文言修正、小さいdoc追記 |
| 3 | 1時間以内 | 小さいschema、軽いチェック追加 |
| 5 | 半日 | 1フローの実装とテスト |
| 7 | 1から2日 | harness追加、複数ファイル連携 |
| 10 | 1週間以上 | 新規基盤、複数domain対応 |

`コスト5以上`、`実データを触る`、`外部連携する`、`スコープが曖昧` のどれかがある場合は、作業前にユーザー確認を入れる。

## 7. 出力フォーマット

```text
結論:
- <今やるべき進め方>

対象:
- <作る/直す/設計するもの>

完了条件:
- <何ができたら終わりか>

マイルストーン:
| id | task | 完了条件 | チェック | 優先度 | コスト | 証跡 |

設計:
- ドメイン:
- データ:
- モデル:
- フロー:
- ベンチマーク:
- ハーネス:
- 汎用性:

実装方針:
- core:
- config/data:
- common module:
- main integration:

レビュー:
- 実データ:
- 実結果:
- 原因位置:
- 次の修正:

確認が必要:
- <ユーザー判断が必要な点>
```

## 8. NG

- 完了条件なしで実装を始める。
- ドメイン情報を型やコードへ落とさない。
- データsourceと正本を決めない。
- ベンチマークを後付けにする。
- 汎用性を言うだけで、エンジンとデータを分けない。
- コアロジックに外部I/Oや環境依存を混ぜる。
- データ型定義モデルの参照番号を、実行時trace IDや処理経路IDとして扱う。
- メタ情報、ログ、I/O、外部連携、harness都合の処理でドメインコアを膨らませる。
- 周辺utilityやadapterを分けず、ドメインコア内で全部処理する。
- 実行結果を見ずに完了扱いにする。
- 原因がフロー内かフロー外かを分けない。
- 既存skillや既存ルールを勝手に上方修正する。

## 9. このdraftの扱い

- これは正式導入前のdraft skillとして扱う。
- 既存の `.agents/skills/*` は変更しない。
- 実用化前に、実タスクで1回以上試し、足りない項目、重すぎる項目、曖昧な項目を修正する。
- 別プロジェクトへ入れる場合は、そのプロジェクトの用語、ディレクトリ、実行コマンド、品質ゲートに合わせて調整する。
