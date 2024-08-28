import * as THREE from 'https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/loaders/GLTFLoader.js';

// 画面サイズの取得
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

// レンダラーの作成
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(windowWidth, windowHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// シーンの作成
const scene = new THREE.Scene();

// 背景に画像を設定
const loader = new THREE.TextureLoader();
loader.load('back.jpg', function (texture) {
    scene.background = texture;
});

// カメラの作成
const camera = new THREE.PerspectiveCamera(30, windowWidth / windowHeight, 0.1, 1000);
camera.position.set(0, 4.0, 10);
camera.lookAt(new THREE.Vector3(0, 1.6, 0));

// ライトの作成
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 3, 100);
pointLight.position.set(15, 30, 20);
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(10, 20, 15).normalize();
scene.add(directionalLight);

// マウス制御
const controls = new OrbitControls(camera, renderer.domElement);
controls.zoomSpeed = 1.2;

// アニメーションミキサーの設定
const mixers = [];
let currentAction1 = null; // [保留アクション].001
let currentAction2 = null; // [保留アクション]

// GLTFLoader のインスタンス化
const gltfLoader = new GLTFLoader();
gltfLoader.load('nice.glb', function (gltf) {
    const model = gltf.scene;

    // モデルのバウンディングボックスと中心点の計算
    const boundingBox = new THREE.Box3().setFromObject(model);
    const modelCenter = boundingBox.getCenter(new THREE.Vector3());

    // カメラの位置を調整
    const distance = boundingBox.getSize(new THREE.Vector3()).length() * 1.2;
    camera.position.set(modelCenter.x, modelCenter.y + 1.5, modelCenter.z + distance * 0.8);
    camera.lookAt(modelCenter);

    scene.add(model);

gltf.animations.forEach(function (clip) {
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(clip);
    mixers.push(mixer);

    if (clip.name === '[保留アクション].001') {
        currentAction1 = action;
        action.loop = THREE.LoopOnce;
        action.clampWhenFinished = true;
    } else if (clip.name === '[保留アクション]') {
        currentAction2 = action;
        action.loop = THREE.LoopRepeat; // 常に再生
        action.play();
    } else if (clip.name === 'see2') { // 'see2'に変更
        action.loop = THREE.LoopRepeat; // 常に再生
        action.timeScale = 0.3; // 速度を0.3倍に設定
        action.play();
    }
});
}, undefined, function (error) {
    console.error('An error happened:', error);
});

// 音声認識の設定
if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    alert('このブラウザは音声認識をサポートしていません。Google Chrome を使用してください。');
    throw new Error('SpeechRecognition is not supported in this browser.');
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ja-JP';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let isRecognizing = false;

recognition.onstart = () => {
    console.log('音声認識が開始されました。');
    isRecognizing = true;
};

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log(`音声認識の結果: ${transcript}`);

    // 音声認識でのアニメーションのトリガーは不要なので削除
};

recognition.onerror = (event) => {
    console.error(`Error: ${event.error}`);
};

recognition.onend = () => {
    console.log('音声認識が終了しました。');
    isRecognizing = false;
};

// ボタン操作での音声認識の開始と停止
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

startButton.addEventListener('click', () => {
    if (!isRecognizing) {
        recognition.start();
        startButton.disabled = true;
        stopButton.disabled = false;
        console.log('音声認識を開始します...');
    }
});

stopButton.addEventListener('click', () => {
    if (isRecognizing) {
        recognition.stop();
        startButton.disabled = false;
        stopButton.disabled = true;
        console.log('音声認識を停止しました。');

        // アニメーションのトリガー
        triggerNodAnimation();
    }
});

// アニメーションのトリガー関数
function triggerNodAnimation() {
    if (currentAction1) {
        currentAction1.reset();
        currentAction1.timeScale = 5;
        currentAction1.play();
        console.log('アニメーションがトリガーされました');
    }
}

// アニメーション
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    mixers.forEach(function (mixer) {
        mixer.update(0.01);
    });
}

animate();
