import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from './loadMixamoAnimation.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import {chatLogs, news} from './shared/chatLogs.js';
const availableAnimations = [
	"Idle",
	"Quick Formal Bow",
	"Standing Greeting",
	"Blow A Kiss",
	"Drunk",
	"Loser",
	"Standing 1",
	"Standing",
	"Crouch",
	"Dynamic",
	"Offensive",
	"Standing 2",
	"Throw",
	"Drop Kick",
	"Quick Formal Bow",
	"Standing Greeting",
	"Walking"
];

var saveBlob = {
	miladyId: undefined,
	lastChatId: undefined,
	unlockedAnimations: []
}

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;

document.body.appendChild( renderer.domElement );

// camera
const camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 30.0 );
camera.position.set( 0.0, 2.0, 6.0 );

// camera controls
const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = true;
controls.target.set( 0.0, 1.0, 0.0 );
controls.update();

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );
scene.fog = new THREE.Fog( 0xffffff, 10, 15 );

// light
const light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1.0, 1.0, 1.0 ).normalize();
light.castShadow = true;
light.radius = 10;
light.shadow.radius = 3;
scene.add( light );

const defaultModelUrl = './'+ window.pockitId +'.vrm';

// gltf and vrm
let currentVrm = undefined;
let currentAnimationUrl = undefined;
let currentMixer = undefined;
let group = new THREE.Group();

const helperRoot = new THREE.Group();
helperRoot.renderOrder = 10000;
scene.add( helperRoot );

function loadVRM( modelUrl ) {
	const loader = new GLTFLoader();
	loader.crossOrigin = 'anonymous';

	helperRoot.clear();
	console.log("loading model: " + modelUrl);
	loader.register( ( parser ) => {

		return new VRMLoaderPlugin( parser, {
			// helperRoot: helperRoot,
			autoUpdateHumanBones: true
		} );

	} );

	loader.load(modelUrl, ( gltf ) =>
	{
		console.log("Model loaded")
		const vrm = gltf.userData.vrm;
		console.log(gltf);
		if ( currentVrm ) {
			scene.remove( currentVrm.scene );
			VRMUtils.deepDispose( currentVrm.scene );
		}

		// put the model to the scene
		currentVrm = vrm;
		group.add(currentVrm.scene);
		scene.add(group);

		// Disable frustum culling
		vrm.scene.traverse( ( obj ) => {
			obj.frustumCulled = false;
			obj.castShadow = true;
		} );

		if ( currentAnimationUrl ) {
			loadFBX( currentAnimationUrl );
		}

		currentMixer = new THREE.AnimationMixer( currentVrm.scene );
		currentMixer.addEventListener( 'finished', function( e	) {
			console.log("Animation finished");
			playNextAnimation();
		} );
		playNextAnimation();

		// rotate if the VRM is VRM0.0
		VRMUtils.rotateVRM0( vrm );

		console.log( vrm );
	},

	// called while loading is progressing
	( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),

	// called when loading has errors
	( error ) => console.error( error ));
}

function loadStage()
{
	const loader = new GLTFLoader();

	loader.load("shared/map.glb",
	function (gltf) {
		var model = gltf.scene;
		gltf.scene.traverse( function ( object ) {

			if ( object.isMesh ) object.receiveShadow = true;

		} );
		scene.add(model);
	});
}

var currentAction = null;

function loadFBX(animationUrl) {
	currentAnimationUrl = animationUrl;

	loadMixamoAnimation(animationUrl, currentVrm).then((clip) => {
		const newAction = currentMixer.clipAction(clip);
		// newAction.setLoop(THREE.LoopOnce);
		newAction.timeScale = params.timeScale;
		if(newAction._clip.duration > 0.5)
			newAction.clampWhenFinished = true;

		if (currentAction) {
			currentAction.reset();
			currentAction.crossFadeTo(newAction, 0, false);
		}

		newAction.play();
		currentAction = newAction;
	});
}


// helpers
// const gridHelper = new THREE.GridHelper( 10, 10 );
// scene.add( gridHelper );

// const axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

// animate


const clock = new THREE.Clock();

function animate() {

	requestAnimationFrame( animate );

	const deltaTime = clock.getDelta();

	// if animation is loaded
	if ( currentMixer ) {

		// update the animation
		currentMixer.update( deltaTime );

	}

	if ( currentVrm ) {

		currentVrm.update( deltaTime );

		// tweak bones
		const s = 0.25 * Math.PI * Math.sin( Math.PI * clock.elapsedTime );
		// currentVrm.humanoid.getNormalizedBoneNode( 'neck' ).rotation.x = s;
		// currentVrm.humanoid.getNormalizedBoneNode( 'leftUpperArm' ).rotation.z = s;
		// currentVrm.humanoid.getNormalizedBoneNode( 'rightUpperArm' ).rotation.x = s;

		// tweak expressions
		const s2 = Math.sin( Math.PI * clock.elapsedTime );
		// currentVrm.expressionManager.setValue( 'aa', 0.5 + 0.5 * s );
		currentVrm.expressionManager.setValue( 'blink', 0.5 - 0.5 * s2 );

		// update vrm
		currentVrm.update( deltaTime );
		TWEEN.update();

	}

	renderer.render( scene, camera );

}

animate();

// gui
// const gui = new GUI();
const params = {
	timeScale: 1.0,
};

// gui.add( params, 'timeScale', 0.0, 2.0, 0.001 ).onChange( ( value ) => {
// 	currentMixer.timeScale = value;
// } );

// file input

// dnd handler
window.addEventListener( 'dragover', function ( event ) {
	event.preventDefault();
} );

window.addEventListener( 'drop', function ( event ) {
	event.preventDefault();

	// read given file then convert it to blob url
	const files = event.dataTransfer.files;
	if ( ! files ) return;

	const file = files[ 0 ];
	if ( ! file ) return;

	const fileType = file.name.split( '.' ).pop();
	const blob = new Blob( [ file ], { type: 'application/octet-stream' } );
	const url = URL.createObjectURL( blob );

	if ( fileType === 'fbx' ) {

		loadFBX( url );

	} else {

		loadVRM( url );

	}

} );

/**
* setup app UI
*/


function setupAppScreen() {
	const apps = [
		{ "name": "Model", "icon": "shared/users.png"},
		{ "name": "PhotoBooth", "icon": "shared/photo.png"},
		{ "name": "Game", "icon": "shared/gambling.png"},
		{ "name": "NewsBoard", "icon": "shared/www.png"}
	];

	const appContainer = document.getElementById('app-container');
	appContainer.innerHTML = '';

	apps.forEach(app => {
		let button = document.createElement('button');
		button.className = 'app-icon';
		button.onclick = function() {
			setTimeout(function() {
				showAppContent(app.name, app.content);
			}, 200);
		};
		appContainer.appendChild(button);  // Fixed this line
		let icon = document.createElement('img');
		icon.src = app.icon; // Removed the commented line
		icon.style.width = "20px";
		icon.style.marginRight = "5px"
		icon.onclick = function() {
			setTimeout(function() {
				showAppContent(app.name, app.content);
			}, 200);
		};
		button.appendChild(icon);
		// button.innerHTML += app.name;
	});
	
}

function setupNewsScreen() {
	const appContainer = document.getElementById('NewsBoard-screen');
	appContainer.innerHTML = '';

	news.forEach(newsItem => {
		let newsDiv = document.createElement('pre');
		// icon.src = app.icon;
		newsDiv.innerHTML = newsItem;
		appContainer.appendChild(newsDiv);
	});
}

function setupPhotoBoothScreen() {
	const photoBoothContainer = document.getElementById('pose-list');
	photoBoothContainer.innerHTML = '';

	availableAnimations.forEach(element => {
		let icon = document.createElement('div');
		// icon.src = app.icon;
		icon.innerHTML = element;
		icon.className = 'pose-icon';
		icon.onclick = function() {
			playSpecificAnimation(element);
		};
		photoBoothContainer.appendChild(icon);
	});
}

function setStatusBarText(text) {
	document.getElementById('status-bar-title').innerHTML = text;
}

function setScreenVisible(screenName, visible) {
	let screen = document.getElementById(screenName);
	screen.style.display = visible ? 'flex' : 'none';
}

function hideAppScreens() {
	// Hide all app screens
	document.querySelectorAll('.app-screen').forEach(screen => {
		screen.style.display = 'none';
	});
}

function showAppContent(appName, content) {
	hideAppScreens();
	// setScreenVisible('app-container', false);
	setStatusBarText(appName);
	setScreenVisible(appName + '-screen', true);
}

function onBackClick() {
	hideAppScreens();
	setScreenVisible('app-container', true);
	setStatusBarText("PockitOS v0.1")
}

function printToChat(msg, rightAlign = false) {
	let chatBox = document.getElementById('chat-log');
	chatBox.innerHTML += '<p style="text-align: '+ (rightAlign? 'right': 'left') + '">' + msg + '</p>';
}

async function printToChatOptions(chatId, msg = undefined) {
	if (msg == undefined) {
		msg = chatLogs[chatId].msg;
	}
	const msgArray = msg.split(' ');
	let chatBox = document.getElementById('chat-options');
	chatBox.style.textAlign = 'left';

	for (let i = 0; i < msgArray.length; i++) {
		await sleep(100);
		chatBox.innerHTML += msgArray[i] + " ";
	}
	printToChat(chatLogs[chatId].msg);
	chatBox.innerHTML = '';
	showOptions(chatId);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function showOptions(chatId) {
	let chatBox = document.getElementById('chat-options');
	chatBox.style.textAlign = 'right';
	chatLogs[chatId].response.forEach(response => {
		const resp = response.msg || "...";
		let optionButton = document.createElement('button');
		optionButton.innerHTML = resp;
		optionButton.onclick = function() {
			printToChat(resp, true);
			printToChatOptions(response.nextMsg);
			chatBox.innerHTML = '';
		};
		chatBox.appendChild(optionButton);
	});
}

document.addEventListener('DOMContentLoaded', function() {
	// loadBlobFromLocalStorage();
	loadVRM( defaultModelUrl );
	loadStage();

	setupAppScreen();
	setupPhotoBoothScreen();
	setupNewsScreen();

	// set up model screen
	let downloadButton = document.getElementById('download-model');
	downloadButton.onclick = function() {
		safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId + ".vrm");
	};

	let downloadNewTabButton = document.getElementById('download-newtab');
	downloadNewTabButton.onclick = function() {
		safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId  + ".html");
	};


	onBackClick();
	printToChatOptions("begin");
}, { once: true });

/**
* UTIL FUNCTIONS
*/

function safeDownloadUrl(url) {
	// also copy link to clipboard
	var dummy = document.createElement("textarea");
	document.body.appendChild(dummy);
	dummy.value = url;
	dummy.select();
	document.execCommand("copy");
	document.body.removeChild(dummy);
	window.open(url, '_blank');
}

let animationQueue = []; // Queue of animations to play

function playNextAnimation() {
	let animToPlay = animationQueue.shift()|| "Idle";


	if(animToPlay == "Walking")
	{
		let x, z;
		x = Math.random() * 4 - 2;
		z = Math.random() * 4 - 2;

		const actionDuration = 1000;

		new TWEEN.Tween(group.position)
		.to({ x: x, z: z }, actionDuration)
		.easing(TWEEN.Easing.Linear.None)
		.start();
	}
	currentVrm.position = new THREE.Vector3(0, 0, 0);


	const nextAnimationName = animToPlay;
	console.log("Playing animation: " + nextAnimationName);
	loadFBX("shared/" + nextAnimationName + ".fbx");
}

function playSpecificAnimation(animationName) {
	animationQueue.push(animationName);
	playNextAnimation();
}


