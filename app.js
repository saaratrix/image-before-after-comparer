import { ImageBeforeAfterComparisor } from './image-before-after-comparison.js';
(function () {
    let imageComparisonRoot;
    let beforeImageElement;
    let afterImageElement;
    let imageComparisor = new ImageBeforeAfterComparisor();
    window.addEventListener('DOMContentLoaded', () => {
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
        imageComparisor.tryAddImageComparison(imageComparisonRoot).then();
        beforeImageElement = beforeImage;
        afterImageElement = afterImage;
        const beforeContainer = document.querySelector('.image-selection-before');
        const afterContainer = document.querySelector('.image-selection-after');
        initImageSelection(beforeContainer, 'before');
        initImageSelection(afterContainer, 'after');
    });
    function setImageComparisonMaxHeight() {
        const imageComparisonElement = imageComparisonRoot.querySelector('.image-comparison');
        const selectionBounds = document.querySelector('.image-selection-container').getBoundingClientRect();
        // 8 px from the <main> padding.
        const height = selectionBounds.bottom + 8;
        imageComparisonElement.style.maxHeight = `calc(100vh - ${height}px)`;
    }
    function initImageSelection(container, type) {
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
    function tryShowComparer() {
        if (beforeImageElement.src.includes('//:0') || afterImageElement.src.includes('//:0')) {
            return;
        }
        imageComparisonRoot.hidden = false;
    }
})();
//# sourceMappingURL=app.js.map