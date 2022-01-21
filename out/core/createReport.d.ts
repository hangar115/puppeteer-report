import { PDFDocument } from "pdf-lib";
export declare function createReport(baseDoc: PDFDocument, headersPdfBuffer: Uint8Array, firstHeaderHeight: number, secondHeaderHeight: number, footerHeight: number): Promise<Uint8Array>;
