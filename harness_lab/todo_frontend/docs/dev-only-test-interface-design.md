# 開発用インターフェースの本番切り離し設計

## 結論

- 実現可能。
- ただし、`_` で始まる関数を自動削除するだけでは危ない。
- このPoCでは、削除処理ではなく「本番sourceに開発用prefixを残さない」guardを先に入れる。

## 採用するprefix

| prefix | 用途 |
|---|---|
| `_test` | テスト専用の状態注入、検査 |
| `_debug` | デバッグ専用の状態確認 |
| `_dev` | 開発中だけの補助処理 |
| `_inspect` | 内部状態の観察 |

`_` だけを対象にしない理由:

- 通常の内部メソッドまで誤検出する。
- JS / TS / Python では `_name` が慣習的に使われる。
- 本番削除の対象が広すぎると、削除事故が起きる。

## 言語別の現実解

| 言語 | 実現方法 | 推奨度 | 理由 |
|---|---|---:|---|
| TypeScript / JavaScript | AST変換で予約prefixを削除 + post-build検査 | 4 | 実現可能。ただしbuild pipelineの責務が増える |
| TypeScript / JavaScript | test support fileを本番importしない | 5 | 単純で壊れにくい |
| Go | `_test.go` または `//go:build dev` | 5 | 標準機能で本番バイナリから外せる |
| Python | test helperを配布物に含めない | 4 | AST削除より運用とpackage設定の方が自然 |
| Python | ASTで削除して再出力 | 2 | 可能だが保守が重く、一般的ではない |

## このPoCで実装したこと

| ファイル | 役割 |
|---|---|
| `tooling/quality-harness/checks/run-file-content-policy.mjs` | 文字列・識別子混入を共通処理で確認する |
| `tooling/quality-harness/policies/dev-only-interface.policy.json` | `src/` に予約prefixが残っていないかの条件を書く |
| `tooling/quality-harness/policies/dev-only-build-artifact.policy.json` | `dist/` に予約prefixが残っていないかの条件を書く |
| `package.json` の `check:dev-only-interface-policy` | 上記guardを実行する |
| `package.json` の `check:dev-only-build-artifact-policy` | build後のguardを実行する |
| `profiles/default.json` | 通常の品質確認にguardを組み込む |

線引き:

- `run-file-content-policy.mjs` に残してよいもの: `file-content-policy.v1` などの入力契約。
- `run-file-content-policy.mjs` に書かないもの: 対象dir、禁止prefix、結果ファイル名。
- 対象dir、禁止prefix、結果ファイル名は `*.policy.json` に置く。

## 未採用

- TS / JS のAST削除plugin。
- PythonのAST書き換え。
- TS / JS のAST削除plugin。

未採用の理由:

- 今のTODOアプリには開発用裏口が存在しない。
- 先に削除pluginを入れると、ハーネス検証よりbuild pipeline検証の重さが勝つ。
- 現段階では `src/` と `dist/` の混入検出で十分に効果がある。

## 次に入れるなら

1. `*.test-support.ts` を本番buildから除外するルールを追加する。
2. 必要になった時だけ、Vite / Rollup のAST変換pluginを作る。
