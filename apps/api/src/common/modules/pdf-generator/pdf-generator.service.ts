import { Injectable } from '@nestjs/common';
// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Register fonts globally when the module loads
// This ensures fonts are available for all PDF generations
// (pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
// (pdfMake as any).fonts = {
//   Roboto: {
//     normal: 'Roboto-Regular.ttf',
//     bold: 'Roboto-Medium.ttf',
//     italics: 'Roboto-Italics.ttf',
//     bolditalics: 'Roboto-MediumItalics.ttf'
//   }
// };

@Injectable()
export class PdfGeneratorService {
  // async generatePdf(docDefinition: any): Promise<Buffer> {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const pdfDoc = pdfMake.createPdf(docDefinition);
  //       pdfDoc.getBuffer((buffer) => {
  //         resolve(buffer);
  //       });
  //     } catch (error) {
  //       reject(error); // Catch synchronous errors from createPdf
  //     }
  //   });
  // }
}
