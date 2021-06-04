var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var Shape = /** @class */ (function () {
    function Shape(m, n) {
        this.m = m;
        this.n = n;
    }
    Shape.prototype.equals = function (shape) {
        return this.m === shape.m && this.n === shape.n;
    };
    return Shape;
}());
var Vector = /** @class */ (function () {
    function Vector(values) {
        this.values = values;
    }
    Vector.prototype.toArray = function () {
        return this.values.map(function (i) { return i; });
    };
    Vector.prototype.zip = function (other, fn) {
        var result = [];
        for (var i = 0; i < this.values.length; i++) {
            result.push(fn(this.values[i], other.values[i]));
        }
        return new Vector(result);
    };
    Vector.prototype.fold = function (fn) {
        return this.values.reduce(fn);
    };
    Vector.prototype.sum = function () {
        return this.values.reduce(function (x, y) { return x + y; });
    };
    Vector.prototype.multiply = function (other) {
        return this.zip(other, function (x, y) { return x * y; });
    };
    return Vector;
}());
var MatrixError = /** @class */ (function (_super) {
    __extends(MatrixError, _super);
    function MatrixError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MatrixError;
}(Error));
var InvalidShape = /** @class */ (function (_super) {
    __extends(InvalidShape, _super);
    function InvalidShape(shape1, shape2) {
        return _super.call(this, "given shape [" + shape2.m + ", " + shape2.n + "],expected [M, " + shape1.m + "]") || this;
    }
    return InvalidShape;
}(MatrixError));
var Matrix = /** @class */ (function () {
    function Matrix(values) {
        this.values = values;
        this.shape = Matrix.getShape(this.values);
    }
    Matrix.getShape = function (values) {
        var m = values.length;
        if (m === 0) {
            return new Shape(0, 0);
        }
        var n = values[0].length;
        for (var i = 1; i < m; i++) {
            if (values[i].length !== n) {
                throw new Error("count of columns in each row should be the same");
            }
        }
        return new Shape(m, n);
    };
    Matrix.prototype.row = function (index) {
        return new Vector(this.values[index]);
    };
    Matrix.prototype.column = function (index) {
        return new Vector(this.values.map(function (row) { return row[index]; }));
    };
    Matrix.prototype.multiply = function (matrix) {
        if (this.shape.n !== matrix.shape.m) {
            return new InvalidShape(this.shape, matrix.shape);
        }
        var result = [];
        for (var i = 0; i < this.shape.m; i++) {
            result.push([]);
            for (var j = 0; j < matrix.shape.n; j++) {
                result[i][j] = this.row(i).multiply(matrix.column(j)).sum();
            }
        }
        return new Matrix(result);
    };
    Matrix.prototype.plus = function (matrix) {
        if (!this.shape.equals(matrix.shape)) {
            return new InvalidShape(this.shape, matrix.shape);
        }
        var result = [];
        for (var i = 0; i < this.shape.m; i++) {
            result.push([]);
            for (var j = 0; j < matrix.shape.n; j++) {
                result[i][j] = this.values[i][j] + matrix.values[i][j];
            }
        }
        return new Matrix(result);
    };
    Matrix.prototype.negate = function () {
        var result = [];
        for (var i = 0; i < this.shape.m; i++) {
            result.push([]);
            for (var j = 0; j < this.shape.n; j++) {
                result[i][j] = -this.values[i][j];
            }
        }
        return new Matrix(result);
    };
    Matrix.prototype.minus = function (matrix) {
        return this.plus(matrix.negate());
    };
    Matrix.prototype.commutator = function (matrix) {
        var ab = this.multiply(matrix);
        if (ab instanceof MatrixError) {
            return ab;
        }
        var ba = matrix.multiply(this);
        if (ba instanceof MatrixError) {
            return ba;
        }
        return ab.minus(ba);
    };
    Matrix.prototype.power = function (n) {
        var result = this;
        for (var i = 1; i < n; i++) {
            if (result instanceof MatrixError) {
                return result;
            }
            result = result.multiply(this);
        }
        return result;
    };
    return Matrix;
}());
var Color;
(function (Color) {
    var D65_RGB_TO_XYZ = new Matrix([
        [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
        [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
        [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
    ]);
    var XYZ_TO_RGB = new Matrix([
        [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
        [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
        [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
    ]);
    var D65_TO_D50 = new Matrix([
        [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
        [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
        [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008]
    ]);
    var D50_TO_D65 = new Matrix([
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
    ]);
    function convertRGBComponentToLinear(value) {
        var sign = value < 0 ? -1 : 1;
        var abs = Math.abs(value);
        if (abs < 0.04045) {
            return value / 12.92;
        }
        return sign * (Math.pow((abs + 0.055) / 1.055, 2.4));
    }
    Color.convertRGBComponentToLinear = convertRGBComponentToLinear;
    function convertRGBToLinearRGB(rgb) {
        return [
            convertRGBComponentToLinear(rgb.r),
            convertRGBComponentToLinear(rgb.g),
            convertRGBComponentToLinear(rgb.b),
        ];
    }
    Color.convertRGBToLinearRGB = convertRGBToLinearRGB;
    function convertLinearToRGBComponent(value) {
        var sign = value < 0 ? -1 : 1;
        var abs = Math.abs(value);
        if (abs > 0.0031308) {
            return sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
        }
        return 12.92 * value;
    }
    Color.convertLinearToRGBComponent = convertLinearToRGBComponent;
    function convertLinearRGBToRGB(linearRgb) {
        return new RGBFractions(convertLinearToRGBComponent(linearRgb[0]), convertLinearToRGBComponent(linearRgb[1]), convertLinearToRGBComponent(linearRgb[2]));
    }
    function convertLinearRGBToXYZ(linearRgb) {
        var result = D65_RGB_TO_XYZ.multiply(new Matrix(linearRgb.map(function (i) { return [i]; })));
        if (result instanceof MatrixError) {
            throw result;
        }
        return result.column(0).toArray();
    }
    Color.convertLinearRGBToXYZ = convertLinearRGBToXYZ;
    function convertXYZToLinearRGB(xyz) {
        var result = XYZ_TO_RGB.multiply(new Matrix(xyz.map(function (i) { return [i]; })));
        if (result instanceof MatrixError) {
            throw result;
        }
        return result.column(0).toArray();
    }
    Color.convertXYZToLinearRGB = convertXYZToLinearRGB;
    function convertD65ToD50(xyz) {
        var result = D65_TO_D50.multiply(new Matrix(xyz.map(function (i) { return [i]; })));
        if (result instanceof MatrixError) {
            throw result;
        }
        return result.column(0).toArray();
    }
    Color.convertD65ToD50 = convertD65ToD50;
    function convertD50ToD65(xyz) {
        var result = D50_TO_D65.multiply(new Matrix(xyz.map(function (i) { return [i]; })));
        if (result instanceof MatrixError) {
            throw result;
        }
        return result.column(0).toArray();
    }
    Color.convertD50ToD65 = convertD50ToD65;
    function convertXYZToLab(xyzD50) {
        var ε = 216 / 24389; // 6^3/29^3
        var κ = 24389 / 27; // 29^3/3^3
        var white = [0.96422, 1.00000, 0.82521]; // D50 reference white
        // compute xyz, which is XYZ scaled relative to reference white
        var xyz = xyzD50.map(function (value, i) { return value / white[i]; });
        // now compute f
        var f = xyz.map(function (value) { return value > ε ? Math.cbrt(value) : (κ * value + 16) / 116; });
        return [
            (116 * f[1]) - 16,
            500 * (f[0] - f[1]),
            200 * (f[1] - f[2]) // b
        ];
    }
    Color.convertXYZToLab = convertXYZToLab;
    function convertLabToXYZ(lab) {
        var κ = 24389 / 27; // 29^3/3^3
        var ε = 216 / 24389; // 6^3/29^3
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
        return xyz.map(function (value, i) { return value * white[i]; });
    }
    Color.convertLabToXYZ = convertLabToXYZ;
    function convertLabToLCH(lab) {
        var hue = Math.atan2(lab[2], lab[1]) * 180 / Math.PI;
        return new LCH(lab[0], Math.sqrt(Math.pow(lab[1], 2) + Math.pow(lab[2], 2)), hue >= 0 ? hue : hue + 360);
    }
    Color.convertLabToLCH = convertLabToLCH;
    function convertLCHToLab(lch) {
        // Convert from polar form
        return [
            lch[0],
            lch[1] * Math.cos(lch[2] * Math.PI / 180),
            lch[1] * Math.sin(lch[2] * Math.PI / 180) // b
        ];
    }
    Color.convertLCHToLab = convertLCHToLab;
    function convertRGBToLab_D65(rgb) {
        var rgbFractions = rgb.toRGBFractions();
        var linearRgb = convertRGBToLinearRGB(rgbFractions);
        var xyzD65 = convertLinearRGBToXYZ(linearRgb);
        return convertXYZToLab(xyzD65);
    }
    Color.convertRGBToLab_D65 = convertRGBToLab_D65;
    var RGBFractions = /** @class */ (function () {
        function RGBFractions(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
        }
        RGBFractions.prototype.toRGB = function () {
            return new RGB(this.r * 255, this.g * 255, this.b * 255);
        };
        return RGBFractions;
    }());
    Color.RGBFractions = RGBFractions;
    var LCH = /** @class */ (function () {
        function LCH(l, c, h) {
            this.l = l;
            this.c = c;
            this.h = h;
        }
        LCH.prototype.toRGB = function () {
            var lab = convertLCHToLab([this.l, this.c, this.h]);
            var xyzD50 = convertLabToXYZ(lab);
            var xyzD65 = convertD50ToD65(xyzD50);
            var linearRgb = convertXYZToLinearRGB(xyzD65);
            var rgbFractions = convertLinearRGBToRGB(linearRgb);
            return rgbFractions.toRGB();
        };
        return LCH;
    }());
    Color.LCH = LCH;
    var RGB = /** @class */ (function () {
        function RGB(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
        }
        RGB.prototype.toRGBFractions = function () {
            return new RGBFractions(this.r / 255, this.g / 255, this.b / 255);
        };
        RGB.prototype.toLab = function () {
            var rgbFractions = this.toRGBFractions();
            var linearRgb = convertRGBToLinearRGB(rgbFractions);
            var xyzD65 = convertLinearRGBToXYZ(linearRgb);
            var xyzD50 = convertD65ToD50(xyzD65);
            return convertXYZToLab(xyzD50);
        };
        RGB.prototype.toLCH = function () {
            return convertLabToLCH(this.toLab());
        };
        RGB.mix = function (first, second, firstPart) {
            var firstLch = first.toLCH();
            var secondLch = second.toLCH();
            var mix = new LCH(firstLch.l * firstPart + secondLch.l * (1 - firstPart), firstLch.c * firstPart + secondLch.c * (1 - firstPart), firstLch.h * firstPart + secondLch.h * (1 - firstPart));
            return mix.toRGB();
        };
        return RGB;
    }());
    Color.RGB = RGB;
})(Color || (Color = {}));
document.addEventListener("DOMContentLoaded", function () {
    var firstColorInputs = [
        document.querySelector("#firstColorR"),
        document.querySelector("#firstColorG"),
        document.querySelector("#firstColorB"),
    ];
    var secondColorInputs = [
        document.querySelector("#secondColorR"),
        document.querySelector("#secondColorG"),
        document.querySelector("#secondColorB"),
    ];
    var part = document.querySelector("#part");
    function parseComponent(x) {
        var result = parseInt(x);
        if (Number.isFinite(result) && result <= 255 && result >= 0) {
            return result;
        }
        throw new Error("incorrect");
    }
    function parseComponents(_a) {
        var r = _a[0], g = _a[1], b = _a[2];
        return new Color.RGB(parseComponent(r), parseComponent(g), parseComponent(b));
    }
    function setAsColor(selector, rgb) {
        document.querySelector(selector).setAttribute("fill", "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")");
    }
    function onInputChanged() {
        var rgb1 = parseComponents(firstColorInputs.map(function (i) { return i.value; }));
        var rgb2 = parseComponents(secondColorInputs.map(function (i) { return i.value; }));
        setAsColor("#firstColorBox", rgb1);
        setAsColor("#secondColorBox", rgb2);
        var partInt = parseInt(part.value) / 100;
        var res = Color.RGB.mix(rgb1, rgb2, 1 - partInt);
        setAsColor("#resultColorBox", res);
    }
    __spreadArrays(firstColorInputs, secondColorInputs).map(function (i) { return i.addEventListener("input", onInputChanged); });
    part.addEventListener("input", onInputChanged);
});
