!function () {
  window.addEventListener('load', () => {
    const start = performance.now();
    const worker = new Worker('imageProcessWorker.js');

    const info = document.createElement('p');
    document.body.appendChild(info);

    // Jamming to the response from the worker
    worker.onmessage = function(event) {
      console.log(event.data);

      info.innerHTML += `${event.data} <br>`;

      if (typeof event.data?.x === 'number') {
        console.log('template matching took:', performance.now() - start);
      }
    };

    worker.onerror = function(error) {
      console.error("Whoopsie-daisy! Web Worker went off-beat!", error);
    };

    console.log('starting webworker');

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    /**
     * @type {HTMLImageElement}
     */
    sourceImg = document.querySelector('#source_image')
    /**
     * @type {HTMLImageElement}
     */
    templateImg = document.querySelector('#template_image');

    const sourceImgData = context.getImageData(0, 0, sourceImg.naturalWidth, sourceImg.naturalHeight);
    const templateImgData = context.getImageData(0, 0, templateImg.naturalWidth, templateImg.naturalHeight);

    const test = performance.now();
    for (let y = 0; y < 435; y++) {
      for (let x = 0; x < 635; x++) {
      }
    }

    console.log('just iterating took', performance.now() - test);

    // Send data to the worker
    worker.postMessage({source: sourceImgData, template: templateImgData });
  });

}();