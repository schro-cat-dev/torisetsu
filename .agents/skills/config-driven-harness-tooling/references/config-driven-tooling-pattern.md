# Config Driven Tooling Pattern

## 目的

具体ルールをツール本体へ直書きせず、外部configから渡して実行する。

## 最小構造

```text
runner
  - configを読む
  - configを検証する
  - 共通処理を実行する
  - resultを出す

config
  - 対象path
  - 対象scope
  - ルール
  - 期待値
```

## サンプルconfig

```json
{
  "schemaVersion": "text-quality-gate.v1",
  "gateId": "sample-config-driven-tooling",
  "targets": [
    {
      "id": "sample-doc",
      "path": ".agents/skills/config-driven-harness-tooling/references/sample-target.md"
    }
  ],
  "rules": [
    {
      "ruleId": "must-mention-config",
      "type": "mustInclude",
      "value": "config",
      "message": "configから具体ルールを渡す説明が必要"
    }
  ]
}
```

## ルールtype

| type | 意味 | 例 |
|---|---|---|
| `mustInclude` | 指定文字列が必要 | `config` を含む |
| `mustNotInclude` | 指定文字列があるとNG | `TODO専用runner` を含まない |
| `regexMustMatch` | 正規表現に一致する必要がある | `config|policy|scenario|contract` |
| `regexMustNotMatch` | 正規表現に一致するとNG | `password|secret` |
| `maxOccurrences` | 指定文字列の出現回数上限 | `TODO専用` は0回 |

## 使い回しの判断

| 判断 | OK条件 |
|---|---|
| 新しい対象追加 | config追加だけで動く |
| runner修正 | 新しいrule typeが必要な時だけ |
| 個別値 | config側にある |
| 結果 | 同じJSON形式で出る |

## 価値

- 似た確認を毎回作り直さない。
- AIが必要なconfigを検索しやすい。
- 対象scopeだけ取り出して確認できる。
- 蓄積するほど、速さ、品質、再現性、低コスト化に効く。
