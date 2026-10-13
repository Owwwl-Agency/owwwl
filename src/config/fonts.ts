import localFont from "next/font/local";

export const newYork = localFont({
  src: "../assets/fonts/new-york/NewYork-Variable.woff2",
  weight: "400 1000",
  style: "normal",
  variable: "--font-new-york",
  display: "swap",
});

export const moisette = localFont({
  src: "../assets/fonts/moisette/Moisette-Italic.woff2",
  weight: "400",
  style: "italic",
  variable: "--font-moisette",
  display: "swap",
});

// TODO: add Mont SemiBold (600) once the file is provided.
export const mont = localFont({
  src: [
    { path: "../assets/fonts/mont/Mont-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../assets/fonts/mont/Mont-Heavy.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-mont",
  display: "swap",
});

export const fontVariables = [newYork.variable, moisette.variable, mont.variable].join(" ");
