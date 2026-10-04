iPhoneで使う手順
1. ZIPを展開
2. GitHub PagesなどHTTPSで公開
3. iPhoneのSafariで公開URLを1回開く
4. 共有 → ホーム画面に追加
5. 以後はホーム画面から起動。初回読み込み後はオフライン利用可能

※ChatGPT内プレビューや file:// 直開きではPWAとして動きません。
※現在は動作確認用9体データです。

【追加機能】
モンスター名をタップするとGoogle画像検索で「DQM3 モンスター名」を検索します。
※画像検索時だけインターネット接続が必要です。


【v3 自動更新対応】
GitHub Pages上のHTML/JS/CSS/data.jsonはネット接続中は最新版を優先します。
更新後に古い画面が残りにくいよう、Service Workerをnetwork-first方式に変更しました。
オフライン時のみ保存済みキャッシュへフォールバックします。
