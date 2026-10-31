/// <reference types="@react-three/fiber" />
/// <reference types="@react-three/drei" />
/// <reference types="three" />
import "@react-three/fiber";
import "@react-three/drei";
import "@react-three/drei/web";
import "three";

declare module "*.css" {
  const css: string;
  export default css;
}
