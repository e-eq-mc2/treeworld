const THREE = require('three');
//import { SceneUtils } from 'three/examples/jsm/utils/SceneUtils.js'
import { createMultiMaterialObject } from 'three/examples/jsm/utils/SceneUtils.js'
import CubicBezier from 'cubic-bezier-easing'
const Common   = require("./lib/common.js")
const Colormap = require("./lib/colormap.js")

// Particle3D class

const TO_RADIANS = Math.PI/180.0


export class Tree {
  constructor(idx, width = 5, height = 5) {
    const geometry = this.plateGeometry(width, height, 3, 3)

    this.idx = idx
    const fname = `img/tree/${idx % 17 + 1}.png`
    console.log(fname)
    const material = this.plateMaterial(fname)

    this.mesh = new THREE.Mesh(geometry, material)

    const range = 150
    const x = Common.randomReal(-range, range)
    const y = height
    const z = Common.randomReal(-range, range)
    this.mesh.position.x = x
    this.mesh.position.y = y
    this.mesh.position.z = z
    
    const r = Math.sqrt(x*x + y*y) /  Math.sqrt(range*range + range*range)
    const sbase = Math.max(r, 0.3) * 5 
    const sizeList = [
      0.6, 0.6, 0.6,
      1.0, 1.0, 1.0, 1.0, 
      2.0,
    ]
    const srate = Common.pickup(sizeList)
    const scale = sbase * srate

    this.mesh.scale.set(scale, scale, scale)

  }

  update(dt, camera) {
    //const r = Common.randomReal(0.01, 0.2)
    const r = 0

    //this.mesh.rotation.y += dt * r
    this.mesh.rotation.setFromRotationMatrix(camera.matrix);
  }

  plateGeometry(w, h, wsegs, hsegs) {
    const geometry = new THREE.PlaneGeometry(w, h, wsegs, hsegs)
    return geometry
  }


  plateMaterial(fileName) {
    const tex = new THREE.TextureLoader().load( fileName )
    const mat = new THREE.MeshPhongMaterial({
      map: tex, 
      side: THREE.DoubleSide, 
      //transparent: true, 
      alphaTest: 0.5
    })
    return mat
  }

}

export class Forest {
  constructor(num) {
    this.trees = []
    for (let i = 0; i < num; i++) {
      const tree = new Tree(i)
      this.trees.push(tree) 
    }
  }

  eachTree(callback) {
    for (const t of this.trees) {
      callback(t)
    }
  }

  update(dt, camera) {
    this.eachTree((t)=>{
      t.update(dt, camera)
    })
  }
}
