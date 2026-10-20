declare module 'three' {
  // Three.js does not ship declarations in this project; the existing MindAR build supplies the runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const THREE: any
  export = THREE
}
