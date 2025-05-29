import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cn } from '@/lib/utils';

interface ThreeDHeadAvatarProps {
  text: string;
  isActive: boolean;
  className?: string;
  modelUrl?: string;
}

export function ThreeDHeadAvatar({ 
  text, 
  isActive, 
  className, 
  modelUrl = "/models/head.glb"  // Changed to use local path
}: ThreeDHeadAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [blinking, setBlinking] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);
  
  const requestRef = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouthRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouthPositionRef = useRef(0);
  
  // Store morph target indices for face animations
  const morphTargetsRef = useRef<{
    mouthOpen?: number;
    eyesClosed?: number;
  }>({});
  
  // Initialize 3D scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;
    
    // Create camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 1000);
    camera.position.z = 1.0;  // Move camera further back
    camera.position.y = -0.2; // Lower camera position
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(0.5, 1, 1);
    scene.add(directionalLight);

    // Add a fill light from below
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(0, -1, 0.5);
    scene.add(fillLight);
    
    // Add a simple cube as placeholder while loading
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Load the 3D model
    const loader = new GLTFLoader();
    
    console.log("Loading model from:", modelUrl);
    
    loader.load(
      modelUrl,
      (gltf) => {
        console.log("Model loaded successfully", gltf);
        const model = gltf.scene;
        
        // Remove placeholder cube
        scene.remove(cube);
        
        // Add model to scene
        scene.add(model);
        modelRef.current = model;
        
        // Center and position model
        model.position.set(0, -2.2, 0); // Lower the model to show more of the body
        model.scale.set(1.2, 1.2, 1.2); // Scale slightly larger
        
        // Find morph targets for facial animations
        model.traverse((object) => {
          if (object instanceof THREE.Mesh && object.morphTargetDictionary) {
            console.log("Found mesh with morph targets:", object.name);
            console.log("Available morph targets:", Object.keys(object.morphTargetDictionary));
            
            // Common morph target names in ReadyPlayerMe models
            const mouthOpenNames = ["mouthOpen", "viseme_O", "viseme_AA", "jawOpen"];
            const eyeClosedNames = ["eyesClosed", "eyeBlinkLeft", "eyeBlinkRight", "eyeBlink"];
            
            // Find mouth open morph target
            for (const name of mouthOpenNames) {
              if (object.morphTargetDictionary[name] !== undefined) {
                morphTargetsRef.current.mouthOpen = object.morphTargetDictionary[name];
                console.log(`Found mouth morph target: ${name}`);
                break;
              }
            }
            
            // Find eye blink morph target
            for (const name of eyeClosedNames) {
              if (object.morphTargetDictionary[name] !== undefined) {
                morphTargetsRef.current.eyesClosed = object.morphTargetDictionary[name];
                console.log(`Found eye morph target: ${name}`);
                break;
              }
            }
          }
        });
        
        setModelLoaded(true);
      },
      // Progress callback
      (xhr) => {
        const progress = (xhr.loaded / xhr.total) * 100;
        console.log(`${progress}% loaded`);
        setLoadingProgress(progress);
      },
      // Error callback
      (error) => {
        console.error("Error loading model:", error);
        setModelError('Failed to load 3D model');
        
        // Create a simple animated face as fallback
        createFallbackFace(scene);
      }
    );
    
    // Create a fallback face if the model fails to load
    const createFallbackFace = (scene: THREE.Scene) => {
      // Create a head
      const head = new THREE.Group();
      
      // Create a face
      const faceGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const faceMaterial = new THREE.MeshStandardMaterial({ color: 0xF0D6B9 });
      const face = new THREE.Mesh(faceGeometry, faceMaterial);
      head.add(face);
      
      // Create eyes
      const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const eyeLeftWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
      const eyeRightWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
      eyeLeftWhite.position.set(-0.15, 0.1, 0.4);
      eyeRightWhite.position.set(0.15, 0.1, 0.4);
      head.add(eyeLeftWhite);
      head.add(eyeRightWhite);
      
      // Create pupils
      const pupilGeometry = new THREE.SphereGeometry(0.04, 16, 16);
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
      const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      leftPupil.position.set(-0.15, 0.1, 0.45);
      rightPupil.position.set(0.15, 0.1, 0.45);
      head.add(leftPupil);
      head.add(rightPupil);
      
      // Create mouth - make it a more visible component
      const mouthRef = { current: null as THREE.Mesh | null };
      const mouthGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
      const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xCC3D2D });
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.position.set(0, -0.15, 0.45);
      mouth.name = 'fallback-mouth'; // Add name for identification
      head.add(mouth);
      mouthRef.current = mouth;
      
      // Update the main animation loop to include mouth animation
      const originalAnimate = scene.userData.animate;
      scene.userData.animate = () => {
        // Animate the mouth based on openness
        if (mouthRef.current) {
          // Make mouth animation more dramatic and visible
          const openScale = 1 + mouthPositionRef.current * 15; // Increased from 10 to 15
          mouthRef.current.scale.y = openScale;
          // Also adjust position to keep the mouth centered but move more
          mouthRef.current.position.y = -0.15 - (mouthPositionRef.current * 0.3); // Increased from 0.2 to 0.3
        }
        
        // Call the original animation if it exists
        if (originalAnimate) {
          originalAnimate();
        }
      };
      
      scene.add(head);
      modelRef.current = head;
      setModelLoaded(true);
    };
    
    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      // Rotate the placeholder cube while loading
      if (!modelLoaded && cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }
      
      // Apply facial animations if the model is loaded
      if (modelLoaded && modelRef.current) {
        modelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && object.morphTargetInfluences && object.morphTargetDictionary) {
            // Apply eye blinking
            if (morphTargetsRef.current.eyesClosed !== undefined) {
              const eyeMorphIndex = morphTargetsRef.current.eyesClosed;
              if (eyeMorphIndex < object.morphTargetInfluences.length) {
                object.morphTargetInfluences[eyeMorphIndex] = blinking ? 1 : 0;
              }
            }
          }
        });
        
        // Add subtle head movement
        modelRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.05;
      }
      
      // Run any custom animation functions
      if (sceneRef.current.userData.animate) {
        sceneRef.current.userData.animate();
      }
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    // Handle canvas resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // Update camera aspect ratio
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      // Dispose geometries and materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
      
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [modelUrl]);
  
  // Update mouth animation with more natural patterns
  useEffect(() => {
    if (!isActive) {
      // When not speaking, just ensure mouth is closed
      if (mouthRefreshTimerRef.current) {
        clearInterval(mouthRefreshTimerRef.current);
        mouthRefreshTimerRef.current = null;
      }
      updateMouthDirectly(0);
      return;
    }
    
    // More natural mouth movement patterns
    const updateMouth = () => {
      // Use a weighted distribution for more natural speech
      let newPosition = 0;
      
      const randomFactor = Math.random();
      
      if (randomFactor < 0.3) {
        // 30% chance of being nearly closed (0.0-0.1)
        newPosition = Math.random() * 0.1;
      } else if (randomFactor < 0.6) {
        // 30% chance of being slightly open (0.1-0.3)
        newPosition = 0.1 + Math.random() * 0.2;
      } else if (randomFactor < 0.9) {
        // 30% chance of being moderately open (0.3-0.6)
        newPosition = 0.3 + Math.random() * 0.3;
      } else {
        // 10% chance of being wide open (0.6-0.9)
        newPosition = 0.6 + Math.random() * 0.3;
      }
      
      mouthPositionRef.current = newPosition;
      updateMouthDirectly(newPosition);
    };
    
    // Update every 200ms for more responsive animation
    mouthRefreshTimerRef.current = setInterval(updateMouth, 200);
    
    return () => {
      if (mouthRefreshTimerRef.current) {
        clearInterval(mouthRefreshTimerRef.current);
        mouthRefreshTimerRef.current = null;
      }
    };
  }, [isActive]);
  
  // Function to update mouth position directly on the mesh without state updates
  const updateMouthDirectly = (openAmount: number) => {
    if (!modelRef.current) return;
    
    modelRef.current.traverse((object) => {
      // For model with morph targets
      if (object instanceof THREE.Mesh && object.morphTargetInfluences && object.morphTargetDictionary) {
        if (morphTargetsRef.current.mouthOpen !== undefined) {
          const mouthMorphIndex = morphTargetsRef.current.mouthOpen;
          if (mouthMorphIndex < object.morphTargetInfluences.length) {
            // Apply directly to the mesh without state updates
            object.morphTargetInfluences[mouthMorphIndex] = openAmount * 2.0;
          }
        }
      }
      
      // For fallback mouth
      if (object.name === 'fallback-mouth' && object instanceof THREE.Mesh) {
        // Update directly without state
        object.scale.y = 1 + openAmount * 15;
        object.position.y = -0.15 - (openAmount * 0.3);
      }
    });
  };
  
  // Handle blinking animation
  useEffect(() => {
    const startBlinking = () => {
      const scheduleBlink = () => {
        const blinkInterval = 2000 + Math.random() * 4000;
        
        blinkTimerRef.current = setTimeout(() => {
          setBlinking(true);
          setTimeout(() => {
            setBlinking(false);
            scheduleBlink();
          }, 150);
        }, blinkInterval);
      };
      
      scheduleBlink();
    };
    
    startBlinking();
    
    return () => {
      if (blinkTimerRef.current) {
        clearTimeout(blinkTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={cn("w-full h-full rounded-xl overflow-hidden bg-[#111] relative", className)}
    >
      {!modelLoaded && !modelError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-white transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="text-xs">Loading 3D model...</div>
        </div>
      )}
      
      {modelError && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xs z-10 p-2">
          {modelError}
        </div>
      )}
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
      />
    </div>
  );
} 