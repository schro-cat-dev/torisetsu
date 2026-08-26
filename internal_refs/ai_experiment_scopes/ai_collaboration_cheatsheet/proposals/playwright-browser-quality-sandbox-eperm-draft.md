# Playwright browser-quality sandbox EPERM 対応ドラフト

## 1. 結論

`npm run check:browser-quality` が sandbox 内で `listen EPERM` になった場合、TODOアプリやPlaywrightの仕様ミスと決めつけない。

まず、sandbox が `127.0.0.1:<port>` の listen を止めた可能性を見る。

ただし、URLを提示するだけなら `npm run check:browser-quality` は不要。

URL提示では、runtime start/status と curl の確認までで足りる。

`npm run check:browser-quality` は、チェックリストと実装の擦り合わせで、実ブラウザの操作やa11yを証跡として確認したい時に使う。

今回うまくいった方法:

```bash
npm run check:browser-quality
```

を、通常のsandbox内ではなく、権限付きで再実行した。

結果:

```text
browser-e2e: OK
browser-a11y: OK
```

## 2. 起きたこと

対象:

- app: `harness_lab/todo_frontend`
- command: `npm run check:browser-quality`
- 中身:
  - Playwright E2E
  - Playwright + axe a11y
  - Playwright config の `webServer` が API と Web を確認する

失敗ログ:

```text
Error: listen EPERM: operation not permitted 127.0.0.1:4174
```

意味:

- `127.0.0.1:4174` でAPIサーバーを listen しようとした。
- sandbox がその操作を許可しなかった。
- そのため Playwright の `webServer` 起動確認が失敗した。

## 3. 原因の見分け方

| ログ | 見方 | 対応 |
|---|---|---|
| `listen EPERM` | 権限やsandboxで listen が止まった可能性が高い | 権限付きで同じコマンドを再実行する |
| `EADDRINUSE` | port が既に使われている | `status` を見て、管理対象なら `stop` する |
| `health=false` | サーバーが応答していない | API/Webログを見る |
| Playwright test失敗 | アプリ挙動の失敗 | trace、スクショ、対象testを見る |

今回の判断:

- 失敗は `listen EPERM`。
- その後、権限付きで同じ `npm run check:browser-quality` を実行したら成功。
- よって、今回の主因はアプリ機能ではなく sandbox の実行権限。

## 4. 最初から動かす手順

### 4.1 URL提示だけの場合

目的:

- ユーザーにブラウザで開けるURLを渡す。
- アプリが最低限応答していることだけ確認する。

この場合、`npm run check:browser-quality` は実行しない。

リポジトリルートから:

```bash
node runtime_scripts/todo_frontend_runtime.mjs status
node runtime_scripts/todo_frontend_runtime.mjs start
```

URL確認:

```bash
curl -sS -o /tmp/todo-web-check.html -w "%{http_code} %{url_effective}\n" http://127.0.0.1:5173/todos
curl -sS http://127.0.0.1:4174/api/health
```

期待:

```text
200 http://127.0.0.1:5173/todos
{"ok":true}
```

ユーザーへ出すURL:

```text
http://127.0.0.1:5173/todos
```

### 4.2 チェックリストと実装を擦り合わせる場合

目的:

- 実装がチェックリストの主要操作を満たすか見る。
- 実ブラウザ操作とa11yを証跡として確認する。

この場合は、`npm run check:browser-quality` を使う。

### 4.3 まず状態確認

リポジトリルートから:

```bash
node runtime_scripts/todo_frontend_runtime.mjs status
```

期待:

```text
api managed=true health=true
web managed=true health=true
```

未起動なら:

```bash
node runtime_scripts/todo_frontend_runtime.mjs start
```

ただし、sandbox 内で `listen EPERM` が出たら、同じコマンドを権限付きで再実行する。

### 4.4 URL確認

```bash
curl -sS -o /tmp/todo-web-check.html -w "%{http_code} %{url_effective}\n" http://127.0.0.1:5173/todos
curl -sS http://127.0.0.1:4174/api/health
```

期待:

```text
200 http://127.0.0.1:5173/todos
{"ok":true}
```

### 4.5 実ブラウザ確認

アプリディレクトリから:

```bash
cd harness_lab/todo_frontend
npm run check:browser-quality
```

sandbox 内で `listen EPERM` が出た場合:

- アプリの失敗として扱わない。
- 権限付きで同じコマンドを再実行する。
- 成功したら、失敗原因は sandbox 側の権限差分として記録する。

## 5. うまくいった実例

失敗:

```text
npm run check:browser-quality
Error: listen EPERM: operation not permitted 127.0.0.1:4174
```

再実行:

```text
npm run check:browser-quality
```

権限付きで実行。

結果:

```text
browser-e2e: OK
browser-a11y: OK
```

## 6. 次回のAIの動き

同じ状況では、次の順番で動く。

```text
1. 依頼がURL提示だけか、品質確認まで含むかを分ける
2. URL提示だけなら runtime start/status と curl までにする
3. チェックリスト擦り合わせなら browser-quality を実行する
4. listen EPERM なら sandbox 権限問題として切り分ける
5. 権限付きで同じコマンドを再実行する
6. 成功したら、アプリ不具合ではなく実行環境差分として報告する
7. 失敗が続く場合だけ、Playwright test、APIログ、Webログを見る
```

## 7. 注意

- `listen EPERM` と `EADDRINUSE` を混ぜない。
- URL提示だけなら `browser-quality` は不要。
- `browser-quality` が一度sandboxで失敗しても、アプリが壊れているとは限らない。
- 権限付きで成功した場合は、原因を `実行環境差分` として扱う。
- 権限付きでも失敗する場合は、アプリ、Playwright config、既存プロセス、port、ログを順番に見る。
- この文書は skill 化前のドラフト。まだ active skill ではない。
