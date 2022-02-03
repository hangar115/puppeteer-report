import { PDFDocument } from "pdf-lib";

// get header and/or footer height from html
export function getHeightEvaluator(
  marginTop: number | string,
  marginBottom: number | string,
  scale?: number
) {
  const normalizeMargin = (margin: number | string) => {
    if (typeof margin == "number") {
      return margin + "px";
    }

    return margin;
  };

  const argument = {
    marginTop: normalizeMargin(marginTop),
    marginBottom: normalizeMargin(marginBottom),
    scale: scale ?? 1,
  };
  type ArgumentType = typeof argument;

  const pageFunc = ({ marginTop, marginBottom, scale }: ArgumentType) => {
    // get element height include margins
    const getHeight = (element: HTMLElement | null) => {
      if (element) {
        const styles = window.getComputedStyle(element);
        const margin =
          parseFloat(styles["marginTop"]) + parseFloat(styles["marginBottom"]);

        // change position to ignore margin collapse
        const position = element.style.position;
        element.style.position = "absolute";

        const height = element.offsetHeight + margin;

        // reset element position
        element.style.position = position;

        return Math.ceil(height * scale);
      }
      return 0;
    };

    const firstHeader = document.getElementById("first-header");
    const secondHeader = document.getElementById("second-header");
    const footer = document.getElementById("footer");

    // inject a style sheet
    const styleEl = document.createElement("style");
    styleEl.setAttribute("id", "header__style");
    document.head.appendChild(styleEl);
    const styleSheet = styleEl.sheet!;

    // to respect user-defined PDF margins,
    if (firstHeader) {
      styleSheet.insertRule(`#first-header { margin-top: ${marginTop}`);
    }
    if (secondHeader) {
      styleSheet.insertRule(`#second-header { margin-top: ${marginTop}`);
    }
    if (footer) {
      styleSheet.insertRule(`#footer { margin-bottom: ${marginBottom}`);
    }

    const firstHeaderHeight = getHeight(firstHeader);
    const secondHeaderHeight = getHeight(secondHeader);
    const footerHeight = getHeight(footer);

    return { firstHeaderHeight, secondHeaderHeight, footerHeight };
  };

  return [pageFunc, argument] as [
    pageFunc: typeof pageFunc,
    argument: ArgumentType
  ];
}

// remove header and footer from HTML content to create
// base doc pdf, for reserving the space for header and/or footer
// we inject a @page top/bottom margin
//  ------------
// |   header   |
// | xxxxxxxxxx |
// | xxxxxxxxxx |
//      ...
// | xxxxxxxxxx |
// |   footer   |
// to:
//  ------------
// |            |
// | xxxxxxxxxx |
// |            |
//  ------------
// |            |
// | xxxxxxxxxx |
// |            |
//  ------------
// |            |
//      ...
export function getBaseEvaluator(
  firstHeaderHeight: number,
  secondHeaderHeight: number,
  footerHeight: number
) {
  const argument = { firstHeaderHeight, secondHeaderHeight, footerHeight };
  type ArgumentType = typeof argument;

  const pageFunc = ({
    firstHeaderHeight,
    secondHeaderHeight,
    footerHeight,
  }: ArgumentType) => {
    const firstHeader = document.getElementById("first-header");
    const secondHeader = document.getElementById("second-header");
    const footer = document.getElementById("footer");

    // reset body margin
    document.body.style.margin = "0";

    // inject a style sheet
    const styleEl = document.createElement("style");
    styleEl.setAttribute("id", "page__style");
    document.head.appendChild(styleEl);
    const styleSheet = styleEl.sheet!;

    // hide the element and add the height of it
    // as page margin
    const evaluate = (
      element: HTMLElement | null,
      height: number,
      isTop: boolean
    ) => {
      if (element) {
        element.style.display = "none";

        if (isTop) {
          styleSheet.insertRule(`@page { margin-top: ${height}px}`);
        } else {
          styleSheet.insertRule(`@page { margin-bottom: ${height}px}`);
        }
      }
    };

    evaluate(firstHeader, firstHeaderHeight, true);
    evaluate(secondHeader, secondHeaderHeight, true);
    evaluate(footer, footerHeight, false);
  };

  return [pageFunc, argument] as [
    pageFunc: typeof pageFunc,
    argument: ArgumentType
  ];
}

// convert HTML content to a header/footer only pages, for each base doc's pages.
// if you have both headers and footers the output pdf pages will be:
// page = base doc's pages * 2
//  ------------
// |  header 1  |
// |            |
// |            |
//  ------------
// |  footer 1  |
// |            |
// |            |
//  ------------
// |  header 2  |
//       ...
export async function getHeadersEvaluator(basePdfBuffer: Uint8Array) {
  const doc = await PDFDocument.load(basePdfBuffer);
  const argument = { pagesCount: doc.getPageCount() };
  type ArgumentType = typeof argument;

  const pageFunc = ({ pagesCount }: ArgumentType) => {
    // set a value for all selected elements
    const setElementsValue = (
      elements: HTMLCollectionOf<Element>,
      value: string
    ) => {
      for (const element of elements) {
        element.textContent = value;
      }
    };

    const resetStyle = (element: HTMLElement | null) => {
      if (element) {
        element.style.display = "block";
      }
    };

    // add a page break after each element
    const addPageBreak = () => {
      const pageBreak = document.createElement("div");
      pageBreak.style.pageBreakAfter = "always";
      document.body.appendChild(pageBreak);
    };

    // duplicate an element in the page
    const cloneElement = (element: HTMLElement, pageNumber: string) => {
      const cloned = element.cloneNode(true) as Document;

      // fill pageNumber
      const pageNumberElements = cloned.getElementsByClassName("pageNumber");
      setElementsValue(pageNumberElements, pageNumber);

      // fill total page
      const totalPagesElements = cloned.getElementsByClassName("totalPages");
      setElementsValue(totalPagesElements, pagesCount.toString());

      // fill disclosure page numbers
      const disclosurePageNum = pagesCount - 1;
      const disclosurePageElements =
        cloned.getElementsByClassName("disclosurePage");
      setElementsValue(disclosurePageElements, disclosurePageNum.toString());

      const disclosureTextElements =
        cloned.querySelectorAll<HTMLElement>(".disclosureText");
      if (parseInt(pageNumber, 10) > 1) {
        for (let index = 0; index < disclosureTextElements.length; index++) {
          const element = disclosureTextElements[index];
          element.style.opacity = "0";
        }
      }

      document.body.appendChild(cloned);

      // trigger element onchange to support JS
      cloned.dispatchEvent(new Event("change", { bubbles: true }));

      addPageBreak();
    };

    const firstHeader = document.getElementById("first-header");
    const secondHeader = document.getElementById("second-header");
    const footer = document.getElementById("footer");

    resetStyle(firstHeader);
    resetStyle(secondHeader);
    resetStyle(footer);

    // clear the page content
    document.body.innerHTML = "";

    // remove page margin
    const styleEl = document.getElementById("page__style") as HTMLStyleElement;
    const styleSheet = styleEl.sheet!;
    while (styleSheet.rules.length > 0) {
      styleSheet.deleteRule(0);
    }

    // inject new style
    styleSheet.insertRule(`@page { margin-top: 0; margin-bottom:0; }`);

    // duplicate the header and footer element for each page
    for (let i = 0; i < pagesCount; i++) {
      if (i == 0) {
        if (firstHeader) {
          cloneElement(firstHeader, (i + 1).toString());
        }
      } else {
        if (secondHeader) {
          cloneElement(secondHeader, (i + 1).toString());
        }
      }

      if (footer) {
        cloneElement(footer, (i + 1).toString());
      }
    }

    // fill title
    const titleElements = document.getElementsByClassName("title");
    setElementsValue(titleElements, document.title);
  };

  return [doc, pageFunc, argument] as [
    doc: typeof doc,
    pageFunc: typeof pageFunc,
    argument: ArgumentType
  ];
}
