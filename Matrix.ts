class Shape {
  constructor(
    public readonly m: number,
    public readonly n: number,
  ) { }

  public equals(shape: Shape) {
    return this.m === shape.m && this.n === shape.n;
  }
}

class Vector {
  private values: number[];

  constructor(values: number[]) {
    this.values = values;
  }

  public toArray(): number[] {
    return this.values.map(i => i);
  }

  public zip(other: Vector, fn: (x: number, y: number) => number): Vector {
    const result: number[] = [];

    for (let i = 0; i < this.values.length; i++) {
      result.push(fn(this.values[i], other.values[i]));
    }

    return new Vector(result);
  }

  public fold(fn: (x: number, y: number) => number): number {
    return this.values.reduce(fn);
  }

  public sum(): number {
    return this.values.reduce((x, y) => x + y);
  }

  public multiply(other: Vector): Vector {
    return this.zip(other, (x, y) => x * y);
  }
}

class MatrixError extends Error {

}

class InvalidShape extends MatrixError {
  constructor(shape1: Shape, shape2: Shape) {
    super(`given shape [${shape2.m}, ${shape2.n}],expected [M, ${shape1.m}]`);
  }
}

class Matrix {
  private values: number[][];
  public shape: Shape;

  constructor(values: number[][]) {
    this.values = values;
    this.shape = Matrix.getShape(this.values);
  }

  private static getShape(values: number[][]): Shape {
    const m = values.length;

    if (m === 0) {
      return new Shape(0, 0);
    }

    const n = values[0].length;

    for (let i = 1; i < m; i++) {
      if (values[i].length !== n) {
        throw new Error("count of columns in each row should be the same");
      }
    }

    return new Shape(m, n);
  }

  public row(index: number): Vector {
    return new Vector(this.values[index]);
  }

  public column(index: number): Vector {
    return new Vector(this.values.map(row => row[index]));
  }

  public multiply(matrix: Matrix): Matrix | MatrixError {
    if (this.shape.n !== matrix.shape.m) {
      return new InvalidShape(this.shape, matrix.shape);
    }

    let result: number[][] = [];

    for (let i = 0; i < this.shape.m; i++) {
      result.push([]);
      for (let j = 0; j < matrix.shape.n; j++) {
        result[i][j] = this.row(i).multiply(matrix.column(j)).sum();
      }
    }

    return new Matrix(result);
  }

  public plus(matrix: Matrix): Matrix | MatrixError {
    if (!this.shape.equals(matrix.shape)) {
      return new InvalidShape(this.shape, matrix.shape);
    }

    let result: number[][] = [];

    for (let i = 0; i < this.shape.m; i++) {
      result.push([]);
      for (let j = 0; j < matrix.shape.n; j++) {
        result[i][j] = this.values[i][j] + matrix.values[i][j];
      }
    }

    return new Matrix(result);
  }

  public negate(): Matrix {
    let result: number[][] = [];

    for (let i = 0; i < this.shape.m; i++) {
      result.push([]);
      for (let j = 0; j < this.shape.n; j++) {
        result[i][j] = -this.values[i][j];
      }
    }

    return new Matrix(result);
  }

  public minus(matrix: Matrix): Matrix | MatrixError {
    return this.plus(matrix.negate());
  }

  public commutator(matrix: Matrix): Matrix | MatrixError {
    const ab = this.multiply(matrix);

    if (ab instanceof MatrixError) {
      return ab;
    }

    const ba = matrix.multiply(this);

    if (ba instanceof MatrixError) {
      return ba;
    }

    return ab.minus(ba);
  }

  public power(n: number): Matrix | MatrixError {
    let result: Matrix | MatrixError = this;

    for (let i = 1; i < n; i++) {
      if (result instanceof MatrixError) {
        return result;
      }

      result = result.multiply(this);
    }

    return result;
  }
}

namespace Color {
  type ColorCoordinates = [number, number, number];

  const D65_RGB_TO_XYZ = new Matrix([
    [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
    [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
    [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
  ]);

  const XYZ_TO_RGB = new Matrix([
    [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
    [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
    [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
  ]);

  const D65_TO_D50 = new Matrix([
    [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
    [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
    [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008]
  ]);

  const D50_TO_D65 = new Matrix([
    [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
    [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
    [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
  ]);

  export function convertRGBComponentToLinear(value: number): number {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);

    if (abs < 0.04045) {
      return value / 12.92;
    }

    return sign * (Math.pow((abs + 0.055) / 1.055, 2.4));
  }

  export function convertRGBToLinearRGB(rgb: RGBFractions): ColorCoordinates {
    return [
      convertRGBComponentToLinear(rgb.r),
      convertRGBComponentToLinear(rgb.g),
      convertRGBComponentToLinear(rgb.b),
    ];
  }

  export function convertLinearToRGBComponent(value: number): number {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);

    if (abs > 0.0031308) {
      return sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
    }

    return 12.92 * value;
  }

  function convertLinearRGBToRGB(linearRgb: ColorCoordinates): RGBFractions {
    return new RGBFractions(
      convertLinearToRGBComponent(linearRgb[0]),
      convertLinearToRGBComponent(linearRgb[1]),
      convertLinearToRGBComponent(linearRgb[2]),
    );
  }


  export function convertLinearRGBToXYZ(linearRgb: ColorCoordinates): ColorCoordinates {
    const result = D65_RGB_TO_XYZ.multiply(new Matrix(linearRgb.map(i => [i])));

    if (result instanceof MatrixError) {
      throw result;
    }

    return result.column(0).toArray() as [number, number, number];
  }

  export function convertXYZToLinearRGB(xyz: ColorCoordinates) {
    const result = XYZ_TO_RGB.multiply(new Matrix(xyz.map(i => [i])));

    if (result instanceof MatrixError) {
      throw result;
    }

    return result.column(0).toArray() as [number, number, number];
  }

  export function convertD65ToD50(xyz: ColorCoordinates): ColorCoordinates {
    const result = D65_TO_D50.multiply(new Matrix(xyz.map(i => [i])));

    if (result instanceof MatrixError) {
      throw result;
    }

    return result.column(0).toArray() as [number, number, number];
  }

  export function convertD50ToD65(xyz: ColorCoordinates): ColorCoordinates {
    const result = D50_TO_D65.multiply(new Matrix(xyz.map(i => [i])));

    if (result instanceof MatrixError) {
      throw result;
    }

    return result.column(0).toArray() as [number, number, number];
  }

  export function convertXYZToLab(xyzD50: ColorCoordinates): ColorCoordinates {
    var ε = 216 / 24389;  // 6^3/29^3
    var κ = 24389 / 27;   // 29^3/3^3
    var white = [0.96422, 1.00000, 0.82521]; // D50 reference white

    // compute xyz, which is XYZ scaled relative to reference white
    var xyz = xyzD50.map((value, i) => value / white[i]);

    // now compute f
    var f = xyz.map(value => value > ε ? Math.cbrt(value) : (κ * value + 16) / 116);

    return [
      (116 * f[1]) - 16, 	 // L
      500 * (f[0] - f[1]), // a
      200 * (f[1] - f[2])  // b
    ];
  }

  export function convertLabToXYZ(lab: ColorCoordinates): [number, number, number] {
    var κ = 24389 / 27;   // 29^3/3^3
    var ε = 216 / 24389;  // 6^3/29^3
    var white = [0.96422, 1.00000, 0.82521]; // D50 reference white
    var f = [];

    // compute f, starting with the luminance-related term
    f[1] = (lab[0] + 16) / 116;
    f[0] = lab[1] / 500 + f[1];
    f[2] = f[1] - lab[2] / 200;

    // compute xyz
    var xyz = [
      Math.pow(f[0], 3) > ε ? Math.pow(f[0], 3) : (116 * f[0] - 16) / κ,
      lab[0] > κ * ε ? Math.pow((lab[0] + 16) / 116, 3) : lab[0] / κ,
      Math.pow(f[2], 3) > ε ? Math.pow(f[2], 3) : (116 * f[2] - 16) / κ
    ];

    // Compute XYZ by scaling xyz by reference white
    return xyz.map((value, i) => value * white[i]) as [number, number, number];
  }

  export function convertLabToLCH(lab: ColorCoordinates): LCH {
    var hue = Math.atan2(lab[2], lab[1]) * 180 / Math.PI;

    return new LCH(
      lab[0],
      Math.sqrt(Math.pow(lab[1], 2) + Math.pow(lab[2], 2)),
      hue >= 0 ? hue : hue + 360
    );
  }

  export function convertLCHToLab(lch: [number, number, number]): [number, number, number] {
    // Convert from polar form
    return [
      lch[0], // L is still L
      lch[1] * Math.cos(lch[2] * Math.PI / 180), // a
      lch[1] * Math.sin(lch[2] * Math.PI / 180) // b
    ];
  }

  export function convertRGBToLab_D65(rgb: RGB) {
    const rgbFractions = rgb.toRGBFractions();
    const linearRgb = convertRGBToLinearRGB(rgbFractions);
    const xyzD65 = convertLinearRGBToXYZ(linearRgb);
    return convertXYZToLab(xyzD65);
  }

  export class RGBFractions {
    constructor(
      public readonly r: number,
      public readonly g: number,
      public readonly b: number
    ) { }

    toRGB(): RGB {
      return new RGB(this.r * 255, this.g * 255, this.b * 255);
    }
  }

  export class LCH {
    constructor(
      public readonly l: number,
      public readonly c: number,
      public readonly h: number
    ) { }

    toRGB() {
      const lab = convertLCHToLab([this.l, this.c, this.h]);
      const xyzD50 = convertLabToXYZ(lab);
      const xyzD65 = convertD50ToD65(xyzD50);
      const linearRgb = convertXYZToLinearRGB(xyzD65);
      const rgbFractions = convertLinearRGBToRGB(linearRgb);
      return rgbFractions.toRGB();
    }
  }

  export class RGB {
    constructor(
      public readonly r: number,
      public readonly g: number,
      public readonly b: number
    ) { }

    toRGBFractions(): RGBFractions {
      return new RGBFractions(this.r / 255, this.g / 255, this.b / 255);
    }

    public toLab() {
      const rgbFractions = this.toRGBFractions();
      const linearRgb = convertRGBToLinearRGB(rgbFractions);
      const xyzD65 = convertLinearRGBToXYZ(linearRgb);
      const xyzD50 = convertD65ToD50(xyzD65);
      return convertXYZToLab(xyzD50);
    }

    public toLCH() {
      return convertLabToLCH(this.toLab());
    }

    public static mix(first: RGB, second: RGB, firstPart: number) {
      const firstLch = first.toLCH();
      const secondLch = second.toLCH();

      const mix = new LCH(
        firstLch.l * firstPart + secondLch.l * (1 - firstPart),
        firstLch.c * firstPart + secondLch.c * (1 - firstPart),
        firstLch.h * firstPart + secondLch.h * (1 - firstPart),
      );

      return mix.toRGB();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const firstColorInputs = [
    document.querySelector("#firstColorR") as HTMLInputElement,
    document.querySelector("#firstColorG") as HTMLInputElement,
    document.querySelector("#firstColorB") as HTMLInputElement,
  ];

  const secondColorInputs = [
    document.querySelector("#secondColorR") as HTMLInputElement,
    document.querySelector("#secondColorG") as HTMLInputElement,
    document.querySelector("#secondColorB") as HTMLInputElement,
  ];

  const part = document.querySelector("#part") as HTMLInputElement,

  function parseComponent(x: string): number {
    const result = parseInt(x);

    if (Number.isFinite(result) && result <= 255 && result >= 0) {
      return result;
    }

    throw new Error("incorrect");
  }

  function parseComponents([r, g, b]: string[]) {
    return new Color.RGB(parseComponent(r), parseComponent(g), parseComponent(b));
  }

  function setAsColor(selector: string, rgb: Color.RGB) {
    document.querySelector(selector).setAttribute("fill", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  }

  function onInputChanged() {
    const rgb1 = parseComponents(firstColorInputs.map(i => i.value));
    const rgb2 = parseComponents(secondColorInputs.map(i => i.value));

    setAsColor("#firstColorBox", rgb1);
    setAsColor("#secondColorBox", rgb2);

    const partInt = parseInt(part.value) / 100;

    const res = Color.RGB.mix(rgb1, rgb2, 1 - partInt);

    setAsColor("#resultColorBox", res);
  }

  [...firstColorInputs, ...secondColorInputs].map(i => i.addEventListener("input", onInputChanged));

  part.addEventListener("input", onInputChanged);
})