import type { PendingEvent } from "./models/pending-event";
import type { ImagePair } from "./models/image-pair";
import type { ImageDataRequestEvent, ImageTemplateRequestEvent } from './models/events';
import { imageDataRequestEvent, imageTemplateRequestEvent, } from './models/events.js';

export class ImageAligner {
    private checkbox!: HTMLInputElement;
    private button!: HTMLButtonElement;
    private xPosInput!: HTMLInputElement;
    private yPosInput!: HTMLInputElement;
    private imageSelector!: HTMLSelectElement;

    constructor() {

    }

    public initialize(): void {
        this.checkbox = document.getElementById('auto-adjust') as HTMLInputElement;
        this.button = document.getElementById('manual-adjust') as HTMLButtonElement;
        this.xPosInput = document.getElementById('x-position') as HTMLInputElement;
        this.yPosInput = document.getElementById('y-position') as HTMLInputElement;
        this.imageSelector = document.getElementById('align') as HTMLSelectElement;

        this.attachEvents();
    }

    private attachEvents() {
        this.checkbox.addEventListener('change', this.handleCheckboxChange);
        this.button.addEventListener('click', this.handleButtonClick);
        this.xPosInput.addEventListener('input', this.handlePositionInputChange);
        this.yPosInput.addEventListener('input', this.handlePositionInputChange);
        this.imageSelector.addEventListener('change', this.handleImageSelectionChange);
    }

    private removeEvents() {
        this.checkbox.removeEventListener('change', this.handleCheckboxChange);
        this.button.removeEventListener('click', this.handleButtonClick);
        this.xPosInput.removeEventListener('input', this.handlePositionInputChange);
        this.yPosInput.removeEventListener('input', this.handlePositionInputChange);
        this.imageSelector.removeEventListener('change', this.handleImageSelectionChange);
    }

    // Event handlers
    private handleCheckboxChange = (event: Event): void => {
        let target = event.target as HTMLInputElement;
        console.log(`Auto image alignment is now ${target.checked ? 'ON' : 'OFF'}`);
    }

    private handleButtonClick = async (event: Event): Promise<void> => {
        // Wait for the request for the image pair we're aligning.
        const imagePair = await this.tryGetImagePair();
        if (!imagePair) {
            return;
        }

        imagePair.a.style.transform = `translate(0, 0)`;
        imagePair.b.style.transform = `translate(0, 0)`;
        // Now make a request to OpenCV to get the template matching data
        const point = await this.tryGetMatchedPoint(imagePair);
        if (!point) {
            return;
        }

        const x = point.x.toString() + (point.x !== 0 ? 'px' : '');
        const y = point.y.toString() + (point.y !== 0 ? 'px' : '');

        // Then maybe dispatch an event that we got the data. Or have the template matching code do it.
        imagePair.a.style.transform = `translate(0, 0)`;
        imagePair.b.style.transform = `translate(${x}, ${y})`;

        console.log(x, y);
    }

    /**
     * Send an event to request the images we'll do alignment for.
     */
    private async tryGetImagePair(): Promise<ImagePair | undefined> {
        const dataRequestEvent = new CustomEvent<ImageDataRequestEvent>(imageDataRequestEvent, {
            detail: {
                pending: undefined,
            }
        });

        document.dispatchEvent(dataRequestEvent);

        if (!dataRequestEvent.detail.pending) {
            console.error('no listeners on data request');
            return;
        }

        return await dataRequestEvent.detail.pending;
    }

    /**
     * Send an event to request the closest matched point.
     */
    private async tryGetMatchedPoint(imagePair: ImagePair): Promise<Point | undefined> {
        const openCVTemplateRequestEvent = new CustomEvent<ImageTemplateRequestEvent>(imageTemplateRequestEvent, {
            detail: {
                pending: undefined,
                data: imagePair,
            }
        });
        document.dispatchEvent(openCVTemplateRequestEvent);

        if (!openCVTemplateRequestEvent.detail.pending) {
            console.log('No request made to openCV.js');
            return undefined;
        }

        return await openCVTemplateRequestEvent.detail.pending;
    }

    private handlePositionInputChange = (event: Event): void => {
        let target = event.target as HTMLInputElement;
        let positionValue = parseInt(target.value);
        if (isNaN(positionValue)) {
            console.log('Invalid position input');
        } else {
            if (target === this.xPosInput) {
                console.log(`X Position changed to ${positionValue}`);
            } else if (target === this.yPosInput) {
                console.log(`Y Position changed to ${positionValue}`);
            }
        }
    }

    private handleImageSelectionChange = (event: Event): void => {
        let target = event.target as HTMLSelectElement;
        console.log(`Image being aligned: ${target.value}`);
    }

    public handleImageDataRequest(event: Event, before: HTMLImageElement, after: HTMLImageElement): void {
        const awaitImage = (image: HTMLImageElement): Promise<void> => {
          return new Promise(res => {
            image.complete ? res() : image.addEventListener('load', () => res());
          });
        }

        const customEvent = (event as CustomEvent<PendingEvent<ImagePair>>);
        customEvent.detail.pending = new Promise(async (res) => {
          await Promise.all([
            awaitImage(before),
            awaitImage(after),
          ]);

          res({
            a: before,
            b: after,
          });
        });
    }
}
