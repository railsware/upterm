import "mocha";
import {expect} from "chai";

import {
  combineManPageLines,
  preprocessManPage,
  extractManPageSections,
  extractManPageSectionParagraphs,
  suggestionFromFlagParagraph,
} from "../../src/utils/ManPageParsingUtils";
import {Suggestion, styles} from "../../src/plugins/autocompletion_utils/Common";

describe("man page line combiner", () => {
  it("combines lines with correct spacing", () => {
    expect(combineManPageLines([
      "   first line     ",
      "  second line       ",
    ])).to.eql("first line second line");
  });

  it("correctly handles words split across lines", () => {
    expect(combineManPageLines([
      "this is com-",
      "bined",
    ])).to.eql("this is combined");
  });
});

describe("man page preprocessor", () => {
  it("strips whitespace and applies backspace literals", () => {
    expect(preprocessManPage("   ab\x08   ")).to.eql("a");
  });
});

describe("man page section extractor", () => {
  it("extracts sections", () => {
    expect(extractManPageSections("DESCRIPTION\n desc\n\nNAME\n name")).to.eql({
      DESCRIPTION: [" desc", ""],
      NAME: [" name"],
    });
  });
});

describe("man page paragraph extraction", () => {
  it("extracts paragraphs", () => {
    expect(extractManPageSectionParagraphs([
      "p1",
      "p1",
      "",
      "p2",
      "p2",
    ])).to.eql([
      ["p1", "p1"],
      ["p2", "p2"],
    ]);
  });

  it("doesn't output empty paragraphs", () => {
    expect(extractManPageSectionParagraphs([
      "p1",
      "p1",
      "",
      "",
      "",
      "",
      "",
      "p2",
      "p2",
    ])).to.eql([
      ["p1", "p1"],
      ["p2", "p2"],
    ]);
  });

  it("can handle flag descriptions that have blank lines in the middle", () => {
    expect(extractManPageSectionParagraphs([
      "     -f1   line one",
      "           line two",
      "",
      "           line three",
      "",
      "     -f2   line one",
    ])).to.eql([
      [
        "     -f1   line one",
        "           line two",
        "           line three",
      ],
      ["     -f2   line one"]
    ]);
  });

  it("can handle flag descriptions that have indentation like df's -T option", () => {
    expect(extractManPageSectionParagraphs([
      "     -f        line one",
      "               line two",
      "",
      "                      indented",
      "",
      "               line three",
      "",
      "     -g        line one",
    ])).to.eql([
      [
        "     -f        line one",
        "               line two",
        "                      indented",
        "               line three",
      ],
      ["     -g        line one"]
    ]);
  });
});

describe("suggestion parser", () => {
  it("can handle short flags without arguments", () => {
    expect(suggestionFromFlagParagraph([
      "   -f  flag with",
      "       description",
    ])).to.eql(new Suggestion({
      value: "-f",
      style: styles.option,
      description: "flag with description",
    }));
  });

  it("can handle short flags with arguments", () => {
    expect(suggestionFromFlagParagraph([
      "   -f arg",
      "       flag with",
      "       description",
    ])).to.eql(new Suggestion({
      value: "-f",
      style: styles.option,
      description: "flag with description",
      displayValue: "-f arg",
      space: true,
    }));
  });

  // DESCRIPTION section can contain things other than flags
  it("returns undefined if attempting to parse paragraph with no flag", () => {
    expect(suggestionFromFlagParagraph([
      "        no flag",
    ])).to.eql(undefined);
  });
});
