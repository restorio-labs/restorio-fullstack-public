export const transliterateForSlug = (value: string): string => {
  const replaced = value
    .replace(/ß/g, "ss")
    .replace(/Æ/g, "AE")
    .replace(/æ/g, "ae")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Œ/g, "OE")
    .replace(/œ/g, "oe")
    .replace(/Ð/g, "D")
    .replace(/ð/g, "d")
    .replace(/Þ/g, "TH")
    .replace(/þ/g, "th")
    .replace(/Ł/g, "L")
    .replace(/ł/g, "l")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z")
    .replace(/ć/g, "c")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ę/g, "e")
    .replace(/ś/g, "s")
    .replace(/ą/g, "a");

  return replaced.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
};

export const slugify = (value: string): string =>
  transliterateForSlug(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const deslug = (value: string): string => {
  return value
    .trim()
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
