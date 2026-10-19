import { ArExperience } from './components/ar/ArExperience'
import { AcquisitionWorkspace } from './components/camera/AcquisitionWorkspace'

export default function App() {
  return <main><ArExperience /><details className="diagnostics"><summary>Developer calibration tools</summary><p>Use this secondary area to inspect still captures and preprocessing. It is not part of the AR tracking flow.</p><AcquisitionWorkspace /></details></main>
}
