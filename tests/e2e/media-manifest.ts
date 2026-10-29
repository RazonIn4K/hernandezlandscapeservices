import fs from 'node:fs';
import path from 'node:path';

// media/gallery.json is the source of truth for every generated media surface, so
// specs read counts and positions from it instead of pinning numbers that every
// media addition would have to hand-edit.
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../media/gallery.json'), 'utf8'));

export const videosPageIds: string[] = manifest.surfaces.videosPage;
export const mediaItem = (id: string) => manifest.items.find((item: { id: string }) => item.id === id);
