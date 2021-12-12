// ^.^ It was a lot more time consuming writing a before & after component than I thought!
// This class has become a bit of spaghetti now.
export class ImageBeforeAfterComparisor {
    addedListeners = [];
    /**
     * We need a promise
     */
    tryAddImageComparison(rootElement) {
        const comparisonElements = rootElement.querySelectorAll('.image-comparison');
        if (comparisonElements.length === 0) {
            return Promise.resolve();
        }
        let promise = new Promise(async (res, rej) => {
            let loadPromises = [];
            for (let i = 0; i < comparisonElements.length; i++) {
                loadPromises.push(this.addImageComparison(comparisonElements[i]));
            }
            await Promise.all(loadPromises);
            res();
        });
        return promise;
    }
    clearEvents() {
        for (const listener of this.addedListeners) {
            window.removeEventListener(listener.type, listener.listener);
        }
        this.addedListeners = [];
    }
    addImageComparison(comparisonElement) {
        const contentElement = comparisonElement.querySelector('.image-comparison-content');
        const beforeElement = comparisonElement.querySelector('.image-comparison-before');
        const afterElement = comparisonElement.querySelector('.image-comparison-after');
        const beforeImage = beforeElement?.querySelector('img');
        const afterImage = afterElement?.querySelector('img');
        const sliderElement = comparisonElement.querySelector('.image-comparison-slider');
        const sliderHandleElement = sliderElement?.querySelector('.image-comparison-slider-handle');
        if (!contentElement || !beforeElement || !afterElement || !beforeElement || !beforeImage || !afterImage || !sliderElement || !sliderHandleElement) {
            return Promise.resolve();
        }
        // Prevent ghost images when dragging.
        beforeImage.draggable = false;
        afterImage.draggable = false;
        comparisonElement.classList.add('image-comparison-loaded');
        this.initSlider(sliderElement, sliderHandleElement, contentElement, beforeElement, afterElement);
        const promises = [
            this.addImageLoadEvent(beforeImage),
            this.addImageLoadEvent(afterImage),
        ];
        // We use left instead of transform because left is dependent on the parent and transform is dependent on the current element.
        // And since sliderElement is only ~30px width we can't use translateX(50%).
        // And using % is much nicer than pixels because of window onresize events etc.
        sliderElement.style.left = "50%";
        this.setBeforeClipPath(50, beforeElement);
        this.setAfterClipPath(50, afterElement);
        const onResize = () => {
            const dimensions = this.getMaximumDimensions(comparisonElement, beforeImage, afterImage);
            this.setMaximumDimensions(dimensions, contentElement, beforeImage, afterImage);
        };
        this.addedListeners.push({ type: 'resize', listener: onResize });
        window.addEventListener('resize', onResize);
        return Promise.all(promises).then(() => {
            onResize();
        });
    }
    /**
     * Get the maximum width or maximum height that we can set the image.
     */
    getMaximumDimensions(comparisonElement, beforeImage, afterImage) {
        const comparisonBounds = comparisonElement.getBoundingClientRect();
        // Get the maximum widths & heights before applying aspect ratio.
        let availableWidth = Math.min(comparisonBounds.width, window.innerWidth, beforeImage.naturalWidth, afterImage.naturalWidth);
        let availableHeight = Math.min(comparisonBounds.height, window.innerHeight, beforeImage.naturalHeight, afterImage.naturalHeight);
        const beforeDimensions = this.getImageDimensions(beforeImage, availableWidth, availableHeight);
        const afterDimensions = this.getImageDimensions(afterImage, availableWidth, availableHeight);
        return {
            height: Math.min(beforeDimensions.height, afterDimensions.height),
            width: Math.min(beforeDimensions.width, afterDimensions.width),
        };
    }
    getImageDimensions(imageElement, availableWidth, availableHeight) {
        let width = imageElement.naturalWidth;
        let height = imageElement.naturalHeight;
        if (width > availableWidth) {
            const ratio = width / availableWidth;
            width /= ratio;
            height /= ratio;
        }
        if (height > availableHeight) {
            const ratio = height / availableWidth;
            width /= ratio;
            height /= ratio;
        }
        return {
            width,
            height,
        };
    }
    setMaximumDimensions(dimensions, contentElement, beforeImage, afterImage) {
        contentElement.style.width = `${dimensions.width}px`;
        contentElement.style.height = `${dimensions.height}px`;
        beforeImage.style.maxWidth = `${dimensions.width}px`;
        afterImage.style.maxWidth = `${dimensions.width}px`;
        beforeImage.style.maxHeight = `${dimensions.height}px`;
        afterImage.style.maxHeight = `${dimensions.height}px`;
    }
    addImageLoadEvent(image) {
        if (image.complete && image.naturalHeight !== 0) {
            return Promise.resolve();
        }
        let promise = new Promise((res, rej) => {
            image.addEventListener('load', () => {
                res();
            });
            image.addEventListener('error', () => {
                res();
            });
        });
        return promise;
    }
    initSlider(sliderElement, sliderHandleElement, contentElement, beforeElement, afterElement) {
        sliderElement.style.display = 'flex';
        let isPointerDown = false;
        let pointerDownOffset = 0;
        sliderHandleElement.addEventListener('pointerdown', (event) => {
            isPointerDown = true;
            const handleBounds = sliderHandleElement.getBoundingClientRect();
            pointerDownOffset = (event.clientX - handleBounds.left) - (handleBounds.width / 2);
            contentElement.classList.add('is-dragging');
        });
        const pointerMove = (event) => {
            if (!isPointerDown) {
                return;
            }
            const bounds = contentElement.getBoundingClientRect();
            let x = event.clientX - bounds.left - pointerDownOffset;
            // const min = (0 - sliderElement.offsetWidth / 2);
            // const max = bounds.width - sliderElement.offsetWidth / 2;
            const min = 0;
            const max = bounds.width;
            x = Math.max(Math.min(x, max), min);
            const offsetPercentage = (x / max) * 100;
            sliderElement.style.left = `${offsetPercentage}%`;
            // Move the range back from 0 -> max
            // const offsetPercentage = ((x - min) / (max - min)) * 100;
            this.setBeforeClipPath(offsetPercentage, beforeElement);
            this.setAfterClipPath(offsetPercentage, afterElement);
        };
        const pointerUp = () => {
            isPointerDown = false;
            contentElement.classList.remove('is-dragging');
        };
        window.addEventListener('pointermove', pointerMove);
        window.addEventListener('pointerup', pointerUp);
        this.addedListeners.push({ type: 'pointermove', listener: pointerMove });
        this.addedListeners.push({ type: 'pointerup', listener: pointerUp });
    }
    setBeforeClipPath(offsetX, element) {
        element.style.clipPath = `polygon(0% 0%, ${offsetX}% 0%, ${offsetX}% 100%, 0% 100%)`;
    }
    setAfterClipPath(offsetX, element) {
        element.style.clipPath = `polygon(${offsetX}% 0%,100% 0%,100% 100%,${offsetX}% 100%)`;
    }
}
//# sourceMappingURL=image-before-after-comparison.js.map