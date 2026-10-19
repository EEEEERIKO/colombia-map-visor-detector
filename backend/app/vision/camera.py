class CameraSource:
    """Boundary for camera acquisition; browser and server cameras are separate concerns."""

    def capture(self) -> bytes:
        raise NotImplementedError("Camera acquisition is not implemented yet.")
