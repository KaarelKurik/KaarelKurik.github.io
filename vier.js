import * as THREE from 'three';
import vibrantUrl from './images/vibrant-gradient.webp'

class SceneElement extends HTMLElement {
    static observedAttributes = ["angle", "length"];
    constructor() {
        super();
    }
    init_common_geometry() {
        this.time = this.angle/(2*Math.PI);
        this.ellipse = new THREE.EllipseCurve(0,0,1,1);
        this.tangent_base = this.ellipse.getPoint(this.time);
        this.tangent = this.ellipse.getTangent(this.time);
        this.tangent_base_3d = new THREE.Vector3(this.tangent_base.x, this.tangent_base.y, 0);
        this.tangent_3d = new THREE.Vector3(this.tangent.x, this.tangent.y, 0);
        this.normal = new THREE.Vector3(0, 0, this.length);

        const ellipse_points = this.ellipse.getPoints(64);
        const ellipse_geometry = new THREE.BufferGeometry().setFromPoints(ellipse_points);
        const ellipse_material = new THREE.LineBasicMaterial({color: 0xff0000});
        this.ellipse_line = new THREE.Line(ellipse_geometry, ellipse_material);


        const texture = new THREE.TextureLoader().load(vibrantUrl, (d)=>{this.render()});
        const plane_material = new THREE.MeshBasicMaterial({map:texture});
        const plane_geom = new THREE.PlaneGeometry(1, 1);
        this.plane = new THREE.Mesh(plane_geom, plane_material);
    }
    init_tangent_scene() {
        const scene = new THREE.Scene();
        const tangent_arrow = new THREE.ArrowHelper(this.tangent_3d.multiplyScalar(Math.sign(this.length)), this.tangent_base_3d);
        tangent_arrow.setLength(Math.abs(this.length));

        const ellipse_line = this.ellipse_line.clone();
        ellipse_line.add(tangent_arrow);
        scene.add(ellipse_line);

        scene.add(this.plane.clone());

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        const renderer_element = this.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 500);
        camera.position.set(0,0,6);
        camera.lookAt(0,0,0);

        this.tangent_scene = {scene, renderer, renderer_element, ellipse_line, tangent_arrow, camera}
        this.scenes.push(this.tangent_scene);
    }
    init_normal_scene() {
        const scene = new THREE.Scene();
        const ellipse_line = this.ellipse_line.clone();
        const normal_arrow = new THREE.ArrowHelper(this.normal.normalize(), this.tangent_base_3d, Math.abs(this.length), 0x00ff00);

        ellipse_line.add(normal_arrow);
        scene.add(ellipse_line);

        scene.add(this.plane.clone());

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        const renderer_element = this.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 500);
        camera.position.set(0,-7,3);
        camera.up.set(0,0,1);
        camera.lookAt(0,0,0);

        this.normal_scene = {scene, renderer, renderer_element, ellipse_line, normal_arrow, camera};
        this.scenes.push(this.normal_scene);
    }
    update_geometry() {
        this.time = this.angle/(2*Math.PI);
        this.tangent_base = this.ellipse.getPoint(this.time);
        this.tangent = this.ellipse.getTangent(this.time);
        this.tangent_base_3d.set(this.tangent_base.x, this.tangent_base.y, 0);
        this.tangent_3d.set(this.tangent.x, this.tangent.y, 0);
        this.normal.setZ(this.length);
    }
    update_tangent_scene() {
        this.tangent_scene.tangent_arrow.position.set(this.tangent_base_3d.x, this.tangent_base_3d.y, 0);
        this.tangent_scene.tangent_arrow.setDirection(this.tangent_3d.multiplyScalar(Math.sign(this.length)));
        this.tangent_scene.tangent_arrow.setLength(Math.abs(this.length));
    }
    update_normal_scene() {
        this.normal_scene.normal_arrow.position.set(this.tangent_base_3d.x, this.tangent_base_3d.y, 0);
        this.normal_scene.normal_arrow.setDirection(this.normal.normalize());
        this.normal_scene.normal_arrow.setLength(Math.abs(this.length));
    }
    connectedCallback() {
        this.scenes = [];
        this.init_common_geometry();
        this.init_tangent_scene();
        this.init_normal_scene();
        this.initialized = true;
        this.render();
    }
    render_scene(scene_package) {
        scene_package.renderer.render(scene_package.scene, scene_package.camera);
    }
    render() {
        for (const scene of this.scenes) {
            this.render_scene(scene);
        }
    }
    update_all() {
        this.update_geometry();
        this.update_tangent_scene();
        this.update_normal_scene();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "angle") {
            this.angle = Number(newValue);
        }
        if (name == "length") {
            this.length = Number(newValue);
        }
        if (this.initialized) {
            this.update_all();
            this.render();
        }
    }
}
customElements.define("cube-scene", SceneElement);

class GlueScene extends HTMLElement {

}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 500 );
camera.position.set( 0, 0, 5 );
camera.lookAt(0,0,0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth/2, window.innerHeight/2);
document.body.appendChild( renderer.domElement );


const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const curve = new THREE.EllipseCurve(
    0, 0, 1, 1
);
const points = curve.getPoints(50);
const circle_geometry = new THREE.BufferGeometry().setFromPoints(points);
const circle_material = new THREE.LineBasicMaterial({color: 0xff0000});
const ellipse = new THREE.Line(circle_geometry, circle_material);
scene.add(ellipse);

let t = 0;

function animate() {
    t += 0.002;
    t = t % 1;
    let tangent_base_2d = curve.getPoint(t);
    let tangent_base = new THREE.Vector3(tangent_base_2d.x, tangent_base_2d.y, 0.0);
    let tangent_2d = curve.getTangent(t);
    let tangent = new THREE.Vector3(tangent_2d.x, tangent_2d.y, 0);
    let arrow_helper = new THREE.ArrowHelper(tangent, tangent_base, 1, 0x00ff00);
    scene.add(arrow_helper);
    renderer.render(scene, camera);
    scene.remove(arrow_helper);
}


// camera.position.z = 5;

// function animate() {
//     cube.rotation.x += 0.01;
//     cube.rotation.y += 0.01;
// 	renderer.render( scene, camera );
// }
renderer.setAnimationLoop( animate );
renderer.render(scene, camera);
