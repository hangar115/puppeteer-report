import * as fs from "fs";
import * as core from "./core";
import type { Page, Browser, PDFOptions } from "./types";

/**
 * Convert HTML file to PDF
 * @param browser puppeteer/puppeteer-core browser object
 * @param file full path of HTML file
 * @param options output PDF options
 * @returns PDF as an array of bytes
 */
async function pdf(browser: Browser, file: string, options?: PDFOptions) {
  const page = await browser.newPage();
  try {
    await page.goto("file:///" + file);

    return await pdfPage(page, options);
  } finally {
    await page.close();
  }
}

const docHeight = () => {
  const body = document.body;
  const html = document.documentElement;
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );
};

/**
 * Convert a Page to PDF
 * @param page puppeteer/puppeteer-core page object
 * @param options output PDF options
 * @returns PDF as an array of bytes
 */
async function pdfPage(page: Page, options?: PDFOptions): Promise<Uint8Array> {
  const { path, ...pdfOptions } = options ?? {};
  const margin = {
    marginTop: pdfOptions?.margin?.top ?? 0,
    marginBottom: pdfOptions?.margin?.bottom ?? 0,
  };

  const [getHeightFunc, getHeightArg] = core.getHeightEvaluator(
    margin.marginTop,
    margin.marginBottom,
    pdfOptions?.scale
  );

  const { firstHeaderHeight, secondHeaderHeight, footerHeight } =
    await page.evaluate(getHeightFunc, getHeightArg);

  const [basePageEvalFunc, basePageEvalArg] = core.getBaseEvaluator(
    firstHeaderHeight,
    secondHeaderHeight,
    footerHeight
  );
  await page.evaluate(basePageEvalFunc, basePageEvalArg);
  const height = await page.evaluate(docHeight);

  let basePdfBuffer;
  if (pdfOptions.isOnePage) {
    pdfOptions.format = undefined;
    basePdfBuffer = await page.pdf({
      ...pdfOptions,
      height: `${height}px`,
    });
  } else {
    basePdfBuffer = await page.pdf(pdfOptions);
  }

  const [doc, headerEvalFunc, headerEvalArg] = await core.getHeadersEvaluator(
    basePdfBuffer
  );
  await page.evaluate(headerEvalFunc, headerEvalArg);

  let headerPdfBuffer;
  if (pdfOptions.isOnePage) {
    pdfOptions.format = undefined;
    headerPdfBuffer = await page.pdf({
      ...pdfOptions,
      height: `${height}px`,
    });
  } else {
    headerPdfBuffer = await page.pdf(pdfOptions);
  }

  const result = await core.createReport(
    doc,
    headerPdfBuffer,
    firstHeaderHeight,
    secondHeaderHeight,
    footerHeight
  );

  if (path) {
    await fs.promises.writeFile(path, result);
  }

  return result;
}

export { pdf, pdfPage };
export default { pdf, pdfPage };
