import { DoubleSide, ShaderMaterial } from "three";
import {
  getFancyShaderSparkleTint,
  isFancyShaderCountryFill,
  resolveGlobeCountryFill,
} from "./visitStorage";

const vert = `
varying vec3 vPosition;
void main() {
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = `
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uSparkleTint;
varying vec3 vPosition;

void main() {
  vec3 n = normalize(vPosition);
  float wave = 0.5 + 0.5 * sin(n.x * 9.0 + uTime * 1.4) * cos(n.y * 8.0 - uTime * 1.1);
  vec3 base = mix(uBase * 0.52, uBase * 1.28, wave);

  vec2 g = n.xy * 15.0;
  float s1 = pow(max(0.0, sin(g.x + g.y * 0.7 + uTime * 3.2)), 22.0);
  float s2 = pow(max(0.0, sin(n.z * 19.0 + n.x * 12.0 - uTime * 2.8)), 24.0);
  float s3 = pow(max(0.0, sin(n.y * 17.0 - n.z * 9.0 + uTime * 2.2)), 20.0);
  float sp = (s1 + s2 + s3) * 2.0;

  vec3 col = base + sp * uSparkleTint;
  gl_FragColor = vec4(col, 1.0);
}
`;

const materialByStoredKey = new Map<string, ShaderMaterial>();

function createMetallicCapMaterial(
  baseHex: string,
  sparkleTint: [number, number, number]
): ShaderMaterial {
  const hex = baseHex.replace(/^#/, "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const uBase: [number, number, number] = [r, g, b];

  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: uBase },
      uSparkleTint: { value: sparkleTint },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

export function getGlobeMetallicCapMaterial(stored: string): ShaderMaterial | undefined {
  if (!isFancyShaderCountryFill(stored)) return undefined;
  const tint = getFancyShaderSparkleTint(stored);
  if (!tint) return undefined;
  let mat = materialByStoredKey.get(stored);
  if (!mat) {
    const base = resolveGlobeCountryFill(stored);
    mat = createMetallicCapMaterial(base, tint);
    materialByStoredKey.set(stored, mat);
  }
  return mat;
}

export function tickGlobeMetallicCapMaterials(timeSeconds: number): void {
  for (const mat of materialByStoredKey.values()) {
    if (mat.uniforms.uTime) {
      (mat.uniforms.uTime as { value: number }).value = timeSeconds;
    }
  }
}
