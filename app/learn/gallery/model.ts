export interface GalleryFigure {
  id: string;
  title: string;
  description: string;
  alt: string;
  category: string;
  tags: string[];
  image: string;
  thumbnail: string;
  width: number;
  height: number;
  sha256: string;
  source: { deck: string; slides: number[]; cropNormalized?: number[] };
  sourceType: string;
  rightsReview: string;
}

export interface GalleryCollection {
  schemaVersion: number;
  title: string;
  description: string;
  selectionMethod: string;
  count: number;
  gallerySections: { id: string; title: string }[];
  items: GalleryFigure[];
}

const categoryLabels: Record<string, string> = {
  'anatomical-models': 'Anatomical Models',
  'anatomical-diagrams': 'Anatomical Diagrams',
  histology: 'Histology',
  'physiology-diagrams': 'Physiology Diagrams',
};
export const categoryLabel = (id: string, fallback = id) => categoryLabels[id] ?? fallback;

export function parseGallery(input: unknown): GalleryCollection {
  const data = input as GalleryCollection;
  if (!data || data.schemaVersion !== 1 || !Array.isArray(data.items) || !Array.isArray(data.gallerySections) || data.count !== data.items.length) {
    throw new Error('The local gallery manifest is incomplete or unsupported.');
  }
  const sections = new Set(data.gallerySections.map(section => section.id));
  const ids = new Set<string>();
  for (const item of data.items) {
    if (!item || typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id) ||
        !sections.has(item.category) || !['title', 'description', 'alt', 'sourceType', 'rightsReview'].every(key => typeof item[key as keyof GalleryFigure] === 'string') ||
        !Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === 'string') ||
        !Number.isFinite(item.width) || !Number.isFinite(item.height) || item.width <= 0 || item.height <= 0 ||
        item.image !== `images/${item.id}.webp` || item.thumbnail !== `thumbnails/${item.id}.webp` ||
        !item.source || typeof item.source.deck !== 'string' || !Array.isArray(item.source.slides) || !item.source.slides.length ||
        !item.source.slides.every(slide => Number.isInteger(slide) && slide > 0)) {
      throw new Error('The local gallery contains an invalid or duplicated figure.');
    }
    ids.add(item.id);
  }
  return data;
}

export function figureSource(item: GalleryFigure) {
  const slides = item.source.slides;
  const consecutive = slides.every((slide, index) => index === 0 || slide === slides[index - 1] + 1);
  const label = slides.length > 1 && consecutive ? `${slides[0]}–${slides[slides.length - 1]}` : slides.join(', ');
  return `Source: ${item.source.deck} — ${slides.length === 1 ? 'Slide' : 'Slides'} ${label}`;
}

export function filterFigures(items: GalleryFigure[], category: string, query: string) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item => (category === 'all' || item.category === category) &&
    words.every(word => `${item.title} ${item.description} ${item.tags.join(' ')}`.toLocaleLowerCase().includes(word)));
}
