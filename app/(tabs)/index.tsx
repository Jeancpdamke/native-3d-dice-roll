import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, TextureLoader, THREE } from 'expo-three';
import React from 'react';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

/**
 * Constants
 */
const CAMERA_Y_DISTANCE = 0
const CAMERA_Z_DISTANCE = 20

export default function HomeScreen() {
  const timeoutRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.Camera>();


  useEffect(() => {
    // Clear the animation loop when the component unmounts
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
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
    const blueMistTexture = new TextureLoader().load(require('@/assets/textures/blueMist.jpg'));
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
    const diceMaterial = new THREE.MeshStandardMaterial({
      map: blueMistTexture,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.5,
    })
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
        opacity: 0.6,
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

    const animate = () => {
      timeoutRef.current = requestAnimationFrame(animate);

      dice.rotation.x += 0.01
      renderer.render(sceneRef.current, cameraRef.current);

      gl.endFrameEXP();
    }

    animate();
  }

  return (
    <View style={{ flex: 1 }}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}


