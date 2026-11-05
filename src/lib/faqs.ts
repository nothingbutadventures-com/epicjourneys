export type Faq = { question: string; answer: string };

/** Keeps only FAQs that have both a question and an answer. */
export const cleanFaqs = (v: unknown): Faq[] =>
  Array.isArray(v)
    ? v
        .map((f: any) => ({ question: String(f?.question ?? "").trim(), answer: String(f?.answer ?? "").trim() }))
        .filter((f) => f.question && f.answer)
    : [];
