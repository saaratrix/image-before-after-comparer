import { ImageComparator } from './image-comparator.js';
import { ImagePositionAdjuster } from './image-position-adjuster.js';
import { ImageAligner } from "./image-aligner.js";
(function () {
    let imageComparisonRoot;
    let beforeImageElement;
    let afterImageElement;
    let positionAdjuster = new ImagePositionAdjuster();
    let imageComparator = new ImageComparator();
    let imageAligner = new ImageAligner();
    window.addEventListener('DOMContentLoaded', async () => {
        imageComparisonRoot = document.querySelector('.image-comparison-container');
        if (!imageComparisonRoot) {
            console.log('missing image comparison container');
            return;
        }
        const beforeImage = document.querySelector('.image-comparison-before img');
        const afterImage = document.querySelector('.image-comparison-after img');
        if (!beforeImage || !afterImage) {
            console.log('missing before or after image');
            return;
        }
        setImageComparisonMaxHeight();
        imageComparator.tryAddImageComparison(imageComparisonRoot).then();
        beforeImageElement = beforeImage;
        afterImageElement = afterImage;
        const beforeContainer = document.querySelector('.image-selection-before');
        const afterContainer = document.querySelector('.image-selection-after');
        initializeImageSelection(beforeContainer, 'before');
        initializeImageSelection(afterContainer, 'after');
        imageAligner.initialize();
        await positionAdjuster.initialize();
        listenForImageDataRequest();
        trySetInitialImageUrls(beforeContainer, afterContainer);
    });
    const listenForImageDataRequest = () => {
        document.addEventListener('image:data:request', (event) => {
            if (!areImagesValid()) {
                return;
            }
            imageAligner.handleImageDataRequest(event, beforeImageElement, afterImageElement);
        });
    };
    function setImageComparisonMaxHeight() {
        const imageComparisonElement = imageComparisonRoot.querySelector('.image-comparison');
        const selectionBounds = document.querySelector('.image-settings-container').getBoundingClientRect();
        // 8 px from the <main> padding.
        const height = selectionBounds.bottom + 8;
        imageComparisonElement.style.maxHeight = `calc(100vh - ${height}px)`;
    }
    function initializeImageSelection(container, type) {
        if (!container) {
            console.log('missing container');
            return;
        }
        const targetImage = type === 'before' ? beforeImageElement : afterImageElement;
        initUrlSelection(container, targetImage);
        initFileSelection(container, targetImage);
    }
    function initUrlSelection(container, targetImage) {
        const urlSelection = container.querySelector('.url-selection');
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
    function initFileSelection(container, targetImage) {
        const fileSelection = container.querySelector('.file-selection');
        if (!fileSelection) {
            console.log('missing url selection');
            return;
        }
        fileSelection.addEventListener('change', (event) => handleFileSelection(event, targetImage));
    }
    function handleFileSelection(event, targetImage) {
        const target = event.target;
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
            targetImage.src = fr.result;
            tryShowComparer();
        };
        fr.onerror = () => {
            console.error('failed to load image');
        };
        fr.readAsDataURL(file);
    }
    function trySetInitialImageUrls(beforeContainer, afterContainer) {
        const url = new URL(location.href);
        const beforeUri = decodeImageUri(url, 'before');
        const afterUri = decodeImageUri(url, 'after');
        const beforeUrlSelection = beforeContainer?.querySelector('.url-selection');
        const afterUrlSelection = afterContainer?.querySelector('.url-selection');
        let shouldTryShowComparer = false;
        if (beforeUri || afterUri) {
            const cancel = confirm(`Do you want to load images: \n${beforeUri}\n${afterUri}`);
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
    function decodeImageUri(url, key) {
        const uri = url.searchParams.has(key) ? decodeURI(url.searchParams.get(key)) : '';
        // Base64 is currently not supported.
        if (uri.startsWith('data:')) {
            return '';
        }
        return uri;
    }
    function tryUpdateQueryParams() {
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
    function canUpdateQueryParams() {
        if (beforeImageElement.src.includes('//:0') || afterImageElement.src.includes('//:0')) {
            return false;
        }
        // Base64 is currently not supported.
        if (beforeImageElement.src.startsWith('data:') || afterImageElement.src.startsWith('data:')) {
            return false;
        }
        return true;
    }
    function tryShowComparer() {
        tryUpdateQueryParams();
        if (areImagesValid()) {
            return;
        }
        imageComparisonRoot.hidden = false;
    }
    function areImagesValid() {
        return !beforeImageElement.src.includes('//:0') && !afterImageElement.src.includes('//:0');
    }
})();
//# sourceMappingURL=app.js.map