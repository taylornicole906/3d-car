import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import CANNON, { Material, Vec3 } from 'cannon'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { BlendingEquation } from 'three'

/*
 * HTML things
 */


// Canvas
const canvas = document.querySelector('canvas.webgl')

/*
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Scene
const loadingManager = new THREE.LoadingManager(() => {

    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.classList.add('fade-out');

    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener('transitionend', onTransitionEnd);

});

const scene = new THREE.Scene()

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(40, sizes.width / sizes.height, 0.1, 200)
camera.position.x = -10
camera.position.y = 20
camera.position.z = -10


scene.add(camera)

//fog
const fog = new THREE.Fog('#48cae4', .01, 200)
    //scene.fog = fog


const gridHelper = new THREE.GridHelper(100, 100);
//scene.add( gridHelper );


/**
 * Models
 */
const dracoLoader = new DRACOLoader(loadingManager)
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let mainCar = new THREE.Object3D();
let road = new THREE.Object3D();

gltfLoader.load(
    '/models/car/purplecar2.gltf',
    (gltf) => {
        mainCar = gltf.scene;
        mainCar.scale.set(.3, .3, .3)
        mainCar.position.set(0, 10, 0)
        scene.add(mainCar)
    }
)
gltfLoader.load(
    '/models/road/road.gltf',
    (gltf) => {
        road = gltf.scene;
        road.scale.set(1.4, 1.4, 1.4)
        road.rotateY(Math.PI * 1.5)
        road.position.set(-6.2, .1, -4)
        scene.add(road)
    }
)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()


const topLeft = new THREE.Color(0xff70a6)
const topRight = new THREE.Color(0xff9770)
const bottomRight = new THREE.Color(0x70d6ff)
const bottomLeft = new THREE.Color(0xffffff)

const data = new Uint8Array([
    Math.round(bottomLeft.r * 255), Math.round(bottomLeft.g * 255), Math.round(bottomLeft.b * 255),
    Math.round(bottomRight.r * 255), Math.round(bottomRight.g * 255), Math.round(bottomRight.b * 255),
    Math.round(topLeft.r * 255), Math.round(topLeft.g * 255), Math.round(topLeft.b * 255),
    Math.round(topRight.r * 255), Math.round(topRight.g * 255), Math.round(topRight.b * 255)
])

const backgroundTexture = new THREE.DataTexture(data, 2, 2, THREE.RGBFormat)
backgroundTexture.magFilter = THREE.LinearFilter
backgroundTexture.needsUpdate = true


//physics/////

//phys world
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world);
world.gravity.set(0, -9.8, 0)
    //world.allowSleep = true //improves performance

//materials
const defaultMaterial = new CANNON.Material('defaultMaterial')
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial, {
        friction: 0.1,
        restitution: 0.8
    }
)
world.addContactMaterial(defaultContactMaterial) //now we dont need to add materials to every body
world.defaultContactMaterial = defaultContactMaterial


//Physics floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0 //makes it so nothing can move it
floorBody.addShape(floorShape); //can add multiple shapes to single body
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
)
world.addBody(floorBody)



//spheres & blocks


//Spheres///////////////////////////////////////////////////////////////////
const radius1 = .4;
const radius2 = .5;

const sphereGeometry = new THREE.SphereGeometry(radius1, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xff70a6,
    metalness: 0.3,
    roughness: 0.4
})

const sphereGeometry2 = new THREE.SphereGeometry(radius2, 20, 20)
const sphereMaterial2 = new THREE.MeshStandardMaterial({
    color: 0x70d6ff,
    metalness: 0.3,
    roughness: 0.4
})

const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
sphere.scale.set(1.3, 1.3, 1.3)
sphere.position.set(2, 3, 1)
sphere.castShadow = true

const sphere2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2)
sphere2.position.set(3, 3, 10)
sphere2.scale.set(1.3, 1.3, 1.3)
sphere2.castShadow = true


//add the visible spheres to the scene
scene.add(sphere)
scene.add(sphere2)

// Cannon.js body sphere 1
const sphereShape = new CANNON.Sphere(radius1) //must be same radius as visible sphere

const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 5),
    shape: sphereShape,
    material: defaultMaterial
})

// Cannon.js body sphere 2
const sphereShape2 = new CANNON.Sphere(radius2)

const sphereBody2 = new CANNON.Body({
    mass: 2,
    position: new CANNON.Vec3(0, 1, 10),
    shape: sphereShape2,
    material: defaultMaterial
})


world.addBody(sphereBody)
world.addBody(sphereBody2)

//////////////////////////////////////////  blocks ////////////////////////////////////////////////////

// Create box 1 
const boxGeometry = new THREE.BoxGeometry(.5, 2, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    color: 0xff70a6
})

const box = new THREE.Mesh(boxGeometry, boxMaterial)
box.castShadow = true
scene.add(box)


const boxShape = new CANNON.Box(new CANNON.Vec3(.5, 2, .5))

const boxBody = new CANNON.Body({
    mass: 5,
    position: new CANNON.Vec3(0, 2, 12),
    shape: boxShape,
    material: defaultMaterial
})

//box 2

const boxGeometry2 = new THREE.BoxGeometry(.5, 3, 1)
const boxMaterial2 = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    color: 0xff9770
})

const box2 = new THREE.Mesh(boxGeometry2, boxMaterial2)
box2.castShadow = true
scene.add(box2)


const box2Shape = new CANNON.Box(new CANNON.Vec3(.5, 3, .5))

const boxBody2 = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 16),
    shape: box2Shape,
    material: defaultMaterial
})

world.addBody(boxBody)
world.addBody(boxBody2)


// Visible Floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({
        map: backgroundTexture

    })
)

floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
floor.rotation.x = -Math.PI * 0.5
floor.position.y = 0
scene.add(floor)

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#ffffff', 0.5)
scene.add(ambientLight)

// Directional light
const sunLight = new THREE.DirectionalLight('#ffffff', 0.6)
sunLight.position.set(1, 5, 2)
scene.add(sunLight)


window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true

})

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#90f1ef')

//shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
sunLight.castShadow = true
floor.receiveShadow = true
mainCar.castShadow = true

// car physics body
var chassisShape = new CANNON.Box(new CANNON.Vec3(.5, 0.15, 1));
var chassisBody = new CANNON.Body({ mass: 100 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 10, 0);

chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

// parent vehicle object
const vehicle = new CANNON.RaycastVehicle({
    chassisBody: chassisBody,
    indexRightAxis: 0, // x
    indexUpAxis: 1, // y
    indexForwardAxis: 2, // z
});
vehicle.addToWorld(world);

// wheel options
var options = {
    radius: 0.3,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 45,
    suspensionRestLength: 0.4,
    frictionSlip: 5,
    dampingRelaxation: 2.3,
    dampingCompression: 4.5,
    maxSuspensionForce: 200000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(-1, 0, 0),
    chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
    maxSuspensionTravel: 0.25,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true
};

var axlewidth = 0.7;
options.chassisConnectionPointLocal.set(axlewidth, 0, -1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, -1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(axlewidth, 0, 1);
vehicle.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, 1);
vehicle.addWheel(options);

vehicle.addToWorld(world);

// car wheels
var wheelBodies = [];
vehicle.wheelInfos.forEach(function(wheel) {
    var shape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
    var body = new CANNON.Body({ mass: 1 });
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    body.addShape(shape, new CANNON.Vec3(), q);
    wheelBodies.push(body);
});



function navigate(e) {
    if (e.type != 'keydown' && e.type != 'keyup') return;
    var keyup = e.type == 'keyup';

    var engineForce = 50,
        maxSteerVal = 0.5;
    switch (e.keyCode) {

        case 38: // forward
            document.getElementById("help").style.display = "none";
            vehicle.applyEngineForce(keyup ? 0 : -engineForce, 2);
            vehicle.applyEngineForce(keyup ? 0 : -engineForce, 3);
            break;

        case 40: // backward
            vehicle.applyEngineForce(keyup ? 0 : engineForce, 2);
            vehicle.applyEngineForce(keyup ? 0 : engineForce, 3);
            break;

        case 39: // right
            vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 3);
            vehicle.setSteeringValue(keyup ? 0 : -maxSteerVal, 2);
            break;

        case 37: // left
            vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 3);
            vehicle.setSteeringValue(keyup ? 0 : maxSteerVal, 2);
            break;

        case 32: //space bar to brake
            vehicle.setBrake(keyup ? 0 : engineForce, 0);
            vehicle.setBrake(keyup ? 0 : engineForce, 1);
            vehicle.setBrake(keyup ? 0 : engineForce, 2);
            vehicle.setBrake(keyup ? 0 : engineForce, 3);
            break;

    }
}

window.addEventListener('keydown', navigate)
window.addEventListener('keyup', navigate)


/**
 * Animate
 */

const clock = new THREE.Clock()
let oldElapsedTime = 0;
const tick = () => {

    //update phys world
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime
    world.step(1 / 60, deltaTime, 3);
    mainCar.position.copy(chassisBody.position);
    mainCar.quaternion.copy(chassisBody.quaternion);

    sphere.position.copy(sphereBody.position)
    sphere2.position.copy(sphereBody2.position)

    sphere2.quaternion.copy(sphereBody2.quaternion)

    box.position.copy(boxBody.position)
    box.quaternion.copy(boxBody.quaternion)

    box2.position.copy(boxBody2.position)
    box2.quaternion.copy(boxBody2.quaternion)


    let cameraTarget = new THREE.Vector3(-10 + mainCar.position.x, 10, -5 + mainCar.position.z)

    camera.position.lerp(cameraTarget, 0.9);
    camera.lookAt(mainCar.position)
    camera.updateProjectionMatrix();

    if (mixer) {
        mixer.update(deltaTime)
    }

    // Update controls
    //controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

function onTransitionEnd(event) {

    event.target.remove();

}

tick()