
function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';

  cv['onRuntimeInitialized']=()=>{
    const sourceImageElement = document.getElementById('source_image');
    const templateImage = document.getElementById('template_image');
    // resizeTemplate(sourceImageElement, templateImage);

    requestAnimationFrame(() => {
      const maxPoint = getMatches('source_image','template_image');
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
    });
  };
}

function resizeTemplate(source, template) {
    // Create a new canvas and context
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Get the dimensions of the source image
    let sourceWidth = source.width;
    let sourceHeight = source.height;

    // Set the canvas dimensions to be the same as the source image
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    // Draw the template image onto the canvas, resizing it to fit
    ctx.drawImage(template, 0, 0, template.width, template.height);

    // Convert the canvas image to a data URL
    let resizedTemplateDataURL = canvas.toDataURL();

    // Create a new Image object for the resized template
    template.src = resizedTemplateDataURL;
}

function getMatches(aSource, bSource) {
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
    } catch(e) {
      console.log('error when matching', e.message, e);
    }


    let dx = 0;
    let dy = 0;

    let goodMatches = 0;

    for (let i = 0; i < matches.size(); ++i) {
        let match = matches.get(i);

        if (match.distance > 1) {
          continue;
        }

      console.log(match.distance);

        let pt1 = keypoints1.get(match.queryIdx).pt;
        let pt2 = keypoints2.get(match.trainIdx).pt;

        dx += pt2.x - pt1.x;
        dy += pt2.y - pt1.y;
        goodMatches++;
    }
    dx /= goodMatches;
    dy /= goodMatches;

    return { x: -dx, y: -dy };
}