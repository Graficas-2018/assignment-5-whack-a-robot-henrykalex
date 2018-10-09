var container;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var radius = 100, theta = 0;

var horse;
var horses = [];

var duration = 20000; // ms
var currentTime = Date.now();

var animator = null,
duration = 0.5, // sec
loopAnimation = false;

var gameTimer = 0;
var gamePoints = 0;
var isPlaying = false;

function initAnimations(){
  animator = new KF.KeyFrameAnimator;
  animator.init({
    interps:[
      {
        keys:[0, 1],
        values:[
          { x : 0 },
          { x : -(Math.PI/2)  },
        ],
      },
      {
        keys:[0.7,1],
        values:[
          { y : 0 },
          { y : -200  },
        ],
      },
    ],
    loop: loopAnimation,
    duration:duration * 1000,
  });
}
function initEventListeners(){
  // document.addEventListener( 'mousemove', onDocumentMouseMove );
  document.addEventListener('mousedown', onDocumentMouseDown);
  window.addEventListener( 'resize', onWindowResize);
  let playButton = $('#playButton');
  let resetButton = $('#resetButton');
  playButton.click((evento)=>{
    playButton.hide();
    resetButton.show();
    isPlaying = true;
    $('.overlay').hide();
  });
  resetButton.hide();
  resetButton.click(()=>{
    playButton.show();
    resetButton.hide();
    updateTimer(0,true);
    updatePoints(0,true);
    isPlaying = false;
    $('.overlay').show();
  });
}

// Load
function loadMap(){
  let mapUrl = "./imgs/LostMeadow_dirt.jpg";
  let map = new THREE.TextureLoader().load(mapUrl);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);

  let color = 0xffffff;
  geometry = new THREE.PlaneGeometry(500, 200, 50, 50);
  let mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));
  mesh.rotation.x = -(Math.PI / 2);
  mesh.position.y = 0;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = 'groundMap'
  scene.add(mesh);
}

function loadHorses(){
  var loader = new THREE.GLTFLoader();
  loader.load( "../models/Horse.glb", ( gltf )=>{
    var horseMesh = gltf.scene.children[ 0 ];
    horse = new THREE.Object3D;
    horse.add( horseMesh );
    console.log("horse",horse); //Mesh
    horse.scale.set( 0.1, 0.1, 0.1 );
    horse.rotation.y = Math.PI/2;

    horse.castShadow = true;
    horse.receiveShadow = true;
    scene.add( horse );
    horses.push(horse);
    mixer.clipAction( gltf.animations[ 0 ], horse).setDuration( 1 ).play();
    console.log(gltf.animations);

    for ( var i = 0; i < 15; i ++ ){
      // var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
      var object = horse.clone();
      // object.name = 'Horse' + i+1;
      object.position.set((i%6) * 1000,0, Math.random() * 200 - 100);

      scene.add( object );
      horses.push(object);
      mixer.clipAction( gltf.animations[ 0 ], object).setDuration( 1 ).play();
    }
  });
}

// Actions
function playAnimations(){
  animator.start();
}


//Create scene
function createScene(canvas){
  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

  // Set the viewport size
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Turn on shadows
  renderer.shadowMap.enabled = true;
  // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.z = 100;
  camera.position.y = 50;
  camera.rotation.x= -Math.PI/9;

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );

  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 1, 1, 1 );
  scene.add( light );

  mixer = new THREE.AnimationMixer( scene );

  loadHorses();
  loadMap();

  raycaster = new THREE.Raycaster();
  initEventListeners();
  initAnimations(); // Define animations

  updateTimer(0);
}

function updateTimer(time, reset){ // in ms
  gameTimer= reset?time:gameTimer+time;
  $("#timeLabel").text(""+gameTimer/1000);
}

function updatePoints(points, reset){
  gamePoints = reset?points:gamePoints+points;
  $("#pointsLabel").text(""+gamePoints);
}

function onWindowResize(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown(event){
  if(!isPlaying)
  return;
  event.preventDefault();
  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // find intersections
  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( scene.children,true );

  if ( intersects.length > 0 && intersects[ 0 ].object.name != 'groundMap'){
    CLICKED = intersects[ 0 ].object;
    // CLICKED.material.emissive.setHex( 0x00ff00 );

    if(!animator.running){
      // for(var i = 0; i<= animator.interps.length -1; i++){
        animator.interps[0].target = CLICKED.rotation;
        animator.interps[1].target = CLICKED.position;
      // }
      console.log("CLICKED",CLICKED);
      console.log("animator.interps",animator.interps[1]);
      playAnimations();
      updatePoints(1);
    }
  }else{
    // if ( CLICKED )
    // CLICKED.material.emissive.setHex( CLICKED.currentHex );

    CLICKED = null;
  }
}

function run(){
  requestAnimationFrame( run );
  KF.update();
  renderer.render( scene, camera );
  if(isPlaying)
  animate();
}
var tempo = false;
function animate() {
  var now = Date.now();
  var deltat = now - currentTime;
  if(isPlaying)
  updateTimer(deltat);
  validateEnd();
  currentTime = now;
  if ( mixer ) {
    mixer.update( ( deltat ) * 0.001 );
  }
  for(let horse of horses){
    // if(!tempo)
    // console.log("horse",horse);
    horse.position.x +=  deltat * ((Math.floor(Math.random() * (4 - 3 + 1)) + 3)/100);
    if(horse.position.x > 200)
    resetHorse(horse);
  }
  // if(horses.length>0)
  // tempo=true;
}

function resetHorse(horse){
  // console.log("horse",horse);
  horse.position.x = -200 - Math.random() * 50;
  horse.children[0].rotation.x = 0;
  horse.children[0].position.y = 0;
}

function validateEnd(){
  if(gameTimer>30000){
    isPlaying = false;
    $('.overlay').show();
  }

}
