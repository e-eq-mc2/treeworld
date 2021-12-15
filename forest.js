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
    //const fname = `img/${idx}.png`
    const fname = `img/${1}.png`
    console.log(fname)
    const material = this.plateMaterial(fname)

    this.mesh = new THREE.Mesh(geometry, material)

    const x = Common.randomReal(-30, 30)
    const y = Common.randomReal(0, 0)
    const z = Common.randomReal(-30, 30)
    this.mesh.position.x = x
    this.mesh.position.y = y
    this.mesh.position.z = z

    this.initPos = this.mesh.geometry.getAttribute("position").clone().array

    this.time = 0
    this.speedSec = 3.5
    this.doPaging = false
    this.direction = +1

    //this.ease = new CubicBezier(0.0 , 0.0, 1.0 , 1.0)
    //this.ease = new CubicBezier(0.42, 0.0, 1.0 , 1.0)
    //this.ease = new CubicBezier(0.0 , 0.0, 0.58, 1.0)
    this.ease = new CubicBezier(0.42, 0.0, 0.58, 1.0) // ease-in-out 

    this.bendingKeyframes = new Map([[0,  0], [0.5, 15], [1,    0]])
    this.pagingKeyframes  = new Map([[0, -7],            [1, -173]])

    this.updatePositions()
  }

  update(dt) {
    return

    if ( ! this.doPaging ) return
    this.time += dt * this.direction

    if (this.time == 0 ) console.log(this.time, dt, this.direction)

    if ( this.time < 0             ) {
      this.time = 0
      this.doPaging = false
    }
    if ( this.time > this.speedSec ) {
      this.time = this.speedSec
      this.doPaging = false
    }

    this.updatePositions()
  }

  updatePositions() {
    const geometry  = this.mesh.geometry
		const posAttr   = geometry.getAttribute("position")
    const positions = posAttr.array

    const w     = geometry.parameters.width 
    const h     = geometry.parameters.height
    const wsegs = geometry.parameters.widthSegments
    const hsegs = geometry.parameters.heightSegments

    const wvers = wsegs + 1
    const hvers = hsegs + 1
    const axis = new THREE.Vector3(0, 1, 0)
    for (let j = 0; j < hvers; j++) {
      const i0 = 3*( j * wvers + 0 )
      const i1 = 3*( j * wvers + 1 )

      const x0 = this.initPos[i0 + 0]
      const y0 = this.initPos[i0 + 1]
      const z0 = this.initPos[i0 + 2]
      let   x1 = this.initPos[i1 + 0]
      let   y1 = this.initPos[i1 + 1]
      let   z1 = this.initPos[i1 + 2]
      let   v = new THREE.Vector3(x1-x0, y1-y0, z1-z0)

      for (let i = 0; i < wsegs; i++) {
        const i0 = 3*( j * wvers + i  )
        const i1 = 3*( j * wvers + i+1)

        const x0 = positions[i0 + 0]
        const y0 = positions[i0 + 1]
        const z0 = positions[i0 + 2]
        const p0 = new THREE.Vector3(x0, y0, z0)

        const rateX = i / (wsegs - 1.0)
        const angle = this.angle( rateX )
        v.applyAxisAngle(axis,  angle * TO_RADIANS)
        v.add(p0)

        positions[i1 + 0] = v.x
        positions[i1 + 1] = v.y
        positions[i1 + 2] = v.z

        x1 = positions[i1 + 0]
        y1 = positions[i1 + 1]
        z1 = positions[i1 + 2]
        v = new THREE.Vector3(x1-x0, y1-y0, z1-z0)
      }
    }
    posAttr.needsUpdate = true
    geometry.computeVertexNormals()
  }

  angle(rate) {
    const timeRate = this.time / this.speedSec
    const t = this.ease(timeRate) 
    const pa = this.getAngle(t, this.pagingKeyframes)
    const ba = this.getAngle(t, this.bendingKeyframes)

    const ang = ( rate == 0  ) ? pa : ba
    return ang
  }

  getAngle(t, keyframes) {
    let t0 = 0
    let a0 = 0
    let t1 = 0
    let a1 = 0
    for (const [k, v] of keyframes) {
      if ( k <= t ) {
        t0 = k
        a0 = v
      } else {
        // k > t
        t1 = k
        a1 = v
        break
      }
    }

    const dt = t1 - t0
    const da = a1 - a0

    const a = ((t-t0) / dt) * da + a0
    return a
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

  update(dt) {
    this.eachTree((t)=>{
      t.update(dt)
    })
  }
}
