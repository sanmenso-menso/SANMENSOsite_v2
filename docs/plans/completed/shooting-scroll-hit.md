# 射的のスクロール時命中判定とスマホ表示

- STANDARD: 景品の座標比較で画面外の照準にも対応する。
- スマホの得点表示はレーン左下、発射操作の上に配置する。
- 座標判定の回帰テストと既存checkで検証する。
- 射的中のREAD MOREで詳細を開き、移動・浮遊・発射を一時停止する。閉じると得点・景品状態を維持して再開する。
- 弾の飛翔中（650ms）はREAD MOREを無効にして、命中処理が完了してから詳細を開く。
- 落下済み景品のREAD MOREも無効にし、不可視の操作対象を残さない。
- doctor、doctor tests、project check、production/full auditを検証。ブラウザで詳細の開閉、pause/resume、score維持を確認。
