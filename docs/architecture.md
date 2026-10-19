# Architecture

The frontend is a presentation client. FastAPI routes validate transport-level input and delegate to `DetectionService`; the service coordinates future preprocessing, region detection, and silhouette validation implementations. Pydantic schemas define the stable boundary between them. No database is present because persistence is not yet required.

