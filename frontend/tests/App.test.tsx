import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../src/App'

test('starts with the game screen and requests camera permission before playing', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
  })
  render(<App />)
  expect(screen.getByText('¡UNA AVENTURA PARA TODOS!')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /JUGAR/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /JUGAR/ }))
  expect(screen.getByText('ANTES DE EMPEZAR')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Activar cámara para jugar →' }))
  await screen.findByText(/¡ENCUENTRA LAS 5 REGIONES!/)
  expect(screen.getByText(/¡ENCUENTRA LAS 5 REGIONES!/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Activar cámara' })).toBeInTheDocument()
})

test('renders without the developer demo panel', () => {
  render(<App />)
  expect(screen.queryByText('⚙ Demo')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Upload fallback')).not.toBeInTheDocument()
})
