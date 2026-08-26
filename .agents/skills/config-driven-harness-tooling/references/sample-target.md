# Sample Target

このサンプルは、configから具体ルールを渡し、runner本体を使い回すための確認対象です。

runner本体は、対象ファイル名や個別ルールを知りません。

policy、scenario、contract のような外部入力に具体的な中身を置くことで、別の対象にも同じrunnerを使えます。
