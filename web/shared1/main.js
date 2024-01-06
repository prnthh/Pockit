import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { loadMixamoAnimation } from '../loadMixamoAnimation.js';
import { chatLogs } from './chatLogs.js';

const availableAnimations = ["Idle", "Quick Formal Bow", "Rumba", "Scared", "Silly Dancing", "Thinking", "Standing Greeting", "Blow A Kiss", "Drunk", "Loser", "Sitting", "Standing 1", "Standing 2", "Crouch", "Dynamic", "Offensive", "Standing 2", "Throw", "Drop Kick", "Walking"];
const maps = ["mindpalace2", "sakura_park", "ritual_platform", "room", "windows", "tennis_court", "greenscreen", "bedroom", "stage"];
const assetDirectory = "./shared1";

const renderer = new THREE.WebGLRenderer({antialias: false});
const camera = new THREE.PerspectiveCamera( 30.0, window.innerWidth / window.innerHeight, 0.1, 70.0 );
const scene = new THREE.Scene();
const clock = new THREE.Clock();
const exposure = -14;
var modelHeight = 1.1;

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = Math.pow(2, exposure);

document.body.appendChild( renderer.domElement );

let cameraTarget = new THREE.Vector3(0,1.5,0), cameraPosition = undefined;
const controls = new OrbitControls( camera, renderer.domElement );
controls.screenSpacePanning = true;
controls.maxPolarAngle = Math.PI / 2

scene.background = new THREE.Color( 0x91ffff );
scene.fog = new THREE.Fog( 0xffffff, 35, 75 );

const defaultModelUrl = './'+ window.pockitId +'.vrm';

THREE.Cache.enabled = true;
let currentVrms = {}, currentStage = undefined, loadedActions = {};

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
				
				// put the model to the scene
				this.vrm = vrm;
				this.group.add(this.vrm.scene);
				scene.add(this.group);
				
				// Disable frustum culling
				vrm.scene.traverse( ( obj ) => {
					// obj.frustumCulled = false;
					obj.castShadow = true;
				} );
				
				this.vrm.mixer = new THREE.AnimationMixer( this.vrm.scene );
				this.vrm.mixer.addEventListener( 'finished', ( e) => {
					this.playNextAnimation();
				} );
				this.playNextAnimation();
				
				// rotate if the VRM is VRM0.0
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
		console.log("Loading animation: " + animationUrl);
		if(this.loadedActions && this.loadedActions[animationUrl])
		{
			console.log("Animation already loaded: " + animationUrl);
			let newAction = this.vrm.mixer.clipAction(this.loadedActions[animationUrl].clone());
			this.playAnimation(newAction);
			return;
		} else if(!this.loadedActions) {
			this.loadedActions = {};
		}
		loadMixamoAnimation(animationUrl, this.vrm).then((clip) => {
			this.loadedActions[animationUrl] = clip.clone();
			let newAction = this.vrm.mixer.clipAction(clip);
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
			// currentAction.reset();
			// console.log(this.vrm.humanoid.getNormalizedBoneNode( 'hips' ).position.y)
			// this.vrm.humanoid.getNormalizedBoneNode( 'hips' ).position.y = 0;
			this.currentAction.crossFadeTo(newAction, 0.1, false);
		}
		
		newAction.play();
		this.currentAction = newAction;
	}
	
	playNextAnimation() {		
		this.loadFBX(assetDirectory + "/" + (this.animationQueue.shift()|| (this.walkTarget && "Walking") || "Idle") + ".fbx");
	}
	
	playSpecificAnimation(animationName) {
		this.animationQueue.push(animationName);
		console.log(this.animationQueue)
		this.playNextAnimation();
	}
	
	loadObject( modelUrl, modelId = 'pistol', parent = 'protagonist' ) {
		
		// if(currentStage)
		// {
		// 	scene.remove( currentStage );
		// 	VRMUtils.deepDispose( currentStage );
		// }
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
			console.log("Processing instruction: " + instruction);
			var instructionArray = instruction.split(' ');
			const instructionType = instructionArray.shift();
			switch(instructionType) {
				case "anim":
				const path = instructionArray.join(' ');
				await this.loadFBX(`${assetDirectory}/${path}.fbx`, this.vrm);
				break;
				case "character":
				const characterId = instructionArray.shift();
				currentVrms[characterId].playSpecificAnimation(instructionArray.shift());
				break;
				case "walkto":
				const target = instructionArray.shift().split(',');
				const targetVector = {"position": new THREE.Vector3(target[0], 0, target[1]), "rotation": this.group.rotation};
				this.walkTo(targetVector.position);
				// animateCameraToFace(targetVector)

				break;
				case "face":
				currentVrms[instructionArray[1]].playSpecificAnimation(instructionArray[2]);
				break;
			}
			resolve();
		});
	}
	
	
	walkTo(targetPosition) {
		this.playSpecificAnimation("Walking");
		this.walkTarget = new THREE.Vector3(targetPosition.x, 0, targetPosition.z);
	}
}

class Room {
	constructor(name = "mindpalace") {
		this.name = name;
		this.stage = undefined;
		this.loadStage(name)
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
			// var cameraTarget = group.position.clone();
			// cameraTarget.y += 1.0;
			// controls.target.copy(cameraTarget);
			
			if(character.group && character.walkTarget)
			{
				//gradually rotate to face target
				var rotationDelta = character.group.rotation.y - Math.atan2(character.walkTarget.x - character.group.position.x, character.walkTarget.z - character.group.position.z);
				if(rotationDelta > Math.PI) rotationDelta -= 2 * Math.PI;
				if(rotationDelta < -Math.PI) rotationDelta += 2 * Math.PI;
				character.group.rotation.y -= rotationDelta * 0.075;
				
				var newPosition = character.group.position;
				newPosition.x += 0.02 * Math.sin(character.group.rotation.y);
				newPosition.z += 0.02 * Math.cos(character.group.rotation.y);
				if(character.group.position.distanceTo(character.walkTarget) < 0.1)
				{
					character.walkTarget = undefined;
					character.playSpecificAnimation("Idle");
				}
			}
		}
	});
	
	
	if(controls && cameraTarget) {
		// lerp
		controls.target.lerp(cameraTarget, 0.1);
		if(controls.target.distanceTo(cameraTarget) < 0.1) cameraTarget = undefined;
	}
	
	if(cameraPosition){
		camera.position.lerp(cameraPosition, 0.1);
		if(camera.position.distanceTo(cameraPosition) < 0.1) cameraPosition = undefined;
		
	}
	TWEEN.update();
	
	controls.update();
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

async function initiateChatNode(chatId) {
	var chatItem = getChatItem(chatId);
	if(!chatItem) {
		console.log("Chat item not found: " + chatId);
		domNode('Chat-screen').style.display = 'none';
		return;
	}
	domNode('Chat-screen').style.display = 'flex';
	domNode('chat-options').innerHTML = '';
	const msg = chatItem.msg;
	
	const msgArray = msg.split(' ');
	let chatBox = domNode('chat-log');
	chatBox.innerHTML = '';
	chatBox.style.textAlign = 'left';
	chatItem.map && currentStage.loadStage(chatItem.map);
	// (chatItem.animation && currentVrms['protagonist'].playSpecificAnimation(chatItem.animation));
	if(chatItem.from) {
		domNode('chat-name').innerHTML = chatItem.from;
		animateCameraToFace(currentVrms[chatItem.from].group)
	} 
	else 
	{
		domNode('chat-name').innerHTML = "narrator";
		cameraLookAt(new THREE.Vector3(0, 4, 8), new THREE.Vector3(0, 1, 0));
	}
	
	if(chatItem.animation)
	{
		chatItem.animation.forEach(instruction => {
			processInstruction(instruction);
		});
	}
	
	for (let i = 0; i < msgArray.length; i++) {
		await sleep(100);
		chatBox.innerHTML += msgArray[i] + " ";
	}
	showOptions(chatItem);
}

function cameraLookAt(source, target) {
	cameraPosition = source;
	cameraTarget = target;
}

function animateCameraToFace(target)
{
	let targetPosition = new THREE.Vector3(target.position.x, target.position.y + modelHeight + 0.5, target.position.z);
	let targetRotation = target.rotation;
	let distance = 3; // Change this to the desired distance
	
	// Calculate the position in front of the group
	var cameraPosition = new THREE.Vector3(distance * Math.sin(targetRotation.y),0.5,distance * Math.cos(targetRotation.y));
	cameraPosition.add(targetPosition);
	cameraLookAt(cameraPosition, targetPosition);
}

async function processInstruction(instruction) {
	return new Promise(async (resolve, reject) => {
		console.log(instruction)
		
		var instructionArray = instruction.split(' ');
		const instructionType = instructionArray.shift();
		switch(instructionType) {
			case "load":
			const id = instructionArray.shift();
			const path = instructionArray.shift();
			currentVrms[id] = new Character(id);
			await currentVrms[id].loadVRM(path);
			break;
			case "character":
			const characterId = instructionArray.shift();
			await currentVrms[characterId].processInstruction(instructionArray.join(' '));
			break;
			case "loadingcomplete":
			loadingCallback = function(){initiateChatNode("begin")};
			break;
			case "goto":
			initiateChatNode(instructionArray[1]);
			break;
		}
		resolve();
	});
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
			// printToChat(resp, true);
			chatBox.innerHTML = '';
			initiateChatNode(response);
			doober(assetDirectory + "/smile.png", 1, {x: window.innerWidth/2, y: window.innerHeight/2}, {x: 0, y: 0});
		};
		chatBox.appendChild(optionButton);
	});
}

document.addEventListener('DOMContentLoaded', function() {
	// loadBlobFromLocalStorage();
	processInstruction("load protagonist " + defaultModelUrl);
	currentStage = new Room();
	drawFloor();
	renderer.domElement.addEventListener('click', onMouseClick, false);
	
	// setupAppScreen();
	setupDropdownMenu('pose-list', availableAnimations, currentVrms['protagonist'].playSpecificAnimation.bind(currentVrms['protagonist']));
	setupDropdownMenu('bg-list', maps, currentStage.loadStage.bind(currentStage));
	setupDropdownMenu('prop-list', ["pistol"], currentVrms['protagonist'].loadObject.bind(currentVrms['protagonist']));
	setupDropdownMenu('demo-list', ["simple story", "Instancing", "tweet", "news", ], lazyLoadMode);
	setupDropdownMenu('help-list', ["About", "Ads"], lazyLoadMode);
	
	// set up model screen
	domNode('download-model').onclick = () => {
		safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId + ".vrm");
	};
	
	domNode('download-newtab').onclick = () => {
		safeDownloadUrl("https://prnth.com/Pockit/web/"+ window.pockitId  + ".html");
	};
	
	domNode('info-popup-close').onclick = function() {
		domNode('info-popup').style.display = 'none';
	};
	loadingCallback = function(){initiateChatNode("begin")};
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
		currentVrms['protagonist'].walkTo(new THREE.Vector3(point.x, 0, point.z));
		cameraTarget = point;
		
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
			const adventure = InstancingMode(Character, currentVrms, animateCameraToFace);
		});
		break;
		case "Ads":
		loadGameMode("Adventure").then(AdventureMode => {
			// const adventure = AdventureMode(Character, currentVrms, animateCameraToFace);
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
		if(getChatItemList().includes(mode))
		initiateChatNode(mode);
		else
		showInfoPopup(true, "<center>Pockit is an on-chain digital pet and fantasy console. <br><br> This application is under active development. If you face issues, please clear your cache or try a different browser.</center>");
		break;
	}
	
}
// lazyLoadMode();