export default ["lof", "likely_lof", "uncertain", "likely_not_lof", "not_lof"];

export const verdictColors = {
  lof: "#00BB00",
  likely_lof: "#228022",
  uncertain: "black",
  likely_not_lof: "orange",
  not_lof: "#FF3733",
};

export const verdictLabels = {
  lof: "LoF",
  likely_lof: "Likely LoF",
  uncertain: "¯\\_(ツ)_/¯",
  likely_not_lof: "Likely not loF",
  not_lof: "Not LoF",
};

export const verdictSymbols = {
  lof: "\u2460",
  likely_lof: "\u2461",
  uncertain: "??",
  likely_not_lof: "\u2463",
  not_lof: "\u2464",
};
