import type { PendingEvent } from "./models/pending-event";
import type { ImagePair } from "./models/image-pair";

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
        console.log('Image alignment button has been clicked');

        const dataRequestEvent = new CustomEvent<PendingEvent<ImagePair>>('image:data:request', {
            detail: {
                pending: undefined,
            }
        });

        document.dispatchEvent(dataRequestEvent);

        if (!dataRequestEvent.detail.pending) {
            console.error('no listeners on data request');
            return;
        }

        const { a: before, b: after } = await dataRequestEvent.detail.pending;

        // Now make a request to OpenCV to get the template matching data

        // Then maybe dispatch an event that we got the data. Or have the template matching code do it.
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
