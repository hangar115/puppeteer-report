"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfPage = exports.pdf = void 0;
const fs = __importStar(require("fs"));
const core = __importStar(require("./core"));
/**
 * Convert HTML file to PDF
 * @param browser puppeteer/puppeteer-core browser object
 * @param file full path of HTML file
 * @param options output PDF options
 * @returns PDF as an array of bytes
 */
async function pdf(browser, file, options) {
    const page = await browser.newPage();
    try {
        await page.goto("file:///" + file);
        return await pdfPage(page, options);
    }
    finally {
        await page.close();
    }
}
exports.pdf = pdf;
const docHeight = () => {
    const body = document.body;
    const html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
};
/**
 * Convert a Page to PDF
 * @param page puppeteer/puppeteer-core page object
 * @param options output PDF options
 * @returns PDF as an array of bytes
 */
async function pdfPage(page, options) {
    var _a, _b, _c, _d;
    const { path, ...pdfOptions } = options !== null && options !== void 0 ? options : {};
    const margin = {
        marginTop: (_b = (_a = pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.margin) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0,
        marginBottom: (_d = (_c = pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.margin) === null || _c === void 0 ? void 0 : _c.bottom) !== null && _d !== void 0 ? _d : 0,
    };
    const [getHeightFunc, getHeightArg] = core.getHeightEvaluator(margin.marginTop, margin.marginBottom, pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.scale);
    const { firstHeaderHeight, secondHeaderHeight, footerHeight } = await page.evaluate(getHeightFunc, getHeightArg);
    const [basePageEvalFunc, basePageEvalArg] = core.getBaseEvaluator(firstHeaderHeight, secondHeaderHeight, footerHeight);
    await page.evaluate(basePageEvalFunc, basePageEvalArg);
    const height = await page.evaluate(docHeight);
    let basePdfBuffer;
    if (pdfOptions.isOnePage) {
        pdfOptions.format = undefined;
        basePdfBuffer = await page.pdf({
            ...pdfOptions,
            height: `${height}px`,
        });
    }
    else {
        basePdfBuffer = await page.pdf(pdfOptions);
    }
    const [doc, headerEvalFunc, headerEvalArg] = await core.getHeadersEvaluator(basePdfBuffer);
    await page.evaluate(headerEvalFunc, headerEvalArg);
    let headerPdfBuffer;
    if (pdfOptions.isOnePage) {
        pdfOptions.format = undefined;
        headerPdfBuffer = await page.pdf({
            ...pdfOptions,
            height: `${height}px`,
        });
    }
    else {
        headerPdfBuffer = await page.pdf(pdfOptions);
    }
    const result = await core.createReport(doc, headerPdfBuffer, firstHeaderHeight, secondHeaderHeight, footerHeight);
    if (path) {
        await fs.promises.writeFile(path, result);
    }
    return result;
}
exports.pdfPage = pdfPage;
exports.default = { pdf, pdfPage };
