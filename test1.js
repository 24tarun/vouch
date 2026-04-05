const text1 = "wed";
const regex = /\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi;
console.log("wed matches: ", [...text1.matchAll(regex)].length);

const tmrwRegex = /\b(?:tmrw|tomorrow)\b/i;
console.log("tmrw matches: ", tmrwRegex.test("tmrw"));
