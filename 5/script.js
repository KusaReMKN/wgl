const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');

window.addEventListener('load', () => {
	document.body.appendChild(canvas);

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
		0.0, -1.0, 0.0,
	];

	// 色データ
	let vertexColor = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
	];

	// 頂点のインデクス
	let index = [
		0, 1, 2,
		1, 2, 3,
	];

	// VBO の作成
	let positionVBO = CreateVBO(vertexPosition);
	let colorVBO = CreateVBO(vertexColor);

	// VBO をバインド、登録する
	SetAttribute([positionVBO, colorVBO], attrLocation, attrStride);

	// IBO のバインド
	let ibo = CreateIBO(index);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

	let uniLocation = gl.getUniformLocation(prg, 'mvpMatrix');	// uniformLocation の取得

	let m = new matIV();

	let mMatrix = m.identity(m.create());
	let vMatrix = m.identity(m.create());
	let pMatrix = m.identity(m.create());
	let tmpMatrix = m.identity(m.create());
	let mvpMatrix = m.identity(m.create());

	m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);	// ビュー座標変換行列
	m.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix);	// プロジェクション座標変換行列
	m.multiply(pMatrix, vMatrix, tmpMatrix);	// 行列の掛け合わせ

	(function (now) {
		// canvas の初期化
		gl.clearColor(.0, .0, .0, 1.);
		gl.clearDepth(1.);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		let rad = now * (Math.PI / 2) / 1000;

		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [2, 3, 1], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation, false, mvpMatrix);

		// インデックスを利用して描画
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		gl.flush();

		window.requestAnimationFrame(arguments.callee);
	})();


	m.translate(mMatrix, [1.5, 0.0, 0.0], mMatrix);	// 一つ目
	m.multiply(tmpMatrix, mMatrix, mvpMatrix);

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

// VBO バインド、登録
function SetAttribute(vbo, attrL, attrS) {
	for (let i in vbo) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);	// バッファをバインド
		gl.enableVertexAttribArray(attrL[i]);	// attributeLocation を有効化
		gl.vertexAttribPointer(attrL[i], attrS[i], gl.FLOAT, false, 0, 0);	// attributeLocation 通知、登録
	}
}

// IBO の生成
function CreateIBO(data) {
	let ibo = gl.createBuffer();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);	// バッファをバインド
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);	// バッファにデータをセット
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);	// バッファのバインドを無効化
	return ibo;
}