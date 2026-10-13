import { collectionHandlers } from '@/lib/collection-api';
import { sanitizeCredit } from '@/lib/sanitizers';

export const dynamic = 'force-dynamic';

export const { POST, PATCH } = collectionHandlers('credits', sanitizeCredit);
