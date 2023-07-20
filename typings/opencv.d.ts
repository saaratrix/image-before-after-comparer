interface Mat {
    new (): Mat;
    delete(): void;
    // Other methods and properties...
}

interface ImageArray {
    delete(): void;
}

type MatchTemplateTypes = 0 | 1 | 2 | 3 | 4 | 5;

interface Point {
    x: number;
    y: number;
    // Other properties...
}

interface MinMaxLocResult {
    maxLoc: Point;
    // Other properties...
}

interface OpenCV {
    onRuntimeInitialized: () => void;
    /**
     *
     * @param imageSource canvas element or id, or img element or id.
     */
    imread: (imageSource: HTMLCanvasElement | HTMLImageElement | string) => ImageArray;
    Mat: Mat;

    TM_SQDIF: 0;
    TM_SQDIFF_NORMED: 1;
    TM_CCORR: 2;
    TM_CCORR_NORMED: 3;
    TM_CCOEFF: 4;
    TM_CCOEFF_NORMED: 5;

    // Link to TemplateMatchMode: https://docs.opencv.org/3.4/df/dfb/group__imgproc__object.html#ga3a7850640f1fe1f58fe91a2d7583695d
    /**
     *
     * @param image image where the search is running. It must be 8-bit or 32-bit floating-point.
     * @param template searched template. It must be not greater than the source image and have the same data type.
     * @param result map of comparison results. It must be single-channel 32-bit floating-point.
     * @param method parameter specifying the comparison method(see cv.TemplateMatchModes).
     * @param mask mask of searched template. It must have the same datatype and size with templ. It is not set by default.
     */
    matchTemplate: (image: ImageArray, template: ImageArray, result: Mat, method: MatchTemplateTypes, mask: Mat) => void;
    minMaxLoc(src: Mat, mask?: Mat): MinMaxLocResult;
}

declare var cv: OpenCV;