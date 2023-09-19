import { ImageTemplateRequestEvent, imageTemplateRequestEvent } from './models/events.js';

export class ImagePositionAdjuster {
    static isRuntimeInitialized = false;

    private isOpenCvInitialized = false;
    loadingCv: Promise<void> | undefined;

    public initialize(): Promise<void> {
        if (this.loadingCv) {
            return this.loadingCv;
        }

        this.loadingCv = this.getOpenCVScriptLoadedPromise()
            .then(() => this.waitForRuntimeInitialized())
            .then(() => {
                this.isOpenCvInitialized = true
            });

        document.addEventListener(imageTemplateRequestEvent, (event) => this.onTemplateRequest(event as CustomEvent));
        return this.loadingCv;
    }

    private getOpenCVScriptLoadedPromise(): Promise<void> {
        let scriptElement = document.querySelector<HTMLScriptElement>('script[src="https://docs.opencv.org/master/opencv.js"]');
        if (scriptElement) {
            if (scriptElement.dataset.isLoaded === 'true') {
                return Promise.resolve();
            }

            return new Promise(res => {
                scriptElement!.addEventListener('load', () => {
                    console.log('load from existing tag');
                    scriptElement!.dataset.isLoaded = 'true';
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

    private waitForRuntimeInitialized(): Promise<void> {
        if (ImagePositionAdjuster.isRuntimeInitialized) {
            return Promise.resolve();
        }

        return new Promise(res => {
            cv['onRuntimeInitialized'] = ()=>{
                console.log('onRuntimeInitialized!!');
                ImagePositionAdjuster.isRuntimeInitialized = true;
                res();
            };
        });
    }

    private onTemplateRequest = (event: CustomEvent<ImageTemplateRequestEvent>): void => {
        if (!event.detail.data) {
            console.log('No valid data for template request.');
            return;
        }

        const { a, b } = event.detail.data;

        event.detail.pending = new Promise((resolve) => {
            const point = this.getMatches(a, b);//this.getTemplateMatch(a, b);
            resolve(point);
        });
    }

    public getMatches(aSource: HTMLImageElement, bSource: HTMLImageElement): Point {
        let orb = new cv.ORB();
        let bf = new cv.BFMatcher(cv.NORM_HAMMING, true);

        // Convert images to grayscale
        let mat1 = cv.imread(aSource);
        let mat2 = cv.imread(bSource);
        cv.cvtColor(mat1, mat1, cv.COLOR_RGBA2GRAY, 0);
        cv.cvtColor(mat2, mat2, cv.COLOR_RGBA2GRAY, 0);

        // Detect keypoints and compute descriptors for each image
        let keypoints1 = new cv.KeyPointVector();
        let keypoints2 = new cv.KeyPointVector();
        let descriptors1 = new cv.Mat();
        let descriptors2 = new cv.Mat();
        orb.detectAndCompute(mat1, new cv.Mat(), keypoints1, descriptors1);
        orb.detectAndCompute(mat2, new cv.Mat(), keypoints2, descriptors2);

        // Match the descriptors
        let matches = new cv.DMatchVector();
        try {
          bf.match(descriptors1, descriptors2, matches);
        } catch(e: any) {
          console.log('error when matching', e.message, e);
        }

        let dx = 0;
        let dy = 0;

        let goodMatches = 0;

        for (let i = 0; i < matches.size(); ++i) {
            let match = matches.get(i);

            if (match.distance > 5) {
              continue;
            }

          console.log(match.distance);

            let pt1 = keypoints1.get(match.queryIdx).pt;
            let pt2 = keypoints2.get(match.trainIdx).pt;

            dx += pt2.x - pt1.x;
            dy += pt2.y - pt1.y;
            goodMatches++;
        }

        if (goodMatches === 0) {
            return {x: 0, y: 0 };
        }

        dx /= goodMatches;
        dy /= goodMatches;

        return { x: -dx, y: -dy };
    }
}