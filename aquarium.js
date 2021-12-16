const THREE = require('three');
import {Flow} from 'three/examples/jsm/modifiers/CurveModifier.js'
const Common = require("./lib/common.js")

export class Aquarium {
  constructor(numFish) {
    this.flows  = []
    this.speeds = []
    this.speedScale = 1.0
    this.cache = new Cache()

    const baseSpeed   = 0.0003
    const speedScales = [0.8, 0.8, 0.8, 0.8, 1.0, 1.0, 1.5]
    for (let i=0; i < numFish; ++i) {
      const flow = this.layAnEgg(i)
      this.flows.push(flow)

      const speed = baseSpeed * Common.pickup(speedScales) 
      this.speeds.push(speed)
    }
  }

  update() {
    for (let i=0; i < this.flows.length; ++i) {
      const flow  = this.flows[i]
      const speed = this.speeds[i] * this.speedScale
      flow.moveAlongCurve( speed )
    }
  }

  increaseSpeed(ds = 0.1) {
    this.speedScale += ds
    return this.speedScale
  }

  decreaseSpeed(ds = 0.1) {
    this.speedScale -= ds
    return this.speedScale
  }

  eachFish(callback) {
    for (const flow of this.flows) {
      callback(flow.object3D)
    }
  }

  layAnEgg(idx) {
    const initialPoints = this.curvePoints(100, idx) 

    const curve = new CatmullRomCurve3XZ( initialPoints );
    curve.curveType = 'centripetal';
    curve.closed = true;

    const i        = Common.random(1, 48)
    //const fileName = `img/fish_${i}.png`
    //const fileName = `img/${i}.png`
    const fileName = `img/${1}.png`
    const material = this.plateMaterial(fileName)

    const sizeList = [
      //0.4, 0.4,
      //0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6,
      //0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6,
      //1.0, 
      3.0,
      //5.0,
    ]
    const s = Common.pickup(sizeList)
    const w = s
    const h = s
    const wsegs = s < 1.0 ? 4 : 8
    const hsegs = s < 1.0 ? 2 : 4
    const key  =`geometry_${w}_${h}_${wsegs}_${hsegs}` 
    const cached = this.cache.get( key )
    //const geometry = this.plateGeometry(w, h, wsegs, hsegs)
    const geometry = new THREE.PlaneGeometry(w, h, wsegs, hsegs)
    geometry.rotateZ( Math.PI )
    if ( ! cached ) this.cache.set(key, geometry)

    const objectToCurve = new THREE.Mesh(geometry, material)
    objectToCurve.frustumCulled = false
    objectToCurve.matrixAutoUpdate = false

    const flow = new Flow( objectToCurve )
    flow.updateCurve(0, curve)

    return flow
  }

  plateMaterial(fileName) {
    const texture  = new THREE.TextureLoader().load( fileName )
    texture.anisotropy = 1
    const material = new THREE.MeshPhongMaterial({
    //const material = new THREE.MeshBasicMaterial({
      map: texture, 
      //color: 0xffffff, 
      side: THREE.DoubleSide, 
      //transparent: true, 
      alphaTest: 0.5
    });

    return material
  }

  plateGeometry(width, height, widthSegments, heightSegments) {
    const vertices = this.plateVertices(width, height, widthSegments, heightSegments)

    const geometry = new THREE.BufferGeometry();
    const positions = []
    const normals   = []
    const uvs       = []
    for (const vertex of vertices) {
      positions.push( ...vertex.position )
      normals.push  ( ...vertex.normal   )
      uvs.push      ( ...vertex.uv       )
    }

    const positionNumComponents = 3
    const normalNumComponents   = 3
    const uvNumComponents       = 2
    geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents))
    geometry.setAttribute( 'normal'  , new THREE.BufferAttribute(new Float32Array(normals  ), normalNumComponents  ))
    geometry.setAttribute( 'uv'      , new THREE.BufferAttribute(new Float32Array(uvs      ), uvNumComponents      ))

    geometry.rotateZ( Math.PI )
    return geometry
  }

  plateVertices(width, height, widthSegments, heightSegments) {
    // p2 *-----* p3  
    //    | \ 1 |
    //    | 0 \ |
    // p0 *-----* p1
    //
    // z
    // ^  / y
    // |/
    // +---> x
    //
    // u
    // ^
    // |
    // +---> v
    //
    // 0: p0 p1 p2
    // 1: p2 p1 p3

    const du = 1.0 / widthSegments
    const dv = 1.0 / heightSegments
    const offX = - width  / 2.0
    const offY = - height / 2.0

    const normal = [0, 0, 1] 
    const offset = 0

    const vertices = []
    for (let j = 0; j < heightSegments; ++j ) {
      const v0 = j * dv
      const v1 = v0 + dv

      const y0 = offY + v0 * height
      const y1 = offY + v1 * height

      for (let i = 0; i < widthSegments; ++i ) {
        const u0 = i * du
        const u1 = u0 + du

        const x0 = offX + u0 * width
        const x1 = offX + u1 * width

        const uv0 = [u0, v0]
        const uv1 = [u1, v0]
        const uv2 = [u0, v1]
        const uv3 = [u1, v1]

        const pos0 = [x0, y0, offset]
        const pos1 = [x1, y0, offset]
        const pos2 = [x0, y1, offset]
        const pos3 = [x1, y1, offset]

        vertices.push({position: pos0, normal: normal, uv: uv0}) 
        vertices.push({position: pos1, normal: normal, uv: uv1}) 
        vertices.push({position: pos2, normal: normal, uv: uv2}) 

        vertices.push({position: pos2, normal: normal, uv: uv2}) 
        vertices.push({position: pos1, normal: normal, uv: uv1}) 
        vertices.push({position: pos3, normal: normal, uv: uv3}) 
      }
    }

    return vertices
  }

  curvePoints(num, idx = 0) {
    const initialPoints = Array(num)

    const da     = 2 * Math.PI / initialPoints.length
    const radius = Common.randomReal(20, 25)
    const h = 20
    const offY   = Common.randomReal(h * 0.5, h)

    const sa  = Common.random(20, 25)
    const srx = 0.3
    const srz = 0.3

    const say0 = 2
    const sry0 = 0.5

    let a = da * Common.random(0, initialPoints.length -1)
    for (let i=0; i < initialPoints.length; ++i) {
      let x = Math.cos(a) * radius * 2
      let z = Math.sin(a) * radius
      let y = offY

      x += Math.cos(a * sa) * srx
      z += Math.sin(a * sa) * srz
      y += Math.sin(a * say0) * sry0

      initialPoints[i] = new THREE.Vector3(x, y, z)
      a += da
    }

    return initialPoints
  }

}

class Cache {
  constructor() {
    this.data = {}
  }

  get(key) {
    return this.data[key]
  }

  set(key, val) {
    this.data[key] = val
  }

}

export class CatmullRomCurve3XZ extends THREE.CatmullRomCurve3 {
  getTangent( t, optionalTarget ) {
    let tan = super.getTangent(t, optionalTarget)
    tan.y = 0.0

    return tan
  }
}


