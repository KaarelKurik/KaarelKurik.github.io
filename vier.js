import * as THREE from 'three';
import vibrantUrl from './images/vibrant-gradient.webp'
import {regconst, regeval} from './absurdity'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import handUrl from './models/checkered_hand.glb?url'

function wrap_constructor(c) {
    return (...a) => {return new c(...a)} 
}

function invert_vector(radius, v) {
    let l = (radius*radius)/v.lengthSq();
    return v.multiplyScalar(l);
}

function invert_mesh(radius, ref, target) {
    let tpos = target.geometry.attributes.position;
    let rpos = ref.geometry.attributes.position;
    let global_from_local = ref.matrixWorld;
    let cvec = new THREE.Vector3();
    for (let i = 0; i < tpos.count; ++i) {
        cvec.fromBufferAttribute(rpos, i);
        cvec.applyMatrix4(global_from_local);
        const global_inverse = invert_vector(radius, cvec);
        tpos.setXYZ(i, ...global_inverse)
    }
    tpos.needsUpdate = true;
}

class GlueElement extends HTMLElement {
    static observedAttributes = ["distance"]
    constructor() {
        super();
    }
    connectedCallback() {
        const loader = new GLTFLoader();
        // handle this better
        let selfref = this;
        
        this.distanceNum = new regeval(wrap_constructor(Number), this.distance);
        const displacement = new regeval(wrap_constructor(THREE.Vector3), this.distanceNum)

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        this.renderer_element = this.appendChild(renderer.domElement);

        const scene_2 = new THREE.Scene();
        const renderer_2 = new THREE.WebGLRenderer();
        renderer_2.setSize(window.innerWidth/2, window.innerHeight/2);
        this.renderer_element_2 = this.appendChild(renderer_2.domElement);

        const hemilight = new THREE.HemisphereLight();
        scene.add(hemilight);

        const hemilight2 = new THREE.HemisphereLight();
        scene_2.add(hemilight2);

        const mat =  new THREE.MeshStandardMaterial({color: 0xffffff, wireframe: true});

        const inversion_radius = 1;

        const sphere_geom = new THREE.SphereGeometry(inversion_radius);
        const sphere = new THREE.Mesh(sphere_geom, mat)
        scene.add(sphere)

        scene_2.add(sphere.clone())

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 500);
        const controls = new OrbitControls(camera, this.renderer_element);
        const controls2 = new OrbitControls(camera, this.renderer_element_2);
        controls.addEventListener("change", (e) => {
            renderer.render(scene, camera)
            renderer_2.render(scene_2, camera)
        });
        controls2.addEventListener("change", (e) => {
            renderer.render(scene, camera)
            renderer_2.render(scene_2, camera)
        });
        camera.position.set(0,0,4);
        camera.lookAt(0,0,0);


        loader.load(handUrl, (gltf) => {
            selfref.model = gltf.scene.children[0]

            scene.add(selfref.model)
            selfref.model.rotateOnWorldAxis(new THREE.Vector3(0,0,1), -Math.PI/2);


            selfref.model2 = new THREE.Mesh(selfref.model.geometry.clone(), selfref.model.material.clone());
            scene_2.add(selfref.model2)
            console.log(selfref.model)
            invert_mesh(inversion_radius, selfref.model, selfref.model2)
            console.log(selfref.model2)


            selfref.model_displacer = new regeval((displacement)=>{
                selfref.model.position.copy(displacement)
                invert_mesh(inversion_radius, selfref.model, selfref.model2)
            }, displacement)
            renderer.render(scene, camera)
            renderer_2.render(scene_2, camera)
        }, undefined, (err) => {
            console.log("WHOOPS")
            console.log(err)
        })
        console.log("got past")

        this.scene_updater = new regeval((displacement) => {
            renderer.render(scene, camera)
            renderer_2.render(scene_2, camera)
        }, displacement);

        renderer.render(scene, camera)
        renderer_2.render(scene_2, camera)
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!(name in this)) {
            this[name] = new regconst(newValue)
        } else {
            this[name].set_value(newValue)
        }
    }
}
customElements.define('glue-scene', GlueElement);

class AlternateElement extends HTMLElement {
    static observedAttributes = ["radiusx", "radiusy"];
    constructor() {
        super();
    }
    connectedCallback() {
        this.radiusXnum = new regeval(wrap_constructor(Number), this.radiusx)
        this.radiusYnum = new regeval(wrap_constructor(Number), this.radiusy)
        const zeroc = new regconst(0);

        this.ellipse = new regeval(wrap_constructor(THREE.EllipseCurve), zeroc, zeroc, this.radiusXnum, this.radiusYnum);
        const Npoints = new regconst(64);
        const ellipse_points = new regeval((ellipse, n) => {
            return ellipse.getPoints(n)
        }, this.ellipse, Npoints);
        const ellipse_backing_buffer = new THREE.BufferGeometry();
        const ellipse_geometry = new regeval((ep) => {
            ellipse_backing_buffer.setFromPoints(ep);
            return ellipse_backing_buffer;
        }, ellipse_points);
        const ellipse_material = new regconst(new THREE.LineBasicMaterial({color: 0xffffff}));
        this.ellipse_line = new regeval(wrap_constructor(THREE.Line), ellipse_geometry, ellipse_material);

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        this.renderer_element = this.appendChild(this.renderer.domElement);


        const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 500);
        const controls = new OrbitControls(camera, this.renderer_element);
        controls.addEventListener("change", (e) => {this.renderer.render(this.scene, camera)});
        camera.position.set(0,0,5);
        camera.lookAt(0,0,0);

        this.scene.add(this.ellipse_line.value);

        this.scene_updater = new regeval((ellipse_line)=>{
            this.renderer.render(this.scene, camera)
        }, this.ellipse_line)
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!(name in this)) {
            this[name] = new regconst(newValue)
        } else {
            this[name].set_value(newValue)
        }
    }
}
customElements.define('ellipse-scene', AlternateElement);

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