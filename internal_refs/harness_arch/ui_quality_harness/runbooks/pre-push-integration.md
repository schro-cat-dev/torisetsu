# UI品質ハーネス pre-push / CI 連携

## 目的

push前またはCIで、UI品質ハーネスの契約違反、参照切れ、基本UI事故を検出する。

## 共通の最終入口

```bash
npm --prefix harness_lab/todo_frontend run check:ui-quality
```

このcommandが契約test、汎用性scan、DOM、browser flow、axe、layout、visual、judgment、最終集約を順番に実行する。PlaywrightがローカルAPI/WEBサーバーを実行中だけ起動し、終了時に閉じる。

## 推奨blocking

| チェック | pre-push | CI |
|---|---|---|
| profile整合性 | blocking | blocking |
| DOM snapshot一次検査 | blocking | blocking |
| judgment review validator | blocking | blocking |
| browser e2e | blocking | blocking |
| browser a11y | blocking | blocking |
| browser layout / visual | blocking | blocking |

## 任意: Go command runnerでまとめて実行する場合

```bash
cd tooling/go-test-harness
go run ./cmd/test-harness run \
  --root ../.. \
  --spec internal_refs/harness_arch/ui_quality_harness/runbooks/ci-browser.command-plan.json
```

`tooling/go-test-harness/` は現在 `.gitignore` 対象のため、共有CIや共有hookの必須経路にはしない。

## hook反映状況

- `.git/hooks/pre-push` は`typecheck`後に共通の最終入口を呼ぶ。
- 実hookと共有sampleは同じ内容にする。
- 自動生成resultとlogは`.ui-quality-runs/`へ置き、git対象外にする。

## hook sample

実hookを作り直す場合は、`pre-push-hook.sample.sh` の内容を `.git/hooks/pre-push` へ反映する。

この作業はローカルgit hookを書き換えるため、実施前に対象repoと既存hookの有無を確認する。

## CI反映状況

- `.github/workflows/ui-quality-harness.yml` を追加済み。
- CIでも同じ`npm run check:ui-quality`を実行する。
- 証跡は`.ui-quality-runs/`をartifact uploadする。
- workflow実runとrequired check設定はGitHub上で別途確認する。
