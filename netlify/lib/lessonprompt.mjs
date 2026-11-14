export const SCHEMA = `Reply with JSON only, in exactly this shape:
{"title":"<lesson title>",
 "outline":[{"step":"<what the teacher does>","minutes":10}],
 "examples":[ITEM, ITEM],
 "classWork":[ITEM x5],
 "homework":[ITEM x3]}
Each ITEM is one of:
 {"kind":"calc","expr":"2/3 + 1/6"}            expr uses only digits, /, +, -, ×, ÷, "of", spaces; a mixed number is written "1 1/2"; a decimal "0.75"
 {"kind":"equiv","from":"3/4","toDen":8}        asks for the missing numerator in an equivalent fraction (toDen must be an exact multiple)
 {"kind":"simplify","from":"18/24"}             asks to simplify a fraction
 {"kind":"text","q":"<short question>","answer":"<short answer>"}   only when the question cannot be a calculation
Prefer calc, equiv and simplify items. Use "text" for at most one question per section.
Do NOT include the answers for calc and equiv items: code computes them. Use South African context (rand, spaza shop, braai) in text questions only.`;
