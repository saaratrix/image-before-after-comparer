interface Listener {
  type: string;
  listener: (event: any) => void;
}

interface Dimensions {
  width: number;
  height: number;
}

// ^.^ It was a lot more time consuming writing a before & after component than I thought!
// This class has become a bit of spaghetti now.
export class ImageComparator {
  private addedListeners: Listener[] = [];

  /**
   * We need a promise
   */
  public tryAddImageComparison(rootElement: HTMLElement): Promise<void> {
    const comparisonElements = rootElement.querySelectorAll<HTMLElement>('.image-comparison');
    if (comparisonElements.length === 0) {
      return Promise.resolve();
    }

    let promise = new Promise<void>(async (res, rej) => {
      let loadPromises: Promise<void>[] = [];
      for (let i = 0; i < comparisonElements.length; i++) {
        loadPromises.push(this.addImageComparison(comparisonElements[i]));
      }

      await Promise.all(loadPromises);
      res();
    });
    return promise;
  }

  public clearEvents(): void {
    for (const listener of this.addedListeners) {
      window.removeEventListener(listener.type, listener.listener);
    }
    this.addedListeners = [];
  }

  private addImageComparison(comparisonElement: HTMLElement): Promise<void> {
    const contentElement = comparisonElement.querySelector<HTMLElement>('.image-comparison-content');

    const beforeElement = comparisonElement.querySelector<HTMLElement>('.image-comparison-before');
    const afterElement = comparisonElement.querySelector<HTMLElement>('.image-comparison-after');

    const beforeImage = beforeElement?.querySelector<HTMLImageElement>('img');
    const afterImage = afterElement?.querySelector<HTMLImageElement>('img');

    const sliderElement = comparisonElement.querySelector<HTMLElement>('.image-comparison-slider');
    const sliderHandleElement = sliderElement?.querySelector<HTMLElement>('.image-comparison-slider-handle');
    if (!contentElement || !beforeElement || !afterElement || !beforeElement || !beforeImage || !afterImage || !sliderElement || !sliderHandleElement) {
      return Promise.resolve();
    }

    // Prevent ghost images when dragging.
    beforeImage.draggable = false;
    afterImage.draggable = false;

    comparisonElement.classList.add('image-comparison-loaded');
    this.initSlider(sliderElement, sliderHandleElement, contentElement, beforeElement, afterElement);

    const promises: Promise<void>[] = [
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
    }
    this.addedListeners.push({ type: 'resize', listener: onResize });
    window.addEventListener('resize', onResize);

    return Promise.all(promises).then(() => {
      onResize();
    });
  }

  /**
   * Get the maximum width or maximum height that we can set the image.
   */
  private getMaximumDimensions(comparisonElement: HTMLElement, beforeImage: HTMLImageElement, afterImage: HTMLImageElement): Dimensions {
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

  private getImageDimensions(imageElement: HTMLImageElement, availableWidth: number, availableHeight: number): Dimensions {
    let width = imageElement.naturalWidth;
    let height = imageElement.naturalHeight;

    if (width > availableWidth) {
      const ratio = width / availableWidth;
      width /= ratio;
      height /= ratio;
    }

    if (height > availableHeight) {
      const ratio = height / availableHeight;
      width /= ratio;
      height /= ratio;
    }

    return {
      width,
      height,
    };
  }

  private setMaximumDimensions(dimensions: Dimensions, contentElement: HTMLElement, beforeImage: HTMLImageElement, afterImage: HTMLImageElement): void {
    contentElement.style.width = `${dimensions.width}px`;
    contentElement.style.height = `${dimensions.height}px`;

    beforeImage.style.maxWidth = `${dimensions.width}px`;
    afterImage.style.maxWidth = `${dimensions.width}px`;

    beforeImage.style.maxHeight = `${dimensions.height}px`;
    afterImage.style.maxHeight = `${dimensions.height}px`;
  }

  private addImageLoadEvent(image: HTMLImageElement): Promise<void> {
    if (image.complete && image.naturalHeight !== 0) {
      return Promise.resolve();
    }

    let promise = new Promise<void>((res, rej) => {
      image.addEventListener('load', () => {
        res();
      });
      image.addEventListener('error', () => {
        res();
      });
    });
    return promise;
  }

  private initSlider(sliderElement: HTMLElement, sliderHandleElement: HTMLElement, contentElement: HTMLElement, beforeElement: HTMLElement, afterElement: HTMLElement): void {
    sliderElement.style.display = 'flex';

    let isPointerDown: boolean = false;
    let pointerDownOffset: number = 0;
    sliderHandleElement.addEventListener('pointerdown', (event) => {
      isPointerDown = true;
      const handleBounds = sliderHandleElement.getBoundingClientRect();
      pointerDownOffset = (event.clientX - handleBounds.left) - (handleBounds.width / 2);
      contentElement.classList.add('is-dragging');
    });

    const pointerMove = (event: PointerEvent) => {
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

    const pointerUp = (): void => {
      isPointerDown = false;
      contentElement.classList.remove('is-dragging');
    }

    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    this.addedListeners.push({ type: 'pointermove', listener: pointerMove });
    this.addedListeners.push({ type: 'pointerup', listener: pointerUp });
  }

  private setBeforeClipPath(offsetX: number, element: HTMLElement): void {
    element.style.clipPath = `polygon(0% 0%, ${offsetX}% 0%, ${offsetX}% 100%, 0% 100%)`;
  }

  private setAfterClipPath(offsetX: number, element: HTMLElement): void {
    element.style.clipPath = `polygon(${offsetX}% 0%,100% 0%,100% 100%,${offsetX}% 100%)`;
  }
}
