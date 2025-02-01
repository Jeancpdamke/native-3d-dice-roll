import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, TextureLoader, THREE } from 'expo-three';
import React from 'react';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import CANNON from 'cannon'

/**
 * Constants
 */
const CAMERA_Y_DISTANCE = 0
const CAMERA_Z_DISTANCE = 20

export default function HomeScreen() {
  const [text, setText] = React.useState('');
  const timeoutRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.Camera>();


  useEffect(() => {
    // Clear the animation loop when the component unmounts
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    setText('')
    // removes the warning EXGL: gl.pixelStorei() doesn't support this parameter yet!
    const pixelStorei = gl.pixelStorei.bind(gl);
    gl.pixelStorei = function (...args) {
      const [parameter] = args;
      switch (parameter) {
        case gl.UNPACK_FLIP_Y_WEBGL:
          return pixelStorei(...args);
      }
    };

    /**
     * Textures
     */
    const woodTexture = new TextureLoader().load(require('@/assets/textures/wood.jpg'));
    const diceFaceTextures = [
      new TextureLoader().load(require('@/assets/textures/dice/1.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/2.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/3.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/4.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/5.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/6.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/7.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/8.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/9.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/10.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/11.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/12.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/13.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/14.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/15.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/16.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/17.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/18.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/19.jpg')),
      new TextureLoader().load(require('@/assets/textures/dice/20.jpg')),
    ]

    /**
     * Renderer
     */
    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0xe0e0e0);
    const renderer = new Renderer({ gl });

    /**
     * Camera
     */
    const cam = new THREE.PerspectiveCamera(
      80,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    cam.position.set(0, CAMERA_Y_DISTANCE, CAMERA_Z_DISTANCE)
    cam.up.set(0, 0, 1)
    cameraRef.current = cam;

    /**
     * Dice
     */
    /**
     * Meshes
     */

    // Dice
    const diceGeometry = new THREE.IcosahedronGeometry(1)
    const diceMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    const dice = new THREE.Mesh(diceGeometry, diceMaterial)
    dice.castShadow = true
    dice.position.set(0, 0, 10)
    dice.up.set(0, 0, 1)
    sceneRef.current.add(dice)

    // Dice Faces
    const dicePositions = dice.geometry.attributes.position.array
    const dicePoints = []
    const uvs = new Float32Array([
      1.0, 0.0,
      0.5, 1.0,
      0.0, 0.0,
    ]);

    const facesGroup = new THREE.Group()

    for (let i = 0; i < dicePositions.length; i += 3) {
      dicePoints.push(
        new THREE.Vector3(dicePositions[i], dicePositions[i + 1], dicePositions[i + 2])
      )
    }
    for (let i = 0; i < dicePositions.length / 3; i += 3) {
      const faceNumber = i / 3 + 1
      const faceName = faceNumber.toString()

      const material = new THREE.MeshStandardMaterial({
        map: diceFaceTextures[faceNumber - 1],
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.5,
      })
      const geometry = new THREE.BufferGeometry()
      geometry.setFromPoints([dicePoints[i], dicePoints[i + 1], dicePoints[i + 2]])
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

      const faceMesh = new THREE.Mesh(geometry, material)
      faceMesh.name = faceName
      facesGroup.add(faceMesh)
    }
    dice.add(facesGroup)



    // Table
    const tableGeometry = new THREE.PlaneGeometry(50, 50)
    const tableMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      metalness: 0.2,
      roughness: 0.5,
    })
    const table = new THREE.Mesh(tableGeometry, tableMaterial)
    table.receiveShadow = true
    sceneRef.current.add(table)

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
    sceneRef.current.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(1024, 1024)
    directionalLight.shadow.camera.far = 25
    directionalLight.shadow.camera.left = -25
    directionalLight.shadow.camera.top = 25
    directionalLight.shadow.camera.right = 25
    directionalLight.shadow.camera.bottom = -25
    directionalLight.position.set(0, 0, 20)
    sceneRef.current.add(directionalLight)

    /**
     * Physics (CANNON)
     */

    // CANNON World
    const world = new CANNON.World()
    world.gravity.set(0, 0, -9.81)

    // CANNON Materials
    const defaultCannonMaterial = new CANNON.Material('default')
    const defaultCannonContactMaterial = new CANNON.ContactMaterial(
      defaultCannonMaterial,
      defaultCannonMaterial,
      {
        friction: 0.2,
        restitution: 0.6
      }
    )
    world.addContactMaterial(defaultCannonContactMaterial)
    world.defaultContactMaterial = defaultCannonContactMaterial

    // CANNON Icosahedron
    const icosahedronPoints = []
    for (let i = 0; i < dicePositions.length; i += 3) {
      icosahedronPoints.push(
        new CANNON.Vec3(dicePositions[i], dicePositions[i + 1], dicePositions[i + 2])
      )
    }
    const icosahedronFaces = []
    for (let i = 0; i < dicePositions.length / 3; i += 3) {
      icosahedronFaces.push([i, i + 1, i + 2])
    }
    const icosahedronShape = new CANNON.ConvexPolyhedron(
      icosahedronPoints,
      icosahedronFaces
    )
    const icosahedronBody = new CANNON.Body({ mass: 1 })
    icosahedronBody.addShape(icosahedronShape)
    icosahedronBody.position.x = dice.position.x
    icosahedronBody.position.y = dice.position.y
    icosahedronBody.position.z = dice.position.z
    icosahedronBody.applyLocalForce(
      new CANNON.Vec3(Math.random() * 20, Math.random() * 20, 0),
      icosahedronBody.position
    )
    world.addBody(icosahedronBody)

    // Table
    const tableShape = new CANNON.Plane()
    const tableBody = new CANNON.Body({ shape: tableShape })
    world.addBody(tableBody)

    /**
     * Animate
     */
    const clock = new THREE.Clock()
    let oldElapsedTime = 0
    let previousRotation = new CANNON.Quaternion
    let previousPositionCount = 0

    const areRotationsAlmostEqual = (vector1: CANNON.Quaternion, vector2: CANNON.Quaternion, precision = 0.001): boolean => {
      const isXInsidePrecision = vector1.x - vector2.x < precision
      const isYInsidePrecision = vector1.y - vector2.y < precision
      const isZInsidePrecision = vector1.z - vector2.z < precision
      const isWInsidePrecision = vector1.w - vector2.w < precision
      return isXInsidePrecision && isYInsidePrecision && isZInsidePrecision && isWInsidePrecision
    }

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - oldElapsedTime
      oldElapsedTime = elapsedTime

      // Update physics world
      world.step(1 / 60, deltaTime, 3)
      dice.position.copy(
        new THREE.Vector3(
          icosahedronBody.position.x,
          icosahedronBody.position.y,
          icosahedronBody.position.z
        )
      )
      dice.quaternion.copy(
        new THREE.Quaternion(
          icosahedronBody.quaternion.x,
          icosahedronBody.quaternion.y,
          icosahedronBody.quaternion.z,
          icosahedronBody.quaternion.w,
        )
      )

      // Update camera to follow the dice
      cameraRef.current.position.set(
        icosahedronBody.position.x,
        icosahedronBody.position.y - CAMERA_Y_DISTANCE,
        CAMERA_Z_DISTANCE
      )
      cameraRef.current.lookAt(dice.position)

      // Check if dice stopped
      if (areRotationsAlmostEqual(previousRotation, icosahedronBody.quaternion)) {
        previousPositionCount++
      } else {
        previousRotation.copy(icosahedronBody.quaternion)
        previousPositionCount = 0
      }
      const hasDiceStopped = previousPositionCount > 100

      if (hasDiceStopped) {
        const rayCasterOrigin = new THREE.Vector3(dice.position.x, dice.position.y, 15)
        const rayCasterDirection = new THREE.Vector3(0, 0, -1)
        const raycaster = new THREE.Raycaster(rayCasterOrigin, rayCasterDirection)

        const intersects = raycaster.intersectObjects(facesGroup.children)
        setText(`Result: ${intersects[0].object.name}`)
      }

      renderer.render(sceneRef.current, cameraRef.current);
      timeoutRef.current = requestAnimationFrame(animate);

      gl.endFrameEXP();
    }

    animate();
  }

  return (
    <View style={{ flex: 1 }}>
      {!!text ? <Text style={{ fontSize: 30, fontWeight: 'bold', margin: 50, position: 'absolute', zIndex: 1 }}>{text}</Text> : null}
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}


