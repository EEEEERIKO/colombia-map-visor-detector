import { REGION_IDS } from '../../types/api'
export function RegionStatusGrid() { return <section><h2>Region checklist</h2><div className="region-grid">{REGION_IDS.map((id) => <article className="region-card" key={id}><span className="status-dot" /> <span>{id[0].toUpperCase() + id.slice(1)}</span><small>Awaiting detection</small></article>)}</div></section> }

