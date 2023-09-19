
function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';

  cv['onRuntimeInitialized']=()=>{
    const sourceImageElement = document.getElementById('source_image');
    const templateImageElement = document.getElementById('template_image');

    while (sourceImageElement.width <= templateImageElement.width) {
      resizeImage(sourceImageElement);
    }

    let sourceImage = cv.imread(sourceImageElement);
    let templateImage = cv.imread(templateImageElement);

    let dst = new cv.Mat();
    let mask = new cv.Mat();
    cv.matchTemplate(sourceImage, templateImage, dst, cv.TM_CCOEFF, mask);
    let result = cv.minMaxLoc(dst, mask);
    let maxPoint = result.maxLoc;
    console.log("Point of maximum correlation: ", maxPoint.x, maxPoint.y);
    sourceImage.delete(); templateImage.delete(); dst.delete(); mask.delete();

    const div = document.createElement('div');
    div.style.width = '5px';
    div.style.height = '5px';
    div.style.background = 'pink';
    div.style.position = 'absolute';
    div.style.left = `${sourceImageElement.offsetLeft + maxPoint.x}px`; // adjust according to the offset of the image
    div.style.top = `${sourceImageElement.offsetTop + maxPoint.y}px`; // adjust according to the offset of the image

    const template = document.getElementById('templateWrapper');
    template.style.position = 'absolute';
    template.style.left = `${sourceImageElement.offsetLeft + maxPoint.x}px`;
    template.style.top = `${sourceImageElement.offsetTop + maxPoint.y}px`;

    document.body.appendChild(div);
  };
}

function resizeImage(source) {
    // Create a new canvas and context
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Get the dimensions of the source image
    let sourceWidth = source.width * 2;
    let sourceHeight = source.height * 2;

    // Set the canvas dimensions to be the same as the source image
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Draw the template image onto the canvas, resizing it to fit
    ctx.drawImage(source, 0, 0, source.width, source.height);

    // Convert the canvas image to a data URL
    let resizedTemplateDataURL = canvas.toDataURL();


    // Create a new Image object for the resized template
    source.src = resizedTemplateDataURL;

    source.width = sourceWidth;
    source.height = sourceHeight;
}
