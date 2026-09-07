# UI品質ハーネス完成確認

確認日: 2026-09-07

## 結論

ローカル完成契約C-01〜C-22は完了。共有pre-push sampleを実行し、最終結果は`status: ok`だった。Ubuntu上のGitHub Actionsも[run 34070990440](https://github.com/schro-cat-dev/torisetsu/actions/runs/34070990440)で成功した。

| 集約対象 | 実結果 |
|---|---:|
| evidence source | 5 / 5 `ok` |
| rule | 13 / 13 `passed` |
| scenario | 2 / 2 `passed` |
| gate | 12 / 12 `passed` |
| issue | 0 |

自動生成された詳細結果は`.ui-quality-runs/latest/final-result.json`にある。このdirectoryはgit対象外で、同じcommandから再生成する。

## 実行証跡

| 確認 | command | 期待結果 | 実結果 |
|---|---|---|---|
| 共有pre-push全体 | `sh internal_refs/harness_arch/ui_quality_harness/runbooks/pre-push-hook.sample.sh` | exit 0 | exit 0 |
| 型 | `npm --prefix harness_lab/todo_frontend run typecheck` | error 0 | pass |
| 契約・反例 | `node --test internal_refs/harness_arch/ui_quality_harness/tools/tests/*.test.mjs` | 全pass | 14 / 14 pass |
| 汎用性 | `npm --prefix harness_lab/todo_frontend run check:harness-genericity` | 違反0 | pass |
| DOM抽出 | `npm --prefix harness_lab/todo_frontend run check:dom-snapshot` | 全pass | 2 / 2 pass |
| 操作・状態・回復 | `npm --prefix harness_lab/todo_frontend run check:browser-e2e` | 全pass | 4 / 4 pass |
| a11y | `npm --prefix harness_lab/todo_frontend run check:browser-a11y` | 除外ruleなしで全pass | 5 / 5 pass |
| layout | `npm --prefix harness_lab/todo_frontend run check:browser-layout` | 全pass | 2 / 2 pass |
| visual | `npm --prefix harness_lab/todo_frontend run check:browser-visual` | baseline更新なしで全pass | 22 / 22 pass |
| Ubuntu CI | GitHub Actions run `34070990440` | 全step成功 | success |
| 生成物分離 | 最終実行前後の`git status --porcelain=v1 --untracked-files=all`比較 | 追加差分0 | 追加0、消失0 |
| hook一致 | `cmp -s .git/hooks/pre-push internal_refs/harness_arch/ui_quality_harness/runbooks/pre-push-hook.sample.sh` | exit 0 | exit 0 |

## 完成項目の採点

採点は`0=未達、1=一部、2=完了`。

| 対象 | 対応する完成条件 | 点数 | 根拠 |
|---|---|---:|---|
| 契約と反例 | C-01〜C-04 | 2 | Schema、params、ID差し替え、missing/skip/0件の反例testがpass |
| 正規化と集約 | C-05〜C-08 | 2 | canonical result、最終集約、blocking、command outcomeを確認 |
| UI評価内容 | C-09〜C-14 | 2 | 12観点、情報量境界、DOM metric、状態、操作、a11yを確認 |
| visual | C-15〜C-18 | 2 | 全route・主要stateをmobile/desktop 22 caseで確認 |
| 運用と汎用性 | C-19〜C-22 | 2 | 生成物差分0、path/restore反例、汎用性scan、入口一致を確認 |

## 未確認範囲

- branch protectionのrequired check設定。
- Safari、Firefox、mobile実機。
- screen readerによる手動確認。
- 外部AI APIの自動呼び出し。

これらはローカル完成契約の対象外で、確認済みとは扱わない。
