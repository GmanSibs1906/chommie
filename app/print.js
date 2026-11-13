// Prints a prepared block of HTML (homework sheets, HOD mark sheet, evidence pack) and nothing else on the page.
export function printHtml(html) {
  document.getElementById("print-sheets").innerHTML = html;
  document.body.classList.add("printing-hw");
  window.addEventListener("afterprint", () => document.body.classList.remove("printing-hw"), { once: true });
  window.print();
}
