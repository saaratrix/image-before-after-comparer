function templateMatching(sourceImgData, templateImgData) {


    let bestScore = Number.MAX_VALUE;
    let bestPosition = { x: 0, y: 0 };

    const dimensions = {
      sourceWidth : sourceImgData.width,
      sourceHeight: sourceImgData.height,

      templateWidth: templateImgData.width,
      templateHeight : templateImgData.height,
    }

    const sourceColors = setCachedColours(sourceImgData.data, dimensions.sourceWidth, dimensions.sourceHeight);
    const templateColours = setCachedColours(templateImgData.data, dimensions.templateWidth, dimensions.templateHeight);

    for (let y = 0; y <= dimensions.sourceHeight; y++) {
      const start = performance.now();

      for (let x = 0; x <= dimensions.sourceWidth; x++) {
        const score = getTemplateScore(sourceColors, templateColours, x, y, dimensions);

        if (score < bestScore) {
          bestScore = score;
          bestPosition = { x: x, y: y };
        }
      }

      self.postMessage(`${y}, score ${bestScore} took ${performance.now() - start}`);
    }

    return bestPosition;
  }

/**
 *
 * @param {Uint8ClampedArray} imgData
 * @param {number} width
 * @param {number} height
 * @returns {Uint32Array}
 */
function setCachedColours(imgData, width, height) {
    const colors = new Uint32Array(imgData.length / 4);
    for (let y = 0; y < height; y++) {

      const yOffset = y * width;
      for (let x = 0; x < width; x++) {
        const colorIndex = (yOffset + x);
        const dataIndex = colorIndex * 4;

        const r = imgData[dataIndex];
        const g = imgData[dataIndex + 1];
        const b = imgData[dataIndex + 2];

        const combined = (r << 16) | (g << 8) | b;
        colors[colorIndex] = combined;
      }
    }

    return colors;
  }

  function getTemplateScore(templateColours, sourceColours, srcX, srcY, dimensions) {
    let score = 0;
    let pixelsChecked = 0;
    const channels = 3;

    const { sourceWidth, sourceHeight, templateWidth, templateHeight } = dimensions;

    for (let ty = 0; ty < 345; ty++) {
      const y = srcY + ty;

      if (y >= sourceHeight) {
        break;
      }

      let sourcePixelIndex = y * sourceWidth;
      let templatePixelIndex = ty * templateWidth;

      for (let tx = 0; tx < 635; tx++) {
        const x = srcX + tx;
        if (x >= sourceWidth) {
          break;
        }

        score += Math.abs(sourceColours[sourcePixelIndex] - templateColours[templatePixelIndex]);
        sourcePixelIndex++;
        templatePixelIndex++;
        pixelsChecked++;
      }
    }

    if (pixelsChecked == 0) {
      return Number.MAX_VALUE;
    }

    return score / pixelsChecked;
  }

self.onmessage = function(event) {
  const { source, template } = event.data;

  let score = templateMatching(source, template);

  // Send the tune back to the main stage
  self.postMessage(score);
};