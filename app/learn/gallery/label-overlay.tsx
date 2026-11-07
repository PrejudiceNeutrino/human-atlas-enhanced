import type { PracticeLabel } from './label-practice-model';
import { regionBounds } from './label-practice-model';

export function LabelOverlay({ labels, revealed, numbers, aspectRatio, identifying = false, onActivate }: { labels: PracticeLabel[]; revealed: ReadonlySet<string>; numbers: boolean; aspectRatio: number; identifying?: boolean; onActivate: (id: string) => void }) {
  return <svg className="label-practice-overlay" viewBox="0 0 1 1" preserveAspectRatio="none" role="group" aria-label="Label covers">
    {labels.map((label, index) => <g key={label.id} className="label-practice-mask" data-practice-label={label.id} data-revealed={revealed.has(label.id)} role="button" tabIndex={0}
      aria-label={revealed.has(label.id) ? `Hide label ${index + 1}: ${label.label}` : `${identifying ? 'Identify' : 'Reveal'} label ${index + 1}`}
      onClick={event => { if (event.detail === 0) onActivate(label.id); }}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onActivate(label.id); } }}>
      {label.regions.map((region, part) => {
        const bounds = regionBounds(region), fill = revealed.has(label.id) ? 'transparent' : region.fill;
        return <g key={part}>{region.shape === 'rect' ? <rect x={region.x} y={region.y} width={region.width} height={region.height} fill={fill}/> : <polygon points={region.points.map(point => point.join(',')).join(' ')} fill={fill}/>}
          {numbers && !revealed.has(label.id) && part === 0 && <text transform={`translate(${bounds.x + bounds.width / 2} ${bounds.y + bounds.height / 2}) scale(${1 / aspectRatio} 1)`} dominantBaseline="central" textAnchor="middle" fontSize={Math.min(.019 * Math.max(1, aspectRatio), bounds.height * .7)} fill="#263b48" aria-hidden="true">{index + 1}</text>}
        </g>;
      })}
    </g>)}
  </svg>;
}
