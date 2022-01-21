import { PDFDocument } from "pdf-lib";
export declare function getHeightEvaluator(marginTop: number | string, marginBottom: number | string, scale?: number): [pageFunc: ({ marginTop, marginBottom, scale }: {
    marginTop: string;
    marginBottom: string;
    scale: number;
}) => {
    firstHeaderHeight: number;
    secondHeaderHeight: number;
    footerHeight: number;
}, argument: {
    marginTop: string;
    marginBottom: string;
    scale: number;
}];
export declare function getBaseEvaluator(firstHeaderHeight: number, secondHeaderHeight: number, footerHeight: number): [pageFunc: ({ firstHeaderHeight, secondHeaderHeight, footerHeight, }: {
    firstHeaderHeight: number;
    secondHeaderHeight: number;
    footerHeight: number;
}) => void, argument: {
    firstHeaderHeight: number;
    secondHeaderHeight: number;
    footerHeight: number;
}];
export declare function getHeadersEvaluator(basePdfBuffer: Uint8Array): Promise<[doc: PDFDocument, pageFunc: ({ pagesCount }: {
    pagesCount: number;
}) => void, argument: {
    pagesCount: number;
}]>;
