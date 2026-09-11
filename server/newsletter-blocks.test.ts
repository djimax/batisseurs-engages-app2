import { describe, expect, it } from "vitest";
import { appendNewsletterBlock, NEWSLETTER_BLOCKS, getNewsletterBlock } from "../client/src/lib/newsletterBlocks";

describe("newsletter blocks", () => {
  it("provides a bounded catalogue of reusable associative blocks", () => {
    expect(NEWSLETTER_BLOCKS.length).toBe(4);
    expect(NEWSLETTER_BLOCKS.every((block) => block.id && block.label && block.content)).toBe(true);
  });

  it("appends a block without destroying existing content", () => {
    const block = getNewsletterBlock("event");
    expect(block).not.toBeNull();
    expect(appendNewsletterBlock("Bonjour {{firstName}}", block!)).toContain("Bonjour {{firstName}}");
    expect(appendNewsletterBlock("Bonjour {{firstName}}", block!)).toContain("{{date}}");
  });

  it("keeps dynamic variables explicit for the existing safe preview renderer", () => {
    const contents = NEWSLETTER_BLOCKS.map((block) => `${block.subject} ${block.content}`).join(" ");
    expect(contents).toContain("{{associationName}}");
    expect(contents).toContain("{{firstName}}");
    expect(contents).not.toContain("<script");
  });
});
