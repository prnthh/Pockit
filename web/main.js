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
	"Walking",
	"Female Dynamic Pose", 
	"Standing Greeting"
];

var saveBlob = {
	miladyId: undefined,
	lastChatId: undefined,
	unlockedAnimations: []
}

// get sha hash of blob and save it to local storage
function saveBlobToLocalStorage() {
	const blobHash = sha256(JSON.stringify(saveBlob));
	localStorage.setItem('pockitSaveBlob-'+window.pockitId, {saveBlob, blobHash});
} 

// load blob from local storage and check if it matches the current blob
function loadBlobFromLocalStorage() {
	const blob = localStorage.getItem('pockitSaveBlob'+window.pockitId);
	if (blob) {
		console.log("Blob found, loading...");
		// check if hash matches
		const blobHash = sha256(JSON.stringify(saveBlob));
		if (blob && blob.blobHash == blobHash) {
			saveBlob = blob.saveBlob;
		}
	} else {
		console.log("No blob found, creating new one...");
	}
}

// renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
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
	
	loader.register( ( parser ) => {
		
		return new VRMLoaderPlugin( parser, { 
			// helperRoot: helperRoot, 
			autoUpdateHumanBones: true 
		} );
		
	} );
	
	loader.load(modelUrl, ( gltf ) => 
	{
		const vrm = gltf.userData.vrm;
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
		scene.add(model);
	});
}

var currentAction = null;

function loadFBX(animationUrl) {
	currentAnimationUrl = animationUrl;
	
	loadMixamoAnimation(animationUrl, currentVrm).then((clip) => {
		const newAction = currentMixer.clipAction(clip);
		newAction.setLoop(THREE.LoopOnce);
		newAction.clampWhenFinished = true;
		newAction.timeScale = params.timeScale;
		
		if (currentAction) {
			// currentAction.reset();
			currentAction.crossFadeTo(newAction, 0.5, false);
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
		// const s = 0.25 * Math.PI * Math.sin( Math.PI * clock.elapsedTime );
		// currentVrm.humanoid.getNormalizedBoneNode( 'neck' ).rotation.y = s;
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
const gui = new GUI();
const params = {
	timeScale: 1.0,
};

gui.add( params, 'timeScale', 0.0, 2.0, 0.001 ).onChange( ( value ) => {
	currentMixer.timeScale = value;
} );

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
		{ "name": "Model", "icon": "shared/users.png", "content": "Content for App 2"},
		{ "name": "PhotoBooth", "icon": "shared/photo.png", "content": "Content for App 4" },
		{ "name": "Chat", "icon": "shared/chat.png", "content": "Content for App 5" },
		{ "name": "NewsBoard", "icon": "shared/www.png", "content": "Content for App 5" },
		
		// ... Other apps ...
	];
	
	const appContainer = document.getElementById('app-container');
	appContainer.innerHTML = '';
	
	apps.forEach(app => {
		let icon = document.createElement('img');
		// icon.src = app.icon;
		icon.src = app.icon;
		icon.className = 'app-icon';
		icon.onclick = function() {
			setTimeout(function() {
				showAppContent(app.name, app.content);
			}, 200);
		};
		appContainer.appendChild(icon);
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
	
	[1, 2, 3].forEach(element => {
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

function showBackButton(show = true) {
	var backButton = document.getElementById('status-bar-back');
	backButton.style.display = show ? 'block' : 'none';
}

function showAppContent(appName, content) {
	hideAppScreens();
	setScreenVisible('app-container', false);
	showBackButton(true);
	setStatusBarText(appName);
	setScreenVisible(appName + '-screen', true);
}

function onBackClick() {
	hideAppScreens();
	setScreenVisible('app-container', true);
	showBackButton(false);
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
	loadBlobFromLocalStorage();
	loadVRM( defaultModelUrl );
	loadStage();
	
	setupAppScreen();
	setupPhotoBoothScreen();
	setupNewsScreen();
	// set up back button
	let backButton = document.getElementById('status-bar-back');
	backButton.onclick = function() {
		onBackClick();
	};
	
	// set up model screen
	let downloadButton = document.getElementById('download-model');
	downloadButton.onclick = function() {
		safeDownloadVrm();
	};
	
	onBackClick();
	printToChatOptions("begin");
}, { once: true });

/**
* UTIL FUNCTIONS
*/

function safeDownloadVrm() {
	window.open(defaultModelUrl, '_blank');
}

let currentAnimationIndex = 0; // Keeps track of the current animation

function playNextAnimation() {
	// if (currentAnimationIndex >= availableAnimations.length) {
	// 	currentAnimationIndex = 0; // Reset to the first animation if at the end
	// }
	
	const actionDuration = 1000;
	let x, z;
	x = Math.random() * 4 - 2;
	z = Math.random() * 4 - 2;
	
	if(currentAnimationIndex == 1)
	{
		new TWEEN.Tween(group.position)
		.to({ x: x, z: z }, actionDuration)
		.easing(TWEEN.Easing.Linear.None)
		.start();
	}
	currentVrm.position = new THREE.Vector3(0, 0, 0);
	
	
	const nextAnimationName = availableAnimations[currentAnimationIndex];
	console.log("Playing animation: " + nextAnimationName);
	loadFBX("shared/" + nextAnimationName + ".fbx");
	currentAnimationIndex = 0;
}

function playSpecificAnimation(animationIndex) {
	currentAnimationIndex = animationIndex;
}


