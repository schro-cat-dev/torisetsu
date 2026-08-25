# AIレビューJSONゲート

このファイルは、AIレビュー結果を安全に扱うための最小ゲートをまとめる。

## 1. 結論

- 現時点で実装するのは、AIが出した後のJSON検査と表示前フィルタ。
- GitHub PRへの自動投稿はまだしない。
- Structured OutputsでAIから生成する処理も、このローカルPoCではまだしない。

## 2. 入力契約

入力は `reviews` 配列だけを持つ。

```json
{
  "reviews": [
    {
      "file": "src/foo.py",
      "line": 42,
      "severity": "HIGH",
      "policy_id": "ARCH-001",
      "message": "共有層がAPI層に依存しています。",
      "suggestion": "共有層からAPI層へのimportを外してください。",
      "confidence": 0.86
    }
  ]
}
```

問題なしの場合:

```json
{
  "reviews": []
}
```

## 3. フィルタ

| ルール | 値 | 判定 |
|---|---:|---|
| confidence下限 | `0.8` | `confidence >= 0.8` だけ残す |
| severity除外 | `LOW` | `LOW` は表示しない |
| 表示上限 | `5` | confidenceが高い順で最大5件 |

## 4. 実装

| ファイル | 役割 |
|---|---|
| `checks/check-ai-review-result.mjs` | contractを読み、JSON検査とフィルタを実行する |
| `contracts/ai-review-result.contract.json` | 必須field、severity、しきい値、fixtureを定義する |
| `fixtures/ai-review-results/*.json` | OK例、空配列、最大件数の確認データ |

実行:

```bash
npm run check:ai-review-result
npm run check:ai-review-output
```

## 5. 未対応

- 実際のAI API呼び出し。
- Structured OutputsのAPI連携。
- GitHub PRへのinline投稿。
- diff行マッピング。
- 重複排除。
- CIを落とす `blocking` 判定。
