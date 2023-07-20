export class ImageAligner {
    checkbox;
    button;
    xPosInput;
    yPosInput;
    imageSelector;
    constructor() {
    }
    initialize() {
        this.checkbox = document.getElementById('auto-adjust');
        this.button = document.getElementById('manual-adjust');
        this.xPosInput = document.getElementById('x-position');
        this.yPosInput = document.getElementById('y-position');
        this.imageSelector = document.getElementById('align');
        this.attachEvents();
    }
    attachEvents() {
        this.checkbox.addEventListener('change', this.handleCheckboxChange);
        this.button.addEventListener('click', this.handleButtonClick);
        this.xPosInput.addEventListener('input', this.handlePositionInputChange);
        this.yPosInput.addEventListener('input', this.handlePositionInputChange);
        this.imageSelector.addEventListener('change', this.handleImageSelectionChange);
    }
    removeEvents() {
        this.checkbox.removeEventListener('change', this.handleCheckboxChange);
        this.button.removeEventListener('click', this.handleButtonClick);
        this.xPosInput.removeEventListener('input', this.handlePositionInputChange);
        this.yPosInput.removeEventListener('input', this.handlePositionInputChange);
        this.imageSelector.removeEventListener('change', this.handleImageSelectionChange);
    }
    // Event handlers
    handleCheckboxChange = (event) => {
        let target = event.target;
        console.log(`Auto image alignment is now ${target.checked ? 'ON' : 'OFF'}`);
    };
    handleButtonClick = async (event) => {
        console.log('Image alignment button has been clicked');
        const dataRequestEvent = new CustomEvent('image:data:request', {
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
    };
    handlePositionInputChange = (event) => {
        let target = event.target;
        let positionValue = parseInt(target.value);
        if (isNaN(positionValue)) {
            console.log('Invalid position input');
        }
        else {
            if (target === this.xPosInput) {
                console.log(`X Position changed to ${positionValue}`);
            }
            else if (target === this.yPosInput) {
                console.log(`Y Position changed to ${positionValue}`);
            }
        }
    };
    handleImageSelectionChange = (event) => {
        let target = event.target;
        console.log(`Image being aligned: ${target.value}`);
    };
    handleImageDataRequest(event, before, after) {
        const awaitImage = (image) => {
            return new Promise(res => {
                image.complete ? res() : image.addEventListener('load', () => res());
            });
        };
        const customEvent = event;
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
//# sourceMappingURL=image-aligner.js.map