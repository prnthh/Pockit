import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from '../loadMixamoAnimation.js';
import { chatLogs as defaultChatLogs } from './chatLogs.js';

export var chatLogs = [...defaultChatLogs];

const availableAnimations = ["Idle", "Baseball Idle", "Shaking Head No", "Baseball Strike", "Charge", "Excited", "Great Sword Slash", "Happy Idle", "Happy", "Pointing", "Northern Soul Spin", "Salute", "Skinning Test", "Strong Gesture", "Quick Formal Bow", "Rumba", "Scared", "Silly Dancing", "Thinking", "Standing Greeting", "Blow A Kiss", "Drunk", "Loser", "Sitting", "Standing 1", "Standing 2", "Crouch", "Dynamic", "Offensive", "Standing 2", "Throw", "Drop Kick", "Walking"];
const maps = ["mindpalace","mindpalace2", "lumbridge", "chairs/1", "chairs/2", "chairs/3", "chairs/4", "sakura_park", "ritual_platform", "room", "windows", "tennis_court", "greenscreen", "bedroom", "stage"];
const assetDirectory = "./shared1";
const defaultModelUrl = './'+ window.pockitId +'.vrm';

const renderer = new THREE.WebGLRenderer({antialias: false});
const exposure = -14;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = Math.pow(2, exposure);

const camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 70.0 );
const scene = new THREE.Scene(), clock = new THREE.Clock();
var modelHeight = 1.1;

document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI / 2

scene.background = new THREE.Color( 0xffffff );
scene.fog = new THREE.Fog( 0xffffff, 35, 75 );

THREE.Cache.enabled = true;
let currentVrms = {}, currentStage = undefined, loadedActions = {};
let freeplay = false;

// const helperRoot = new THREE.Group();
// helperRoot.renderOrder = 10000;
// scene.add( helperRoot );

const gltfLoader = new GLTFLoader();
gltfLoader.crossOrigin = 'anonymous';

class Character
{
	constructor(name)
	{
		this.name = name;
		this.vrm = undefined;
		this.animationQueue = [];
		this.currentAction = undefined;
		this.group = new THREE.Group();
	}

	async loadVRM( modelUrl) {
		// helperRoot.clear();
		return new Promise((resolve, reject) => {
			showLoadingScreen(true, modelUrl);
			gltfLoader.register( ( parser ) => {
				return new VRMLoaderPlugin( parser, {
					// helperRoot: helperRoot,
					autoUpdateHumanBones: true
				});
			});

			gltfLoader.load(modelUrl, ( gltf ) =>
			{
				const vrm = gltf.userData.vrm;
				console.log(gltf);
				if ( this.vrm ) {
					scene.remove( this.vrm.scene );
					scene.remove( this.group );
					VRMUtils.deepDispose( this.vrm.scene );
				}

				this.vrm = vrm;
				this.group.add(this.vrm.scene);
				scene.add(this.group);

				vrm.scene.traverse( ( obj ) => {
					// obj.frustumCulled = false;
					obj.castShadow = true;
				} );

				this.vrm.mixer = new THREE.AnimationMixer( this.vrm.scene );
				this.vrm.mixer.addEventListener( 'finished', ( e) => {
					this.playNextAnimation();
				} );
				this.playNextAnimation();

				VRMUtils.rotateVRM0( vrm );
				showLoadingScreen(false, modelUrl);
				console.log( vrm );
				resolve( vrm );
			},
			( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),
			( error ) => reject(error));
		});
	}

	async loadFBX(animationUrl) {
		if(this.loadedActions && this.loadedActions[animationUrl])
		{
			let newAction = this.vrm.mixer.clipAction(this.loadedActions[animationUrl].clone());
			this.playAnimation(newAction);
			return;
		} else if(!this.loadedActions) {
			this.loadedActions = {};
		}

		console.log("Loading animation: " + animationUrl);
		loadMixamoAnimation(animationUrl, this.vrm).then((clip) => {
			this.loadedActions[animationUrl] = clip.clone();
			let newAction = this.vrm.mixer.clipAction(clip);
			newAction.name = animationUrl;
			this.playAnimation(newAction);
		});
	}

	playAnimation(newAction){
		if(newAction._clip.duration > 0.5)
		{
			newAction.clampWhenFinished = true;
			newAction.setLoop(THREE.LoopOnce);
		} else {
			newAction.setLoop(THREE.LoopRepeat, 1000);
		}

		if (this.currentAction) {
			this.currentAction.crossFadeTo(newAction, 0.1, false);
		}

		newAction.play();
		this.currentAction = newAction;
	}

	playNextAnimation() {
		this.loadFBX(assetDirectory + "/anim/" + (this.animationQueue.shift()|| (this.walkTarget && "Walking") || "Idle") + ".fbx");
	}

	playSpecificAnimation(animationName) {
		this.animationQueue.push(animationName);
		console.log(this.animationQueue)
		this.playNextAnimation();
	}

	loadObject( modelUrl, modelId = 'pistol', parent = 'protagonist' ) {
		modelUrl = assetDirectory + "/props/" + modelUrl;
		showLoadingScreen(true, modelUrl);
		gltfLoader.load(modelUrl + ".glb",
		(gltf) => {
			showLoadingScreen(false, modelUrl);
			var model = gltf.scene;
			gltf.scene.traverse( function ( object ) {
				// if ( object.isMesh ) {object.receiveShadow = true; object.castShadow = true;}
			} );
			scene.add(model);
			// currentStage = model;
			model.parent = this.vrm.humanoid.getNormalizedBoneNode( 'rightHand' )
		});
	}

	async processInstruction(instruction) {
		return new Promise(async (resolve, reject) => {
			console.log(`[PockitScript - ${this.name}]: ` + instruction);
			var instructionArray = instruction.split(' ');
			const instructionType = instructionArray.shift();
			switch(instructionType) {
				case "anim":
				const path = instructionArray.join(' ');
				await this.loadFBX(`${assetDirectory}/anim/${path}.fbx`, this.vrm);
				break;
				case "character":
				const characterId = instructionArray.shift();
				currentVrms[characterId].playSpecificAnimation(instructionArray.shift());
				break;
				case "prop":
				const propId = instructionArray.shift();
				this.loadObject(propId, propId);
				break;
				case "position":
				const position = instructionArray.shift().split(',');
				this.group.position.set(parseFloat(position[0]), 0, parseFloat(position[1]));
				break;
				case "rotation":
				const rotation = instructionArray.shift()
				this.group.rotation.set(0, parseFloat(rotation), 0);
				break;
				case "walkto":
				const target = instructionArray.shift().split(',');
				const targetVector = {"position": new THREE.Vector3(target[0], 0, target[1]), "rotation": this.group.rotation};
				this.walkTo(targetVector.position);
				break;
				case "face":
				currentVrms[instructionArray[1]].playSpecificAnimation(instructionArray[2]);
				break;
			}
			resolve();
		});
	}


	walkTo(targetPosition) {
		if(this.currentAction && this.currentAction.name != "Walking")
			this.playSpecificAnimation("Walking");
		this.walkTarget = new THREE.Vector3(targetPosition.x, 0, targetPosition.z);
	}
}

class Room {
	constructor(name = "mindpalace") {
		this.name = name;
		this.stage = undefined;
		// this.loadStage(name)
	}

	loadStage(stageName)
	{
		if(this.stage)
		{
			scene.remove( this.stage );
		}
		showLoadingScreen(true, stageName);
		gltfLoader.load(`${assetDirectory}/maps/${stageName}.glb`,
		(gltf) => {
			var hasLights = false;
			showLoadingScreen(false, stageName);
			var stage = gltf.scene;
			gltf.scene.traverse( function ( object ) {
				if ( object.isMesh ) {object.receiveShadow = true; object.castShadow = true;}
				if ( object.isLight ){
					object.castShadow = true;
					object.shadow.bias = -0.0001;
					object.shadow.radius = 2;
					hasLights = true;
				}
				if(object.name == "floor_50,50_(0)")
				floorMesh = object;
			} );
			if(!hasLights) {
				stage.add( new THREE.AmbientLight( 0xffffff, 10000 ));
				const light = new THREE.PointLight( 0xffffff, 6000 );
				light.castShadow = true;
				light.position.set( 0, 2, 2 );
				light.shadow.bias = -0.0001;
				stage.add( light );
			}
			scene.add(stage);
			this.stage = stage;
		});
	}
}

function switchRoom() {

}

var floorMesh = undefined;
function drawFloor()
{
	var floorGeometry = new THREE.PlaneGeometry(10, 10); // 10x10 size, adjust as needed
	var floorMaterial = new THREE.MeshBasicMaterial({ visible: false });
	floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
	floorMesh.rotateX(-Math.PI / 2); // Rotate the floor 90 degrees
	// Add the mesh to the scene
	scene.add(floorMesh);
}

function animate() {
	requestAnimationFrame( animate );
	const deltaTime = clock.getDelta();
	Object.values(currentVrms).forEach(character => {
		if ( character.vrm ) {
			if (character.vrm.mixer) {
				character.vrm.mixer.update( deltaTime );
			}
			character.vrm.humanoid.getNormalizedBoneNode( 'hips' ).position.y = modelHeight;
			const s2 = Math.sin( Math.PI * clock.elapsedTime );
			character.vrm.expressionManager.setValue( 'blink', 0 + 2 * s2 );
			character.vrm.update( deltaTime );

			if (character.group && character.walkTarget) {
				const direction = new THREE.Vector3().subVectors(character.walkTarget, character.group.position);
				const targetAngle = Math.atan2(direction.x, direction.z);
				let deltaAngle = targetAngle - character.group.rotation.y;

				// Normalize deltaAngle to range [-PI, PI]
				deltaAngle = Math.atan2(Math.sin(deltaAngle), Math.cos(deltaAngle));

				// Rotate character towards target using shortest path
				character.group.rotation.y += deltaAngle * 0.1;

				// Move forward if not at the target
				if (direction.length() >= 0.1) {
					direction.normalize();
					character.group.position.addScaledVector(direction, 0.02);
				} else {
					character.walkTarget = undefined;
					character.playSpecificAnimation("Idle");
				}
			}
		}
	});

	animateCamera();
	controls.update();
	TWEEN.update();
	renderer.render( scene, camera );
}


// gui
// const gui = new GUI();
const params = {
	timeScale: 1.0,
};

// gui.add( params, 'timeScale', 0.0, 2.0, 0.001 ).onChange( ( value ) => {
// 	currentMixer.timeScale = value;
// } );

window.addEventListener( 'dragover', function ( event ) {
	event.preventDefault();
} );

window.addEventListener( 'drop', function ( event ) {
	event.preventDefault();
	const files = event.dataTransfer.files;
	if (!files) return;
	const file = files[ 0 ];
	if (!file) return;

	const fileType = file.name.split( '.' ).pop();
	const blob = new Blob( [ file ], { type: 'application/octet-stream' } );
	const url = URL.createObjectURL( blob );

	if ( fileType === 'fbx' ) loadFBX( url );
	else {currentVrms['dropin'] = new Character("protagonist");
	currentVrms['dropin'].loadVRM( url );}
} );

/********************************************************
* setup app UI
********************************************************/
var loadingFiles = [];
var loadingCallback = undefined;
function showLoadingScreen(show = true, filename = undefined) {
	const loadingScreen = domNode('loading-screen');
	const loadingMessage = domNode('loading-text');

	if(filename){
		if (show) {
			loadingFiles.push(filename);
			loadingScreen.style.display = 'flex';
			loadingMessage.innerHTML += '<br /> Loading: ' + filename;
		} else {
			loadingFiles = loadingFiles.filter(item => item !== filename);
			loadingMessage.innerHTML += '<br /> Done: ' + filename;
			if(loadingFiles.length == 0)
			{
				loadingScreen.style.display = 'none';
				loadingCallback && loadingCallback();
				loadingCallback = undefined;
			}
		}
		loadingMessage.scrollTop = loadingMessage.scrollHeight;
	}
}

function showInfoPopup(show = true, content = undefined, title = undefined) {
	domNode('info-popup').style.display = show? 'flex': 'none';
	domNode('info-popup-content').innerHTML = content;
}

function setupDropdownMenu(containerId, options, callback) {
	const appContainer = domNode(containerId);
	appContainer.innerHTML = '';

	options.forEach(option => {
		let optionButton = document.createElement('div');
		optionButton.innerHTML = option;
		optionButton.className = 'dropdown-option';
		optionButton.onclick = ()=> {callback(option)};
		appContainer.appendChild(optionButton);
	});

}

export async function initiateChatNode(chatId) {
	var chatItem = getChatItem(chatId);
	if(!chatItem) {
		console.log("Chat item not found: " + chatId);
		domNode('Chat-screen').style.display = 'none';
		return;
	}

	if(chatItem.animation) instructionQueue = [...instructionQueue, ...chatItem.animation]

	domNode('Chat-screen').style.display = 'flex';
	domNode('chat-options').innerHTML = '';
	freeplay = false;

	let chatBox = domNode('chat-log');
	chatBox.innerHTML = '';
	// chatBox.style.textAlign = 'left';
	(domNode('chat-name').innerHTML = chatItem.from || "Pockit");

	const msgArray = chatItem.msg?.split(' ');
	if(!msgArray) return;
	for (let i = 0; i < msgArray.length; i++) {
		await sleep(100);
		chatBox.innerHTML += msgArray[i] + " ";
	}
	showOptions(chatItem);
}


function showOptions(chatItem) {
	let chatBox = domNode('chat-options');
	chatBox.style.display = 'block';
	chatBox.style.textAlign = 'center';
	chatItem.response.forEach(response => {
		const resp = `[${response}]`;
		let optionButton = document.createElement('button');
		optionButton.innerHTML = resp;
		optionButton.className = 'chat-option';
		optionButton.onclick = function() {
			freeplay = true;
			domNode('Chat-screen').style.display = 'none';
			instructionQueue = ["chat " + response, ...instructionQueue];
			if(chatItem.response.length > 1)
			doober(assetDirectory + "/smile.png", 1, {x: window.innerWidth/2, y: window.innerHeight/2}, {x: 0, y: 0});
		};
		chatBox.appendChild(optionButton);
	});
}

let characterTarget = undefined;
var cameraOffset = new THREE.Vector3(0, 5, 6);
var targetOffset = new THREE.Vector3(0, 1.2, 0);
camera.position.set( 0, 4, 5 );

function animateCamera(){
	if(controls) {
		if(characterTarget && characterTarget.group) {
			camera.position.copy(characterTarget.group.position.clone().add(cameraOffset));
			controls.target = characterTarget.group.position.clone().add(targetOffset);
			// } else {
			// 	camera.position.copy(cameraTarget.clone().add(offset));
			// 	controls.target = cameraTarget;
		}

	}
}

controls.addEventListener('change', () => {
	if(characterTarget) {
		cameraOffset.copy(camera.position).sub(characterTarget.group.position);
		targetOffset.copy(controls.target).sub(characterTarget.group.position);
	}
});

function cameraLookAtCharacter(targetCharacter, rotationOffset = 0) {
	characterTarget = targetCharacter;
	var characterRotation = targetCharacter.group.rotation;
	console.log('target', characterRotation)

	var frontOfCharacter = new THREE.Vector3(0, 3.5, 6).applyEuler(characterRotation);
	cameraOffset = frontOfCharacter;

	// new TWEEN.Tween(cameraOffset).to(characterTarget.group.position.clone().add(cameraOffset), 500).start();
	// new TWEEN.Tween(targetOffset).to(controls.target, 500).start();
}

async function processInstruction(instruction) {
	return new Promise(async (resolve, reject) => {
		console.log("[PockitScript]: " + instruction);

		var instructionArray = instruction.split(' ');
		const instructionType = instructionArray.shift();
		switch(instructionType) {
			case "load":
			const id = instructionArray.shift();
			const path = instructionArray.shift();
			currentVrms[id] = new Character(id);
			await currentVrms[id].loadVRM(path);
			break;
			case "camera":
			const target = instructionArray.shift();
			const rot = parseFloat(instructionArray.shift());
			cameraLookAtCharacter(currentVrms[target], rot);
			break;
			case "chat":
			const chatId = instructionArray.join(' ');
			initiateChatNode(chatId);
			break;
			case "character":
			const characterId = instructionArray.shift();
			if(!currentVrms[characterId]) {
				currentVrms[characterId] = new Character(characterId);
			}
			await currentVrms[characterId].processInstruction(instructionArray.join(' '));
			break;
			case "loadingcomplete":
			// loadingCallback = function(){};
			break;
			case "map":
			currentStage.loadStage(instructionArray.join(' '));
			break;
			case "sleep":
			await sleep(parseInt(instructionArray[0]));
			break;
		}
		resolve();
	});
}

var instructionQueue = ["load protagonist " + defaultModelUrl];
async function processNextInstruction() {
	if(instructionQueue.length > 0)
	{
		await processInstruction(instructionQueue.shift());
		processNextInstruction();
	} else {
		setTimeout(processNextInstruction, 1000);
	}
}

document.addEventListener('DOMContentLoaded', function() {
	currentStage = new Room();
	drawFloor();
	renderer.domElement.addEventListener('click', onMouseClick, false);
	processNextInstruction()

	loadingCallback = function(){
		cameraLookAtCharacter(currentVrms['protagonist']);
		instructionQueue.push("chat begin");

		// setupAppScreen();
		setupDropdownMenu('pose-list', availableAnimations, currentVrms['protagonist'] && currentVrms['protagonist'].playSpecificAnimation.bind(currentVrms['protagonist']));
		setupDropdownMenu('prop-list', ["pistol", "rune_scimitar"], currentVrms['protagonist'] && currentVrms['protagonist'].loadObject.bind(currentVrms['protagonist']));
		setupDropdownMenu('bg-list', maps, currentStage.loadStage.bind(currentStage));
		setupDropdownMenu('demo-list', ["runescape", "Instancing", "tweet", "news", "Cracked Old Man", 'Remilio And Juliet', 'angel fang', 'lainspotting', 'enter the matrix', 'radbro webring', 'mothers world'], lazyLoadMode);
		setupDropdownMenu('help-list', ["About", "Ads"], lazyLoadMode);

		// set up model screen
		domNode('download-model').onclick = () => {
			safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId + ".vrm");
		};

		domNode('download-url').innerHTML = "https://prnth.com/Pockit/web/"+ window.pockitId + ".vrm";

		domNode('download-newtab').onclick = () => {
			safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId  + ".html");
		};

		domNode('info-popup-close').onclick = function() {
			domNode('info-popup').style.display = 'none';
		};
	};
}, { once: true });


/********************************************************
* UTIL FUNCTIONS
********************************************************/


function onMouseClick(event) {
	var mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);
	var intersects = raycaster.intersectObject(floorMesh);

	if (intersects.length > 0) {
		var point = intersects[0].point;

		if(freeplay)
		currentVrms['protagonist'].walkTo(new THREE.Vector3(point.x, point.y, point.z));
		// cameraTarget = point;

	}
}

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

function getChatItem(chatId) {
	return chatLogs.find(item => item.id === chatId);
}

function getChatItemList()
{
	return chatLogs.map(item => item.id);
}

function domNode(id) {
	return document.getElementById(id);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function doober(imagePath, instances = 1, from, to) {
	// play sound
	var audio = new Audio(assetDirectory + '/sound/coin.mp3');
	console.log(audio);
	audio.play();

	let dooberItem = document.createElement('img');
	dooberItem.src = imagePath;
	dooberItem.className = 'doober';
	dooberItem.style.left = from.x + "px";
	dooberItem.style.top = from.y + "px";

	document.body.appendChild(dooberItem);
	let currentPosition = { top: parseInt(from.y, 10) };
	new TWEEN.Tween(currentPosition)
	.to({ top: parseInt(to.y, 10) }, 1000)
	.onUpdate(function() {
		dooberItem.style.top = currentPosition.top + 'px';
	})
	.start().onComplete(function() {
		document.body.removeChild(dooberItem);
	});
}

function showInfo(option) {
}

async function loadGameMode(mode) {
	try {
		const modulePath = `./modes/${mode}.js`;
		const gameModeModule = await import(modulePath);
		return gameModeModule.default;
	} catch (error) {
		console.error('Failed to load game mode:', error);
	}
}

function lazyLoadMode(mode = "Adventure") {
	switch(mode) {
		case "Instancing":
		loadGameMode("Instancing").then(InstancingMode => {
			const adventure = InstancingMode(Character, currentVrms, cameraLookAtCharacter);
		});
		break;
		case "Ads":
		loadGameMode("Adventure").then(AdventureMode => {
			// Initialize and start the adventure game mode
			const ads = [{"name":"Koolskull's Heads With Hats and Masks"}, {"name":"High Integrity Milady"}];
			var stringToPrint = "";
			ads.forEach(ad => {
				stringToPrint += `<div class="ad">${ad.name}</div>`;
			});
			showInfoPopup(true,stringToPrint);
		});
		break;
		default:
			const quests = ["Cracked Old Man", "Remilio And Juliet"];
			if(quests.includes(mode))
			loadGameMode(mode).then(InstancingMode => {
				const adventure = InstancingMode(Character, currentVrms, cameraLookAtCharacter);
			});
		else if(getChatItemList().includes(mode))
		instructionQueue = ["chat " + mode, ...instructionQueue];
		else
		showInfoPopup(true, `<center>Pockit is an on-chain digital pet and fantasy console.<br><br> "A path is made by walking on it"<br>-Chuang Tzu<br><br> This application is under active development. If you face issues, please clear your cache or try a different browser.</center>`);
		break;
	}

}
// lazyLoadMode();
animate();


class CrappyMMOAttempt {
	constructor() {
	  this._Initialize();
	}

	_Initialize() {
	  this.entityManager_ = new entity_manager.EntityManager();

	//   document.getElementById('login-button').onclick = () => {
		this.OnGameStarted_();
	//   };
	}
	OnGameStarted_() {
		this.LoadControllers_();
		this.LoadPlayer_();
	}
	LoadControllers_() {
		const threejs = new entity.Entity();
	    threejs.AddComponent(new threejs_component.ThreeJSController());
    this.entityManager_.Add(threejs);
	}

	LoadPlayer_() {
		const params = {
		  camera: this.camera_,
		  scene: this.scene_,
		};
	}
}

// let _APP = null;

// window.addEventListener('DOMContentLoaded', () => {
//   _APP = new CrappyMMOAttempt();
// });
