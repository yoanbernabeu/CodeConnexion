import * as THREE from 'three';
    import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
    import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
    import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

    // Create noise effect for intro using Three.js
    const introCanvas = document.getElementById('noise-canvas');
    const introRenderer = new THREE.WebGLRenderer({ canvas: introCanvas, alpha: true });
    introRenderer.setSize(window.innerWidth, window.innerHeight);

    const introScene = new THREE.Scene();
    const introCamera = new THREE.OrthographicCamera(
      window.innerWidth / -2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      window.innerHeight / -2,
      1,
      1000
    );
    introCamera.position.z = 1;

    const introGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
    const introMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        void main() {
          vec2 uv = gl_FragCoord.xy / vec2(${window.innerWidth.toFixed(1)}, ${window.innerHeight.toFixed(1)});
          float noise = fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453);
          gl_FragColor = vec4(vec3(noise), 1.0);
        }
      `,
      transparent: true
    });

    const introPlane = new THREE.Mesh(introGeometry, introMaterial);
    introScene.add(introPlane);

    function animateIntro() {
      requestAnimationFrame(animateIntro);
      introMaterial.uniforms.time.value += 0.05;
      introRenderer.render(introScene, introCamera);
    }

    animateIntro();

    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      introRenderer.setSize(width, height);
      introCamera.left = width / -2;
      introCamera.right = width / 2;
      introCamera.top = height / 2;
      introCamera.bottom = height / -2;
      introCamera.updateProjectionMatrix();
    });

    // Main scene setup
    const mainScene = new THREE.Scene();
    const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const mainRenderer = new THREE.WebGLRenderer();
    mainRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-container').appendChild(mainRenderer.domElement);

    // Load star texture
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load('https://threejs.org/examples/textures/sprites/spark1.png');

    // Create starfield with billboards
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      size: 5,
      map: starTexture,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    mainScene.add(stars);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    mainScene.add(ambientLight);

    mainCamera.position.z = 100;

    // Set up post-processing for glitch effect
    const composer = new EffectComposer(mainRenderer);
    const renderPass = new RenderPass(mainScene, mainCamera);
    composer.addPass(renderPass);

    const glitchPass = new GlitchPass();
    glitchPass.goWild = false; // Disable wild mode for less intense glitches
    composer.addPass(glitchPass);

    let glitchCounter = 0;
    let glitchDuration = 0;

    function animateMain() {
      requestAnimationFrame(animateMain);

      // Move stars
      stars.rotation.x += 0.0005;
      stars.rotation.y += 0.0005;

      // Create light speed effect
      starGeometry.attributes.position.array.forEach((value, index) => {
        if (index % 3 === 2) {
          starGeometry.attributes.position.array[index] += 0.1;
          if (starGeometry.attributes.position.array[index] > 1000) {
            starGeometry.attributes.position.array[index] = -1000;
          }
        }
      });
      starGeometry.attributes.position.needsUpdate = true;

      // Render with glitch effect
      if (glitchCounter % 200 === 0) { // Trigger glitch less frequently
        glitchPass.enabled = true;
        glitchDuration = 30; // Set glitch duration
      }

      if (glitchDuration > 0) {
        glitchDuration--;
      } else {
        glitchPass.enabled = false;
      }

      glitchCounter++;

      composer.render();
    }

    animateMain();

    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      mainRenderer.setSize(width, height);
      mainCamera.aspect = width / height;
      mainCamera.updateProjectionMatrix();
    });
