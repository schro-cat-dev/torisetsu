# IB-013 Private Field Lineage Harness Workspace

作成日: 2026-09-07

## 目的

`ideas/field-lineage-harness/` を、非公開開発物として扱いやすい場所へ切り分ける。

ドキュメント、tooling、schema、fixture、test、検証記録を同じ単位で管理し、後でprivate GitHub repositoryへ移せる形にする。

## 背景

現在の `ideas/field-lineage-harness/` は `.gitignore` によりcommit外で管理されている。

ただし `ideas/` は草案置き場の名前であり、今後toolやtestを増やす開発場所としては意味が弱い。

## 対象

- `ideas/field-lineage-harness/`
- 将来の移設先候補: `private_dev/field-lineage-harness/`
- 将来のprivate repository root候補: `field-lineage-harness/`

## 変更方針

`ideas/field-lineage-harness/` を、次の構成へ移す。

```text
private_dev/field-lineage-harness/
  README.md
  AGENTS.md
  docs/
  packages/field-lineage/
  tooling/
  reports/
  local/
```

## ディレクトリ責務

| path | 置くもの | 置かないもの |
|---|---|---|
| `docs/` | 設計、判断、未確定事項、検証記録 | 実行用コード |
| `packages/field-lineage/` | package本体、CLI、schema、test、fixture | 作業ログ、secret |
| `tooling/` | 開発補助script、品質チェック | 対象repo固有の秘密情報 |
| `reports/` | 実行結果、検証ログ、失敗記録 | token、API key |
| `local/` | ローカルだけの設定やメモ | commitする成果物 |

## やること

- [ ] `private_dev/` を `.gitignore` 対象にする。
- [ ] `ideas/field-lineage-harness/` を `private_dev/field-lineage-harness/` へ移す。
- [ ] 入口を `private_dev/field-lineage-harness/README.md` に固定する。
- [ ] 設計文書を `docs/` 配下へ整理する。
- [ ] schema、tooling、test、fixtureを `packages/field-lineage/` へ寄せる。
- [ ] 検証記録を `reports/` または `docs/verification/` に分ける。
- [ ] `git check-ignore -v private_dev/field-lineage-harness/README.md` でcommit外を確認する。
- [ ] 将来private GitHub repositoryへ移す時のroot構成と一致しているか確認する。

## やらないこと

- GitHubへpushしない。
- public repository向けに内容を削らない。
- `torisetsu` のtracked領域へ非公開ツール本体を入れない。
- secret、token、API keyを記録しない。
- `ideas/` 配下の既存内容を、移設前に大きく書き換えない。

## 完了条件

- [ ] `private_dev/field-lineage-harness/` だけ見れば、設計、実装、test、検証記録の入口が分かる。
- [ ] `ideas/field-lineage-harness/` に実体が残っていない。
- [ ] `private_dev/field-lineage-harness/` がgit管理外である。
- [ ] private GitHub repositoryのrootへそのまま移しても意味が崩れない。
- [ ] 公開してよいものと非公開のものが混ざっていない。

## 確認コマンド

```bash
find private_dev/field-lineage-harness -maxdepth 3 -type f | sort
git check-ignore -v private_dev/field-lineage-harness/README.md
git ls-files private_dev ideas/field-lineage-harness
```

## 残リスク

- 公開可能な部分の切り出し基準は未確定。
- private GitHub repository名は未確定。
- `packages/field-lineage/` のpackage名は未確定。
