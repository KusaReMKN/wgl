const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');

window.addEventListener('load', () => {
	document.body.appendChild(canvas);

	gl.clearColor(.0, .0, .0, 1.);	// 初期化の色
	gl.clearDepth(1.);	// 初期化するときの深さ
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);	// 初期化

	let vShader = CreateShader('vs');	// 頂点シェーダ
	let fShader = CreateShader('fs');	// フラグメントシェーダ

	let prg = CreateProgram(vShader, fShader);	// プログラムの生成とリンク

	// attributeLocation を配列に取得
	let attrLocation = new Array(2);
	attrLocation[0] = gl.getAttribLocation(prg, 'position');
	attrLocation[1] = gl.getAttribLocation(prg, 'color');

	// attribute 乃要素数を配列に格納
	let attrStride = new Array(2);
	attrStride[0] = 3;
	attrStride[1] = 4;

	// 頂点データ
	let vertexPosition = [
		0.0, 1.0, 0.0,
		1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
	];

	// 色データ
	let vertexColor = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
	];

	// VBO の作成
	let positionVBO = CreateVBO(vertexPosition);
	let colorVBO = CreateVBO(vertexColor);

	// VBO をバインド、登録する
	gl.bindBuffer(gl.ARRAY_BUFFER, positionVBO);
	gl.enableVertexAttribArray(attrLocation[0]);
	gl.vertexAttribPointer(attrLocation[0], attrStride[0], gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, colorVBO);
	gl.enableVertexAttribArray(attrLocation[1]);
	gl.vertexAttribPointer(attrLocation[1], attrStride[1], gl.FLOAT, false, 0, 0);

	let m = new matIV();

	let mMatrix = m.identity(m.create());
	let vMatrix = m.identity(m.create());
	let pMatrix = m.identity(m.create());
	let tmpMatrix = m.identity(m.create());
	let mvpMatrix = m.identity(m.create());

	m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);	// ビュー座標変換行列
	m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix);	// プロジェクション座標変換行列

	// 行列の掛け合わせ
	m.multiply(pMatrix, vMatrix, tmpMatrix);

	m.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);	// 一つ目
	m.multiply(tmpMatrix, mMatrix, mvpMatrix);

	let uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');	// uniformLocation の取得

	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);	// uniformLocation へ座標変換行列を登録
	gl.drawArrays(gl.TRIANGLES, 0, 3);	// モデルの描画

	m.identity(mMatrix);
	m.translate(mMatrix, [-1.5, 0.0, 0.0], mMatrix);	// 二つ目
	m.multiply(tmpMatrix, mMatrix, mvpMatrix);

	gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);	// uniformLocation へ座標変換行列を登録
	gl.drawArrays(gl.TRIANGLES, 0, 3);	// モデルの描画

	gl.flush();	// コンテキストの再描画
});

// シェーダ生成
function CreateShader(id) {
	let shader;
	let scriptElement = document.getElementById(id);
	if (!scriptElement) { return; }

	switch (scriptElement.type) {
		case 'x-shader/x-vertex':	// 頂点シェーダ
			shader = gl.createShader(gl.VERTEX_SHADER);
			break;
		case 'x-shader/x-fragment':	// フラグメントシェーダ
			shader = gl.createShader(gl.FRAGMENT_SHADER);
			break;
		default:
			return;
	}

	gl.shaderSource(shader, scriptElement.text);	// シェーダにソースの割り当て
	gl.compileShader(shader);	// シェーダをコンパイル
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		return shader;	// シェーダのコンパイル成功
	}
	window.alert(gl.getShaderInfoLog(shader));	// 失敗
}

// プログラム生成、シェーダリンク
function CreateProgram(vs, fs) {
	let program = gl.createProgram();

	// プログラムにシェーダを割り当てる
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);

	gl.linkProgram(program);	// シェーダをリンク
	if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.useProgram(program);	// プログラムオブジェクトを有効化
		return program;
	}
	window.alert(gl.getProgramInfoLog(program));	// 失敗
}

// VBO 生成
function CreateVBO(data) {
	let vbo = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);	// バッファのバインド
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);	// バッファにデータをセット
	gl.bindBuffer(gl.ARRAY_BUFFER, null);	// バッファのバインドを無効化
	return vbo;
}
