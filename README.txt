ここコード PWA v2.53 qrcode-generator削除・ZXing3 QR生成移行テスト版

【v2.53 変更点】
- v2.52をベースに、QR生成ライブラリ qrcode-generator 1.4.4 を削除。
- ZXing-WASM 3.1.6 を reader 版から full 版へ変更し、writeBarcode() でQRを生成。
- 通常QR再生成、再構成QR、項目export QRをZXing 3 Writerへ移行。
- QR生成後のZXing 3自己検証は維持。
- JsBarcodeは未変更（次段階の検証対象）。
- カメラUI、QR読取、Symbol保存処理はv2.52から変更なし。
- 画面表示、Service Worker、manifestのバージョンをv2.53へ更新。
