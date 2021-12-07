import { lstatSync, readdirSync } from "fs";
import * as Jimp from "jimp";
import { dirname, join, resolve } from "path";

export async function imageSplit(imagePath:string, h:number, w:number) {
  const img = await Jimp.read(imagePath);
  const wimg = img.bitmap.width;
  const himg = img.bitmap.height;
  const slicex = Math.ceil(wimg / w);
  const slicey = Math.ceil(himg / h);
  const slices = [];
  let yStart = 0;
  for (let index = 0; index < slicey; index++) {
      let xStart = 0;
      for (let wi = 0; wi < slicex; wi++) {
          const imgcln = img.clone();
          slices.push(imgcln.crop(xStart, yStart, Math.min(w, wimg - xStart), Math.min(h, himg - yStart)));
          xStart += w;
      }
      yStart += h;
  }
  const dirPath = dirname(imagePath);
  const [name, ...ext] = resolve(imagePath).replace(dirPath, '').replace(/\//g, '').split('.');
  
  await Promise.all(slices.map((it, i) => it.writeAsync(join(dirPath, `split_${name}_${i}.${ext.join('.')}`))))
        
}
async function  main() {
  const base_path = resolve('../images2');
  const dirImgs = readdirSync(base_path);
  for (const folder of dirImgs) {
    const folderPath = join(base_path, folder);
      if (lstatSync(folderPath).isDirectory()) {
          const imgInForlder = readdirSync(folderPath);
          for (const imgFile of imgInForlder) {
            const imagePath = join(folderPath, imgFile);
            await imageSplit(imagePath, 250, 250);
          }
      } 
  }
}
main();