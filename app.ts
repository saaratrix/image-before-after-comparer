import { ImageComparator } from './image-comparator.js';
import { ImagePositionAdjuster } from './image-position-adjuster.js';
import { ImageAligner } from "./image-aligner.js";
import { imageDataRequestEvent } from './models/events.js';

(function() {
  type BeforeAfter = 'before' | 'after';

  let imageComparisonRoot!: HTMLElement | null;

  let beforeImageElement!: HTMLImageElement;
  let afterImageElement!: HTMLImageElement;

  let positionAdjuster: ImagePositionAdjuster = new ImagePositionAdjuster();
  let imageComparator: ImageComparator = new ImageComparator();
  let imageAligner: ImageAligner = new ImageAligner();

  window.addEventListener('DOMContentLoaded', async () => {
    imageComparisonRoot = document.querySelector<HTMLElement>('.image-comparison-container');
    if (!imageComparisonRoot) {
      console.log('missing image comparison container');
      return;
    }

    const beforeImage = document.querySelector<HTMLImageElement>('.image-comparison-before img');
    const afterImage = document.querySelector<HTMLImageElement>('.image-comparison-after img');
    if (!beforeImage || !afterImage) {
      console.log('missing before or after image');
      return;
    }

    setImageComparisonMaxHeight();
    imageComparator.tryAddImageComparison(imageComparisonRoot).then();

    beforeImageElement = beforeImage
    afterImageElement = afterImage;

    const beforeContainer = document.querySelector<HTMLElement>('.image-selection-before');
    const afterContainer = document.querySelector<HTMLElement>('.image-selection-after');

    initializeImageSelection(beforeContainer, 'before');
    initializeImageSelection(afterContainer, 'after');

    imageAligner.initialize();
    await positionAdjuster.initialize();

    listenForImageDataRequest();

    trySetInitialImageUrls(beforeContainer, afterContainer);
  });

  const listenForImageDataRequest = () => {
    document.addEventListener(imageDataRequestEvent, (event: Event) => {
      if (!areImagesValid()) {
        return;
      }

      imageAligner.handleImageDataRequest(event, beforeImageElement, afterImageElement);
    });
}

  function setImageComparisonMaxHeight(): void {
    const imageComparisonElement = imageComparisonRoot!.querySelector<HTMLElement>('.image-comparison');
    const selectionBounds = document.querySelector<HTMLElement>('.image-settings-container')!.getBoundingClientRect();
    // 8 px from the <main> padding.
    const height = selectionBounds.bottom + 8;

    imageComparisonElement!.style.maxHeight = `calc(100vh - ${height}px)`;
  }

  function initializeImageSelection(container: HTMLElement | null, type: BeforeAfter): void {
    if (!container) {
      console.log('missing container');
      return;
    }

    const targetImage = type === 'before' ? beforeImageElement : afterImageElement;

    initUrlSelection(container, targetImage);
    initFileSelection(container, targetImage);
  }

  function initUrlSelection(container: HTMLElement, targetImage: HTMLImageElement): void {
    const urlSelection = container.querySelector<HTMLInputElement>('.url-selection');
    if (!urlSelection) {
      console.log('missing url selection');
      return;
    }

    urlSelection.addEventListener('change', () => {
      const hasProtocol = urlSelection.value.startsWith('://') || urlSelection.value.startsWith('http://') || urlSelection.value.startsWith('https://');
      targetImage.src = hasProtocol ? urlSelection.value : `://${urlSelection.value}`;
      tryShowComparer();
    });
  }

  function initFileSelection(container: HTMLElement, targetImage: HTMLImageElement): void {
    const fileSelection = container.querySelector<HTMLInputElement>('.file-selection');

    if (!fileSelection) {
      console.log('missing url selection');
      return;
    }

    fileSelection.addEventListener('change', (event) => handleFileSelection(event, targetImage));
  }

  function handleFileSelection(event: Event, targetImage: HTMLImageElement): void {
    const target = event.target as HTMLInputElement;
    const files = target?.files;
    if (!files?.length) {
      return;
    }

    const file = files[0];
    const filename = file.name;

    // Source: https://stackoverflow.com/a/12900504/2437350
    const fileExtension = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);

    const fr = new FileReader();
    fr.onload = () => {
      targetImage.src = fr.result as string;
      tryShowComparer();
    }
    fr.onerror = () => {
      console.error('failed to load image');
    }

    fr.readAsDataURL(file);
  }

  function trySetInitialImageUrls(beforeContainer: HTMLElement | null, afterContainer: HTMLElement | null): void {
    const url = new URL(location.href);
    const beforeUri = decodeImageUri(url, 'before');
    const afterUri = decodeImageUri(url, 'after');
    const beforeUrlSelection = beforeContainer?.querySelector<HTMLInputElement>('.url-selection');
    const afterUrlSelection = afterContainer?.querySelector<HTMLInputElement>('.url-selection');

    let shouldTryShowComparer: boolean = false;

    if (beforeUri || afterUri) {
      const cancel =  confirm(`Do you want to load images: \n${beforeUri}\n${afterUri}`);
      if (!cancel) {
        tryUpdateQueryParams();
        return;
      }
    }

    if (beforeUri && beforeUrlSelection) {
      beforeImageElement.src = beforeUri;
      beforeUrlSelection.value = beforeUri;
      shouldTryShowComparer = true;
    }
    if (afterUri && afterUrlSelection) {
      afterImageElement.src = afterUri;
      afterUrlSelection.value = afterUri;
      shouldTryShowComparer = true;
    }

    if (!shouldTryShowComparer) {
      return;
    }

    tryShowComparer();
  }

  function decodeImageUri(url: URL, key: 'before' | 'after'): string {
    const uri = url.searchParams.has(key) ? decodeURI(url.searchParams.get(key)!) : '';
    // Base64 is currently not supported.
    if (uri.startsWith('data:')) {
      return '';
    }

    return uri;
  }

  function tryUpdateQueryParams(): void {
    if (!canUpdateQueryParams()) {
      history.pushState(undefined, '', window.location.pathname);
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set('before', beforeImageElement.src);
    searchParams.set('after', afterImageElement.src);
    const relativePathQuery = window.location.pathname + '?' + searchParams.toString();
    history.pushState(undefined, '', relativePathQuery);
  }

  function canUpdateQueryParams(): boolean {
    if (beforeImageElement.src.includes('//:0') || afterImageElement.src.includes('//:0')) {
      return false;
    }

    // Base64 is currently not supported.
    if (beforeImageElement.src.startsWith('data:') || afterImageElement.src.startsWith('data:')) {
      return false;
    }

    return true;
  }

  function tryShowComparer(): void {
    tryUpdateQueryParams();

    if (areImagesValid()) {
      return;
    }

    imageComparisonRoot!.hidden = false;
  }

  function areImagesValid(): boolean {
    return !beforeImageElement.src.includes('//:0') && !afterImageElement.src.includes('//:0');
  }
})();
