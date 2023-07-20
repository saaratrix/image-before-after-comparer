export class ImagePositionAdjuster {
    static isRuntimeInitialized = false;
    isOpenCvInitialized = false;
    loadingCv;
    initialize() {
        if (this.loadingCv) {
            return this.loadingCv;
        }
        this.loadingCv = this.getOpenCVScriptLoadedPromise()
            .then(() => this.waitForRuntimeInitialized())
            .then(() => { this.isOpenCvInitialized = true; });
        return this.loadingCv;
    }
    getOpenCVScriptLoadedPromise() {
        let scriptElement = document.querySelector('script[src="https://docs.opencv.org/master/opencv.js"]');
        if (scriptElement) {
            if (scriptElement.dataset.isLoaded === 'true') {
                return Promise.resolve();
            }
            return new Promise(res => {
                scriptElement.addEventListener('load', () => {
                    console.log('load from existing tag');
                    scriptElement.dataset.isLoaded = 'true';
                    res();
                });
            });
        }
        return new Promise(res => {
            scriptElement = document.createElement('script');
            scriptElement.src = "https://docs.opencv.org/master/opencv.js";
            scriptElement.addEventListener('load', () => {
                console.log('load from new tag');
                res();
            });
            document.body.appendChild(scriptElement);
        });
    }
    waitForRuntimeInitialized() {
        if (ImagePositionAdjuster.isRuntimeInitialized) {
            return Promise.resolve();
        }
        return new Promise(res => {
            cv['onRuntimeInitialized'] = () => {
                console.log('onRuntimeInitialized!!');
                ImagePositionAdjuster.isRuntimeInitialized = true;
                res();
            };
        });
    }
    getMatch(aSource, bSource) {
        if (this.isOpenCvInitialized) {
            throw new Error(`OpenCV.js has not been initialized yet. First run ${this.initialize.name}`);
        }
        const a = cv.imread(aSource);
        const b = cv.imread(bSource);
        const dst = new cv.Mat();
        const mask = new cv.Mat();
        cv.matchTemplate(a, b, dst, cv.TM_CCOEFF, mask);
        let result = cv.minMaxLoc(dst, mask);
        let maxPoint = result.maxLoc;
        console.log("Point of maximum correlation: ", maxPoint.x, maxPoint.y);
        a.delete();
        b.delete();
        dst.delete();
        mask.delete();
        return maxPoint;
    }
}
//# sourceMappingURL=image-position-adjuster.js.map