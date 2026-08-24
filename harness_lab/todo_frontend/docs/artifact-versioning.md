# 成果物バージョン管理

このファイルは、TODO Quality Harness を成果物として更新していくためのルールです。

## 1. 目的

- アプリ、ハーネス、設計ドキュメントの状態を同じバージョンで追えるようにする。
- フィードバック、修正、品質チェックの変更を後から辿れるようにする。
- 「どの状態まで品質確認したか」を曖昧にしない。

## 2. 管理対象

- UI アプリ。
- ローカル API。
- 品質ハーネス。
- 設計・品質管理ドキュメント。
- 実行結果 `harness_runs/`。

## 3. バージョンの置き場所

| 場所 | 役割 |
|---|---|
| `VERSION` | 成果物の現在バージョン |
| `package.json` | npm package としてのバージョン |
| `src/appVersion.ts` | 画面やコードから参照するバージョン |
| `docs/artifact-version-ledger.md` | 変更内容、検証、残リスクの台帳 |
| `harness_runs/*/summary.md` | 品質チェック結果の要約 |

## 4. 更新ルール

| 変更 | 例 | 上げ方 |
|---|---|---|
| 小さい修正 | 文言、ドキュメント、軽いチェック追加 | patch |
| 機能追加 | 画面、API、品質チェックの追加 | minor |
| 大きな変更 | 保存方式、構成、互換性が変わる | major |

今回の初期版:

```text
0.1.0
```

## 5. 更新時チェック

- [ ] `VERSION` を更新する。
- [ ] `package.json` の `version` を更新する。
- [ ] `src/appVersion.ts` の `APP_VERSION` を更新する。
- [ ] `docs/artifact-version-ledger.md` に変更内容を書く。
- [ ] `npm run check` を実行する。
- [ ] 最新の `harness_runs/*/summary.md` を確認する。

補足:
- `summary.md` は証跡として残す。
- 各コマンドの詳細ログはローカル確認用なので Git には入れない。

## 6. 自動確認

`npm run check` の中で `npm run check:artifact-version` を実行する。

確認すること:
- `VERSION` と `package.json` が一致する。
- `VERSION` と `src/appVersion.ts` が一致する。
- バージョン台帳に現在バージョンの記録がある。
