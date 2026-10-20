import { act, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ArExperience } from '../src/components/ar/ArExperience'

const mindarMock = vi.hoisted(() => ({
  instance: null as { anchors: Array<{ onTargetFound?: () => void; onTargetLost?: () => void }> } | null,
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => {
  class FakeMindAR {
    anchors: Array<{ onTargetFound?: () => void; onTargetLost?: () => void }> = []
    renderer = { setAnimationLoop: vi.fn(), dispose: vi.fn() }
    cssRenderer = { render: vi.fn() }
    scene = {}
    camera = {}
    private readonly container: HTMLElement

    constructor(options: { container: HTMLElement }) {
      this.container = options.container
      mindarMock.instance = this
    }

    addCSSAnchor() {
      const anchor = {
        group: { add: (object: { element: HTMLElement }) => this.container.appendChild(object.element) },
        onTargetFound: undefined as (() => void) | undefined,
        onTargetLost: undefined as (() => void) | undefined,
      }
      this.anchors.push(anchor)
      return anchor
    }

    start() { return Promise.resolve() }
    stop() {}
  }

  return { MindARThree: FakeMindAR }
})

describe('ArExperience tracking overlays', () => {
  beforeEach(() => {
    mindarMock.instance = null
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn() } })
  })

  test('shows the correct anchored label and keeps one label per target', async () => {
    vi.useFakeTimers()
    try {
      render(<ArExperience autoStart />)
      await act(async () => { await Promise.resolve() })

      const instance = mindarMock.instance
      expect(instance).not.toBeNull()
      expect(document.querySelectorAll('.ar-target-label')).toHaveLength(6)
      act(() => instance?.anchors[1].onTargetFound?.())
      expect(screen.getByText('Confirming target')).toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(180) })

      expect(screen.getByText('1 tracked')).toBeInTheDocument()
      const label = document.querySelector('[data-target-id="region-caribe"]') as HTMLElement
      expect(label).toHaveStyle({ visibility: 'visible' })
      expect(label).toHaveAttribute('data-target-id', 'region-caribe')
      const highlight = document.querySelector('.ar-target-highlight[data-target-id="region-caribe"]') as HTMLElement
      expect(highlight).toHaveStyle({ visibility: 'visible' })
      expect(highlight).toHaveClass('is-confirmed')
    } finally {
      vi.useRealTimers()
    }
  })

  test('hides a lost label after the grace period and restores it on reacquisition', async () => {
    vi.useFakeTimers()
    try {
      render(<ArExperience autoStart />)
      await act(async () => { await Promise.resolve() })

      const instance = mindarMock.instance
      act(() => instance?.anchors[0].onTargetFound?.())
      act(() => instance?.anchors[0].onTargetLost?.())
      const label = document.querySelector('[data-target-id="colombia-completa"]') as HTMLElement
      expect(label).toHaveStyle({ visibility: 'hidden' })
      expect(screen.getByText('Brief tracking loss')).toBeInTheDocument()

      act(() => { vi.advanceTimersByTime(250) })
      expect(label).toHaveStyle({ visibility: 'hidden' })
      expect(screen.getByText('Tracking lost')).toBeInTheDocument()

      act(() => instance?.anchors[0].onTargetFound?.())
      act(() => { vi.advanceTimersByTime(180) })
      expect(label).toHaveStyle({ visibility: 'visible' })
      expect(screen.getByText('Detected and tracked')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('losing one target does not hide another target label', async () => {
    vi.useFakeTimers()
    try {
      render(<ArExperience autoStart />)
      await act(async () => { await Promise.resolve() })

      const instance = mindarMock.instance
      act(() => {
        instance?.anchors[0].onTargetFound?.()
        instance?.anchors[1].onTargetFound?.()
        instance?.anchors[0].onTargetLost?.()
        vi.advanceTimersByTime(180)
      })

      expect(screen.getByText('1 tracked')).toBeInTheDocument()
      const label = document.querySelector('[data-target-id="region-caribe"]') as HTMLElement
      expect(label).toHaveStyle({ visibility: 'visible' })
      const statusRow = Array.from(document.querySelectorAll('.tracking-row')).find((row) => row.textContent?.includes('Región Caribe')) as HTMLElement
      expect(within(statusRow).getByText('Detected and tracked')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
