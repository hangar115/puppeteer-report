"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = void 0;
const pdf_lib_1 = require("pdf-lib");
function createReport(baseDoc, headersPdfBuffer, firstHeaderHeight, secondHeaderHeight, footerHeight) {
    return __awaiter(this, void 0, void 0, function* () {
        const headerDoc = yield pdf_lib_1.PDFDocument.load(headersPdfBuffer);
        const basePages = baseDoc.getPages();
        const headerPages = headerDoc.getPages();
        const hasBoth = (!!firstHeaderHeight || !!secondHeaderHeight) && !!footerHeight;
        // get pages dimensions
        const x = basePages[0].getWidth();
        const y = basePages[0].getHeight();
        // 1 inch = 96 px
        // PDF unit =  inch * 72/1
        const pdfFirstHeaderHeight = (firstHeaderHeight / 96) * 72;
        const pdfSecondHeaderHeight = (secondHeaderHeight / 96) * 72;
        const pdfFooterHeight = (footerHeight / 96) * 72;
        // embed all headers pdf pages in the base pdf
        const pages = [];
        const boxes = [];
        for (let i = 1; i <= headerPages.length; i++) {
            pages.push(headerPages[i - 1]);
            const isOdd = i % 2 != 0;
            // have only header or
            // have both header and footer and we are in odd pages
            // 1, 3, 5, etc
            if (i == 1) {
                if (pdfFirstHeaderHeight && (!hasBoth || isOdd)) {
                    boxes.push({
                        bottom: y - firstHeaderHeight + 24,
                        left: 0,
                        right: x,
                        top: y,
                    });
                }
            }
            else {
                if (pdfSecondHeaderHeight && (!hasBoth || isOdd)) {
                    boxes.push({
                        bottom: y - secondHeaderHeight,
                        left: 0,
                        right: x,
                        top: y,
                    });
                }
            }
            // have only footer or
            // have both header and footer and we are in plural pages
            // 2, 4, 6, etc
            if (footerHeight && (!hasBoth || !isOdd)) {
                boxes.push({
                    bottom: y - pdfFooterHeight,
                    left: 0,
                    right: x,
                    top: y,
                });
            }
        }
        const embeddedPages = yield baseDoc.embedPages(pages, boxes);
        // draw headers and/or footers over the base pages
        let baseIndex = 0;
        for (let i = 1; i <= headerPages.length; i++) {
            const embeddedPage = embeddedPages[i - 1];
            const size = embeddedPage.size();
            const isOdd = i % 2 != 0;
            if (i == 1) {
                if (firstHeaderHeight && (!hasBoth || isOdd)) {
                    basePages[baseIndex].drawPage(embeddedPage, Object.assign(Object.assign({}, size), { x: x - size.width, y: y - size.height, blendMode: pdf_lib_1.BlendMode.Multiply }));
                }
            }
            else {
                if (secondHeaderHeight && (!hasBoth || isOdd)) {
                    basePages[baseIndex].drawPage(embeddedPage, Object.assign(Object.assign({}, size), { x: x - size.width, y: y - size.height, blendMode: pdf_lib_1.BlendMode.Multiply }));
                }
            }
            if (footerHeight && (!hasBoth || !isOdd)) {
                basePages[baseIndex].drawPage(embeddedPage, Object.assign(Object.assign({}, size), { x: x - size.width, y: 0, blendMode: pdf_lib_1.BlendMode.Multiply }));
            }
            // when we have both header and footer
            // two pages of headers pdf belong to one page of the base doc
            //  ------------
            // |  header 1  |
            // |            |        ------------
            // |            |       |  header 1  |
            //  ------------     => | xxxxxxxxxx |
            // |  footer 1  |       |  footer 1  |
            // |            |        ------------
            // |            |
            if (hasBoth && !isOdd) {
                baseIndex++;
            }
            else if (!hasBoth) {
                baseIndex++;
            }
        }
        return yield baseDoc.save();
    });
}
exports.createReport = createReport;
