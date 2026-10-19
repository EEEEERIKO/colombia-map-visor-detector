# Computer-vision pipeline

The intended pipeline is acquisition → calibration/preprocessing → individual region detection → region identification/localization → spatial arrangement validation → silhouette validation → frontend feedback. Each stage has a backend boundary so algorithms and models can be introduced incrementally. Detecting five contours alone is insufficient to prove a complete Colombia map.

Calibration currently records the known physical map size (230 cm × 250 cm), optional camera distance/orientation/lighting observations, actual image metadata, and optional perspective points. Intrinsic calibration would require multiple views of a known calibration target, commonly a checkerboard or Charuco board, with known geometry; it is deliberately not inferred here. Physical scale also requires a known measurement or calibrated camera/reference, not an arbitrary photograph.

