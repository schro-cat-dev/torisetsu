# C1. 入出力契約

## 目的

小型LLMをfield lineage harnessへ組み込む時に、何を入力し、何を出力し、何を保存してよいかを決める。

## 契約の考え方

LLMへ渡す入力は最小化する。LLMの出力は候補として扱い、確定情報は別の検証器で確認する。

| 種類 | 例 | 扱い |
|---|---|---|
| 入力source | ASTから抽出した代入、call、schema field | 必要な周辺だけ渡す |
| LLM出力 | field分類、transform候補、説明 | 候補として保存 |
| 検証結果 | 型一致、schema一致、参照先一致 | 確定判定に使う |
| 証跡 | file、line、source tool、confidence | 必ず保存 |

## 入力契約

```json
{
  "schemaVersion": "field-lineage-llm-input.v1",
  "caseId": "create-user.display-name.001",
  "language": "typescript",
  "scope": {
    "repository": "example-repo",
    "files": ["src/routes/users.ts", "src/usecases/create-user.ts", "prisma/schema.prisma"]
  },
  "fieldCandidates": [
    {
      "fieldRef": "F1",
      "expression": "req.body.name",
      "file": "src/routes/users.ts",
      "line": 12,
      "staticEvidence": ["http_request_body", "zod_schema_user_create"]
    },
    {
      "fieldRef": "F2",
      "expression": "input.displayName",
      "file": "src/usecases/create-user.ts",
      "line": 21,
      "staticEvidence": ["function_param", "assignment_from_F1"]
    }
  ],
  "allowedLabels": {
    "fieldCategory": ["domain", "system", "meta", "security", "derived"],
    "evidenceState": ["EXTRACTED", "INFERRED", "AMBIGUOUS", "UNVERIFIED"]
  }
}
```

## context最小化契約

LLMへ渡すcontextは、下の順に増やす。最初から関係ファイル全体を渡さない。

| level | 入力 | 目的 | 上げる条件 |
|---|---|---|---|
| C0 | field名、型、source/sink候補だけ | 分類の下限確認 | confidenceが低い |
| C1 | C0 + 近傍3-10行 | rename/copy候補 | edge候補が出ない |
| C2 | C1 + validator/schema抜粋 | required/default確認 | validationが絡む |
| C3 | C2 + 呼び出し元/呼び出し先1段 | flow確認 | 間接運搬が疑われる |
| C4 | C3 + 設計書抜粋 | ドメイン意味確認 | コードだけでは意味不明 |

最初の評価はC0-C2を中心にする。C3-C4はLLM性能だけではなく、context設計と検索品質の影響が大きくなるため、別枠で測る。

## 出力契約

```json
{
  "schemaVersion": "field-lineage-llm-output.v1",
  "caseId": "create-user.display-name.001",
  "edges": [
    {
      "from": "F1",
      "to": "F2",
      "transformKind": "rename",
      "meaning": "request body name is passed as usecase displayName",
      "fieldCategory": "domain",
      "originDomain": "user",
      "evidenceState": "INFERRED",
      "confidence": 0.78,
      "needsStaticVerification": true
    }
  ],
  "unknowns": [
    {
      "fieldRef": "F2",
      "reason": "validation default value was not provided in input"
    }
  ]
}
```

## 保存単位

| 保存単位 | 必須field | 理由 |
|---|---|---|
| `FieldNode` | `fieldRef`, `expression`, `file`, `line`, `fieldCategory` | fieldそのものを追う |
| `LineageEdge` | `from`, `to`, `transformKind`, `evidenceState`, `confidence` | fieldの移動を追う |
| `StorageSink` | `sinkType`, `table`, `column`, `file`, `line` | 端でどこに保存されるかを見る |
| `EvidenceRef` | `sourceTool`, `file`, `line`, `state` | 根拠の強さを分ける |
| `ModelRun` | `modelId`, `license`, `quantization`, `runtime`, `tokensPerSecond` | 再現性とコストを見る |

## 失敗時の扱い

| 失敗 | 扱い |
|---|---|
| JSON parse error | 1回だけ再試行し、失敗したら `invalid_output` |
| confidence < 0.75 | 確定候補にしない |
| evidenceState = `AMBIGUOUS` | 人間確認または追加静的解析へ回す |
| license未確認 | 比較対象から一時除外する |
| private情報混入 | 実行を止め、ログ保存しない |

## 外部consumerからの検証

LLM出力は、下流consumerが読めるかで評価する。

| consumer | 確認すること |
|---|---|
| schema validator | JSON parse、必須field、enum、confidence範囲 |
| static verifier | `from/to` が実在fieldか、file/lineが存在するか |
| lineage store | `FieldNode` と `LineageEdge` として保存できるか |
| reviewer UI | `AMBIGUOUS` と `EXTRACTED` を混同せず表示できるか |
