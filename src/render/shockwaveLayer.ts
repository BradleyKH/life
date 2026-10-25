import { AdditiveBlending, Group, IcosahedronGeometry, Mesh, ShaderMaterial } from 'three';

const DURATION = 2.4;

const vertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
uniform float uFade;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  float rim = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
  vec3 color = mix(vec3(0.9, 0.1, 0.35), vec3(0.45, 0.2, 1.0), rim);
  gl_FragColor = vec4(color * rim * uFade * 1.6, 1.0);
}
`;

interface Wave {
  mesh: Mesh;
  material: ShaderMaterial;
  age: number;
  radius: number;
}

/** Expanding rim-lit shells that mark where a blight swept through. */
export class ShockwaveLayer {
  readonly group = new Group();
  private readonly geometry = new IcosahedronGeometry(1, 5);
  private readonly waves: Wave[] = [];

  spawn(x: number, y: number, z: number, radius: number): void {
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uFade: { value: 1 } },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new Mesh(this.geometry, material);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.waves.push({ mesh, material, age: 0, radius });
  }

  clear(): void {
    for (const w of this.waves) this.dispose(w);
    this.waves.length = 0;
  }

  update(dt: number): void {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.age += dt;
      const t = w.age / DURATION;
      if (t >= 1) {
        this.dispose(w);
        this.waves.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - t, 3);
      w.mesh.scale.setScalar(0.5 + eased * w.radius * 1.25);
      w.material.uniforms.uFade.value = Math.sin(Math.min(1, t * 4) * Math.PI * 0.5) * (1 - t);
    }
  }

  private dispose(w: Wave): void {
    this.group.remove(w.mesh);
    w.material.dispose();
  }
}
