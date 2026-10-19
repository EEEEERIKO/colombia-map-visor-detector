import { render, screen } from '@testing-library/react'
import App from '../src/App'

test('renders the camera-first AR experience with six undiscovered targets', () => {
  render(<App />)
  expect(screen.getByText('Vuela por Colombia')).toBeInTheDocument()
  expect(screen.getByText('Image tracking')).toBeInTheDocument()
  expect(screen.getAllByText('Not detected')).toHaveLength(6)
  expect(screen.getByText(/Labels appear only after MindAR confirms a target/)).toBeInTheDocument()
})

test('keeps calibration upload as a secondary developer utility', () => {
  render(<App />)
  expect(screen.getByText('Developer calibration tools')).toBeInTheDocument()
  expect(screen.getByLabelText('Upload fallback')).toBeInTheDocument()
})

