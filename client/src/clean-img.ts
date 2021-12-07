import { readdirSync, lstatSync, rmSync } from "fs";
import { join,resolve } from "path";

async function  main() {
  const filePaths: string[] = [];
  const base_path = resolve('../images2');
  const dirImgs = readdirSync(base_path);
  for (const folder of dirImgs) {
    const folderPath = join(base_path, folder);
      if (lstatSync(folderPath).isDirectory()) {
          const imgInForlder = readdirSync(folderPath);
          for (const imgFile of imgInForlder) {
            filePaths.push(join(folderPath, imgFile));
          }
      } 
  }
  const [imgFiles, xmlFiles] = filePaths.reduce((prev, it) => {
    const index = it.endsWith('.xml') ? 1 : 0;
    prev[index].push(it);
    return prev;
  }, [[],[]] as [string[], string[]]);
  for (const imgFile of imgFiles ) {
    const xmlfile = imgFile.replace(/\.(jpg)$/g, '.xml');
    if(xmlFiles.indexOf(xmlfile)< 0){
      // console.log({xmlfile, imgFile})
      rmSync(imgFile);
    }
  }
}
main();