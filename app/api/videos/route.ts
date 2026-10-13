import { collectionHandlers } from '@/lib/collection-api';
import { sanitizeVideo } from '@/lib/sanitizers';

export const dynamic = 'force-dynamic';

export const { POST, PATCH } = collectionHandlers('videos', sanitizeVideo);
