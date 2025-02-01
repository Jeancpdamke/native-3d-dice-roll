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

      renderer.render(sceneRef.current, cameraRef.current);

      gl.endFrameEXP();
    }

    animate();
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ marginTop: 100, marginLeft: 20, fontWeight: 'bold' }}>3D Dice roll</Text>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}


