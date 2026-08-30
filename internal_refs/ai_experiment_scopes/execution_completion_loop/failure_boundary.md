# 失敗許容範囲とバックアップ境界

作成日: 2026-08-31

## 結論

失敗して良い範囲は、git差分で戻せて、外部に被害がなく、検証で原因を見られる作業。

普段はバックアップブランチを作らず、`git diff`、検証結果、会話ログで管理する。広範囲変更や戻しにくい変更だけ、開始前にバックアップブランチまたは退避方針を確認する。

## 止まらず実行する範囲

| 作業 | 例 | 失敗時の動き |
|---|---|---|
| docs修正 | `README.md`、`internal_refs/**/*.md` | diffを見て直す |
| fixture作成 | `fixtures/*.json` | schema errorを見て直す |
| schema draft | `*_schema.md`、contract案 | checkerで落ちた項目を埋める |
| local runner | `tools/*.mjs` | stderrを見て修正し再実行 |
| 構文チェック | `node --check` | 該当行を直して再実行 |
| 単体テスト | fixture test、validator | fail理由を分類し、期待値か実装を直す |
| 生成結果の再作成 | local result JSON | 古い生成物を消すか上書きして再実行 |

## 事前確認する範囲

| 作業 | 理由 | 次の動き |
|---|---|---|
| `rm -rf`、大量削除 | 戻せない可能性がある | 対象と理由を出して確認 |
| `git reset --hard`、強制checkout | ユーザー変更を消す可能性がある | 原則実行しない |
| `git push`、deploy | 外部へ影響する | 明示許可を取る |
| API大量実行 | 課金やrate limitがある | 件数と費用目安を出す |
| DB migration、本番データ更新 | 実害が出る | backup/rollbackを確認 |
| secretやcredential操作 | 漏洩・破壊リスクがある | 保存先と権限を確認 |
| 広範囲リファクタ | 戻しにくい | backup branchまたは小分け方針を確認 |

## バックアップブランチを考える条件

| 条件 | backup branch |
|---|---|
| docs数ファイル、fixture、schema draft | 原則不要 |
| local runner追加、影響範囲が限定的 | 原則不要 |
| 10ファイル以上の変更 | 作成候補 |
| 自動生成で多数ファイル上書き | 作成候補 |
| migration、構造変更、依存更新 | 作成候補 |
| ユーザー変更と同じファイルを大きく触る | 作成候補 |

## AIの動き

1. 変更前に `git status --short` で未管理の変更を把握する。
2. 止まらず実行できる範囲なら、マイルストーンとチェックリストを消化する。
3. 失敗したら、原因分類、修正、再実行、証跡記録まで行う。
4. 事前確認範囲に入ったら、対象、理由、推奨手順を出して止まる。
5. バックアップブランチが必要そうなら、作成理由と名前案を出して確認する。

## バックアップブランチ名の例

```text
backup/<task-name>-YYYYMMDD-HHMM
```

例:

```text
backup/model-drift-watch-v1-20260831-0730
```
