import * as THREE from './three.js/build/three.module.js';
import {OBJLoader} from './three.js/examples/jsm/loaders/OBJLoader.js'

import { OrbitControls } from './three.js/examples/jsm/controls/OrbitControls.js'

var debug = 0;
const COLOR_PCB = 0x66B6FF;
const COLOR_CORE = 0xF5A000;
const BG_ALPHA = false;
const SIZE_DOT_OVERLIGHT = 0.015;
const SIZE_DOT_NORMAL = 0.01;

const PCB_CONF = {
    Rot_x : -Math.PI/2,
    Rot_y : 0, 
    Rot_z : 0,
    Pos_x : -2.5,
    Pos_y : 0,
    Pos_z : 2.5, 
    Scale_x : 0.1,
    Scale_y : 0.1,
    Scale_z : 0.1
}

////// ANIMATION POSITIONNEMENT COMPOSANTS 
const COMPONENTS_PLACEMENT_POSY = 10
const COMPONENTS_COEFFK_ANIMATION = 0.015

const url_obj="./model/rpi_3_aplus_100k_woMaterials.obj";


var isModelLoaded = 0;  //passe à 1 lorsque le modele a ete téléchargé
var isModelRdy = 0;     //Passe à 1 lorsque le modele est pret pour animation (modele affiché + Point en surbrillance )



const canvas=document.querySelector(".webgl");

var scene = new THREE.Scene();


const loaderObj = new OBJLoader();

// load a resource
loaderObj.load(	url_obj,
	function ( obj ) {  
        //let geometry = new THREE.BoxGeometry(1, 1, 1);
        var geometry = obj.children[0].geometry
        var material = new THREE.PointsMaterial({ color: COLOR_PCB, size: SIZE_DOT_NORMAL});             //Bleu 0x66B6FF    ROSE 0xFD6C9E
        var pcb_dot_model= new THREE.Points(geometry, material);

        console.log("pcb_dot_model = " + pcb_dot_model)

        pcb_dot_model.scale.set(PCB_CONF.Scale_x, PCB_CONF.Scale_y, PCB_CONF.Scale_z);
        pcb_dot_model.rotation.set(PCB_CONF.Rot_x, PCB_CONF.Rot_y, PCB_CONF.Rot_z);
        pcb_dot_model.position.set(PCB_CONF.Pos_x, PCB_CONF.Pos_y, PCB_CONF.Pos_z);
    
        changeColorComponents(pcb_dot_model);
        scene.add( pcb_dot_model );        

        isModelRdy=1;
	},
	// called when loading is in progresses
	function ( xhr ) {
        if(debug)
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        isModelLoaded=1;
        isModelRdy = 0;
	},
	// called when loading has errors
	function ( error ) {
        if(debug)
            console.log( 'An error happened' + error );
        isModelLoaded=0;
        isModelRdy=0;
	}
);


var componentsVertices = [];    //Tableau avec les points de couleurs mis en surbrillance
/**
 * @brief Check if dot is inside limit. dot p --> p€[limit_x0; limit_y0]Union[limit_x1; limit_y1]Union[limitZ0; +Inf]
 * @param {*} x Coord x to check
 * @param {*} y Coord y to check
 * @param {*} z Coord z to check
 * @param {*} limitx0 
 * @param {*} limity0 
 * @param {*} limitx1 
 * @param {*} limity1 
 * @param {*} limitz0 
 * @returns 1 if dot has added to Components Vertices, 0 otherwise
 */
function extractComponentsPcb(x, y, z, limitx0, limity0, limitx1, limity1, limitz0) {
    if(x > limitx0 && x<limitx1) {
        if(y > limity0 && y<limity1 && z > limitz0 ) {
            componentsVertices.push(x, y, z);
            return 1
        }
    }

    return 0
}


function changeColorComponents(PointObject) {
    //console.log("changeColorCPU = ", PointObject)

    //COLOR ===================
    //const color = new THREE.Color(1, 0, 0)
    //PointObject.material.color.add(color)
    //console.log("changeColorCPU = ", PointObject.material.color)
    //COLOR ===================


    //EXTRACTION COMPONENTS ======================================================
    //console.log("arrayPosition = ", PointObject.geometry.attributes.position)
    var sizeArrayPosition = PointObject.geometry.attributes.position.count;
    //console.log("arrayPosition.count =" + sizeArrayPosition)

    var x=0;
    var y=0;
    var z=0;
    for ( let i=0; i < sizeArrayPosition*3; i) {

            x=PointObject.geometry.attributes.position.array[i++]       
            y=PointObject.geometry.attributes.position.array[i++]
            z=PointObject.geometry.attributes.position.array[i++]

            //WIFI EXTRACT
            if(extractComponentsPcb(x, y, z, 6.5, 6.5, 20.2, 17.5, 1))
                continue;
            
            //MINI USB EXTRACT
            if(extractComponentsPcb(x, y, z, 51.5, 6.8, 100, 15, 1))
                continue;  

            //CPU EXTRACT
            if(extractComponentsPcb(x, y, z, 17.4, 19.5, 31.5, 34.2, 1))
                continue;

            //USB EXTRACT
            if(extractComponentsPcb(x, y, z, 16.7, 53.2, 31.7, 100, 1)) 
                continue;

            //HDMI EXTRACT
            if(extractComponentsPcb(x, y, z, 45, 24, 80, 40, 1))
                continue;            
    }



    //Ajout geometry color rose aux composants 
    const geometryPointsColor = new THREE.BufferGeometry();
    geometryPointsColor.setAttribute( 'position', new THREE.Float32BufferAttribute( componentsVertices, 3 ) );
    //geometry.setAttribute( 'position', PointObject.geometry.attributes.position);

    const materialPointsColor = new THREE.PointsMaterial( { color: COLOR_CORE, size: SIZE_DOT_OVERLIGHT} );

    const pointsColor = new THREE.Points( geometryPointsColor, materialPointsColor );

    pointsColor.scale.set(PCB_CONF.Scale_x, PCB_CONF.Scale_y, PCB_CONF.Scale_z);
    pointsColor.rotation.set(PCB_CONF.Rot_x, PCB_CONF.Rot_y, PCB_CONF.Rot_z);
    pointsColor.position.set(PCB_CONF.Pos_x, COMPONENTS_PLACEMENT_POSY, PCB_CONF.Pos_z); 

    pointsColor.name = "COMPONENTS_TO_PLACE"

    scene.add( pointsColor );   
}







//SCENE + CAMERA ----------------------------------
const sizes= {
    width : window.innerWidth,
    height : window.innerHeight
}
//var camera = new THREE.PerspectiveCamera( 10, sizes.width/sizes.height, 1, 100);      //OK for GLBF
//var camera = new THREE.PerspectiveCamera( 75, sizes.width/sizes.height, 0.1, 1000);
var camera = new THREE.PerspectiveCamera( 75, sizes.width/sizes.height, 0.1, 100);
camera.position.set(-1, 1, 2);
scene.add( camera );

var renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    alpha : BG_ALPHA
});

renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//renderer.shadowMap.enabled = true;

//document.body.appendChild( renderer.domElement );
renderer.render( scene, camera );
renderer.gammaOutput = false;



//Light -----------------------------------------------------------
// const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 1 );
// directionalLight.position.set(2,2,2);
//scene.add( directionalLight );

//scene.add(new THREE.AmbientLight(0x404040)) 
if(debug && 1) {
    var gridHelper = new THREE.GridHelper( 10, 10, 0xFF0000, 0xAAAAAA);
    scene.add( gridHelper );

    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );
}



const controls = new OrbitControls( camera, renderer.domElement );
if(0) {
    controls.keys = { LEFT: 0, RIGHT: 0, UP: 0, BOTTOM: 0 }
    controls.mouseButtons = {
        LEFT: '', // THREE.MOUSE.ROTATE,
        MIDDLE: '', //THREE.MOUSE.DOLLY,
        RIGHT: ''
    }
    
    controls.enableZoom = false;
}

//controls.update() must be called after any manual changes to the camera's transform
//camera.position.set( 10, 10, 11);
controls.update();



var i_array_children_components_toplace = 0;
var i_bool_array_childrenFound = false;

var animate = function () {
	requestAnimationFrame( animate );
    //console.log(camera.position)
    
    controls.update();
    
    //model chargé + pret --> On effectue les mouvements
    if(isModelLoaded && isModelRdy) {

        //Recherche du children pour le premier lancement de la page 
        if(!i_bool_array_childrenFound) {
            if(scene.children[i_array_children_components_toplace].name == "COMPONENTS_TO_PLACE") {
                i_bool_array_childrenFound=true;
                //console.log("child fount at : " + i_array_children_components_toplace)
            }
            else {
                i_bool_array_childrenFound=false;
                i_array_children_components_toplace++;
                return;
            }
        }
        //!recherche children

        //CAMERA POSITION
        camera.position.x += (camera.position.x<2) ? 0.007 : 0;
        camera.position.y += (camera.position.y<2) ? 0.007 : 0;
        camera.position.z += (camera.position.z<-0.5) ? 0.007 : 0;
        //camera.zoom += (camera.zoom>0) ? 0.001 : 0;


        //ASSEMBLAGE COMPONENTS 
        //console.log(scene.children[3])
        var COMPONENTS_CURRENT_POSY_ANIMATION = scene.children[i_array_children_components_toplace].position.y

        if(COMPONENTS_CURRENT_POSY_ANIMATION >= 0.00001) {
            scene.children[i_array_children_components_toplace].position.y-=
                 COMPONENTS_CURRENT_POSY_ANIMATION * (COMPONENTS_COEFFK_ANIMATION/(1+COMPONENTS_COEFFK_ANIMATION));

                 if(debug)
                    console.log(COMPONENTS_CURRENT_POSY_ANIMATION);
        }
    }

    //console.log(camera)



    //console.log("y=" + cube.rotation.y + " x="+ cube.rotation.x);*/
    //console.log(scene.rotation.y);
    //renderer.outputEncoding = THREE.sRGBEncoding;
    //scene.flipY = false;
	renderer.render( scene, camera );
};

animate();
