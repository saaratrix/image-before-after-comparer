import type { PendingEvent } from './pending-event';
import type { ImagePair } from './image-pair';

export type ImageTemplateRequestEvent = PendingEvent<Point, ImagePair>;
export type ImageDataRequestEvent = PendingEvent<ImagePair>;

export const imageDataRequestEvent = 'image:data:request';
export const imageTemplateRequestEvent = 'image:template:request';