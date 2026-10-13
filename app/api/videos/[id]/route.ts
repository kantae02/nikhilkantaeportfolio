import { itemHandlers } from '@/lib/collection-api';
import { sanitizeVideo } from '@/lib/sanitizers';

export const dynamic = 'force-dynamic';

export const { PATCH, DELETE } = itemHandlers('videos', sanitizeVideo);
