# UI品質ハーネス利用ガイド

## 対象

この文書は、初めてUI品質ハーネスを使う開発者向けです。初回準備、通常実行、結果確認、失敗対応、visual baseline更新、別projectへの導入を順番に説明します。

現在接続している対象は、`harness_lab/todo_frontend`のローカル実験用TODOアプリです。

## 初回準備

前提はNode.js 22とnpmです。リポジトリrootから次を実行します。

```bash
cd harness_lab/todo_frontend
npm ci
npx playwright install chromium
cd ../..
```

LinuxでChromiumのOS依存packageも必要な場合は、`npx playwright install --with-deps chromium`を使います。CIではこの方法を使っています。

## 通常の実行

リポジトリrootから次の2つを実行します。

```bash
npm --prefix harness_lab/todo_frontend run typecheck
npm --prefix harness_lab/todo_frontend run check:ui-quality
```

2つ目のcommandが、契約test、汎用性scan、DOM抽出、主要操作、状態と回復、アクセシビリティ、layout、visual比較、判断レビュー、最終集約を順に実行します。必要なローカルAPIとWEBサーバーは実行中だけ起動し、終了時に閉じます。

## 成功結果の見方

成功時は最後に次の形が表示され、commandがexit 0で終了します。

```json
{
  "status": "ok",
  "resultPath": "<repo>/.ui-quality-runs/latest/final-result.json"
}
```

詳細結果は`.ui-quality-runs/latest/final-result.json`で確認できます。`jq`が入っていれば、次のcommandで要点だけを表示できます。`jq`がなければJSONファイルを直接開けば確認できます。

```bash
jq '{status, evidenceSources, rules, scenarios, gates, issues}' \
  .ui-quality-runs/latest/final-result.json
```

| status | 意味 | 対応 |
|---|---|---|
| `ok` | 必須証跡がそろい、全gateが通った | push可能 |
| `warning` | 非blocking項目に判断が必要 | `rules`と`issues`を確認して判断する |
| `failed` | 必須証跡の欠落、test失敗、blocking違反がある | 修正して再実行する |

自動生成resultとlogは`.ui-quality-runs/`に保存され、gitへ追加されません。CIでは同じdirectoryをartifactとして保存します。

## 失敗したときの確認順

1. terminalで最初に失敗したcheck名とmessageを見る。
2. `.ui-quality-runs/latest/final-result.json`があれば、`issues`と`failed`になった`rules`、`scenarios`、`gates`を見る。
3. `evidenceSources[].resultPath`から、失敗したadapterの結果を確認する。
4. 同じ実行directoryにある`*.log`で、外部toolの標準出力と標準errorを確認する。
5. visualだけ失敗した場合は、Playwrightが出したactual、expected、diff画像を比較する。

最終集約前に止まった場合は`final-result.json`が更新されないことがあります。その場合はterminalに出た最初のSchema違反、参照切れ、command失敗を直します。

## visual baselineを更新する条件

baselineは、期待する見た目を表す基準画像です。macOSとLinuxの描画差を誤検出しないように、`darwin/`と`linux/`へOS別に保存します。意図したUI変更を人またはAIが画面で確認した場合だけ更新します。原因不明の差分を通す目的では更新しません。

```bash
npm --prefix harness_lab/todo_frontend run update:browser-visual-baseline
npm --prefix harness_lab/todo_frontend run check:ui-quality
```

更新後は、変更されたPNGを確認し、22 caseがbaseline更新なしで通ることを確認します。

## 別projectへ導入する

共通engineは変更せず、対象projectの設定と証跡だけを追加します。

1. `project_profiles/<project-id>/`を作る。
2. profileへ対象、gate、rule、scenario、evidence sourceを書く。
3. adapter configへ実行command、対象path、timeout、結果との対応を書く。
4. 必要に応じてDOM capture config、layout policy、visual manifest、threshold policy、判断レビューを追加する。
5. visual対象がある場合は、manifestに列挙した全caseのbaselineを作る。
6. 共通engineを対象profileで実行し、`status: ok`と汎用性scanを確認する。

実行例:

```bash
node internal_refs/harness_arch/ui_quality_harness/tools/run-ui-quality-harness.mjs \
  --root . \
  --profile internal_refs/harness_arch/ui_quality_harness/project_profiles/<project-id>/<profile>.json \
  --out .ui-quality-runs/<project-id>/final-result.json
```

対象固有の画面名、URL、path、文言、しきい値、test fileは、共通engineではなくproject側のprofile、policy、scenario、adapter configへ置きます。新しい対象の追加で共通engineの変更が必要になった場合は、まず既存の入力契約で表現できない理由を確認します。

## pushとCI

- `.git/hooks/pre-push`は、typecheck後に同じ`check:ui-quality`を実行します。
- 共有用hookは`runbooks/pre-push-hook.sample.sh`です。
- GitHub Actionsは`.github/workflows/ui-quality-harness.yml`です。
- GitHub上で必須checkにするには、push後にworkflow実runを確認し、branch protectionを設定します。

## 自動確認しない範囲

- GitHub Actionsの実runとrequired check設定。
- Safari、Firefox、mobile実機。
- screen readerによる手動確認。
- 外部AI APIの自動呼び出し。

これらは未確認を`ok`として扱わず、必要になった時点で別gateまたは運用確認として追加します。
