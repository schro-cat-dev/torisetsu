# Secure by Design と UX 設計の見直しメモ

このファイルは、TODO アプリ詳細設計チェックリスト v1 の `保存と同期` と `UXチェック` を見直すための隔離メモです。

## 結論

- `localStorage` を通常の保存候補として並べるのは弱い。
- secure by design 前提なら、保存方式は最初の設計で決める。
- UX は `保存中はボタンを押せない` 程度では足りない。
- SmartHR のアクセシビリティページは平易だが、価値は「全員が同じ最低ラインで実践できること」にある。

## 1. localStorage について

secure by design 前提なら、まず用途別に分ける。

| 用途 | 推奨 |
|---|---|
| 認証情報、token、session ID | localStorage 不可 |
| 個人情報、業務データ、機密情報 | 原則クライアント保存しない |
| TODO 本文などユーザー生成データ | 基本はサーバー DB |
| オフライン下書き | 必要なら IndexedDB + 同期設計 |
| UI 設定、テーマ、並び順 | localStorage でも可 |

根拠:
- OWASP は、localStorage に機密情報や session ID を保存しない方針を示している。
- localStorage は JavaScript から読めるため、XSS があると中身を取られる。
- IndexedDB も完全に安全な保存場所ではない。中身は信用せず、読み出し時に検証する。

参考:
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html

## 2. 修正版: 保存と同期の設計

secure by design の立ち位置:
- 安全性は後付けではなく、開発前の設計に入れる。
- 利用者側の設定や注意に頼りすぎない。
- 保存方式、認証方式、権限、ログ、同期方式を早い段階で決める。

データ分類:
- 公開情報。
- 個人情報。
- 業務データ。
- 認証情報。
- 一時的な UI 状態。

保存先:
- サーバー DB: TODO 本体の正本。
- HTTP-only Cookie: session 管理。
- IndexedDB: オフライン下書き、同期待ちキュー。
- localStorage: 非機密の UI 設定だけ。

保存タイミング:
- 作成成功後。
- 更新成功後。
- 削除成功後。
- オフライン時は `pendingChanges` に保存。
- 再接続時に `syncTodos()`。

しないこと:
- token を localStorage に置かない。
- 個人情報を localStorage に置かない。
- クライアント保存データを信用しない。

## 3. UX チェックについて

前回の UX 項目は薄い。実装前の品質チェックとしては、最低でも以下まで分ける。

一覧:
- 初期表示。
- 読み込み中。
- 0 件。
- 検索結果 0 件。
- API 失敗。
- ページング。
- 並び替え。
- 行ごとの操作。
- 一括操作。
- モバイル表示。

フォーム:
- 必須 / 任意。
- 入力例。
- 補足説明。
- 入力中エラー。
- 送信後エラー。
- 保存中。
- 保存成功。
- 保存失敗。
- キャンセル。
- 未保存変更の扱い。

操作:
- 作成。
- 編集。
- 削除。
- 完了切替。
- 一括操作。
- 取り消し。
- 再試行。
- 多重送信防止。

アクセシビリティ:
- ラベルがある。
- キーボードで操作できる。
- 操作順が見た目と合っている。
- エラー内容が分かる。
- 色だけで状態を伝えない。
- 200% 拡大でも読める。
- コントラストを満たす。
- スマホで押しやすい。

文言:
- ボタン名が行動を表す。
- エラー文が具体的。
- 次に何をすればよいか分かる。
- 同じ操作には同じ言葉を使う。

## 4. SmartHR から見るポイント

SmartHR の `よくあるテーブル` は、一覧 UI を次の単位に分けている。

- テーブル。
- 見出し。
- テーブル操作エリア。
- 一時操作エリア。
- 初期表示。
- 検索結果なし。
- モバイル。

SmartHR の `フィードバック` は、操作結果の伝え方を次の単位に分けている。

- フォームを入力・送信するとき。
- 同期的な処理を開始したとき。
- 同期的な処理が完了したとき。
- ページ・要素の読み込みを開始したとき。
- ページ・要素の読み込みが完了したとき。

SmartHR のアクセシビリティページは、内容としては平易に見える。
ただし、これは弱いというより、チーム全員が同じ基準で実践できるようにするための入口として見るのが近い。

参考:
- https://www.cisa.gov/securebydesign
- https://www.cyber.gov.au/business-government/secure-design/secure-by-design/shifting-the-balance-of-cybersecurity-risk
- https://smarthr.design/products/design-patterns/smarthr-table/
- https://smarthr.design/products/design-patterns/feedback/
- https://smarthr.design/accessibility/

## 5. 次に深掘りするなら

優先度とおすすめ度は 5 が高い。

| 項目 | 種別 | 優先度 | おすすめ度 | 根拠 |
|---|---|---:|---:|---|
| secure by design を設計の前半へ移す | 必須 | 5 | 5 | 保存方式は後から直すと影響が大きい |
| UX チェックを画面状態ごとに分ける | 必須 | 5 | 5 | 状態漏れがあると実装後に使いにくくなる |
| SmartHR 以外の設計資料も見る | おすすめ | 3 | 4 | SmartHR だけだと業務 UI の一例に偏る |
| アクセシビリティをテスト項目へ落とす | 必須 | 5 | 5 | 実装後に確認できる形にしないと守れない |
