import "source-map-support/register";
import * as tfn  from "@tensorflow/tfjs-node";
import * as tf from "@tensorflow/tfjs";
import * as tfc from "@tensorflow/tfjs-converter";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { decodeImage } from "@tensorflow/tfjs-node/dist/image";
import { inspect } from "util";
import { Tensor } from "@tensorflow/tfjs";
import { createCanvas, Image, loadImage } from "canvas";
type Classes = {
  [x:number]: {
    name: string;
    id: number;
  };
};
interface ObjectDetected {
    class: number;
    label: string;
    score: any;
    bbox: number[];
  }

async function main(){
  const threshold = 0.75;
  // const model_path = resolve('../content/web_model/model.json');
  const model_path = resolve('../TFJS-object-detection/models/kangaroo-detector/model.json');
  const handler = tfn.io.fileSystem(model_path)
  const model = await tf.loadGraphModel(handler);
  // const model = await tfc.loadGraphModel('../TFJS-object-detection/models/kangaroo-detector/model.json');
  const image_path = '../images/test/234748227_2945713825680364_4835395179339315799_n.jpg';
  // const image_path = '../jumping-red-kangaroo-picture-id1183650397.jpg';
  // const model = await loadGraphModel(`file://${model_path}`);
  const  classesDir: Classes = {
    1: {
        name: 'Kangaroo',
        id: 1,
    },
    2: {
        name: 'Other',
        id: 2,
    }
}
  const imgBuffer = readFileSync(image_path);
  const img = decodeImage(imgBuffer);
  const [height,width] = img.shape;
  const tf_img = img.expandDims(0);
  // console.log({tf_img})
  const res = await model.executeAsync(tf_img) as Tensor[];
  const boxes = res[4].arraySync();
  const scores = res[5].arraySync();
  const classes = res[6].dataSync() as Int32Array;
  const detections = buildDetectedObjects(height,width, scores, threshold,boxes, classes, classesDir);
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const imgcvs = new Image();
  imgcvs.onload = () => ctx.drawImage(imgcvs, 0, 0);
  imgcvs.src = imgBuffer;
  const font = "16px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";

  detections.forEach(item => {
      const x = item['bbox'][0];
      const y = item['bbox'][1];
      const width = item['bbox'][2];
      const height = item['bbox'][3];

      // Draw the bounding box.
      ctx.strokeStyle = "#00FFFF";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, width, height);

      // Draw the label background.
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(item["label"] + " " + (100 * item["score"]).toFixed(2) + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4);
      ctx.fillStyle = "#000000";
      ctx.fillText(item["label"] + " " + (100*item["score"]).toFixed(2) + "%", x, y);
  })
  writeFileSync('../outs/predicted.jpg', canvas.toBuffer('image/jpeg'))
  
}
main().catch(e => console.error(e));
function buildDetectedObjects(height:number, width:number,scores:any, threshold: number, boxes:any, classes: Int32Array, classesDir: Classes) {
   const detectionObjects: ObjectDetected[] = []
    scores[0].forEach((score:number, i:number) => {
      if (score > threshold) {
        const bbox = [];
        const minY = boxes[0][i][0] * height;
        const minX = boxes[0][i][1] * width;
        const maxY = boxes[0][i][2] * height;
        const maxX = boxes[0][i][3] * width;
        bbox[0] = minX;
        bbox[1] = minY;
        bbox[2] = maxX - minX;
        bbox[3] = maxY - minY;
        // console.log(classes[i]);
        detectionObjects.push({
          class: classes[i],
          label: classesDir[classes[i]]?.name,
          score: score.toFixed(4),
          bbox: bbox
        })
      }
    })
    return detectionObjects
}

