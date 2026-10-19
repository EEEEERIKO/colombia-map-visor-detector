# API

Base path: `/api/v1`.

- `GET /health` returns service status and whether the detection engine is implemented.
- `GET /detection/regions` returns the canonical region identifiers.
- `POST /detection/image` accepts an `image/*` multipart upload. It returns `400` for non-images and `501` until detection is implemented.
- `POST /map/validate` accepts detected-region contracts and returns `501` until geometric validation is implemented.
- `GET /images/targets` returns the six approved reference-target records and inspected dimensions.
- `POST /images/process/content` accepts multipart `file` plus JSON `parameters` and returns processed image bytes with metadata in `X-Processed-Metadata`.
- `POST /images/captures` stores an original image separately from its JSON capture metadata; `GET /images/captures?target_id=...` lists saved records.

Image processing accepts PNG, JPEG, and WebP, normalizes EXIF orientation, enforces byte/pixel limits, preserves aspect ratio, and rejects invalid perspective quadrilaterals. It does not infer physical scale or camera intrinsics from a single image.

