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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
function pdf(browser, file, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield browser.newPage();
        try {
            yield page.goto("file:///" + file);
            return yield pdfPage(page, options);
        }
        finally {
            yield page.close();
        }
    });
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
function pdfPage(page, options) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const _e = options !== null && options !== void 0 ? options : {}, { path } = _e, pdfOptions = __rest(_e, ["path"]);
        const margin = {
            marginTop: (_b = (_a = pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.margin) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0,
            marginBottom: (_d = (_c = pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.margin) === null || _c === void 0 ? void 0 : _c.bottom) !== null && _d !== void 0 ? _d : 0,
        };
        const [getHeightFunc, getHeightArg] = core.getHeightEvaluator(margin.marginTop, margin.marginBottom, pdfOptions === null || pdfOptions === void 0 ? void 0 : pdfOptions.scale);
        const { firstHeaderHeight, secondHeaderHeight, footerHeight } = yield page.evaluate(getHeightFunc, getHeightArg);
        const [basePageEvalFunc, basePageEvalArg] = core.getBaseEvaluator(firstHeaderHeight, secondHeaderHeight, footerHeight);
        yield page.evaluate(basePageEvalFunc, basePageEvalArg);
        const height = yield page.evaluate(docHeight);
        let basePdfBuffer;
        if (pdfOptions.isOnePage) {
            pdfOptions.format = undefined;
            basePdfBuffer = yield page.pdf(Object.assign(Object.assign({}, pdfOptions), { height: `${height}px` }));
        }
        else {
            basePdfBuffer = yield page.pdf(pdfOptions);
        }
        const [doc, headerEvalFunc, headerEvalArg] = yield core.getHeadersEvaluator(basePdfBuffer);
        yield page.evaluate(headerEvalFunc, headerEvalArg);
        let headerPdfBuffer;
        if (pdfOptions.isOnePage) {
            pdfOptions.format = undefined;
            headerPdfBuffer = yield page.pdf(Object.assign(Object.assign({}, pdfOptions), { height: `${height}px` }));
        }
        else {
            headerPdfBuffer = yield page.pdf(pdfOptions);
        }
        const result = yield core.createReport(doc, headerPdfBuffer, firstHeaderHeight, secondHeaderHeight, footerHeight);
        if (path) {
            yield fs.promises.writeFile(path, result);
        }
        return result;
    });
}
exports.pdfPage = pdfPage;
exports.default = { pdf, pdfPage };
