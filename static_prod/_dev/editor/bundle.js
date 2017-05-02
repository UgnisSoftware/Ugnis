(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* big.js v3.1.3 https://github.com/MikeMcl/big.js/LICENCE */
;(function (global) {
    'use strict';

/*
  big.js v3.1.3
  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
  https://github.com/MikeMcl/big.js/
  Copyright (c) 2014 Michael Mclaughlin <M8ch88l@gmail.com>
  MIT Expat Licence
*/

/***************************** EDITABLE DEFAULTS ******************************/

    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places of the results of operations
     * involving division: div and sqrt, and pow with negative exponents.
     */
    var DP = 20,                           // 0 to MAX_DP

        /*
         * The rounding mode used when rounding to the above decimal places.
         *
         * 0 Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
         * 1 To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
         * 2 To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
         * 3 Away from zero.                                  (ROUND_UP)
         */
        RM = 1,                            // 0, 1, 2 or 3

        // The maximum value of DP and Big.DP.
        MAX_DP = 1E6,                      // 0 to 1000000

        // The maximum magnitude of the exponent argument to the pow method.
        MAX_POWER = 1E6,                   // 1 to 1000000

        /*
         * The exponent value at and beneath which toString returns exponential
         * notation.
         * JavaScript's Number type: -7
         * -1000000 is the minimum recommended exponent value of a Big.
         */
        E_NEG = -7,                   // 0 to -1000000

        /*
         * The exponent value at and above which toString returns exponential
         * notation.
         * JavaScript's Number type: 21
         * 1000000 is the maximum recommended exponent value of a Big.
         * (This limit is not enforced or checked.)
         */
        E_POS = 21,                   // 0 to 1000000

/******************************************************************************/

        // The shared prototype object.
        P = {},
        isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
        Big;


    /*
     * Create and return a Big constructor.
     *
     */
    function bigFactory() {

        /*
         * The Big constructor and exported function.
         * Create and return a new instance of a Big number object.
         *
         * n {number|string|Big} A numeric value.
         */
        function Big(n) {
            var x = this;

            // Enable constructor usage without new.
            if (!(x instanceof Big)) {
                return n === void 0 ? bigFactory() : new Big(n);
            }

            // Duplicate.
            if (n instanceof Big) {
                x.s = n.s;
                x.e = n.e;
                x.c = n.c.slice();
            } else {
                parse(x, n);
            }

            /*
             * Retain a reference to this Big constructor, and shadow
             * Big.prototype.constructor which points to Object.
             */
            x.constructor = Big;
        }

        Big.prototype = P;
        Big.DP = DP;
        Big.RM = RM;
        Big.E_NEG = E_NEG;
        Big.E_POS = E_POS;

        return Big;
    }


    // Private functions


    /*
     * Return a string representing the value of Big x in normal or exponential
     * notation to dp fixed decimal places or significant digits.
     *
     * x {Big} The Big to format.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * toE {number} 1 (toExponential), 2 (toPrecision) or undefined (toFixed).
     */
    function format(x, dp, toE) {
        var Big = x.constructor,

            // The index (normal notation) of the digit that may be rounded up.
            i = dp - (x = new Big(x)).e,
            c = x.c;

        // Round?
        if (c.length > ++dp) {
            rnd(x, i, Big.RM);
        }

        if (!c[0]) {
            ++i;
        } else if (toE) {
            i = dp;

        // toFixed
        } else {
            c = x.c;

            // Recalculate i as x.e may have changed if value rounded up.
            i = x.e + i + 1;
        }

        // Append zeros?
        for (; c.length < i; c.push(0)) {
        }
        i = x.e;

        /*
         * toPrecision returns exponential notation if the number of
         * significant digits specified is less than the number of digits
         * necessary to represent the integer part of the value in normal
         * notation.
         */
        return toE === 1 || toE && (dp <= i || i <= Big.E_NEG) ?

          // Exponential notation.
          (x.s < 0 && c[0] ? '-' : '') +
            (c.length > 1 ? c[0] + '.' + c.join('').slice(1) : c[0]) +
              (i < 0 ? 'e' : 'e+') + i

          // Normal notation.
          : x.toString();
    }


    /*
     * Parse the number or string value passed to a Big constructor.
     *
     * x {Big} A Big number instance.
     * n {number|string} A numeric value.
     */
    function parse(x, n) {
        var e, i, nL;

        // Minus zero?
        if (n === 0 && 1 / n < 0) {
            n = '-0';

        // Ensure n is string and check validity.
        } else if (!isValid.test(n += '')) {
            throwErr(NaN);
        }

        // Determine sign.
        x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

        // Decimal point?
        if ((e = n.indexOf('.')) > -1) {
            n = n.replace('.', '');
        }

        // Exponential form?
        if ((i = n.search(/e/i)) > 0) {

            // Determine exponent.
            if (e < 0) {
                e = i;
            }
            e += +n.slice(i + 1);
            n = n.substring(0, i);

        } else if (e < 0) {

            // Integer.
            e = n.length;
        }

        // Determine leading zeros.
        for (i = 0; n.charAt(i) == '0'; i++) {
        }

        if (i == (nL = n.length)) {

            // Zero.
            x.c = [ x.e = 0 ];
        } else {

            // Determine trailing zeros.
            for (; n.charAt(--nL) == '0';) {
            }

            x.e = e - i - 1;
            x.c = [];

            // Convert string to array of digits without leading/trailing zeros.
            for (e = 0; i <= nL; x.c[e++] = +n.charAt(i++)) {
            }
        }

        return x;
    }


    /*
     * Round Big x to a maximum of dp decimal places using rounding mode rm.
     * Called by div, sqrt and round.
     *
     * x {Big} The Big to round.
     * dp {number} Integer, 0 to MAX_DP inclusive.
     * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
     * [more] {boolean} Whether the result of division was truncated.
     */
    function rnd(x, dp, rm, more) {
        var u,
            xc = x.c,
            i = x.e + dp + 1;

        if (rm === 1) {

            // xc[i] is the digit after the digit that may be rounded up.
            more = xc[i] >= 5;
        } else if (rm === 2) {
            more = xc[i] > 5 || xc[i] == 5 &&
              (more || i < 0 || xc[i + 1] !== u || xc[i - 1] & 1);
        } else if (rm === 3) {
            more = more || xc[i] !== u || i < 0;
        } else {
            more = false;

            if (rm !== 0) {
                throwErr('!Big.RM!');
            }
        }

        if (i < 1 || !xc[0]) {

            if (more) {

                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                x.e = -dp;
                x.c = [1];
            } else {

                // Zero.
                x.c = [x.e = 0];
            }
        } else {

            // Remove any digits after the required decimal places.
            xc.length = i--;

            // Round up?
            if (more) {

                // Rounding up may mean the previous digit has to be rounded up.
                for (; ++xc[i] > 9;) {
                    xc[i] = 0;

                    if (!i--) {
                        ++x.e;
                        xc.unshift(1);
                    }
                }
            }

            // Remove trailing zeros.
            for (i = xc.length; !xc[--i]; xc.pop()) {
            }
        }

        return x;
    }


    /*
     * Throw a BigError.
     *
     * message {string} The error message.
     */
    function throwErr(message) {
        var err = new Error(message);
        err.name = 'BigError';

        throw err;
    }


    // Prototype/instance methods


    /*
     * Return a new Big whose value is the absolute value of this Big.
     */
    P.abs = function () {
        var x = new this.constructor(this);
        x.s = 1;

        return x;
    };


    /*
     * Return
     * 1 if the value of this Big is greater than the value of Big y,
     * -1 if the value of this Big is less than the value of Big y, or
     * 0 if they have the same value.
    */
    P.cmp = function (y) {
        var xNeg,
            x = this,
            xc = x.c,
            yc = (y = new x.constructor(y)).c,
            i = x.s,
            j = y.s,
            k = x.e,
            l = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {
            return !xc[0] ? !yc[0] ? 0 : -j : i;
        }

        // Signs differ?
        if (i != j) {
            return i;
        }
        xNeg = i < 0;

        // Compare exponents.
        if (k != l) {
            return k > l ^ xNeg ? 1 : -1;
        }

        i = -1;
        j = (k = xc.length) < (l = yc.length) ? k : l;

        // Compare digit by digit.
        for (; ++i < j;) {

            if (xc[i] != yc[i]) {
                return xc[i] > yc[i] ^ xNeg ? 1 : -1;
            }
        }

        // Compare lengths.
        return k == l ? 0 : k > l ^ xNeg ? 1 : -1;
    };


    /*
     * Return a new Big whose value is the value of this Big divided by the
     * value of Big y, rounded, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     */
    P.div = function (y) {
        var x = this,
            Big = x.constructor,
            // dividend
            dvd = x.c,
            //divisor
            dvs = (y = new Big(y)).c,
            s = x.s == y.s ? 1 : -1,
            dp = Big.DP;

        if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!Big.DP!');
        }

        // Either 0?
        if (!dvd[0] || !dvs[0]) {

            // If both are 0, throw NaN
            if (dvd[0] == dvs[0]) {
                throwErr(NaN);
            }

            // If dvs is 0, throw +-Infinity.
            if (!dvs[0]) {
                throwErr(s / 0);
            }

            // dvd is 0, return +-0.
            return new Big(s * 0);
        }

        var dvsL, dvsT, next, cmp, remI, u,
            dvsZ = dvs.slice(),
            dvdI = dvsL = dvs.length,
            dvdL = dvd.length,
            // remainder
            rem = dvd.slice(0, dvsL),
            remL = rem.length,
            // quotient
            q = y,
            qc = q.c = [],
            qi = 0,
            digits = dp + (q.e = x.e - y.e) + 1;

        q.s = s;
        s = digits < 0 ? 0 : digits;

        // Create version of divisor with leading zero.
        dvsZ.unshift(0);

        // Add zeros to make remainder as long as divisor.
        for (; remL++ < dvsL; rem.push(0)) {
        }

        do {

            // 'next' is how many times the divisor goes into current remainder.
            for (next = 0; next < 10; next++) {

                // Compare divisor and remainder.
                if (dvsL != (remL = rem.length)) {
                    cmp = dvsL > remL ? 1 : -1;
                } else {

                    for (remI = -1, cmp = 0; ++remI < dvsL;) {

                        if (dvs[remI] != rem[remI]) {
                            cmp = dvs[remI] > rem[remI] ? 1 : -1;
                            break;
                        }
                    }
                }

                // If divisor < remainder, subtract divisor from remainder.
                if (cmp < 0) {

                    // Remainder can't be more than 1 digit longer than divisor.
                    // Equalise lengths using divisor with extra leading zero?
                    for (dvsT = remL == dvsL ? dvs : dvsZ; remL;) {

                        if (rem[--remL] < dvsT[remL]) {
                            remI = remL;

                            for (; remI && !rem[--remI]; rem[remI] = 9) {
                            }
                            --rem[remI];
                            rem[remL] += 10;
                        }
                        rem[remL] -= dvsT[remL];
                    }
                    for (; !rem[0]; rem.shift()) {
                    }
                } else {
                    break;
                }
            }

            // Add the 'next' digit to the result array.
            qc[qi++] = cmp ? next : ++next;

            // Update the remainder.
            if (rem[0] && cmp) {
                rem[remL] = dvd[dvdI] || 0;
            } else {
                rem = [ dvd[dvdI] ];
            }

        } while ((dvdI++ < dvdL || rem[0] !== u) && s--);

        // Leading zero? Do not remove if result is simply zero (qi == 1).
        if (!qc[0] && qi != 1) {

            // There can't be more than one zero.
            qc.shift();
            q.e--;
        }

        // Round?
        if (qi > digits) {
            rnd(q, dp, Big.RM, rem[0] !== u);
        }

        return q;
    };


    /*
     * Return true if the value of this Big is equal to the value of Big y,
     * otherwise returns false.
     */
    P.eq = function (y) {
        return !this.cmp(y);
    };


    /*
     * Return true if the value of this Big is greater than the value of Big y,
     * otherwise returns false.
     */
    P.gt = function (y) {
        return this.cmp(y) > 0;
    };


    /*
     * Return true if the value of this Big is greater than or equal to the
     * value of Big y, otherwise returns false.
     */
    P.gte = function (y) {
        return this.cmp(y) > -1;
    };


    /*
     * Return true if the value of this Big is less than the value of Big y,
     * otherwise returns false.
     */
    P.lt = function (y) {
        return this.cmp(y) < 0;
    };


    /*
     * Return true if the value of this Big is less than or equal to the value
     * of Big y, otherwise returns false.
     */
    P.lte = function (y) {
         return this.cmp(y) < 1;
    };


    /*
     * Return a new Big whose value is the value of this Big minus the value
     * of Big y.
     */
    P.sub = P.minus = function (y) {
        var i, j, t, xLTy,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.plus(y);
        }

        var xc = x.c.slice(),
            xe = x.e,
            yc = y.c,
            ye = y.e;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
        }

        // Determine which is the bigger number.
        // Prepend zeros to equalise exponents.
        if (a = xe - ye) {

            if (xLTy = a < 0) {
                a = -a;
                t = xc;
            } else {
                ye = xe;
                t = yc;
            }

            t.reverse();
            for (b = a; b--; t.push(0)) {
            }
            t.reverse();
        } else {

            // Exponents equal. Check digit by digit.
            j = ((xLTy = xc.length < yc.length) ? xc : yc).length;

            for (a = b = 0; b < j; b++) {

                if (xc[b] != yc[b]) {
                    xLTy = xc[b] < yc[b];
                    break;
                }
            }
        }

        // x < y? Point xc to the array of the bigger number.
        if (xLTy) {
            t = xc;
            xc = yc;
            yc = t;
            y.s = -y.s;
        }

        /*
         * Append zeros to xc if shorter. No need to add zeros to yc if shorter
         * as subtraction only needs to start at yc.length.
         */
        if (( b = (j = yc.length) - (i = xc.length) ) > 0) {

            for (; b--; xc[i++] = 0) {
            }
        }

        // Subtract yc from xc.
        for (b = i; j > a;){

            if (xc[--j] < yc[j]) {

                for (i = j; i && !xc[--i]; xc[i] = 9) {
                }
                --xc[i];
                xc[j] += 10;
            }
            xc[j] -= yc[j];
        }

        // Remove trailing zeros.
        for (; xc[--b] === 0; xc.pop()) {
        }

        // Remove leading zeros and adjust exponent accordingly.
        for (; xc[0] === 0;) {
            xc.shift();
            --ye;
        }

        if (!xc[0]) {

            // n - n = +0
            y.s = 1;

            // Result must be zero.
            xc = [ye = 0];
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a new Big whose value is the value of this Big modulo the
     * value of Big y.
     */
    P.mod = function (y) {
        var yGTx,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        if (!y.c[0]) {
            throwErr(NaN);
        }

        x.s = y.s = 1;
        yGTx = y.cmp(x) == 1;
        x.s = a;
        y.s = b;

        if (yGTx) {
            return new Big(x);
        }

        a = Big.DP;
        b = Big.RM;
        Big.DP = Big.RM = 0;
        x = x.div(y);
        Big.DP = a;
        Big.RM = b;

        return this.minus( x.times(y) );
    };


    /*
     * Return a new Big whose value is the value of this Big plus the value
     * of Big y.
     */
    P.add = P.plus = function (y) {
        var t,
            x = this,
            Big = x.constructor,
            a = x.s,
            b = (y = new Big(y)).s;

        // Signs differ?
        if (a != b) {
            y.s = -b;
            return x.minus(y);
        }

        var xe = x.e,
            xc = x.c,
            ye = y.e,
            yc = y.c;

        // Either zero?
        if (!xc[0] || !yc[0]) {

            // y is non-zero? x is non-zero? Or both are zero.
            return yc[0] ? y : new Big(xc[0] ? x : a * 0);
        }
        xc = xc.slice();

        // Prepend zeros to equalise exponents.
        // Note: Faster to use reverse then do unshifts.
        if (a = xe - ye) {

            if (a > 0) {
                ye = xe;
                t = yc;
            } else {
                a = -a;
                t = xc;
            }

            t.reverse();
            for (; a--; t.push(0)) {
            }
            t.reverse();
        }

        // Point xc to the longer array.
        if (xc.length - yc.length < 0) {
            t = yc;
            yc = xc;
            xc = t;
        }
        a = yc.length;

        /*
         * Only start adding at yc.length - 1 as the further digits of xc can be
         * left as they are.
         */
        for (b = 0; a;) {
            b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;
            xc[a] %= 10;
        }

        // No need to check for zero, as +x + +y != 0 && -x + -y != 0

        if (b) {
            xc.unshift(b);
            ++ye;
        }

         // Remove trailing zeros.
        for (a = xc.length; xc[--a] === 0; xc.pop()) {
        }

        y.c = xc;
        y.e = ye;

        return y;
    };


    /*
     * Return a Big whose value is the value of this Big raised to the power n.
     * If n is negative, round, if necessary, to a maximum of Big.DP decimal
     * places using rounding mode Big.RM.
     *
     * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
     */
    P.pow = function (n) {
        var x = this,
            one = new x.constructor(1),
            y = one,
            isNeg = n < 0;

        if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
            throwErr('!pow!');
        }

        n = isNeg ? -n : n;

        for (;;) {

            if (n & 1) {
                y = y.times(x);
            }
            n >>= 1;

            if (!n) {
                break;
            }
            x = x.times(x);
        }

        return isNeg ? one.div(y) : y;
    };


    /*
     * Return a new Big whose value is the value of this Big rounded to a
     * maximum of dp decimal places using rounding mode rm.
     * If dp is not specified, round to 0 decimal places.
     * If rm is not specified, use Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     * [rm] 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
     */
    P.round = function (dp, rm) {
        var x = this,
            Big = x.constructor;

        if (dp == null) {
            dp = 0;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!round!');
        }
        rnd(x = new Big(x), dp, rm == null ? Big.RM : rm);

        return x;
    };


    /*
     * Return a new Big whose value is the square root of the value of this Big,
     * rounded, if necessary, to a maximum of Big.DP decimal places using
     * rounding mode Big.RM.
     */
    P.sqrt = function () {
        var estimate, r, approx,
            x = this,
            Big = x.constructor,
            xc = x.c,
            i = x.s,
            e = x.e,
            half = new Big('0.5');

        // Zero?
        if (!xc[0]) {
            return new Big(x);
        }

        // If negative, throw NaN.
        if (i < 0) {
            throwErr(NaN);
        }

        // Estimate.
        i = Math.sqrt(x.toString());

        // Math.sqrt underflow/overflow?
        // Pass x to Math.sqrt as integer, then adjust the result exponent.
        if (i === 0 || i === 1 / 0) {
            estimate = xc.join('');

            if (!(estimate.length + e & 1)) {
                estimate += '0';
            }

            r = new Big( Math.sqrt(estimate).toString() );
            r.e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
        } else {
            r = new Big(i.toString());
        }

        i = r.e + (Big.DP += 4);

        // Newton-Raphson iteration.
        do {
            approx = r;
            r = half.times( approx.plus( x.div(approx) ) );
        } while ( approx.c.slice(0, i).join('') !==
                       r.c.slice(0, i).join('') );

        rnd(r, Big.DP -= 4, Big.RM);

        return r;
    };


    /*
     * Return a new Big whose value is the value of this Big times the value of
     * Big y.
     */
    P.mul = P.times = function (y) {
        var c,
            x = this,
            Big = x.constructor,
            xc = x.c,
            yc = (y = new Big(y)).c,
            a = xc.length,
            b = yc.length,
            i = x.e,
            j = y.e;

        // Determine sign of result.
        y.s = x.s == y.s ? 1 : -1;

        // Return signed 0 if either 0.
        if (!xc[0] || !yc[0]) {
            return new Big(y.s * 0);
        }

        // Initialise exponent of result as x.e + y.e.
        y.e = i + j;

        // If array xc has fewer digits than yc, swap xc and yc, and lengths.
        if (a < b) {
            c = xc;
            xc = yc;
            yc = c;
            j = a;
            a = b;
            b = j;
        }

        // Initialise coefficient array of result with zeros.
        for (c = new Array(j = a + b); j--; c[j] = 0) {
        }

        // Multiply.

        // i is initially xc.length.
        for (i = b; i--;) {
            b = 0;

            // a is yc.length.
            for (j = a + i; j > i;) {

                // Current sum of products at this digit position, plus carry.
                b = c[j] + yc[i] * xc[j - i - 1] + b;
                c[j--] = b % 10;

                // carry
                b = b / 10 | 0;
            }
            c[j] = (c[j] + b) % 10;
        }

        // Increment result exponent if there is a final carry.
        if (b) {
            ++y.e;
        }

        // Remove any leading zero.
        if (!c[0]) {
            c.shift();
        }

        // Remove trailing zeros.
        for (i = c.length; !c[--i]; c.pop()) {
        }
        y.c = c;

        return y;
    };


    /*
     * Return a string representing the value of this Big.
     * Return exponential notation if this Big has a positive exponent equal to
     * or greater than Big.E_POS, or a negative exponent equal to or less than
     * Big.E_NEG.
     */
    P.toString = P.valueOf = P.toJSON = function () {
        var x = this,
            Big = x.constructor,
            e = x.e,
            str = x.c.join(''),
            strL = str.length;

        // Exponential notation?
        if (e <= Big.E_NEG || e >= Big.E_POS) {
            str = str.charAt(0) + (strL > 1 ? '.' + str.slice(1) : '') +
              (e < 0 ? 'e' : 'e+') + e;

        // Negative exponent?
        } else if (e < 0) {

            // Prepend zeros.
            for (; ++e; str = '0' + str) {
            }
            str = '0.' + str;

        // Positive exponent?
        } else if (e > 0) {

            if (++e > strL) {

                // Append zeros.
                for (e -= strL; e-- ; str += '0') {
                }
            } else if (e < strL) {
                str = str.slice(0, e) + '.' + str.slice(e);
            }

        // Exponent zero.
        } else if (strL > 1) {
            str = str.charAt(0) + '.' + str.slice(1);
        }

        // Avoid '-0'
        return x.s < 0 && x.c[0] ? '-' + str : str;
    };


    /*
     ***************************************************************************
     * If toExponential, toFixed, toPrecision and format are not required they
     * can safely be commented-out or deleted. No redundant code will be left.
     * format is used only by toExponential, toFixed and toPrecision.
     ***************************************************************************
     */


    /*
     * Return a string representing the value of this Big in exponential
     * notation to dp fixed decimal places and rounded, if necessary, using
     * Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toExponential = function (dp) {

        if (dp == null) {
            dp = this.c.length - 1;
        } else if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
            throwErr('!toExp!');
        }

        return format(this, dp, 1);
    };


    /*
     * Return a string representing the value of this Big in normal notation
     * to dp fixed decimal places and rounded, if necessary, using Big.RM.
     *
     * [dp] {number} Integer, 0 to MAX_DP inclusive.
     */
    P.toFixed = function (dp) {
        var str,
            x = this,
            Big = x.constructor,
            neg = Big.E_NEG,
            pos = Big.E_POS;

        // Prevent the possibility of exponential notation.
        Big.E_NEG = -(Big.E_POS = 1 / 0);

        if (dp == null) {
            str = x.toString();
        } else if (dp === ~~dp && dp >= 0 && dp <= MAX_DP) {
            str = format(x, x.e + dp);

            // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
            // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
            if (x.s < 0 && x.c[0] && str.indexOf('-') < 0) {
        //E.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
                str = '-' + str;
            }
        }
        Big.E_NEG = neg;
        Big.E_POS = pos;

        if (!str) {
            throwErr('!toFix!');
        }

        return str;
    };


    /*
     * Return a string representing the value of this Big rounded to sd
     * significant digits using Big.RM. Use exponential notation if sd is less
     * than the number of digits necessary to represent the integer part of the
     * value in normal notation.
     *
     * sd {number} Integer, 1 to MAX_DP inclusive.
     */
    P.toPrecision = function (sd) {

        if (sd == null) {
            return this.toString();
        } else if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
            throwErr('!toPre!');
        }

        return format(this, sd - 1, 2);
    };


    // Export


    Big = bigFactory();

    //AMD.
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return Big;
        });

    // Node and other CommonJS-like environments that support module.exports.
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Big;

    //Browser.
    } else {
        global.Big = Big;
    }
})(this);

},{}],2:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],3:[function(require,module,exports){
var VNode = require('./vnode');
var is = require('./is');

function addNS(data, children, sel) {
  data.ns = 'http://www.w3.org/2000/svg';

  if (sel !== 'foreignObject' && children !== undefined) {
    for (var i = 0; i < children.length; ++i) {
      addNS(children[i].data, children[i].children, children[i].sel);
    }
  }
}

module.exports = function h(sel, b, c) {
  var data = {}, children, text, i;
  if (c !== undefined) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (b !== undefined) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children, sel);
  }
  return VNode(sel, data, children, text, undefined);
};

},{"./is":5,"./vnode":12}],4:[function(require,module,exports){
function createElement(tagName){
  return document.createElement(tagName);
}

function createElementNS(namespaceURI, qualifiedName){
  return document.createElementNS(namespaceURI, qualifiedName);
}

function createTextNode(text){
  return document.createTextNode(text);
}


function insertBefore(parentNode, newNode, referenceNode){
  parentNode.insertBefore(newNode, referenceNode);
}


function removeChild(node, child){
  node.removeChild(child);
}

function appendChild(node, child){
  node.appendChild(child);
}

function parentNode(node){
  return node.parentElement;
}

function nextSibling(node){
  return node.nextSibling;
}

function tagName(node){
  return node.tagName;
}

function setTextContent(node, text){
  node.textContent = text;
}

module.exports = {
  createElement: createElement,
  createElementNS: createElementNS,
  createTextNode: createTextNode,
  appendChild: appendChild,
  removeChild: removeChild,
  insertBefore: insertBefore,
  parentNode: parentNode,
  nextSibling: nextSibling,
  tagName: tagName,
  setTextContent: setTextContent
};

},{}],5:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],6:[function(require,module,exports){
var NamespaceURIs = {
  "xlink": "http://www.w3.org/1999/xlink"
};

var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare",
                "default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable",
                "enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple",
                "muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly",
                "required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate",
                "truespeed", "typemustmatch", "visible"];

var booleanAttrsDict = Object.create(null);
for(var i=0, len = booleanAttrs.length; i < len; i++) {
  booleanAttrsDict[booleanAttrs[i]] = true;
}

function updateAttrs(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs, namespaceSplit;

  if (!oldAttrs && !attrs) return;
  oldAttrs = oldAttrs || {};
  attrs = attrs || {};

  // update modified attributes, add new attributes
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      if(!cur && booleanAttrsDict[key])
        elm.removeAttribute(key);
      else {
        namespaceSplit = key.split(":");
        if(namespaceSplit.length > 1 && NamespaceURIs.hasOwnProperty(namespaceSplit[0]))
          elm.setAttributeNS(NamespaceURIs[namespaceSplit[0]], key, cur);
        else
          elm.setAttribute(key, cur);
      }
    }
  }
  //remove removed attributes
  // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
  // the other option is to remove all attributes with value == undefined
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      elm.removeAttribute(key);
    }
  }
}

module.exports = {create: updateAttrs, update: updateAttrs};

},{}],7:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class,
      klass = vnode.data.class;

  if (!oldClass && !klass) return;
  oldClass = oldClass || {};
  klass = klass || {};

  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],8:[function(require,module,exports){
function invokeHandler(handler, vnode, event) {
  if (typeof handler === "function") {
    // call function handler
    handler.call(vnode, event, vnode);
  } else if (typeof handler === "object") {
    // call handler with arguments
    if (typeof handler[0] === "function") {
      // special case for single argument for performance
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        var args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      // call multiple handlers
      for (var i = 0; i < handler.length; i++) {
        invokeHandler(handler[i]);
      }
    }
  }
}

function handleEvent(event, vnode) {
  var name = event.type,
      on = vnode.data.on;

  // call event handler(s) if exists
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}

function createListener() {
  return function handler(event) {
    handleEvent(event, handler.vnode);
  }
}

function updateEventListeners(oldVnode, vnode) {
  var oldOn = oldVnode.data.on,
      oldListener = oldVnode.listener,
      oldElm = oldVnode.elm,
      on = vnode && vnode.data.on,
      elm = vnode && vnode.elm,
      name;

  // optimization for reused immutable handlers
  if (oldOn === on) {
    return;
  }

  // remove existing listeners which no longer used
  if (oldOn && oldListener) {
    // if element changed or deleted we remove all existing listeners unconditionally
    if (!on) {
      for (name in oldOn) {
        // remove listener if element was changed or existing listeners removed
        oldElm.removeEventListener(name, oldListener, false);
      }
    } else {
      for (name in oldOn) {
        // remove listener if existing listener removed
        if (!on[name]) {
          oldElm.removeEventListener(name, oldListener, false);
        }
      }
    }
  }

  // add new listeners which has not already attached
  if (on) {
    // reuse existing listener or create new
    var listener = vnode.listener = oldVnode.listener || createListener();
    // update vnode for listener
    listener.vnode = vnode;

    // if element changed or added we add all needed listeners unconditionally
    if (!oldOn) {
      for (name in on) {
        // add listener if element was changed or new listeners added
        elm.addEventListener(name, listener, false);
      }
    } else {
      for (name in on) {
        // add listener if new listener added
        if (!oldOn[name]) {
          elm.addEventListener(name, listener, false);
        }
      }
    }
  }
}

module.exports = {
  create: updateEventListeners,
  update: updateEventListeners,
  destroy: updateEventListeners
};

},{}],9:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props, props = vnode.data.props;

  if (!oldProps && !props) return;
  oldProps = oldProps || {};
  props = props || {};

  for (key in oldProps) {
    if (!props[key]) {
      delete elm[key];
    }
  }
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],10:[function(require,module,exports){
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function(fn) { raf(function() { raf(fn); }); };

function setNextFrame(obj, prop, val) {
  nextFrame(function() { obj[prop] = val; });
}

function updateStyle(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldStyle = oldVnode.data.style,
      style = vnode.data.style;

  if (!oldStyle && !style) return;
  oldStyle = oldStyle || {};
  style = style || {};
  var oldHasDel = 'delayed' in oldStyle;

  for (name in oldStyle) {
    if (!style[name]) {
      elm.style[name] = '';
    }
  }
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style, name, elm = vnode.elm, s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name, elm = vnode.elm, idx, i = 0, maxDur = 0,
      compStyle, style = s.remove, amount = 0, applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if(applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function(ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}

module.exports = {create: updateStyle, update: updateStyle, destroy: applyDestroyStyle, remove: applyRemoveStyle};

},{}],11:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Node */
'use strict';

var VNode = require('./vnode');
var is = require('./is');
var domApi = require('./htmldomapi');

function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }

var emptyNode = VNode('', {}, [], undefined, undefined);

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) map[key] = i;
  }
  return map;
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules, api) {
  var i, j, cbs = {};

  if (isUndef(api)) api = domApi;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function emptyNodeAt(elm) {
    var id = elm.id ? '#' + elm.id : '';
    var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
    return VNode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
  }

  function createRmCb(childElm, listeners) {
    return function() {
      if (--listeners === 0) {
        var parent = api.parentNode(childElm);
        api.removeChild(parent, childElm);
      }
    };
  }

  function createElm(vnode, insertedVnodeQueue) {
    var i, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) {
        i(vnode);
        data = vnode.data;
      }
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (isDef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                                                          : api.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot + 1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          api.appendChild(elm, createElm(children[i], insertedVnodeQueue));
        }
      } else if (is.primitive(vnode.text)) {
        api.appendChild(elm, api.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = api.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      api.insertBefore(parentElm, createElm(vnodes[startIdx], insertedVnodeQueue), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i, j, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm, listeners);
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }
        } else { // Text node
          api.removeChild(parentElm, ch.elm);
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
    var i, hook;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (!sameVnode(oldVnode, vnode)) {
      var parentElm = api.parentNode(oldVnode.elm);
      elm = createElm(vnode, insertedVnodeQueue);
      api.insertBefore(parentElm, elm, oldVnode.elm);
      removeVnodes(parentElm, [oldVnode], 0, 0);
      return;
    }
    if (isDef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) api.setTextContent(elm, '');
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        api.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      api.setTextContent(elm, vnode.text);
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  return function(oldVnode, vnode) {
    var i, elm, parent;
    var insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();

    if (isUndef(oldVnode.sel)) {
      oldVnode = emptyNodeAt(oldVnode);
    }

    if (sameVnode(oldVnode, vnode)) {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      elm = oldVnode.elm;
      parent = api.parentNode(elm);

      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }

    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./htmldomapi":4,"./is":5,"./vnode":12}],12:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],13:[function(require,module,exports){
"use strict";var _typeof=typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"?function(obj){return typeof obj;}:function(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _snabbdom=require("snabbdom");var _snabbdom2=_interopRequireDefault(_snabbdom);var _h=require("snabbdom/h");var _h2=_interopRequireDefault(_h);var _big=require("../node_modules/big.js");var _big2=_interopRequireDefault(_big);var _ugnis=require("./ugnis");var _ugnis2=_interopRequireDefault(_ugnis);var _app=require("../ugnis_components/app.json");var _app2=_interopRequireDefault(_app);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _objectWithoutProperties(obj,keys){var target={};for(var i in obj){if(keys.indexOf(i)>=0)continue;if(!Object.prototype.hasOwnProperty.call(obj,i))continue;target[i]=obj[i];}return target;}function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true});}else{obj[key]=value;}return obj;}function _toConsumableArray(arr){if(Array.isArray(arr)){for(var i=0,arr2=Array(arr.length);i<arr.length;i++){arr2[i]=arr[i];}return arr2;}else{return Array.from(arr);}}function updateProps(oldVnode,vnode){var key=void 0,cur=void 0,old=void 0,elm=vnode.elm,props=vnode.data.liveProps||{};for(key in props){cur=props[key];old=elm[key];if(old!==cur)elm[key]=cur;}}var livePropsPlugin={create:updateProps,update:updateProps};var patch=_snabbdom2.default.init([require('snabbdom/modules/class'),require('snabbdom/modules/props'),require('snabbdom/modules/style'),require('snabbdom/modules/eventlisteners'),require('snabbdom/modules/attributes'),livePropsPlugin]);function uuid(){return(""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/[10]/g,function(){return(0|Math.random()*16).toString(16);});}_big2.default.E_POS=1e+6;function moveInArray(array,moveIndex,toIndex){var item=array[moveIndex];var length=array.length;var diff=moveIndex-toIndex;if(diff>0){return[].concat(_toConsumableArray(array.slice(0,toIndex)),[item],_toConsumableArray(array.slice(toIndex,moveIndex)),_toConsumableArray(array.slice(moveIndex+1,length)));}else if(diff<0){return[].concat(_toConsumableArray(array.slice(0,moveIndex)),_toConsumableArray(array.slice(moveIndex+1,toIndex+1)),[item],_toConsumableArray(array.slice(toIndex+1,length)));}return array;}var attachFastClick=require('fastclick');attachFastClick(document.body);var version='0.0.36v';editor(_app2.default);function editor(appDefinition){var savedDefinition=JSON.parse(localStorage.getItem('app_key_'+version));var tutorialPassed=localStorage.getItem('tutorial_passed');var app=(0,_ugnis2.default)(savedDefinition||appDefinition);var node=document.createElement('div');document.body.appendChild(node);// State
var state={leftOpen:false,rightOpen:true,fullScreen:!tutorialPassed,editorRightWidth:350,editorLeftWidth:350,subEditorWidth:350,componentEditorPosition:{x:window.innerWidth-710,y:window.innerHeight/2},appIsFrozen:false,selectedViewNode:{},selectedPipeId:'',selectedStateNodeId:'',selectedViewSubMenu:'props',editingTitleNodeId:'',viewFoldersClosed:{},draggedComponentView:null,draggedComponentStateId:null,hoveredPipe:null,hoveredViewNode:null,hoveredEvent:null,mousePosition:{},eventStack:[],definition:savedDefinition||app.definition,tutorialPassed:tutorialPassed,tutorialStep:0};// undo/redo
var stateStack=[state.definition];var currentAnimationFrameRequest=null;function setState(newState,timeTraveling){if(newState===state){console.warn('state was mutated, search for a bug');}if(!state.tutorialPassed){if(state.tutorialStep===0&&newState.fullScreen===false){newState.tutorialStep=1;}if(newState.fullScreen===true&&state.tutorialStep===0&&newState.tutorialStep===1){newState.fullScreen=false;}if(state.tutorialStep===1&&newState.selectedViewNode.id){newState.tutorialStep=2;}if(state.tutorialStep===1&&newState.tutorialStep===2&&!newState.selectedViewNode.id){newState.selectedViewNode={ref:'vNodeBox',id:'_rootNode'};}if(state.tutorialStep===2&&newState.tutorialStep===3){newState.leftOpen=true;}if(newState.tutorialPassed){localStorage.setItem('tutorial_passed','true');newState.leftOpen=false;}}if(state.definition!==newState.definition){// unselect deleted components and state
if(newState.definition.state[newState.selectedStateNodeId]===undefined){newState=_extends({},newState,{selectedStateNodeId:''});}if(newState.selectedViewNode.ref!==undefined&&newState.definition[newState.selectedViewNode.ref][newState.selectedViewNode.id]===undefined){newState=_extends({},newState,{selectedViewNode:{}});}// undo/redo then render then save
if(!timeTraveling){var currentIndex=stateStack.findIndex(function(a){return a===state.definition;});stateStack=stateStack.slice(0,currentIndex+1).concat(newState.definition);}app.render(newState.definition);setTimeout(function(){return localStorage.setItem('app_key_'+version,JSON.stringify(newState.definition));},0);}if(state.appIsFrozen!==newState.appIsFrozen||state.selectedViewNode!==newState.selectedViewNode){app._freeze(newState.appIsFrozen,VIEW_NODE_SELECTED,newState.selectedViewNode);}if(newState.editingTitleNodeId&&state.editingTitleNodeId!==newState.editingTitleNodeId){// que auto focus
setTimeout(function(){var node=document.querySelectorAll('[data-istitleeditor]')[0];if(node){node.focus();}},0);}state=newState;if(!currentAnimationFrameRequest){window.requestAnimationFrame(render);}}document.addEventListener('click',function(e){// clicked outside
if(state.editingTitleNodeId&&!e.target.dataset.istitleeditor){setState(_extends({},state,{editingTitleNodeId:''}));}});window.addEventListener("resize",function(){render();},false);window.addEventListener("orientationchange",function(){render();},false);document.addEventListener('keydown',function(e){// 83 - s
// 90 - z
// 89 - y
// 32 - space
// 13 - enter
// 27 - escape
if(e.which===83&&(navigator.platform.match("Mac")?e.metaKey:e.ctrlKey)){// TODO garbage collect
e.preventDefault();fetch('/save',{method:'POST',body:JSON.stringify(state.definition),headers:{"Content-Type":"application/json"}});return false;}if(e.which===32&&(navigator.platform.match("Mac")?e.metaKey:e.ctrlKey)){e.preventDefault();FREEZER_CLICKED();}if(!e.shiftKey&&e.which===90&&(navigator.platform.match("Mac")?e.metaKey:e.ctrlKey)){e.preventDefault();var currentIndex=stateStack.findIndex(function(a){return a===state.definition;});if(currentIndex>0){var newDefinition=stateStack[currentIndex-1];setState(_extends({},state,{definition:newDefinition}),true);}}if(e.which===89&&(navigator.platform.match("Mac")?e.metaKey:e.ctrlKey)||e.shiftKey&&e.which===90&&(navigator.platform.match("Mac")?e.metaKey:e.ctrlKey)){e.preventDefault();var _currentIndex=stateStack.findIndex(function(a){return a===state.definition;});if(_currentIndex<stateStack.length-1){var _newDefinition=stateStack[_currentIndex+1];setState(_extends({},state,{definition:_newDefinition}),true);}}if(e.which===13){setState(_extends({},state,{editingTitleNodeId:''}));}if(e.which===27){FULL_SCREEN_CLICKED(false);}});// Listen to app
app.addListener(function(eventId,data,e,previousState,currentState,mutations){setState(_extends({},state,{eventStack:state.eventStack.concat({eventId:eventId,data:data,e:e,previousState:previousState,currentState:currentState,mutations:mutations})}));});// Actions
var openBoxTimeout=null;function VIEW_DRAGGED(nodeRef,parentRef,initialDepth,e){e.preventDefault();var isArrow=e.target.dataset.closearrow;var isTrashcan=e.target.dataset.trashcan;var initialX=e.touches?e.touches[0].pageX:e.pageX;var initialY=e.touches?e.touches[0].pageY:e.pageY;var position=this.elm.getBoundingClientRect();var offsetX=initialX-position.left;var offsetY=initialY-position.top;function drag(e){e.preventDefault();var x=e.touches?e.touches[0].pageX:e.pageX;var y=e.touches?e.touches[0].pageY:e.pageY;if(!state.draggedComponentView){if(Math.abs(initialY-y)>3){setState(_extends({},state,{draggedComponentView:_extends({},nodeRef,{depth:initialDepth}),mousePosition:{x:x-offsetX,y:y-offsetY}}));}}else{setState(_extends({},state,{mousePosition:{x:x-offsetX,y:y-offsetY}}));}return false;}window.addEventListener('mousemove',drag);window.addEventListener('touchmove',drag);function stopDragging(event){var _extends4,_extends8;event.preventDefault();window.removeEventListener('mousemove',drag);window.removeEventListener('touchmove',drag);window.removeEventListener('mouseup',stopDragging);window.removeEventListener('touchend',stopDragging);if(openBoxTimeout){clearTimeout(openBoxTimeout);openBoxTimeout=null;}if(!state.draggedComponentView){if(event.target===e.target&&isArrow){return VIEW_FOLDER_CLICKED(nodeRef.id);}if(event.target===e.target&&isTrashcan){return DELETE_SELECTED_VIEW(nodeRef,parentRef);}return VIEW_NODE_SELECTED(nodeRef);}if(!state.hoveredViewNode){return setState(_extends({},state,{draggedComponentView:null}));}var newParentRef=state.hoveredViewNode.parent;// frame this somewhere on how not to write code
var fixedParents=_extends({},state,{draggedComponentView:null,hoveredViewNode:null,definition:parentRef.id===newParentRef.id?_extends({},state.definition,_defineProperty({},parentRef.ref,_extends({},state.definition[parentRef.ref],_defineProperty({},parentRef.id,_extends({},state.definition[parentRef.ref][parentRef.id],{children:moveInArray(state.definition[parentRef.ref][parentRef.id].children,state.definition[parentRef.ref][parentRef.id].children.findIndex(function(ref){return ref.id===nodeRef.id;}),state.hoveredViewNode.position)}))))):parentRef.ref===newParentRef.ref?_extends({},state.definition,_defineProperty({},parentRef.ref,_extends({},state.definition[parentRef.ref],(_extends4={},_defineProperty(_extends4,parentRef.id,_extends({},state.definition[parentRef.ref][parentRef.id],{children:state.definition[parentRef.ref][parentRef.id].children.filter(function(ref){return ref.id!==nodeRef.id;})})),_defineProperty(_extends4,newParentRef.id,_extends({},state.definition[newParentRef.ref][newParentRef.id],{children:state.definition[newParentRef.ref][newParentRef.id].children.slice(0,state.hoveredViewNode.position).concat(nodeRef,state.definition[newParentRef.ref][newParentRef.id].children.slice(state.hoveredViewNode.position))})),_extends4)))):_extends({},state.definition,(_extends8={},_defineProperty(_extends8,parentRef.ref,_extends({},state.definition[parentRef.ref],_defineProperty({},parentRef.id,_extends({},state.definition[parentRef.ref][parentRef.id],{children:state.definition[parentRef.ref][parentRef.id].children.filter(function(ref){return ref.id!==nodeRef.id;})})))),_defineProperty(_extends8,newParentRef.ref,_extends({},state.definition[newParentRef.ref],_defineProperty({},newParentRef.id,_extends({},state.definition[newParentRef.ref][newParentRef.id],{children:state.definition[newParentRef.ref][newParentRef.id].children.slice(0,state.hoveredViewNode.position).concat(nodeRef,state.definition[newParentRef.ref][newParentRef.id].children.slice(state.hoveredViewNode.position))})))),_extends8))});setState(_extends({},fixedParents,{definition:_extends({},fixedParents.definition,_defineProperty({},nodeRef.ref,_extends({},fixedParents.definition[nodeRef.ref],_defineProperty({},nodeRef.id,_extends({},fixedParents.definition[nodeRef.ref][nodeRef.id],{parent:newParentRef})))))}));return false;}window.addEventListener('mouseup',stopDragging);window.addEventListener('touchend',stopDragging);return false;}function HOVER_MOBILE(e){var elem=document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY);var moveEvent=new MouseEvent('mousemove',{bubbles:true,cancelable:true,view:window,clientX:e.touches[0].clientX,clientY:e.touches[0].clientY,screenX:e.touches[0].screenX,screenY:e.touches[0].screenY});elem.dispatchEvent(moveEvent);}function VIEW_HOVERED(nodeRef,parentRef,depth,e){if(!state.draggedComponentView){return;}var hitPosition=(e.touches?28:e.layerY)/28;var insertBefore=function insertBefore(){return setState(_extends({},state,{hoveredViewNode:{parent:parentRef,depth:depth,position:state.definition[parentRef.ref][parentRef.id].children.filter(function(ref){return ref.id!==state.draggedComponentView.id;}).findIndex(function(ref){return ref.id===nodeRef.id;})}}));};var insertAfter=function insertAfter(){return setState(_extends({},state,{hoveredViewNode:{parent:parentRef,depth:depth,position:state.definition[parentRef.ref][parentRef.id].children.filter(function(ref){return ref.id!==state.draggedComponentView.id;}).findIndex(function(ref){return ref.id===nodeRef.id;})+1}}));};var insertAsFirst=function insertAsFirst(){return setState(_extends({},state,{hoveredViewNode:{parent:nodeRef,depth:depth+1,position:0}}));};var insertAsLast=function insertAsLast(){return setState(_extends({},state,{hoveredViewNode:{parent:{ref:'vNodeBox',id:'_rootNode'},depth:1,position:state.definition['vNodeBox']['_rootNode'].children.length}}));};var insertAt=function insertAt(toPutRef,index){return setState(_extends({},state,{hoveredViewNode:{parent:toPutRef,depth:depth-1,position:index+1}}));};if(nodeRef.id===state.draggedComponentView.id){var parent=state.definition[parentRef.ref][parentRef.id];// check if the last child, if yes, go to grandparent and drop there after parent
if(parent.children[parent.children.length-1].id===nodeRef.id){if(parentRef.id!=='_rootNode'){var grandparent=state.definition[parent.parent.ref][parent.parent.id];var parentPosition=grandparent.children.findIndex(function(childRef){return childRef.id===parentRef.id;});return insertAt(parent.parent,parentPosition);}}return setState(_extends({},state,{hoveredViewNode:null}));}if(nodeRef.id==='_rootNode'){return insertAsFirst();}if(nodeRef.id==='_lastNode'){return insertAsLast();}// pray to god that you did not make a mistake here
if(state.definition[nodeRef.ref][nodeRef.id].children){// if box
if(state.viewFoldersClosed[nodeRef.id]||state.definition[nodeRef.ref][nodeRef.id].children.length===0){// if closed or empty box
if(hitPosition<0.3){insertBefore();}else{if(!openBoxTimeout){openBoxTimeout=setTimeout(function(){return VIEW_FOLDER_CLICKED(nodeRef.id,false);},500);}insertAsFirst();return;}}else{// open box
if(hitPosition<0.5){insertBefore();}else{insertAsFirst();}}}else{// simple node
if(hitPosition<0.5){insertBefore();}else{insertAfter();}}if(openBoxTimeout){clearTimeout(openBoxTimeout);openBoxTimeout=null;}}function PIPE_HOVERED(pipeRef,e){if(!state.draggedComponentStateId){return;}setState(_extends({},state,{hoveredPipe:pipeRef}));}function COMPONENT_VIEW_DRAGGED(e){var initialX=e.touches?e.touches[0].pageX:e.pageX;var initialY=e.touches?e.touches[0].pageY:e.pageY;var position=this.elm.getBoundingClientRect();var offsetX=initialX-position.left;var offsetY=initialY-position.top;function drag(e){e.preventDefault();var x=e.touches?e.touches[0].pageX:e.pageX;var y=e.touches?e.touches[0].pageY:e.pageY;setState(_extends({},state,{componentEditorPosition:{x:x-offsetX,y:y-offsetY}}));}window.addEventListener('mousemove',drag);window.addEventListener('touchmove',drag);function stopDragging(event){event.preventDefault();window.removeEventListener('mousemove',drag);window.removeEventListener('touchmove',drag);window.removeEventListener('mouseup',stopDragging);window.removeEventListener('touchend',stopDragging);}window.addEventListener('mouseup',stopDragging);window.addEventListener('touchend',stopDragging);}function WIDTH_DRAGGED(widthName,e){e.preventDefault();function resize(e){e.preventDefault();// TODO refactor
var newWidth=window.innerWidth-(e.touches?e.touches[0].pageX:e.pageX);if(widthName==='editorLeftWidth'){newWidth=e.touches?e.touches[0].pageX:e.pageX;}if(widthName==='subEditorWidth'){newWidth=(e.touches?e.touches[0].pageX:e.pageX)-state.componentEditorPosition.x;}if(widthName==='subEditorWidthLeft'){newWidth=state.componentEditorPosition.x+state.subEditorWidth-(e.touches?e.touches[0].pageX:e.pageX);if(newWidth<250){return;}return setState(_extends({},state,{subEditorWidth:newWidth,componentEditorPosition:_extends({},state.componentEditorPosition,{x:e.touches?e.touches[0].pageX:e.pageX})}));}// I probably was drunk
if(widthName!=='subEditorWidth'&&widthName!=='subEditorWidth'&&((widthName==='editorLeftWidth'?state.leftOpen:state.rightOpen)?newWidth<180:newWidth>180)){if(widthName==='editorLeftWidth'){return setState(_extends({},state,{leftOpen:!state.leftOpen}));}return setState(_extends({},state,{rightOpen:!state.rightOpen}));}if(newWidth<250){newWidth=250;}setState(_extends({},state,_defineProperty({},widthName,newWidth)));return false;}window.addEventListener('mousemove',resize);window.addEventListener('touchmove',resize);function stopDragging(e){e.preventDefault();window.removeEventListener('mousemove',resize);window.removeEventListener('touchmove',resize);window.removeEventListener('mouseup',stopDragging);window.removeEventListener('touchend',stopDragging);return false;}window.addEventListener('mouseup',stopDragging);window.addEventListener('touchend',stopDragging);return false;}function STATE_DRAGGED(stateId,e){e.preventDefault();var initialX=e.touches?e.touches[0].pageX:e.pageX;var initialY=e.touches?e.touches[0].pageY:e.pageY;var position=this.elm.getBoundingClientRect();var offsetX=initialX-position.left;var offsetY=initialY-position.top;function drag(e){e.preventDefault();var x=e.touches?e.touches[0].pageX:e.pageX;var y=e.touches?e.touches[0].pageY:e.pageY;if(!state.draggedComponentView){if(Math.abs(initialY-y)>3){setState(_extends({},state,{draggedComponentStateId:stateId,mousePosition:{x:x-offsetX,y:y-offsetY}}));}}else{setState(_extends({},state,{mousePosition:{x:x-offsetX,y:y-offsetY}}));}return false;}window.addEventListener('mousemove',drag);window.addEventListener('touchmove',drag);function stopDragging(event){event.preventDefault();window.removeEventListener('mousemove',drag);window.removeEventListener('touchmove',drag);window.removeEventListener('mouseup',stopDragging);window.removeEventListener('touchend',stopDragging);if(!state.draggedComponentStateId){return STATE_NODE_SELECTED(stateId);}if(!state.hoveredPipe&&!state.hoveredEvent){return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null}));}if(state.hoveredEvent){// check if event already changes the state
if(state.definition.state[state.draggedComponentStateId].mutators.map(function(mutatorRef){return state.definition.mutator[mutatorRef.id].event.id;}).filter(function(eventid){return eventid===state.hoveredEvent.id;}).length){return setState(_extends({},state,{draggedComponentStateId:null,hoveredEvent:null}));}var mutatorId=uuid();var pipeId=uuid();return setState(_extends({},state,{draggedComponentStateId:null,hoveredEvent:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},pipeId,{type:state.definition.state[state.draggedComponentStateId].type,value:{ref:'state',id:state.draggedComponentStateId},transformations:[]})),state:_extends({},state.definition.state,_defineProperty({},state.draggedComponentStateId,_extends({},state.definition.state[state.draggedComponentStateId],{mutators:state.definition.state[state.draggedComponentStateId].mutators.concat({ref:'mutator',id:mutatorId})}))),mutator:_extends({},state.definition.mutator,_defineProperty({},mutatorId,{event:state.hoveredEvent,state:{ref:'state',id:state.draggedComponentStateId},mutation:{ref:'pipe',id:pipeId}})),event:_extends({},state.definition.event,_defineProperty({},state.hoveredEvent.id,_extends({},state.definition.event[state.hoveredEvent.id],{mutators:state.definition.event[state.hoveredEvent.id].mutators.concat({ref:'mutator',id:mutatorId})})))})}));}var pipeDropped=state.definition.pipe[state.hoveredPipe.id];if(pipeDropped.type==='text'){var _extends17,_extends18;if(state.definition.pipe[state.hoveredPipe.id].value.ref&&state.definition.pipe[state.hoveredPipe.id].value.ref==='state'){return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId},transformations:[]})))})}));}var joinIdState=uuid();var joinIdText=uuid();var pipeIdState=uuid();var pipeIdText=uuid();setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,(_extends17={},_defineProperty(_extends17,state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{transformations:[{ref:'join',id:joinIdState},{ref:'join',id:joinIdText}].concat(state.definition.pipe[state.hoveredPipe.id].transformations)})),_defineProperty(_extends17,pipeIdState,{type:'text',value:{ref:'state',id:state.draggedComponentStateId},transformations:[]}),_defineProperty(_extends17,pipeIdText,{type:'text',value:'',transformations:[]}),_extends17)),join:_extends({},state.definition.join,(_extends18={},_defineProperty(_extends18,joinIdState,{value:{ref:'pipe',id:pipeIdState}}),_defineProperty(_extends18,joinIdText,{value:{ref:'pipe',id:pipeIdText}}),_extends18))})}));}if(pipeDropped.type==='number'){// you can't drop boolean into number
if(state.definition.state[state.draggedComponentStateId].type==='boolean'){return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null}));}// you can't drop boolean into number
if(state.definition.state[state.draggedComponentStateId].type==='text'){return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId},transformations:[{ref:'length',id:'noop'}]})))})}));}setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId}})))})}));}if(pipeDropped.type==='boolean'){if(state.definition.state[state.draggedComponentStateId].type==='number'){var _extends21;var eqId=uuid();var _pipeId=uuid();return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,(_extends21={},_defineProperty(_extends21,state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId},transformations:[{ref:'equal',id:eqId}]})),_defineProperty(_extends21,_pipeId,{type:'number',value:0,transformations:[]}),_extends21)),equal:_extends({},state.definition.equal,_defineProperty({},eqId,{value:{ref:'pipe',id:_pipeId}}))})}));}// you can't drop boolean into number
if(state.definition.state[state.draggedComponentStateId].type==='text'){var _extends23;var _eqId=uuid();var _pipeId2=uuid();return setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,(_extends23={},_defineProperty(_extends23,state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId},transformations:[{ref:'equal',id:_eqId}]})),_defineProperty(_extends23,_pipeId2,{type:'text',value:'Default text',transformations:[]}),_extends23)),equal:_extends({},state.definition.equal,_defineProperty({},_eqId,{value:{ref:'pipe',id:_pipeId2}}))})}));}setState(_extends({},state,{draggedComponentStateId:null,hoveredPipe:null,definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},state.hoveredPipe.id,_extends({},state.definition.pipe[state.hoveredPipe.id],{value:{ref:'state',id:state.draggedComponentStateId}})))})}));}}window.addEventListener('mouseup',stopDragging);window.addEventListener('touchend',stopDragging);}function OPEN_SIDEBAR(side){if(side==='left'){return setState(_extends({},state,{leftOpen:!state.leftOpen}));}if(side==='right'){return setState(_extends({},state,{rightOpen:!state.rightOpen}));}}function FREEZER_CLICKED(){setState(_extends({},state,{appIsFrozen:!state.appIsFrozen}));}function VIEW_FOLDER_CLICKED(nodeId,forcedValue){setState(_extends({},state,{viewFoldersClosed:_extends({},state.viewFoldersClosed,_defineProperty({},nodeId,forcedValue!==undefined?forcedValue:!state.viewFoldersClosed[nodeId]))}));}function VIEW_NODE_SELECTED(ref){setState(_extends({},state,{selectedViewNode:ref}));}function UNSELECT_VIEW_NODE(selfOnly,stopPropagation,e){if(stopPropagation){e.stopPropagation();}if(selfOnly&&e.target!==this.elm){return;}setState(_extends({},state,{selectedViewNode:{}}));}function STATE_NODE_SELECTED(nodeId){setState(_extends({},state,{selectedStateNodeId:nodeId}));}function UNSELECT_STATE_NODE(e){if(e.target===this.elm){setState(_extends({},state,{selectedStateNodeId:''}));}}function ADD_NODE(nodeRef,type){if(!nodeRef.ref||!state.definition[nodeRef.ref][nodeRef.id]||!state.definition[nodeRef.ref][nodeRef.id].children){if(state.selectedViewNode.id&&state.selectedViewNode.id!=='_rootNode'){nodeRef=state.definition[state.selectedViewNode.ref][state.selectedViewNode.id].parent;}else{nodeRef={ref:'vNodeBox',id:'_rootNode'};}}var nodeId=nodeRef.id;var newNodeId=uuid();var newStyleId=uuid();var newStyle={};if(type==='box'){var _extends27,_extends32;var newNode={title:'box',parent:nodeRef,style:{ref:'style',id:newStyleId},children:[]};return setState(_extends({},state,{selectedViewNode:{ref:'vNodeBox',id:newNodeId},definition:nodeRef.ref==='vNodeBox'?_extends({},state.definition,{vNodeBox:_extends({},state.definition.vNodeBox,(_extends27={},_defineProperty(_extends27,nodeId,_extends({},state.definition.vNodeBox[nodeId],{children:state.definition.vNodeBox[nodeId].children.concat({ref:'vNodeBox',id:newNodeId})})),_defineProperty(_extends27,newNodeId,newNode),_extends27)),style:_extends({},state.definition.style,_defineProperty({},newStyleId,newStyle))}):_extends({},state.definition,(_extends32={},_defineProperty(_extends32,nodeRef.ref,_extends({},state.definition[nodeRef.ref],_defineProperty({},nodeId,_extends({},state.definition[nodeRef.ref][nodeId],{children:state.definition[nodeRef.ref][nodeId].children.concat({ref:'vNodeBox',id:newNodeId})})))),_defineProperty(_extends32,"vNodeBox",_extends({},state.definition.vNodeBox,_defineProperty({},newNodeId,newNode))),_defineProperty(_extends32,"style",_extends({},state.definition.style,_defineProperty({},newStyleId,newStyle))),_extends32))}));}if(type==='text'){var _extends37;var pipeId=uuid();var _newNode={title:'text',parent:nodeRef,style:{ref:'style',id:newStyleId},value:{ref:'pipe',id:pipeId}};var newPipe={type:'text',value:'Default Text',transformations:[]};return setState(_extends({},state,{selectedViewNode:{ref:'vNodeText',id:newNodeId},definition:_extends({},state.definition,(_extends37={pipe:_extends({},state.definition.pipe,_defineProperty({},pipeId,newPipe))},_defineProperty(_extends37,nodeRef.ref,_extends({},state.definition[nodeRef.ref],_defineProperty({},nodeId,_extends({},state.definition[nodeRef.ref][nodeId],{children:state.definition[nodeRef.ref][nodeId].children.concat({ref:'vNodeText',id:newNodeId})})))),_defineProperty(_extends37,"vNodeText",_extends({},state.definition.vNodeText,_defineProperty({},newNodeId,_newNode))),_defineProperty(_extends37,"style",_extends({},state.definition.style,_defineProperty({},newStyleId,newStyle))),_extends37))}));}if(type==='image'){var _extends42;var _pipeId3=uuid();var _newNode2={title:'image',parent:nodeRef,style:{ref:'style',id:newStyleId},src:{ref:'pipe',id:_pipeId3}};var _newPipe={type:'text',value:'https://www.ugnis.com/images/logo256x256.png',transformations:[]};return setState(_extends({},state,{selectedViewNode:{ref:'vNodeImage',id:newNodeId},definition:_extends({},state.definition,(_extends42={pipe:_extends({},state.definition.pipe,_defineProperty({},_pipeId3,_newPipe))},_defineProperty(_extends42,nodeRef.ref,_extends({},state.definition[nodeRef.ref],_defineProperty({},nodeId,_extends({},state.definition[nodeRef.ref][nodeId],{children:state.definition[nodeRef.ref][nodeId].children.concat({ref:'vNodeImage',id:newNodeId})})))),_defineProperty(_extends42,"vNodeImage",_extends({},state.definition.vNodeImage,_defineProperty({},newNodeId,_newNode2))),_defineProperty(_extends42,"style",_extends({},state.definition.style,_defineProperty({},newStyleId,newStyle))),_extends42))}));}if(type==='if'){var _extends44,_extends48;var _pipeId4=uuid();var _newNode3={title:'conditional',parent:nodeRef,value:{ref:'pipe',id:_pipeId4},children:[]};var _newPipe2={type:'boolean',value:true,transformations:[]};return setState(_extends({},state,{selectedViewNode:{ref:'vNodeIf',id:newNodeId},definition:nodeRef.ref==='vNodeIf'?_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},_pipeId4,_newPipe2)),vNodeIf:_extends({},state.definition.vNodeIf,(_extends44={},_defineProperty(_extends44,nodeId,_extends({},state.definition.vNodeIf[nodeId],{children:state.definition.vNodeIf[nodeId].children.concat({ref:'vNodeIf',id:newNodeId})})),_defineProperty(_extends44,newNodeId,_newNode3),_extends44))}):_extends({},state.definition,(_extends48={pipe:_extends({},state.definition.pipe,_defineProperty({},_pipeId4,_newPipe2))},_defineProperty(_extends48,nodeRef.ref,_extends({},state.definition[nodeRef.ref],_defineProperty({},nodeId,_extends({},state.definition[nodeRef.ref][nodeId],{children:state.definition[nodeRef.ref][nodeId].children.concat({ref:'vNodeIf',id:newNodeId})})))),_defineProperty(_extends48,"vNodeIf",_extends({},state.definition.vNodeIf,_defineProperty({},newNodeId,_newNode3))),_extends48))}));}if(type==='input'){var _extends49,_extends57;var stateId=uuid();var eventId=uuid();var mutatorId=uuid();var pipeInputId=uuid();var pipeMutatorId=uuid();var _newNode4={title:'input',parent:nodeRef,style:{ref:'style',id:newStyleId},value:{ref:'pipe',id:pipeInputId},input:{ref:'event',id:eventId}};var newPipeInput={type:'text',value:{ref:'state',id:stateId},transformations:[]};var newPipeMutator={type:'text',value:{ref:'eventData',id:'_input'},transformations:[]};var newState={title:'input value',type:'text',ref:stateId,defaultValue:'Default text',mutators:[{ref:'mutator',id:mutatorId}]};var newMutator={event:{ref:'event',id:eventId},state:{ref:'state',id:stateId},mutation:{ref:'pipe',id:pipeMutatorId}};var newEvent={type:'input',title:'update input',mutators:[{ref:'mutator',id:mutatorId}],emitter:{ref:'vNodeInput',id:newNodeId},data:[{ref:'eventData',id:'_input'}]};return setState(_extends({},state,{selectedViewNode:{ref:'vNodeInput',id:newNodeId},definition:_extends({},state.definition,(_extends57={pipe:_extends({},state.definition.pipe,(_extends49={},_defineProperty(_extends49,pipeInputId,newPipeInput),_defineProperty(_extends49,pipeMutatorId,newPipeMutator),_extends49))},_defineProperty(_extends57,nodeRef.ref,_extends({},state.definition[nodeRef.ref],_defineProperty({},nodeId,_extends({},state.definition[nodeRef.ref][nodeId],{children:state.definition[nodeRef.ref][nodeId].children.concat({ref:'vNodeInput',id:newNodeId})})))),_defineProperty(_extends57,"vNodeInput",_extends({},state.definition.vNodeInput,_defineProperty({},newNodeId,_newNode4))),_defineProperty(_extends57,"style",_extends({},state.definition.style,_defineProperty({},newStyleId,newStyle))),_defineProperty(_extends57,"nameSpace",_extends({},state.definition.nameSpace,_defineProperty({},'_rootNameSpace',_extends({},state.definition.nameSpace['_rootNameSpace'],{children:state.definition.nameSpace['_rootNameSpace'].children.concat({ref:'state',id:stateId})})))),_defineProperty(_extends57,"state",_extends({},state.definition.state,_defineProperty({},stateId,newState))),_defineProperty(_extends57,"mutator",_extends({},state.definition.mutator,_defineProperty({},mutatorId,newMutator))),_defineProperty(_extends57,"event",_extends({},state.definition.event,_defineProperty({},eventId,newEvent))),_extends57))}));}}function ADD_STATE(namespaceId,type){var newStateId=uuid();var newState=void 0;if(type==='text'){newState={title:'new text',ref:newStateId,type:'text',defaultValue:'Default text',mutators:[]};}if(type==='number'){newState={title:'new number',ref:newStateId,type:'number',defaultValue:0,mutators:[]};}if(type==='boolean'){newState={title:'new boolean',type:'boolean',ref:newStateId,defaultValue:true,mutators:[]};}if(type==='table'){newState={title:'new table',type:'table',ref:newStateId,defaultValue:{},mutators:[]};}if(type==='folder'){var _extends58;newState={title:'new folder',children:[]};return setState(_extends({},state,{definition:_extends({},state.definition,{nameSpace:_extends({},state.definition.nameSpace,(_extends58={},_defineProperty(_extends58,namespaceId,_extends({},state.definition.nameSpace[namespaceId],{children:state.definition.nameSpace[namespaceId].children.concat({ref:'nameSpace',id:newStateId})})),_defineProperty(_extends58,newStateId,newState),_extends58))})}));}setState(_extends({},state,{definition:_extends({},state.definition,{nameSpace:_extends({},state.definition.nameSpace,_defineProperty({},namespaceId,_extends({},state.definition.nameSpace[namespaceId],{children:state.definition.nameSpace[namespaceId].children.concat({ref:'state',id:newStateId})}))),state:_extends({},state.definition.state,_defineProperty({},newStateId,newState))})}));}function ADD_DEFAULT_STYLE(styleId,key){var pipeId=uuid();var defaults={'background':'white','border':'1px solid black','outline':'1px solid black','cursor':'pointer','color':'black','display':'block','top':'0px','bottom':'0px','transition':'0.5s all','left':'0px','right':'0px','flex':'1 1 auto','justifyContent':'center','alignItems':'center','maxWidth':'100%','maxHeight':'100%','minWidth':'100%','minHeight':'100%','position':'absolute','overflow':'auto','height':'500px','width':'500px','font':'italic 2em "Comic Sans MS", cursive, sans-serif','margin':'10px','padding':'10px'};setState(_extends({},state,{definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},pipeId,{type:'text',value:defaults[key],transformations:[]})),style:_extends({},state.definition.style,_defineProperty({},styleId,_extends({},state.definition.style[styleId],_defineProperty({},key,{ref:'pipe',id:pipeId}))))})}));}function SELECT_VIEW_SUBMENU(newId){setState(_extends({},state,{selectedViewSubMenu:newId}));}function EDIT_VIEW_NODE_TITLE(nodeId){setState(_extends({},state,{editingTitleNodeId:nodeId}));}function DELETE_SELECTED_VIEW(nodeRef,parentRef){var _extends66;// remove all events from state
var events=getAvailableEvents(nodeRef.ref);var newState=state.definition.state;events.forEach(function(event){var eventRef=state.definition[nodeRef.ref][nodeRef.id][event.propertyName];if(eventRef){// event -> mutators -> states
state.definition[eventRef.ref][eventRef.id].mutators.forEach(function(mutatorRef){var stateRef=state.definition[mutatorRef.ref][mutatorRef.id].state;newState=_extends({},newState,_defineProperty({},stateRef.id,_extends({},newState[stateRef.id],{mutators:newState[stateRef.id].mutators.filter(function(mutator){return mutator.id!==mutatorRef.id;})})));});}});setState(_extends({},state,{definition:_extends({},state.definition,(_extends66={},_defineProperty(_extends66,parentRef.ref,_extends({},state.definition[parentRef.ref],_defineProperty({},parentRef.id,_extends({},state.definition[parentRef.ref][parentRef.id],{children:state.definition[parentRef.ref][parentRef.id].children.filter(function(ref){return ref.id!==nodeRef.id;})})))),_defineProperty(_extends66,"state",newState),_extends66)),selectedViewNode:{}}));}function CHANGE_VIEW_NODE_TITLE(nodeRef,e){e.preventDefault();var nodeId=nodeRef.id;var nodeType=nodeRef.ref;setState(_extends({},state,{definition:_extends({},state.definition,_defineProperty({},nodeType,_extends({},state.definition[nodeType],_defineProperty({},nodeId,_extends({},state.definition[nodeType][nodeId],{title:e.target.value})))))}));}function CHANGE_STATE_NODE_TITLE(nodeId,e){e.preventDefault();setState(_extends({},state,{definition:_extends({},state.definition,{state:_extends({},state.definition.state,_defineProperty({},nodeId,_extends({},state.definition.state[nodeId],{title:e.target.value})))})}));}function CHANGE_NAMESPACE_TITLE(nodeId,e){e.preventDefault();setState(_extends({},state,{definition:_extends({},state.definition,{nameSpace:_extends({},state.definition.nameSpace,_defineProperty({},nodeId,_extends({},state.definition.nameSpace[nodeId],{title:e.target.value})))})}));}function CHANGE_CURRENT_STATE_TEXT_VALUE(stateId,e){app.setCurrentState(_extends({},app.getCurrentState(),_defineProperty({},stateId,e.target.value)));render();}function CHANGE_CURRENT_STATE_NUMBER_VALUE(stateId,e){// todo big throws error instead of returning NaN... fix, rewrite or hack
try{if((0,_big2.default)(e.target.value).toString()!==app.getCurrentState()[stateId].toString()){app.setCurrentState(_extends({},app.getCurrentState(),_defineProperty({},stateId,(0,_big2.default)(e.target.value))));render();}}catch(err){}}function CHANGE_STATIC_VALUE(ref,propertyName,type,e){var value=e.target.value;if(type==='number'){try{value=(0,_big2.default)(e.target.value);}catch(err){return;}}if(type==='boolean'){value=value===true||value==='true'?true:false;}setState(_extends({},state,{definition:_extends({},state.definition,_defineProperty({},ref.ref,_extends({},state.definition[ref.ref],_defineProperty({},ref.id,_extends({},state.definition[ref.ref][ref.id],_defineProperty({},propertyName,value))))))}));}function ADD_EVENT(propertyName,node){var _extends79;var ref=state.selectedViewNode;var eventId=uuid();setState(_extends({},state,{definition:_extends({},state.definition,(_extends79={},_defineProperty(_extends79,ref.ref,_extends({},state.definition[ref.ref],_defineProperty({},ref.id,_extends({},state.definition[ref.ref][ref.id],_defineProperty({},propertyName,{ref:'event',id:eventId}))))),_defineProperty(_extends79,"event",_extends({},state.definition.event,_defineProperty({},eventId,{type:propertyName,emitter:node,mutators:[],data:[]}))),_extends79))}));}function SELECT_PIPE(pipeId,e){e.stopPropagation();setState(_extends({},state,{selectedPipeId:pipeId}));}function CHANGE_PIPE_VALUE_TO_STATE(pipeId){if(!state.selectedStateNodeId||state.selectedStateNodeId===state.definition.pipe[pipeId].value.id){return;}setState(_extends({},state,{definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},pipeId,_extends({},state.definition.pipe[pipeId],{value:{ref:'state',id:state.selectedStateNodeId},transformations:[]})))})}));}function ADD_DEFAULT_TRANSFORMATION(pipeId){var _extends82,_extends83;var defaultTransformations={text:'toUpperCase',number:'add',boolean:'and'};var defaultValues={text:'Default text',number:0,boolean:true};var pipe=state.definition.pipe[pipeId];var stateInPipe=state.definition.state[pipe.value.id];var transformation=defaultTransformations[stateInPipe.type];var value=defaultValues[stateInPipe.type];var newPipeId=uuid();var newId=uuid();var oldTransformations=state.definition.pipe[pipeId].transformations;var newPipeTransformations=pipe.type==='text'||pipe.type===stateInPipe.type?oldTransformations.concat({ref:transformation,id:newId}):oldTransformations.slice(0,oldTransformations.length-1).concat({ref:transformation,id:newId}).concat(oldTransformations.slice(oldTransformations.length-1));setState(_extends({},state,{definition:_extends({},state.definition,(_extends83={},_defineProperty(_extends83,transformation,_extends({},state.definition[transformation],_defineProperty({},newId,{value:{ref:'pipe',id:newPipeId}}))),_defineProperty(_extends83,"pipe",_extends({},state.definition.pipe,(_extends82={},_defineProperty(_extends82,newPipeId,{type:pipe.type,value:value,transformations:[]}),_defineProperty(_extends82,pipeId,_extends({},state.definition.pipe[pipeId],{transformations:newPipeTransformations})),_extends82))),_extends83))}));}function RESET_APP_STATE(){app.setCurrentState(app.createDefaultState());setState(_extends({},state,{eventStack:[]}));}function RESET_APP_DEFINITION(){if(state.definition!==appDefinition){setState(_extends({},state,{definition:_extends({},appDefinition)}));}}function FULL_SCREEN_CLICKED(value){if(value!==state.fullScreen){setState(_extends({},state,{fullScreen:value}));}}function SAVE_DEFAULT(stateId){setState(_extends({},state,{definition:_extends({},state.definition,{state:_extends({},state.definition.state,_defineProperty({},stateId,_extends({},state.definition.state[stateId],{defaultValue:app.getCurrentState()[stateId]})))})}));}function DELETE_STATE(stateId){var removedPipeState=state;Object.keys(state.definition.pipe).forEach(function(pipeid){if(state.definition.pipe[pipeid].value.id===stateId){removedPipeState=resetPipeFunc(pipeid,removedPipeState);}});var _removedPipeState$def=removedPipeState.definition.state,deletedState=_removedPipeState$def[stateId],newState=_objectWithoutProperties(_removedPipeState$def,[stateId]);var events=removedPipeState.definition.event;deletedState.mutators.forEach(function(mutatorRef){var mutator=removedPipeState.definition[mutatorRef.ref][mutatorRef.id];var event=mutator.event;events=_extends({},events,_defineProperty({},event.id,_extends({},events[event.id],{mutators:events[event.id].mutators.filter(function(mutRef){return mutRef.id!==mutatorRef.id;})})));});setState(_extends({},removedPipeState,{selectedStateNodeId:'',definition:_extends({},removedPipeState.definition,{state:newState,nameSpace:_extends({},removedPipeState.definition.nameSpace,{'_rootNameSpace':_extends({},removedPipeState.definition.nameSpace['_rootNameSpace'],{children:removedPipeState.definition.nameSpace['_rootNameSpace'].children.filter(function(ref){return ref.id!==stateId;})})}),event:events})}));}function EVENT_HOVERED(eventRef){setState(_extends({},state,{hoveredEvent:eventRef}));}function EVENT_UNHOVERED(){if(state.hoveredEvent){setState(_extends({},state,{hoveredEvent:null}));}}function PIPE_UNHOVERED(){if(state.hoveredPipe){setState(_extends({},state,{hoveredPipe:null}));}}function resetPipeFunc(pipeId,state){var defaultValues={text:'Default text',number:0,boolean:true};var parentJoinId=void 0;Object.keys(state.definition.join).forEach(function(joinId){if(state.definition.join[joinId].value.id===pipeId){parentJoinId=joinId;}});if(parentJoinId){var pipes=Object.keys(state.definition.pipe);for(var i=0;i<pipes.length;i++){var parentPipeId=pipes[i];for(var index=0;index<state.definition.pipe[parentPipeId].transformations.length;index++){var ref=state.definition.pipe[parentPipeId].transformations[index];if(ref.id===parentJoinId){var joinRef=state.definition.pipe[parentPipeId].transformations[index+1];var secondPipeRef=state.definition.join[joinRef.id].value;var text=state.definition.pipe[secondPipeRef.id].value;return _extends({},state,{selectedPipeId:'',definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},parentPipeId,_extends({},state.definition.pipe[parentPipeId],{value:state.definition.pipe[parentPipeId].value+text,transformations:state.definition.pipe[parentPipeId].transformations.slice(0,index).concat(state.definition.pipe[secondPipeRef.id].transformations).concat(state.definition.pipe[parentPipeId].transformations.slice(index+2))})))})});}}}}else{return _extends({},state,{selectedPipeId:'',definition:_extends({},state.definition,{pipe:_extends({},state.definition.pipe,_defineProperty({},pipeId,_extends({},state.definition.pipe[pipeId],{value:defaultValues[state.definition.pipe[pipeId].type],transformations:[]})))})});}}function RESET_PIPE(pipeId,e){e.stopPropagation();setState(resetPipeFunc(pipeId,state));}function CHANGE_TRANSFORMATION(pipeRef,transformationRef,index,e){var _extends90;if(transformationRef.ref===e.target.value){return;}var _state$definition$tra=state.definition[transformationRef.ref],actualTransform=_state$definition$tra[transformationRef.id],left=_objectWithoutProperties(_state$definition$tra,[transformationRef.id]);setState(_extends({},state,{definition:_extends({},state.definition,(_extends90={pipe:_extends({},state.definition.pipe,_defineProperty({},pipeRef.id,_extends({},state.definition.pipe[pipeRef.id],{transformations:state.definition.pipe[pipeRef.id].transformations.map(function(transf){return transf.id===transformationRef.id?{ref:e.target.value,id:transformationRef.id}:transf;})})))},_defineProperty(_extends90,transformationRef.ref,left),_defineProperty(_extends90,e.target.value,_extends({},state.definition[e.target.value],_defineProperty({},transformationRef.id,actualTransform))),_extends90))}));}function NEXT_TUTORIAL_STEP(e){e.preventDefault();if(state.tutorialStep===3){setState(_extends({},state,{tutorialPassed:true}));}setState(_extends({},state,{tutorialStep:state.tutorialStep+1}));}var boxIcon=function boxIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'layers');};var ifIcon=function ifIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'},style:{transform:'rotate(90deg)'}},'call_split');};var numberIcon=function numberIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'looks_one');};var listIcon=function listIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'view_list');};var inputIcon=function inputIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'input');};var textIcon=function textIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'text_fields');};var textReverseIcon=function textReverseIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'format_size');};var deleteIcon=function deleteIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons','data-trashcan':true}},'delete_forever');};var clearIcon=function clearIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'clear');};var closeIcon=function closeIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'close');};var addCircleIcon=function addCircleIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'add_circle');};var folderIcon=function folderIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'folder');};var saveIcon=function saveIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'check');};var imageIcon=function imageIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'}},'image');};var warningIcon=function warningIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'},style:{cursor:'default'}},'whatshot');};// priority_high
var appIcon=function appIcon(){return(0,_h2.default)('i',{attrs:{class:'material-icons'},style:{fontSize:'18px'}},'description');};var arrowIcon=function arrowIcon(rotate){return(0,_h2.default)('i',{attrs:{class:'material-icons','data-closearrow':true},style:{transition:'all 0.2s',transform:rotate?'rotate(-90deg)':'rotate(0deg)',cursor:'pointer'}},'expand_more');};function getAvailableEvents(type){var availableEvents=[{description:'on click',propertyName:'click'},{description:'double clicked',propertyName:'dblclick'},{description:'mouse over',propertyName:'mouseover'},{description:'mouse out',propertyName:'mouseout'}];if(type==='vNodeInput'){availableEvents=availableEvents.concat([{description:'input',propertyName:'input'},{description:'focus',propertyName:'focus'},{description:'blur',propertyName:'blur'}]);}return availableEvents;}var fields={vNodeBox:['style','children','mouseout','mouseover','dblclick','click'],vNodeText:['style','value','mouseout','mouseover','dblclick','click'],vNodeInput:['style','value','mouseout','mouseover','dblclick','click','input','focus','blur'],vNodeIf:['value','children'],vNodeImage:['style','src','mouseout','mouseover','dblclick','click'],add:['value'],subtract:['value'],multiply:['value'],divide:['value'],remainder:['value'],join:['value'],and:['value'],or:['value'],equal:['value'],event:['mutators'],mutator:['mutation'],style:['background','border','outline','cursor','color','transition','display','top','bottom','left','flex','justifyContent','alignItems','width','height','maxWidth','maxHeight','minWidth','minHeight','right','position','overflow','font','margin','padding'],state:[],length:[],toLowerCase:[],toUpperCase:[],pipe:['value','transformations']};var memoizedRefs={};function lookForSelectedState(nodeRef){// check if node was memoized, has not changed (immutable reference) and has an answer for seleted state
if(memoizedRefs[nodeRef.id]&&memoizedRefs[nodeRef.id].stateDefinition===state.definition&&memoizedRefs[nodeRef.id].isClosed===state.viewFoldersClosed[nodeRef.id]&&memoizedRefs[nodeRef.id][state.selectedStateNodeId]!==undefined){return memoizedRefs[nodeRef.id][state.selectedStateNodeId];}// check data, style, event mutations
var value=function(){var node=state.definition[nodeRef.ref][nodeRef.id];var fieldsToCheck=fields[nodeRef.ref];for(var i=0;i<fieldsToCheck.length;i++){var fieldName=fieldsToCheck[i];if(node[fieldName]===undefined)continue;if(node[fieldName].id===state.selectedStateNodeId)return true;// transformations, children, mutators
if(fieldName==='children'&&state.viewFoldersClosed[nodeRef.id]||fieldName==='mutators'||fieldName==='transformations'){for(var j=0;j<node[fieldName].length;j++){if(lookForSelectedState(node[fieldName][j])===true){return true;}}}if(node[fieldName].ref){if(lookForSelectedState(node[fieldName])===true){return true;}}}return false;}();memoizedRefs[nodeRef.id]=_extends({},memoizedRefs[nodeRef.id],_defineProperty({stateDefinition:state.definition,isClosed:state.viewFoldersClosed[nodeRef.id]},state.selectedStateNodeId,value));return value;}function render(){var currentRunningState=app.getCurrentState();var dragComponentLeft=(0,_h2.default)('div',{on:{mousedown:[WIDTH_DRAGGED,'editorLeftWidth'],touchstart:[WIDTH_DRAGGED,'editorLeftWidth']},style:{position:'absolute',right:'0',transform:'translateX(100%)',top:'0',width:'10px',height:'100%',textAlign:'center',fontSize:'1em',opacity:'0',cursor:'col-resize'}});var openComponentLeft=(0,_h2.default)('div',{on:{mousedown:[OPEN_SIDEBAR,'left'],touchstart:[OPEN_SIDEBAR,'left']},style:{position:'absolute',right:'-3px',top:'50%',transform:'translateZ(0) translateX(100%) translateY(-50%)',width:'15px',height:'10%',textAlign:'center',fontSize:'1em',borderRadius:'0 5px 5px 0',background:'#5d5d5d',boxShadow:'inset 0 0 2px 7px #222',cursor:'pointer'}});var openComponentRight=(0,_h2.default)('div',{on:{mousedown:[OPEN_SIDEBAR,'right'],touchstart:[OPEN_SIDEBAR,'right']},style:{position:'absolute',left:'-3px',top:'50%',transform:'translateZ(0) translateX(-100%) translateY(-50%)',width:'15px',height:'10%',textAlign:'center',fontSize:'1em',borderRadius:'5px 0 0 5px',background:'#5d5d5d',boxShadow:'inset 0 0 2px 7px #222',cursor:'pointer'}});var dragComponentRight=(0,_h2.default)('div',{on:{mousedown:[WIDTH_DRAGGED,'editorRightWidth'],touchstart:[WIDTH_DRAGGED,'editorRightWidth']},style:{position:'absolute',left:'0',transform:'translateX(-100%)',top:'0',width:'10px',height:'100%',textAlign:'center',fontSize:'1em',opacity:'0',cursor:'col-resize'}});var dragSubComponentRight=(0,_h2.default)('div',{on:{mousedown:[WIDTH_DRAGGED,'subEditorWidth'],touchstart:[WIDTH_DRAGGED,'subEditorWidth']},style:{position:'absolute',right:'2px',transform:'translateX(100%)',top:'0',width:'10px',height:'100%',textAlign:'center',fontSize:'1em',opacity:0,cursor:'col-resize'}});var dragSubComponentLeft=(0,_h2.default)('div',{on:{mousedown:[WIDTH_DRAGGED,'subEditorWidthLeft'],touchstart:[WIDTH_DRAGGED,'subEditorWidthLeft']},style:{position:'absolute',left:'2px',transform:'translateX(-100%)',top:'0',width:'10px',height:'100%',textAlign:'center',fontSize:'1em',opacity:0,cursor:'col-resize'}});function emberEditor(ref){var pipe=state.definition[ref.ref][ref.id];function listTransformations(transformations){return transformations.map(function(transRef,index){var transformer=state.definition[transRef.ref][transRef.id];if(transRef.ref==='equal'){return(0,_h2.default)('div',{style:{paddingTop:'5px'}},[(0,_h2.default)('span',{style:{color:'#bdbdbd',cursor:'default',display:'inline-block'}},[(0,_h2.default)('span',{style:{flex:'1'}},transRef.ref)]),(0,_h2.default)('span',{style:{display:'inline-block'}},[emberEditor(transformer.value)])]);}if(transRef.ref==='join'){return(0,_h2.default)('span',{},[emberEditor(transformer.value)]);}if(transRef.ref==='length'){return(0,_h2.default)('div',{style:{paddingTop:'5px'}},[(0,_h2.default)('div',{style:{cursor:'default'}},[(0,_h2.default)('span',{style:{color:'#bdbdbd'}},transRef.ref)])]);}var numberTransf=[{title:'add',sign:'+'},{title:'subtract',sign:'-'},{title:'multiply',sign:'*'},{title:'divide',sign:'/'},{title:'remainder',sign:'%'}];var textTransf=[{title:'toUpperCase',sign:'to upper case'},{title:'toLowerCase',sign:'to lower case'}];var boolTransf=[{title:'and',sign:'and'},{title:'or',sign:'or'}];if(transRef.ref==='add'||transRef.ref==='subtract'||transRef.ref==='multiply'||transRef.ref==='divide'||transRef.ref==='remainder'){return(0,_h2.default)('div',{style:{paddingTop:'5px',display:'flex',alignItems:'stretch'}},[(0,_h2.default)('select',{liveProps:{value:transRef.ref},style:{color:'white',background:'none',outline:'none',display:'inline',border:'none'},on:{input:[CHANGE_TRANSFORMATION,ref,transRef,index]}},numberTransf.map(function(description){return(0,_h2.default)('option',{attrs:{value:description.title},style:{color:'black'}},description.sign);})),(0,_h2.default)('span',{style:{color:'#bdbdbd',display:'flex',cursor:'default',paddingRight:'5px',borderRight:'2px solid #bdbdbd',marginRight:'5px'}},[(0,_h2.default)('span',{style:{flex:'1'}})]),(0,_h2.default)('span',{style:{display:'inline-block'}},[emberEditor(transformer.value)])]);}if(transRef.ref==='toUpperCase'||transRef.ref==='toLowerCase'){return(0,_h2.default)('div',{style:{paddingTop:'5px',display:'flex',alignItems:'stretch'}},[(0,_h2.default)('select',{liveProps:{value:transRef.ref},style:{color:'white',background:'none',outline:'none',display:'inline',border:'none'},on:{input:[CHANGE_TRANSFORMATION,ref,transRef,index]}},textTransf.map(function(description){return(0,_h2.default)('option',{attrs:{value:description.title},style:{color:'black'}},description.sign);})),(0,_h2.default)('span',{style:{color:'#bdbdbd',display:'flex',cursor:'default',paddingRight:'5px',marginRight:'5px'}},[(0,_h2.default)('span',{style:{flex:'1'}})])]);}if(transRef.ref==='and'||transRef.ref==='or'){return(0,_h2.default)('div',{style:{paddingTop:'5px',display:'flex',alignItems:'stretch'}},[(0,_h2.default)('select',{liveProps:{value:transRef.ref},style:{color:'white',background:'none',outline:'none',display:'inline',border:'none'},on:{input:[CHANGE_TRANSFORMATION,ref,transRef,index]}},boolTransf.map(function(description){return(0,_h2.default)('option',{attrs:{value:description.title},style:{color:'black'}},description.sign);})),(0,_h2.default)('span',{style:{color:'#bdbdbd',display:'flex',cursor:'default',paddingRight:'5px',borderRight:'2px solid #bdbdbd',marginRight:'5px'}},[(0,_h2.default)('span',{style:{flex:'1'}})]),(0,_h2.default)('span',{style:{display:'inline-block'}},[emberEditor(transformer.value)])]);}});}if(typeof pipe.value==='string'){return(0,_h2.default)('div',{style:{display:'flex',alignItems:'baseline'},on:{click:[SELECT_PIPE,ref.id]}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',position:'relative',transform:'translateZ(0)'}},[(0,_h2.default)('span',{style:{opacity:'0',display:'inline-block',whiteSpace:'pre',padding:'0 5px 2px 5px',borderBottom:'2px solid white'}},pipe.value),(0,_h2.default)('input',{attrs:{type:'text'},style:{color:'white',outline:'none',boxShadow:'none',textAlign:'center',display:'inline',border:'none',borderBottom:'2px solid white',background:'none',font:'inherit',position:'absolute',top:'0',left:'0',width:'100%',flex:'0 0 auto'},on:{input:[CHANGE_STATIC_VALUE,ref,'value','text'],mousemove:[PIPE_HOVERED,ref],mouseout:[PIPE_UNHOVERED]},liveProps:{value:pipe.value}})])].concat(_toConsumableArray(listTransformations(pipe.transformations,pipe.type))));}if(pipe.value===true||pipe.value===false){return(0,_h2.default)('select',{liveProps:{value:pipe.value.toString()},style:{},on:{click:[SELECT_PIPE,ref.id],input:[CHANGE_STATIC_VALUE,ref,'value','boolean'],mousemove:[PIPE_HOVERED,ref],mouseout:[PIPE_UNHOVERED]}},[(0,_h2.default)('option',{attrs:{value:'true'},style:{color:'black'}},['true']),(0,_h2.default)('option',{attrs:{value:'false'},style:{color:'black'}},['false'])]);}if(!isNaN(parseFloat(Number(pipe.value)))&&isFinite(Number(pipe.value))){return(0,_h2.default)('div',{style:{display:'flex',alignItems:'baseline'},on:{click:[SELECT_PIPE,ref.id]}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',position:'relative',transform:'translateZ(0)'}},[(0,_h2.default)('span',{style:{opacity:'0',display:'inline-block',whiteSpace:'pre',padding:'0 5px 2px 5px',borderBottom:'2px solid white'}},Number(pipe.value)),(0,_h2.default)('input',{attrs:{type:'number'},style:{color:'white',outline:'none',boxShadow:'none',textAlign:'center',display:'inline',border:'none',borderBottom:'2px solid white',background:'none',font:'inherit',position:'absolute',top:'0',left:'0',width:'100%',flex:'0 0 auto'},on:{input:[CHANGE_STATIC_VALUE,ref,'value','number'],mousemove:[PIPE_HOVERED,ref],mouseout:[PIPE_UNHOVERED]},liveProps:{value:Number(pipe.value)}})])].concat(_toConsumableArray(listTransformations(pipe.transformations,pipe.type))));}if(pipe.value.ref==='state'){var displState=state.definition[pipe.value.ref][pipe.value.id];return(0,_h2.default)('div',{style:{flex:'1'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center'},on:{click:[SELECT_PIPE,ref.id],mousemove:[PIPE_HOVERED,ref],mouseout:[PIPE_UNHOVERED]}},[(0,_h2.default)('span',{style:{whiteSpace:'nowrap',flex:'0 0 auto',display:'inline-block',position:'relative',transform:'translateZ(0)',boxShadow:'inset 0 0 0 2px '+(state.selectedStateNodeId===pipe.value.id?'#eab65c':'#828282'),background:'#444',padding:'4px 7px'}},[(0,_h2.default)('span',{style:{color:'white',display:'inline-block'},on:{click:[STATE_NODE_SELECTED,pipe.value.id]}},displState.title)]),state.selectedPipeId===ref.id?(0,_h2.default)('span',{style:{flex:'0 0 auto',marginLeft:'auto'},on:{click:[ADD_DEFAULT_TRANSFORMATION,state.selectedPipeId]}},[addCircleIcon()]):(0,_h2.default)('span'),state.selectedPipeId===ref.id?(0,_h2.default)('span',{style:{flex:'0 0 auto'},on:{click:[RESET_PIPE,ref.id]}},[deleteIcon()]):(0,_h2.default)('span')])].concat(_toConsumableArray(listTransformations(pipe.transformations,pipe.type))));}if(pipe.value.ref==='eventData'){var eventData=state.definition[pipe.value.ref][pipe.value.id];return(0,_h2.default)('div',[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center'},on:{click:[SELECT_PIPE,ref.id]}},[(0,_h2.default)('div',{style:{flex:'1'}},[(0,_h2.default)('div',{style:{cursor:'pointer',color:state.selectedStateNodeId===pipe.value.id?'#eab65c':'white',padding:'2px 5px',margin:'3px 3px 0 0',border:'2px solid '+(state.selectedStateNodeId===pipe.value.id?'#eab65c':'white'),display:'inline-block'},on:{click:[STATE_NODE_SELECTED,pipe.value.id]}},[eventData.title])])]),(0,_h2.default)('div',{style:{paddingLeft:'15px'}},listTransformations(pipe.transformations,pipe.type))]);}}function listState(stateId){var currentState=state.definition.state[stateId];function editingNode(){return(0,_h2.default)('input',{style:{color:'white',outline:'none',padding:'4px 7px',boxShadow:'none',display:'inline',border:'none',background:'none',font:'inherit',position:'absolute',top:'0',left:'0',width:'100%',flex:'0 0 auto'},on:{input:[CHANGE_STATE_NODE_TITLE,stateId]},liveProps:{value:currentState.title},attrs:{'data-istitleeditor':true}});}return(0,_h2.default)('div',{style:{cursor:'pointer',position:'relative',fontSize:'14px'}},[(0,_h2.default)('span',{style:{display:'flex',flexWrap:'wrap',marginTop:'6px'}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',position:'relative',transform:'translateZ(0)',margin:'0 7px 0 0',boxShadow:'inset 0 0 0 2px '+(state.selectedStateNodeId===stateId?'#eab65c':'#828282'),background:'#444',padding:'4px 7px'}},[(0,_h2.default)('span',{style:{opacity:state.editingTitleNodeId===stateId?'0':'1',color:'white',display:'inline-block'},on:{mousedown:[STATE_DRAGGED,stateId],touchstart:[STATE_DRAGGED,stateId],touchmove:[HOVER_MOBILE],dblclick:[EDIT_VIEW_NODE_TITLE,stateId]}},currentState.title),state.editingTitleNodeId===stateId?editingNode():(0,_h2.default)('span')]),function(){var noStyleInput={color:currentRunningState[stateId]!==state.definition.state[stateId].defaultValue?'rgb(91, 204, 91)':'white',background:'none',outline:'none',display:'inline',flex:'1',minWidth:'50px',border:'none',boxShadow:'inset 0 -2px 0 0 '+(state.selectedStateNodeId===stateId?'#eab65c':'#828282')};if(currentState.type==='text')return(0,_h2.default)('input',{attrs:{type:'text'},liveProps:{value:currentRunningState[stateId]},style:noStyleInput,on:{input:[CHANGE_CURRENT_STATE_TEXT_VALUE,stateId]}});if(currentState.type==='number')return(0,_h2.default)('input',{attrs:{type:'number'},liveProps:{value:currentRunningState[stateId]},style:noStyleInput,on:{input:[CHANGE_CURRENT_STATE_NUMBER_VALUE,stateId]}});if(currentState.type==='boolean')return(0,_h2.default)('select',{liveProps:{value:currentRunningState[stateId].toString()},style:noStyleInput,on:{input:[CHANGE_CURRENT_STATE_TEXT_VALUE,stateId]}},[(0,_h2.default)('option',{attrs:{value:'true'},style:{color:'black'}},['true']),(0,_h2.default)('option',{attrs:{value:'false'},style:{color:'black'}},['false'])]);if(currentState.type==='table'){var _ret=function(){if(state.selectedStateNodeId!==stateId){return{v:(0,_h2.default)('div',{key:'icon',on:{click:[STATE_NODE_SELECTED,stateId]},style:{display:'flex',alignItems:'center',marginTop:'7px'}},[listIcon()])};}var table=currentRunningState[stateId];return{v:(0,_h2.default)('div',{key:'table',style:{background:'#828183',width:'100%',flex:'0 0 100%'}},[(0,_h2.default)('div',{style:{display:'flex'}},Object.keys(currentState.definition).map(function(key){return(0,_h2.default)('div',{style:{flex:'1',padding:'2px 5px',borderBottom:'2px solid white'}},key);}))].concat(_toConsumableArray(Object.keys(table).map(function(id){return(0,_h2.default)('div',{style:{display:'flex'}},Object.keys(table[id]).map(function(key){return(0,_h2.default)('div',{style:{flex:'1',padding:'2px 5px'}},table[id][key]);}));}))))};}();if((typeof _ret==="undefined"?"undefined":_typeof(_ret))==="object")return _ret.v;}}(),currentRunningState[stateId]!==state.definition.state[stateId].defaultValue?(0,_h2.default)('div',{style:{display:'inline-flex',alignSelf:'center'},on:{click:[SAVE_DEFAULT,stateId]}},[saveIcon()]):(0,_h2.default)('span'),state.selectedStateNodeId===stateId?(0,_h2.default)('div',{style:{color:'#eab65c',display:'inline-flex',alignSelf:'center'},on:{click:[DELETE_STATE,stateId]}},[deleteIcon()]):(0,_h2.default)('span')]),state.selectedStateNodeId===stateId?(0,_h2.default)('span',currentState.mutators.map(function(mutatorRef){var mutator=state.definition[mutatorRef.ref][mutatorRef.id];var event=state.definition[mutator.event.ref][mutator.event.id];var emitter=state.definition[event.emitter.ref][event.emitter.id];return(0,_h2.default)('div',{style:{display:'flex',cursor:'pointer',alignItems:'center',background:'#444',paddingTop:'3px',paddingBottom:'3px',color:state.selectedViewNode.id===event.emitter.id?'#53B2ED':'white',transition:'0.2s all',minWidth:'100%'},on:{click:[VIEW_NODE_SELECTED,event.emitter]}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',margin:'0 3px 0 5px',display:'inline-flex'}},[event.emitter.ref==='vNodeBox'?boxIcon():event.emitter.ref==='vNodeList'?listIcon():event.emitter.ref==='vNodeList'?ifIcon():event.emitter.ref==='vNodeInput'?inputIcon():textIcon()]),(0,_h2.default)('span',{style:{flex:'5 5 auto',margin:'0 5px 0 0',minWidth:'0',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}},emitter.title),(0,_h2.default)('span',{style:{flex:'0 0 auto',marginLeft:'auto',marginRight:'5px',color:'#5bcc5b'}},event.type)]);})):(0,_h2.default)('span')]);}function fakeState(stateId){var currentState=state.definition.state[stateId];return(0,_h2.default)('span',{style:{flex:'0 0 auto',position:'relative',transform:'translateZ(0)',margin:'7px 7px 0 0',boxShadow:'inset 0 0 0 2px '+(state.selectedStateNodeId===stateId?'#eab65c':'#828282'),background:'#444',padding:'4px 7px'}},[(0,_h2.default)('span',{style:{color:'white',display:'inline-block'}},currentState.title)]);}var stateComponent=(0,_h2.default)('div',{attrs:{class:'better-scrollbar'},style:{overflow:'auto',flex:'1',padding:'0 10px'},on:{click:[UNSELECT_STATE_NODE]}},state.definition.nameSpace['_rootNameSpace'].children.map(function(ref){return listState(ref.id);}));function listNode(nodeRef,parentRef,depth){if(nodeRef.id==='_rootNode')return listRootNode(nodeRef);if(nodeRef.ref==='vNodeText')return simpleNode(nodeRef,parentRef,depth);if(nodeRef.ref==='vNodeImage')return simpleNode(nodeRef,parentRef,depth);if(nodeRef.ref==='vNodeBox'||nodeRef.ref==='vNodeList'||nodeRef.ref==='vNodeIf')return listBoxNode(nodeRef,parentRef,depth);if(nodeRef.ref==='vNodeInput')return simpleNode(nodeRef,parentRef,depth);}function prevent_bubbling(e){e.stopPropagation();}function editingNode(nodeRef){return(0,_h2.default)('input',{style:{border:'none',height:'26px',background:'none',color:'#53B2ED',outline:'none',flex:'1',padding:'0',boxShadow:'inset 0 -1px 0 0 #53B2ED',font:'inherit',paddingLeft:'2px'},on:{mousedown:prevent_bubbling,input:[CHANGE_VIEW_NODE_TITLE,nodeRef]},liveProps:{value:state.definition[nodeRef.ref][nodeRef.id].title},attrs:{autofocus:true,'data-istitleeditor':true}});}function listRootNode(nodeRef){var nodeId=nodeRef.id;var node=state.definition[nodeRef.ref][nodeId];return(0,_h2.default)('div',{style:{position:'relative'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',paddingLeft:'8px',paddingRight:'8px',background:'#444',borderTop:'2px solid #4d4d4d',borderBottom:'2px solid #333',height:'26px',whiteSpace:'nowrap'},on:{mousemove:[VIEW_HOVERED,nodeRef,{},1],touchmove:[HOVER_MOBILE]}},[(0,_h2.default)('span',{key:nodeId,style:{color:state.selectedViewNode.id===nodeId?'#53B2ED':'#bdbdbd',display:'inline-flex'},on:{click:[VIEW_NODE_SELECTED,nodeRef]}},[appIcon()]),state.editingTitleNodeId===nodeId?editingNode(nodeRef):(0,_h2.default)('span',{style:{flex:'1',cursor:'pointer',color:state.selectedViewNode.id===nodeId?'#53B2ED':'white',transition:'color 0.2s',paddingLeft:'2px'},on:{click:[VIEW_NODE_SELECTED,nodeRef],dblclick:[EDIT_VIEW_NODE_TITLE,nodeId]}},node.title)]),(0,_h2.default)('div',state.hoveredViewNode&&state.hoveredViewNode.parent.id===nodeId&&!(node.children.findIndex(function(ref){return ref.id===state.draggedComponentView.id;})===state.hoveredViewNode.position)?function(){// copy pasted from listBoxNode
var oldPosition=node.children.findIndex(function(ref){return ref.id===state.draggedComponentView.id;});var newPosition=oldPosition===-1||state.hoveredViewNode.position<oldPosition?state.hoveredViewNode.position:state.hoveredViewNode.position+1;var children=node.children.map(function(ref){return listNode(ref,nodeRef,1);});return children.slice(0,newPosition).concat(spacerComponent(),children.slice(newPosition));}():node.children.map(function(ref){return listNode(ref,nodeRef,1);})),(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',paddingLeft:'8px',paddingRight:'8px',height:'15px'},on:{mousemove:[VIEW_HOVERED,{id:'_lastNode'},{},1],touchmove:[HOVER_MOBILE]}})]);}function listBoxNode(nodeRef,parentRef,depth){var nodeId=nodeRef.id;var node=state.definition[nodeRef.ref][nodeId];return(0,_h2.default)('div',{style:{opacity:state.draggedComponentView&&state.draggedComponentView.id===nodeId?'0.5':'1.0'}},[(0,_h2.default)('div',{key:nodeId,style:{display:'flex',height:'26px',position:'relative',alignItems:'center',paddingLeft:(depth-(node.children.length>0||state.hoveredViewNode&&state.hoveredViewNode.parent.id===nodeId?1:0))*20+8+'px',paddingRight:'8px',background:'#444',borderTop:'2px solid #4d4d4d',borderBottom:'2px solid #333',whiteSpace:'nowrap',color:state.selectedViewNode.id===nodeId?'#53B2ED':'white'},on:{mousedown:[VIEW_DRAGGED,nodeRef,parentRef,depth],touchstart:[VIEW_DRAGGED,nodeRef,parentRef,depth],mousemove:[VIEW_HOVERED,nodeRef,parentRef,depth],touchmove:[HOVER_MOBILE]}},[node.children.length>0||state.hoveredViewNode&&state.hoveredViewNode.parent.id===nodeId?(0,_h2.default)('span',{style:{display:'inline-flex'}},[arrowIcon(state.viewFoldersClosed[nodeId]||state.draggedComponentView&&nodeId===state.draggedComponentView.id)]):(0,_h2.default)('span'),(0,_h2.default)('span',{key:nodeId,style:{display:'inline-flex',color:state.selectedViewNode.id===nodeId?'#53B2ED':'#bdbdbd',transition:'color 0.2s'}},[nodeRef.ref==='vNodeBox'?boxIcon():nodeRef.ref==='vNodeList'?listIcon():ifIcon()]),state.editingTitleNodeId===nodeId?editingNode(nodeRef):(0,_h2.default)('span',{style:{flex:'1',cursor:'pointer',transition:'color 0.2s',paddingLeft:'2px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'},on:{dblclick:[EDIT_VIEW_NODE_TITLE,nodeId]}},node.title),(0,_h2.default)('div',{style:{color:'#53B2ED',cursor:'pointer',display:state.selectedViewNode.id===nodeId?'inline-flex':'none',flex:'0 0 auto'}},[deleteIcon()]),(0,_h2.default)('div',{style:{color:'#eab65c',display:state.selectedStateNodeId&&lookForSelectedState(nodeRef)?'inline-flex':'none',flex:'0 0 auto'}},[warningIcon()])]),(0,_h2.default)('div',{style:{display:state.viewFoldersClosed[nodeId]||state.draggedComponentView&&nodeId===state.draggedComponentView.id?'none':'block'}},state.hoveredViewNode&&state.hoveredViewNode.parent.id===nodeId&&!(node.children.findIndex(function(ref){return ref.id===state.draggedComponentView.id;})===state.hoveredViewNode.position)?function(){// adds a fake component
var oldPosition=node.children.findIndex(function(ref){return ref.id===state.draggedComponentView.id;});// this is needed because we still show the old node
var newPosition=oldPosition===-1||state.hoveredViewNode.position<oldPosition?state.hoveredViewNode.position:state.hoveredViewNode.position+1;var children=node.children.map(function(ref){return listNode(ref,nodeRef,depth+1);});return children.slice(0,newPosition).concat(spacerComponent(),children.slice(newPosition));}():node.children.map(function(ref){return listNode(ref,nodeRef,depth+1);}))]);}function simpleNode(nodeRef,parentRef,depth){var nodeId=nodeRef.id;var node=state.definition[nodeRef.ref][nodeId];return(0,_h2.default)('div',{key:nodeId,style:{cursor:'pointer',opacity:state.draggedComponentView&&state.draggedComponentView.id===nodeId?'0.5':'1.0',position:'relative',height:'26px',paddingLeft:depth*20+8+'px',paddingRight:'8px',background:'#444',borderTop:'2px solid #4d4d4d',borderBottom:'2px solid #333',whiteSpace:'nowrap',display:'flex',alignItems:'center',color:state.selectedViewNode.id===nodeId?'#53B2ED':'#bdbdbd'},on:{mousedown:[VIEW_DRAGGED,nodeRef,parentRef,depth],touchstart:[VIEW_DRAGGED,nodeRef,parentRef,depth],dblclick:[EDIT_VIEW_NODE_TITLE,nodeId],mousemove:[VIEW_HOVERED,nodeRef,parentRef,depth],touchmove:[HOVER_MOBILE]}},[nodeRef.ref==='vNodeInput'?inputIcon():nodeRef.ref==='vNodeImage'?imageIcon():textIcon(),state.editingTitleNodeId===nodeId?editingNode(nodeRef):(0,_h2.default)('span',{style:{flex:'1',color:state.selectedViewNode.id===nodeId?'#53B2ED':'white',transition:'color 0.2s',paddingLeft:'2px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}},node.title),(0,_h2.default)('div',{style:{color:'#53B2ED',cursor:'pointer',display:state.selectedViewNode.id===nodeId?'inline-flex':'none',flex:'0 0 auto'}},[deleteIcon()]),(0,_h2.default)('div',{style:{color:'#eab65c',display:state.selectedStateNodeId&&lookForSelectedState(nodeRef)?'inline-flex':'none',flex:'0 0 auto'}},[warningIcon()])]);}function spacerComponent(){return(0,_h2.default)('div',{key:'spacer',style:{cursor:'pointer',height:'6px',boxShadow:'inset 0 0 1px 1px #53B2ED'}});}function fakeComponent(nodeRef,depth){var nodeId=nodeRef.id;var node=state.definition[nodeRef.ref][nodeId];return(0,_h2.default)('div',{key:'_fake'+nodeId,style:{cursor:'pointer',transition:'padding-left 0.2s',height:'26px',paddingLeft:(depth-(node.children&&node.children.length>0?1:0))*20+8+'px',paddingRight:'8px',background:'rgba(68,68,68,0.8)',borderTop:'2px solid #4d4d4d',borderBottom:'2px solid #333',whiteSpace:'nowrap',display:'flex',alignItems:'center',color:state.selectedViewNode.id===nodeId?'#53B2ED':'#bdbdbd'}},[(nodeRef.ref==='vNodeBox'||nodeRef.ref==='vNodeList'||nodeRef.ref==='vNodeIf')&&node.children.length>0?arrowIcon(true):(0,_h2.default)('span',{key:'_fakeSpan'+nodeId}),nodeRef.ref==='vNodeBox'?boxIcon():nodeRef.ref==='vNodeList'?listIcon():nodeRef.ref==='vNodeIf'?ifIcon():nodeRef.ref==='vNodeInput'?inputIcon():nodeRef.ref==='vNodeImage'?imageIcon():textIcon(),(0,_h2.default)('span',{style:{flex:'1',color:state.selectedViewNode.id===nodeId?'#53B2ED':'white',transition:'color 0.2s',paddingLeft:'2px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}},node.title)]);}function generateEditNodeComponent(){var styles=fields.style;var selectedNode=state.definition[state.selectedViewNode.ref][state.selectedViewNode.id];var propsComponent=(0,_h2.default)('div',{style:{background:state.selectedViewSubMenu==='props'?'#4d4d4d':'#3d3d3d',padding:'10px 0',flex:'1',cursor:'pointer',textAlign:'center'},on:{click:[SELECT_VIEW_SUBMENU,'props']}},'data');var styleComponent=(0,_h2.default)('div',{style:{background:state.selectedViewSubMenu==='style'?'#4d4d4d':'#3d3d3d',padding:'10px 0',flex:'1',borderRight:'1px solid #222',borderLeft:'1px solid #222',textAlign:'center',cursor:'pointer'},on:{click:[SELECT_VIEW_SUBMENU,'style']}},'style');var eventsComponent=(0,_h2.default)('div',{style:{background:state.selectedViewSubMenu==='events'?'#4d4d4d':'#3d3d3d',padding:'10px 0',flex:'1',textAlign:'center',cursor:'pointer'},on:{click:[SELECT_VIEW_SUBMENU,'events']}},'events');var genpropsSubmenuComponent=function genpropsSubmenuComponent(){return(0,_h2.default)('div',[function(){if(state.selectedViewNode.ref==='vNodeBox'){return(0,_h2.default)('div',{style:{textAlign:'center',marginTop:'100px',color:'#bdbdbd'}},'no data required');}if(state.selectedViewNode.ref==='vNodeText'){return(0,_h2.default)('div',{style:{overflow:'auto'},attrs:{"class":'better-scrollbar'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},'text value'),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'text')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedNode.value,'text')])]);}if(state.selectedViewNode.ref==='vNodeImage'){return(0,_h2.default)('div',{style:{overflow:'auto'},attrs:{"class":'better-scrollbar'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},'source (url)'),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'text')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedNode.src,'text')])]);}if(state.selectedViewNode.ref==='vNodeInput'){return(0,_h2.default)('div',{style:{overflow:'auto'},attrs:{"class":'better-scrollbar'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},'input value'),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'text')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedNode.value,'text')])]);}if(state.selectedViewNode.ref==='vNodeList'){return(0,_h2.default)('div',{style:{overflow:'auto'},attrs:{"class":'better-scrollbar'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},'table'),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'table')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedNode.value,'table')])]);}if(state.selectedViewNode.ref==='vNodeIf'){return(0,_h2.default)('div',{style:{overflow:'auto'},attrs:{"class":'better-scrollbar'}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},'predicate'),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'true/false')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedNode.value,'boolean')])]);}}()]);};var genstyleSubmenuComponent=function genstyleSubmenuComponent(){var selectedStyle=state.definition.style[selectedNode.style.id];return(0,_h2.default)('div',{attrs:{class:'better-scrollbar'},style:{overflow:'auto'}},[(0,_h2.default)('div',{style:{padding:'10px',fontFamily:"'Comfortaa', sans-serif",color:'#bdbdbd'}},'style panel will change a lot in 1.0v, right now it\'s just CSS')].concat(_toConsumableArray(Object.keys(selectedStyle).map(function(key){return(0,_h2.default)('div',{style:{}},[(0,_h2.default)('div',{style:{display:'flex',alignItems:'center',background:'#676767',padding:'5px 10px',marginBottom:'10px'}},[(0,_h2.default)('span',{style:{flex:'1'}},key),(0,_h2.default)('div',{style:{flex:'0',cursor:'default',color:'#bdbdbd'}},'text')]),(0,_h2.default)('div',{style:{padding:'5px 10px'}},[emberEditor(selectedStyle[key],'text')])]);})),[(0,_h2.default)('div',{style:{padding:'5px 10px',fontFamily:"'Comfortaa', sans-serif",color:'#bdbdbd'}},'add Style:'),(0,_h2.default)('div',{style:{padding:'5px 0 5px 10px'}},styles.filter(function(key){return!Object.keys(selectedStyle).includes(key);}).map(function(key){return(0,_h2.default)('div',{on:{click:[ADD_DEFAULT_STYLE,selectedNode.style.id,key]},style:{cursor:'pointer',border:'3px solid white',padding:'5px',marginTop:'5px'}},'+ '+key);}))]));};var geneventsSubmenuComponent=function geneventsSubmenuComponent(){var availableEvents=getAvailableEvents(state.selectedViewNode.ref);var currentEvents=availableEvents.filter(function(event){return selectedNode[event.propertyName];});var eventsLeft=availableEvents.filter(function(event){return!selectedNode[event.propertyName];});return(0,_h2.default)('div',{attrs:{class:'better-scrollbar'},style:{overflow:'auto'}},[].concat(_toConsumableArray(currentEvents.length?currentEvents.map(function(eventDesc){var event=state.definition[selectedNode[eventDesc.propertyName].ref][selectedNode[eventDesc.propertyName].id];return(0,_h2.default)('div',[(0,_h2.default)('div',{style:{background:'#676767',padding:'5px 10px'},on:{mousemove:[EVENT_HOVERED,selectedNode[eventDesc.propertyName]],mouseout:[EVENT_UNHOVERED]}},event.type),eventDesc.description==='input'?(0,_h2.default)('div',{style:{padding:'10px 10px 0 10px',fontFamily:"'Comfortaa', sans-serif",color:'#bdbdbd'}},'Hey, input is using event data, but we are currently working on this part. Some functionality might still be missing'):(0,_h2.default)('span'),(0,_h2.default)('div',{style:{color:'white',transition:'color 0.2s',fontSize:'14px',cursor:'pointer',padding:'5px 10px'}},event.mutators.map(function(mutatorRef){var mutator=state.definition[mutatorRef.ref][mutatorRef.id];var stateDef=state.definition[mutator.state.ref][mutator.state.id];return(0,_h2.default)('div',{style:{marginTop:'10px',display:'flex',alignItems:'center'}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',display:'inline-block',position:'relative',transform:'translateZ(0)',boxShadow:'inset 0 0 0 2px '+(state.selectedStateNodeId===mutator.state.id?'#eab65c':'#828282'),background:'#444',padding:'4px 7px'}},[(0,_h2.default)('span',{style:{color:'white',display:'inline-block'},on:{click:[STATE_NODE_SELECTED,mutator.state.id]}},stateDef.title)]),(0,_h2.default)('span',{style:{color:'white',fontSize:'1.8em',padding:'10px'}},'='),emberEditor(mutator.mutation,stateDef.type)]);}))]);}):[]),[(0,_h2.default)('div',{style:{padding:'5px 10px',fontFamily:"'Comfortaa', sans-serif",color:'#bdbdbd'}},'add Event:'),(0,_h2.default)('div',{style:{padding:'5px 0 5px 10px'}},[].concat(_toConsumableArray(eventsLeft.map(function(event){return(0,_h2.default)('div',{style:{border:'3px solid #5bcc5b',cursor:'pointer',padding:'5px',margin:'10px'},on:{click:[ADD_EVENT,event.propertyName,state.selectedViewNode]}},'+ '+event.description);}))))]));};var fullVNode=['vNodeBox','vNodeText','vNodeImage','vNodeInput'].includes(state.selectedViewNode.ref);return(0,_h2.default)('div',{style:{position:'fixed',font:"300 1.2em 'Open Sans'",lineHeight:'1.2em',color:'white',left:state.componentEditorPosition.x+'px',top:state.componentEditorPosition.y+'px',height:'50%',display:'flex',zIndex:'3000'}},[(0,_h2.default)('div',{style:{flex:'1',display:'flex',marginBottom:'10px',flexDirection:'column',background:'#4d4d4d',width:state.subEditorWidth+'px',border:'3px solid #222'}},[(0,_h2.default)('div',{style:{flex:'0 0 auto'}},[(0,_h2.default)('div',{style:{display:'flex',cursor:'default',alignItems:'center',background:'#222',paddingTop:'2px',paddingBottom:'5px',color:'#53B2ED',minWidth:'100%'},on:{mousedown:[COMPONENT_VIEW_DRAGGED],touchstart:[COMPONENT_VIEW_DRAGGED]}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',margin:'0 2px 0 5px',display:'inline-flex'}},[state.selectedViewNode.id==='_rootNode'?appIcon():state.selectedViewNode.ref==='vNodeBox'?boxIcon():state.selectedViewNode.ref==='vNodeList'?listIcon():state.selectedViewNode.ref==='vNodeList'?ifIcon():state.selectedViewNode.ref==='vNodeInput'?inputIcon():state.selectedViewNode.ref==='vNodeImage'?imageIcon():textIcon()]),(0,_h2.default)('span',{style:{flex:'5 5 auto',margin:'0 5px 0 0',minWidth:'0',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',fontSize:'0.8em'}},selectedNode.title),(0,_h2.default)('span',{style:{flex:'0 0 auto',marginLeft:'auto',cursor:'pointer',marginRight:'5px',color:'white',display:'inline-flex'},on:{mousedown:[UNSELECT_VIEW_NODE,false,true],touchstart:[UNSELECT_VIEW_NODE,false,true]}},[clearIcon()])])]),fullVNode?(0,_h2.default)('div',{style:{display:'flex',flex:'0 0 auto',fontFamily:"'Comfortaa', sans-serif"}},[propsComponent,styleComponent,eventsComponent]):(0,_h2.default)('span'),dragSubComponentRight,dragSubComponentLeft,state.selectedViewSubMenu==='props'||!fullVNode?genpropsSubmenuComponent():state.selectedViewSubMenu==='style'?genstyleSubmenuComponent():state.selectedViewSubMenu==='events'?geneventsSubmenuComponent():(0,_h2.default)('span','Error, no such menu')])]);}var addStateComponent=(0,_h2.default)('div',{style:{flex:'0 auto',marginLeft:state.rightOpen?'-10px':'0',border:'3px solid #222',borderRight:'none',background:'#333',height:'40px',display:'flex',alignItems:'center'}},[(0,_h2.default)('span',{style:{fontFamily:"'Comfortaa', sans-serif",fontSize:'0.9em',cursor:'pointer',padding:'0 5px'}},'add state: '),(0,_h2.default)('span',{style:{display:'inline-block'},on:{click:[ADD_STATE,'_rootNameSpace','text']}},[textIcon()]),(0,_h2.default)('span',{on:{click:[ADD_STATE,'_rootNameSpace','number']}},[numberIcon()]),(0,_h2.default)('span',{on:{click:[ADD_STATE,'_rootNameSpace','boolean']}},[ifIcon()])]);var addViewNodeComponent=(0,_h2.default)('div',{style:{flex:'0 auto',marginLeft:state.rightOpen?'-10px':'0',border:'3px solid #222',borderRight:'none',background:'#333',height:'40px',display:'flex',alignItems:'center'}},[(0,_h2.default)('span',{style:{fontFamily:"'Comfortaa', sans-serif",fontSize:'0.9em',padding:'0 10px'}},'add component: '),(0,_h2.default)('span',{on:{click:[ADD_NODE,state.selectedViewNode,'box']}},[boxIcon()]),(0,_h2.default)('span',{on:{click:[ADD_NODE,state.selectedViewNode,'input']}},[inputIcon()]),(0,_h2.default)('span',{on:{click:[ADD_NODE,state.selectedViewNode,'text']}},[textIcon()]),(0,_h2.default)('span',{on:{click:[ADD_NODE,state.selectedViewNode,'image']}},[imageIcon()]),(0,_h2.default)('span',{on:{click:[ADD_NODE,state.selectedViewNode,'if']}},[ifIcon()])]);var viewComponent=(0,_h2.default)('div',{attrs:{class:'better-scrollbar'},style:{overflow:'auto',position:'relative',flex:'1',fontSize:'0.8em'}},[listNode({ref:'vNodeBox',id:'_rootNode'},{},0)]);var rightComponent=(0,_h2.default)('div',{style:{display:'flex',flexDirection:'column',position:'absolute',top:'0',right:'0',color:'white',height:'100%',font:"300 1.2em 'Open Sans'",lineHeight:'1.2em',width:state.editorRightWidth+'px',background:'#4d4d4d',boxSizing:"border-box",borderLeft:'3px solid #222',transition:'0.5s transform',transform:state.rightOpen?'translateZ(0) translateX(0%)':'translateZ(0) translateX(100%)',userSelect:'none'}},[dragComponentRight,openComponentRight,addStateComponent,stateComponent,addViewNodeComponent,viewComponent]);var topComponent=(0,_h2.default)('div',{style:{flex:'1 auto',height:'75px',maxHeight:'75px',minHeight:'75px',background:'#222',display:'flex',justifyContent:'center',fontFamily:"'Comfortaa', sans-serif"}},[(0,_h2.default)('a',{style:{flex:'0 auto',width:'190px',textDecoration:'inherit',userSelect:'none'},attrs:{href:'/_dev'}},[(0,_h2.default)('img',{style:{margin:'7px -2px -3px 5px',display:'inline-block'},attrs:{src:'/images/logo256x256.png',height:'57'}}),(0,_h2.default)('span',{style:{fontSize:'44px',verticalAlign:'bottom',color:'#fff'}},'ugnis')]),(0,_h2.default)('div',{style:{position:'absolute',top:'0',right:'0',border:'none',color:'white',fontFamily:"'Comfortaa', sans-serif",fontSize:'16px'}},[(0,_h2.default)('div',{style:{background:'#444444',border:'none',color:'white',display:'inline-block',padding:'15px 20px',margin:'13px 13px 0 0',cursor:'pointer'},on:{click:[FULL_SCREEN_CLICKED,true]}},'full screen'),(0,_h2.default)('div',{style:{background:'#444444',border:'none',color:'white',display:'inline-block',padding:'15px 20px',margin:'13px 13px 0 0',cursor:'pointer'},on:{click:RESET_APP_STATE}},'reset state'),(0,_h2.default)('div',{style:{background:'#444444',border:'none',color:'white',display:'inline-block',padding:'15px 20px',margin:'13px 13px 0 0',cursor:'pointer'},on:{click:RESET_APP_DEFINITION}},'reset demo')])]);var leftComponent=(0,_h2.default)('div',{style:{display:'flex',flexDirection:'column',position:'absolute',top:'0',left:'0',height:'100%',color:'white',font:"300 1.2em 'Open Sans'",width:state.editorLeftWidth+'px',background:'#4d4d4d',boxSizing:"border-box",borderRight:'3px solid #222',transition:'0.5s transform',transform:state.leftOpen?'translateZ(0) translateX(0%)':'translateZ(0) translateX(-100%)',userSelect:'none'}},[dragComponentLeft,openComponentLeft,(0,_h2.default)('div',{on:{click:FREEZER_CLICKED},style:{flex:'0 auto',padding:'10px',textAlign:'center',background:'#333',cursor:'pointer'}},[(0,_h2.default)('span',{style:{padding:'15px 15px 10px 15px',color:state.appIsFrozen?'rgb(91, 204, 91)':'rgb(204, 91, 91)'}},state.appIsFrozen?'►':'❚❚')]),(0,_h2.default)('div',{attrs:{class:'better-scrollbar'},style:{flex:'1 auto',overflow:'auto'}},state.eventStack.filter(function(eventData){return state.definition.event[eventData.eventId]!==undefined;}).reverse()// mutates the array, but it was already copied with filter
.slice(0,21).map(function(eventData,index){var event=state.definition.event[eventData.eventId];var emitter=state.definition[event.emitter.ref][event.emitter.id];// no idea why this key works, don't touch it, probably rerenders more than needed, but who cares
return(0,_h2.default)('div',{key:event.emitter.id+index,style:{marginBottom:'10px'}},[(0,_h2.default)('div',{style:{display:'flex',marginBottom:'10px',cursor:'pointer',alignItems:'center',background:'#444',paddingTop:'3px',paddingBottom:'3px',color:state.selectedViewNode.id===event.emitter.id?'#53B2ED':'white',transition:'0.2s all',minWidth:'100%'},on:{click:[VIEW_NODE_SELECTED,event.emitter]}},[(0,_h2.default)('span',{style:{flex:'0 0 auto',margin:'0 0 0 5px',display:'inline-flex'}},[event.emitter.ref==='vNodeBox'?boxIcon():event.emitter.ref==='vNodeList'?listIcon():event.emitter.ref==='vNodeList'?ifIcon():event.emitter.ref==='vNodeInput'?inputIcon():textIcon()]),(0,_h2.default)('span',{style:{flex:'5 5 auto',margin:'0 5px 0 0',minWidth:'0',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}},emitter.title),(0,_h2.default)('span',{style:{flex:'0 0 auto',fontFamily:"'Comfortaa', sans-serif",fontSize:'0.9em',marginLeft:'auto',marginRight:'5px',color:'#5bcc5b'}},event.type)]),Object.keys(eventData.mutations).filter(function(stateId){return state.definition.state[stateId]!==undefined;}).length===0?(0,_h2.default)('div',{style:{padding:'5px 10px',fontFamily:"'Comfortaa', sans-serif",color:'#bdbdbd'}},'nothing has changed'):(0,_h2.default)('div',{style:{paddingLeft:'10px',whiteSpace:'nowrap'}},Object.keys(eventData.mutations).filter(function(stateId){return state.definition.state[stateId]!==undefined;}).map(function(stateId){return(0,_h2.default)('div',[(0,_h2.default)('span',{on:{click:[STATE_NODE_SELECTED,stateId]},style:{cursor:'pointer',fontSize:'14px',color:'white',boxShadow:'inset 0 0 0 2px '+(state.selectedStateNodeId===stateId?'#eab65c':'#828282'),background:'#444',padding:'2px 5px',marginRight:'5px',display:'inline-block',transition:'all 0.2s'}},state.definition.state[stateId].title),(0,_h2.default)('span',{style:{color:'#8e8e8e'}},eventData.previousState[stateId].toString()+' –› '),(0,_h2.default)('span',eventData.mutations[stateId].toString())]);}))]);}))]);var tutorialComponent=function tutorialComponent(){var steps=[(0,_h2.default)('span',[(0,_h2.default)('p','Ugnis is a visual tool for creating front-end applications. The clicker demo above was written with this tool.'),(0,_h2.default)('p','This is only a preview version and we do not recommend using it in production yet.'),(0,_h2.default)('p','For now, you can make sure that the clicker works. Click "exit fullscreen" or "next" to see how it it is made.'),(0,_h2.default)('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},[(0,_h2.default)('a',{attrs:{href:'https://www.ugnis.com'},style:{background:'#f4f4f4',cursor:'pointer',color:'#444',textDecoration:'none',padding:'12px 17px',border:'3px solid #ddd'}},'learn more...'),(0,_h2.default)('span',{style:{marginLeft:'auto',marginRight:'10px'}},'1/4'),(0,_h2.default)('div',{style:{userSelect:'none',cursor:'pointer',color:'white',backgroundColor:'#AD5251',padding:'15px 20px'},on:{click:NEXT_TUTORIAL_STEP}},'next')])]),(0,_h2.default)('span',[(0,_h2.default)('p','In the right bottom is the component tree. Components are the visible part of your application.'),(0,_h2.default)('p','You can change how components look and react to events by selecting a component.'),(0,_h2.default)('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},[(0,_h2.default)('a',{attrs:{href:'https://www.ugnis.com'},style:{background:'#f4f4f4',cursor:'pointer',color:'#444',textDecoration:'none',padding:'12px 17px',border:'3px solid #ddd'}},'learn more...'),(0,_h2.default)('span',{style:{marginLeft:'auto',marginRight:'10px'}},'2/4'),(0,_h2.default)('div',{style:{userSelect:'none',cursor:'pointer',color:'white',backgroundColor:'#AD5251',padding:'15px 20px'},on:{click:NEXT_TUTORIAL_STEP}},'next')])]),(0,_h2.default)('span',[(0,_h2.default)('p','State is the dynamic part of your application that is invisible to the users.'),(0,_h2.default)('p','Everything that can change or is shared across the components should be in state.'),(0,_h2.default)('p','Components can use and change the state, you just need to drag and drop it into a place where you want to use it.'),(0,_h2.default)('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},[(0,_h2.default)('a',{attrs:{href:'https://www.ugnis.com'},style:{background:'#f4f4f4',cursor:'pointer',color:'#444',textDecoration:'none',padding:'12px 17px',border:'3px solid #ddd'}},'learn more...'),(0,_h2.default)('span',{style:{marginLeft:'auto',marginRight:'10px'}},'3/4'),(0,_h2.default)('div',{style:{userSelect:'none',cursor:'pointer',color:'white',backgroundColor:'#AD5251',padding:'15px 20px'},on:{click:NEXT_TUTORIAL_STEP}},'next')])]),(0,_h2.default)('span',[(0,_h2.default)('p','Finally there\'s the sidebar which allows you to pause your application in order to inspect your components, and to view the actions that have been executed so far.'),(0,_h2.default)('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}},[(0,_h2.default)('a',{attrs:{href:'https://www.ugnis.com'},style:{background:'#f4f4f4',cursor:'pointer',color:'#444',textDecoration:'none',padding:'12px 17px',border:'3px solid #ddd'}},'learn more...'),(0,_h2.default)('span',{style:{marginLeft:'auto',marginRight:'10px'}},'4/4'),(0,_h2.default)('div',{style:{userSelect:'none',cursor:'pointer',color:'white',backgroundColor:'#AD5251',padding:'15px 20px'},on:{click:NEXT_TUTORIAL_STEP}},'close')])])];var stepPositions=[{top:'120px',right:'40px'},{top:window.innerHeight-500+'px',right:'400px'},{top:'120px',right:'400px'},{top:window.innerHeight/2-100+'px',right:window.innerWidth-950+'px'}];return(0,_h2.default)('div',{style:_extends({position:'fixed',zIndex:'9999999',transition:'all 500ms',font:"300 1.2em 'Comfortaa', sans-serif"},stepPositions[state.tutorialStep],{backgroundColor:'white',color:'black',border:'5px solid #53B2ED',maxWidth:'500px',padding:'20px'})},[steps[state.tutorialStep]]);};var renderViewComponent=(0,_h2.default)('div',{style:{flex:'1 auto',//backgroundImage: 'radial-gradient(black 15%, transparent 16%), radial-gradient(black 15%, transparent 16%), radial-gradient(rgba(255, 255, 255, 0.0980392) 15%, transparent 20%), radial-gradient(rgba(255, 255, 255, 0.0980392) 15%, transparent 20%)',
backgroundPositionX:'0px, 8px, 0px, 8px',backgroundPositionY:'0px, 8px, 1px, 9px',backgroundColor:'#333',backgroundSize:'16px 16px',display:'relative',overflow:'auto'}},[(0,_h2.default)('div',{style:function(){var topMenuHeight=75;var widthLeft=window.innerWidth-((state.leftOpen?state.editorLeftWidth:0)+(state.rightOpen?state.editorRightWidth:0));var heightLeft=window.innerHeight-topMenuHeight;return{width:state.fullScreen?'100vw':widthLeft-40+'px',height:state.fullScreen?'100vh':heightLeft-40+'px',background:'#ffffff',transform:'translateZ(0)',zIndex:state.fullScreen?'2000':'100',boxShadow:'rgba(0, 0, 0, 0.247059) 0px 14px 45px, rgba(0, 0, 0, 0.219608) 0px 10px 18px',position:'fixed',transition:'all 0.5s',top:state.fullScreen?'0px':20+75+'px',left:state.fullScreen?'0px':(state.leftOpen?state.editorLeftWidth:0)+20+'px'};}()},[state.fullScreen?(0,_h2.default)('span',{style:{position:'fixed',padding:'12px 10px',top:'0',right:'40px',border:'2px solid #333',borderTop:'none',background:'#444',color:'white',opacity:'0.8',cursor:'pointer'},on:{click:[FULL_SCREEN_CLICKED,false]}},'exit full screen'):(0,_h2.default)('span'),(0,_h2.default)('div',{style:{overflow:'auto',width:'100%',height:'100%'}},[app.vdom])])]);var mainRowComponent=(0,_h2.default)('div',{style:{display:'flex',flex:'1',position:'relative'}},[renderViewComponent,leftComponent,rightComponent,state.selectedViewNode.ref?generateEditNodeComponent():(0,_h2.default)('span')]);var vnode=(0,_h2.default)('div',{style:{display:'flex',flexDirection:'column',position:'fixed',top:'0',right:'0',width:'100vw',height:'100vh'}},[topComponent,mainRowComponent,state.draggedComponentView?(0,_h2.default)('div',{style:{fontFamily:"Open Sans",pointerEvents:'none',position:'fixed',top:state.mousePosition.y+'px',left:state.mousePosition.x+'px',lineHeight:'1.2em',fontSize:'1.2em',zIndex:'99999',width:state.editorRightWidth+'px'}},[(0,_h2.default)('div',{style:{overflow:'auto',position:'relative',flex:'1',fontSize:'0.8em'}},[fakeComponent(state.draggedComponentView,state.hoveredViewNode?state.hoveredViewNode.depth:state.draggedComponentView.depth)])]):(0,_h2.default)('span'),state.draggedComponentStateId?(0,_h2.default)('div',{style:{fontFamily:"Open Sans",pointerEvents:'none',position:'fixed',top:state.mousePosition.y+'px',left:state.mousePosition.x+'px',lineHeight:'1.2em',fontSize:'16px',zIndex:'99999',width:state.editorRightWidth+'px'}},state.hoveredEvent||state.hoveredPipe?[(0,_h2.default)('span',{style:{color:'#5bcc5b',position:'absolute',top:'0',left:'-20px'}},[addCircleIcon()]),fakeState(state.draggedComponentStateId)]:[fakeState(state.draggedComponentStateId)]):(0,_h2.default)('span'),state.tutorialPassed?(0,_h2.default)('span'):tutorialComponent()]);node=patch(node,vnode);currentAnimationFrameRequest=null;}render();}

},{"../node_modules/big.js":1,"../ugnis_components/app.json":15,"./ugnis":14,"fastclick":2,"snabbdom":11,"snabbdom/h":3,"snabbdom/modules/attributes":6,"snabbdom/modules/class":7,"snabbdom/modules/eventlisteners":8,"snabbdom/modules/props":9,"snabbdom/modules/style":10}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _snabbdom = require('snabbdom');

var _snabbdom2 = _interopRequireDefault(_snabbdom);

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _big = require('big.js');

var _big2 = _interopRequireDefault(_big);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateProps(oldVnode, vnode) {
    var key,
        cur,
        old,
        elm = vnode.elm,
        props = vnode.data.liveProps || {};
    for (key in props) {
        cur = props[key];
        old = elm[key];
        if (old !== cur) elm[key] = cur;
    }
}
var livePropsPlugin = { create: updateProps, update: updateProps };

var patch = _snabbdom2.default.init([require('snabbdom/modules/class'), require('snabbdom/modules/props'), require('snabbdom/modules/style'), require('snabbdom/modules/eventlisteners'), require('snabbdom/modules/attributes'), livePropsPlugin]);


function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}

exports.default = function (definition) {

    var currentState = createDefaultState();

    // Allows stoping application in development. This is not an application state
    var frozen = false;
    var frozenCallback = null;
    var selectHoverActive = false;
    var selectedNodeInDevelopment = {};

    function selectNodeHover(ref, e) {
        e.stopPropagation();
        selectedNodeInDevelopment = ref;
        frozenCallback(ref);
        render();
    }
    function selectNodeClick(ref, e) {
        e.stopPropagation();
        selectHoverActive = false;
        selectedNodeInDevelopment = ref;
        frozenCallback(ref);
        render();
    }

    // global state for resolver
    var currentEvent = null;
    var currentMapValue = {};
    var currentMapIndex = {};
    var eventData = {};
    function resolve(ref) {
        if (ref === undefined) {
            return;
        }
        // static value (string/number)
        if (ref.ref === undefined) {
            return ref;
        }
        var def = definition[ref.ref][ref.id];
        if (ref.ref === 'pipe') {
            return pipe(ref);
        }
        if (ref.ref === 'conditional') {
            return resolve(def.predicate) ? resolve(def.then) : resolve(def.else);
        }
        if (ref.ref === 'state') {
            return currentState[ref.id];
        }
        if (ref.ref === 'vNodeBox') {
            return boxNode(ref);
        }
        if (ref.ref === 'vNodeText') {
            return textNode(ref);
        }
        if (ref.ref === 'vNodeInput') {
            return inputNode(ref);
        }
        if (ref.ref === 'vNodeList') {
            return listNode(ref);
        }
        if (ref.ref === 'vNodeIf') {
            return ifNode(ref);
        }
        if (ref.ref === 'vNodeImage') {
            return imageNode(ref);
        }
        if (ref.ref === 'style') {
            return Object.keys(def).reduce(function (acc, val) {
                acc[val] = resolve(def[val]);
                return acc;
            }, {});
        }
        if (ref.ref === 'eventData') {
            return eventData[ref.id];
        }
        if (ref.ref === 'listValue') {
            return currentMapValue[def.list.id][def.property];
        }
        throw Error(ref);
    }

    function transformValue(value, transformations) {
        for (var i = 0; i < transformations.length; i++) {
            var ref = transformations[i];
            var transformer = definition[ref.ref][ref.id];
            if (ref.ref === 'equal') {
                var compareValue = resolve(transformer.value);
                if (value instanceof _big2.default || compareValue instanceof _big2.default) {
                    value = (0, _big2.default)(value).eq(compareValue);
                } else {
                    value = value === compareValue;
                }
            }
            if (ref.ref === 'add') {
                value = (0, _big2.default)(value).plus(resolve(transformer.value));
            }
            if (ref.ref === 'subtract') {
                value = (0, _big2.default)(value).minus(resolve(transformer.value));
            }
            if (ref.ref === 'multiply') {
                value = (0, _big2.default)(value).times(resolve(transformer.value));
            }
            if (ref.ref === 'divide') {
                var divider = resolve(transformer.value);
                if ((0, _big2.default)(divider).eq(0)) {
                    value = 0;
                } else {
                    value = (0, _big2.default)(value).div(divider);
                }
            }
            if (ref.ref === 'remainder') {
                var mod = resolve(transformer.value);
                if ((0, _big2.default)(mod).eq(0)) {
                    value = 0;
                } else {
                    value = (0, _big2.default)(value).mod(mod);
                }
            }
            if (ref.ref === 'join') {
                value = value.toString().concat(resolve(transformer.value));
            }
            if (ref.ref === 'toUpperCase') {
                value = value.toUpperCase();
            }
            if (ref.ref === 'toLowerCase') {
                value = value.toLowerCase();
            }
            if (ref.ref === 'length') {
                value = value.length;
            }
            if (ref.ref === 'and') {
                value = value && resolve(transformer.value);
            }
            if (ref.ref === 'or') {
                value = value || resolve(transformer.value);
            }
        }
        return value;
    }

    function pipe(ref) {
        var def = definition[ref.ref][ref.id];
        return transformValue(resolve(def.value), def.transformations);
    }

    var frozenShadow = 'inset 0 0 0 3px #3590df';

    function boxNode(ref) {
        var node = definition[ref.ref][ref.id];
        var style = resolve(node.style);
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, style, { transition: 'box-shadow 0.2s', boxShadow: style.boxShadow ? style.boxShadow + ' , ' + frozenShadow : frozenShadow }) : style,
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined
            }
        };
        return (0, _h2.default)('div', data, flatten(node.children.map(resolve)));
    }

    function ifNode(ref) {
        var node = definition[ref.ref][ref.id];
        return resolve(node.value) ? node.children.map(resolve) : [];
    }

    function textNode(ref) {
        var node = definition[ref.ref][ref.id];
        var style = resolve(node.style);
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, style, { transition: 'box-shadow 0.2s', boxShadow: style.boxShadow ? style.boxShadow + ' , ' + frozenShadow : frozenShadow }) : style,
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined
            }
        };
        return (0, _h2.default)('span', data, resolve(node.value));
    }

    function imageNode(ref) {
        var node = definition[ref.ref][ref.id];
        var style = resolve(node.style);
        var data = {
            attrs: {
                src: resolve(node.src)
            },
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, style, { transition: 'box-shadow 0.2s', boxShadow: style.boxShadow ? style.boxShadow + ' , ' + frozenShadow : frozenShadow }) : style,
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined
            }
        };
        return (0, _h2.default)('img', data);
    }

    function inputNode(ref) {
        var node = definition[ref.ref][ref.id];
        var style = resolve(node.style);
        var data = {
            style: frozen && selectedNodeInDevelopment.id === ref.id ? _extends({}, style, { transition: 'box-shadow 0.2s', boxShadow: style.boxShadow ? style.boxShadow + ' , ' + frozenShadow : frozenShadow }) : style,
            on: frozen ? {
                mouseover: selectHoverActive ? [selectNodeHover, ref] : undefined,
                click: [selectNodeClick, ref]
            } : {
                click: node.click ? [emitEvent, node.click] : undefined,
                input: node.input ? [emitEvent, node.input] : undefined,
                dblclick: node.dblclick ? [emitEvent, node.dblclick] : undefined,
                mouseover: node.mouseover ? [emitEvent, node.mouseover] : undefined,
                mouseout: node.mouseout ? [emitEvent, node.mouseout] : undefined,
                focus: node.focus ? [emitEvent, node.focus] : undefined,
                blur: node.blur ? [emitEvent, node.blur] : undefined
            },
            props: {
                value: resolve(node.value),
                placeholder: node.placeholder
            }
        };
        return (0, _h2.default)('input', data);
    }

    function listNode(ref) {
        var node = definition[ref.ref][ref.id];
        var list = resolve(node.value);

        var children = Object.keys(list).map(function (key) {
            return list[key];
        }).map(function (value, index) {
            currentMapValue[ref.id] = value;
            currentMapIndex[ref.id] = index;

            return node.children.map(resolve);
        });
        delete currentMapValue[ref.id];
        delete currentMapIndex[ref.id];

        return children;
    }

    var listeners = [];

    function addListener(callback) {
        var length = listeners.push(callback);

        // for unsubscribing
        return function () {
            return listeners.splice(length - 1, 1);
        };
    }

    function emitEvent(eventRef, e) {
        var eventId = eventRef.id;
        var event = definition.event[eventId];
        currentEvent = e;
        event.data.forEach(function (ref) {
            if (ref.id === '_input') {
                eventData[ref.id] = e.target.value;
            }
        });
        var previousState = currentState;
        var mutations = {};
        definition.event[eventId].mutators.forEach(function (ref) {
            var mutator = definition.mutator[ref.id];
            var state = mutator.state;
            mutations[state.id] = resolve(mutator.mutation);
        });
        currentState = Object.assign({}, currentState, mutations);
        listeners.forEach(function (callback) {
            return callback(eventId, eventData, e, previousState, currentState, mutations);
        });
        currentEvent = {};
        eventData = {};
        if (Object.keys(mutations).length) {
            render();
        }
    }

    var vdom = resolve({ ref: 'vNodeBox', id: '_rootNode' });
    function render(newDefinition) {
        if (newDefinition) {
            if (definition.state !== newDefinition.state) {
                definition = newDefinition;
                var newState = Object.keys(definition.state).map(function (key) {
                    return definition.state[key];
                }).reduce(function (acc, def) {
                    acc[def.ref] = def.defaultValue;
                    return acc;
                }, {});
                currentState = _extends({}, newState, currentState);
            } else {
                definition = newDefinition;
            }
        }
        var newvdom = resolve({ ref: 'vNodeBox', id: '_rootNode' });
        patch(vdom, newvdom);
        vdom = newvdom;
    }

    function _freeze(isFrozen, callback, nodeId) {
        frozenCallback = callback;
        selectedNodeInDevelopment = nodeId;
        if (frozen === false && isFrozen === true) {
            selectHoverActive = true;
        }
        if (frozen || frozen !== isFrozen) {
            frozen = isFrozen;
            render();
        }
    }

    function getCurrentState() {
        return currentState;
    }

    function setCurrentState(newState) {
        currentState = newState;
        render();
    }

    function createDefaultState() {
        return Object.keys(definition.state).map(function (key) {
            return definition.state[key];
        }).reduce(function (acc, def) {
            acc[def.ref] = def.defaultValue;
            return acc;
        }, {});
    }

    return {
        definition: definition,
        vdom: vdom,
        getCurrentState: getCurrentState,
        setCurrentState: setCurrentState,
        render: render,
        emitEvent: emitEvent,
        addListener: addListener,
        _freeze: _freeze,
        _resolve: resolve,
        createDefaultState: createDefaultState
    };
};

},{"big.js":1,"snabbdom":11,"snabbdom/h":3,"snabbdom/modules/attributes":6,"snabbdom/modules/class":7,"snabbdom/modules/eventlisteners":8,"snabbdom/modules/props":9,"snabbdom/modules/style":10}],15:[function(require,module,exports){
module.exports={
  "eventData": {
    "_input": {
      "title": "input value",
      "type": "text"
    }
  },
  "toLowerCase": {},
  "toUpperCase": {},
  "equal": {
    "a7251af0-50a7-4823-85a0-66ce09d8a3cc": {
      "value": {
        "ref": "pipe",
        "id": "ee2423e6-5b48-41ae-8ccf-6a2c7b46d2f8"
      }
    }
  },
  "and": {},
  "or": {},
  "length": {},
  "pipe": {
    "fw8jd6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": "Number currently is: ",
      "transformations": [
        {
          "ref": "join",
          "id": "p9s3d6d2-00db-8ab5-c332-882575f25426"
        },
        {
          "ref": "join",
          "id": "8a6cd6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    },
    "um5ed6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "transformations": []
    },
    "ui8jd6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": "+",
      "transformations": []
    },
    "c8wed6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": "-",
      "transformations": []
    },
    "pdq6d6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "transformations": [
        {
          "ref": "add",
          "id": "w86fd6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    },
    "452qd6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "transformations": [
        {
          "ref": "subtract",
          "id": "u43wd6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    },
    "ew83d6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": 1,
      "transformations": []
    },
    "w3e9d6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": 1,
      "transformations": []
    },
    "3qkid6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": 0,
      "transformations": [
        {
          "ref": "add",
          "id": "wbr7d6d2-00db-8ab5-c332-882575f25426"
        },
        {
          "ref": "join",
          "id": "s258d6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    },
    "t7vqd6d2-00db-8ab5-c332-882575f25426": {
      "type": "number",
      "value": 0,
      "transformations": [
        {
          "ref": "add",
          "id": "vq8dd6d2-00db-8ab5-c332-882575f25426"
        },
        {
          "ref": "join",
          "id": "wf9ad6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    },
    "qww9d6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": "px",
      "transformations": []
    },
    "qdw7c6d2-00db-8ab5-c332-882575f25426": {
      "type": "text",
      "value": "px",
      "transformations": []
    },
    "84369aba-4a4d-4932-8a9a-8f9ca948b6a2": {
      "type": "text",
      "value": "The number is even 🎉",
      "transformations": []
    },
    "c2fb9a9b-25bb-4e8b-80c0-cf51b8506070": {
      "type": "boolean",
      "value": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "transformations": [
        {
          "ref": "remainder",
          "id": "34780d22-f521-4c30-89a5-3e7f5b5af7c2"
        },
        {
          "ref": "equal",
          "id": "a7251af0-50a7-4823-85a0-66ce09d8a3cc"
        }
      ]
    },
    "1229d478-bc25-4401-8a89-74fc6cfe8996": {
      "type": "number",
      "value": 2,
      "transformations": []
    },
    "ee2423e6-5b48-41ae-8ccf-6a2c7b46d2f8": {
      "type": "number",
      "value": 0,
      "transformations": []
    },
    "945f0818-7743-4edd-8c76-3dd5a8ba7fa9": {
      "type": "text",
      "value": "'Comfortaa', cursive",
      "transformations": []
    },
    "a60899ee-9925-4e05-890e-b9428b02dbf9": {
      "type": "text",
      "value": "#f5f5f5",
      "transformations": []
    },
    "1e465403-5382-4a45-89da-8d88e2eb2fb9": {
      "type": "text",
      "value": "100%",
      "transformations": []
    },
    "ef2ec184-199f-4ee8-8e30-b99dbc1df5db": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "fab286c4-ded3-4a5e-8749-7678abcbb125": {
      "type": "text",
      "value": "10px 5px",
      "transformations": []
    },
    "703f8e02-c5c3-4d27-8ca2-722c4d0d1ea0": {
      "type": "text",
      "value": "10px 15px",
      "transformations": []
    },
    "8f3c6630-d8d9-4bc1-8a3d-ba4dad3091f0": {
      "type": "text",
      "value": "#aaaaaa",
      "transformations": []
    },
    "d31c4746-2329-4404-8689-fbf2393efd44": {
      "type": "text",
      "value": "inline-block",
      "transformations": []
    },
    "41685adc-3793-4566-8f61-2c2a42fdf86e": {
      "type": "text",
      "value": "5px",
      "transformations": []
    },
    "d5754fdb-4689-4f87-87fc-51d60022b32c": {
      "type": "text",
      "value": "3px",
      "transformations": []
    },
    "0bc6a18c-1766-42bd-8b4a-202a2b0c34fe": {
      "type": "text",
      "value": "pointer",
      "transformations": []
    },
    "9b250ef8-c1be-4706-8a71-f444f18f0f82": {
      "type": "text",
      "value": "none",
      "transformations": []
    },
    "asd90ef8-c1be-4706-8a71-f444f18f0f82": {
      "type": "text",
      "value": "none",
      "transformations": []
    },
    "b0a10497-ec26-4ff7-8739-a193755cbcae": {
      "type": "text",
      "value": "10px 5px",
      "transformations": []
    },
    "8764e258-599d-4252-8112-d06fcd0d5e2a": {
      "type": "text",
      "value": "10px 15px",
      "transformations": []
    },
    "8caaf876-10bc-47de-89d9-869c892cd4ce": {
      "type": "text",
      "value": "#999999",
      "transformations": []
    },
    "ae987bba-734a-46ae-8c82-c04896221179": {
      "type": "text",
      "value": "inline-block",
      "transformations": []
    },
    "f0090f8d-87b4-4d83-8a53-039b21e2b594": {
      "type": "text",
      "value": "5px",
      "transformations": []
    },
    "b7c791a6-2c91-4b62-8820-dbaaf9d5c179": {
      "type": "text",
      "value": "3px",
      "transformations": []
    },
    "d795a510-ccf9-4d92-81ee-5e512b81ee58": {
      "type": "text",
      "value": "pointer",
      "transformations": []
    },
    "7518524a-0bc2-465c-814e-0a5d39de25e3": {
      "type": "text",
      "value": "10px 5px",
      "transformations": []
    },
    "b24b1c18-8a82-4c8f-8180-6d062c78c9d9": {
      "type": "text",
      "value": "none",
      "transformations": []
    },
    "67f70d97-a346-42e4-833f-6eaeaeed4fef": {
      "type": "text",
      "value": "10px 10px 10px 0",
      "transformations": []
    },
    "98257461-928e-4ff9-8ac5-0b89298e4ef1": {
      "type": "text",
      "value": "10px 10px 10px 0",
      "transformations": []
    },
    "9931fe6a-074e-4cb7-8355-c18d818679a7": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "72b559e9-2546-4bae-8a61-555567363b11": {
      "type": "text",
      "value": "right",
      "transformations": []
    },
    "30f8c701-7adf-4398-862e-55372e29c14d": {
      "type": "text",
      "value": "50px",
      "transformations": []
    },
    "6635dbb2-b364-4efd-8061-26432007eb1a": {
      "type": "text",
      "value": "right",
      "transformations": []
    },
    "042ccf7d-819b-4fac-8282-2f19069b5386": {
      "type": "text",
      "value": "500px",
      "transformations": []
    },
    "e7bc6e20-1510-4bac-859f-04ec3dcda66b": {
      "type": "text",
      "value": "1.5",
      "transformations": []
    },
    "ef8dc9c6-f333-4b61-8d25-d36afe517520": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "755a70a2-d181-4faf-8593-5ab7601158f9": {
      "type": "text",
      "value": "block",
      "transformations": []
    },
    "9f501c35-54b3-4c60-8fc4-d6a45e776eb3": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "e8acc6b0-d1de-443b-8128-df6b5186f70c": {
      "type": "text",
      "value": "block",
      "transformations": []
    },
    "71764362-e09a-4412-8fbc-ed3cb4d4c954": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "c199b191-88d2-463d-8564-1ce1a1631b2d": {
      "type": "text",
      "value": "block",
      "transformations": []
    },
    "b2117e6b-ace7-4e75-8e7d-323668d1b19d": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "8a53848d-8c7d-44dc-8d13-ae060107c80b": {
      "type": "text",
      "value": "block",
      "transformations": []
    },
    "1906b5b4-6024-48f1-84da-c332e555afb3": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "a565696d-8a60-416e-844a-60c8f2fe8c5a": {
      "type": "text",
      "value": "block",
      "transformations": []
    },
    "15d47b07-396c-4c03-8591-f472598f15e2": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "a8f5c1ce-783b-4626-826a-473ab434c0b2": {
      "type": "text",
      "value": "10px",
      "transformations": []
    },
    "9qc84274-5efc-4be1-830b-0ff8c92b5029": {
      "type": "text",
      "value": "",
      "transformations": []
    }
  },
  "join": {
    "p9s3d6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "um5ed6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "wf9ad6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "qww9d6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "s258d6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "qdw7c6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "8a6cd6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "9qc84274-5efc-4be1-830b-0ff8c92b5029"
      }
    }
  },
  "add": {
    "w86fd6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "ew83d6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "wbr7d6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "8d4vd6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "vq8dd6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "7dbvd6d2-00db-8ab5-c332-882575f25426"
      }
    }
  },
  "subtract": {
    "u43wd6d2-00db-8ab5-c332-882575f25426": {
      "value": {
        "ref": "pipe",
        "id": "w3e9d6d2-00db-8ab5-c332-882575f25426"
      }
    }
  },
  "multiply": {},
  "divide": {},
  "remainder": {
    "34780d22-f521-4c30-89a5-3e7f5b5af7c2": {
      "value": {
        "ref": "pipe",
        "id": "1229d478-bc25-4401-8a89-74fc6cfe8996"
      }
    }
  },
  "vNodeBox": {
    "_rootNode": {
      "title": "app",
      "style": {
        "ref": "style",
        "id": "_rootStyle"
      },
      "parent": {},
      "children": [
        {
          "ref": "vNodeText",
          "id": "2471d6d2-00db-8ab5-c332-882575f25425"
        },
        {
          "ref": "vNodeText",
          "id": "1481d6d2-00db-8ab5-c332-882575f25425"
        },
        {
          "ref": "vNodeText",
          "id": "3481d6d2-00db-8ab5-c332-882575f25425"
        },
        {
          "ref": "vNodeIf",
          "id": "5787c15a-426b-41eb-831d-e3e074159582"
        }
      ]
    }
  },
  "vNodeText": {
    "2471d6d2-00db-8ab5-c332-882575f25425": {
      "title": "Number currently",
      "style": {
        "ref": "style",
        "id": "8481d6d2-00db-8ab5-c332-882575f25426"
      },
      "parent": {
        "ref": "vNodeBox",
        "id": "_rootNode"
      },
      "value": {
        "ref": "pipe",
        "id": "fw8jd6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "1481d6d2-00db-8ab5-c332-882575f25425": {
      "title": "+ button",
      "value": {
        "ref": "pipe",
        "id": "ui8jd6d2-00db-8ab5-c332-882575f25426"
      },
      "style": {
        "ref": "style",
        "id": "9481d6d2-00db-8ab5-c332-882575f25426"
      },
      "parent": {
        "ref": "vNodeBox",
        "id": "_rootNode"
      },
      "click": {
        "ref": "event",
        "id": "d48rd6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "3481d6d2-00db-8ab5-c332-882575f25425": {
      "title": "- button",
      "value": {
        "ref": "pipe",
        "id": "c8wed6d2-00db-8ab5-c332-882575f25426"
      },
      "style": {
        "ref": "style",
        "id": "7481d6d2-00db-8ab5-c332-882575f25426"
      },
      "parent": {
        "ref": "vNodeBox",
        "id": "_rootNode"
      },
      "click": {
        "ref": "event",
        "id": "3a54d6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "e8add1c7-8a01-4164-8604-722d8ab529f1": {
      "title": "is even",
      "style": {
        "ref": "style",
        "id": "4dca73b3-90eb-41e7-8651-2bdcc93f3871"
      },
      "parent": {
        "ref": "vNodeIf",
        "id": "5787c15a-426b-41eb-831d-e3e074159582"
      },
      "value": {
        "ref": "pipe",
        "id": "84369aba-4a4d-4932-8a9a-8f9ca948b6a2"
      }
    }
  },
  "vNodeInput": {},
  "vNodeList": {},
  "vNodeIf": {
    "5787c15a-426b-41eb-831d-e3e074159582": {
      "title": "is number even",
      "value": {
        "ref": "pipe",
        "id": "c2fb9a9b-25bb-4e8b-80c0-cf51b8506070"
      },
      "parent": {
        "ref": "vNodeBox",
        "id": "_rootNode"
      },
      "children": [
        {
          "ref": "vNodeText",
          "id": "e8add1c7-8a01-4164-8604-722d8ab529f1"
        }
      ]
    }
  },
  "vNodeImage": {},
  "style": {
    "_rootStyle": {
      "fontFamily": {
        "ref": "pipe",
        "id": "945f0818-7743-4edd-8c76-3dd5a8ba7fa9"
      },
      "background": {
        "ref": "pipe",
        "id": "a60899ee-9925-4e05-890e-b9428b02dbf9"
      },
      "minHeight": {
        "ref": "pipe",
        "id": "1e465403-5382-4a45-89da-8d88e2eb2fb9"
      }
    },
    "8481d6d2-00db-8ab5-c332-882575f25426": {
      "padding": {
        "ref": "pipe",
        "id": "ef2ec184-199f-4ee8-8e30-b99dbc1df5db"
      },
      "margin": {
        "ref": "pipe",
        "id": "fab286c4-ded3-4a5e-8749-7678abcbb125"
      }
    },
    "9481d6d2-00db-8ab5-c332-882575f25426": {
      "padding": {
        "ref": "pipe",
        "id": "703f8e02-c5c3-4d27-8ca2-722c4d0d1ea0"
      },
      "background": {
        "ref": "pipe",
        "id": "8f3c6630-d8d9-4bc1-8a3d-ba4dad3091f0"
      },
      "display": {
        "ref": "pipe",
        "id": "d31c4746-2329-4404-8689-fbf2393efd44"
      },
      "borderRadius": {
        "ref": "pipe",
        "id": "d5754fdb-4689-4f87-87fc-51d60022b32c"
      },
      "cursor": {
        "ref": "pipe",
        "id": "0bc6a18c-1766-42bd-8b4a-202a2b0c34fe"
      },
      "userSelect": {
        "ref": "pipe",
        "id": "9b250ef8-c1be-4706-8a71-f444f18f0f82"
      },
      "margin": {
        "ref": "pipe",
        "id": "b0a10497-ec26-4ff7-8739-a193755cbcae"
      }
    },
    "7481d6d2-00db-8ab5-c332-882575f25426": {
      "padding": {
        "ref": "pipe",
        "id": "8764e258-599d-4252-8112-d06fcd0d5e2a"
      },
      "background": {
        "ref": "pipe",
        "id": "8caaf876-10bc-47de-89d9-869c892cd4ce"
      },
      "display": {
        "ref": "pipe",
        "id": "ae987bba-734a-46ae-8c82-c04896221179"
      },
      "userSelect": {
        "ref": "pipe",
        "id": "asd90ef8-c1be-4706-8a71-f444f18f0f82"
      },
      "borderRadius": {
        "ref": "pipe",
        "id": "b7c791a6-2c91-4b62-8820-dbaaf9d5c179"
      },
      "cursor": {
        "ref": "pipe",
        "id": "d795a510-ccf9-4d92-81ee-5e512b81ee58"
      },
      "margin": {
        "ref": "pipe",
        "id": "7518524a-0bc2-465c-814e-0a5d39de25e3"
      }
    },
    "8092ac5e-dfd0-4492-a65d-8ac3eec325e0": {
      "padding": {
        "ref": "pipe",
        "id": "67f70d97-a346-42e4-833f-6eaeaeed4fef"
      }
    },
    "a9461e28-7d92-49a0-9001-23d74e4b382d": {
      "padding": {
        "ref": "pipe",
        "id": "98257461-928e-4ff9-8ac5-0b89298e4ef1"
      }
    },
    "766b11ec-da27-494c-b272-c26fec3f6475": {
      "padding": {
        "ref": "pipe",
        "id": "9931fe6a-074e-4cb7-8355-c18d818679a7"
      },
      "float": {
        "ref": "pipe",
        "id": "72b559e9-2546-4bae-8a61-555567363b11"
      },
      "textAlign": {
        "ref": "pipe",
        "id": "6635dbb2-b364-4efd-8061-26432007eb1a"
      },
      "maxWidth": {
        "ref": "pipe",
        "id": "042ccf7d-819b-4fac-8282-2f19069b5386"
      }
    },
    "cbcd8edb-4aa2-43fe-ad39-cee79b490295": {
      "padding": {
        "ref": "pipe",
        "id": "ef8dc9c6-f333-4b61-8d25-d36afe517520"
      },
      "display": {
        "ref": "pipe",
        "id": "755a70a2-d181-4faf-8593-5ab7601158f9"
      }
    },
    "6763f102-23f7-4390-b463-4e1b14e866c9": {
      "padding": {
        "ref": "pipe",
        "id": "9f501c35-54b3-4c60-8fc4-d6a45e776eb3"
      },
      "display": {
        "ref": "pipe",
        "id": "e8acc6b0-d1de-443b-8128-df6b5186f70c"
      }
    },
    "91c9adf0-d62e-4580-93e7-f39594ae5e7d": {
      "padding": {
        "ref": "pipe",
        "id": "71764362-e09a-4412-8fbc-ed3cb4d4c954"
      },
      "display": {
        "ref": "pipe",
        "id": "c199b191-88d2-463d-8564-1ce1a1631b2d"
      }
    },
    "e9fbeb39-7193-4522-91b3-761bd35639d3": {
      "padding": {
        "ref": "pipe",
        "id": "b2117e6b-ace7-4e75-8e7d-323668d1b19d"
      },
      "display": {
        "ref": "pipe",
        "id": "8a53848d-8c7d-44dc-8d13-ae060107c80b"
      }
    },
    "3cf5d89d-3703-483e-ab64-5a5b780aec27": {
      "padding": {
        "ref": "pipe",
        "id": "1906b5b4-6024-48f1-84da-c332e555afb3"
      },
      "display": {
        "ref": "pipe",
        "id": "a565696d-8a60-416e-844a-60c8f2fe8c5a"
      }
    },
    "4dca73b3-90eb-41e7-8651-2bdcc93f3871": {
      "padding": {
        "ref": "pipe",
        "id": "a8f5c1ce-783b-4626-826a-473ab434c0b2"
      }
    }
  },
  "nameSpace": {
    "_rootNameSpace": {
      "title": "state",
      "children": [
        {
          "ref": "state",
          "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    }
  },
  "state": {
    "46vdd6d2-00db-8ab5-c332-882575f25426": {
      "title": "number",
      "ref": "46vdd6d2-00db-8ab5-c332-882575f25426",
      "type": "number",
      "defaultValue": 0,
      "mutators": [
        {
          "ref": "mutator",
          "id": "as55d6d2-00db-8ab5-c332-882575f25426"
        },
        {
          "ref": "mutator",
          "id": "9dq8d6d2-00db-8ab5-c332-882575f25426"
        }
      ]
    }
  },
  "mutator": {
    "as55d6d2-00db-8ab5-c332-882575f25426": {
      "event": {
        "ref": "event",
        "id": "d48rd6d2-00db-8ab5-c332-882575f25426"
      },
      "state": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "mutation": {
        "ref": "pipe",
        "id": "pdq6d6d2-00db-8ab5-c332-882575f25426"
      }
    },
    "9dq8d6d2-00db-8ab5-c332-882575f25426": {
      "event": {
        "ref": "event",
        "id": "3a54d6d2-00db-8ab5-c332-882575f25426"
      },
      "state": {
        "ref": "state",
        "id": "46vdd6d2-00db-8ab5-c332-882575f25426"
      },
      "mutation": {
        "ref": "pipe",
        "id": "452qd6d2-00db-8ab5-c332-882575f25426"
      }
    }
  },
  "event": {
    "d48rd6d2-00db-8ab5-c332-882575f25426": {
      "type": "click",
      "mutators": [
        {
          "ref": "mutator",
          "id": "as55d6d2-00db-8ab5-c332-882575f25426"
        }
      ],
      "emitter": {
        "ref": "vNodeText",
        "id": "1481d6d2-00db-8ab5-c332-882575f25425"
      },
      "data": []
    },
    "3a54d6d2-00db-8ab5-c332-882575f25426": {
      "type": "click",
      "mutators": [
        {
          "ref": "mutator",
          "id": "9dq8d6d2-00db-8ab5-c332-882575f25426"
        }
      ],
      "emitter": {
        "ref": "vNodeText",
        "id": "3481d6d2-00db-8ab5-c332-882575f25425"
      },
      "data": []
    }
  }
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYmlnLmpzL2JpZy5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0Y2xpY2svbGliL2Zhc3RjbGljay5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9ldmVudGxpc3RlbmVycy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3Byb3BzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvc3R5bGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vc25hYmJkb20uanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJzcmNcXGluZGV4LmpzIiwic3JjXFx1Z25pcy5qcyIsInVnbmlzX2NvbXBvbmVudHMvYXBwLmpzb24iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdG5DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogYmlnLmpzIHYzLjEuMyBodHRwczovL2dpdGh1Yi5jb20vTWlrZU1jbC9iaWcuanMvTElDRU5DRSAqL1xyXG47KGZ1bmN0aW9uIChnbG9iYWwpIHtcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbi8qXHJcbiAgYmlnLmpzIHYzLjEuM1xyXG4gIEEgc21hbGwsIGZhc3QsIGVhc3ktdG8tdXNlIGxpYnJhcnkgZm9yIGFyYml0cmFyeS1wcmVjaXNpb24gZGVjaW1hbCBhcml0aG1ldGljLlxyXG4gIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWtlTWNsL2JpZy5qcy9cclxuICBDb3B5cmlnaHQgKGMpIDIwMTQgTWljaGFlbCBNY2xhdWdobGluIDxNOGNoODhsQGdtYWlsLmNvbT5cclxuICBNSVQgRXhwYXQgTGljZW5jZVxyXG4qL1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqIEVESVRBQkxFIERFRkFVTFRTICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuXHJcbiAgICAvLyBUaGUgZGVmYXVsdCB2YWx1ZXMgYmVsb3cgbXVzdCBiZSBpbnRlZ2VycyB3aXRoaW4gdGhlIHN0YXRlZCByYW5nZXMuXHJcblxyXG4gICAgLypcclxuICAgICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyBvZiB0aGUgcmVzdWx0cyBvZiBvcGVyYXRpb25zXHJcbiAgICAgKiBpbnZvbHZpbmcgZGl2aXNpb246IGRpdiBhbmQgc3FydCwgYW5kIHBvdyB3aXRoIG5lZ2F0aXZlIGV4cG9uZW50cy5cclxuICAgICAqL1xyXG4gICAgdmFyIERQID0gMjAsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMCB0byBNQVhfRFBcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgcm91bmRpbmcgbW9kZSB1c2VkIHdoZW4gcm91bmRpbmcgdG8gdGhlIGFib3ZlIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogMCBUb3dhcmRzIHplcm8gKGkuZS4gdHJ1bmNhdGUsIG5vIHJvdW5kaW5nKS4gICAgICAgKFJPVU5EX0RPV04pXHJcbiAgICAgICAgICogMSBUbyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHJvdW5kIHVwLiAgKFJPVU5EX0hBTEZfVVApXHJcbiAgICAgICAgICogMiBUbyBuZWFyZXN0IG5laWdoYm91ci4gSWYgZXF1aWRpc3RhbnQsIHRvIGV2ZW4uICAgKFJPVU5EX0hBTEZfRVZFTilcclxuICAgICAgICAgKiAzIEF3YXkgZnJvbSB6ZXJvLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoUk9VTkRfVVApXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgUk0gPSAxLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAwLCAxLCAyIG9yIDNcclxuXHJcbiAgICAgICAgLy8gVGhlIG1heGltdW0gdmFsdWUgb2YgRFAgYW5kIEJpZy5EUC5cclxuICAgICAgICBNQVhfRFAgPSAxRTYsICAgICAgICAgICAgICAgICAgICAgIC8vIDAgdG8gMTAwMDAwMFxyXG5cclxuICAgICAgICAvLyBUaGUgbWF4aW11bSBtYWduaXR1ZGUgb2YgdGhlIGV4cG9uZW50IGFyZ3VtZW50IHRvIHRoZSBwb3cgbWV0aG9kLlxyXG4gICAgICAgIE1BWF9QT1dFUiA9IDFFNiwgICAgICAgICAgICAgICAgICAgLy8gMSB0byAxMDAwMDAwXHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogVGhlIGV4cG9uZW50IHZhbHVlIGF0IGFuZCBiZW5lYXRoIHdoaWNoIHRvU3RyaW5nIHJldHVybnMgZXhwb25lbnRpYWxcclxuICAgICAgICAgKiBub3RhdGlvbi5cclxuICAgICAgICAgKiBKYXZhU2NyaXB0J3MgTnVtYmVyIHR5cGU6IC03XHJcbiAgICAgICAgICogLTEwMDAwMDAgaXMgdGhlIG1pbmltdW0gcmVjb21tZW5kZWQgZXhwb25lbnQgdmFsdWUgb2YgYSBCaWcuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgRV9ORUcgPSAtNywgICAgICAgICAgICAgICAgICAgLy8gMCB0byAtMTAwMDAwMFxyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIFRoZSBleHBvbmVudCB2YWx1ZSBhdCBhbmQgYWJvdmUgd2hpY2ggdG9TdHJpbmcgcmV0dXJucyBleHBvbmVudGlhbFxyXG4gICAgICAgICAqIG5vdGF0aW9uLlxyXG4gICAgICAgICAqIEphdmFTY3JpcHQncyBOdW1iZXIgdHlwZTogMjFcclxuICAgICAgICAgKiAxMDAwMDAwIGlzIHRoZSBtYXhpbXVtIHJlY29tbWVuZGVkIGV4cG9uZW50IHZhbHVlIG9mIGEgQmlnLlxyXG4gICAgICAgICAqIChUaGlzIGxpbWl0IGlzIG5vdCBlbmZvcmNlZCBvciBjaGVja2VkLilcclxuICAgICAgICAgKi9cclxuICAgICAgICBFX1BPUyA9IDIxLCAgICAgICAgICAgICAgICAgICAvLyAwIHRvIDEwMDAwMDBcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXHJcblxyXG4gICAgICAgIC8vIFRoZSBzaGFyZWQgcHJvdG90eXBlIG9iamVjdC5cclxuICAgICAgICBQID0ge30sXHJcbiAgICAgICAgaXNWYWxpZCA9IC9eLT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/JC9pLFxyXG4gICAgICAgIEJpZztcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIENyZWF0ZSBhbmQgcmV0dXJuIGEgQmlnIGNvbnN0cnVjdG9yLlxyXG4gICAgICpcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYmlnRmFjdG9yeSgpIHtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiBUaGUgQmlnIGNvbnN0cnVjdG9yIGFuZCBleHBvcnRlZCBmdW5jdGlvbi5cclxuICAgICAgICAgKiBDcmVhdGUgYW5kIHJldHVybiBhIG5ldyBpbnN0YW5jZSBvZiBhIEJpZyBudW1iZXIgb2JqZWN0LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogbiB7bnVtYmVyfHN0cmluZ3xCaWd9IEEgbnVtZXJpYyB2YWx1ZS5cclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBCaWcobikge1xyXG4gICAgICAgICAgICB2YXIgeCA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICAvLyBFbmFibGUgY29uc3RydWN0b3IgdXNhZ2Ugd2l0aG91dCBuZXcuXHJcbiAgICAgICAgICAgIGlmICghKHggaW5zdGFuY2VvZiBCaWcpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbiA9PT0gdm9pZCAwID8gYmlnRmFjdG9yeSgpIDogbmV3IEJpZyhuKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gRHVwbGljYXRlLlxyXG4gICAgICAgICAgICBpZiAobiBpbnN0YW5jZW9mIEJpZykge1xyXG4gICAgICAgICAgICAgICAgeC5zID0gbi5zO1xyXG4gICAgICAgICAgICAgICAgeC5lID0gbi5lO1xyXG4gICAgICAgICAgICAgICAgeC5jID0gbi5jLnNsaWNlKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZSh4LCBuKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICogUmV0YWluIGEgcmVmZXJlbmNlIHRvIHRoaXMgQmlnIGNvbnN0cnVjdG9yLCBhbmQgc2hhZG93XHJcbiAgICAgICAgICAgICAqIEJpZy5wcm90b3R5cGUuY29uc3RydWN0b3Igd2hpY2ggcG9pbnRzIHRvIE9iamVjdC5cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHguY29uc3RydWN0b3IgPSBCaWc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBCaWcucHJvdG90eXBlID0gUDtcclxuICAgICAgICBCaWcuRFAgPSBEUDtcclxuICAgICAgICBCaWcuUk0gPSBSTTtcclxuICAgICAgICBCaWcuRV9ORUcgPSBFX05FRztcclxuICAgICAgICBCaWcuRV9QT1MgPSBFX1BPUztcclxuXHJcbiAgICAgICAgcmV0dXJuIEJpZztcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gUHJpdmF0ZSBmdW5jdGlvbnNcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIEJpZyB4IGluIG5vcm1hbCBvciBleHBvbmVudGlhbFxyXG4gICAgICogbm90YXRpb24gdG8gZHAgZml4ZWQgZGVjaW1hbCBwbGFjZXMgb3Igc2lnbmlmaWNhbnQgZGlnaXRzLlxyXG4gICAgICpcclxuICAgICAqIHgge0JpZ30gVGhlIEJpZyB0byBmb3JtYXQuXHJcbiAgICAgKiBkcCB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKiB0b0Uge251bWJlcn0gMSAodG9FeHBvbmVudGlhbCksIDIgKHRvUHJlY2lzaW9uKSBvciB1bmRlZmluZWQgKHRvRml4ZWQpLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmb3JtYXQoeCwgZHAsIHRvRSkge1xyXG4gICAgICAgIHZhciBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG5cclxuICAgICAgICAgICAgLy8gVGhlIGluZGV4IChub3JtYWwgbm90YXRpb24pIG9mIHRoZSBkaWdpdCB0aGF0IG1heSBiZSByb3VuZGVkIHVwLlxyXG4gICAgICAgICAgICBpID0gZHAgLSAoeCA9IG5ldyBCaWcoeCkpLmUsXHJcbiAgICAgICAgICAgIGMgPSB4LmM7XHJcblxyXG4gICAgICAgIC8vIFJvdW5kP1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA+ICsrZHApIHtcclxuICAgICAgICAgICAgcm5kKHgsIGksIEJpZy5STSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNbMF0pIHtcclxuICAgICAgICAgICAgKytpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodG9FKSB7XHJcbiAgICAgICAgICAgIGkgPSBkcDtcclxuXHJcbiAgICAgICAgLy8gdG9GaXhlZFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGMgPSB4LmM7XHJcblxyXG4gICAgICAgICAgICAvLyBSZWNhbGN1bGF0ZSBpIGFzIHguZSBtYXkgaGF2ZSBjaGFuZ2VkIGlmIHZhbHVlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgIGkgPSB4LmUgKyBpICsgMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFwcGVuZCB6ZXJvcz9cclxuICAgICAgICBmb3IgKDsgYy5sZW5ndGggPCBpOyBjLnB1c2goMCkpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgaSA9IHguZTtcclxuXHJcbiAgICAgICAgLypcclxuICAgICAgICAgKiB0b1ByZWNpc2lvbiByZXR1cm5zIGV4cG9uZW50aWFsIG5vdGF0aW9uIGlmIHRoZSBudW1iZXIgb2ZcclxuICAgICAgICAgKiBzaWduaWZpY2FudCBkaWdpdHMgc3BlY2lmaWVkIGlzIGxlc3MgdGhhbiB0aGUgbnVtYmVyIG9mIGRpZ2l0c1xyXG4gICAgICAgICAqIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXIgcGFydCBvZiB0aGUgdmFsdWUgaW4gbm9ybWFsXHJcbiAgICAgICAgICogbm90YXRpb24uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcmV0dXJuIHRvRSA9PT0gMSB8fCB0b0UgJiYgKGRwIDw9IGkgfHwgaSA8PSBCaWcuRV9ORUcpID9cclxuXHJcbiAgICAgICAgICAvLyBFeHBvbmVudGlhbCBub3RhdGlvbi5cclxuICAgICAgICAgICh4LnMgPCAwICYmIGNbMF0gPyAnLScgOiAnJykgK1xyXG4gICAgICAgICAgICAoYy5sZW5ndGggPiAxID8gY1swXSArICcuJyArIGMuam9pbignJykuc2xpY2UoMSkgOiBjWzBdKSArXHJcbiAgICAgICAgICAgICAgKGkgPCAwID8gJ2UnIDogJ2UrJykgKyBpXHJcblxyXG4gICAgICAgICAgLy8gTm9ybWFsIG5vdGF0aW9uLlxyXG4gICAgICAgICAgOiB4LnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBQYXJzZSB0aGUgbnVtYmVyIG9yIHN0cmluZyB2YWx1ZSBwYXNzZWQgdG8gYSBCaWcgY29uc3RydWN0b3IuXHJcbiAgICAgKlxyXG4gICAgICogeCB7QmlnfSBBIEJpZyBudW1iZXIgaW5zdGFuY2UuXHJcbiAgICAgKiBuIHtudW1iZXJ8c3RyaW5nfSBBIG51bWVyaWMgdmFsdWUuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlKHgsIG4pIHtcclxuICAgICAgICB2YXIgZSwgaSwgbkw7XHJcblxyXG4gICAgICAgIC8vIE1pbnVzIHplcm8/XHJcbiAgICAgICAgaWYgKG4gPT09IDAgJiYgMSAvIG4gPCAwKSB7XHJcbiAgICAgICAgICAgIG4gPSAnLTAnO1xyXG5cclxuICAgICAgICAvLyBFbnN1cmUgbiBpcyBzdHJpbmcgYW5kIGNoZWNrIHZhbGlkaXR5LlxyXG4gICAgICAgIH0gZWxzZSBpZiAoIWlzVmFsaWQudGVzdChuICs9ICcnKSkge1xyXG4gICAgICAgICAgICB0aHJvd0VycihOYU4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHNpZ24uXHJcbiAgICAgICAgeC5zID0gbi5jaGFyQXQoMCkgPT0gJy0nID8gKG4gPSBuLnNsaWNlKDEpLCAtMSkgOiAxO1xyXG5cclxuICAgICAgICAvLyBEZWNpbWFsIHBvaW50P1xyXG4gICAgICAgIGlmICgoZSA9IG4uaW5kZXhPZignLicpKSA+IC0xKSB7XHJcbiAgICAgICAgICAgIG4gPSBuLnJlcGxhY2UoJy4nLCAnJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvbmVudGlhbCBmb3JtP1xyXG4gICAgICAgIGlmICgoaSA9IG4uc2VhcmNoKC9lL2kpKSA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSBleHBvbmVudC5cclxuICAgICAgICAgICAgaWYgKGUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBlID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlICs9ICtuLnNsaWNlKGkgKyAxKTtcclxuICAgICAgICAgICAgbiA9IG4uc3Vic3RyaW5nKDAsIGkpO1xyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGUgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnRlZ2VyLlxyXG4gICAgICAgICAgICBlID0gbi5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXRlcm1pbmUgbGVhZGluZyB6ZXJvcy5cclxuICAgICAgICBmb3IgKGkgPSAwOyBuLmNoYXJBdChpKSA9PSAnMCc7IGkrKykge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkgPT0gKG5MID0gbi5sZW5ndGgpKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBaZXJvLlxyXG4gICAgICAgICAgICB4LmMgPSBbIHguZSA9IDAgXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIHRyYWlsaW5nIHplcm9zLlxyXG4gICAgICAgICAgICBmb3IgKDsgbi5jaGFyQXQoLS1uTCkgPT0gJzAnOykge1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB4LmUgPSBlIC0gaSAtIDE7XHJcbiAgICAgICAgICAgIHguYyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29udmVydCBzdHJpbmcgdG8gYXJyYXkgb2YgZGlnaXRzIHdpdGhvdXQgbGVhZGluZy90cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yIChlID0gMDsgaSA8PSBuTDsgeC5jW2UrK10gPSArbi5jaGFyQXQoaSsrKSkge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJvdW5kIEJpZyB4IHRvIGEgbWF4aW11bSBvZiBkcCBkZWNpbWFsIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIHJtLlxyXG4gICAgICogQ2FsbGVkIGJ5IGRpdiwgc3FydCBhbmQgcm91bmQuXHJcbiAgICAgKlxyXG4gICAgICogeCB7QmlnfSBUaGUgQmlnIHRvIHJvdW5kLlxyXG4gICAgICogZHAge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAgICogcm0ge251bWJlcn0gMCwgMSwgMiBvciAzIChET1dOLCBIQUxGX1VQLCBIQUxGX0VWRU4sIFVQKVxyXG4gICAgICogW21vcmVdIHtib29sZWFufSBXaGV0aGVyIHRoZSByZXN1bHQgb2YgZGl2aXNpb24gd2FzIHRydW5jYXRlZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcm5kKHgsIGRwLCBybSwgbW9yZSkge1xyXG4gICAgICAgIHZhciB1LFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgaSA9IHguZSArIGRwICsgMTtcclxuXHJcbiAgICAgICAgaWYgKHJtID09PSAxKSB7XHJcblxyXG4gICAgICAgICAgICAvLyB4Y1tpXSBpcyB0aGUgZGlnaXQgYWZ0ZXIgdGhlIGRpZ2l0IHRoYXQgbWF5IGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgIG1vcmUgPSB4Y1tpXSA+PSA1O1xyXG4gICAgICAgIH0gZWxzZSBpZiAocm0gPT09IDIpIHtcclxuICAgICAgICAgICAgbW9yZSA9IHhjW2ldID4gNSB8fCB4Y1tpXSA9PSA1ICYmXHJcbiAgICAgICAgICAgICAgKG1vcmUgfHwgaSA8IDAgfHwgeGNbaSArIDFdICE9PSB1IHx8IHhjW2kgLSAxXSAmIDEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocm0gPT09IDMpIHtcclxuICAgICAgICAgICAgbW9yZSA9IG1vcmUgfHwgeGNbaV0gIT09IHUgfHwgaSA8IDA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbW9yZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJtICE9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvd0VycignIUJpZy5STSEnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGkgPCAxIHx8ICF4Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKG1vcmUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyAxLCAwLjEsIDAuMDEsIDAuMDAxLCAwLjAwMDEgZXRjLlxyXG4gICAgICAgICAgICAgICAgeC5lID0gLWRwO1xyXG4gICAgICAgICAgICAgICAgeC5jID0gWzFdO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFplcm8uXHJcbiAgICAgICAgICAgICAgICB4LmMgPSBbeC5lID0gMF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGFueSBkaWdpdHMgYWZ0ZXIgdGhlIHJlcXVpcmVkIGRlY2ltYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICB4Yy5sZW5ndGggPSBpLS07XHJcblxyXG4gICAgICAgICAgICAvLyBSb3VuZCB1cD9cclxuICAgICAgICAgICAgaWYgKG1vcmUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBSb3VuZGluZyB1cCBtYXkgbWVhbiB0aGUgcHJldmlvdXMgZGlnaXQgaGFzIHRvIGJlIHJvdW5kZWQgdXAuXHJcbiAgICAgICAgICAgICAgICBmb3IgKDsgKyt4Y1tpXSA+IDk7KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeGNbaV0gPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArK3guZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGMudW5zaGlmdCgxKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0cmFpbGluZyB6ZXJvcy5cclxuICAgICAgICAgICAgZm9yIChpID0geGMubGVuZ3RoOyAheGNbLS1pXTsgeGMucG9wKCkpIHtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUaHJvdyBhIEJpZ0Vycm9yLlxyXG4gICAgICpcclxuICAgICAqIG1lc3NhZ2Uge3N0cmluZ30gVGhlIGVycm9yIG1lc3NhZ2UuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHRocm93RXJyKG1lc3NhZ2UpIHtcclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgICAgIGVyci5uYW1lID0gJ0JpZ0Vycm9yJztcclxuXHJcbiAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBQcm90b3R5cGUvaW5zdGFuY2UgbWV0aG9kc1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhpcyBCaWcuXHJcbiAgICAgKi9cclxuICAgIFAuYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB4ID0gbmV3IHRoaXMuY29uc3RydWN0b3IodGhpcyk7XHJcbiAgICAgICAgeC5zID0gMTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuXHJcbiAgICAgKiAxIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gdGhlIHZhbHVlIG9mIEJpZyB5LFxyXG4gICAgICogLTEgaWYgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGlzIGxlc3MgdGhhbiB0aGUgdmFsdWUgb2YgQmlnIHksIG9yXHJcbiAgICAgKiAwIGlmIHRoZXkgaGF2ZSB0aGUgc2FtZSB2YWx1ZS5cclxuICAgICovXHJcbiAgICBQLmNtcCA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIHhOZWcsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgeWMgPSAoeSA9IG5ldyB4LmNvbnN0cnVjdG9yKHkpKS5jLFxyXG4gICAgICAgICAgICBpID0geC5zLFxyXG4gICAgICAgICAgICBqID0geS5zLFxyXG4gICAgICAgICAgICBrID0geC5lLFxyXG4gICAgICAgICAgICBsID0geS5lO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gIXhjWzBdID8gIXljWzBdID8gMCA6IC1qIDogaTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNpZ25zIGRpZmZlcj9cclxuICAgICAgICBpZiAoaSAhPSBqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB4TmVnID0gaSA8IDA7XHJcblxyXG4gICAgICAgIC8vIENvbXBhcmUgZXhwb25lbnRzLlxyXG4gICAgICAgIGlmIChrICE9IGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGsgPiBsIF4geE5lZyA/IDEgOiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGkgPSAtMTtcclxuICAgICAgICBqID0gKGsgPSB4Yy5sZW5ndGgpIDwgKGwgPSB5Yy5sZW5ndGgpID8gayA6IGw7XHJcblxyXG4gICAgICAgIC8vIENvbXBhcmUgZGlnaXQgYnkgZGlnaXQuXHJcbiAgICAgICAgZm9yICg7ICsraSA8IGo7KSB7XHJcblxyXG4gICAgICAgICAgICBpZiAoeGNbaV0gIT0geWNbaV0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB4Y1tpXSA+IHljW2ldIF4geE5lZyA/IDEgOiAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ29tcGFyZSBsZW5ndGhzLlxyXG4gICAgICAgIHJldHVybiBrID09IGwgPyAwIDogayA+IGwgXiB4TmVnID8gMSA6IC0xO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGRpdmlkZWQgYnkgdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiBCaWcgeSwgcm91bmRlZCwgaWYgbmVjZXNzYXJ5LCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWxcclxuICAgICAqIHBsYWNlcyB1c2luZyByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgICAqL1xyXG4gICAgUC5kaXYgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHZhciB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgLy8gZGl2aWRlbmRcclxuICAgICAgICAgICAgZHZkID0geC5jLFxyXG4gICAgICAgICAgICAvL2Rpdmlzb3JcclxuICAgICAgICAgICAgZHZzID0gKHkgPSBuZXcgQmlnKHkpKS5jLFxyXG4gICAgICAgICAgICBzID0geC5zID09IHkucyA/IDEgOiAtMSxcclxuICAgICAgICAgICAgZHAgPSBCaWcuRFA7XHJcblxyXG4gICAgICAgIGlmIChkcCAhPT0gfn5kcCB8fCBkcCA8IDAgfHwgZHAgPiBNQVhfRFApIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoJyFCaWcuRFAhJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFaXRoZXIgMD9cclxuICAgICAgICBpZiAoIWR2ZFswXSB8fCAhZHZzWzBdKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBib3RoIGFyZSAwLCB0aHJvdyBOYU5cclxuICAgICAgICAgICAgaWYgKGR2ZFswXSA9PSBkdnNbMF0pIHtcclxuICAgICAgICAgICAgICAgIHRocm93RXJyKE5hTik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIGR2cyBpcyAwLCB0aHJvdyArLUluZmluaXR5LlxyXG4gICAgICAgICAgICBpZiAoIWR2c1swXSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3dFcnIocyAvIDApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBkdmQgaXMgMCwgcmV0dXJuICstMC5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWcocyAqIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGR2c0wsIGR2c1QsIG5leHQsIGNtcCwgcmVtSSwgdSxcclxuICAgICAgICAgICAgZHZzWiA9IGR2cy5zbGljZSgpLFxyXG4gICAgICAgICAgICBkdmRJID0gZHZzTCA9IGR2cy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGR2ZEwgPSBkdmQubGVuZ3RoLFxyXG4gICAgICAgICAgICAvLyByZW1haW5kZXJcclxuICAgICAgICAgICAgcmVtID0gZHZkLnNsaWNlKDAsIGR2c0wpLFxyXG4gICAgICAgICAgICByZW1MID0gcmVtLmxlbmd0aCxcclxuICAgICAgICAgICAgLy8gcXVvdGllbnRcclxuICAgICAgICAgICAgcSA9IHksXHJcbiAgICAgICAgICAgIHFjID0gcS5jID0gW10sXHJcbiAgICAgICAgICAgIHFpID0gMCxcclxuICAgICAgICAgICAgZGlnaXRzID0gZHAgKyAocS5lID0geC5lIC0geS5lKSArIDE7XHJcblxyXG4gICAgICAgIHEucyA9IHM7XHJcbiAgICAgICAgcyA9IGRpZ2l0cyA8IDAgPyAwIDogZGlnaXRzO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdmVyc2lvbiBvZiBkaXZpc29yIHdpdGggbGVhZGluZyB6ZXJvLlxyXG4gICAgICAgIGR2c1oudW5zaGlmdCgwKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHplcm9zIHRvIG1ha2UgcmVtYWluZGVyIGFzIGxvbmcgYXMgZGl2aXNvci5cclxuICAgICAgICBmb3IgKDsgcmVtTCsrIDwgZHZzTDsgcmVtLnB1c2goMCkpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRvIHtcclxuXHJcbiAgICAgICAgICAgIC8vICduZXh0JyBpcyBob3cgbWFueSB0aW1lcyB0aGUgZGl2aXNvciBnb2VzIGludG8gY3VycmVudCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgIGZvciAobmV4dCA9IDA7IG5leHQgPCAxMDsgbmV4dCsrKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBkaXZpc29yIGFuZCByZW1haW5kZXIuXHJcbiAgICAgICAgICAgICAgICBpZiAoZHZzTCAhPSAocmVtTCA9IHJlbS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY21wID0gZHZzTCA+IHJlbUwgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHJlbUkgPSAtMSwgY21wID0gMDsgKytyZW1JIDwgZHZzTDspIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkdnNbcmVtSV0gIT0gcmVtW3JlbUldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbXAgPSBkdnNbcmVtSV0gPiByZW1bcmVtSV0gPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBkaXZpc29yIDwgcmVtYWluZGVyLCBzdWJ0cmFjdCBkaXZpc29yIGZyb20gcmVtYWluZGVyLlxyXG4gICAgICAgICAgICAgICAgaWYgKGNtcCA8IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVtYWluZGVyIGNhbid0IGJlIG1vcmUgdGhhbiAxIGRpZ2l0IGxvbmdlciB0aGFuIGRpdmlzb3IuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRXF1YWxpc2UgbGVuZ3RocyB1c2luZyBkaXZpc29yIHdpdGggZXh0cmEgbGVhZGluZyB6ZXJvP1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoZHZzVCA9IHJlbUwgPT0gZHZzTCA/IGR2cyA6IGR2c1o7IHJlbUw7KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVtWy0tcmVtTF0gPCBkdnNUW3JlbUxdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1JID0gcmVtTDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKDsgcmVtSSAmJiAhcmVtWy0tcmVtSV07IHJlbVtyZW1JXSA9IDkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tcmVtW3JlbUldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtW3JlbUxdICs9IDEwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbVtyZW1MXSAtPSBkdnNUW3JlbUxdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgIXJlbVswXTsgcmVtLnNoaWZ0KCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgdGhlICduZXh0JyBkaWdpdCB0byB0aGUgcmVzdWx0IGFycmF5LlxyXG4gICAgICAgICAgICBxY1txaSsrXSA9IGNtcCA/IG5leHQgOiArK25leHQ7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgdGhlIHJlbWFpbmRlci5cclxuICAgICAgICAgICAgaWYgKHJlbVswXSAmJiBjbXApIHtcclxuICAgICAgICAgICAgICAgIHJlbVtyZW1MXSA9IGR2ZFtkdmRJXSB8fCAwO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVtID0gWyBkdmRbZHZkSV0gXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IHdoaWxlICgoZHZkSSsrIDwgZHZkTCB8fCByZW1bMF0gIT09IHUpICYmIHMtLSk7XHJcblxyXG4gICAgICAgIC8vIExlYWRpbmcgemVybz8gRG8gbm90IHJlbW92ZSBpZiByZXN1bHQgaXMgc2ltcGx5IHplcm8gKHFpID09IDEpLlxyXG4gICAgICAgIGlmICghcWNbMF0gJiYgcWkgIT0gMSkge1xyXG5cclxuICAgICAgICAgICAgLy8gVGhlcmUgY2FuJ3QgYmUgbW9yZSB0aGFuIG9uZSB6ZXJvLlxyXG4gICAgICAgICAgICBxYy5zaGlmdCgpO1xyXG4gICAgICAgICAgICBxLmUtLTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJvdW5kP1xyXG4gICAgICAgIGlmIChxaSA+IGRpZ2l0cykge1xyXG4gICAgICAgICAgICBybmQocSwgZHAsIEJpZy5STSwgcmVtWzBdICE9PSB1KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBxO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBlcXVhbCB0byB0aGUgdmFsdWUgb2YgQmlnIHksXHJcbiAgICAgKiBvdGhlcndpc2UgcmV0dXJucyBmYWxzZS5cclxuICAgICAqL1xyXG4gICAgUC5lcSA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLmNtcCh5KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgZ3JlYXRlciB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmd0ID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jbXAoeSkgPiAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhlXHJcbiAgICAgKiB2YWx1ZSBvZiBCaWcgeSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAuZ3RlID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jbXAoeSkgPiAtMTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaXMgbGVzcyB0aGFuIHRoZSB2YWx1ZSBvZiBCaWcgeSxcclxuICAgICAqIG90aGVyd2lzZSByZXR1cm5zIGZhbHNlLlxyXG4gICAgICovXHJcbiAgICBQLmx0ID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jbXAoeSkgPCAwO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhlIHZhbHVlXHJcbiAgICAgKiBvZiBCaWcgeSwgb3RoZXJ3aXNlIHJldHVybnMgZmFsc2UuXHJcbiAgICAgKi9cclxuICAgIFAubHRlID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICAgcmV0dXJuIHRoaXMuY21wKHkpIDwgMTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyBtaW51cyB0aGUgdmFsdWVcclxuICAgICAqIG9mIEJpZyB5LlxyXG4gICAgICovXHJcbiAgICBQLnN1YiA9IFAubWludXMgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHZhciBpLCBqLCB0LCB4TFR5LFxyXG4gICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgYSA9IHgucyxcclxuICAgICAgICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICAgIGlmIChhICE9IGIpIHtcclxuICAgICAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgICAgIHJldHVybiB4LnBsdXMoeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgeGMgPSB4LmMuc2xpY2UoKSxcclxuICAgICAgICAgICAgeGUgPSB4LmUsXHJcbiAgICAgICAgICAgIHljID0geS5jLFxyXG4gICAgICAgICAgICB5ZSA9IHkuZTtcclxuXHJcbiAgICAgICAgLy8gRWl0aGVyIHplcm8/XHJcbiAgICAgICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIHkgaXMgbm9uLXplcm8/IHggaXMgbm9uLXplcm8/IE9yIGJvdGggYXJlIHplcm8uXHJcbiAgICAgICAgICAgIHJldHVybiB5Y1swXSA/ICh5LnMgPSAtYiwgeSkgOiBuZXcgQmlnKHhjWzBdID8geCA6IDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlzIHRoZSBiaWdnZXIgbnVtYmVyLlxyXG4gICAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gICAgICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKHhMVHkgPSBhIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgeWUgPSB4ZTtcclxuICAgICAgICAgICAgICAgIHQgPSB5YztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIGZvciAoYiA9IGE7IGItLTsgdC5wdXNoKDApKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEV4cG9uZW50cyBlcXVhbC4gQ2hlY2sgZGlnaXQgYnkgZGlnaXQuXHJcbiAgICAgICAgICAgIGogPSAoKHhMVHkgPSB4Yy5sZW5ndGggPCB5Yy5sZW5ndGgpID8geGMgOiB5YykubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgZm9yIChhID0gYiA9IDA7IGIgPCBqOyBiKyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoeGNbYl0gIT0geWNbYl0pIHtcclxuICAgICAgICAgICAgICAgICAgICB4TFR5ID0geGNbYl0gPCB5Y1tiXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8geCA8IHk/IFBvaW50IHhjIHRvIHRoZSBhcnJheSBvZiB0aGUgYmlnZ2VyIG51bWJlci5cclxuICAgICAgICBpZiAoeExUeSkge1xyXG4gICAgICAgICAgICB0ID0geGM7XHJcbiAgICAgICAgICAgIHhjID0geWM7XHJcbiAgICAgICAgICAgIHljID0gdDtcclxuICAgICAgICAgICAgeS5zID0gLXkucztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICogQXBwZW5kIHplcm9zIHRvIHhjIGlmIHNob3J0ZXIuIE5vIG5lZWQgdG8gYWRkIHplcm9zIHRvIHljIGlmIHNob3J0ZXJcclxuICAgICAgICAgKiBhcyBzdWJ0cmFjdGlvbiBvbmx5IG5lZWRzIHRvIHN0YXJ0IGF0IHljLmxlbmd0aC5cclxuICAgICAgICAgKi9cclxuICAgICAgICBpZiAoKCBiID0gKGogPSB5Yy5sZW5ndGgpIC0gKGkgPSB4Yy5sZW5ndGgpICkgPiAwKSB7XHJcblxyXG4gICAgICAgICAgICBmb3IgKDsgYi0tOyB4Y1tpKytdID0gMCkge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTdWJ0cmFjdCB5YyBmcm9tIHhjLlxyXG4gICAgICAgIGZvciAoYiA9IGk7IGogPiBhOyl7XHJcblxyXG4gICAgICAgICAgICBpZiAoeGNbLS1qXSA8IHljW2pdKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gajsgaSAmJiAheGNbLS1pXTsgeGNbaV0gPSA5KSB7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAtLXhjW2ldO1xyXG4gICAgICAgICAgICAgICAgeGNbal0gKz0gMTA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgeGNbal0gLT0geWNbal07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yICg7IHhjWy0tYl0gPT09IDA7IHhjLnBvcCgpKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgbGVhZGluZyB6ZXJvcyBhbmQgYWRqdXN0IGV4cG9uZW50IGFjY29yZGluZ2x5LlxyXG4gICAgICAgIGZvciAoOyB4Y1swXSA9PT0gMDspIHtcclxuICAgICAgICAgICAgeGMuc2hpZnQoKTtcclxuICAgICAgICAgICAgLS15ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICgheGNbMF0pIHtcclxuXHJcbiAgICAgICAgICAgIC8vIG4gLSBuID0gKzBcclxuICAgICAgICAgICAgeS5zID0gMTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlc3VsdCBtdXN0IGJlIHplcm8uXHJcbiAgICAgICAgICAgIHhjID0gW3llID0gMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB5LmMgPSB4YztcclxuICAgICAgICB5LmUgPSB5ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgbW9kdWxvIHRoZVxyXG4gICAgICogdmFsdWUgb2YgQmlnIHkuXHJcbiAgICAgKi9cclxuICAgIFAubW9kID0gZnVuY3Rpb24gKHkpIHtcclxuICAgICAgICB2YXIgeUdUeCxcclxuICAgICAgICAgICAgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIGEgPSB4LnMsXHJcbiAgICAgICAgICAgIGIgPSAoeSA9IG5ldyBCaWcoeSkpLnM7XHJcblxyXG4gICAgICAgIGlmICgheS5jWzBdKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKE5hTik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB4LnMgPSB5LnMgPSAxO1xyXG4gICAgICAgIHlHVHggPSB5LmNtcCh4KSA9PSAxO1xyXG4gICAgICAgIHgucyA9IGE7XHJcbiAgICAgICAgeS5zID0gYjtcclxuXHJcbiAgICAgICAgaWYgKHlHVHgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWcoeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhID0gQmlnLkRQO1xyXG4gICAgICAgIGIgPSBCaWcuUk07XHJcbiAgICAgICAgQmlnLkRQID0gQmlnLlJNID0gMDtcclxuICAgICAgICB4ID0geC5kaXYoeSk7XHJcbiAgICAgICAgQmlnLkRQID0gYTtcclxuICAgICAgICBCaWcuUk0gPSBiO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5taW51cyggeC50aW1lcyh5KSApO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHBsdXMgdGhlIHZhbHVlXHJcbiAgICAgKiBvZiBCaWcgeS5cclxuICAgICAqL1xyXG4gICAgUC5hZGQgPSBQLnBsdXMgPSBmdW5jdGlvbiAoeSkge1xyXG4gICAgICAgIHZhciB0LFxyXG4gICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgYSA9IHgucyxcclxuICAgICAgICAgICAgYiA9ICh5ID0gbmV3IEJpZyh5KSkucztcclxuXHJcbiAgICAgICAgLy8gU2lnbnMgZGlmZmVyP1xyXG4gICAgICAgIGlmIChhICE9IGIpIHtcclxuICAgICAgICAgICAgeS5zID0gLWI7XHJcbiAgICAgICAgICAgIHJldHVybiB4Lm1pbnVzKHkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHhlID0geC5lLFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgeWUgPSB5LmUsXHJcbiAgICAgICAgICAgIHljID0geS5jO1xyXG5cclxuICAgICAgICAvLyBFaXRoZXIgemVybz9cclxuICAgICAgICBpZiAoIXhjWzBdIHx8ICF5Y1swXSkge1xyXG5cclxuICAgICAgICAgICAgLy8geSBpcyBub24temVybz8geCBpcyBub24temVybz8gT3IgYm90aCBhcmUgemVyby5cclxuICAgICAgICAgICAgcmV0dXJuIHljWzBdID8geSA6IG5ldyBCaWcoeGNbMF0gPyB4IDogYSAqIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB4YyA9IHhjLnNsaWNlKCk7XHJcblxyXG4gICAgICAgIC8vIFByZXBlbmQgemVyb3MgdG8gZXF1YWxpc2UgZXhwb25lbnRzLlxyXG4gICAgICAgIC8vIE5vdGU6IEZhc3RlciB0byB1c2UgcmV2ZXJzZSB0aGVuIGRvIHVuc2hpZnRzLlxyXG4gICAgICAgIGlmIChhID0geGUgLSB5ZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB5ZSA9IHhlO1xyXG4gICAgICAgICAgICAgICAgdCA9IHljO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYSA9IC1hO1xyXG4gICAgICAgICAgICAgICAgdCA9IHhjO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0LnJldmVyc2UoKTtcclxuICAgICAgICAgICAgZm9yICg7IGEtLTsgdC5wdXNoKDApKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdC5yZXZlcnNlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQb2ludCB4YyB0byB0aGUgbG9uZ2VyIGFycmF5LlxyXG4gICAgICAgIGlmICh4Yy5sZW5ndGggLSB5Yy5sZW5ndGggPCAwKSB7XHJcbiAgICAgICAgICAgIHQgPSB5YztcclxuICAgICAgICAgICAgeWMgPSB4YztcclxuICAgICAgICAgICAgeGMgPSB0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBhID0geWMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvKlxyXG4gICAgICAgICAqIE9ubHkgc3RhcnQgYWRkaW5nIGF0IHljLmxlbmd0aCAtIDEgYXMgdGhlIGZ1cnRoZXIgZGlnaXRzIG9mIHhjIGNhbiBiZVxyXG4gICAgICAgICAqIGxlZnQgYXMgdGhleSBhcmUuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZm9yIChiID0gMDsgYTspIHtcclxuICAgICAgICAgICAgYiA9ICh4Y1stLWFdID0geGNbYV0gKyB5Y1thXSArIGIpIC8gMTAgfCAwO1xyXG4gICAgICAgICAgICB4Y1thXSAlPSAxMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE5vIG5lZWQgdG8gY2hlY2sgZm9yIHplcm8sIGFzICt4ICsgK3kgIT0gMCAmJiAteCArIC15ICE9IDBcclxuXHJcbiAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgeGMudW5zaGlmdChiKTtcclxuICAgICAgICAgICAgKyt5ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yIChhID0geGMubGVuZ3RoOyB4Y1stLWFdID09PSAwOyB4Yy5wb3AoKSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgeS5jID0geGM7XHJcbiAgICAgICAgeS5lID0geWU7XHJcblxyXG4gICAgICAgIHJldHVybiB5O1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgcmFpc2VkIHRvIHRoZSBwb3dlciBuLlxyXG4gICAgICogSWYgbiBpcyBuZWdhdGl2ZSwgcm91bmQsIGlmIG5lY2Vzc2FyeSwgdG8gYSBtYXhpbXVtIG9mIEJpZy5EUCBkZWNpbWFsXHJcbiAgICAgKiBwbGFjZXMgdXNpbmcgcm91bmRpbmcgbW9kZSBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogbiB7bnVtYmVyfSBJbnRlZ2VyLCAtTUFYX1BPV0VSIHRvIE1BWF9QT1dFUiBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIFAucG93ID0gZnVuY3Rpb24gKG4pIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIG9uZSA9IG5ldyB4LmNvbnN0cnVjdG9yKDEpLFxyXG4gICAgICAgICAgICB5ID0gb25lLFxyXG4gICAgICAgICAgICBpc05lZyA9IG4gPCAwO1xyXG5cclxuICAgICAgICBpZiAobiAhPT0gfn5uIHx8IG4gPCAtTUFYX1BPV0VSIHx8IG4gPiBNQVhfUE9XRVIpIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoJyFwb3chJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBuID0gaXNOZWcgPyAtbiA6IG47XHJcblxyXG4gICAgICAgIGZvciAoOzspIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChuICYgMSkge1xyXG4gICAgICAgICAgICAgICAgeSA9IHkudGltZXMoeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbiA+Pj0gMTtcclxuXHJcbiAgICAgICAgICAgIGlmICghbikge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgeCA9IHgudGltZXMoeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXNOZWcgPyBvbmUuZGl2KHkpIDogeTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBSZXR1cm4gYSBuZXcgQmlnIHdob3NlIHZhbHVlIGlzIHRoZSB2YWx1ZSBvZiB0aGlzIEJpZyByb3VuZGVkIHRvIGFcclxuICAgICAqIG1heGltdW0gb2YgZHAgZGVjaW1hbCBwbGFjZXMgdXNpbmcgcm91bmRpbmcgbW9kZSBybS5cclxuICAgICAqIElmIGRwIGlzIG5vdCBzcGVjaWZpZWQsIHJvdW5kIHRvIDAgZGVjaW1hbCBwbGFjZXMuXHJcbiAgICAgKiBJZiBybSBpcyBub3Qgc3BlY2lmaWVkLCB1c2UgQmlnLlJNLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAgICogW3JtXSAwLCAxLCAyIG9yIDMgKFJPVU5EX0RPV04sIFJPVU5EX0hBTEZfVVAsIFJPVU5EX0hBTEZfRVZFTiwgUk9VTkRfVVApXHJcbiAgICAgKi9cclxuICAgIFAucm91bmQgPSBmdW5jdGlvbiAoZHAsIHJtKSB7XHJcbiAgICAgICAgdmFyIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yO1xyXG5cclxuICAgICAgICBpZiAoZHAgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBkcCA9IDA7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkcCAhPT0gfn5kcCB8fCBkcCA8IDAgfHwgZHAgPiBNQVhfRFApIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoJyFyb3VuZCEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcm5kKHggPSBuZXcgQmlnKHgpLCBkcCwgcm0gPT0gbnVsbCA/IEJpZy5STSA6IHJtKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHg7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgbmV3IEJpZyB3aG9zZSB2YWx1ZSBpcyB0aGUgc3F1YXJlIHJvb3Qgb2YgdGhlIHZhbHVlIG9mIHRoaXMgQmlnLFxyXG4gICAgICogcm91bmRlZCwgaWYgbmVjZXNzYXJ5LCB0byBhIG1heGltdW0gb2YgQmlnLkRQIGRlY2ltYWwgcGxhY2VzIHVzaW5nXHJcbiAgICAgKiByb3VuZGluZyBtb2RlIEJpZy5STS5cclxuICAgICAqL1xyXG4gICAgUC5zcXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBlc3RpbWF0ZSwgciwgYXBwcm94LFxyXG4gICAgICAgICAgICB4ID0gdGhpcyxcclxuICAgICAgICAgICAgQmlnID0geC5jb25zdHJ1Y3RvcixcclxuICAgICAgICAgICAgeGMgPSB4LmMsXHJcbiAgICAgICAgICAgIGkgPSB4LnMsXHJcbiAgICAgICAgICAgIGUgPSB4LmUsXHJcbiAgICAgICAgICAgIGhhbGYgPSBuZXcgQmlnKCcwLjUnKTtcclxuXHJcbiAgICAgICAgLy8gWmVybz9cclxuICAgICAgICBpZiAoIXhjWzBdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQmlnKHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgbmVnYXRpdmUsIHRocm93IE5hTi5cclxuICAgICAgICBpZiAoaSA8IDApIHtcclxuICAgICAgICAgICAgdGhyb3dFcnIoTmFOKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEVzdGltYXRlLlxyXG4gICAgICAgIGkgPSBNYXRoLnNxcnQoeC50b1N0cmluZygpKTtcclxuXHJcbiAgICAgICAgLy8gTWF0aC5zcXJ0IHVuZGVyZmxvdy9vdmVyZmxvdz9cclxuICAgICAgICAvLyBQYXNzIHggdG8gTWF0aC5zcXJ0IGFzIGludGVnZXIsIHRoZW4gYWRqdXN0IHRoZSByZXN1bHQgZXhwb25lbnQuXHJcbiAgICAgICAgaWYgKGkgPT09IDAgfHwgaSA9PT0gMSAvIDApIHtcclxuICAgICAgICAgICAgZXN0aW1hdGUgPSB4Yy5qb2luKCcnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghKGVzdGltYXRlLmxlbmd0aCArIGUgJiAxKSkge1xyXG4gICAgICAgICAgICAgICAgZXN0aW1hdGUgKz0gJzAnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByID0gbmV3IEJpZyggTWF0aC5zcXJ0KGVzdGltYXRlKS50b1N0cmluZygpICk7XHJcbiAgICAgICAgICAgIHIuZSA9ICgoZSArIDEpIC8gMiB8IDApIC0gKGUgPCAwIHx8IGUgJiAxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByID0gbmV3IEJpZyhpLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaSA9IHIuZSArIChCaWcuRFAgKz0gNCk7XHJcblxyXG4gICAgICAgIC8vIE5ld3Rvbi1SYXBoc29uIGl0ZXJhdGlvbi5cclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIGFwcHJveCA9IHI7XHJcbiAgICAgICAgICAgIHIgPSBoYWxmLnRpbWVzKCBhcHByb3gucGx1cyggeC5kaXYoYXBwcm94KSApICk7XHJcbiAgICAgICAgfSB3aGlsZSAoIGFwcHJveC5jLnNsaWNlKDAsIGkpLmpvaW4oJycpICE9PVxyXG4gICAgICAgICAgICAgICAgICAgICAgIHIuYy5zbGljZSgwLCBpKS5qb2luKCcnKSApO1xyXG5cclxuICAgICAgICBybmQociwgQmlnLkRQIC09IDQsIEJpZy5STSk7XHJcblxyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIG5ldyBCaWcgd2hvc2UgdmFsdWUgaXMgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHRpbWVzIHRoZSB2YWx1ZSBvZlxyXG4gICAgICogQmlnIHkuXHJcbiAgICAgKi9cclxuICAgIFAubXVsID0gUC50aW1lcyA9IGZ1bmN0aW9uICh5KSB7XHJcbiAgICAgICAgdmFyIGMsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICB4YyA9IHguYyxcclxuICAgICAgICAgICAgeWMgPSAoeSA9IG5ldyBCaWcoeSkpLmMsXHJcbiAgICAgICAgICAgIGEgPSB4Yy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGIgPSB5Yy5sZW5ndGgsXHJcbiAgICAgICAgICAgIGkgPSB4LmUsXHJcbiAgICAgICAgICAgIGogPSB5LmU7XHJcblxyXG4gICAgICAgIC8vIERldGVybWluZSBzaWduIG9mIHJlc3VsdC5cclxuICAgICAgICB5LnMgPSB4LnMgPT0geS5zID8gMSA6IC0xO1xyXG5cclxuICAgICAgICAvLyBSZXR1cm4gc2lnbmVkIDAgaWYgZWl0aGVyIDAuXHJcbiAgICAgICAgaWYgKCF4Y1swXSB8fCAheWNbMF0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBCaWcoeS5zICogMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJbml0aWFsaXNlIGV4cG9uZW50IG9mIHJlc3VsdCBhcyB4LmUgKyB5LmUuXHJcbiAgICAgICAgeS5lID0gaSArIGo7XHJcblxyXG4gICAgICAgIC8vIElmIGFycmF5IHhjIGhhcyBmZXdlciBkaWdpdHMgdGhhbiB5Yywgc3dhcCB4YyBhbmQgeWMsIGFuZCBsZW5ndGhzLlxyXG4gICAgICAgIGlmIChhIDwgYikge1xyXG4gICAgICAgICAgICBjID0geGM7XHJcbiAgICAgICAgICAgIHhjID0geWM7XHJcbiAgICAgICAgICAgIHljID0gYztcclxuICAgICAgICAgICAgaiA9IGE7XHJcbiAgICAgICAgICAgIGEgPSBiO1xyXG4gICAgICAgICAgICBiID0gajtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluaXRpYWxpc2UgY29lZmZpY2llbnQgYXJyYXkgb2YgcmVzdWx0IHdpdGggemVyb3MuXHJcbiAgICAgICAgZm9yIChjID0gbmV3IEFycmF5KGogPSBhICsgYik7IGotLTsgY1tqXSA9IDApIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE11bHRpcGx5LlxyXG5cclxuICAgICAgICAvLyBpIGlzIGluaXRpYWxseSB4Yy5sZW5ndGguXHJcbiAgICAgICAgZm9yIChpID0gYjsgaS0tOykge1xyXG4gICAgICAgICAgICBiID0gMDtcclxuXHJcbiAgICAgICAgICAgIC8vIGEgaXMgeWMubGVuZ3RoLlxyXG4gICAgICAgICAgICBmb3IgKGogPSBhICsgaTsgaiA+IGk7KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ3VycmVudCBzdW0gb2YgcHJvZHVjdHMgYXQgdGhpcyBkaWdpdCBwb3NpdGlvbiwgcGx1cyBjYXJyeS5cclxuICAgICAgICAgICAgICAgIGIgPSBjW2pdICsgeWNbaV0gKiB4Y1tqIC0gaSAtIDFdICsgYjtcclxuICAgICAgICAgICAgICAgIGNbai0tXSA9IGIgJSAxMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjYXJyeVxyXG4gICAgICAgICAgICAgICAgYiA9IGIgLyAxMCB8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY1tqXSA9IChjW2pdICsgYikgJSAxMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEluY3JlbWVudCByZXN1bHQgZXhwb25lbnQgaWYgdGhlcmUgaXMgYSBmaW5hbCBjYXJyeS5cclxuICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICArK3kuZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJlbW92ZSBhbnkgbGVhZGluZyB6ZXJvLlxyXG4gICAgICAgIGlmICghY1swXSkge1xyXG4gICAgICAgICAgICBjLnNoaWZ0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSZW1vdmUgdHJhaWxpbmcgemVyb3MuXHJcbiAgICAgICAgZm9yIChpID0gYy5sZW5ndGg7ICFjWy0taV07IGMucG9wKCkpIHtcclxuICAgICAgICB9XHJcbiAgICAgICAgeS5jID0gYztcclxuXHJcbiAgICAgICAgcmV0dXJuIHk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcuXHJcbiAgICAgKiBSZXR1cm4gZXhwb25lbnRpYWwgbm90YXRpb24gaWYgdGhpcyBCaWcgaGFzIGEgcG9zaXRpdmUgZXhwb25lbnQgZXF1YWwgdG9cclxuICAgICAqIG9yIGdyZWF0ZXIgdGhhbiBCaWcuRV9QT1MsIG9yIGEgbmVnYXRpdmUgZXhwb25lbnQgZXF1YWwgdG8gb3IgbGVzcyB0aGFuXHJcbiAgICAgKiBCaWcuRV9ORUcuXHJcbiAgICAgKi9cclxuICAgIFAudG9TdHJpbmcgPSBQLnZhbHVlT2YgPSBQLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgeCA9IHRoaXMsXHJcbiAgICAgICAgICAgIEJpZyA9IHguY29uc3RydWN0b3IsXHJcbiAgICAgICAgICAgIGUgPSB4LmUsXHJcbiAgICAgICAgICAgIHN0ciA9IHguYy5qb2luKCcnKSxcclxuICAgICAgICAgICAgc3RyTCA9IHN0ci5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50aWFsIG5vdGF0aW9uP1xyXG4gICAgICAgIGlmIChlIDw9IEJpZy5FX05FRyB8fCBlID49IEJpZy5FX1BPUykge1xyXG4gICAgICAgICAgICBzdHIgPSBzdHIuY2hhckF0KDApICsgKHN0ckwgPiAxID8gJy4nICsgc3RyLnNsaWNlKDEpIDogJycpICtcclxuICAgICAgICAgICAgICAoZSA8IDAgPyAnZScgOiAnZSsnKSArIGU7XHJcblxyXG4gICAgICAgIC8vIE5lZ2F0aXZlIGV4cG9uZW50P1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBlbmQgemVyb3MuXHJcbiAgICAgICAgICAgIGZvciAoOyArK2U7IHN0ciA9ICcwJyArIHN0cikge1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN0ciA9ICcwLicgKyBzdHI7XHJcblxyXG4gICAgICAgIC8vIFBvc2l0aXZlIGV4cG9uZW50P1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZSA+IDApIHtcclxuXHJcbiAgICAgICAgICAgIGlmICgrK2UgPiBzdHJMKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQXBwZW5kIHplcm9zLlxyXG4gICAgICAgICAgICAgICAgZm9yIChlIC09IHN0ckw7IGUtLSA7IHN0ciArPSAnMCcpIHtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlIDwgc3RyTCkge1xyXG4gICAgICAgICAgICAgICAgc3RyID0gc3RyLnNsaWNlKDAsIGUpICsgJy4nICsgc3RyLnNsaWNlKGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9uZW50IHplcm8uXHJcbiAgICAgICAgfSBlbHNlIGlmIChzdHJMID4gMSkge1xyXG4gICAgICAgICAgICBzdHIgPSBzdHIuY2hhckF0KDApICsgJy4nICsgc3RyLnNsaWNlKDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXZvaWQgJy0wJ1xyXG4gICAgICAgIHJldHVybiB4LnMgPCAwICYmIHguY1swXSA/ICctJyArIHN0ciA6IHN0cjtcclxuICAgIH07XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgKiBJZiB0b0V4cG9uZW50aWFsLCB0b0ZpeGVkLCB0b1ByZWNpc2lvbiBhbmQgZm9ybWF0IGFyZSBub3QgcmVxdWlyZWQgdGhleVxyXG4gICAgICogY2FuIHNhZmVseSBiZSBjb21tZW50ZWQtb3V0IG9yIGRlbGV0ZWQuIE5vIHJlZHVuZGFudCBjb2RlIHdpbGwgYmUgbGVmdC5cclxuICAgICAqIGZvcm1hdCBpcyB1c2VkIG9ubHkgYnkgdG9FeHBvbmVudGlhbCwgdG9GaXhlZCBhbmQgdG9QcmVjaXNpb24uXHJcbiAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIGluIGV4cG9uZW50aWFsXHJcbiAgICAgKiBub3RhdGlvbiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyBhbmQgcm91bmRlZCwgaWYgbmVjZXNzYXJ5LCB1c2luZ1xyXG4gICAgICogQmlnLlJNLlxyXG4gICAgICpcclxuICAgICAqIFtkcF0ge251bWJlcn0gSW50ZWdlciwgMCB0byBNQVhfRFAgaW5jbHVzaXZlLlxyXG4gICAgICovXHJcbiAgICBQLnRvRXhwb25lbnRpYWwgPSBmdW5jdGlvbiAoZHApIHtcclxuXHJcbiAgICAgICAgaWYgKGRwID09IG51bGwpIHtcclxuICAgICAgICAgICAgZHAgPSB0aGlzLmMubGVuZ3RoIC0gMTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwICE9PSB+fmRwIHx8IGRwIDwgMCB8fCBkcCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXRvRXhwIScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBkcCwgMSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICogUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdmFsdWUgb2YgdGhpcyBCaWcgaW4gbm9ybWFsIG5vdGF0aW9uXHJcbiAgICAgKiB0byBkcCBmaXhlZCBkZWNpbWFsIHBsYWNlcyBhbmQgcm91bmRlZCwgaWYgbmVjZXNzYXJ5LCB1c2luZyBCaWcuUk0uXHJcbiAgICAgKlxyXG4gICAgICogW2RwXSB7bnVtYmVyfSBJbnRlZ2VyLCAwIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9GaXhlZCA9IGZ1bmN0aW9uIChkcCkge1xyXG4gICAgICAgIHZhciBzdHIsXHJcbiAgICAgICAgICAgIHggPSB0aGlzLFxyXG4gICAgICAgICAgICBCaWcgPSB4LmNvbnN0cnVjdG9yLFxyXG4gICAgICAgICAgICBuZWcgPSBCaWcuRV9ORUcsXHJcbiAgICAgICAgICAgIHBvcyA9IEJpZy5FX1BPUztcclxuXHJcbiAgICAgICAgLy8gUHJldmVudCB0aGUgcG9zc2liaWxpdHkgb2YgZXhwb25lbnRpYWwgbm90YXRpb24uXHJcbiAgICAgICAgQmlnLkVfTkVHID0gLShCaWcuRV9QT1MgPSAxIC8gMCk7XHJcblxyXG4gICAgICAgIGlmIChkcCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IHgudG9TdHJpbmcoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRwID09PSB+fmRwICYmIGRwID49IDAgJiYgZHAgPD0gTUFYX0RQKSB7XHJcbiAgICAgICAgICAgIHN0ciA9IGZvcm1hdCh4LCB4LmUgKyBkcCk7XHJcblxyXG4gICAgICAgICAgICAvLyAoLTApLnRvRml4ZWQoKSBpcyAnMCcsIGJ1dCAoLTAuMSkudG9GaXhlZCgpIGlzICctMCcuXHJcbiAgICAgICAgICAgIC8vICgtMCkudG9GaXhlZCgxKSBpcyAnMC4wJywgYnV0ICgtMC4wMSkudG9GaXhlZCgxKSBpcyAnLTAuMCcuXHJcbiAgICAgICAgICAgIGlmICh4LnMgPCAwICYmIHguY1swXSAmJiBzdHIuaW5kZXhPZignLScpIDwgMCkge1xyXG4gICAgICAgIC8vRS5nLiAtMC41IGlmIHJvdW5kZWQgdG8gLTAgd2lsbCBjYXVzZSB0b1N0cmluZyB0byBvbWl0IHRoZSBtaW51cyBzaWduLlxyXG4gICAgICAgICAgICAgICAgc3RyID0gJy0nICsgc3RyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEJpZy5FX05FRyA9IG5lZztcclxuICAgICAgICBCaWcuRV9QT1MgPSBwb3M7XHJcblxyXG4gICAgICAgIGlmICghc3RyKSB7XHJcbiAgICAgICAgICAgIHRocm93RXJyKCchdG9GaXghJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHZhbHVlIG9mIHRoaXMgQmlnIHJvdW5kZWQgdG8gc2RcclxuICAgICAqIHNpZ25pZmljYW50IGRpZ2l0cyB1c2luZyBCaWcuUk0uIFVzZSBleHBvbmVudGlhbCBub3RhdGlvbiBpZiBzZCBpcyBsZXNzXHJcbiAgICAgKiB0aGFuIHRoZSBudW1iZXIgb2YgZGlnaXRzIG5lY2Vzc2FyeSB0byByZXByZXNlbnQgdGhlIGludGVnZXIgcGFydCBvZiB0aGVcclxuICAgICAqIHZhbHVlIGluIG5vcm1hbCBub3RhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBzZCB7bnVtYmVyfSBJbnRlZ2VyLCAxIHRvIE1BWF9EUCBpbmNsdXNpdmUuXHJcbiAgICAgKi9cclxuICAgIFAudG9QcmVjaXNpb24gPSBmdW5jdGlvbiAoc2QpIHtcclxuXHJcbiAgICAgICAgaWYgKHNkID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHNkICE9PSB+fnNkIHx8IHNkIDwgMSB8fCBzZCA+IE1BWF9EUCkge1xyXG4gICAgICAgICAgICB0aHJvd0VycignIXRvUHJlIScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGZvcm1hdCh0aGlzLCBzZCAtIDEsIDIpO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8gRXhwb3J0XHJcblxyXG5cclxuICAgIEJpZyA9IGJpZ0ZhY3RvcnkoKTtcclxuXHJcbiAgICAvL0FNRC5cclxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gQmlnO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIE5vZGUgYW5kIG90aGVyIENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cy5cclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IEJpZztcclxuXHJcbiAgICAvL0Jyb3dzZXIuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGdsb2JhbC5CaWcgPSBCaWc7XHJcbiAgICB9XHJcbn0pKHRoaXMpO1xyXG4iLCI7KGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcHJlc2VydmUgRmFzdENsaWNrOiBwb2x5ZmlsbCB0byByZW1vdmUgY2xpY2sgZGVsYXlzIG9uIGJyb3dzZXJzIHdpdGggdG91Y2ggVUlzLlxuXHQgKlxuXHQgKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcblx0ICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG5cdCAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG5cdCAqL1xuXG5cdC8qanNsaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblx0LypnbG9iYWwgZGVmaW5lLCBFdmVudCwgTm9kZSovXG5cblxuXHQvKipcblx0ICogSW5zdGFudGlhdGUgZmFzdC1jbGlja2luZyBsaXN0ZW5lcnMgb24gdGhlIHNwZWNpZmllZCBsYXllci5cblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0ZnVuY3Rpb24gRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0dmFyIG9sZE9uQ2xpY2s7XG5cblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgYSBjbGljayBpcyBjdXJyZW50bHkgYmVpbmcgdHJhY2tlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIGJvb2xlYW5cblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGltZXN0YW1wIGZvciB3aGVuIGNsaWNrIHRyYWNraW5nIHN0YXJ0ZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBlbGVtZW50IGJlaW5nIHRyYWNrZWQgZm9yIGEgY2xpY2suXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFdmVudFRhcmdldFxuXHRcdCAqL1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFgtY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFggPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBZLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogSUQgb2YgdGhlIGxhc3QgdG91Y2gsIHJldHJpZXZlZCBmcm9tIFRvdWNoLmlkZW50aWZpZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUb3VjaG1vdmUgYm91bmRhcnksIGJleW9uZCB3aGljaCBhIGNsaWNrIHdpbGwgYmUgY2FuY2VsbGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaEJvdW5kYXJ5ID0gb3B0aW9ucy50b3VjaEJvdW5kYXJ5IHx8IDEwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgRmFzdENsaWNrIGxheWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRWxlbWVudFxuXHRcdCAqL1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtaW5pbXVtIHRpbWUgYmV0d2VlbiB0YXAodG91Y2hzdGFydCBhbmQgdG91Y2hlbmQpIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBEZWxheSA9IG9wdGlvbnMudGFwRGVsYXkgfHwgMjAwO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1heGltdW0gdGltZSBmb3IgYSB0YXBcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwVGltZW91dCA9IG9wdGlvbnMudGFwVGltZW91dCB8fCA3MDA7XG5cblx0XHRpZiAoRmFzdENsaWNrLm5vdE5lZWRlZChsYXllcikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb21lIG9sZCB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IGhhdmUgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcblx0XHRmdW5jdGlvbiBiaW5kKG1ldGhvZCwgY29udGV4dCkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gbWV0aG9kLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7IH07XG5cdFx0fVxuXG5cblx0XHR2YXIgbWV0aG9kcyA9IFsnb25Nb3VzZScsICdvbkNsaWNrJywgJ29uVG91Y2hTdGFydCcsICdvblRvdWNoTW92ZScsICdvblRvdWNoRW5kJywgJ29uVG91Y2hDYW5jZWwnXTtcblx0XHR2YXIgY29udGV4dCA9IHRoaXM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Y29udGV4dFttZXRob2RzW2ldXSA9IGJpbmQoY29udGV4dFttZXRob2RzW2ldXSwgY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHVwIGV2ZW50IGhhbmRsZXJzIGFzIHJlcXVpcmVkXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblxuXHRcdC8vIEhhY2sgaXMgcmVxdWlyZWQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdC8vIHdoaWNoIGlzIGhvdyBGYXN0Q2xpY2sgbm9ybWFsbHkgc3RvcHMgY2xpY2sgZXZlbnRzIGJ1YmJsaW5nIHRvIGNhbGxiYWNrcyByZWdpc3RlcmVkIG9uIHRoZSBGYXN0Q2xpY2tcblx0XHQvLyBsYXllciB3aGVuIHRoZXkgYXJlIGNhbmNlbGxlZC5cblx0XHRpZiAoIUV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgcm12ID0gTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgYWR2ID0gTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgKGNhbGxiYWNrLmhpamFja2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSwgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBJZiBhIGhhbmRsZXIgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGUgZWxlbWVudCdzIG9uY2xpY2sgYXR0cmlidXRlLCBpdCB3aWxsIGJlIGZpcmVkIGJlZm9yZVxuXHRcdC8vIEZhc3RDbGljaydzIG9uQ2xpY2sgaGFuZGxlci4gRml4IHRoaXMgYnkgcHVsbGluZyBvdXQgdGhlIHVzZXItZGVmaW5lZCBoYW5kbGVyIGZ1bmN0aW9uIGFuZFxuXHRcdC8vIGFkZGluZyBpdCBhcyBsaXN0ZW5lci5cblx0XHRpZiAodHlwZW9mIGxheWVyLm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0Ly8gQW5kcm9pZCBicm93c2VyIG9uIGF0IGxlYXN0IDMuMiByZXF1aXJlcyBhIG5ldyByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIGluIGxheWVyLm9uY2xpY2tcblx0XHRcdC8vIC0gdGhlIG9sZCBvbmUgd29uJ3Qgd29yayBpZiBwYXNzZWQgdG8gYWRkRXZlbnRMaXN0ZW5lciBkaXJlY3RseS5cblx0XHRcdG9sZE9uQ2xpY2sgPSBsYXllci5vbmNsaWNrO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRvbGRPbkNsaWNrKGV2ZW50KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdGxheWVyLm9uY2xpY2sgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIFdpbmRvd3MgUGhvbmUgOC4xIGZha2VzIHVzZXIgYWdlbnQgc3RyaW5nIHRvIGxvb2sgbGlrZSBBbmRyb2lkIGFuZCBpUGhvbmUuXG5cdCpcblx0KiBAdHlwZSBib29sZWFuXG5cdCovXG5cdHZhciBkZXZpY2VJc1dpbmRvd3NQaG9uZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIldpbmRvd3MgUGhvbmVcIikgPj0gMDtcblxuXHQvKipcblx0ICogQW5kcm9pZCByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAwICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TID0gL2lQKGFkfGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNCByZXF1aXJlcyBhbiBleGNlcHRpb24gZm9yIHNlbGVjdCBlbGVtZW50cy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TNCA9IGRldmljZUlzSU9TICYmICgvT1MgNF9cXGQoX1xcZCk/LykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNi4wLTcuKiByZXF1aXJlcyB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gYmUgbWFudWFsbHkgZGVyaXZlZFxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyBbNi03XV9cXGQvKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdC8qKlxuXHQgKiBCbGFja0JlcnJ5IHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0JsYWNrQmVycnkxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQkIxMCcpID4gMDtcblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgbmF0aXZlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBuZWVkcyBhIG5hdGl2ZSBjbGlja1xuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0NsaWNrID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXG5cdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayB0byBkaXNhYmxlZCBpbnB1dHMgKGlzc3VlICM2Milcblx0XHRjYXNlICdidXR0b24nOlxuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0aWYgKHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXG5cdFx0XHQvLyBGaWxlIGlucHV0cyBuZWVkIHJlYWwgY2xpY2tzIG9uIGlPUyA2IGR1ZSB0byBhIGJyb3dzZXIgYnVnIChpc3N1ZSAjNjgpXG5cdFx0XHRpZiAoKGRldmljZUlzSU9TICYmIHRhcmdldC50eXBlID09PSAnZmlsZScpIHx8IHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbGFiZWwnOlxuXHRcdGNhc2UgJ2lmcmFtZSc6IC8vIGlPUzggaG9tZXNjcmVlbiBhcHBzIGNhbiBwcmV2ZW50IGV2ZW50cyBidWJibGluZyBpbnRvIGZyYW1lc1xuXHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiAoL1xcYm5lZWRzY2xpY2tcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgY2xpY2sgaW50byBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgbmF0aXZlIGNsaWNrLlxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0ZvY3VzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRyZXR1cm4gIWRldmljZUlzQW5kcm9pZDtcblx0XHRjYXNlICdpbnB1dCc6XG5cdFx0XHRzd2l0Y2ggKHRhcmdldC50eXBlKSB7XG5cdFx0XHRjYXNlICdidXR0b24nOlxuXHRcdFx0Y2FzZSAnY2hlY2tib3gnOlxuXHRcdFx0Y2FzZSAnZmlsZSc6XG5cdFx0XHRjYXNlICdpbWFnZSc6XG5cdFx0XHRjYXNlICdyYWRpbyc6XG5cdFx0XHRjYXNlICdzdWJtaXQnOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vIHBvaW50IGluIGF0dGVtcHRpbmcgdG8gZm9jdXMgZGlzYWJsZWQgaW5wdXRzXG5cdFx0XHRyZXR1cm4gIXRhcmdldC5kaXNhYmxlZCAmJiAhdGFyZ2V0LnJlYWRPbmx5O1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKC9cXGJuZWVkc2ZvY3VzXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogU2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnNlbmRDbGljayA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0dmFyIGNsaWNrRXZlbnQsIHRvdWNoO1xuXG5cdFx0Ly8gT24gc29tZSBBbmRyb2lkIGRldmljZXMgYWN0aXZlRWxlbWVudCBuZWVkcyB0byBiZSBibHVycmVkIG90aGVyd2lzZSB0aGUgc3ludGhldGljIGNsaWNrIHdpbGwgaGF2ZSBubyBlZmZlY3QgKCMyNClcblx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHR9XG5cblx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0Ly8gU3ludGhlc2lzZSBhIGNsaWNrIGV2ZW50LCB3aXRoIGFuIGV4dHJhIGF0dHJpYnV0ZSBzbyBpdCBjYW4gYmUgdHJhY2tlZFxuXHRcdGNsaWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudHMnKTtcblx0XHRjbGlja0V2ZW50LmluaXRNb3VzZUV2ZW50KHRoaXMuZGV0ZXJtaW5lRXZlbnRUeXBlKHRhcmdldEVsZW1lbnQpLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIHRvdWNoLnNjcmVlblgsIHRvdWNoLnNjcmVlblksIHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcblx0XHRjbGlja0V2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQgPSB0cnVlO1xuXHRcdHRhcmdldEVsZW1lbnQuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcblx0fTtcblxuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRldGVybWluZUV2ZW50VHlwZSA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblxuXHRcdC8vSXNzdWUgIzE1OTogQW5kcm9pZCBDaHJvbWUgU2VsZWN0IEJveCBkb2VzIG5vdCBvcGVuIHdpdGggYSBzeW50aGV0aWMgY2xpY2sgZXZlbnRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkICYmIHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0Jykge1xuXHRcdFx0cmV0dXJuICdtb3VzZWRvd24nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnY2xpY2snO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgbGVuZ3RoO1xuXG5cdFx0Ly8gSXNzdWUgIzE2MDogb24gaU9TIDcsIHNvbWUgaW5wdXQgZWxlbWVudHMgKGUuZy4gZGF0ZSBkYXRldGltZSBtb250aCkgdGhyb3cgYSB2YWd1ZSBUeXBlRXJyb3Igb24gc2V0U2VsZWN0aW9uUmFuZ2UuIFRoZXNlIGVsZW1lbnRzIGRvbid0IGhhdmUgYW4gaW50ZWdlciB2YWx1ZSBmb3IgdGhlIHNlbGVjdGlvblN0YXJ0IGFuZCBzZWxlY3Rpb25FbmQgcHJvcGVydGllcywgYnV0IHVuZm9ydHVuYXRlbHkgdGhhdCBjYW4ndCBiZSB1c2VkIGZvciBkZXRlY3Rpb24gYmVjYXVzZSBhY2Nlc3NpbmcgdGhlIHByb3BlcnRpZXMgYWxzbyB0aHJvd3MgYSBUeXBlRXJyb3IuIEp1c3QgY2hlY2sgdGhlIHR5cGUgaW5zdGVhZC4gRmlsZWQgYXMgQXBwbGUgYnVnICMxNTEyMjcyNC5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSAmJiB0YXJnZXRFbGVtZW50LnR5cGUuaW5kZXhPZignZGF0ZScpICE9PSAwICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ3RpbWUnICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ21vbnRoJykge1xuXHRcdFx0bGVuZ3RoID0gdGFyZ2V0RWxlbWVudC52YWx1ZS5sZW5ndGg7XG5cdFx0XHR0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKGxlbmd0aCwgbGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mb2N1cygpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciBhbmQgaWYgc28sIHNldCBhIGZsYWcgb24gaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS51cGRhdGVTY3JvbGxQYXJlbnQgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIHNjcm9sbFBhcmVudCwgcGFyZW50RWxlbWVudDtcblxuXHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkaXNjb3ZlciB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgc2Nyb2xsYWJsZSBsYXllci4gUmUtY2hlY2sgaWYgdGhlXG5cdFx0Ly8gdGFyZ2V0IGVsZW1lbnQgd2FzIG1vdmVkIHRvIGFub3RoZXIgcGFyZW50LlxuXHRcdGlmICghc2Nyb2xsUGFyZW50IHx8ICFzY3JvbGxQYXJlbnQuY29udGFpbnModGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdHBhcmVudEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgPiBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcblx0XHRcdH0gd2hpbGUgKHBhcmVudEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdC8vIEFsd2F5cyB1cGRhdGUgdGhlIHNjcm9sbCB0b3AgdHJhY2tlciBpZiBwb3NzaWJsZS5cblx0XHRpZiAoc2Nyb2xsUGFyZW50KSB7XG5cdFx0XHRzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCA9IHNjcm9sbFBhcmVudC5zY3JvbGxUb3A7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8RXZlbnRUYXJnZXR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQgPSBmdW5jdGlvbihldmVudFRhcmdldCkge1xuXG5cdFx0Ly8gT24gc29tZSBvbGRlciBicm93c2VycyAobm90YWJseSBTYWZhcmkgb24gaU9TIDQuMSAtIHNlZSBpc3N1ZSAjNTYpIHRoZSBldmVudCB0YXJnZXQgbWF5IGJlIGEgdGV4dCBub2RlLlxuXHRcdGlmIChldmVudFRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdHJldHVybiBldmVudFRhcmdldC5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudFRhcmdldDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBzdGFydCwgcmVjb3JkIHRoZSBwb3NpdGlvbiBhbmQgc2Nyb2xsIG9mZnNldC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRhcmdldEVsZW1lbnQsIHRvdWNoLCBzZWxlY3Rpb247XG5cblx0XHQvLyBJZ25vcmUgbXVsdGlwbGUgdG91Y2hlcywgb3RoZXJ3aXNlIHBpbmNoLXRvLXpvb20gaXMgcHJldmVudGVkIGlmIGJvdGggZmluZ2VycyBhcmUgb24gdGhlIEZhc3RDbGljayBlbGVtZW50IChpc3N1ZSAjMTExKS5cblx0XHRpZiAoZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0YXJnZXRFbGVtZW50ID0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCk7XG5cdFx0dG91Y2ggPSBldmVudC50YXJnZXRUb3VjaGVzWzBdO1xuXG5cdFx0aWYgKGRldmljZUlzSU9TKSB7XG5cblx0XHRcdC8vIE9ubHkgdHJ1c3RlZCBldmVudHMgd2lsbCBkZXNlbGVjdCB0ZXh0IG9uIGlPUyAoaXNzdWUgIzQ5KVxuXHRcdFx0c2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdFx0Ly8gV2VpcmQgdGhpbmdzIGhhcHBlbiBvbiBpT1Mgd2hlbiBhbiBhbGVydCBvciBjb25maXJtIGRpYWxvZyBpcyBvcGVuZWQgZnJvbSBhIGNsaWNrIGV2ZW50IGNhbGxiYWNrIChpc3N1ZSAjMjMpOlxuXHRcdFx0XHQvLyB3aGVuIHRoZSB1c2VyIG5leHQgdGFwcyBhbnl3aGVyZSBlbHNlIG9uIHRoZSBwYWdlLCBuZXcgdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgZXZlbnRzIGFyZSBkaXNwYXRjaGVkXG5cdFx0XHRcdC8vIHdpdGggdGhlIHNhbWUgaWRlbnRpZmllciBhcyB0aGUgdG91Y2ggZXZlbnQgdGhhdCBwcmV2aW91c2x5IHRyaWdnZXJlZCB0aGUgY2xpY2sgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0LlxuXHRcdFx0XHQvLyBTYWRseSwgdGhlcmUgaXMgYW4gaXNzdWUgb24gaU9TIDQgdGhhdCBjYXVzZXMgc29tZSBub3JtYWwgdG91Y2ggZXZlbnRzIHRvIGhhdmUgdGhlIHNhbWUgaWRlbnRpZmllciBhcyBhblxuXHRcdFx0XHQvLyBpbW1lZGlhdGVseSBwcmVjZWVkaW5nIHRvdWNoIGV2ZW50IChpc3N1ZSAjNTIpLCBzbyB0aGlzIGZpeCBpcyB1bmF2YWlsYWJsZSBvbiB0aGF0IHBsYXRmb3JtLlxuXHRcdFx0XHQvLyBJc3N1ZSAxMjA6IHRvdWNoLmlkZW50aWZpZXIgaXMgMCB3aGVuIENocm9tZSBkZXYgdG9vbHMgJ0VtdWxhdGUgdG91Y2ggZXZlbnRzJyBpcyBzZXQgd2l0aCBhbiBpT1MgZGV2aWNlIFVBIHN0cmluZyxcblx0XHRcdFx0Ly8gd2hpY2ggY2F1c2VzIGFsbCB0b3VjaCBldmVudHMgdG8gYmUgaWdub3JlZC4gQXMgdGhpcyBibG9jayBvbmx5IGFwcGxpZXMgdG8gaU9TLCBhbmQgaU9TIGlkZW50aWZpZXJzIGFyZSBhbHdheXMgbG9uZyxcblx0XHRcdFx0Ly8gcmFuZG9tIGludGVnZXJzLCBpdCdzIHNhZmUgdG8gdG8gY29udGludWUgaWYgdGhlIGlkZW50aWZpZXIgaXMgMCBoZXJlLlxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAmJiB0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyICh1c2luZyAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2gpIGFuZDpcblx0XHRcdFx0Ly8gMSkgdGhlIHVzZXIgZG9lcyBhIGZsaW5nIHNjcm9sbCBvbiB0aGUgc2Nyb2xsYWJsZSBsYXllclxuXHRcdFx0XHQvLyAyKSB0aGUgdXNlciBzdG9wcyB0aGUgZmxpbmcgc2Nyb2xsIHdpdGggYW5vdGhlciB0YXBcblx0XHRcdFx0Ly8gdGhlbiB0aGUgZXZlbnQudGFyZ2V0IG9mIHRoZSBsYXN0ICd0b3VjaGVuZCcgZXZlbnQgd2lsbCBiZSB0aGUgZWxlbWVudCB0aGF0IHdhcyB1bmRlciB0aGUgdXNlcidzIGZpbmdlclxuXHRcdFx0XHQvLyB3aGVuIHRoZSBmbGluZyBzY3JvbGwgd2FzIHN0YXJ0ZWQsIGNhdXNpbmcgRmFzdENsaWNrIHRvIHNlbmQgYSBjbGljayBldmVudCB0byB0aGF0IGxheWVyIC0gdW5sZXNzIGEgY2hlY2tcblx0XHRcdFx0Ly8gaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhIHBhcmVudCBsYXllciB3YXMgbm90IHNjcm9sbGVkIGJlZm9yZSBzZW5kaW5nIGEgc3ludGhldGljIGNsaWNrIChpc3N1ZSAjNDIpLlxuXHRcdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbFBhcmVudCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSB0cnVlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gZXZlbnQudGltZVN0YW1wO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEJhc2VkIG9uIGEgdG91Y2htb3ZlIGV2ZW50IG9iamVjdCwgY2hlY2sgd2hldGhlciB0aGUgdG91Y2ggaGFzIG1vdmVkIHBhc3QgYSBib3VuZGFyeSBzaW5jZSBpdCBzdGFydGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudG91Y2hIYXNNb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0sIGJvdW5kYXJ5ID0gdGhpcy50b3VjaEJvdW5kYXJ5O1xuXG5cdFx0aWYgKE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdGhpcy50b3VjaFN0YXJ0WCkgPiBib3VuZGFyeSB8fCBNYXRoLmFicyh0b3VjaC5wYWdlWSAtIHRoaXMudG91Y2hTdGFydFkpID4gYm91bmRhcnkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGxhc3QgcG9zaXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB0b3VjaCBoYXMgbW92ZWQsIGNhbmNlbCB0aGUgY2xpY2sgdHJhY2tpbmdcblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50ICE9PSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KSB8fCB0aGlzLnRvdWNoSGFzTW92ZWQoZXZlbnQpKSB7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQXR0ZW1wdCB0byBmaW5kIHRoZSBsYWJlbGxlZCBjb250cm9sIGZvciB0aGUgZ2l2ZW4gbGFiZWwgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxIVE1MTGFiZWxFbGVtZW50fSBsYWJlbEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8bnVsbH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZmluZENvbnRyb2wgPSBmdW5jdGlvbihsYWJlbEVsZW1lbnQpIHtcblxuXHRcdC8vIEZhc3QgcGF0aCBmb3IgbmV3ZXIgYnJvd3NlcnMgc3VwcG9ydGluZyB0aGUgSFRNTDUgY29udHJvbCBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50LmNvbnRyb2wgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5jb250cm9sO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBicm93c2VycyB1bmRlciB0ZXN0IHRoYXQgc3VwcG9ydCB0b3VjaCBldmVudHMgYWxzbyBzdXBwb3J0IHRoZSBIVE1MNSBodG1sRm9yIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuaHRtbEZvcikge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxhYmVsRWxlbWVudC5odG1sRm9yKTtcblx0XHR9XG5cblx0XHQvLyBJZiBubyBmb3IgYXR0cmlidXRlIGV4aXN0cywgYXR0ZW1wdCB0byByZXRyaWV2ZSB0aGUgZmlyc3QgbGFiZWxsYWJsZSBkZXNjZW5kYW50IGVsZW1lbnRcblx0XHQvLyB0aGUgbGlzdCBvZiB3aGljaCBpcyBkZWZpbmVkIGhlcmU6IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjY2F0ZWdvcnktbGFiZWxcblx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbiwgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLCBrZXlnZW4sIG1ldGVyLCBvdXRwdXQsIHByb2dyZXNzLCBzZWxlY3QsIHRleHRhcmVhJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggZW5kLCBkZXRlcm1pbmUgd2hldGhlciB0byBzZW5kIGEgY2xpY2sgZXZlbnQgYXQgb25jZS5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hFbmQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBmb3JFbGVtZW50LCB0cmFja2luZ0NsaWNrU3RhcnQsIHRhcmdldFRhZ05hbWUsIHNjcm9sbFBhcmVudCwgdG91Y2gsIHRhcmdldEVsZW1lbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0KSA+IHRoaXMudGFwVGltZW91dCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgdG8gcHJldmVudCB3cm9uZyBjbGljayBjYW5jZWwgb24gaW5wdXQgKGlzc3VlICMxNTYpLlxuXHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gZmFsc2U7XG5cblx0XHR0aGlzLmxhc3RDbGlja1RpbWUgPSBldmVudC50aW1lU3RhbXA7XG5cblx0XHR0cmFja2luZ0NsaWNrU3RhcnQgPSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydDtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblx0XHQvLyBPbiBzb21lIGlPUyBkZXZpY2VzLCB0aGUgdGFyZ2V0RWxlbWVudCBzdXBwbGllZCB3aXRoIHRoZSBldmVudCBpcyBpbnZhbGlkIGlmIHRoZSBsYXllclxuXHRcdC8vIGlzIHBlcmZvcm1pbmcgYSB0cmFuc2l0aW9uIG9yIHNjcm9sbCwgYW5kIGhhcyB0byBiZSByZS1kZXRlY3RlZCBtYW51YWxseS4gTm90ZSB0aGF0XG5cdFx0Ly8gZm9yIHRoaXMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCBpdCBtdXN0IGJlIGNhbGxlZCAqYWZ0ZXIqIHRoZSBldmVudCB0YXJnZXQgaXMgY2hlY2tlZCFcblx0XHQvLyBTZWUgaXNzdWUgIzU3OyBhbHNvIGZpbGVkIGFzIHJkYXI6Ly8xMzA0ODU4OSAuXG5cdFx0aWYgKGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCkge1xuXHRcdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0Ly8gSW4gY2VydGFpbiBjYXNlcyBhcmd1bWVudHMgb2YgZWxlbWVudEZyb21Qb2ludCBjYW4gYmUgbmVnYXRpdmUsIHNvIHByZXZlbnQgc2V0dGluZyB0YXJnZXRFbGVtZW50IHRvIG51bGxcblx0XHRcdHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCB0b3VjaC5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCkgfHwgdGFyZ2V0RWxlbWVudDtcblx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHR9XG5cblx0XHR0YXJnZXRUYWdOYW1lID0gdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRhcmdldFRhZ05hbWUgPT09ICdsYWJlbCcpIHtcblx0XHRcdGZvckVsZW1lbnQgPSB0aGlzLmZpbmRDb250cm9sKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0aWYgKGZvckVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldEVsZW1lbnQgPSBmb3JFbGVtZW50O1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5uZWVkc0ZvY3VzKHRhcmdldEVsZW1lbnQpKSB7XG5cblx0XHRcdC8vIENhc2UgMTogSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgYSB3aGlsZSBhZ28gKGJlc3QgZ3Vlc3MgaXMgMTAwbXMgYmFzZWQgb24gdGVzdHMgZm9yIGlzc3VlICMzNikgdGhlbiBmb2N1cyB3aWxsIGJlIHRyaWdnZXJlZCBhbnl3YXkuIFJldHVybiBlYXJseSBhbmQgdW5zZXQgdGhlIHRhcmdldCBlbGVtZW50IHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IGNsaWNrIHdpbGwgYmUgYWxsb3dlZCB0aHJvdWdoLlxuXHRcdFx0Ly8gQ2FzZSAyOiBXaXRob3V0IHRoaXMgZXhjZXB0aW9uIGZvciBpbnB1dCBlbGVtZW50cyB0YXBwZWQgd2hlbiB0aGUgZG9jdW1lbnQgaXMgY29udGFpbmVkIGluIGFuIGlmcmFtZSwgdGhlbiBhbnkgaW5wdXR0ZWQgdGV4dCB3b24ndCBiZSB2aXNpYmxlIGV2ZW4gdGhvdWdoIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaXMgdXBkYXRlZCBhcyB0aGUgdXNlciB0eXBlcyAoaXNzdWUgIzM3KS5cblx0XHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdHJhY2tpbmdDbGlja1N0YXJ0KSA+IDEwMCB8fCAoZGV2aWNlSXNJT1MgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHRhcmdldFRhZ05hbWUgPT09ICdpbnB1dCcpKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblxuXHRcdFx0Ly8gU2VsZWN0IGVsZW1lbnRzIG5lZWQgdGhlIGV2ZW50IHRvIGdvIHRocm91Z2ggb24gaU9TIDQsIG90aGVyd2lzZSB0aGUgc2VsZWN0b3IgbWVudSB3b24ndCBvcGVuLlxuXHRcdFx0Ly8gQWxzbyB0aGlzIGJyZWFrcyBvcGVuaW5nIHNlbGVjdHMgd2hlbiBWb2ljZU92ZXIgaXMgYWN0aXZlIG9uIGlPUzYsIGlPUzcgKGFuZCBwb3NzaWJseSBvdGhlcnMpXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TIHx8IHRhcmdldFRhZ05hbWUgIT09ICdzZWxlY3QnKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIGV2ZW50IGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgcGFyZW50IGxheWVyIHRoYXQgd2FzIHNjcm9sbGVkXG5cdFx0XHQvLyBhbmQgdGhpcyB0YXAgaXMgYmVpbmcgdXNlZCB0byBzdG9wIHRoZSBzY3JvbGxpbmcgKHVzdWFsbHkgaW5pdGlhdGVkIGJ5IGEgZmxpbmcgLSBpc3N1ZSAjNDIpLlxuXHRcdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0XHRpZiAoc2Nyb2xsUGFyZW50ICYmIHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wICE9PSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgdGhlIGFjdHVhbCBjbGljayBmcm9tIGdvaW5nIHRob3VnaCAtIHVubGVzcyB0aGUgdGFyZ2V0IG5vZGUgaXMgbWFya2VkIGFzIHJlcXVpcmluZ1xuXHRcdC8vIHJlYWwgY2xpY2tzIG9yIGlmIGl0IGlzIGluIHRoZSB3aGl0ZWxpc3QgaW4gd2hpY2ggY2FzZSBvbmx5IG5vbi1wcm9ncmFtbWF0aWMgY2xpY2tzIGFyZSBwZXJtaXR0ZWQuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGNhbmNlbCwgc3RvcCB0cmFja2luZyB0aGUgY2xpY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgbW91c2UgZXZlbnRzIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbk1vdXNlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuXHRcdC8vIElmIGEgdGFyZ2V0IGVsZW1lbnQgd2FzIG5ldmVyIHNldCAoYmVjYXVzZSBhIHRvdWNoIGV2ZW50IHdhcyBuZXZlciBmaXJlZCkgYWxsb3cgdGhlIGV2ZW50XG5cdFx0aWYgKCF0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChldmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcm9ncmFtbWF0aWNhbGx5IGdlbmVyYXRlZCBldmVudHMgdGFyZ2V0aW5nIGEgc3BlY2lmaWMgZWxlbWVudCBzaG91bGQgYmUgcGVybWl0dGVkXG5cdFx0aWYgKCFldmVudC5jYW5jZWxhYmxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBEZXJpdmUgYW5kIGNoZWNrIHRoZSB0YXJnZXQgZWxlbWVudCB0byBzZWUgd2hldGhlciB0aGUgbW91c2UgZXZlbnQgbmVlZHMgdG8gYmUgcGVybWl0dGVkO1xuXHRcdC8vIHVubGVzcyBleHBsaWNpdGx5IGVuYWJsZWQsIHByZXZlbnQgbm9uLXRvdWNoIGNsaWNrIGV2ZW50cyBmcm9tIHRyaWdnZXJpbmcgYWN0aW9ucyxcblx0XHQvLyB0byBwcmV2ZW50IGdob3N0L2RvdWJsZWNsaWNrcy5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0aGlzLnRhcmdldEVsZW1lbnQpIHx8IHRoaXMuY2FuY2VsTmV4dENsaWNrKSB7XG5cblx0XHRcdC8vIFByZXZlbnQgYW55IHVzZXItYWRkZWQgbGlzdGVuZXJzIGRlY2xhcmVkIG9uIEZhc3RDbGljayBlbGVtZW50IGZyb20gYmVpbmcgZmlyZWQuXG5cdFx0XHRpZiAoZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJ0IG9mIHRoZSBoYWNrIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHRcdFx0ZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FuY2VsIHRoZSBldmVudFxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG1vdXNlIGV2ZW50IGlzIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiBhY3R1YWwgY2xpY2tzLCBkZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIGEgdG91Y2gtZ2VuZXJhdGVkIGNsaWNrLCBhIGNsaWNrIGFjdGlvbiBvY2N1cnJpbmdcblx0ICogbmF0dXJhbGx5IGFmdGVyIGEgZGVsYXkgYWZ0ZXIgYSB0b3VjaCAod2hpY2ggbmVlZHMgdG8gYmUgY2FuY2VsbGVkIHRvIGF2b2lkIGR1cGxpY2F0aW9uKSwgb3Jcblx0ICogYW4gYWN0dWFsIGNsaWNrIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcGVybWl0dGVkO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSBmb3IgYW5vdGhlciBGYXN0Q2xpY2stbGlrZSBsaWJyYXJ5IGRlbGl2ZXJlZCB3aXRoIHRoaXJkLXBhcnR5IGNvZGUgdG8gZmlyZSBhIGNsaWNrIGV2ZW50IGJlZm9yZSBGYXN0Q2xpY2sgZG9lcyAoaXNzdWUgIzQ0KS4gSW4gdGhhdCBjYXNlLCBzZXQgdGhlIGNsaWNrLXRyYWNraW5nIGZsYWcgYmFjayB0byBmYWxzZSBhbmQgcmV0dXJuIGVhcmx5LiBUaGlzIHdpbGwgY2F1c2Ugb25Ub3VjaEVuZCB0byByZXR1cm4gZWFybHkuXG5cdFx0aWYgKHRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyeSBvZGQgYmVoYXZpb3VyIG9uIGlPUyAoaXNzdWUgIzE4KTogaWYgYSBzdWJtaXQgZWxlbWVudCBpcyBwcmVzZW50IGluc2lkZSBhIGZvcm0gYW5kIHRoZSB1c2VyIGhpdHMgZW50ZXIgaW4gdGhlIGlPUyBzaW11bGF0b3Igb3IgY2xpY2tzIHRoZSBHbyBidXR0b24gb24gdGhlIHBvcC11cCBPUyBrZXlib2FyZCB0aGUgYSBraW5kIG9mICdmYWtlJyBjbGljayBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCB3aXRoIHRoZSBzdWJtaXQtdHlwZSBpbnB1dCBlbGVtZW50IGFzIHRoZSB0YXJnZXQuXG5cdFx0aWYgKGV2ZW50LnRhcmdldC50eXBlID09PSAnc3VibWl0JyAmJiBldmVudC5kZXRhaWwgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHBlcm1pdHRlZCA9IHRoaXMub25Nb3VzZShldmVudCk7XG5cblx0XHQvLyBPbmx5IHVuc2V0IHRhcmdldEVsZW1lbnQgaWYgdGhlIGNsaWNrIGlzIG5vdCBwZXJtaXR0ZWQuIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCB0aGUgY2hlY2sgZm9yICF0YXJnZXRFbGVtZW50IGluIG9uTW91c2UgZmFpbHMgYW5kIHRoZSBicm93c2VyJ3MgY2xpY2sgZG9lc24ndCBnbyB0aHJvdWdoLlxuXHRcdGlmICghcGVybWl0dGVkKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIElmIGNsaWNrcyBhcmUgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiBwZXJtaXR0ZWQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogUmVtb3ZlIGFsbCBGYXN0Q2xpY2sncyBldmVudCBsaXN0ZW5lcnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcjtcblxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciBGYXN0Q2xpY2sgaXMgbmVlZGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICovXG5cdEZhc3RDbGljay5ub3ROZWVkZWQgPSBmdW5jdGlvbihsYXllcikge1xuXHRcdHZhciBtZXRhVmlld3BvcnQ7XG5cdFx0dmFyIGNocm9tZVZlcnNpb247XG5cdFx0dmFyIGJsYWNrYmVycnlWZXJzaW9uO1xuXHRcdHZhciBmaXJlZm94VmVyc2lvbjtcblxuXHRcdC8vIERldmljZXMgdGhhdCBkb24ndCBzdXBwb3J0IHRvdWNoIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hyb21lIHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGNocm9tZVZlcnNpb24gPSArKC9DaHJvbWVcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChjaHJvbWVWZXJzaW9uKSB7XG5cblx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyBDaHJvbWUgb24gQW5kcm9pZCB3aXRoIHVzZXItc2NhbGFibGU9XCJub1wiIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICM4OSlcblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENocm9tZSAzMiBhbmQgYWJvdmUgd2l0aCB3aWR0aD1kZXZpY2Utd2lkdGggb3IgbGVzcyBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdFx0XHRcdGlmIChjaHJvbWVWZXJzaW9uID4gMzEgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hyb21lIGRlc2t0b3AgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzE1KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzQmxhY2tCZXJyeTEwKSB7XG5cdFx0XHRibGFja2JlcnJ5VmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oWzAtOV0qKVxcLihbMC05XSopLyk7XG5cblx0XHRcdC8vIEJsYWNrQmVycnkgMTAuMysgZG9lcyBub3QgcmVxdWlyZSBGYXN0Y2xpY2sgbGlicmFyeS5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mdGxhYnMvZmFzdGNsaWNrL2lzc3Vlcy8yNTFcblx0XHRcdGlmIChibGFja2JlcnJ5VmVyc2lvblsxXSA+PSAxMCAmJiBibGFja2JlcnJ5VmVyc2lvblsyXSA+PSAzKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gdXNlci1zY2FsYWJsZT1ubyBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gd2lkdGg9ZGV2aWNlLXdpZHRoIChvciBsZXNzIHRoYW4gZGV2aWNlLXdpZHRoKSBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTAgd2l0aCAtbXMtdG91Y2gtYWN0aW9uOiBub25lIG9yIG1hbmlwdWxhdGlvbiwgd2hpY2ggZGlzYWJsZXMgZG91YmxlLXRhcC10by16b29tIChpc3N1ZSAjOTcpXG5cdFx0aWYgKGxheWVyLnN0eWxlLm1zVG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEZpcmVmb3ggdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0ZmlyZWZveFZlcnNpb24gPSArKC9GaXJlZm94XFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoZmlyZWZveFZlcnNpb24gPj0gMjcpIHtcblx0XHRcdC8vIEZpcmVmb3ggMjcrIGRvZXMgbm90IGhhdmUgdGFwIGRlbGF5IGlmIHRoZSBjb250ZW50IGlzIG5vdCB6b29tYWJsZSAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkyMjg5NlxuXG5cdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cdFx0XHRpZiAobWV0YVZpZXdwb3J0ICYmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMTogcHJlZml4ZWQgLW1zLXRvdWNoLWFjdGlvbiBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGFuZCBpdCdzIHJlY29tZW5kZWQgdG8gdXNlIG5vbi1wcmVmaXhlZCB2ZXJzaW9uXG5cdFx0Ly8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L3dpbmRvd3MvYXBwcy9IaDc2NzMxMy5hc3B4XG5cdFx0aWYgKGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGEgRmFzdENsaWNrIG9iamVjdFxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdEZhc3RDbGljay5hdHRhY2ggPSBmdW5jdGlvbihsYXllciwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEZhc3RDbGljaztcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRmFzdENsaWNrLmF0dGFjaDtcblx0XHRtb2R1bGUuZXhwb3J0cy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fVxufSgpKTtcbiIsInZhciBWTm9kZSA9IHJlcXVpcmUoJy4vdm5vZGUnKTtcbnZhciBpcyA9IHJlcXVpcmUoJy4vaXMnKTtcblxuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICBkYXRhLm5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcblxuICBpZiAoc2VsICE9PSAnZm9yZWlnbk9iamVjdCcgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFkZE5TKGNoaWxkcmVuW2ldLmRhdGEsIGNoaWxkcmVuW2ldLmNoaWxkcmVuLCBjaGlsZHJlbltpXS5zZWwpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gIHZhciBkYXRhID0ge30sIGNoaWxkcmVuLCB0ZXh0LCBpO1xuICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZGF0YSA9IGI7XG4gICAgaWYgKGlzLmFycmF5KGMpKSB7IGNoaWxkcmVuID0gYzsgfVxuICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkgeyB0ZXh0ID0gYzsgfVxuICB9IGVsc2UgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChpcy5hcnJheShiKSkgeyBjaGlsZHJlbiA9IGI7IH1cbiAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYikpIHsgdGV4dCA9IGI7IH1cbiAgICBlbHNlIHsgZGF0YSA9IGI7IH1cbiAgfVxuICBpZiAoaXMuYXJyYXkoY2hpbGRyZW4pKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSkgY2hpbGRyZW5baV0gPSBWTm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSk7XG4gICAgfVxuICB9XG4gIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJykge1xuICAgIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpO1xuICB9XG4gIHJldHVybiBWTm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCB1bmRlZmluZWQpO1xufTtcbiIsImZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSl7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKXtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KXtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuXG5cbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKXtcbiAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSk7XG59XG5cblxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpe1xuICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpe1xuICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50Tm9kZShub2RlKXtcbiAgcmV0dXJuIG5vZGUucGFyZW50RWxlbWVudDtcbn1cblxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSl7XG4gIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuXG5mdW5jdGlvbiB0YWdOYW1lKG5vZGUpe1xuICByZXR1cm4gbm9kZS50YWdOYW1lO1xufVxuXG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KXtcbiAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgY3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxuICBhcHBlbmRDaGlsZDogYXBwZW5kQ2hpbGQsXG4gIHJlbW92ZUNoaWxkOiByZW1vdmVDaGlsZCxcbiAgaW5zZXJ0QmVmb3JlOiBpbnNlcnRCZWZvcmUsXG4gIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gIG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcbiAgdGFnTmFtZTogdGFnTmFtZSxcbiAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFycmF5OiBBcnJheS5pc0FycmF5LFxuICBwcmltaXRpdmU6IGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgcyA9PT0gJ251bWJlcic7IH0sXG59O1xuIiwidmFyIE5hbWVzcGFjZVVSSXMgPSB7XG4gIFwieGxpbmtcIjogXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCJcbn07XG5cbnZhciBib29sZWFuQXR0cnMgPSBbXCJhbGxvd2Z1bGxzY3JlZW5cIiwgXCJhc3luY1wiLCBcImF1dG9mb2N1c1wiLCBcImF1dG9wbGF5XCIsIFwiY2hlY2tlZFwiLCBcImNvbXBhY3RcIiwgXCJjb250cm9sc1wiLCBcImRlY2xhcmVcIixcbiAgICAgICAgICAgICAgICBcImRlZmF1bHRcIiwgXCJkZWZhdWx0Y2hlY2tlZFwiLCBcImRlZmF1bHRtdXRlZFwiLCBcImRlZmF1bHRzZWxlY3RlZFwiLCBcImRlZmVyXCIsIFwiZGlzYWJsZWRcIiwgXCJkcmFnZ2FibGVcIixcbiAgICAgICAgICAgICAgICBcImVuYWJsZWRcIiwgXCJmb3Jtbm92YWxpZGF0ZVwiLCBcImhpZGRlblwiLCBcImluZGV0ZXJtaW5hdGVcIiwgXCJpbmVydFwiLCBcImlzbWFwXCIsIFwiaXRlbXNjb3BlXCIsIFwibG9vcFwiLCBcIm11bHRpcGxlXCIsXG4gICAgICAgICAgICAgICAgXCJtdXRlZFwiLCBcIm5vaHJlZlwiLCBcIm5vcmVzaXplXCIsIFwibm9zaGFkZVwiLCBcIm5vdmFsaWRhdGVcIiwgXCJub3dyYXBcIiwgXCJvcGVuXCIsIFwicGF1c2VvbmV4aXRcIiwgXCJyZWFkb25seVwiLFxuICAgICAgICAgICAgICAgIFwicmVxdWlyZWRcIiwgXCJyZXZlcnNlZFwiLCBcInNjb3BlZFwiLCBcInNlYW1sZXNzXCIsIFwic2VsZWN0ZWRcIiwgXCJzb3J0YWJsZVwiLCBcInNwZWxsY2hlY2tcIiwgXCJ0cmFuc2xhdGVcIixcbiAgICAgICAgICAgICAgICBcInRydWVzcGVlZFwiLCBcInR5cGVtdXN0bWF0Y2hcIiwgXCJ2aXNpYmxlXCJdO1xuXG52YXIgYm9vbGVhbkF0dHJzRGljdCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5mb3IodmFyIGk9MCwgbGVuID0gYm9vbGVhbkF0dHJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gIGJvb2xlYW5BdHRyc0RpY3RbYm9vbGVhbkF0dHJzW2ldXSA9IHRydWU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUF0dHJzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLFxuICAgICAgb2xkQXR0cnMgPSBvbGRWbm9kZS5kYXRhLmF0dHJzLCBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnMsIG5hbWVzcGFjZVNwbGl0O1xuXG4gIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKSByZXR1cm47XG4gIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gIGF0dHJzID0gYXR0cnMgfHwge307XG5cbiAgLy8gdXBkYXRlIG1vZGlmaWVkIGF0dHJpYnV0ZXMsIGFkZCBuZXcgYXR0cmlidXRlc1xuICBmb3IgKGtleSBpbiBhdHRycykge1xuICAgIGN1ciA9IGF0dHJzW2tleV07XG4gICAgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgIGlmKCFjdXIgJiYgYm9vbGVhbkF0dHJzRGljdFtrZXldKVxuICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICBlbHNlIHtcbiAgICAgICAgbmFtZXNwYWNlU3BsaXQgPSBrZXkuc3BsaXQoXCI6XCIpO1xuICAgICAgICBpZihuYW1lc3BhY2VTcGxpdC5sZW5ndGggPiAxICYmIE5hbWVzcGFjZVVSSXMuaGFzT3duUHJvcGVydHkobmFtZXNwYWNlU3BsaXRbMF0pKVxuICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyhOYW1lc3BhY2VVUklzW25hbWVzcGFjZVNwbGl0WzBdXSwga2V5LCBjdXIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXG4gIC8vIHRoZSBvdGhlciBvcHRpb24gaXMgdG8gcmVtb3ZlIGFsbCBhdHRyaWJ1dGVzIHdpdGggdmFsdWUgPT0gdW5kZWZpbmVkXG4gIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgaWYgKCEoa2V5IGluIGF0dHJzKSkge1xuICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtjcmVhdGU6IHVwZGF0ZUF0dHJzLCB1cGRhdGU6IHVwZGF0ZUF0dHJzfTtcbiIsImZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sXG4gICAgICBvbGRDbGFzcyA9IG9sZFZub2RlLmRhdGEuY2xhc3MsXG4gICAgICBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG5cbiAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpIHJldHVybjtcbiAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAga2xhc3MgPSBrbGFzcyB8fCB7fTtcblxuICBmb3IgKG5hbWUgaW4gb2xkQ2xhc3MpIHtcbiAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICB9XG4gIH1cbiAgZm9yIChuYW1lIGluIGtsYXNzKSB7XG4gICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgaWYgKGN1ciAhPT0gb2xkQ2xhc3NbbmFtZV0pIHtcbiAgICAgIGVsbS5jbGFzc0xpc3RbY3VyID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3N9O1xuIiwiZnVuY3Rpb24gaW52b2tlSGFuZGxlcihoYW5kbGVyLCB2bm9kZSwgZXZlbnQpIHtcbiAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAvLyBjYWxsIGZ1bmN0aW9uIGhhbmRsZXJcbiAgICBoYW5kbGVyLmNhbGwodm5vZGUsIGV2ZW50LCB2bm9kZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGhhbmRsZXIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAvLyBjYWxsIGhhbmRsZXIgd2l0aCBhcmd1bWVudHNcbiAgICBpZiAodHlwZW9mIGhhbmRsZXJbMF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBzaW5nbGUgYXJndW1lbnQgZm9yIHBlcmZvcm1hbmNlXG4gICAgICBpZiAoaGFuZGxlci5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgaGFuZGxlclswXS5jYWxsKHZub2RlLCBoYW5kbGVyWzFdLCBldmVudCwgdm5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBoYW5kbGVyLnNsaWNlKDEpO1xuICAgICAgICBhcmdzLnB1c2goZXZlbnQpO1xuICAgICAgICBhcmdzLnB1c2godm5vZGUpO1xuICAgICAgICBoYW5kbGVyWzBdLmFwcGx5KHZub2RlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2FsbCBtdWx0aXBsZSBoYW5kbGVyc1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGludm9rZUhhbmRsZXIoaGFuZGxlcltpXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUV2ZW50KGV2ZW50LCB2bm9kZSkge1xuICB2YXIgbmFtZSA9IGV2ZW50LnR5cGUsXG4gICAgICBvbiA9IHZub2RlLmRhdGEub247XG5cbiAgLy8gY2FsbCBldmVudCBoYW5kbGVyKHMpIGlmIGV4aXN0c1xuICBpZiAob24gJiYgb25bbmFtZV0pIHtcbiAgICBpbnZva2VIYW5kbGVyKG9uW25hbWVdLCB2bm9kZSwgZXZlbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpc3RlbmVyKCkge1xuICByZXR1cm4gZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgIGhhbmRsZUV2ZW50KGV2ZW50LCBoYW5kbGVyLnZub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVFdmVudExpc3RlbmVycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgdmFyIG9sZE9uID0gb2xkVm5vZGUuZGF0YS5vbixcbiAgICAgIG9sZExpc3RlbmVyID0gb2xkVm5vZGUubGlzdGVuZXIsXG4gICAgICBvbGRFbG0gPSBvbGRWbm9kZS5lbG0sXG4gICAgICBvbiA9IHZub2RlICYmIHZub2RlLmRhdGEub24sXG4gICAgICBlbG0gPSB2bm9kZSAmJiB2bm9kZS5lbG0sXG4gICAgICBuYW1lO1xuXG4gIC8vIG9wdGltaXphdGlvbiBmb3IgcmV1c2VkIGltbXV0YWJsZSBoYW5kbGVyc1xuICBpZiAob2xkT24gPT09IG9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gcmVtb3ZlIGV4aXN0aW5nIGxpc3RlbmVycyB3aGljaCBubyBsb25nZXIgdXNlZFxuICBpZiAob2xkT24gJiYgb2xkTGlzdGVuZXIpIHtcbiAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgZGVsZXRlZCB3ZSByZW1vdmUgYWxsIGV4aXN0aW5nIGxpc3RlbmVycyB1bmNvbmRpdGlvbmFsbHlcbiAgICBpZiAoIW9uKSB7XG4gICAgICBmb3IgKG5hbWUgaW4gb2xkT24pIHtcbiAgICAgICAgLy8gcmVtb3ZlIGxpc3RlbmVyIGlmIGVsZW1lbnQgd2FzIGNoYW5nZWQgb3IgZXhpc3RpbmcgbGlzdGVuZXJzIHJlbW92ZWRcbiAgICAgICAgb2xkRWxtLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgb2xkTGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChuYW1lIGluIG9sZE9uKSB7XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBpZiBleGlzdGluZyBsaXN0ZW5lciByZW1vdmVkXG4gICAgICAgIGlmICghb25bbmFtZV0pIHtcbiAgICAgICAgICBvbGRFbG0ucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBvbGRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIG5ldyBsaXN0ZW5lcnMgd2hpY2ggaGFzIG5vdCBhbHJlYWR5IGF0dGFjaGVkXG4gIGlmIChvbikge1xuICAgIC8vIHJldXNlIGV4aXN0aW5nIGxpc3RlbmVyIG9yIGNyZWF0ZSBuZXdcbiAgICB2YXIgbGlzdGVuZXIgPSB2bm9kZS5saXN0ZW5lciA9IG9sZFZub2RlLmxpc3RlbmVyIHx8IGNyZWF0ZUxpc3RlbmVyKCk7XG4gICAgLy8gdXBkYXRlIHZub2RlIGZvciBsaXN0ZW5lclxuICAgIGxpc3RlbmVyLnZub2RlID0gdm5vZGU7XG5cbiAgICAvLyBpZiBlbGVtZW50IGNoYW5nZWQgb3IgYWRkZWQgd2UgYWRkIGFsbCBuZWVkZWQgbGlzdGVuZXJzIHVuY29uZGl0aW9uYWxseVxuICAgIGlmICghb2xkT24pIHtcbiAgICAgIGZvciAobmFtZSBpbiBvbikge1xuICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgZWxlbWVudCB3YXMgY2hhbmdlZCBvciBuZXcgbGlzdGVuZXJzIGFkZGVkXG4gICAgICAgIGVsbS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobmFtZSBpbiBvbikge1xuICAgICAgICAvLyBhZGQgbGlzdGVuZXIgaWYgbmV3IGxpc3RlbmVyIGFkZGVkXG4gICAgICAgIGlmICghb2xkT25bbmFtZV0pIHtcbiAgICAgICAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IHVwZGF0ZUV2ZW50TGlzdGVuZXJzLFxuICB1cGRhdGU6IHVwZGF0ZUV2ZW50TGlzdGVuZXJzLFxuICBkZXN0cm95OiB1cGRhdGVFdmVudExpc3RlbmVyc1xufTtcbiIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLFxuICAgICAgb2xkUHJvcHMgPSBvbGRWbm9kZS5kYXRhLnByb3BzLCBwcm9wcyA9IHZub2RlLmRhdGEucHJvcHM7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiAhcHJvcHMpIHJldHVybjtcbiAgb2xkUHJvcHMgPSBvbGRQcm9wcyB8fCB7fTtcbiAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuICBmb3IgKGtleSBpbiBvbGRQcm9wcykge1xuICAgIGlmICghcHJvcHNba2V5XSkge1xuICAgICAgZGVsZXRlIGVsbVtrZXldO1xuICAgIH1cbiAgfVxuICBmb3IgKGtleSBpbiBwcm9wcykge1xuICAgIGN1ciA9IHByb3BzW2tleV07XG4gICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICBpZiAob2xkICE9PSBjdXIgJiYgKGtleSAhPT0gJ3ZhbHVlJyB8fCBlbG1ba2V5XSAhPT0gY3VyKSkge1xuICAgICAgZWxtW2tleV0gPSBjdXI7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xuIiwidmFyIHJhZiA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB8fCBzZXRUaW1lb3V0O1xudmFyIG5leHRGcmFtZSA9IGZ1bmN0aW9uKGZuKSB7IHJhZihmdW5jdGlvbigpIHsgcmFmKGZuKTsgfSk7IH07XG5cbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xuICBuZXh0RnJhbWUoZnVuY3Rpb24oKSB7IG9ialtwcm9wXSA9IHZhbDsgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSkge1xuICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sXG4gICAgICBvbGRTdHlsZSA9IG9sZFZub2RlLmRhdGEuc3R5bGUsXG4gICAgICBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG5cbiAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpIHJldHVybjtcbiAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcbiAgdmFyIG9sZEhhc0RlbCA9ICdkZWxheWVkJyBpbiBvbGRTdHlsZTtcblxuICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICBlbG0uc3R5bGVbbmFtZV0gPSAnJztcbiAgICB9XG4gIH1cbiAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgY3VyID0gc3R5bGVbbmFtZV07XG4gICAgaWYgKG5hbWUgPT09ICdkZWxheWVkJykge1xuICAgICAgZm9yIChuYW1lIGluIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgY3VyID0gc3R5bGUuZGVsYXllZFtuYW1lXTtcbiAgICAgICAgaWYgKCFvbGRIYXNEZWwgfHwgY3VyICE9PSBvbGRTdHlsZS5kZWxheWVkW25hbWVdKSB7XG4gICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZSwgY3VyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xuICAgICAgZWxtLnN0eWxlW25hbWVdID0gY3VyO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICB2YXIgc3R5bGUsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSkgcmV0dXJuO1xuICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xuICB2YXIgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gIGlmICghcyB8fCAhcy5yZW1vdmUpIHtcbiAgICBybSgpO1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpZHgsIGkgPSAwLCBtYXhEdXIgPSAwLFxuICAgICAgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgfVxuICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gIHZhciBwcm9wcyA9IGNvbXBTdHlsZVsndHJhbnNpdGlvbi1wcm9wZXJ0eSddLnNwbGl0KCcsICcpO1xuICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpIGFtb3VudCsrO1xuICB9XG4gIGVsbS5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZnVuY3Rpb24oZXYpIHtcbiAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pIC0tYW1vdW50O1xuICAgIGlmIChhbW91bnQgPT09IDApIHJtKCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtjcmVhdGU6IHVwZGF0ZVN0eWxlLCB1cGRhdGU6IHVwZGF0ZVN0eWxlLCBkZXN0cm95OiBhcHBseURlc3Ryb3lTdHlsZSwgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlfTtcbiIsIi8vIGpzaGludCBuZXdjYXA6IGZhbHNlXG4vKiBnbG9iYWwgcmVxdWlyZSwgbW9kdWxlLCBkb2N1bWVudCwgTm9kZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVk5vZGUgPSByZXF1aXJlKCcuL3Zub2RlJyk7XG52YXIgaXMgPSByZXF1aXJlKCcuL2lzJyk7XG52YXIgZG9tQXBpID0gcmVxdWlyZSgnLi9odG1sZG9tYXBpJyk7XG5cbmZ1bmN0aW9uIGlzVW5kZWYocykgeyByZXR1cm4gcyA9PT0gdW5kZWZpbmVkOyB9XG5mdW5jdGlvbiBpc0RlZihzKSB7IHJldHVybiBzICE9PSB1bmRlZmluZWQ7IH1cblxudmFyIGVtcHR5Tm9kZSA9IFZOb2RlKCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcblxuZnVuY3Rpb24gc2FtZVZub2RlKHZub2RlMSwgdm5vZGUyKSB7XG4gIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gIHZhciBpLCBtYXAgPSB7fSwga2V5O1xuICBmb3IgKGkgPSBiZWdpbklkeDsgaSA8PSBlbmRJZHg7ICsraSkge1xuICAgIGtleSA9IGNoaWxkcmVuW2ldLmtleTtcbiAgICBpZiAoaXNEZWYoa2V5KSkgbWFwW2tleV0gPSBpO1xuICB9XG4gIHJldHVybiBtYXA7XG59XG5cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xuXG5mdW5jdGlvbiBpbml0KG1vZHVsZXMsIGFwaSkge1xuICB2YXIgaSwgaiwgY2JzID0ge307XG5cbiAgaWYgKGlzVW5kZWYoYXBpKSkgYXBpID0gZG9tQXBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgIGNic1tob29rc1tpXV0gPSBbXTtcbiAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xuICAgICAgaWYgKG1vZHVsZXNbal1baG9va3NbaV1dICE9PSB1bmRlZmluZWQpIGNic1tob29rc1tpXV0ucHVzaChtb2R1bGVzW2pdW2hvb2tzW2ldXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZW1wdHlOb2RlQXQoZWxtKSB7XG4gICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgdmFyIGMgPSBlbG0uY2xhc3NOYW1lID8gJy4nICsgZWxtLmNsYXNzTmFtZS5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgIHJldHVybiBWTm9kZShhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUm1DYihjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tbGlzdGVuZXJzID09PSAwKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnQsIGNoaWxkRWxtKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICB2YXIgaSwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgaWYgKGlzRGVmKGRhdGEpKSB7XG4gICAgICBpZiAoaXNEZWYoaSA9IGRhdGEuaG9vaykgJiYgaXNEZWYoaSA9IGkuaW5pdCkpIHtcbiAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgZWxtLCBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLCBzZWwgPSB2bm9kZS5zZWw7XG4gICAgaWYgKGlzRGVmKHNlbCkpIHtcbiAgICAgIC8vIFBhcnNlIHNlbGVjdG9yXG4gICAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcbiAgICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICAgIHZhciB0YWcgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID8gc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDogc2VsO1xuICAgICAgZWxtID0gdm5vZGUuZWxtID0gaXNEZWYoZGF0YSkgJiYgaXNEZWYoaSA9IGRhdGEubnMpID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBhcGkuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgaWYgKGhhc2ggPCBkb3QpIGVsbS5pZCA9IHNlbC5zbGljZShoYXNoICsgMSwgZG90KTtcbiAgICAgIGlmIChkb3RJZHggPiAwKSBlbG0uY2xhc3NOYW1lID0gc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpO1xuICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBjcmVhdGVFbG0oY2hpbGRyZW5baV0sIGluc2VydGVkVm5vZGVRdWV1ZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzLnByaW1pdGl2ZSh2bm9kZS50ZXh0KSkge1xuICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgfVxuICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kpIGNicy5jcmVhdGVbaV0oZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICBpID0gdm5vZGUuZGF0YS5ob29rOyAvLyBSZXVzZSB2YXJpYWJsZVxuICAgICAgaWYgKGlzRGVmKGkpKSB7XG4gICAgICAgIGlmIChpLmNyZWF0ZSkgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgIGlmIChpLmluc2VydCkgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBlbG0gPSB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZS5lbG07XG4gIH1cblxuICBmdW5jdGlvbiBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbSh2bm9kZXNbc3RhcnRJZHhdLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgdmFyIGksIGosIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIGlmIChpc0RlZihkYXRhKSkge1xuICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKSBpKHZub2RlKTtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuZGVzdHJveS5sZW5ndGg7ICsraSkgY2JzLmRlc3Ryb3lbaV0odm5vZGUpO1xuICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5jaGlsZHJlbikpIHtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgaW52b2tlRGVzdHJveUhvb2sodm5vZGUuY2hpbGRyZW5bal0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgdmFyIGksIGxpc3RlbmVycywgcm0sIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICBpbnZva2VEZXN0cm95SG9vayhjaCk7XG4gICAgICAgICAgbGlzdGVuZXJzID0gY2JzLnJlbW92ZS5sZW5ndGggKyAxO1xuICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5yZW1vdmUubGVuZ3RoOyArK2kpIGNicy5yZW1vdmVbaV0oY2gsIHJtKTtcbiAgICAgICAgICBpZiAoaXNEZWYoaSA9IGNoLmRhdGEpICYmIGlzRGVmKGkgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBpLnJlbW92ZSkpIHtcbiAgICAgICAgICAgIGkoY2gsIHJtKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7IC8vIFRleHQgbm9kZVxuICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRFbG0sIGNoLmVsbSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVDaGlsZHJlbihwYXJlbnRFbG0sIG9sZENoLCBuZXdDaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgdmFyIG9sZFN0YXJ0SWR4ID0gMCwgbmV3U3RhcnRJZHggPSAwO1xuICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgIHZhciBvbGRTdGFydFZub2RlID0gb2xkQ2hbMF07XG4gICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICB2YXIgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWzBdO1xuICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgdmFyIG9sZEtleVRvSWR4LCBpZHhJbk9sZCwgZWxtVG9Nb3ZlLCBiZWZvcmU7XG5cbiAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgaWYgKGlzVW5kZWYob2xkU3RhcnRWbm9kZSkpIHtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBoYXMgYmVlbiBtb3ZlZCBsZWZ0XG4gICAgICB9IGVsc2UgaWYgKGlzVW5kZWYob2xkRW5kVm5vZGUpKSB7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgfSBlbHNlIGlmIChzYW1lVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgcGF0Y2hWbm9kZShvbGRFbmRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCByaWdodFxuICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgb2xkU3RhcnRWbm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhvbGRFbmRWbm9kZS5lbG0pKTtcbiAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkgeyAvLyBWbm9kZSBtb3ZlZCBsZWZ0XG4gICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgb2xkRW5kVm5vZGUgPSBvbGRDaFstLW9sZEVuZElkeF07XG4gICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1VuZGVmKG9sZEtleVRvSWR4KSkgb2xkS2V5VG9JZHggPSBjcmVhdGVLZXlUb09sZElkeChvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgICAgIGlkeEluT2xkID0gb2xkS2V5VG9JZHhbbmV3U3RhcnRWbm9kZS5rZXldO1xuICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHsgLy8gTmV3IGVsZW1lbnRcbiAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxtVG9Nb3ZlID0gb2xkQ2hbaWR4SW5PbGRdO1xuICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgZWxtVG9Nb3ZlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcbiAgICAgIGJlZm9yZSA9IGlzVW5kZWYobmV3Q2hbbmV3RW5kSWR4KzFdKSA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHgrMV0uZWxtO1xuICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICB9IGVsc2UgaWYgKG5ld1N0YXJ0SWR4ID4gbmV3RW5kSWR4KSB7XG4gICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgIHZhciBpLCBob29rO1xuICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XG4gICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgfVxuICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG0sIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW4sIGNoID0gdm5vZGUuY2hpbGRyZW47XG4gICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSkgcmV0dXJuO1xuICAgIGlmICghc2FtZVZub2RlKG9sZFZub2RlLCB2bm9kZSkpIHtcbiAgICAgIHZhciBwYXJlbnRFbG0gPSBhcGkucGFyZW50Tm9kZShvbGRWbm9kZS5lbG0pO1xuICAgICAgZWxtID0gY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbSwgb2xkVm5vZGUuZWxtKTtcbiAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXNEZWYodm5vZGUuZGF0YSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKSBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG4gICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgIGlmIChpc0RlZihvbGRDaCkgJiYgaXNEZWYoY2gpKSB7XG4gICAgICAgIGlmIChvbGRDaCAhPT0gY2gpIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihvbGRDaCkpIHtcbiAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgfSBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xuICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCB2bm9kZS50ZXh0KTtcbiAgICB9XG4gICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24ob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGksIGVsbSwgcGFyZW50O1xuICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSkgY2JzLnByZVtpXSgpO1xuXG4gICAgaWYgKGlzVW5kZWYob2xkVm5vZGUuc2VsKSkge1xuICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgfVxuXG4gICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxtID0gb2xkVm5vZGUuZWxtO1xuICAgICAgcGFyZW50ID0gYXBpLnBhcmVudE5vZGUoZWxtKTtcblxuICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuXG4gICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50LCB2bm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhlbG0pKTtcbiAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudCwgW29sZFZub2RlXSwgMCwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGluc2VydGVkVm5vZGVRdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldLmRhdGEuaG9vay5pbnNlcnQoaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKSBjYnMucG9zdFtpXSgpO1xuICAgIHJldHVybiB2bm9kZTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7aW5pdDogaW5pdH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSkge1xuICB2YXIga2V5ID0gZGF0YSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZGF0YS5rZXk7XG4gIHJldHVybiB7c2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgICB0ZXh0OiB0ZXh0LCBlbG06IGVsbSwga2V5OiBrZXl9O1xufTtcbiIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgbGV0IGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSxcclxuICAgICAgICBwcm9wcyA9IHZub2RlLmRhdGEubGl2ZVByb3BzIHx8IHt9O1xyXG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIG9sZCA9IGVsbVtrZXldO1xyXG4gICAgICAgIGlmIChvbGQgIT09IGN1cikgZWxtW2tleV0gPSBjdXI7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgbGl2ZVByb3BzUGx1Z2luID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xyXG5pbXBvcnQgc25hYmJkb20gZnJvbSBcInNuYWJiZG9tXCJcclxuaW1wb3J0IGggZnJvbSBcInNuYWJiZG9tL2hcIlxyXG5jb25zdCBwYXRjaCA9IHNuYWJiZG9tLmluaXQoW1xyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9jbGFzcycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9wcm9wcycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9zdHlsZScpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9ldmVudGxpc3RlbmVycycpLFxyXG4gICAgcmVxdWlyZSgnc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzJyksXHJcbiAgICBsaXZlUHJvcHNQbHVnaW5cclxuXSk7XHJcblxyXG5mdW5jdGlvbiB1dWlkKCl7cmV0dXJuKFwiXCIrMWU3Ky0xZTMrLTRlMystOGUzKy0xZTExKS5yZXBsYWNlKC9bMTBdL2csZnVuY3Rpb24oKXtyZXR1cm4oMHxNYXRoLnJhbmRvbSgpKjE2KS50b1N0cmluZygxNil9KX1cclxuaW1wb3J0IGJpZyBmcm9tICcuLi9ub2RlX21vZHVsZXMvYmlnLmpzJ1xyXG5iaWcuRV9QT1MgPSAxZSs2XHJcblxyXG5pbXBvcnQgdWduaXMgZnJvbSAnLi91Z25pcydcclxuaW1wb3J0IHNhdmVkQXBwIGZyb20gJy4uL3VnbmlzX2NvbXBvbmVudHMvYXBwLmpzb24nXHJcblxyXG5mdW5jdGlvbiBtb3ZlSW5BcnJheSAoYXJyYXksIG1vdmVJbmRleCwgdG9JbmRleCkge1xyXG4gICAgbGV0IGl0ZW0gPSBhcnJheVttb3ZlSW5kZXhdO1xyXG4gICAgbGV0IGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcclxuICAgIGxldCBkaWZmID0gbW92ZUluZGV4IC0gdG9JbmRleDtcclxuXHJcbiAgICBpZiAoZGlmZiA+IDApIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICAuLi5hcnJheS5zbGljZSgwLCB0b0luZGV4KSxcclxuICAgICAgICAgICAgaXRlbSxcclxuICAgICAgICAgICAgLi4uYXJyYXkuc2xpY2UodG9JbmRleCwgbW92ZUluZGV4KSxcclxuICAgICAgICAgICAgLi4uYXJyYXkuc2xpY2UobW92ZUluZGV4ICsgMSwgbGVuZ3RoKVxyXG4gICAgICAgIF07XHJcbiAgICB9IGVsc2UgaWYgKGRpZmYgPCAwKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgLi4uYXJyYXkuc2xpY2UoMCwgbW92ZUluZGV4KSxcclxuICAgICAgICAgICAgLi4uYXJyYXkuc2xpY2UobW92ZUluZGV4ICsgMSwgdG9JbmRleCArIDEpLFxyXG4gICAgICAgICAgICBpdGVtLFxyXG4gICAgICAgICAgICAuLi5hcnJheS5zbGljZSh0b0luZGV4ICsgMSwgbGVuZ3RoKVxyXG4gICAgICAgIF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYXJyYXk7XHJcbn1cclxuXHJcbmNvbnN0IGF0dGFjaEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpXHJcbmF0dGFjaEZhc3RDbGljayhkb2N1bWVudC5ib2R5KVxyXG5cclxuY29uc3QgdmVyc2lvbiA9ICcwLjAuMzZ2J1xyXG5lZGl0b3Ioc2F2ZWRBcHApXHJcblxyXG5mdW5jdGlvbiBlZGl0b3IoYXBwRGVmaW5pdGlvbil7XHJcblxyXG4gICAgY29uc3Qgc2F2ZWREZWZpbml0aW9uID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXBwX2tleV8nICsgdmVyc2lvbikpXHJcbiAgICBjb25zdCB0dXRvcmlhbFBhc3NlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0dXRvcmlhbF9wYXNzZWQnKVxyXG4gICAgY29uc3QgYXBwID0gdWduaXMoc2F2ZWREZWZpbml0aW9uIHx8IGFwcERlZmluaXRpb24pXHJcblxyXG4gICAgbGV0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKVxyXG5cclxuICAgIC8vIFN0YXRlXHJcbiAgICBsZXQgc3RhdGUgPSB7XHJcbiAgICAgICAgbGVmdE9wZW46IGZhbHNlLFxyXG4gICAgICAgIHJpZ2h0T3BlbjogdHJ1ZSxcclxuICAgICAgICBmdWxsU2NyZWVuOiAhdHV0b3JpYWxQYXNzZWQsXHJcbiAgICAgICAgZWRpdG9yUmlnaHRXaWR0aDogMzUwLFxyXG4gICAgICAgIGVkaXRvckxlZnRXaWR0aDogMzUwLFxyXG4gICAgICAgIHN1YkVkaXRvcldpZHRoOiAzNTAsXHJcbiAgICAgICAgY29tcG9uZW50RWRpdG9yUG9zaXRpb246IHt4OiB3aW5kb3cuaW5uZXJXaWR0aCAtIDcxMCwgeTogd2luZG93LmlubmVySGVpZ2h0IC8gMn0gLFxyXG4gICAgICAgIGFwcElzRnJvemVuOiBmYWxzZSxcclxuICAgICAgICBzZWxlY3RlZFZpZXdOb2RlOiB7fSxcclxuICAgICAgICBzZWxlY3RlZFBpcGVJZDogJycsXHJcbiAgICAgICAgc2VsZWN0ZWRTdGF0ZU5vZGVJZDogJycsXHJcbiAgICAgICAgc2VsZWN0ZWRWaWV3U3ViTWVudTogJ3Byb3BzJyxcclxuICAgICAgICBlZGl0aW5nVGl0bGVOb2RlSWQ6ICcnLFxyXG4gICAgICAgIHZpZXdGb2xkZXJzQ2xvc2VkOiB7fSxcclxuICAgICAgICBkcmFnZ2VkQ29tcG9uZW50VmlldzogbnVsbCxcclxuICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICBob3ZlcmVkUGlwZTogbnVsbCxcclxuICAgICAgICBob3ZlcmVkVmlld05vZGU6IG51bGwsXHJcbiAgICAgICAgaG92ZXJlZEV2ZW50OiBudWxsLFxyXG4gICAgICAgIG1vdXNlUG9zaXRpb246IHt9LFxyXG4gICAgICAgIGV2ZW50U3RhY2s6IFtdLFxyXG4gICAgICAgIGRlZmluaXRpb246IHNhdmVkRGVmaW5pdGlvbiB8fCBhcHAuZGVmaW5pdGlvbixcclxuICAgICAgICB0dXRvcmlhbFBhc3NlZDogdHV0b3JpYWxQYXNzZWQsXHJcbiAgICAgICAgdHV0b3JpYWxTdGVwOiAwXHJcbiAgICB9XHJcbiAgICAvLyB1bmRvL3JlZG9cclxuICAgIGxldCBzdGF0ZVN0YWNrID0gW3N0YXRlLmRlZmluaXRpb25dXHJcbiAgICBsZXQgY3VycmVudEFuaW1hdGlvbkZyYW1lUmVxdWVzdCA9IG51bGw7XHJcbiAgICBmdW5jdGlvbiBzZXRTdGF0ZShuZXdTdGF0ZSwgdGltZVRyYXZlbGluZyl7XHJcbiAgICAgICAgaWYobmV3U3RhdGUgPT09IHN0YXRlKXtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdzdGF0ZSB3YXMgbXV0YXRlZCwgc2VhcmNoIGZvciBhIGJ1ZycpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFzdGF0ZS50dXRvcmlhbFBhc3NlZCl7XHJcbiAgICAgICAgICAgIGlmKHN0YXRlLnR1dG9yaWFsU3RlcCA9PT0gMCAmJiBuZXdTdGF0ZS5mdWxsU2NyZWVuID09PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS50dXRvcmlhbFN0ZXAgPSAxXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYobmV3U3RhdGUuZnVsbFNjcmVlbiA9PT0gdHJ1ZSAmJiBzdGF0ZS50dXRvcmlhbFN0ZXAgPT09IDAgJiYgbmV3U3RhdGUudHV0b3JpYWxTdGVwID09PSAxKXtcclxuICAgICAgICAgICAgICAgIG5ld1N0YXRlLmZ1bGxTY3JlZW4gPSBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHN0YXRlLnR1dG9yaWFsU3RlcCA9PT0gMSAmJiBuZXdTdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkKXtcclxuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnR1dG9yaWFsU3RlcCA9IDJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihzdGF0ZS50dXRvcmlhbFN0ZXAgPT09IDEgJiYgbmV3U3RhdGUudHV0b3JpYWxTdGVwID09PSAyICYmICFuZXdTdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkKXtcclxuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnNlbGVjdGVkVmlld05vZGUgPSB7cmVmOiAndk5vZGVCb3gnLCBpZDogJ19yb290Tm9kZSd9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoc3RhdGUudHV0b3JpYWxTdGVwID09PSAyICYmIG5ld1N0YXRlLnR1dG9yaWFsU3RlcCA9PT0gMyl7XHJcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5sZWZ0T3BlbiA9IHRydWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihuZXdTdGF0ZS50dXRvcmlhbFBhc3NlZCl7XHJcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndHV0b3JpYWxfcGFzc2VkJywgJ3RydWUnKVxyXG4gICAgICAgICAgICAgICAgbmV3U3RhdGUubGVmdE9wZW4gPSBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb24gIT09IG5ld1N0YXRlLmRlZmluaXRpb24pe1xyXG4gICAgICAgICAgICAvLyB1bnNlbGVjdCBkZWxldGVkIGNvbXBvbmVudHMgYW5kIHN0YXRlXHJcbiAgICAgICAgICAgIGlmKG5ld1N0YXRlLmRlZmluaXRpb24uc3RhdGVbbmV3U3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZF0gPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZSA9IHsuLi5uZXdTdGF0ZSwgc2VsZWN0ZWRTdGF0ZU5vZGVJZDogJyd9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYobmV3U3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgIT09IHVuZGVmaW5lZCAmJiBuZXdTdGF0ZS5kZWZpbml0aW9uW25ld1N0YXRlLnNlbGVjdGVkVmlld05vZGUucmVmXVtuZXdTdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkXSA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgICAgIG5ld1N0YXRlID0gey4uLm5ld1N0YXRlLCBzZWxlY3RlZFZpZXdOb2RlOiB7fX1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyB1bmRvL3JlZG8gdGhlbiByZW5kZXIgdGhlbiBzYXZlXHJcbiAgICAgICAgICAgIGlmKCF0aW1lVHJhdmVsaW5nKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHN0YXRlU3RhY2suZmluZEluZGV4KChhKT0+YT09PXN0YXRlLmRlZmluaXRpb24pXHJcbiAgICAgICAgICAgICAgICBzdGF0ZVN0YWNrID0gc3RhdGVTdGFjay5zbGljZSgwLCBjdXJyZW50SW5kZXgrMSkuY29uY2F0KG5ld1N0YXRlLmRlZmluaXRpb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXBwLnJlbmRlcihuZXdTdGF0ZS5kZWZpbml0aW9uKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXBwX2tleV8nK3ZlcnNpb24sIEpTT04uc3RyaW5naWZ5KG5ld1N0YXRlLmRlZmluaXRpb24pKSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0YXRlLmFwcElzRnJvemVuICE9PSBuZXdTdGF0ZS5hcHBJc0Zyb3plbiB8fCBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlICE9PSBuZXdTdGF0ZS5zZWxlY3RlZFZpZXdOb2RlICl7XHJcbiAgICAgICAgICAgIGFwcC5fZnJlZXplKG5ld1N0YXRlLmFwcElzRnJvemVuLCBWSUVXX05PREVfU0VMRUNURUQsIG5ld1N0YXRlLnNlbGVjdGVkVmlld05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKG5ld1N0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCAmJiBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgIT09IG5ld1N0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCl7XHJcbiAgICAgICAgICAgIC8vIHF1ZSBhdXRvIGZvY3VzXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtaXN0aXRsZWVkaXRvcl0nKVswXVxyXG4gICAgICAgICAgICAgICAgaWYobm9kZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5mb2N1cygpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXRlID0gbmV3U3RhdGVcclxuICAgICAgICBpZighY3VycmVudEFuaW1hdGlvbkZyYW1lUmVxdWVzdCl7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpPT4ge1xyXG4gICAgICAgIC8vIGNsaWNrZWQgb3V0c2lkZVxyXG4gICAgICAgIGlmKHN0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCAmJiAhZS50YXJnZXQuZGF0YXNldC5pc3RpdGxlZWRpdG9yKXtcclxuICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBlZGl0aW5nVGl0bGVOb2RlSWQ6ICcnfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmVuZGVyKClcclxuICAgIH0sIGZhbHNlKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICByZW5kZXIoKVxyXG4gICAgfSwgZmFsc2UpXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpPT57XHJcbiAgICAgICAgLy8gODMgLSBzXHJcbiAgICAgICAgLy8gOTAgLSB6XHJcbiAgICAgICAgLy8gODkgLSB5XHJcbiAgICAgICAgLy8gMzIgLSBzcGFjZVxyXG4gICAgICAgIC8vIDEzIC0gZW50ZXJcclxuICAgICAgICAvLyAyNyAtIGVzY2FwZVxyXG4gICAgICAgIGlmKGUud2hpY2ggPT09IDgzICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gZ2FyYmFnZSBjb2xsZWN0XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZmV0Y2goJy9zYXZlJywge21ldGhvZDogJ1BPU1QnLCBib2R5OiBKU09OLnN0cmluZ2lmeShzdGF0ZS5kZWZpbml0aW9uKSwgaGVhZGVyczoge1wiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwifX0pXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZS53aGljaCA9PT0gMzIgJiYgKG5hdmlnYXRvci5wbGF0Zm9ybS5tYXRjaChcIk1hY1wiKSA/IGUubWV0YUtleSA6IGUuY3RybEtleSkpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIEZSRUVaRVJfQ0xJQ0tFRCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFlLnNoaWZ0S2V5ICYmIGUud2hpY2ggPT09IDkwICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gc3RhdGVTdGFjay5maW5kSW5kZXgoKGEpPT5hPT09c3RhdGUuZGVmaW5pdGlvbilcclxuICAgICAgICAgICAgaWYoY3VycmVudEluZGV4ID4gMCl7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdEZWZpbml0aW9uID0gc3RhdGVTdGFja1tjdXJyZW50SW5kZXgtMV1cclxuICAgICAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjogbmV3RGVmaW5pdGlvbn0sIHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoKGUud2hpY2ggPT09IDg5ICYmIChuYXZpZ2F0b3IucGxhdGZvcm0ubWF0Y2goXCJNYWNcIikgPyBlLm1ldGFLZXkgOiBlLmN0cmxLZXkpKSB8fCAoZS5zaGlmdEtleSAmJiBlLndoaWNoID09PSA5MCAmJiAobmF2aWdhdG9yLnBsYXRmb3JtLm1hdGNoKFwiTWFjXCIpID8gZS5tZXRhS2V5IDogZS5jdHJsS2V5KSkpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSBzdGF0ZVN0YWNrLmZpbmRJbmRleCgoYSk9PmE9PT1zdGF0ZS5kZWZpbml0aW9uKVxyXG4gICAgICAgICAgICBpZihjdXJyZW50SW5kZXggPCBzdGF0ZVN0YWNrLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0RlZmluaXRpb24gPSBzdGF0ZVN0YWNrW2N1cnJlbnRJbmRleCsxXVxyXG4gICAgICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiBuZXdEZWZpbml0aW9ufSwgdHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlLndoaWNoID09PSAxMykge1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGVkaXRpbmdUaXRsZU5vZGVJZDogJyd9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlLndoaWNoID09PSAyNykge1xyXG4gICAgICAgICAgICBGVUxMX1NDUkVFTl9DTElDS0VEKGZhbHNlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy8gTGlzdGVuIHRvIGFwcFxyXG4gICAgYXBwLmFkZExpc3RlbmVyKChldmVudElkLCBkYXRhLCBlLCBwcmV2aW91c1N0YXRlLCBjdXJyZW50U3RhdGUsIG11dGF0aW9ucyk9PntcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGV2ZW50U3RhY2s6IHN0YXRlLmV2ZW50U3RhY2suY29uY2F0KHtldmVudElkLCBkYXRhLCBlLCBwcmV2aW91c1N0YXRlLCBjdXJyZW50U3RhdGUsIG11dGF0aW9uc30pfSlcclxuICAgIH0pXHJcblxyXG4gICAgLy8gQWN0aW9uc1xyXG4gICAgbGV0IG9wZW5Cb3hUaW1lb3V0ID0gbnVsbFxyXG4gICAgZnVuY3Rpb24gVklFV19EUkFHR0VEKG5vZGVSZWYsIHBhcmVudFJlZiwgaW5pdGlhbERlcHRoLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgY29uc3QgaXNBcnJvdyA9IGUudGFyZ2V0LmRhdGFzZXQuY2xvc2VhcnJvd1xyXG4gICAgICAgIGNvbnN0IGlzVHJhc2hjYW4gPSBlLnRhcmdldC5kYXRhc2V0LnRyYXNoY2FuXHJcbiAgICAgICAgY29uc3QgaW5pdGlhbFggPSBlLnRvdWNoZXM/IGUudG91Y2hlc1swXS5wYWdlWDogZS5wYWdlWFxyXG4gICAgICAgIGNvbnN0IGluaXRpYWxZID0gZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVk6IGUucGFnZVlcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuZWxtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IGluaXRpYWxYIC0gcG9zaXRpb24ubGVmdFxyXG4gICAgICAgIGNvbnN0IG9mZnNldFkgPSBpbml0aWFsWSAtIHBvc2l0aW9uLnRvcFxyXG4gICAgICAgIGZ1bmN0aW9uIGRyYWcoZSl7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICBjb25zdCB4ID0gZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVhcclxuICAgICAgICAgICAgY29uc3QgeSA9IGUudG91Y2hlcz8gZS50b3VjaGVzWzBdLnBhZ2VZOiBlLnBhZ2VZXHJcbiAgICAgICAgICAgIGlmKCFzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldyl7XHJcbiAgICAgICAgICAgICAgICBpZihNYXRoLmFicyhpbml0aWFsWS15KSA+IDMpe1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZHJhZ2dlZENvbXBvbmVudFZpZXc6IHsuLi5ub2RlUmVmLCBkZXB0aDogaW5pdGlhbERlcHRofSwgbW91c2VQb3NpdGlvbjoge3g6IHggLSBvZmZzZXRYLCB5OiB5IC0gb2Zmc2V0WX19KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBtb3VzZVBvc2l0aW9uOiB7eDogeCAtIG9mZnNldFgsIHk6IHkgLSBvZmZzZXRZfX0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBkcmFnKVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkcmFnKVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3BEcmFnZ2luZyhldmVudCl7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGRyYWcpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkcmFnKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHN0b3BEcmFnZ2luZylcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgICAgICBpZihvcGVuQm94VGltZW91dCl7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQob3BlbkJveFRpbWVvdXQpXHJcbiAgICAgICAgICAgICAgICBvcGVuQm94VGltZW91dCA9IG51bGxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZighc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcpe1xyXG4gICAgICAgICAgICAgICAgaWYoZXZlbnQudGFyZ2V0ID09PSBlLnRhcmdldCAmJiBpc0Fycm93KXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVklFV19GT0xERVJfQ0xJQ0tFRChub2RlUmVmLmlkKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoZXZlbnQudGFyZ2V0ID09PSBlLnRhcmdldCAmJiBpc1RyYXNoY2FuKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gREVMRVRFX1NFTEVDVEVEX1ZJRVcobm9kZVJlZiwgcGFyZW50UmVmKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFZJRVdfTk9ERV9TRUxFQ1RFRChub2RlUmVmKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKCFzdGF0ZS5ob3ZlcmVkVmlld05vZGUpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgZHJhZ2dlZENvbXBvbmVudFZpZXc6IG51bGwsfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQYXJlbnRSZWYgPSBzdGF0ZS5ob3ZlcmVkVmlld05vZGUucGFyZW50XHJcbiAgICAgICAgICAgIC8vIGZyYW1lIHRoaXMgc29tZXdoZXJlIG9uIGhvdyBub3QgdG8gd3JpdGUgY29kZVxyXG4gICAgICAgICAgICBjb25zdCBmaXhlZFBhcmVudHMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIGRyYWdnZWRDb21wb25lbnRWaWV3OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJlZFZpZXdOb2RlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjogcGFyZW50UmVmLmlkID09PSBuZXdQYXJlbnRSZWYuaWQgPyB7IC8vIG1vdmluZyBpbiB0aGUgc2FtZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIFtwYXJlbnRSZWYucmVmXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGFyZW50UmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IG1vdmVJbkFycmF5KHN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXS5jaGlsZHJlbiwgc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLmNoaWxkcmVuLmZpbmRJbmRleCgocmVmKT0+IHJlZi5pZCA9PT0gbm9kZVJlZi5pZCksIHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wb3NpdGlvbilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gOiBwYXJlbnRSZWYucmVmID09PSBuZXdQYXJlbnRSZWYucmVmID8geyAvLyBtb3ZpbmcgaW4gdGhlIHNpbWlsYXIgcGFyZW50IChzYW1lIHR5cGUpXHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBbcGFyZW50UmVmLnJlZl06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW3BhcmVudFJlZi5pZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudFJlZi5pZF0uY2hpbGRyZW4uZmlsdGVyKChyZWYpPT4gcmVmLmlkICE9PSBub2RlUmVmLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbbmV3UGFyZW50UmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltuZXdQYXJlbnRSZWYucmVmXVtuZXdQYXJlbnRSZWYuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb25bbmV3UGFyZW50UmVmLnJlZl1bbmV3UGFyZW50UmVmLmlkXS5jaGlsZHJlbi5zbGljZSgwLCBzdGF0ZS5ob3ZlcmVkVmlld05vZGUucG9zaXRpb24pLmNvbmNhdChub2RlUmVmLCBzdGF0ZS5kZWZpbml0aW9uW25ld1BhcmVudFJlZi5yZWZdW25ld1BhcmVudFJlZi5pZF0uY2hpbGRyZW4uc2xpY2Uoc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9IDogeyAvLyBtb3ZpbmcgdG8gYSBuZXcgdHlwZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIFtwYXJlbnRSZWYucmVmXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGFyZW50UmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXS5jaGlsZHJlbi5maWx0ZXIoKHJlZik9PiByZWYuaWQgIT09IG5vZGVSZWYuaWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBbbmV3UGFyZW50UmVmLnJlZl06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltuZXdQYXJlbnRSZWYucmVmXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgW25ld1BhcmVudFJlZi5pZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bbmV3UGFyZW50UmVmLnJlZl1bbmV3UGFyZW50UmVmLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBzdGF0ZS5kZWZpbml0aW9uW25ld1BhcmVudFJlZi5yZWZdW25ld1BhcmVudFJlZi5pZF0uY2hpbGRyZW4uc2xpY2UoMCwgc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uKS5jb25jYXQobm9kZVJlZiwgc3RhdGUuZGVmaW5pdGlvbltuZXdQYXJlbnRSZWYucmVmXVtuZXdQYXJlbnRSZWYuaWRdLmNoaWxkcmVuLnNsaWNlKHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wb3NpdGlvbikpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAuLi5maXhlZFBhcmVudHMsXHJcbiAgICAgICAgICAgICAgICBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZml4ZWRQYXJlbnRzLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgW25vZGVSZWYucmVmXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5maXhlZFBhcmVudHMuZGVmaW5pdGlvbltub2RlUmVmLnJlZl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtub2RlUmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZml4ZWRQYXJlbnRzLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiBuZXdQYXJlbnRSZWZcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHN0b3BEcmFnZ2luZylcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gSE9WRVJfTU9CSUxFKGUpIHtcclxuICAgICAgICBjb25zdCBlbGVtID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludChlLnRvdWNoZXNbMF0uY2xpZW50WCwgZS50b3VjaGVzWzBdLmNsaWVudFkpXHJcbiAgICAgICAgY29uc3QgbW92ZUV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoJ21vdXNlbW92ZScsIHtcclxuICAgICAgICAgICAgYnViYmxlczogdHJ1ZSxcclxuICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgdmlldzogd2luZG93LFxyXG4gICAgICAgICAgICBjbGllbnRYOiBlLnRvdWNoZXNbMF0uY2xpZW50WCxcclxuICAgICAgICAgICAgY2xpZW50WTogZS50b3VjaGVzWzBdLmNsaWVudFksXHJcbiAgICAgICAgICAgIHNjcmVlblg6IGUudG91Y2hlc1swXS5zY3JlZW5YLFxyXG4gICAgICAgICAgICBzY3JlZW5ZOiBlLnRvdWNoZXNbMF0uc2NyZWVuWSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGVsZW0uZGlzcGF0Y2hFdmVudChtb3ZlRXZlbnQpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gVklFV19IT1ZFUkVEKG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGgsIGUpIHtcclxuICAgICAgICBpZighc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcpe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGhpdFBvc2l0aW9uID0gKGUudG91Y2hlcz8gMjg6IGUubGF5ZXJZKSAvIDI4XHJcbiAgICAgICAgY29uc3QgaW5zZXJ0QmVmb3JlICA9ICgpPT4gc2V0U3RhdGUoey4uLnN0YXRlLCBob3ZlcmVkVmlld05vZGU6IHtwYXJlbnQ6IHBhcmVudFJlZiwgZGVwdGgsIHBvc2l0aW9uOiBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudFJlZi5pZF0uY2hpbGRyZW4uZmlsdGVyKChyZWYpPT4gcmVmLmlkICE9PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCkuZmluZEluZGV4KChyZWYpPT5yZWYuaWQgPT09IG5vZGVSZWYuaWQpfX0pXHJcbiAgICAgICAgY29uc3QgaW5zZXJ0QWZ0ZXIgICA9ICgpPT4gc2V0U3RhdGUoey4uLnN0YXRlLCBob3ZlcmVkVmlld05vZGU6IHtwYXJlbnQ6IHBhcmVudFJlZiwgZGVwdGgsIHBvc2l0aW9uOiBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudFJlZi5pZF0uY2hpbGRyZW4uZmlsdGVyKChyZWYpPT4gcmVmLmlkICE9PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCkuZmluZEluZGV4KChyZWYpPT5yZWYuaWQgPT09IG5vZGVSZWYuaWQpICsgMX19KVxyXG4gICAgICAgIGNvbnN0IGluc2VydEFzRmlyc3QgPSAoKT0+IHNldFN0YXRlKHsuLi5zdGF0ZSwgaG92ZXJlZFZpZXdOb2RlOiB7cGFyZW50OiBub2RlUmVmLCBkZXB0aDogZGVwdGgrMSwgcG9zaXRpb246IDB9fSlcclxuICAgICAgICBjb25zdCBpbnNlcnRBc0xhc3QgPSAoKT0+IHNldFN0YXRlKHsuLi5zdGF0ZSwgaG92ZXJlZFZpZXdOb2RlOiB7cGFyZW50OiB7cmVmOiAndk5vZGVCb3gnLCBpZDogJ19yb290Tm9kZSd9LCBkZXB0aDogMSwgcG9zaXRpb246IHN0YXRlLmRlZmluaXRpb25bJ3ZOb2RlQm94J11bJ19yb290Tm9kZSddLmNoaWxkcmVuLmxlbmd0aH19KVxyXG4gICAgICAgIGNvbnN0IGluc2VydEF0ID0gKHRvUHV0UmVmLCBpbmRleCk9PiBzZXRTdGF0ZSh7Li4uc3RhdGUsIGhvdmVyZWRWaWV3Tm9kZToge3BhcmVudDogdG9QdXRSZWYsIGRlcHRoOiBkZXB0aC0xLCBwb3NpdGlvbjogaW5kZXgrMX19KVxyXG5cclxuICAgICAgICBpZihub2RlUmVmLmlkID09PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCl7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl1bcGFyZW50UmVmLmlkXVxyXG4gICAgICAgICAgICAvLyBjaGVjayBpZiB0aGUgbGFzdCBjaGlsZCwgaWYgeWVzLCBnbyB0byBncmFuZHBhcmVudCBhbmQgZHJvcCB0aGVyZSBhZnRlciBwYXJlbnRcclxuICAgICAgICAgICAgaWYocGFyZW50LmNoaWxkcmVuW3BhcmVudC5jaGlsZHJlbi5sZW5ndGggLSAxXS5pZCA9PT0gbm9kZVJlZi5pZCl7XHJcbiAgICAgICAgICAgICAgICBpZihwYXJlbnRSZWYuaWQgIT09ICdfcm9vdE5vZGUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbmRwYXJlbnQgPSBzdGF0ZS5kZWZpbml0aW9uW3BhcmVudC5wYXJlbnQucmVmXVtwYXJlbnQucGFyZW50LmlkXVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudFBvc2l0aW9uID0gZ3JhbmRwYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KChjaGlsZFJlZik9PiBjaGlsZFJlZi5pZCA9PT0gcGFyZW50UmVmLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbnNlcnRBdChwYXJlbnQucGFyZW50LCBwYXJlbnRQb3NpdGlvbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoey4uLnN0YXRlLCBob3ZlcmVkVmlld05vZGU6IG51bGwsfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYobm9kZVJlZi5pZCA9PT0gJ19yb290Tm9kZScpe1xyXG4gICAgICAgICAgICByZXR1cm4gaW5zZXJ0QXNGaXJzdCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKG5vZGVSZWYuaWQgPT09ICdfbGFzdE5vZGUnKXtcclxuICAgICAgICAgICAgcmV0dXJuIGluc2VydEFzTGFzdCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHByYXkgdG8gZ29kIHRoYXQgeW91IGRpZCBub3QgbWFrZSBhIG1pc3Rha2UgaGVyZVxyXG4gICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdLmNoaWxkcmVuKXsgLy8gaWYgYm94XHJcbiAgICAgICAgICAgIGlmKHN0YXRlLnZpZXdGb2xkZXJzQ2xvc2VkW25vZGVSZWYuaWRdIHx8IHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCl7IC8vIGlmIGNsb3NlZCBvciBlbXB0eSBib3hcclxuICAgICAgICAgICAgICAgIGlmKGhpdFBvc2l0aW9uIDwgMC4zKXtcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRCZWZvcmUoKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZighb3BlbkJveFRpbWVvdXQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuQm94VGltZW91dCA9IHNldFRpbWVvdXQoKCk9PlZJRVdfRk9MREVSX0NMSUNLRUQobm9kZVJlZi5pZCwgZmFsc2UpLCA1MDApXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydEFzRmlyc3QoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBvcGVuIGJveFxyXG4gICAgICAgICAgICAgICAgaWYoaGl0UG9zaXRpb24gPCAwLjUpe1xyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydEJlZm9yZSgpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydEFzRmlyc3QoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gc2ltcGxlIG5vZGVcclxuICAgICAgICAgICAgaWYoaGl0UG9zaXRpb24gPCAwLjUpe1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0QmVmb3JlKClcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGluc2VydEFmdGVyKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihvcGVuQm94VGltZW91dCl7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChvcGVuQm94VGltZW91dClcclxuICAgICAgICAgICAgb3BlbkJveFRpbWVvdXQgPSBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFBJUEVfSE9WRVJFRChwaXBlUmVmLCBlKSB7XHJcbiAgICAgICAgaWYoIXN0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGhvdmVyZWRQaXBlOiBwaXBlUmVmfSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBDT01QT05FTlRfVklFV19EUkFHR0VEKGUpIHtcclxuICAgICAgICBjb25zdCBpbml0aWFsWCA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXS5wYWdlWCA6IGUucGFnZVhcclxuICAgICAgICBjb25zdCBpbml0aWFsWSA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXS5wYWdlWSA6IGUucGFnZVlcclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuZWxtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IGluaXRpYWxYIC0gcG9zaXRpb24ubGVmdFxyXG4gICAgICAgIGNvbnN0IG9mZnNldFkgPSBpbml0aWFsWSAtIHBvc2l0aW9uLnRvcFxyXG5cclxuICAgICAgICBmdW5jdGlvbiBkcmFnKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIGNvbnN0IHggPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0ucGFnZVggOiBlLnBhZ2VYXHJcbiAgICAgICAgICAgIGNvbnN0IHkgPSBlLnRvdWNoZXMgPyBlLnRvdWNoZXNbMF0ucGFnZVkgOiBlLnBhZ2VZXHJcbiAgICAgICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgY29tcG9uZW50RWRpdG9yUG9zaXRpb246IHt4OiB4IC0gb2Zmc2V0WCwgeTogeSAtIG9mZnNldFl9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBkcmFnKVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBkcmFnKVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3BEcmFnZ2luZyhldmVudCkge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBkcmFnKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZHJhZylcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHN0b3BEcmFnZ2luZylcclxuICAgICAgICB9XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgc3RvcERyYWdnaW5nKVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gV0lEVEhfRFJBR0dFRCh3aWR0aE5hbWUsIGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICBmdW5jdGlvbiByZXNpemUoZSl7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICAvLyBUT0RPIHJlZmFjdG9yXHJcbiAgICAgICAgICAgIGxldCBuZXdXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gKGUudG91Y2hlcz8gZS50b3VjaGVzWzBdLnBhZ2VYOiBlLnBhZ2VYKVxyXG4gICAgICAgICAgICBpZih3aWR0aE5hbWUgPT09ICdlZGl0b3JMZWZ0V2lkdGgnKXtcclxuICAgICAgICAgICAgICAgIG5ld1dpZHRoID0gZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVhcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih3aWR0aE5hbWUgPT09ICdzdWJFZGl0b3JXaWR0aCcpe1xyXG4gICAgICAgICAgICAgICAgbmV3V2lkdGggPSAoZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVgpIC0gc3RhdGUuY29tcG9uZW50RWRpdG9yUG9zaXRpb24ueFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHdpZHRoTmFtZSA9PT0gJ3N1YkVkaXRvcldpZHRoTGVmdCcpe1xyXG4gICAgICAgICAgICAgICAgbmV3V2lkdGggPSBzdGF0ZS5jb21wb25lbnRFZGl0b3JQb3NpdGlvbi54ICsgc3RhdGUuc3ViRWRpdG9yV2lkdGggLSAoZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVgpXHJcbiAgICAgICAgICAgICAgICBpZihuZXdXaWR0aCA8IDI1MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoey4uLnN0YXRlLCBzdWJFZGl0b3JXaWR0aDogbmV3V2lkdGgsIGNvbXBvbmVudEVkaXRvclBvc2l0aW9uOiB7Li4uc3RhdGUuY29tcG9uZW50RWRpdG9yUG9zaXRpb24sIHg6IGUudG91Y2hlcz8gZS50b3VjaGVzWzBdLnBhZ2VYOiBlLnBhZ2VYfX0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSSBwcm9iYWJseSB3YXMgZHJ1bmtcclxuICAgICAgICAgICAgaWYod2lkdGhOYW1lICE9PSAnc3ViRWRpdG9yV2lkdGgnICYmIHdpZHRoTmFtZSAhPT0gJ3N1YkVkaXRvcldpZHRoJyAmJiAoICh3aWR0aE5hbWUgPT09ICdlZGl0b3JMZWZ0V2lkdGgnID8gc3RhdGUubGVmdE9wZW46IHN0YXRlLnJpZ2h0T3BlbikgPyBuZXdXaWR0aCA8IDE4MDogbmV3V2lkdGggPiAxODApKXtcclxuICAgICAgICAgICAgICAgIGlmKHdpZHRoTmFtZSA9PT0gJ2VkaXRvckxlZnRXaWR0aCcpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7Li4uc3RhdGUsIGxlZnRPcGVuOiAhc3RhdGUubGVmdE9wZW59KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgcmlnaHRPcGVuOiAhc3RhdGUucmlnaHRPcGVufSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihuZXdXaWR0aCA8IDI1MCl7XHJcbiAgICAgICAgICAgICAgICBuZXdXaWR0aCA9IDI1MFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgW3dpZHRoTmFtZV06IG5ld1dpZHRofSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCByZXNpemUpXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHJlc2l6ZSlcclxuICAgICAgICBmdW5jdGlvbiBzdG9wRHJhZ2dpbmcoZSl7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgcmVzaXplKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgcmVzaXplKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHN0b3BEcmFnZ2luZylcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFNUQVRFX0RSQUdHRUQoc3RhdGVJZCwgZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIGNvbnN0IGluaXRpYWxYID0gZS50b3VjaGVzPyBlLnRvdWNoZXNbMF0ucGFnZVg6IGUucGFnZVhcclxuICAgICAgICBjb25zdCBpbml0aWFsWSA9IGUudG91Y2hlcz8gZS50b3VjaGVzWzBdLnBhZ2VZOiBlLnBhZ2VZXHJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmVsbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgICAgIGNvbnN0IG9mZnNldFggPSBpbml0aWFsWCAtIHBvc2l0aW9uLmxlZnRcclxuICAgICAgICBjb25zdCBvZmZzZXRZID0gaW5pdGlhbFkgLSBwb3NpdGlvbi50b3BcclxuICAgICAgICBmdW5jdGlvbiBkcmFnKGUpe1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgY29uc3QgeCA9IGUudG91Y2hlcz8gZS50b3VjaGVzWzBdLnBhZ2VYOiBlLnBhZ2VYXHJcbiAgICAgICAgICAgIGNvbnN0IHkgPSBlLnRvdWNoZXM/IGUudG91Y2hlc1swXS5wYWdlWTogZS5wYWdlWVxyXG4gICAgICAgICAgICBpZighc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcpe1xyXG4gICAgICAgICAgICAgICAgaWYoTWF0aC5hYnMoaW5pdGlhbFkteSkgPiAzKXtcclxuICAgICAgICAgICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRyYWdnZWRDb21wb25lbnRTdGF0ZUlkOiBzdGF0ZUlkLCBtb3VzZVBvc2l0aW9uOiB7eDogeCAtIG9mZnNldFgsIHk6IHkgLSBvZmZzZXRZfX0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIG1vdXNlUG9zaXRpb246IHt4OiB4IC0gb2Zmc2V0WCwgeTogeSAtIG9mZnNldFl9fSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGRyYWcpXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGRyYWcpXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcERyYWdnaW5nKGV2ZW50KXtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZHJhZylcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIGRyYWcpXHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBzdG9wRHJhZ2dpbmcpXHJcbiAgICAgICAgICAgIGlmKCFzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX05PREVfU0VMRUNURUQoc3RhdGVJZClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZighc3RhdGUuaG92ZXJlZFBpcGUgJiYgIXN0YXRlLmhvdmVyZWRFdmVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBob3ZlcmVkUGlwZTogbnVsbCxcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYoc3RhdGUuaG92ZXJlZEV2ZW50KXtcclxuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGlmIGV2ZW50IGFscmVhZHkgY2hhbmdlcyB0aGUgc3RhdGVcclxuICAgICAgICAgICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWRdLm11dGF0b3JzLm1hcChtdXRhdG9yUmVmPT5zdGF0ZS5kZWZpbml0aW9uLm11dGF0b3JbbXV0YXRvclJlZi5pZF0uZXZlbnQuaWQpLmZpbHRlcihldmVudGlkPT5ldmVudGlkID09PSBzdGF0ZS5ob3ZlcmVkRXZlbnQuaWQpLmxlbmd0aCl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnZWRDb21wb25lbnRTdGF0ZUlkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3ZlcmVkRXZlbnQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IG11dGF0b3JJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGlwZUlkID0gdXVpZCgpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnZWRDb21wb25lbnRTdGF0ZUlkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGhvdmVyZWRFdmVudDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtwaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZF0udHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3N0YXRlJywgaWQ6IHN0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3N0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11dGF0b3JzOiBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkXS5tdXRhdG9ycy5jb25jYXQoe3JlZjogJ211dGF0b3InLCBpZDptdXRhdG9ySWR9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtdXRhdG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLm11dGF0b3IsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbXV0YXRvcklkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBzdGF0ZS5ob3ZlcmVkRXZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IHtyZWY6ICdzdGF0ZScsIGlkOiBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXV0YXRpb246IHtyZWY6ICdwaXBlJywgaWQ6IHBpcGVJZH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uZXZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGUuaG92ZXJlZEV2ZW50LmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uZXZlbnRbc3RhdGUuaG92ZXJlZEV2ZW50LmlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRhdG9yczogc3RhdGUuZGVmaW5pdGlvbi5ldmVudFtzdGF0ZS5ob3ZlcmVkRXZlbnQuaWRdLm11dGF0b3JzLmNvbmNhdCh7cmVmOiAnbXV0YXRvcicsIGlkOm11dGF0b3JJZH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGVEcm9wcGVkID0gc3RhdGUuZGVmaW5pdGlvbi5waXBlW3N0YXRlLmhvdmVyZWRQaXBlLmlkXVxyXG4gICAgICAgICAgICBpZihwaXBlRHJvcHBlZC50eXBlID09PSAndGV4dCcpe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbi5waXBlW3N0YXRlLmhvdmVyZWRQaXBlLmlkXS52YWx1ZS5yZWYgJiYgc3RhdGUuZGVmaW5pdGlvbi5waXBlW3N0YXRlLmhvdmVyZWRQaXBlLmlkXS52YWx1ZS5yZWYgPT09ICdzdGF0ZScpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXJlZFBpcGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb24gOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGUuaG92ZXJlZFBpcGUuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtzdGF0ZS5ob3ZlcmVkUGlwZS5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDpzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBqb2luSWRTdGF0ZSA9IHV1aWQoKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgam9pbklkVGV4dCA9IHV1aWQoKVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGlwZUlkU3RhdGUgPSB1dWlkKClcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBpcGVJZFRleHQgPSB1dWlkKClcclxuICAgICAgICAgICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBob3ZlcmVkUGlwZTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBkZWZpbml0aW9uIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGUuaG92ZXJlZFBpcGUuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlW3N0YXRlLmhvdmVyZWRQaXBlLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFt7cmVmOiAnam9pbicsIGlkOiBqb2luSWRTdGF0ZX0sIHtyZWY6ICdqb2luJywgaWQ6IGpvaW5JZFRleHR9XS5jb25jYXQoc3RhdGUuZGVmaW5pdGlvbi5waXBlW3N0YXRlLmhvdmVyZWRQaXBlLmlkXS50cmFuc2Zvcm1hdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3BpcGVJZFN0YXRlXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3N0YXRlJywgaWQ6c3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWR9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcGlwZUlkVGV4dF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpvaW46IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uam9pbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtqb2luSWRTdGF0ZV06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3BpcGUnLCBpZDogcGlwZUlkU3RhdGV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2pvaW5JZFRleHRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtyZWY6ICdwaXBlJywgaWQ6IHBpcGVJZFRleHR9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYocGlwZURyb3BwZWQudHlwZSA9PT0gJ251bWJlcicpe1xyXG4gICAgICAgICAgICAgICAgLy8geW91IGNhbid0IGRyb3AgYm9vbGVhbiBpbnRvIG51bWJlclxyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZF0udHlwZSA9PT0gJ2Jvb2xlYW4nKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dlZENvbXBvbmVudFN0YXRlSWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyZWRQaXBlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB5b3UgY2FuJ3QgZHJvcCBib29sZWFuIGludG8gbnVtYmVyXHJcbiAgICAgICAgICAgICAgICBpZihzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkXS50eXBlID09PSAndGV4dCcpe1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXJlZFBpcGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb24gOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGUuaG92ZXJlZFBpcGUuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtzdGF0ZS5ob3ZlcmVkUGlwZS5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDpzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogJ2xlbmd0aCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogJ25vb3AnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdnZWRDb21wb25lbnRTdGF0ZUlkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGhvdmVyZWRQaXBlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb24gOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtzdGF0ZS5ob3ZlcmVkUGlwZS5pZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbc3RhdGUuaG92ZXJlZFBpcGUuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDpzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZihwaXBlRHJvcHBlZC50eXBlID09PSAnYm9vbGVhbicpe1xyXG4gICAgICAgICAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZF0udHlwZSA9PT0gJ251bWJlcicpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVxSWQgPSB1dWlkKClcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwaXBlSWQgPSB1dWlkKClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHJhZ2dlZENvbXBvbmVudFN0YXRlSWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvdmVyZWRQaXBlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZpbml0aW9uIDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3N0YXRlLmhvdmVyZWRQaXBlLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbc3RhdGUuaG92ZXJlZFBpcGUuaWRdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3N0YXRlJywgaWQ6c3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWR9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY6ICdlcXVhbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZXFJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3BpcGVJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcXVhbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24uZXF1YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW2VxSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWY6ICdwaXBlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwaXBlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHlvdSBjYW4ndCBkcm9wIGJvb2xlYW4gaW50byBudW1iZXJcclxuICAgICAgICAgICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWRdLnR5cGUgPT09ICd0ZXh0Jyl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXFJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBpcGVJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmFnZ2VkQ29tcG9uZW50U3RhdGVJZDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG92ZXJlZFBpcGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb24gOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGUuaG92ZXJlZFBpcGUuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtzdGF0ZS5ob3ZlcmVkUGlwZS5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDpzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogJ2VxdWFsJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBlcUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnRGVmYXVsdCB0ZXh0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXF1YWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLmVxdWFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtlcUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiAncGlwZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcGlwZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgZHJhZ2dlZENvbXBvbmVudFN0YXRlSWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgaG92ZXJlZFBpcGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbiA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3N0YXRlLmhvdmVyZWRQaXBlLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtzdGF0ZS5ob3ZlcmVkUGlwZS5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtyZWY6ICdzdGF0ZScsIGlkOnN0YXRlLmRyYWdnZWRDb21wb25lbnRTdGF0ZUlkfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgc3RvcERyYWdnaW5nKVxyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHN0b3BEcmFnZ2luZylcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIE9QRU5fU0lERUJBUihzaWRlKSB7XHJcbiAgICAgICAgaWYoc2lkZSA9PT0gJ2xlZnQnKXtcclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgbGVmdE9wZW46ICFzdGF0ZS5sZWZ0T3Blbn0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHNpZGUgPT09ICdyaWdodCcpe1xyXG4gICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoey4uLnN0YXRlLCByaWdodE9wZW46ICFzdGF0ZS5yaWdodE9wZW59KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEZSRUVaRVJfQ0xJQ0tFRCgpIHtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGFwcElzRnJvemVuOiAhc3RhdGUuYXBwSXNGcm96ZW59KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVklFV19GT0xERVJfQ0xJQ0tFRChub2RlSWQsIGZvcmNlZFZhbHVlKSB7XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCB2aWV3Rm9sZGVyc0Nsb3NlZDp7Li4uc3RhdGUudmlld0ZvbGRlcnNDbG9zZWQsIFtub2RlSWRdOiBmb3JjZWRWYWx1ZSAhPT0gdW5kZWZpbmVkID8gZm9yY2VkVmFsdWUgOiAhc3RhdGUudmlld0ZvbGRlcnNDbG9zZWRbbm9kZUlkXX19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVklFV19OT0RFX1NFTEVDVEVEKHJlZikge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgc2VsZWN0ZWRWaWV3Tm9kZTpyZWZ9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gVU5TRUxFQ1RfVklFV19OT0RFKHNlbGZPbmx5LCBzdG9wUHJvcGFnYXRpb24sIGUpIHtcclxuICAgICAgICBpZihzdG9wUHJvcGFnYXRpb24pe1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHNlbGZPbmx5ICYmIGUudGFyZ2V0ICE9PSB0aGlzLmVsbSl7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkVmlld05vZGU6e319KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gU1RBVEVfTk9ERV9TRUxFQ1RFRChub2RlSWQpIHtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkU3RhdGVOb2RlSWQ6bm9kZUlkfSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIFVOU0VMRUNUX1NUQVRFX05PREUoZSkge1xyXG4gICAgICAgIGlmKGUudGFyZ2V0ID09PSB0aGlzLmVsbSl7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgc2VsZWN0ZWRTdGF0ZU5vZGVJZDonJ30pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gQUREX05PREUobm9kZVJlZiwgdHlwZSkge1xyXG4gICAgICAgIGlmKCFub2RlUmVmLnJlZiB8fCAhc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZVJlZi5pZF0gfHwgIXN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdLmNoaWxkcmVuKXtcclxuICAgICAgICAgICAgaWYoc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCAmJiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkICE9PSAnX3Jvb3ROb2RlJyl7XHJcbiAgICAgICAgICAgICAgICBub2RlUmVmID0gc3RhdGUuZGVmaW5pdGlvbltzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZl1bc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZF0ucGFyZW50XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlUmVmID0ge3JlZjogJ3ZOb2RlQm94JywgaWQ6ICdfcm9vdE5vZGUnfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG5vZGVJZCA9IG5vZGVSZWYuaWRcclxuICAgICAgICBjb25zdCBuZXdOb2RlSWQgPSB1dWlkKClcclxuICAgICAgICBjb25zdCBuZXdTdHlsZUlkID0gdXVpZCgpXHJcbiAgICAgICAgY29uc3QgbmV3U3R5bGUgPSB7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdib3gnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ2JveCcsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGVSZWYsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge3JlZjonc3R5bGUnLCBpZDpuZXdTdHlsZUlkfSxcclxuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFZpZXdOb2RlOiB7cmVmOid2Tm9kZUJveCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjogbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUJveCcgPyB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICB2Tm9kZUJveDogey4uLnN0YXRlLmRlZmluaXRpb24udk5vZGVCb3gsIFtub2RlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi52Tm9kZUJveFtub2RlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbi52Tm9kZUJveFtub2RlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOid2Tm9kZUJveCcsIGlkOm5ld05vZGVJZH0pfSwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW25ld1N0eWxlSWRdOiBuZXdTdHlsZX0sXHJcbiAgICAgICAgICAgICAgICB9IDoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgW25vZGVSZWYucmVmXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdLCBbbm9kZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVJZF0sIGNoaWxkcmVuOiBzdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOid2Tm9kZUJveCcsIGlkOm5ld05vZGVJZH0pfX0sXHJcbiAgICAgICAgICAgICAgICAgICAgdk5vZGVCb3g6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlQm94LCBbbmV3Tm9kZUlkXTogbmV3Tm9kZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnN0eWxlLCBbbmV3U3R5bGVJZF06IG5ld1N0eWxlfSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ3RleHQnKXtcclxuICAgICAgICAgICAgY29uc3QgcGlwZUlkID0gdXVpZCgpXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgcGFyZW50OiBub2RlUmVmLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtyZWY6J3N0eWxlJywgaWQ6bmV3U3R5bGVJZH0sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjoncGlwZScsIGlkOnBpcGVJZH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdEZWZhdWx0IFRleHQnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkVmlld05vZGU6IHtyZWY6J3ZOb2RlVGV4dCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJZF06IG5ld1BpcGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtub2RlUmVmLnJlZl06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjondk5vZGVUZXh0JywgaWQ6bmV3Tm9kZUlkfSl9fSxcclxuICAgICAgICAgICAgICAgICAgICB2Tm9kZVRleHQ6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlVGV4dCwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW25ld1N0eWxlSWRdOiBuZXdTdHlsZX0sXHJcbiAgICAgICAgICAgICAgICB9fSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2ltYWdlJyl7XHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGVJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICBjb25zdCBuZXdOb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpbWFnZScsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGVSZWYsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge3JlZjonc3R5bGUnLCBpZDpuZXdTdHlsZUlkfSxcclxuICAgICAgICAgICAgICAgIHNyYzoge3JlZjoncGlwZScsIGlkOnBpcGVJZH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICdodHRwczovL3d3dy51Z25pcy5jb20vaW1hZ2VzL2xvZ28yNTZ4MjU2LnBuZycsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRWaWV3Tm9kZToge3JlZjondk5vZGVJbWFnZScsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJZF06IG5ld1BpcGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtub2RlUmVmLnJlZl06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjondk5vZGVJbWFnZScsIGlkOm5ld05vZGVJZH0pfX0sXHJcbiAgICAgICAgICAgICAgICAgICAgdk5vZGVJbWFnZTogey4uLnN0YXRlLmRlZmluaXRpb24udk5vZGVJbWFnZSwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW25ld1N0eWxlSWRdOiBuZXdTdHlsZX0sXHJcbiAgICAgICAgICAgICAgICB9fSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2lmJyl7XHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGVJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICBjb25zdCBuZXdOb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdjb25kaXRpb25hbCcsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGVSZWYsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjoncGlwZScsIGlkOnBpcGVJZH0sXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmV3UGlwZSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkVmlld05vZGU6IHtyZWY6J3ZOb2RlSWYnLCBpZDogbmV3Tm9kZUlkfSxcclxuICAgICAgICAgICAgICAgIGRlZmluaXRpb246IG5vZGVSZWYucmVmID09PSAndk5vZGVJZicgPyB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBwaXBlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5waXBlLCBbcGlwZUlkXTogbmV3UGlwZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgdk5vZGVJZjogey4uLnN0YXRlLmRlZmluaXRpb24udk5vZGVJZiwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlSWZbbm9kZUlkXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb24udk5vZGVJZltub2RlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOid2Tm9kZUlmJywgaWQ6bmV3Tm9kZUlkfSl9LCBbbmV3Tm9kZUlkXTogbmV3Tm9kZX0sXHJcbiAgICAgICAgICAgICAgICB9IDoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJZF06IG5ld1BpcGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIFtub2RlUmVmLnJlZl06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjondk5vZGVJZicsIGlkOm5ld05vZGVJZH0pfX0sXHJcbiAgICAgICAgICAgICAgICAgICAgdk5vZGVJZjogey4uLnN0YXRlLmRlZmluaXRpb24udk5vZGVJZiwgW25ld05vZGVJZF06IG5ld05vZGV9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0eXBlID09PSAnaW5wdXQnKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlSWQgPSB1dWlkKClcclxuICAgICAgICAgICAgY29uc3QgZXZlbnRJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICBjb25zdCBtdXRhdG9ySWQgPSB1dWlkKClcclxuICAgICAgICAgICAgY29uc3QgcGlwZUlucHV0SWQgPSB1dWlkKClcclxuICAgICAgICAgICAgY29uc3QgcGlwZU11dGF0b3JJZCA9IHV1aWQoKVxyXG4gICAgICAgICAgICBjb25zdCBuZXdOb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpbnB1dCcsXHJcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IG5vZGVSZWYsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge3JlZjonc3R5bGUnLCBpZDpuZXdTdHlsZUlkfSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOidwaXBlJywgaWQ6cGlwZUlucHV0SWR9LFxyXG4gICAgICAgICAgICAgICAgaW5wdXQ6IHtyZWY6J2V2ZW50JywgaWQ6ZXZlbnRJZH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdQaXBlSW5wdXQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3N0YXRlJywgaWQ6IHN0YXRlSWR9LFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1BpcGVNdXRhdG9yID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHtyZWY6ICdldmVudERhdGEnLCBpZDogJ19pbnB1dCd9LFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdpbnB1dCB2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICByZWY6IHN0YXRlSWQsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdEZWZhdWx0IHRleHQnLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFt7IHJlZjonbXV0YXRvcicsIGlkOm11dGF0b3JJZH1dLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld011dGF0b3IgPSB7XHJcbiAgICAgICAgICAgICAgICBldmVudDogeyByZWY6ICdldmVudCcsIGlkOmV2ZW50SWR9LFxyXG4gICAgICAgICAgICAgICAgc3RhdGU6IHsgcmVmOiAnc3RhdGUnLCBpZDpzdGF0ZUlkfSxcclxuICAgICAgICAgICAgICAgIG11dGF0aW9uOiB7IHJlZjogJ3BpcGUnLCBpZDogcGlwZU11dGF0b3JJZH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmV3RXZlbnQgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICd1cGRhdGUgaW5wdXQnLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IHJlZjogJ211dGF0b3InLCBpZDogbXV0YXRvcklkfSxcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBlbWl0dGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVmOiAndk5vZGVJbnB1dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG5ld05vZGVJZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge3JlZjogJ2V2ZW50RGF0YScsIGlkOiAnX2lucHV0J31cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0ZWRWaWV3Tm9kZToge3JlZjondk5vZGVJbnB1dCcsIGlkOiBuZXdOb2RlSWR9LFxyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgcGlwZTogey4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSwgW3BpcGVJbnB1dElkXTogbmV3UGlwZUlucHV0LCBbcGlwZU11dGF0b3JJZF06IG5ld1BpcGVNdXRhdG9yfSxcclxuICAgICAgICAgICAgICAgICAgICBbbm9kZVJlZi5yZWZdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl0sIFtub2RlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVJZF0uY2hpbGRyZW4uY29uY2F0KHtyZWY6J3ZOb2RlSW5wdXQnLCBpZDpuZXdOb2RlSWR9KX19LFxyXG4gICAgICAgICAgICAgICAgICAgIHZOb2RlSW5wdXQ6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnZOb2RlSW5wdXQsIFtuZXdOb2RlSWRdOiBuZXdOb2RlfSxcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogey4uLnN0YXRlLmRlZmluaXRpb24uc3R5bGUsIFtuZXdTdHlsZUlkXTogbmV3U3R5bGV9LFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVTcGFjZTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlLCBbJ19yb290TmFtZVNwYWNlJ106IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZVsnX3Jvb3ROYW1lU3BhY2UnXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlWydfcm9vdE5hbWVTcGFjZSddLmNoaWxkcmVuLmNvbmNhdCh7cmVmOidzdGF0ZScsIGlkOnN0YXRlSWR9KX19LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZSwgW3N0YXRlSWRdOiBuZXdTdGF0ZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRvcjogey4uLnN0YXRlLmRlZmluaXRpb24ubXV0YXRvciwgW211dGF0b3JJZF06IG5ld011dGF0b3J9LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50OiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5ldmVudCwgW2V2ZW50SWRdOiBuZXdFdmVudH0sXHJcbiAgICAgICAgICAgICAgICB9fSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBBRERfU1RBVEUobmFtZXNwYWNlSWQsIHR5cGUpIHtcclxuICAgICAgICBjb25zdCBuZXdTdGF0ZUlkID0gdXVpZCgpXHJcbiAgICAgICAgbGV0IG5ld1N0YXRlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ3RleHQnKSB7XHJcbiAgICAgICAgICAgIG5ld1N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICduZXcgdGV4dCcsXHJcbiAgICAgICAgICAgICAgICByZWY6IG5ld1N0YXRlSWQsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdEZWZhdWx0IHRleHQnLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIG5ld1N0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICduZXcgbnVtYmVyJyxcclxuICAgICAgICAgICAgICAgIHJlZjogbmV3U3RhdGVJZCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAwLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnbmV3IGJvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgcmVmOiBuZXdTdGF0ZUlkLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHR5cGUgPT09ICd0YWJsZScpIHtcclxuICAgICAgICAgICAgbmV3U3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ25ldyB0YWJsZScsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndGFibGUnLFxyXG4gICAgICAgICAgICAgICAgcmVmOiBuZXdTdGF0ZUlkLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB7fSxcclxuICAgICAgICAgICAgICAgIG11dGF0b3JzOiBbXSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0eXBlID09PSAnZm9sZGVyJykge1xyXG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnbmV3IGZvbGRlcicsXHJcbiAgICAgICAgICAgICAgICBjaGlsZHJlbjogW10sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgIG5hbWVTcGFjZTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlLCBbbmFtZXNwYWNlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbbmFtZXNwYWNlSWRdLCBjaGlsZHJlbjogc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbbmFtZXNwYWNlSWRdLmNoaWxkcmVuLmNvbmNhdCh7cmVmOiduYW1lU3BhY2UnLCBpZDpuZXdTdGF0ZUlkfSl9LCBbbmV3U3RhdGVJZF06IG5ld1N0YXRlfSxcclxuICAgICAgICAgICAgfX0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBuYW1lU3BhY2U6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZSwgW25hbWVzcGFjZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlW25hbWVzcGFjZUlkXSwgY2hpbGRyZW46IHN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlW25hbWVzcGFjZUlkXS5jaGlsZHJlbi5jb25jYXQoe3JlZjonc3RhdGUnLCBpZDpuZXdTdGF0ZUlkfSl9fSxcclxuICAgICAgICAgICAgc3RhdGU6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLCBbbmV3U3RhdGVJZF06IG5ld1N0YXRlfSxcclxuICAgICAgICB9fSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEFERF9ERUZBVUxUX1NUWUxFKHN0eWxlSWQsIGtleSkge1xyXG4gICAgICAgIGNvbnN0IHBpcGVJZCA9IHV1aWQoKVxyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRzID0ge1xyXG4gICAgICAgICAgICAnYmFja2dyb3VuZCc6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAnMXB4IHNvbGlkIGJsYWNrJyxcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAnMXB4IHNvbGlkIGJsYWNrJyxcclxuICAgICAgICAgICAgJ2N1cnNvcic6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogJ2JsYWNrJyxcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxyXG4gICAgICAgICAgICAndG9wJzogJzBweCcsXHJcbiAgICAgICAgICAgICdib3R0b20nOiAnMHB4JyxcclxuICAgICAgICAgICAgJ3RyYW5zaXRpb24nOiAnMC41cyBhbGwnLFxyXG4gICAgICAgICAgICAnbGVmdCc6ICcwcHgnLFxyXG4gICAgICAgICAgICAncmlnaHQnOiAnMHB4JyxcclxuICAgICAgICAgICAgJ2ZsZXgnOiAnMSAxIGF1dG8nLFxyXG4gICAgICAgICAgICAnanVzdGlmeUNvbnRlbnQnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgJ2FsaWduSXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgJ21heFdpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAnbWF4SGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAnbWluV2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICdtaW5IZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICdvdmVyZmxvdyc6ICdhdXRvJyxcclxuICAgICAgICAgICAgJ2hlaWdodCc6ICc1MDBweCcsXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICc1MDBweCcsXHJcbiAgICAgICAgICAgICdmb250JzogJ2l0YWxpYyAyZW0gXCJDb21pYyBTYW5zIE1TXCIsIGN1cnNpdmUsIHNhbnMtc2VyaWYnLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogJzEwcHgnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6ICcxMHB4JyxcclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgIHBpcGU6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsIFtwaXBlSWRdOiB7dHlwZTogJ3RleHQnLCB2YWx1ZTogZGVmYXVsdHNba2V5XSwgdHJhbnNmb3JtYXRpb25zOltdfX0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZSwgW3N0eWxlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdHlsZVtzdHlsZUlkXSwgW2tleV06IHtyZWY6ICdwaXBlJywgaWQ6IHBpcGVJZH19fX19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gU0VMRUNUX1ZJRVdfU1VCTUVOVShuZXdJZCkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgc2VsZWN0ZWRWaWV3U3ViTWVudTpuZXdJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBFRElUX1ZJRVdfTk9ERV9USVRMRShub2RlSWQpIHtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGVkaXRpbmdUaXRsZU5vZGVJZDpub2RlSWR9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gREVMRVRFX1NFTEVDVEVEX1ZJRVcobm9kZVJlZiwgcGFyZW50UmVmKSB7XHJcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBldmVudHMgZnJvbSBzdGF0ZVxyXG4gICAgICAgIGNvbnN0IGV2ZW50cyA9IGdldEF2YWlsYWJsZUV2ZW50cyhub2RlUmVmLnJlZilcclxuICAgICAgICBsZXQgbmV3U3RhdGUgPSBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlXHJcbiAgICAgICAgZXZlbnRzLmZvckVhY2goKGV2ZW50KT0+e1xyXG4gICAgICAgICAgICBjb25zdCBldmVudFJlZiA9IHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdW2V2ZW50LnByb3BlcnR5TmFtZV1cclxuICAgICAgICAgICAgaWYoZXZlbnRSZWYpe1xyXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQgLT4gbXV0YXRvcnMgLT4gc3RhdGVzXHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5kZWZpbml0aW9uW2V2ZW50UmVmLnJlZl1bZXZlbnRSZWYuaWRdLm11dGF0b3JzLmZvckVhY2goKG11dGF0b3JSZWYpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRlUmVmID0gc3RhdGUuZGVmaW5pdGlvblttdXRhdG9yUmVmLnJlZl1bbXV0YXRvclJlZi5pZF0uc3RhdGVcclxuICAgICAgICAgICAgICAgICAgICBuZXdTdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uIG5ld1N0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbc3RhdGVSZWYuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5uZXdTdGF0ZVtzdGF0ZVJlZi5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRhdG9yczogbmV3U3RhdGVbc3RhdGVSZWYuaWRdLm11dGF0b3JzLmZpbHRlcigobXV0YXRvcik9PiBtdXRhdG9yLmlkICE9PSBtdXRhdG9yUmVmLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOiB7XHJcbiAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgIFtwYXJlbnRSZWYucmVmXTogey4uLnN0YXRlLmRlZmluaXRpb25bcGFyZW50UmVmLnJlZl0sIFtwYXJlbnRSZWYuaWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbltwYXJlbnRSZWYucmVmXVtwYXJlbnRSZWYuaWRdLCBjaGlsZHJlbjpzdGF0ZS5kZWZpbml0aW9uW3BhcmVudFJlZi5yZWZdW3BhcmVudFJlZi5pZF0uY2hpbGRyZW4uZmlsdGVyKChyZWYpPT5yZWYuaWQgIT09IG5vZGVSZWYuaWQpfX0sXHJcbiAgICAgICAgICAgIHN0YXRlOiBuZXdTdGF0ZSxcclxuICAgICAgICB9LCBzZWxlY3RlZFZpZXdOb2RlOiB7fX0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfVklFV19OT0RFX1RJVExFKG5vZGVSZWYsIGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3Qgbm9kZUlkID0gbm9kZVJlZi5pZFxyXG4gICAgICAgIGNvbnN0IG5vZGVUeXBlID0gbm9kZVJlZi5yZWZcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgW25vZGVUeXBlXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVR5cGVdLCBbbm9kZUlkXTogey4uLnN0YXRlLmRlZmluaXRpb25bbm9kZVR5cGVdW25vZGVJZF0sIHRpdGxlOiBlLnRhcmdldC52YWx1ZX19LFxyXG4gICAgICAgIH19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gQ0hBTkdFX1NUQVRFX05PREVfVElUTEUobm9kZUlkLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBzdGF0ZTogey4uLnN0YXRlLmRlZmluaXRpb24uc3RhdGUsIFtub2RlSWRdOiB7Li4uc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtub2RlSWRdLCB0aXRsZTogZS50YXJnZXQudmFsdWV9fSxcclxuICAgICAgICB9fSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIENIQU5HRV9OQU1FU1BBQ0VfVElUTEUobm9kZUlkLCBlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBuYW1lU3BhY2U6IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZSwgW25vZGVJZF06IHsuLi5zdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZVtub2RlSWRdLCB0aXRsZTogZS50YXJnZXQudmFsdWV9fSxcclxuICAgICAgICB9fSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIENIQU5HRV9DVVJSRU5UX1NUQVRFX1RFWFRfVkFMVUUoc3RhdGVJZCwgZSkge1xyXG4gICAgICAgIGFwcC5zZXRDdXJyZW50U3RhdGUoey4uLmFwcC5nZXRDdXJyZW50U3RhdGUoKSwgW3N0YXRlSWRdOiBlLnRhcmdldC52YWx1ZX0pXHJcbiAgICAgICAgcmVuZGVyKClcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIENIQU5HRV9DVVJSRU5UX1NUQVRFX05VTUJFUl9WQUxVRShzdGF0ZUlkLCBlKSB7XHJcbiAgICAgICAgLy8gdG9kbyBiaWcgdGhyb3dzIGVycm9yIGluc3RlYWQgb2YgcmV0dXJuaW5nIE5hTi4uLiBmaXgsIHJld3JpdGUgb3IgaGFja1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmKGJpZyhlLnRhcmdldC52YWx1ZSkudG9TdHJpbmcoKSAhPT0gYXBwLmdldEN1cnJlbnRTdGF0ZSgpW3N0YXRlSWRdLnRvU3RyaW5nKCkpe1xyXG4gICAgICAgICAgICAgICAgYXBwLnNldEN1cnJlbnRTdGF0ZSh7Li4uYXBwLmdldEN1cnJlbnRTdGF0ZSgpLCBbc3RhdGVJZF06IGJpZyhlLnRhcmdldC52YWx1ZSl9KVxyXG4gICAgICAgICAgICAgICAgcmVuZGVyKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gQ0hBTkdFX1NUQVRJQ19WQUxVRShyZWYsIHByb3BlcnR5TmFtZSwgdHlwZSwgZSkge1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IGUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ251bWJlcicpe1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcoZS50YXJnZXQudmFsdWUpXHJcbiAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2Jvb2xlYW4nKXtcclxuICAgICAgICAgICAgdmFsdWUgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09ICd0cnVlJykgPyB0cnVlIDogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0U3RhdGUoey4uLnN0YXRlLCBkZWZpbml0aW9uOntcclxuICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgW3JlZi5yZWZdOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdLFxyXG4gICAgICAgICAgICAgICAgW3JlZi5pZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgW3Byb3BlcnR5TmFtZV06IHZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9fSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIEFERF9FVkVOVChwcm9wZXJ0eU5hbWUsIG5vZGUpIHtcclxuICAgICAgICBjb25zdCByZWYgPSBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlXHJcbiAgICAgICAgY29uc3QgZXZlbnRJZCA9IHV1aWQoKTtcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGRlZmluaXRpb246e1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBbcmVmLnJlZl06IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcmVmLnJlZl0sXHJcbiAgICAgICAgICAgICAgICBbcmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXSxcclxuICAgICAgICAgICAgICAgICAgICBbcHJvcGVydHlOYW1lXToge3JlZjogJ2V2ZW50JywgaWQ6IGV2ZW50SWR9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGV2ZW50OiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLmV2ZW50LFxyXG4gICAgICAgICAgICAgICAgW2V2ZW50SWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcHJvcGVydHlOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGVtaXR0ZXI6IG5vZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRvcnM6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IFtdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9fSlcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIFNFTEVDVF9QSVBFKHBpcGVJZCwgZSkge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIHNlbGVjdGVkUGlwZUlkOnBpcGVJZH0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfUElQRV9WQUxVRV9UT19TVEFURShwaXBlSWQpIHtcclxuICAgICAgICBpZighc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCB8fCBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXS52YWx1ZS5pZCApe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBwaXBlOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlSWRdLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7cmVmOiAnc3RhdGUnLCBpZDogc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtYXRpb25zOiBbXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfX0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBBRERfREVGQVVMVF9UUkFOU0ZPUk1BVElPTihwaXBlSWQpIHtcclxuICAgICAgICBjb25zdCBkZWZhdWx0VHJhbnNmb3JtYXRpb25zID0ge1xyXG4gICAgICAgICAgICB0ZXh0OiAndG9VcHBlckNhc2UnLFxyXG4gICAgICAgICAgICBudW1iZXI6ICdhZGQnLFxyXG4gICAgICAgICAgICBib29sZWFuOiAnYW5kJ1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWVzID0ge1xyXG4gICAgICAgICAgICB0ZXh0OiAnRGVmYXVsdCB0ZXh0JyxcclxuICAgICAgICAgICAgbnVtYmVyOiAwLFxyXG4gICAgICAgICAgICBib29sZWFuOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBpcGUgPSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXVxyXG4gICAgICAgIGNvbnN0IHN0YXRlSW5QaXBlID0gc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtwaXBlLnZhbHVlLmlkXVxyXG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybWF0aW9uID0gZGVmYXVsdFRyYW5zZm9ybWF0aW9uc1tzdGF0ZUluUGlwZS50eXBlXVxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGVmYXVsdFZhbHVlc1tzdGF0ZUluUGlwZS50eXBlXVxyXG4gICAgICAgIGNvbnN0IG5ld1BpcGVJZCA9IHV1aWQoKTtcclxuICAgICAgICBjb25zdCBuZXdJZCA9IHV1aWQoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgb2xkVHJhbnNmb3JtYXRpb25zID0gc3RhdGUuZGVmaW5pdGlvbi5waXBlW3BpcGVJZF0udHJhbnNmb3JtYXRpb25zXHJcbiAgICAgICAgY29uc3QgbmV3UGlwZVRyYW5zZm9ybWF0aW9ucyA9IHBpcGUudHlwZSA9PT0gJ3RleHQnIHx8IHBpcGUudHlwZSA9PT0gc3RhdGVJblBpcGUudHlwZSA/IG9sZFRyYW5zZm9ybWF0aW9ucy5jb25jYXQoe3JlZjogdHJhbnNmb3JtYXRpb24sIGlkOm5ld0lkfSk6IG9sZFRyYW5zZm9ybWF0aW9ucy5zbGljZSgwLCBvbGRUcmFuc2Zvcm1hdGlvbnMubGVuZ3RoIC0gMSkuY29uY2F0KHtyZWY6IHRyYW5zZm9ybWF0aW9uLCBpZDpuZXdJZH0pLmNvbmNhdChvbGRUcmFuc2Zvcm1hdGlvbnMuc2xpY2Uob2xkVHJhbnNmb3JtYXRpb25zLmxlbmd0aCAtIDEpKVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICBbdHJhbnNmb3JtYXRpb25dOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uW3RyYW5zZm9ybWF0aW9uXSxcclxuICAgICAgICAgICAgICAgIFtuZXdJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZToge3JlZjogJ3BpcGUnLCBpZDpuZXdQaXBlSWR9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24ucGlwZSxcclxuICAgICAgICAgICAgICAgIFtuZXdQaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcGlwZS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IFtdXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgW3BpcGVJZF06IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IG5ld1BpcGVUcmFuc2Zvcm1hdGlvbnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gUkVTRVRfQVBQX1NUQVRFKCkge1xyXG4gICAgICAgIGFwcC5zZXRDdXJyZW50U3RhdGUoYXBwLmNyZWF0ZURlZmF1bHRTdGF0ZSgpKVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZXZlbnRTdGFjazogW119KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gUkVTRVRfQVBQX0RFRklOSVRJT04oKSB7XHJcbiAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbiAhPT0gYXBwRGVmaW5pdGlvbil7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjogey4uLmFwcERlZmluaXRpb259fSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBGVUxMX1NDUkVFTl9DTElDS0VEKHZhbHVlKSB7XHJcbiAgICAgICAgaWYodmFsdWUgIT09IHN0YXRlLmZ1bGxTY3JlZW4pe1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7Li4uc3RhdGUsIGZ1bGxTY3JlZW46IHZhbHVlfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBTQVZFX0RFRkFVTFQoc3RhdGVJZCkge1xyXG4gICAgICAgIHNldFN0YXRlKHsuLi5zdGF0ZSwgZGVmaW5pdGlvbjp7XHJcbiAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgIHN0YXRlOiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgW3N0YXRlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IGFwcC5nZXRDdXJyZW50U3RhdGUoKVtzdGF0ZUlkXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfX0pXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBERUxFVEVfU1RBVEUoc3RhdGVJZCkge1xyXG4gICAgICAgIGxldCByZW1vdmVkUGlwZVN0YXRlID0gc3RhdGVcclxuICAgICAgICBPYmplY3Qua2V5cyhzdGF0ZS5kZWZpbml0aW9uLnBpcGUpLmZvckVhY2goKHBpcGVpZCk9PiB7XHJcbiAgICAgICAgICAgIGlmKHN0YXRlLmRlZmluaXRpb24ucGlwZVtwaXBlaWRdLnZhbHVlLmlkID09PSBzdGF0ZUlkKXtcclxuICAgICAgICAgICAgICAgIHJlbW92ZWRQaXBlU3RhdGUgPSByZXNldFBpcGVGdW5jKHBpcGVpZCwgcmVtb3ZlZFBpcGVTdGF0ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3Qge1tzdGF0ZUlkXTogZGVsZXRlZFN0YXRlLCAuLi5uZXdTdGF0ZX0gPSByZW1vdmVkUGlwZVN0YXRlLmRlZmluaXRpb24uc3RhdGVcclxuICAgICAgICBsZXQgZXZlbnRzID0gcmVtb3ZlZFBpcGVTdGF0ZS5kZWZpbml0aW9uLmV2ZW50XHJcbiAgICAgICAgZGVsZXRlZFN0YXRlLm11dGF0b3JzLmZvckVhY2goKG11dGF0b3JSZWYpPT57XHJcbiAgICAgICAgICAgIGNvbnN0IG11dGF0b3IgPSByZW1vdmVkUGlwZVN0YXRlLmRlZmluaXRpb25bbXV0YXRvclJlZi5yZWZdW211dGF0b3JSZWYuaWRdXHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbXV0YXRvci5ldmVudFxyXG4gICAgICAgICAgICBldmVudHMgPSB7XHJcbiAgICAgICAgICAgICAgICAuLi5ldmVudHMsXHJcbiAgICAgICAgICAgICAgICBbZXZlbnQuaWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZXZlbnRzW2V2ZW50LmlkXSxcclxuICAgICAgICAgICAgICAgICAgICBtdXRhdG9yczogZXZlbnRzW2V2ZW50LmlkXS5tdXRhdG9ycy5maWx0ZXIoKG11dFJlZik9PiBtdXRSZWYuaWQgIT09IG11dGF0b3JSZWYuaWQpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHNldFN0YXRlKHsuLi5yZW1vdmVkUGlwZVN0YXRlLFxyXG4gICAgICAgICAgICBzZWxlY3RlZFN0YXRlTm9kZUlkOiAnJyxcclxuICAgICAgICAgICAgZGVmaW5pdGlvbjp7XHJcbiAgICAgICAgICAgICAgICAuLi5yZW1vdmVkUGlwZVN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogbmV3U3RhdGUsXHJcbiAgICAgICAgICAgICAgICBuYW1lU3BhY2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5yZW1vdmVkUGlwZVN0YXRlLmRlZmluaXRpb24ubmFtZVNwYWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICdfcm9vdE5hbWVTcGFjZSc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4ucmVtb3ZlZFBpcGVTdGF0ZS5kZWZpbml0aW9uLm5hbWVTcGFjZVsnX3Jvb3ROYW1lU3BhY2UnXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IHJlbW92ZWRQaXBlU3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbJ19yb290TmFtZVNwYWNlJ10uY2hpbGRyZW4uZmlsdGVyKChyZWYpPT4gcmVmLmlkICE9PSBzdGF0ZUlkKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBldmVudDogZXZlbnRzXHJcbiAgICAgICAgICAgIH19KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gRVZFTlRfSE9WRVJFRChldmVudFJlZikge1xyXG4gICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgIGhvdmVyZWRFdmVudDogZXZlbnRSZWZcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gRVZFTlRfVU5IT1ZFUkVEKCkge1xyXG4gICAgICAgIGlmKHN0YXRlLmhvdmVyZWRFdmVudCl7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgaG92ZXJlZEV2ZW50OiBudWxsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gUElQRV9VTkhPVkVSRUQoKSB7XHJcbiAgICAgICAgaWYoc3RhdGUuaG92ZXJlZFBpcGUpe1xyXG4gICAgICAgICAgICBzZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIGhvdmVyZWRQaXBlOiBudWxsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gcmVzZXRQaXBlRnVuYyhwaXBlSWQsIHN0YXRlKXtcclxuICAgICAgICBjb25zdCBkZWZhdWx0VmFsdWVzID0ge1xyXG4gICAgICAgICAgICB0ZXh0OiAnRGVmYXVsdCB0ZXh0JyxcclxuICAgICAgICAgICAgbnVtYmVyOiAwLFxyXG4gICAgICAgICAgICBib29sZWFuOiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBwYXJlbnRKb2luSWQ7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoc3RhdGUuZGVmaW5pdGlvbi5qb2luKS5mb3JFYWNoKChqb2luSWQpID0+IHtcclxuICAgICAgICAgICAgaWYoc3RhdGUuZGVmaW5pdGlvbi5qb2luW2pvaW5JZF0udmFsdWUuaWQgPT09IHBpcGVJZCl7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRKb2luSWQgPSBqb2luSWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYocGFyZW50Sm9pbklkKXtcclxuICAgICAgICAgICAgY29uc3QgcGlwZXMgPSBPYmplY3Qua2V5cyhzdGF0ZS5kZWZpbml0aW9uLnBpcGUpXHJcbiAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGk8cGlwZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnRQaXBlSWQgPSBwaXBlc1tpXVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHN0YXRlLmRlZmluaXRpb24ucGlwZVtwYXJlbnRQaXBlSWRdLnRyYW5zZm9ybWF0aW9ucy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZWYgPSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGFyZW50UGlwZUlkXS50cmFuc2Zvcm1hdGlvbnNbaW5kZXhdXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZi5pZCA9PT0gcGFyZW50Sm9pbklkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpvaW5SZWYgPSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGFyZW50UGlwZUlkXS50cmFuc2Zvcm1hdGlvbnNbaW5kZXggKyAxXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWNvbmRQaXBlUmVmID0gc3RhdGUuZGVmaW5pdGlvbi5qb2luW2pvaW5SZWYuaWRdLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbc2Vjb25kUGlwZVJlZi5pZF0udmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRQaXBlSWQ6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGlwZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtwYXJlbnRQaXBlSWRdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGFyZW50UGlwZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGFyZW50UGlwZUlkXS52YWx1ZSArIHRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1hdGlvbnM6IHN0YXRlLmRlZmluaXRpb24ucGlwZVtwYXJlbnRQaXBlSWRdLnRyYW5zZm9ybWF0aW9ucy5zbGljZSgwLCBpbmRleCkuY29uY2F0KHN0YXRlLmRlZmluaXRpb24ucGlwZVtzZWNvbmRQaXBlUmVmLmlkXS50cmFuc2Zvcm1hdGlvbnMpLmNvbmNhdChzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGFyZW50UGlwZUlkXS50cmFuc2Zvcm1hdGlvbnMuc2xpY2UoaW5kZXggKyAyKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdGVkUGlwZUlkOiAnJyxcclxuICAgICAgICAgICAgICAgIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHBpcGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGlwZUlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlW3BpcGVJZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGVmYXVsdFZhbHVlc1tzdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZUlkXS50eXBlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIFJFU0VUX1BJUEUocGlwZUlkLGUpIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpXHJcblxyXG4gICAgICAgIHNldFN0YXRlKHJlc2V0UGlwZUZ1bmMocGlwZUlkLCBzdGF0ZSkpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBDSEFOR0VfVFJBTlNGT1JNQVRJT04ocGlwZVJlZiwgdHJhbnNmb3JtYXRpb25SZWYsIGluZGV4LCBlKSB7XHJcbiAgICAgICAgaWYodHJhbnNmb3JtYXRpb25SZWYucmVmID09PSBlLnRhcmdldC52YWx1ZSl7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB7W3RyYW5zZm9ybWF0aW9uUmVmLmlkXTogYWN0dWFsVHJhbnNmb3JtLCAuLi5sZWZ0fSA9IHN0YXRlLmRlZmluaXRpb25bdHJhbnNmb3JtYXRpb25SZWYucmVmXVxyXG4gICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgLi4uc3RhdGUsXHJcbiAgICAgICAgICAgIGRlZmluaXRpb246IHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgICAgICBwaXBlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbi5waXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIFtwaXBlUmVmLmlkXToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGF0ZS5kZWZpbml0aW9uLnBpcGVbcGlwZVJlZi5pZF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybWF0aW9uczogc3RhdGUuZGVmaW5pdGlvbi5waXBlW3BpcGVSZWYuaWRdLnRyYW5zZm9ybWF0aW9ucy5tYXAoKHRyYW5zZik9PiB0cmFuc2YuaWQgPT09IHRyYW5zZm9ybWF0aW9uUmVmLmlkID8ge3JlZjogZS50YXJnZXQudmFsdWUsIGlkOiB0cmFuc2Zvcm1hdGlvblJlZi5pZH06IHRyYW5zZilcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgW3RyYW5zZm9ybWF0aW9uUmVmLnJlZl06IGxlZnQsXHJcbiAgICAgICAgICAgICAgICBbZS50YXJnZXQudmFsdWVdOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uc3RhdGUuZGVmaW5pdGlvbltlLnRhcmdldC52YWx1ZV0sXHJcbiAgICAgICAgICAgICAgICAgICAgW3RyYW5zZm9ybWF0aW9uUmVmLmlkXTogYWN0dWFsVHJhbnNmb3JtXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gTkVYVF9UVVRPUklBTF9TVEVQKGUpe1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgIGlmKHN0YXRlLnR1dG9yaWFsU3RlcCA9PT0gMyl7XHJcbiAgICAgICAgICAgIHNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIC4uLnN0YXRlLFxyXG4gICAgICAgICAgICAgICAgdHV0b3JpYWxQYXNzZWQ6IHRydWVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAuLi5zdGF0ZSxcclxuICAgICAgICAgICAgdHV0b3JpYWxTdGVwOiBzdGF0ZS50dXRvcmlhbFN0ZXAgKyAxXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBib3hJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfX0sICdsYXllcnMnKVxyXG4gICAgY29uc3QgaWZJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfSwgc3R5bGU6IHt0cmFuc2Zvcm06ICdyb3RhdGUoOTBkZWcpJ319LCAnY2FsbF9zcGxpdCcpXHJcbiAgICBjb25zdCBudW1iZXJJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfX0sICdsb29rc19vbmUnKVxyXG4gICAgY29uc3QgbGlzdEljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ3ZpZXdfbGlzdCcpXHJcbiAgICBjb25zdCBpbnB1dEljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ2lucHV0JylcclxuICAgIGNvbnN0IHRleHRJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfX0sICd0ZXh0X2ZpZWxkcycpXHJcbiAgICBjb25zdCB0ZXh0UmV2ZXJzZUljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ2Zvcm1hdF9zaXplJylcclxuICAgIGNvbnN0IGRlbGV0ZUljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucycsICdkYXRhLXRyYXNoY2FuJzogdHJ1ZX19LCAnZGVsZXRlX2ZvcmV2ZXInKVxyXG4gICAgY29uc3QgY2xlYXJJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfX0sICdjbGVhcicpXHJcbiAgICBjb25zdCBjbG9zZUljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ2Nsb3NlJylcclxuICAgIGNvbnN0IGFkZENpcmNsZUljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ2FkZF9jaXJjbGUnKVxyXG4gICAgY29uc3QgZm9sZGVySWNvbiA9ICgpID0+IGgoJ2knLCB7YXR0cnM6IHtjbGFzczogJ21hdGVyaWFsLWljb25zJ319LCAnZm9sZGVyJylcclxuICAgIGNvbnN0IHNhdmVJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfX0sICdjaGVjaycpXHJcbiAgICBjb25zdCBpbWFnZUljb24gPSAoKSA9PiBoKCdpJywge2F0dHJzOiB7Y2xhc3M6ICdtYXRlcmlhbC1pY29ucyd9fSwgJ2ltYWdlJylcclxuICAgIGNvbnN0IHdhcm5pbmdJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfSwgc3R5bGU6IHtjdXJzb3I6ICdkZWZhdWx0J319LCAnd2hhdHNob3QnKSAvLyBwcmlvcml0eV9oaWdoXHJcbiAgICBjb25zdCBhcHBJY29uID0gKCkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnfSwgc3R5bGU6IHsgZm9udFNpemU6ICcxOHB4J319LCAnZGVzY3JpcHRpb24nKVxyXG4gICAgY29uc3QgYXJyb3dJY29uID0gKHJvdGF0ZSkgPT4gaCgnaScsIHthdHRyczoge2NsYXNzOiAnbWF0ZXJpYWwtaWNvbnMnLCAnZGF0YS1jbG9zZWFycm93JzogdHJ1ZX0sIHN0eWxlOiB7dHJhbnNpdGlvbjogJ2FsbCAwLjJzJywgdHJhbnNmb3JtOiByb3RhdGUgPyAncm90YXRlKC05MGRlZyknIDogJ3JvdGF0ZSgwZGVnKScsIGN1cnNvcjogJ3BvaW50ZXInfX0sICdleHBhbmRfbW9yZScpXHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0QXZhaWxhYmxlRXZlbnRzKHR5cGUpIHtcclxuICAgICAgICBsZXQgYXZhaWxhYmxlRXZlbnRzID0gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ29uIGNsaWNrJyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ2NsaWNrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2RvdWJsZSBjbGlja2VkJyxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogJ2RibGNsaWNrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ21vdXNlIG92ZXInLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAnbW91c2VvdmVyJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ21vdXNlIG91dCcsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6ICdtb3VzZW91dCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICd2Tm9kZUlucHV0Jykge1xyXG4gICAgICAgICAgICBhdmFpbGFibGVFdmVudHMgPSBhdmFpbGFibGVFdmVudHMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ2lucHV0JyxcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6ICdpbnB1dCdcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdmb2N1cycsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAnZm9jdXMnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnYmx1cicsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiAnYmx1cidcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhdmFpbGFibGVFdmVudHNcclxuICAgIH1cclxuICAgIGNvbnN0IGZpZWxkcyA9IHtcclxuICAgICAgICB2Tm9kZUJveDogWydzdHlsZScsICdjaGlsZHJlbicsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnZGJsY2xpY2snLCAnY2xpY2snXSxcclxuICAgICAgICB2Tm9kZVRleHQ6IFsnc3R5bGUnLCAndmFsdWUnLCAnbW91c2VvdXQnLCAnbW91c2VvdmVyJywgJ2RibGNsaWNrJywgJ2NsaWNrJ10sXHJcbiAgICAgICAgdk5vZGVJbnB1dDogWydzdHlsZScsICd2YWx1ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnZGJsY2xpY2snLCAnY2xpY2snLCAnaW5wdXQnLCAnZm9jdXMnLCAnYmx1ciddLFxyXG4gICAgICAgIHZOb2RlSWY6IFsndmFsdWUnLCAnY2hpbGRyZW4nXSxcclxuICAgICAgICB2Tm9kZUltYWdlOiBbJ3N0eWxlJywgJ3NyYycsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnZGJsY2xpY2snLCAnY2xpY2snXSxcclxuICAgICAgICBhZGQ6IFsndmFsdWUnXSxcclxuICAgICAgICBzdWJ0cmFjdDogWyd2YWx1ZSddLFxyXG4gICAgICAgIG11bHRpcGx5OiBbJ3ZhbHVlJ10sXHJcbiAgICAgICAgZGl2aWRlOiBbJ3ZhbHVlJ10sXHJcbiAgICAgICAgcmVtYWluZGVyOiBbJ3ZhbHVlJ10sXHJcbiAgICAgICAgam9pbjogWyd2YWx1ZSddLFxyXG4gICAgICAgIGFuZDogWyd2YWx1ZSddLFxyXG4gICAgICAgIG9yOiBbJ3ZhbHVlJ10sXHJcbiAgICAgICAgZXF1YWw6IFsndmFsdWUnXSxcclxuICAgICAgICBldmVudDogWydtdXRhdG9ycyddLFxyXG4gICAgICAgIG11dGF0b3I6IFsnbXV0YXRpb24nXSxcclxuICAgICAgICBzdHlsZTogWydiYWNrZ3JvdW5kJywgJ2JvcmRlcicsICdvdXRsaW5lJywgJ2N1cnNvcicsICdjb2xvcicsICd0cmFuc2l0aW9uJywgJ2Rpc3BsYXknLCAndG9wJywgJ2JvdHRvbScsICdsZWZ0JywgJ2ZsZXgnLCAnanVzdGlmeUNvbnRlbnQnLCAnYWxpZ25JdGVtcycsICd3aWR0aCcsICdoZWlnaHQnLCAnbWF4V2lkdGgnLCAnbWF4SGVpZ2h0JywgJ21pbldpZHRoJywgJ21pbkhlaWdodCcsICdyaWdodCcsICdwb3NpdGlvbicsICdvdmVyZmxvdycsICdmb250JywgJ21hcmdpbicsICdwYWRkaW5nJ10sXHJcbiAgICAgICAgc3RhdGU6IFtdLFxyXG4gICAgICAgIGxlbmd0aDogW10sXHJcbiAgICAgICAgdG9Mb3dlckNhc2U6IFtdLFxyXG4gICAgICAgIHRvVXBwZXJDYXNlOiBbXSxcclxuICAgICAgICBwaXBlOiBbJ3ZhbHVlJywgJ3RyYW5zZm9ybWF0aW9ucyddLFxyXG4gICAgfVxyXG4gICAgY29uc3QgbWVtb2l6ZWRSZWZzID0ge31cclxuICAgIGZ1bmN0aW9uIGxvb2tGb3JTZWxlY3RlZFN0YXRlKG5vZGVSZWYpe1xyXG4gICAgICAgIC8vIGNoZWNrIGlmIG5vZGUgd2FzIG1lbW9pemVkLCBoYXMgbm90IGNoYW5nZWQgKGltbXV0YWJsZSByZWZlcmVuY2UpIGFuZCBoYXMgYW4gYW5zd2VyIGZvciBzZWxldGVkIHN0YXRlXHJcbiAgICAgICAgaWYobWVtb2l6ZWRSZWZzW25vZGVSZWYuaWRdICYmIG1lbW9pemVkUmVmc1tub2RlUmVmLmlkXS5zdGF0ZURlZmluaXRpb24gPT09IHN0YXRlLmRlZmluaXRpb24gJiYgbWVtb2l6ZWRSZWZzW25vZGVSZWYuaWRdLmlzQ2xvc2VkID09PSBzdGF0ZS52aWV3Rm9sZGVyc0Nsb3NlZFtub2RlUmVmLmlkXSAmJiBtZW1vaXplZFJlZnNbbm9kZVJlZi5pZF1bc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZF0gIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHJldHVybiBtZW1vaXplZFJlZnNbbm9kZVJlZi5pZF1bc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY2hlY2sgZGF0YSwgc3R5bGUsIGV2ZW50IG11dGF0aW9uc1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gKCgpPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZVJlZi5pZF1cclxuICAgICAgICAgICAgY29uc3QgZmllbGRzVG9DaGVjayA9IGZpZWxkc1tub2RlUmVmLnJlZl1cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWVsZHNUb0NoZWNrLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBmaWVsZHNUb0NoZWNrW2ldXHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZVtmaWVsZE5hbWVdID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVbZmllbGROYW1lXS5pZCA9PT0gc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCkgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgIC8vIHRyYW5zZm9ybWF0aW9ucywgY2hpbGRyZW4sIG11dGF0b3JzXHJcbiAgICAgICAgICAgICAgICBpZiAoKGZpZWxkTmFtZSA9PT0gJ2NoaWxkcmVuJyAmJiBzdGF0ZS52aWV3Rm9sZGVyc0Nsb3NlZFtub2RlUmVmLmlkXSkgfHwgZmllbGROYW1lID09PSAnbXV0YXRvcnMnIHx8IGZpZWxkTmFtZSA9PT0gJ3RyYW5zZm9ybWF0aW9ucycpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5vZGVbZmllbGROYW1lXS5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9va0ZvclNlbGVjdGVkU3RhdGUobm9kZVtmaWVsZE5hbWVdW2pdKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChub2RlW2ZpZWxkTmFtZV0ucmVmKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvb2tGb3JTZWxlY3RlZFN0YXRlKG5vZGVbZmllbGROYW1lXSkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfSkoKVxyXG4gICAgICAgIG1lbW9pemVkUmVmc1tub2RlUmVmLmlkXSA9IHtcclxuICAgICAgICAgICAgLi4ubWVtb2l6ZWRSZWZzW25vZGVSZWYuaWRdLFxyXG4gICAgICAgICAgICBzdGF0ZURlZmluaXRpb246IHN0YXRlLmRlZmluaXRpb24sXHJcbiAgICAgICAgICAgIGlzQ2xvc2VkOiBzdGF0ZS52aWV3Rm9sZGVyc0Nsb3NlZFtub2RlUmVmLmlkXSxcclxuICAgICAgICAgICAgW3N0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWRdOiB2YWx1ZSxcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRSdW5uaW5nU3RhdGUgPSBhcHAuZ2V0Q3VycmVudFN0YXRlKClcclxuICAgICAgICBjb25zdCBkcmFnQ29tcG9uZW50TGVmdCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93bjogW1dJRFRIX0RSQUdHRUQsICdlZGl0b3JMZWZ0V2lkdGgnXSxcclxuICAgICAgICAgICAgICAgIHRvdWNoc3RhcnQ6IFtXSURUSF9EUkFHR0VELCAnZWRpdG9yTGVmdFdpZHRoJ10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDEwMCUpJyxcclxuICAgICAgICAgICAgICAgIHRvcDogJzAnLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxMHB4JyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMWVtJyxcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6ICcwJyxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogJ2NvbC1yZXNpemUnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3Qgb3BlbkNvbXBvbmVudExlZnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtPUEVOX1NJREVCQVIsICdsZWZ0J10sXHJcbiAgICAgICAgICAgICAgICB0b3VjaHN0YXJ0OiBbT1BFTl9TSURFQkFSLCAnbGVmdCddLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICByaWdodDogJy0zcHgnLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnNTAlJyxcclxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCkgdHJhbnNsYXRlWCgxMDAlKSB0cmFuc2xhdGVZKC01MCUpJyxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMCUnLFxyXG4gICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMWVtJyxcclxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzAgNXB4IDVweCAwJyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNWQ1ZDVkJyxcclxuICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJ2luc2V0IDAgMCAycHggN3B4ICMyMjInLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBvcGVuQ29tcG9uZW50UmlnaHQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtPUEVOX1NJREVCQVIsICdyaWdodCddLFxyXG4gICAgICAgICAgICAgICAgdG91Y2hzdGFydDogW09QRU5fU0lERUJBUiwgJ3JpZ2h0J10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICctM3B4JyxcclxuICAgICAgICAgICAgICAgIHRvcDogJzUwJScsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApIHRyYW5zbGF0ZVgoLTEwMCUpIHRyYW5zbGF0ZVkoLTUwJSknLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6ICcxNXB4JyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzEwJScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxZW0nLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNXB4IDAgMCA1cHgnLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM1ZDVkNWQnLFxyXG4gICAgICAgICAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMCAwIDJweCA3cHggIzIyMicsXHJcbiAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRyYWdDb21wb25lbnRSaWdodCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93bjogW1dJRFRIX0RSQUdHRUQsICdlZGl0b3JSaWdodFdpZHRoJ10sXHJcbiAgICAgICAgICAgICAgICB0b3VjaHN0YXJ0OiBbV0lEVEhfRFJBR0dFRCwgJ2VkaXRvclJpZ2h0V2lkdGgnXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgbGVmdDogJzAnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtMTAwJSknLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxZW0nLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogJzAnLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAnY29sLXJlc2l6ZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBkcmFnU3ViQ29tcG9uZW50UmlnaHQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246IFtXSURUSF9EUkFHR0VELCAnc3ViRWRpdG9yV2lkdGgnXSxcclxuICAgICAgICAgICAgICAgIHRvdWNoc3RhcnQ6IFtXSURUSF9EUkFHR0VELCAnc3ViRWRpdG9yV2lkdGgnXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgcmlnaHQ6ICcycHgnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgxMDAlKScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiAnMTBweCcsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogJzFlbScsXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgICAgICAgICAgY3Vyc29yOiAnY29sLXJlc2l6ZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBkcmFnU3ViQ29tcG9uZW50TGVmdCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgIG1vdXNlZG93bjogW1dJRFRIX0RSQUdHRUQsICdzdWJFZGl0b3JXaWR0aExlZnQnXSxcclxuICAgICAgICAgICAgICAgIHRvdWNoc3RhcnQ6IFtXSURUSF9EUkFHR0VELCAnc3ViRWRpdG9yV2lkdGhMZWZ0J10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICcycHgnLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtMTAwJSknLFxyXG4gICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxZW0nLFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgICAgIGN1cnNvcjogJ2NvbC1yZXNpemUnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGVtYmVyRWRpdG9yKHJlZil7XHJcbiAgICAgICAgICAgIGNvbnN0IHBpcGUgPSBzdGF0ZS5kZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGxpc3RUcmFuc2Zvcm1hdGlvbnModHJhbnNmb3JtYXRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNmb3JtYXRpb25zLm1hcCgodHJhbnNSZWYsIGluZGV4KT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVyID0gc3RhdGUuZGVmaW5pdGlvblt0cmFuc1JlZi5yZWZdW3RyYW5zUmVmLmlkXVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc1JlZi5yZWYgPT09ICdlcXVhbCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdUb3A6ICc1cHgnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogJyNiZGJkYmQnLCBjdXJzb3I6ICdkZWZhdWx0JywgZGlzcGxheTonaW5saW5lLWJsb2NrJ319LCBbaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCB0cmFuc1JlZi5yZWYpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1ibG9jayd9fSwgIFtlbWJlckVkaXRvcih0cmFuc2Zvcm1lci52YWx1ZSldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNSZWYucmVmID09PSAnam9pbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ3NwYW4nLCB7fSwgW2VtYmVyRWRpdG9yKHRyYW5zZm9ybWVyLnZhbHVlKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc1JlZi5yZWYgPT09ICdsZW5ndGgnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nVG9wOiAnNXB4J319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtjdXJzb3I6ICdkZWZhdWx0J319LCBbaCgnc3BhbicsIHtzdHlsZToge2NvbG9yOiAnI2JkYmRiZCd9fSwgdHJhbnNSZWYucmVmKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbnVtYmVyVHJhbnNmID0gW3t0aXRsZTogJ2FkZCcsIHNpZ246ICcrJ30sIHt0aXRsZTogJ3N1YnRyYWN0Jywgc2lnbjogJy0nfSwge3RpdGxlOiAnbXVsdGlwbHknLCBzaWduOiAnKid9LCB7dGl0bGU6ICdkaXZpZGUnLCBzaWduOiAnLyd9LCB7dGl0bGU6ICdyZW1haW5kZXInLCBzaWduOiAnJSd9XVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRUcmFuc2YgPSBbe3RpdGxlOiAndG9VcHBlckNhc2UnLCBzaWduOiAndG8gdXBwZXIgY2FzZSd9LCB7dGl0bGU6ICd0b0xvd2VyQ2FzZScsIHNpZ246ICd0byBsb3dlciBjYXNlJ31dXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYm9vbFRyYW5zZiA9IFt7dGl0bGU6ICdhbmQnLCBzaWduOiAnYW5kJ30sIHt0aXRsZTogJ29yJywgc2lnbjogJ29yJ31dXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc1JlZi5yZWYgPT09ICdhZGQnIHx8IHRyYW5zUmVmLnJlZiA9PT0gJ3N1YnRyYWN0JyB8fCB0cmFuc1JlZi5yZWYgPT09ICdtdWx0aXBseScgfHwgdHJhbnNSZWYucmVmID09PSAnZGl2aWRlJyB8fCB0cmFuc1JlZi5yZWYgPT09ICdyZW1haW5kZXInKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nVG9wOiAnNXB4JywgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnc3RyZXRjaCd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc2VsZWN0Jywge2xpdmVQcm9wczoge3ZhbHVlOiB0cmFuc1JlZi5yZWZ9LCBzdHlsZToge2NvbG9yOiAnd2hpdGUnLCBiYWNrZ3JvdW5kOiAnbm9uZScsIG91dGxpbmU6ICdub25lJywgZGlzcGxheTogJ2lubGluZScsIGJvcmRlcjogJ25vbmUnLH0sIG9uOiB7aW5wdXQ6IFtDSEFOR0VfVFJBTlNGT1JNQVRJT04sIHJlZiwgdHJhbnNSZWYsIGluZGV4XX19LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlclRyYW5zZi5tYXAoKGRlc2NyaXB0aW9uKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdvcHRpb24nLCB7YXR0cnM6IHt2YWx1ZTogZGVzY3JpcHRpb24udGl0bGV9LCBzdHlsZToge2NvbG9yOiAnYmxhY2snfX0sIGRlc2NyaXB0aW9uLnNpZ24pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7Y29sb3I6ICcjYmRiZGJkJywgZGlzcGxheTogJ2ZsZXgnLCAgY3Vyc29yOiAnZGVmYXVsdCcsIHBhZGRpbmdSaWdodDogJzVweCcsIGJvcmRlclJpZ2h0OiAnMnB4IHNvbGlkICNiZGJkYmQnLCBtYXJnaW5SaWdodDogJzVweCd9fSwgW2goJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSwpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1ibG9jayd9fSwgIFtlbWJlckVkaXRvcih0cmFuc2Zvcm1lci52YWx1ZSldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNSZWYucmVmID09PSAndG9VcHBlckNhc2UnIHx8IHRyYW5zUmVmLnJlZiA9PT0gJ3RvTG93ZXJDYXNlJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ1RvcDogJzVweCcsIGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ3N0cmV0Y2gnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NlbGVjdCcsIHtsaXZlUHJvcHM6IHt2YWx1ZTogdHJhbnNSZWYucmVmfSwgc3R5bGU6IHtjb2xvcjogJ3doaXRlJywgYmFja2dyb3VuZDogJ25vbmUnLCBvdXRsaW5lOiAnbm9uZScsIGRpc3BsYXk6ICdpbmxpbmUnLCBib3JkZXI6ICdub25lJyx9LCBvbjoge2lucHV0OiBbQ0hBTkdFX1RSQU5TRk9STUFUSU9OLCByZWYsIHRyYW5zUmVmLCBpbmRleF19fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0VHJhbnNmLm1hcCgoZGVzY3JpcHRpb24pID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ29wdGlvbicsIHthdHRyczoge3ZhbHVlOiBkZXNjcmlwdGlvbi50aXRsZX0sIHN0eWxlOiB7Y29sb3I6ICdibGFjayd9fSwgZGVzY3JpcHRpb24uc2lnbiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogJyNiZGJkYmQnLCBkaXNwbGF5OiAnZmxleCcsICBjdXJzb3I6ICdkZWZhdWx0JywgcGFkZGluZ1JpZ2h0OiAnNXB4JywgbWFyZ2luUmlnaHQ6ICc1cHgnfX0sIFtoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnfX0sKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNSZWYucmVmID09PSAnYW5kJyB8fCB0cmFuc1JlZi5yZWYgPT09ICdvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmdUb3A6ICc1cHgnLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdzdHJldGNoJ319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzZWxlY3QnLCB7bGl2ZVByb3BzOiB7dmFsdWU6IHRyYW5zUmVmLnJlZn0sIHN0eWxlOiB7Y29sb3I6ICd3aGl0ZScsIGJhY2tncm91bmQ6ICdub25lJywgb3V0bGluZTogJ25vbmUnLCBkaXNwbGF5OiAnaW5saW5lJywgYm9yZGVyOiAnbm9uZScsfSwgb246IHtpbnB1dDogW0NIQU5HRV9UUkFOU0ZPUk1BVElPTiwgcmVmLCB0cmFuc1JlZiwgaW5kZXhdfX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9vbFRyYW5zZi5tYXAoKGRlc2NyaXB0aW9uKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdvcHRpb24nLCB7YXR0cnM6IHt2YWx1ZTogZGVzY3JpcHRpb24udGl0bGV9LCBzdHlsZToge2NvbG9yOiAnYmxhY2snfX0sIGRlc2NyaXB0aW9uLnNpZ24pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7Y29sb3I6ICcjYmRiZGJkJywgZGlzcGxheTogJ2ZsZXgnLCAgY3Vyc29yOiAnZGVmYXVsdCcsIHBhZGRpbmdSaWdodDogJzVweCcsIGJvcmRlclJpZ2h0OiAnMnB4IHNvbGlkICNiZGJkYmQnLCBtYXJnaW5SaWdodDogJzVweCd9fSwgW2goJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSwpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1ibG9jayd9fSwgIFtlbWJlckVkaXRvcih0cmFuc2Zvcm1lci52YWx1ZSldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGlwZS52YWx1ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6e2Rpc3BsYXk6J2ZsZXgnLCBhbGlnbkl0ZW1zOiAnYmFzZWxpbmUnfSwgb246IHtjbGljazogW1NFTEVDVF9QSVBFLCByZWYuaWRdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAgMCBhdXRvJywgcG9zaXRpb246ICdyZWxhdGl2ZScsIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCknfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge29wYWNpdHk6ICcwJywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIHdoaXRlU3BhY2U6ICdwcmUnLCBwYWRkaW5nOiAnMCA1cHggMnB4IDVweCcsIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB3aGl0ZSd9fSwgcGlwZS52YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2lucHV0Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6ICdpbmhlcml0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4OiAnMCAwIGF1dG8nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXQ6IFtDSEFOR0VfU1RBVElDX1ZBTFVFLCByZWYsICd2YWx1ZScsICd0ZXh0J10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW91c2Vtb3ZlOiBbUElQRV9IT1ZFUkVELCByZWZdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBbUElQRV9VTkhPVkVSRURdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpdmVQcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwaXBlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgLi4ubGlzdFRyYW5zZm9ybWF0aW9ucyhwaXBlLnRyYW5zZm9ybWF0aW9ucywgcGlwZS50eXBlKSxcclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChwaXBlLnZhbHVlID09PSB0cnVlIHx8IHBpcGUudmFsdWUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaCgnc2VsZWN0Jywge2xpdmVQcm9wczoge3ZhbHVlOiAgcGlwZS52YWx1ZS50b1N0cmluZygpfSwgc3R5bGU6IHt9LCAgb246IHtjbGljazogW1NFTEVDVF9QSVBFLCByZWYuaWRdLCBpbnB1dDogW0NIQU5HRV9TVEFUSUNfVkFMVUUsIHJlZiwgJ3ZhbHVlJywgJ2Jvb2xlYW4nXSwgbW91c2Vtb3ZlOiBbUElQRV9IT1ZFUkVELCByZWZdLCBtb3VzZW91dDogW1BJUEVfVU5IT1ZFUkVEXX19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnb3B0aW9uJywge2F0dHJzOiB7dmFsdWU6ICd0cnVlJ30sIHN0eWxlOiB7Y29sb3I6ICdibGFjayd9fSwgWyd0cnVlJ10pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ29wdGlvbicsIHthdHRyczoge3ZhbHVlOiAnZmFsc2UnfSwgc3R5bGU6IHtjb2xvcjogJ2JsYWNrJ319LCBbJ2ZhbHNlJ10pLFxyXG4gICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KE51bWJlcihwaXBlLnZhbHVlKSkpICYmIGlzRmluaXRlKE51bWJlcihwaXBlLnZhbHVlKSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6e2Rpc3BsYXk6J2ZsZXgnLCBhbGlnbkl0ZW1zOiAnYmFzZWxpbmUnfSwgb246IHtjbGljazogW1NFTEVDVF9QSVBFLCByZWYuaWRdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAgMCBhdXRvJywgcG9zaXRpb246ICdyZWxhdGl2ZScsIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCknfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge29wYWNpdHk6ICcwJywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIHdoaXRlU3BhY2U6ICdwcmUnLCBwYWRkaW5nOiAnMCA1cHggMnB4IDVweCcsIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB3aGl0ZSd9fSwgTnVtYmVyKHBpcGUudmFsdWUpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnaW5wdXQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyczoge3R5cGU6J251bWJlcid9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRsaW5lOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJCb3R0b206ICcycHggc29saWQgd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogJzAgMCBhdXRvJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX1NUQVRJQ19WQUxVRSwgcmVmLCAndmFsdWUnLCAnbnVtYmVyJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW91c2Vtb3ZlOiBbUElQRV9IT1ZFUkVELCByZWZdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBbUElQRV9VTkhPVkVSRURdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpdmVQcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBOdW1iZXIocGlwZS52YWx1ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAuLi5saXN0VHJhbnNmb3JtYXRpb25zKHBpcGUudHJhbnNmb3JtYXRpb25zLCBwaXBlLnR5cGUpLFxyXG4gICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYocGlwZS52YWx1ZS5yZWYgPT09ICdzdGF0ZScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGxTdGF0ZSA9IHN0YXRlLmRlZmluaXRpb25bcGlwZS52YWx1ZS5yZWZdW3BpcGUudmFsdWUuaWRdXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzEnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6e2Rpc3BsYXk6J2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJ30sIG9uOiB7Y2xpY2s6IFtTRUxFQ1RfUElQRSwgcmVmLmlkXSwgbW91c2Vtb3ZlOiBbUElQRV9IT1ZFUkVELCByZWZdLCBtb3VzZW91dDogW1BJUEVfVU5IT1ZFUkVEXSx9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7d2hpdGVTcGFjZTogJ25vd3JhcCcsZmxleDogJzAgMCBhdXRvJywgZGlzcGxheTogJ2lubGluZS1ibG9jaycsIHBvc2l0aW9uOiAncmVsYXRpdmUnLCB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJywgYm94U2hhZG93OiAnaW5zZXQgMCAwIDAgMnB4ICcgKyAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gcGlwZS52YWx1ZS5pZD8gJyNlYWI2NWMnOiAnIzgyODI4MicpICwgYmFja2dyb3VuZDogJyM0NDQnLCBwYWRkaW5nOiAnNHB4IDdweCcsfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogJ3doaXRlJywgZGlzcGxheTogJ2lubGluZS1ibG9jayd9LCBvbjoge2NsaWNrOiBbU1RBVEVfTk9ERV9TRUxFQ1RFRCwgcGlwZS52YWx1ZS5pZF19fSwgZGlzcGxTdGF0ZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFBpcGVJZCA9PT0gcmVmLmlkID8gaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwIDAgYXV0bycsIG1hcmdpbkxlZnQ6ICdhdXRvJ30sIG9uOiB7Y2xpY2s6IFtBRERfREVGQVVMVF9UUkFOU0ZPUk1BVElPTiwgc3RhdGUuc2VsZWN0ZWRQaXBlSWRdfX0sIFthZGRDaXJjbGVJY29uKCldKTogaCgnc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFBpcGVJZCA9PT0gcmVmLmlkID8gaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwIDAgYXV0bycsfSwgb246IHtjbGljazogW1JFU0VUX1BJUEUsIHJlZi5pZF19fSwgW2RlbGV0ZUljb24oKV0pOiBoKCdzcGFuJyksXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIC4uLmxpc3RUcmFuc2Zvcm1hdGlvbnMocGlwZS50cmFuc2Zvcm1hdGlvbnMsIHBpcGUudHlwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgLy9oKCdkaXYnLCBzdGF0ZS5zZWxlY3RlZFBpcGVJZCA9PT0gcmVmLmlkID8gZ2VuVHJhbnNmb3JtYXRvcnMoKTogW10pXHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihwaXBlLnZhbHVlLnJlZiA9PT0gJ2V2ZW50RGF0YScpe1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnREYXRhID0gc3RhdGUuZGVmaW5pdGlvbltwaXBlLnZhbHVlLnJlZl1bcGlwZS52YWx1ZS5pZF1cclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCBbaCgnZGl2Jywge3N0eWxlOntkaXNwbGF5OidmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcid9LCBvbjoge2NsaWNrOiBbU0VMRUNUX1BJUEUsIHJlZi5pZF19fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2ZsZXg6ICcxJ319LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBbaCgnZGl2Jyx7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHsgY3Vyc29yOiAncG9pbnRlcicsIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBwaXBlLnZhbHVlLmlkID8gJyNlYWI2NWMnOiAnd2hpdGUnLCBwYWRkaW5nOiAnMnB4IDVweCcsIG1hcmdpbjogJzNweCAzcHggMCAwJywgYm9yZGVyOiAnMnB4IHNvbGlkICcgKyAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gcGlwZS52YWx1ZS5pZCA/ICcjZWFiNjVjJzogJ3doaXRlJyksIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge2NsaWNrOiBbU1RBVEVfTk9ERV9TRUxFQ1RFRCwgcGlwZS52YWx1ZS5pZF19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2V2ZW50RGF0YS50aXRsZV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ0xlZnQ6ICcxNXB4J319LCBsaXN0VHJhbnNmb3JtYXRpb25zKHBpcGUudHJhbnNmb3JtYXRpb25zLCBwaXBlLnR5cGUpKSxcclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxpc3RTdGF0ZShzdGF0ZUlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGVJZF1cclxuICAgICAgICAgICAgZnVuY3Rpb24gZWRpdGluZ05vZGUoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaCgnaW5wdXQnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxpbmU6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzRweCA3cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6ICdpbmhlcml0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogJzAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6ICcwIDAgYXV0bycsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dDogW0NIQU5HRV9TVEFURV9OT0RFX1RJVExFLCBzdGF0ZUlkXSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGxpdmVQcm9wczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3VycmVudFN0YXRlLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtaXN0aXRsZWVkaXRvcic6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzE0cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtkaXNwbGF5OiAnZmxleCcsIGZsZXhXcmFwOiAnd3JhcCcsIG1hcmdpblRvcDogJzZweCd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAgMCBhdXRvJywgIHBvc2l0aW9uOiAncmVsYXRpdmUnLCB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJywgbWFyZ2luOiAnMCA3cHggMCAwJywgIGJveFNoYWRvdzogJ2luc2V0IDAgMCAwIDJweCAnICsgKHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyAnI2VhYjY1Yyc6ICcjODI4MjgyJykgLCBiYWNrZ3JvdW5kOiAnIzQ0NCcsIHBhZGRpbmc6ICc0cHggN3B4Jyx9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge29wYWNpdHk6IHN0YXRlLmVkaXRpbmdUaXRsZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICcwJzogJzEnLCBjb2xvcjogJ3doaXRlJywgZGlzcGxheTogJ2lubGluZS1ibG9jayd9LCBvbjoge21vdXNlZG93bjogW1NUQVRFX0RSQUdHRUQsIHN0YXRlSWRdLCB0b3VjaHN0YXJ0OiBbU1RBVEVfRFJBR0dFRCwgc3RhdGVJZF0sIHRvdWNobW92ZTogW0hPVkVSX01PQklMRV0sIGRibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIHN0YXRlSWRdfX0sIGN1cnJlbnRTdGF0ZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IHN0YXRlSWQgPyBlZGl0aW5nTm9kZSgpOiBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub1N0eWxlSW5wdXQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGN1cnJlbnRSdW5uaW5nU3RhdGVbc3RhdGVJZF0gIT09IHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGVJZF0uZGVmYXVsdFZhbHVlID8gJ3JnYig5MSwgMjA0LCA5MSknIDogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6ICcxJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzUwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJ2luc2V0IDAgLTJweCAwIDAgJyArIChzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJyNlYWI2NWMnOiAnIzgyODI4MicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50U3RhdGUudHlwZSA9PT0gJ3RleHQnKSByZXR1cm4gaCgnaW5wdXQnLCB7YXR0cnM6IHt0eXBlOiAndGV4dCd9LCBsaXZlUHJvcHM6IHt2YWx1ZTogY3VycmVudFJ1bm5pbmdTdGF0ZVtzdGF0ZUlkXX0sIHN0eWxlOiBub1N0eWxlSW5wdXQsIG9uOiB7aW5wdXQ6IFtDSEFOR0VfQ1VSUkVOVF9TVEFURV9URVhUX1ZBTFVFLCBzdGF0ZUlkXX19KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY3VycmVudFN0YXRlLnR5cGUgPT09ICdudW1iZXInKSByZXR1cm4gaCgnaW5wdXQnLCB7YXR0cnM6IHt0eXBlOiAnbnVtYmVyJ30sIGxpdmVQcm9wczoge3ZhbHVlOiBjdXJyZW50UnVubmluZ1N0YXRlW3N0YXRlSWRdfSwgc3R5bGU6IG5vU3R5bGVJbnB1dCwgIG9uOiB7aW5wdXQ6IFtDSEFOR0VfQ1VSUkVOVF9TVEFURV9OVU1CRVJfVkFMVUUsIHN0YXRlSWRdfX0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihjdXJyZW50U3RhdGUudHlwZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm4gaCgnc2VsZWN0Jywge2xpdmVQcm9wczoge3ZhbHVlOiBjdXJyZW50UnVubmluZ1N0YXRlW3N0YXRlSWRdLnRvU3RyaW5nKCl9LCBzdHlsZTogbm9TdHlsZUlucHV0LCAgb246IHtpbnB1dDogW0NIQU5HRV9DVVJSRU5UX1NUQVRFX1RFWFRfVkFMVUUsIHN0YXRlSWRdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdvcHRpb24nLCB7YXR0cnM6IHt2YWx1ZTogJ3RydWUnfSwgc3R5bGU6IHtjb2xvcjogJ2JsYWNrJ319LCBbJ3RydWUnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnb3B0aW9uJywge2F0dHJzOiB7dmFsdWU6ICdmYWxzZSd9LCBzdHlsZToge2NvbG9yOiAnYmxhY2snfX0sIFsnZmFsc2UnXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoY3VycmVudFN0YXRlLnR5cGUgPT09ICd0YWJsZScpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkICE9PSBzdGF0ZUlkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtrZXk6ICdpY29uJyxvbjoge2NsaWNrOiBbU1RBVEVfTk9ERV9TRUxFQ1RFRCwgc3RhdGVJZF19LCBzdHlsZToge2Rpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIG1hcmdpblRvcDogJzdweCd9fSwgW2xpc3RJY29uKCldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWJsZSA9IGN1cnJlbnRSdW5uaW5nU3RhdGVbc3RhdGVJZF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogJ3RhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM4MjgxODMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxleDogJzAgMCAxMDAlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2Rpc3BsYXk6ICdmbGV4J319LCAgT2JqZWN0LmtleXMoY3VycmVudFN0YXRlLmRlZmluaXRpb24pLm1hcChrZXkgPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzEnLCBwYWRkaW5nOiAnMnB4IDVweCcsIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB3aGl0ZSd9fSwga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5PYmplY3Qua2V5cyh0YWJsZSkubWFwKGlkID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTogJ2ZsZXgnfX0sIE9iamVjdC5rZXlzKHRhYmxlW2lkXSkubWFwKGtleSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMScsIHBhZGRpbmc6ICcycHggNXB4J319LCB0YWJsZVtpZF1ba2V5XSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50UnVubmluZ1N0YXRlW3N0YXRlSWRdICE9PSBzdGF0ZS5kZWZpbml0aW9uLnN0YXRlW3N0YXRlSWRdLmRlZmF1bHRWYWx1ZSA/IGgoJ2RpdicsIHtzdHlsZToge2Rpc3BsYXk6ICdpbmxpbmUtZmxleCcsIGFsaWduU2VsZjogJ2NlbnRlcid9LCBvbjoge2NsaWNrOiBbU0FWRV9ERUZBVUxULCBzdGF0ZUlkXX19LCBbc2F2ZUljb24oKV0pOiBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IHN0YXRlSWQgPyBoKCdkaXYnLCB7c3R5bGU6IHtjb2xvcjogJyNlYWI2NWMnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnLCBhbGlnblNlbGY6ICdjZW50ZXInfSwgb246IHtjbGljazogW0RFTEVURV9TVEFURSwgc3RhdGVJZF19fSwgW2RlbGV0ZUljb24oKV0pOiBoKCdzcGFuJylcclxuICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RhdGUubXV0YXRvcnMubWFwKG11dGF0b3JSZWYgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtdXRhdG9yID0gc3RhdGUuZGVmaW5pdGlvblttdXRhdG9yUmVmLnJlZl1bbXV0YXRvclJlZi5pZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBzdGF0ZS5kZWZpbml0aW9uW211dGF0b3IuZXZlbnQucmVmXVttdXRhdG9yLmV2ZW50LmlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlbWl0dGVyID0gc3RhdGUuZGVmaW5pdGlvbltldmVudC5lbWl0dGVyLnJlZl1bZXZlbnQuZW1pdHRlci5pZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNDQ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdUb3A6ICczcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0JvdHRvbTogJzNweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gZXZlbnQuZW1pdHRlci5pZCA/ICcjNTNCMkVEJzogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICcwLjJzIGFsbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5XaWR0aDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBvbjoge2NsaWNrOiBbVklFV19OT0RFX1NFTEVDVEVELCBldmVudC5lbWl0dGVyXX19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAgMCBhdXRvJywgbWFyZ2luOiAnMCAzcHggMCA1cHgnLCBkaXNwbGF5OiAnaW5saW5lLWZsZXgnfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5lbWl0dGVyLnJlZiA9PT0gJ3ZOb2RlQm94JyA/IGJveEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmVtaXR0ZXIucmVmID09PSAndk5vZGVMaXN0JyA/IGxpc3RJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuZW1pdHRlci5yZWYgPT09ICd2Tm9kZUxpc3QnID8gaWZJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmVtaXR0ZXIucmVmID09PSAndk5vZGVJbnB1dCcgPyBpbnB1dEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRJY29uKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnNSA1IGF1dG8nLCBtYXJnaW46ICcwIDVweCAwIDAnLCBtaW5XaWR0aDogJzAnLCBvdmVyZmxvdzogJ2hpZGRlbicsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcyd9fSwgZW1pdHRlci50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzAgMCBhdXRvJywgbWFyZ2luTGVmdDogJ2F1dG8nLCBtYXJnaW5SaWdodDogJzVweCcsIGNvbG9yOiAnIzViY2M1Yid9fSwgZXZlbnQudHlwZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZha2VTdGF0ZShzdGF0ZUlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTdGF0ZSA9IHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGVJZF1cclxuICAgICAgICAgICAgcmV0dXJuIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMCAwIGF1dG8nLCAgcG9zaXRpb246ICdyZWxhdGl2ZScsIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVooMCknLCBtYXJnaW46ICc3cHggN3B4IDAgMCcsICBib3hTaGFkb3c6ICdpbnNldCAwIDAgMCAycHggJyArIChzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkID09PSBzdGF0ZUlkID8gJyNlYWI2NWMnOiAnIzgyODI4MicpICwgYmFja2dyb3VuZDogJyM0NDQnLCBwYWRkaW5nOiAnNHB4IDdweCcsfX0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogJ3doaXRlJywgZGlzcGxheTogJ2lubGluZS1ibG9jayd9fSwgY3VycmVudFN0YXRlLnRpdGxlKSxcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlQ29tcG9uZW50ID0gaCgnZGl2JywgeyBhdHRyczoge2NsYXNzOiAnYmV0dGVyLXNjcm9sbGJhcid9LCBzdHlsZToge292ZXJmbG93OiAnYXV0bycsIGZsZXg6ICcxJywgcGFkZGluZzogJzAgMTBweCd9LCBvbjoge2NsaWNrOiBbVU5TRUxFQ1RfU1RBVEVfTk9ERV19fSwgc3RhdGUuZGVmaW5pdGlvbi5uYW1lU3BhY2VbJ19yb290TmFtZVNwYWNlJ10uY2hpbGRyZW4ubWFwKChyZWYpPT4gbGlzdFN0YXRlKHJlZi5pZCkpKVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBsaXN0Tm9kZShub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoKXtcclxuICAgICAgICAgICAgaWYobm9kZVJlZi5pZCA9PT0gJ19yb290Tm9kZScpIHJldHVybiBsaXN0Um9vdE5vZGUobm9kZVJlZilcclxuICAgICAgICAgICAgaWYobm9kZVJlZi5yZWYgPT09ICd2Tm9kZVRleHQnKSByZXR1cm4gc2ltcGxlTm9kZShub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoKVxyXG4gICAgICAgICAgICBpZihub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlSW1hZ2UnKSByZXR1cm4gc2ltcGxlTm9kZShub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoKVxyXG4gICAgICAgICAgICBpZihub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlQm94JyB8fCBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlTGlzdCcgfHwgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUlmJykgcmV0dXJuIGxpc3RCb3hOb2RlKG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGgpXHJcbiAgICAgICAgICAgIGlmKG5vZGVSZWYucmVmID09PSAndk5vZGVJbnB1dCcpIHJldHVybiBzaW1wbGVOb2RlKG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBwcmV2ZW50X2J1YmJsaW5nKGUpIHtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBlZGl0aW5nTm9kZShub2RlUmVmKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBoKCdpbnB1dCcsIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjZweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnIzUzQjJFRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZsZXg6ICcxJyxcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiAnaW5zZXQgMCAtMXB4IDAgMCAjNTNCMkVEJyxcclxuICAgICAgICAgICAgICAgICAgICBmb250OiAnaW5oZXJpdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQ6ICcycHgnLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2Vkb3duOiBwcmV2ZW50X2J1YmJsaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0OiBbQ0hBTkdFX1ZJRVdfTk9ERV9USVRMRSwgbm9kZVJlZl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgbGl2ZVByb3BzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHN0YXRlLmRlZmluaXRpb25bbm9kZVJlZi5yZWZdW25vZGVSZWYuaWRdLnRpdGxlLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGF0dHJzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLWlzdGl0bGVlZGl0b3InOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBsaXN0Um9vdE5vZGUobm9kZVJlZikge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSWQgPSBub2RlUmVmLmlkXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdXHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQ6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nUmlnaHQ6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzQ0NCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclRvcDogJzJweCBzb2xpZCAjNGQ0ZDRkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMnB4IHNvbGlkICMzMzMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNnB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb246IHttb3VzZW1vdmU6IFtWSUVXX0hPVkVSRUQsIG5vZGVSZWYsIHt9LCAxXSwgdG91Y2htb3ZlOiBbSE9WRVJfTU9CSUxFXX1cclxuICAgICAgICAgICAgICAgICAgICB9LCAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge2tleTogbm9kZUlkLCBzdHlsZToge2NvbG9yOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICcjYmRiZGJkJywgZGlzcGxheTogJ2lubGluZS1mbGV4J30sIG9uOiB7Y2xpY2s6IFtWSUVXX05PREVfU0VMRUNURUQsIG5vZGVSZWZdfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcEljb24oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZWRpdGluZ1RpdGxlTm9kZUlkID09PSBub2RlSWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUobm9kZVJlZik6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywgeyBzdHlsZToge2ZsZXg6ICcxJywgY3Vyc29yOiAncG9pbnRlcicsIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZScsIHRyYW5zaXRpb246ICdjb2xvciAwLjJzJywgcGFkZGluZ0xlZnQ6ICcycHgnfSwgb246IHtjbGljazogW1ZJRVdfTk9ERV9TRUxFQ1RFRCwgbm9kZVJlZl0sIGRibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIG5vZGVJZF19fSwgbm9kZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywgc3RhdGUuaG92ZXJlZFZpZXdOb2RlICYmIHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wYXJlbnQuaWQgPT09IG5vZGVJZCAmJiAhKG5vZGUuY2hpbGRyZW4uZmluZEluZGV4KChyZWYpPT4gcmVmLmlkID09PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCkgPT09IHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wb3NpdGlvbikgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvcHkgcGFzdGVkIGZyb20gbGlzdEJveE5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9sZFBvc2l0aW9uID0gbm9kZS5jaGlsZHJlbi5maW5kSW5kZXgoKHJlZik9PiByZWYuaWQgPT09IHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3LmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3UG9zaXRpb24gPSBvbGRQb3NpdGlvbiA9PT0gLTEgfHwgc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uIDwgb2xkUG9zaXRpb24gPyBzdGF0ZS5ob3ZlcmVkVmlld05vZGUucG9zaXRpb24gOiBzdGF0ZS5ob3ZlcmVkVmlld05vZGUucG9zaXRpb24gKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW4ubWFwKChyZWYpPT5saXN0Tm9kZShyZWYsIG5vZGVSZWYsIDEpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuLnNsaWNlKDAsIG5ld1Bvc2l0aW9uKS5jb25jYXQoc3BhY2VyQ29tcG9uZW50KCksIGNoaWxkcmVuLnNsaWNlKG5ld1Bvc2l0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5tYXAoKHJlZik9Pmxpc3ROb2RlKHJlZiwgbm9kZVJlZiwgMSkpXHJcbiAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0xlZnQ6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ1JpZ2h0OiAnOHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb246IHttb3VzZW1vdmU6IFtWSUVXX0hPVkVSRUQsIHtpZDogJ19sYXN0Tm9kZSd9LCB7fSwgMV0sIHRvdWNobW92ZTogW0hPVkVSX01PQklMRV19fVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGxpc3RCb3hOb2RlKG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGgpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gbm9kZVJlZi5pZFxyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXVxyXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BhY2l0eTogc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcgJiYgc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcuaWQgPT09IG5vZGVJZCA/ICcwLjUnIDogJzEuMCcsXHJcbiAgICAgICAgICAgICAgICB9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBub2RlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcyNnB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogKGRlcHRoIC0gKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCB8fCAoc3RhdGUuaG92ZXJlZFZpZXdOb2RlICYmIHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wYXJlbnQuaWQgPT09IG5vZGVJZCkgPyAxOiAwKSkgKjIwICsgOCsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdSaWdodDogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzQ0NCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6ICcycHggc29saWQgIzRkNGQ0ZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJCb3R0b206ICcycHggc29saWQgIzMzMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICd3aGl0ZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb246IHttb3VzZWRvd246IFtWSUVXX0RSQUdHRUQsIG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGhdLCB0b3VjaHN0YXJ0OiBbVklFV19EUkFHR0VELCBub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoXSwgbW91c2Vtb3ZlOiBbVklFV19IT1ZFUkVELCBub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoXSwgdG91Y2htb3ZlOiBbSE9WRVJfTU9CSUxFXX19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCB8fCAoc3RhdGUuaG92ZXJlZFZpZXdOb2RlICYmIHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wYXJlbnQuaWQgPT09IG5vZGVJZCkgPyBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1mbGV4J319LCBbYXJyb3dJY29uKHN0YXRlLnZpZXdGb2xkZXJzQ2xvc2VkW25vZGVJZF0gfHwgKHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3ICYmIG5vZGVJZCA9PT0gc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcuaWQpKV0pOiBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7a2V5OiBub2RlSWQsIHN0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1mbGV4JywgY29sb3I6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJyNiZGJkYmQnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4ycyd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUJveCcgPyBib3hJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVSZWYucmVmID09PSAndk5vZGVMaXN0JyA/IGxpc3RJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZkljb24oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZWRpdGluZ1RpdGxlTm9kZUlkID09PSBub2RlSWQgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGluZ05vZGUobm9kZVJlZik6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywgeyBzdHlsZToge2ZsZXg6ICcxJywgY3Vyc29yOiAncG9pbnRlcicsIHRyYW5zaXRpb246ICdjb2xvciAwLjJzJywgcGFkZGluZ0xlZnQ6ICcycHgnLCBvdmVyZmxvdzogJ2hpZGRlbicsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCB0ZXh0T3ZlcmZsb3c6ICdlbGxpcHNpcyd9LCBvbjoge2RibGNsaWNrOiBbRURJVF9WSUVXX05PREVfVElUTEUsIG5vZGVJZF19fSwgbm9kZS50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2NvbG9yOiAnIzUzQjJFRCcsIGN1cnNvcjogJ3BvaW50ZXInLCBkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnaW5saW5lLWZsZXgnOiAnbm9uZScsIGZsZXg6ICcwIDAgYXV0byd9fSwgW2RlbGV0ZUljb24oKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtjb2xvcjogJyNlYWI2NWMnLCBkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFN0YXRlTm9kZUlkICYmIGxvb2tGb3JTZWxlY3RlZFN0YXRlKG5vZGVSZWYpID8gJ2lubGluZS1mbGV4JzogJ25vbmUnLCBmbGV4OiAnMCAwIGF1dG8nfX0sIFt3YXJuaW5nSWNvbigpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHsgZGlzcGxheTogc3RhdGUudmlld0ZvbGRlcnNDbG9zZWRbbm9kZUlkXSB8fCAoc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcgJiYgbm9kZUlkID09PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCkgPyAnbm9uZSc6ICdibG9jayd9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBzdGF0ZS5ob3ZlcmVkVmlld05vZGUgJiYgc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBhcmVudC5pZCA9PT0gbm9kZUlkICYmICEobm9kZS5jaGlsZHJlbi5maW5kSW5kZXgoKHJlZik9PiByZWYuaWQgPT09IHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3LmlkKSA9PT0gc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uKSA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZGRzIGEgZmFrZSBjb21wb25lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3NpdGlvbiA9IG5vZGUuY2hpbGRyZW4uZmluZEluZGV4KChyZWYpPT4gcmVmLmlkID09PSBzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50Vmlldy5pZCkgLy8gdGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB3ZSBzdGlsbCBzaG93IHRoZSBvbGQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gb2xkUG9zaXRpb24gPT09IC0xIHx8IHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5wb3NpdGlvbiA8IG9sZFBvc2l0aW9uID8gc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uIDogc3RhdGUuaG92ZXJlZFZpZXdOb2RlLnBvc2l0aW9uICsgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkcmVuID0gbm9kZS5jaGlsZHJlbi5tYXAoKHJlZik9Pmxpc3ROb2RlKHJlZiwgbm9kZVJlZiwgZGVwdGgrMSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuLnNsaWNlKDAsIG5ld1Bvc2l0aW9uKS5jb25jYXQoc3BhY2VyQ29tcG9uZW50KCksIGNoaWxkcmVuLnNsaWNlKG5ld1Bvc2l0aW9uKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKCk6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNoaWxkcmVuLm1hcCgocmVmKT0+bGlzdE5vZGUocmVmLCBub2RlUmVmLCBkZXB0aCsxKSlcclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNpbXBsZU5vZGUobm9kZVJlZiwgcGFyZW50UmVmLCBkZXB0aCkge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSWQgPSBub2RlUmVmLmlkXHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBzdGF0ZS5kZWZpbml0aW9uW25vZGVSZWYucmVmXVtub2RlSWRdXHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5OiBub2RlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3ICYmIHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3LmlkID09PSBub2RlSWQgPyAnMC41JyA6ICcxLjAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMjZweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdMZWZ0OiBkZXB0aCAqMjAgKyA4ICsncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nUmlnaHQ6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzQ0NCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclRvcDogJzJweCBzb2xpZCAjNGQ0ZDRkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMnB4IHNvbGlkICMzMzMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJyNiZGJkYmQnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHttb3VzZWRvd246IFtWSUVXX0RSQUdHRUQsIG5vZGVSZWYsIHBhcmVudFJlZiwgZGVwdGhdLCB0b3VjaHN0YXJ0OiBbVklFV19EUkFHR0VELCBub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoXSwgZGJsY2xpY2s6IFtFRElUX1ZJRVdfTk9ERV9USVRMRSwgbm9kZUlkXSwgbW91c2Vtb3ZlOiBbVklFV19IT1ZFUkVELCBub2RlUmVmLCBwYXJlbnRSZWYsIGRlcHRoXSwgdG91Y2htb3ZlOiBbSE9WRVJfTU9CSUxFXX1cclxuICAgICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgICAgICBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlSW5wdXQnID8gaW5wdXRJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlSW1hZ2UnID8gaW1hZ2VJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEljb24oKSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5lZGl0aW5nVGl0bGVOb2RlSWQgPT09IG5vZGVJZCA/XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRpbmdOb2RlKG5vZGVSZWYpOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnLCBjb2xvcjogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gbm9kZUlkID8gJyM1M0IyRUQnOiAnd2hpdGUnLCB0cmFuc2l0aW9uOiAnY29sb3IgMC4ycycsIHBhZGRpbmdMZWZ0OiAnMnB4Jywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnfX0sIG5vZGUudGl0bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2NvbG9yOiAnIzUzQjJFRCcsIGN1cnNvcjogJ3BvaW50ZXInLCBkaXNwbGF5OiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnaW5saW5lLWZsZXgnOiAnbm9uZScsIGZsZXg6ICcwIDAgYXV0byd9fSwgW2RlbGV0ZUljb24oKV0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2NvbG9yOiAnI2VhYjY1YycsIGRpc3BsYXk6IHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgJiYgbG9va0ZvclNlbGVjdGVkU3RhdGUobm9kZVJlZikgPyAnaW5saW5lLWZsZXgnOiAnbm9uZScsIGZsZXg6ICcwIDAgYXV0byd9fSwgW3dhcm5pbmdJY29uKCldKSxcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3BhY2VyQ29tcG9uZW50KCl7XHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBrZXk6ICdzcGFjZXInLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc2cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogJ2luc2V0IDAgMCAxcHggMXB4ICM1M0IyRUQnLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZmFrZUNvbXBvbmVudChub2RlUmVmLCBkZXB0aCwpIHtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUlkID0gbm9kZVJlZi5pZFxyXG4gICAgICAgICAgICBjb25zdCBub2RlID0gc3RhdGUuZGVmaW5pdGlvbltub2RlUmVmLnJlZl1bbm9kZUlkXVxyXG4gICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ19mYWtlJytub2RlSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246ICdwYWRkaW5nLWxlZnQgMC4ycycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzI2cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogKGRlcHRoIC0gKG5vZGUuY2hpbGRyZW4gJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwID8gMTogMCkpICoyMCArIDggKydweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdSaWdodDogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICdyZ2JhKDY4LDY4LDY4LDAuOCknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBib3JkZXJUb3A6ICcycHggc29saWQgIzRkNGQ0ZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCAjMzMzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLmlkID09PSBub2RlSWQgPyAnIzUzQjJFRCc6ICcjYmRiZGJkJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgICAgIChub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlQm94JyB8fCBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlTGlzdCcgfHwgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUlmJykgJiYgbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwICA/IGFycm93SWNvbih0cnVlKTogaCgnc3BhbicsIHtrZXk6ICdfZmFrZVNwYW4nK25vZGVJZH0pLFxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVSZWYucmVmID09PSAndk5vZGVCb3gnID8gYm94SWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUxpc3QnID8gbGlzdEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlUmVmLnJlZiA9PT0gJ3ZOb2RlSWYnID8gaWZJY29uKCk6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUlucHV0JyA/IGlucHV0SWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZVJlZi5yZWYgPT09ICd2Tm9kZUltYWdlJyA/IGltYWdlSWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRJY29uKCksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJywgY29sb3I6IHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09IG5vZGVJZCA/ICcjNTNCMkVEJzogJ3doaXRlJywgdHJhbnNpdGlvbjogJ2NvbG9yIDAuMnMnLCBwYWRkaW5nTGVmdDogJzJweCcsIG92ZXJmbG93OiAnaGlkZGVuJywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIHRleHRPdmVyZmxvdzogJ2VsbGlwc2lzJ319LCBub2RlLnRpdGxlKSxcclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVFZGl0Tm9kZUNvbXBvbmVudCgpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3R5bGVzID0gZmllbGRzLnN0eWxlXHJcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkTm9kZSA9IHN0YXRlLmRlZmluaXRpb25bc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWZdW3N0YXRlLnNlbGVjdGVkVmlld05vZGUuaWRdXHJcblxyXG4gICAgICAgICAgICBjb25zdCBwcm9wc0NvbXBvbmVudCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ3Byb3BzJyA/ICcjNGQ0ZDRkJzogJyMzZDNkM2QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxMHB4IDAnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZsZXg6ICcxJyxcclxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtTRUxFQ1RfVklFV19TVUJNRU5VLCAncHJvcHMnXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAnZGF0YScpXHJcbiAgICAgICAgICAgIGNvbnN0IHN0eWxlQ29tcG9uZW50ID0gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAnc3R5bGUnID8gJyM0ZDRkNGQnOiAnIzNkM2QzZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzEwcHggMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZmxleDogJzEnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclJpZ2h0OiAnMXB4IHNvbGlkICMyMjInLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckxlZnQ6ICcxcHggc29saWQgIzIyMicsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbU0VMRUNUX1ZJRVdfU1VCTUVOVSwgJ3N0eWxlJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgJ3N0eWxlJylcclxuICAgICAgICAgICAgY29uc3QgZXZlbnRzQ29tcG9uZW50ID0gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAnZXZlbnRzJyA/ICcjNGQ0ZDRkJzogJyMzZDNkM2QnLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxMHB4IDAnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZsZXg6ICcxJyxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtTRUxFQ1RfVklFV19TVUJNRU5VLCAnZXZlbnRzJ11cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgJ2V2ZW50cycpXHJcblxyXG4gICAgICAgICAgICBjb25zdCBnZW5wcm9wc1N1Ym1lbnVDb21wb25lbnQgPSAoKSA9PiBoKCdkaXYnLCBbKCgpPT57XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUJveCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogJzEwMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnI2JkYmRiZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sICdubyBkYXRhIHJlcXVpcmVkJylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlVGV4dCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7b3ZlcmZsb3c6ICdhdXRvJ30sIGF0dHJzOiB7XCJjbGFzc1wiOiAnYmV0dGVyLXNjcm9sbGJhcid9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzY3Njc2NycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzVweCAxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Cb3R0b206ICcxMHB4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnfX0sICd0ZXh0IHZhbHVlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogJyNiZGJkYmQnfX0sICd0ZXh0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCd9fSwgW2VtYmVyRWRpdG9yKHNlbGVjdGVkTm9kZS52YWx1ZSwgJ3RleHQnKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlSW1hZ2UnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge292ZXJmbG93OiAnYXV0byd9LCBhdHRyczoge1wiY2xhc3NcIjogJ2JldHRlci1zY3JvbGxiYXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM2NzY3NjcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc1cHggMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCAnc291cmNlICh1cmwpJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogJyNiZGJkYmQnfX0sICd0ZXh0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCd9fSwgW2VtYmVyRWRpdG9yKHNlbGVjdGVkTm9kZS5zcmMsICd0ZXh0JyldKVxyXG4gICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUlucHV0Jykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7c3R5bGU6IHtvdmVyZmxvdzogJ2F1dG8nfSwgYXR0cnM6IHtcImNsYXNzXCI6ICdiZXR0ZXItc2Nyb2xsYmFyJ319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNjc2NzY3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNXB4IDEwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzEwcHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMSd9fSwgJ2lucHV0IHZhbHVlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogJyNiZGJkYmQnfX0sICd0ZXh0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCd9fSwgW2VtYmVyRWRpdG9yKHNlbGVjdGVkTm9kZS52YWx1ZSwgJ3RleHQnKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlTGlzdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaCgnZGl2Jywge3N0eWxlOiB7b3ZlcmZsb3c6ICdhdXRvJ30sIGF0dHJzOiB7XCJjbGFzc1wiOiAnYmV0dGVyLXNjcm9sbGJhcid9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzY3Njc2NycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzVweCAxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Cb3R0b206ICcxMHB4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzEnfX0sICd0YWJsZScpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzAnLCBjdXJzb3I6ICdkZWZhdWx0JywgY29sb3I6ICcjYmRiZGJkJ319LCAndGFibGUnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZzogJzVweCAxMHB4J319LCBbZW1iZXJFZGl0b3Ioc2VsZWN0ZWROb2RlLnZhbHVlLCAndGFibGUnKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlSWYnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge292ZXJmbG93OiAnYXV0byd9LCBhdHRyczoge1wiY2xhc3NcIjogJ2JldHRlci1zY3JvbGxiYXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM2NzY3NjcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc1cHggMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCAncHJlZGljYXRlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCcsIGN1cnNvcjogJ2RlZmF1bHQnLCBjb2xvcjogJyNiZGJkYmQnfX0sICd0cnVlL2ZhbHNlJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3BhZGRpbmc6ICc1cHggMTBweCd9fSwgW2VtYmVyRWRpdG9yKHNlbGVjdGVkTm9kZS52YWx1ZSwgJ2Jvb2xlYW4nKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkoKV0pXHJcbiAgICAgICAgICAgIGNvbnN0IGdlbnN0eWxlU3VibWVudUNvbXBvbmVudCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkU3R5bGUgPSBzdGF0ZS5kZWZpbml0aW9uLnN0eWxlW3NlbGVjdGVkTm9kZS5zdHlsZS5pZF1cclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7YXR0cnM6IHtjbGFzczogJ2JldHRlci1zY3JvbGxiYXInfSwgc3R5bGU6IHtvdmVyZmxvdzogJ2F1dG8nfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLHsgc3R5bGU6IHtwYWRkaW5nOiAnMTBweCcsIGZvbnRGYW1pbHk6IFwiJ0NvbWZvcnRhYScsIHNhbnMtc2VyaWZcIiwgIGNvbG9yOiAnI2JkYmRiZCd9fSwgJ3N0eWxlIHBhbmVsIHdpbGwgY2hhbmdlIGEgbG90IGluIDEuMHYsIHJpZ2h0IG5vdyBpdFxcJ3MganVzdCBDU1MnKSxcclxuICAgICAgICAgICAgICAgICAgICAuLi5PYmplY3Qua2V5cyhzZWxlY3RlZFN0eWxlKS5tYXAoKGtleSkgPT4gaCgnZGl2Jywge3N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM2NzY3NjcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc1cHggMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luQm90dG9tOiAnMTBweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcxJ319LCBrZXkpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZmxleDogJzAnLCBjdXJzb3I6ICdkZWZhdWx0JywgY29sb3I6ICcjYmRiZGJkJ319LCAndGV4dCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtwYWRkaW5nOiAnNXB4IDEwcHgnfX0sIFtlbWJlckVkaXRvcihzZWxlY3RlZFN0eWxlW2tleV0sICd0ZXh0JyldKSxcclxuICAgICAgICAgICAgICAgICAgICBdKSksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7IHBhZGRpbmc6ICc1cHggMTBweCcsIGZvbnRGYW1pbHk6IFwiJ0NvbWZvcnRhYScsIHNhbnMtc2VyaWZcIiwgIGNvbG9yOiAnI2JkYmRiZCd9fSwgJ2FkZCBTdHlsZTonKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHsgcGFkZGluZzogJzVweCAwIDVweCAxMHB4J319LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGtleSkgPT4gIU9iamVjdC5rZXlzKHNlbGVjdGVkU3R5bGUpLmluY2x1ZGVzKGtleSkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChrZXkpID0+IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbjoge2NsaWNrOiBbQUREX0RFRkFVTFRfU1RZTEUsIHNlbGVjdGVkTm9kZS5zdHlsZS5pZCwga2V5XX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzNweCBzb2xpZCB3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICc1cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6ICc1cHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgJysgJyArIGtleSkpXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBnZW5ldmVudHNTdWJtZW51Q29tcG9uZW50ID0gKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZUV2ZW50cyA9IGdldEF2YWlsYWJsZUV2ZW50cyhzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZilcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFdmVudHMgPSBhdmFpbGFibGVFdmVudHMuZmlsdGVyKChldmVudCkgPT4gc2VsZWN0ZWROb2RlW2V2ZW50LnByb3BlcnR5TmFtZV0pXHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudHNMZWZ0ID0gYXZhaWxhYmxlRXZlbnRzLmZpbHRlcigoZXZlbnQpID0+ICFzZWxlY3RlZE5vZGVbZXZlbnQucHJvcGVydHlOYW1lXSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7YXR0cnM6IHtjbGFzczogJ2JldHRlci1zY3JvbGxiYXInfSwgc3R5bGU6IHtvdmVyZmxvdzogJ2F1dG8nfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLi4uKGN1cnJlbnRFdmVudHMubGVuZ3RoID9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRFdmVudHMubWFwKChldmVudERlc2MpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHN0YXRlLmRlZmluaXRpb25bc2VsZWN0ZWROb2RlW2V2ZW50RGVzYy5wcm9wZXJ0eU5hbWVdLnJlZl1bc2VsZWN0ZWROb2RlW2V2ZW50RGVzYy5wcm9wZXJ0eU5hbWVdLmlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge2JhY2tncm91bmQ6ICcjNjc2NzY3JywgcGFkZGluZzogJzVweCAxMHB4J30sIG9uOiB7bW91c2Vtb3ZlOiBbRVZFTlRfSE9WRVJFRCwgc2VsZWN0ZWROb2RlW2V2ZW50RGVzYy5wcm9wZXJ0eU5hbWVdXSwgbW91c2VvdXQ6IFtFVkVOVF9VTkhPVkVSRURdfX0sIGV2ZW50LnR5cGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudERlc2MuZGVzY3JpcHRpb24gPT09ICdpbnB1dCcgPyBoKCdkaXYnLHsgc3R5bGU6IHtwYWRkaW5nOiAnMTBweCAxMHB4IDAgMTBweCcsIGZvbnRGYW1pbHk6IFwiJ0NvbWZvcnRhYScsIHNhbnMtc2VyaWZcIiwgIGNvbG9yOiAnI2JkYmRiZCd9fSwgJ0hleSwgaW5wdXQgaXMgdXNpbmcgZXZlbnQgZGF0YSwgYnV0IHdlIGFyZSBjdXJyZW50bHkgd29ya2luZyBvbiB0aGlzIHBhcnQuIFNvbWUgZnVuY3Rpb25hbGl0eSBtaWdodCBzdGlsbCBiZSBtaXNzaW5nJykgOiBoKCdzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnY29sb3IgMC4ycycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNXB4IDEwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIGV2ZW50Lm11dGF0b3JzLm1hcChtdXRhdG9yUmVmID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtdXRhdG9yID0gc3RhdGUuZGVmaW5pdGlvblttdXRhdG9yUmVmLnJlZl1bbXV0YXRvclJlZi5pZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0ZURlZiA9IHN0YXRlLmRlZmluaXRpb25bbXV0YXRvci5zdGF0ZS5yZWZdW211dGF0b3Iuc3RhdGUuaWRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge21hcmdpblRvcDogJzEwcHgnLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwIDAgYXV0bycsIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCBwb3NpdGlvbjogJ3JlbGF0aXZlJywgdHJhbnNmb3JtOiAndHJhbnNsYXRlWigwKScsIGJveFNoYWRvdzogJ2luc2V0IDAgMCAwIDJweCAnICsgKHN0YXRlLnNlbGVjdGVkU3RhdGVOb2RlSWQgPT09IG11dGF0b3Iuc3RhdGUuaWQgPyAnI2VhYjY1Yyc6ICcjODI4MjgyJykgLCBiYWNrZ3JvdW5kOiAnIzQ0NCcsIHBhZGRpbmc6ICc0cHggN3B4Jyx9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2NvbG9yOiAnd2hpdGUnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30sIG9uOiB7Y2xpY2s6IFtTVEFURV9OT0RFX1NFTEVDVEVELCBtdXRhdG9yLnN0YXRlLmlkXX19LCBzdGF0ZURlZi50aXRsZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7Y29sb3I6ICd3aGl0ZScsIGZvbnRTaXplOiAnMS44ZW0nLCBwYWRkaW5nOiAnMTBweCd9fSwgJz0nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1iZXJFZGl0b3IobXV0YXRvci5tdXRhdGlvbiwgc3RhdGVEZWYudHlwZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZTogeyBwYWRkaW5nOiAnNXB4IDEwcHgnLCBmb250RmFtaWx5OiBcIidDb21mb3J0YWEnLCBzYW5zLXNlcmlmXCIsICBjb2xvcjogJyNiZGJkYmQnfX0sICdhZGQgRXZlbnQ6JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsICB7c3R5bGU6IHsgcGFkZGluZzogJzVweCAwIDVweCAxMHB4J319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5ldmVudHNMZWZ0Lm1hcCgoZXZlbnQpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnM3B4IHNvbGlkICM1YmNjNWInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnNXB4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbjogJzEwcHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIG9uOiB7Y2xpY2s6IFtBRERfRVZFTlQsIGV2ZW50LnByb3BlcnR5TmFtZSwgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZV19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgJysgJyArIGV2ZW50LmRlc2NyaXB0aW9uKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZnVsbFZOb2RlID0gWyd2Tm9kZUJveCcsJ3ZOb2RlVGV4dCcsICd2Tm9kZUltYWdlJywgJ3ZOb2RlSW5wdXQnXS5pbmNsdWRlcyhzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZilcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbnQ6IFwiMzAwIDEuMmVtICdPcGVuIFNhbnMnXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZUhlaWdodDogJzEuMmVtJyxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0OiBzdGF0ZS5jb21wb25lbnRFZGl0b3JQb3NpdGlvbi54ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICAgICB0b3A6IHN0YXRlLmNvbXBvbmVudEVkaXRvclBvc2l0aW9uLnkgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzUwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogJzMwMDAnLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMScsIGRpc3BsYXk6ICdmbGV4JywgbWFyZ2luQm90dG9tOiAnMTBweCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBiYWNrZ3JvdW5kOiAnIzRkNGQ0ZCcsIHdpZHRoOiBzdGF0ZS5zdWJFZGl0b3JXaWR0aCArICdweCcsIGJvcmRlcjogJzNweCBzb2xpZCAjMjIyJ319LFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtmbGV4OiAnMCAwIGF1dG8nLH19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjMjIyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmdUb3A6ICcycHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZ0JvdHRvbTogJzVweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogJyM1M0IyRUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluV2lkdGg6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vdXNlZG93bjogW0NPTVBPTkVOVF9WSUVXX0RSQUdHRURdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG91Y2hzdGFydDogW0NPTVBPTkVOVF9WSUVXX0RSQUdHRURdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LH0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMCAwIGF1dG8nLCBtYXJnaW46ICcwIDJweCAwIDVweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnNlbGVjdGVkVmlld05vZGUuaWQgPT09ICdfcm9vdE5vZGUnID8gYXBwSWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUJveCcgPyBib3hJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUxpc3QnID8gbGlzdEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUxpc3QnID8gaWZJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA9PT0gJ3ZOb2RlSW5wdXQnID8gaW5wdXRJY29uKCkgOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5yZWYgPT09ICd2Tm9kZUltYWdlJyA/IGltYWdlSWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0SWNvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZmxleDogJzUgNSBhdXRvJywgbWFyZ2luOiAnMCA1cHggMCAwJywgbWluV2lkdGg6ICcwJywgb3ZlcmZsb3c6ICdoaWRkZW4nLCB3aGl0ZVNwYWNlOiAnbm93cmFwJywgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLCBmb250U2l6ZTogJzAuOGVtJ319LCBzZWxlY3RlZE5vZGUudGl0bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwIDAgYXV0bycsIG1hcmdpbkxlZnQ6ICdhdXRvJywgY3Vyc29yOiAncG9pbnRlcicsIG1hcmdpblJpZ2h0OiAnNXB4JywgY29sb3I6ICd3aGl0ZScsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCd9LCBvbjoge21vdXNlZG93bjogW1VOU0VMRUNUX1ZJRVdfTk9ERSwgZmFsc2UsIHRydWVdLCB0b3VjaHN0YXJ0OiBbVU5TRUxFQ1RfVklFV19OT0RFLCBmYWxzZSwgdHJ1ZV19fSwgW2NsZWFySWNvbigpXSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICAgICAgZnVsbFZOb2RlID8gaCgnZGl2Jywge3N0eWxlOiB7IGRpc3BsYXk6ICdmbGV4JywgZmxleDogJzAgMCBhdXRvJywgZm9udEZhbWlseTogXCInQ29tZm9ydGFhJywgc2Fucy1zZXJpZlwifX0sIFtwcm9wc0NvbXBvbmVudCwgc3R5bGVDb21wb25lbnQsIGV2ZW50c0NvbXBvbmVudF0pIDogaCgnc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgIGRyYWdTdWJDb21wb25lbnRSaWdodCxcclxuICAgICAgICAgICAgICAgICAgICBkcmFnU3ViQ29tcG9uZW50TGVmdCxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFZpZXdTdWJNZW51ID09PSAncHJvcHMnIHx8ICFmdWxsVk5vZGUgPyBnZW5wcm9wc1N1Ym1lbnVDb21wb25lbnQoKTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ3N0eWxlJyA/IGdlbnN0eWxlU3VibWVudUNvbXBvbmVudCgpOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2VsZWN0ZWRWaWV3U3ViTWVudSA9PT0gJ2V2ZW50cycgPyBnZW5ldmVudHNTdWJtZW51Q29tcG9uZW50KCk6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsICdFcnJvciwgbm8gc3VjaCBtZW51JylcclxuICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgIF0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhZGRTdGF0ZUNvbXBvbmVudCA9IGgoJ2RpdicsIHtzdHlsZTogeyBmbGV4OiAnMCBhdXRvJywgbWFyZ2luTGVmdDogc3RhdGUucmlnaHRPcGVuID8gJy0xMHB4JzogJzAnLCBib3JkZXI6ICczcHggc29saWQgIzIyMicsIGJvcmRlclJpZ2h0OiAnbm9uZScsIGJhY2tncm91bmQ6ICcjMzMzJywgaGVpZ2h0OiAnNDBweCcsIGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcid9fSwgW1xyXG4gICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7IGZvbnRGYW1pbHk6IFwiJ0NvbWZvcnRhYScsIHNhbnMtc2VyaWZcIiwgZm9udFNpemU6ICcwLjllbScsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnMCA1cHgnfX0sICdhZGQgc3RhdGU6ICcpLFxyXG4gICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7ZGlzcGxheTogJ2lubGluZS1ibG9jayd9LCBvbjoge2NsaWNrOiBbQUREX1NUQVRFLCAnX3Jvb3ROYW1lU3BhY2UnLCAndGV4dCddfX0sIFt0ZXh0SWNvbigpXSksXHJcbiAgICAgICAgICAgIGgoJ3NwYW4nLCB7b246IHtjbGljazogW0FERF9TVEFURSwgJ19yb290TmFtZVNwYWNlJywgJ251bWJlciddfX0sIFtudW1iZXJJY29uKCldKSxcclxuICAgICAgICAgICAgaCgnc3BhbicsIHtvbjoge2NsaWNrOiBbQUREX1NUQVRFLCAnX3Jvb3ROYW1lU3BhY2UnLCAnYm9vbGVhbiddfX0sIFtpZkljb24oKV0pLFxyXG4gICAgICAgICAgICAvL2goJ3NwYW4nLCB7b246IHtjbGljazogW0FERF9TVEFURSwgJ19yb290TmFtZVNwYWNlJywgJ3RhYmxlJ119fSwgW2xpc3RJY29uKCldKSxcclxuICAgICAgICBdKVxyXG5cclxuXHJcbiAgICAgICAgY29uc3QgYWRkVmlld05vZGVDb21wb25lbnQgPSBoKCdkaXYnLCB7c3R5bGU6IHsgZmxleDogJzAgYXV0bycsIG1hcmdpbkxlZnQ6IHN0YXRlLnJpZ2h0T3BlbiA/ICctMTBweCc6ICcwJywgYm9yZGVyOiAnM3B4IHNvbGlkICMyMjInLCBib3JkZXJSaWdodDogJ25vbmUnLCBiYWNrZ3JvdW5kOiAnIzMzMycsIGhlaWdodDogJzQwcHgnLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZTogeyBmb250RmFtaWx5OiBcIidDb21mb3J0YWEnLCBzYW5zLXNlcmlmXCIsIGZvbnRTaXplOiAnMC45ZW0nLCBwYWRkaW5nOiAnMCAxMHB4J319LCAnYWRkIGNvbXBvbmVudDogJyksXHJcbiAgICAgICAgICAgIGgoJ3NwYW4nLCB7b246IHtjbGljazogW0FERF9OT0RFLCBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLCAnYm94J119fSwgW2JveEljb24oKV0pLFxyXG4gICAgICAgICAgICBoKCdzcGFuJywge29uOiB7Y2xpY2s6IFtBRERfTk9ERSwgc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZSwgJ2lucHV0J119fSwgW2lucHV0SWNvbigpXSksXHJcbiAgICAgICAgICAgIGgoJ3NwYW4nLCB7b246IHtjbGljazogW0FERF9OT0RFLCBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLCAndGV4dCddfX0sIFt0ZXh0SWNvbigpXSksXHJcbiAgICAgICAgICAgIGgoJ3NwYW4nLCB7b246IHtjbGljazogW0FERF9OT0RFLCBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLCAnaW1hZ2UnXX19LCBbaW1hZ2VJY29uKCldKSxcclxuICAgICAgICAgICAgaCgnc3BhbicsIHtvbjoge2NsaWNrOiBbQUREX05PREUsIHN0YXRlLnNlbGVjdGVkVmlld05vZGUsICdpZiddfX0sIFtpZkljb24oKV0pLFxyXG4gICAgICAgIF0pXHJcblxyXG4gICAgICAgIGNvbnN0IHZpZXdDb21wb25lbnQgPSBoKCdkaXYnLCB7YXR0cnM6IHtjbGFzczogJ2JldHRlci1zY3JvbGxiYXInfSwgc3R5bGU6IHtvdmVyZmxvdzogJ2F1dG8nLCBwb3NpdGlvbjogJ3JlbGF0aXZlJywgZmxleDogJzEnLCBmb250U2l6ZTogJzAuOGVtJ319LCBbXHJcbiAgICAgICAgICAgIGxpc3ROb2RlKHtyZWY6ICd2Tm9kZUJveCcsIGlkOidfcm9vdE5vZGUnfSwge30sIDApLFxyXG4gICAgICAgIF0pXHJcblxyXG4gICAgICAgIGNvbnN0IHJpZ2h0Q29tcG9uZW50ID1cclxuICAgICAgICAgICAgaCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAnMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICcwJyxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgICBmb250OiBcIjMwMCAxLjJlbSAnT3BlbiBTYW5zJ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6ICcxLjJlbScsXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHN0YXRlLmVkaXRvclJpZ2h0V2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNGQ0ZDRkJyxcclxuICAgICAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckxlZnQ6ICczcHggc29saWQgIzIyMicsXHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogJzAuNXMgdHJhbnNmb3JtJyxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHN0YXRlLnJpZ2h0T3BlbiA/ICd0cmFuc2xhdGVaKDApIHRyYW5zbGF0ZVgoMCUpJzogJ3RyYW5zbGF0ZVooMCkgdHJhbnNsYXRlWCgxMDAlKScsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgZHJhZ0NvbXBvbmVudFJpZ2h0LFxyXG4gICAgICAgICAgICAgICAgb3BlbkNvbXBvbmVudFJpZ2h0LFxyXG4gICAgICAgICAgICAgICAgYWRkU3RhdGVDb21wb25lbnQsXHJcbiAgICAgICAgICAgICAgICBzdGF0ZUNvbXBvbmVudCxcclxuICAgICAgICAgICAgICAgIGFkZFZpZXdOb2RlQ29tcG9uZW50LFxyXG4gICAgICAgICAgICAgICAgdmlld0NvbXBvbmVudCxcclxuICAgICAgICAgICAgXSlcclxuXHJcbiAgICAgICAgY29uc3QgdG9wQ29tcG9uZW50ID0gaCgnZGl2Jywge1xyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgZmxleDogJzEgYXV0bycsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICc3NXB4JyxcclxuICAgICAgICAgICAgICAgIG1heEhlaWdodDogJzc1cHgnLFxyXG4gICAgICAgICAgICAgICAgbWluSGVpZ2h0OiAnNzVweCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzIyMicsXHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OidmbGV4JyxcclxuICAgICAgICAgICAgICAgIGp1c3RpZnlDb250ZW50OiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgIGZvbnRGYW1pbHk6IFwiJ0NvbWZvcnRhYScsIHNhbnMtc2VyaWZcIixcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIFtcclxuICAgICAgICAgICAgaCgnYScsIHtzdHlsZToge2ZsZXg6ICcwIGF1dG8nLCB3aWR0aDogJzE5MHB4JywgdGV4dERlY29yYXRpb246ICdpbmhlcml0JywgdXNlclNlbGVjdDogJ25vbmUnfSwgYXR0cnM6IHtocmVmOicvX2Rldid9fSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnaW1nJyx7c3R5bGU6IHsgbWFyZ2luOiAnN3B4IC0ycHggLTNweCA1cHgnLCBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ30sIGF0dHJzOiB7c3JjOiAnL2ltYWdlcy9sb2dvMjU2eDI1Ni5wbmcnLCBoZWlnaHQ6ICc1Nyd9fSksXHJcbiAgICAgICAgICAgICAgICBoKCdzcGFuJyx7c3R5bGU6IHsgZm9udFNpemU6JzQ0cHgnLCAgdmVydGljYWxBbGlnbjogJ2JvdHRvbScsIGNvbG9yOiAnI2ZmZid9fSwgJ3VnbmlzJylcclxuICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogXCInQ29tZm9ydGFhJywgc2Fucy1zZXJpZlwiLFxyXG4gICAgICAgICAgICAgICAgZm9udFNpemU6ICcxNnB4JyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogJyM0NDQ0NDQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnd2hpdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxNXB4IDIwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hcmdpbjogJzEzcHggMTNweCAwIDAnLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogW0ZVTExfU0NSRUVOX0NMSUNLRUQsIHRydWVdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgJ2Z1bGwgc2NyZWVuJyksXHJcbiAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzQ0NDQ0NCcsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzE1cHggMjBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbWFyZ2luOiAnMTNweCAxM3B4IDAgMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiBSRVNFVF9BUFBfU1RBVEVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LCAncmVzZXQgc3RhdGUnKSxcclxuICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNDQ0NDQ0JyxcclxuICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMTVweCAyMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICBtYXJnaW46ICcxM3B4IDEzcHggMCAwJyxcclxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFJFU0VUX0FQUF9ERUZJTklUSU9OXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgJ3Jlc2V0IGRlbW8nKVxyXG4gICAgICAgICAgICBdKVxyXG4gICAgICAgIF0pXHJcbiAgICAgICAgY29uc3QgbGVmdENvbXBvbmVudCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIGxlZnQ6ICcwJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICBmb250OiBcIjMwMCAxLjJlbSAnT3BlbiBTYW5zJ1wiLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IHN0YXRlLmVkaXRvckxlZnRXaWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzRkNGQ0ZCcsXHJcbiAgICAgICAgICAgICAgICBib3hTaXppbmc6IFwiYm9yZGVyLWJveFwiLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmlnaHQ6ICczcHggc29saWQgIzIyMicsXHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnMC41cyB0cmFuc2Zvcm0nLFxyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzdGF0ZS5sZWZ0T3BlbiA/ICd0cmFuc2xhdGVaKDApIHRyYW5zbGF0ZVgoMCUpJzogJ3RyYW5zbGF0ZVooMCkgdHJhbnNsYXRlWCgtMTAwJSknLFxyXG4gICAgICAgICAgICAgICAgdXNlclNlbGVjdDogJ25vbmUnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sIFtcclxuICAgICAgICAgICAgZHJhZ0NvbXBvbmVudExlZnQsXHJcbiAgICAgICAgICAgIG9wZW5Db21wb25lbnRMZWZ0LFxyXG4gICAgICAgICAgICBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBGUkVFWkVSX0NMSUNLRURcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIGZsZXg6ICcwIGF1dG8nLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjMzMzJyxcclxuICAgICAgICAgICAgICAgICAgICBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHsgcGFkZGluZzogJzE1cHggMTVweCAxMHB4IDE1cHgnLCBjb2xvcjogc3RhdGUuYXBwSXNGcm96ZW4gPyAncmdiKDkxLCAyMDQsIDkxKScgOiAncmdiKDIwNCwgOTEsIDkxKSd9fSwgc3RhdGUuYXBwSXNGcm96ZW4gPyAn4pa6JyA6ICfinZrinZonKSxcclxuICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgIGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyczoge2NsYXNzOiAnYmV0dGVyLXNjcm9sbGJhcid9LFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsZXg6ICcxIGF1dG8nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHN0YXRlLmV2ZW50U3RhY2tcclxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChldmVudERhdGEpPT5zdGF0ZS5kZWZpbml0aW9uLmV2ZW50W2V2ZW50RGF0YS5ldmVudElkXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIC5yZXZlcnNlKCkgLy8gbXV0YXRlcyB0aGUgYXJyYXksIGJ1dCBpdCB3YXMgYWxyZWFkeSBjb3BpZWQgd2l0aCBmaWx0ZXJcclxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMCwgMjEpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZXZlbnREYXRhLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHN0YXRlLmRlZmluaXRpb24uZXZlbnRbZXZlbnREYXRhLmV2ZW50SWRdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVtaXR0ZXIgPSBzdGF0ZS5kZWZpbml0aW9uW2V2ZW50LmVtaXR0ZXIucmVmXVtldmVudC5lbWl0dGVyLmlkXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBpZGVhIHdoeSB0aGlzIGtleSB3b3JrcywgZG9uJ3QgdG91Y2ggaXQsIHByb2JhYmx5IHJlcmVuZGVycyBtb3JlIHRoYW4gbmVlZGVkLCBidXQgd2hvIGNhcmVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBoKCdkaXYnLCB7a2V5OiBldmVudC5lbWl0dGVyLmlkICsgaW5kZXgsIHN0eWxlOiB7bWFyZ2luQm90dG9tOiAnMTBweCd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvcjogJ3BvaW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjNDQ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nVG9wOiAnM3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nQm90dG9tOiAnM3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogc3RhdGUuc2VsZWN0ZWRWaWV3Tm9kZS5pZCA9PT0gZXZlbnQuZW1pdHRlci5pZCA/ICcjNTNCMkVEJzogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnMC4ycyBhbGwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCBvbjoge2NsaWNrOiBbVklFV19OT0RFX1NFTEVDVEVELCBldmVudC5lbWl0dGVyXX19LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtzdHlsZToge2ZsZXg6ICcwIDAgYXV0bycsIG1hcmdpbjogJzAgMCAwIDVweCcsIGRpc3BsYXk6ICdpbmxpbmUtZmxleCd9fSwgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5lbWl0dGVyLnJlZiA9PT0gJ3ZOb2RlQm94JyA/IGJveEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5lbWl0dGVyLnJlZiA9PT0gJ3ZOb2RlTGlzdCcgPyBsaXN0SWNvbigpIDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5lbWl0dGVyLnJlZiA9PT0gJ3ZOb2RlTGlzdCcgPyBpZkljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmVtaXR0ZXIucmVmID09PSAndk5vZGVJbnB1dCcgPyBpbnB1dEljb24oKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0SWNvbigpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnNSA1IGF1dG8nLCBtYXJnaW46ICcwIDVweCAwIDAnLCBtaW5XaWR0aDogJzAnLCBvdmVyZmxvdzogJ2hpZGRlbicsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnfX0sIGVtaXR0ZXIudGl0bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtmbGV4OiAnMCAwIGF1dG8nLCBmb250RmFtaWx5OiBcIidDb21mb3J0YWEnLCBzYW5zLXNlcmlmXCIsIGZvbnRTaXplOiAnMC45ZW0nLCBtYXJnaW5MZWZ0OiAnYXV0bycsIG1hcmdpblJpZ2h0OiAnNXB4JywgY29sb3I6ICcjNWJjYzViJ319LCBldmVudC50eXBlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZXZlbnREYXRhLm11dGF0aW9ucykuZmlsdGVyKHN0YXRlSWQgPT4gc3RhdGUuZGVmaW5pdGlvbi5zdGF0ZVtzdGF0ZUlkXSAhPT0gdW5kZWZpbmVkKS5sZW5ndGggPT09IDAgP1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZTogeyBwYWRkaW5nOiAnNXB4IDEwcHgnLCBmb250RmFtaWx5OiBcIidDb21mb3J0YWEnLCBzYW5zLXNlcmlmXCIsICBjb2xvcjogJyNiZGJkYmQnfX0sICdub3RoaW5nIGhhcyBjaGFuZ2VkJyk6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7cGFkZGluZ0xlZnQ6ICcxMHB4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCd9fSwgT2JqZWN0LmtleXMoZXZlbnREYXRhLm11dGF0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihzdGF0ZUlkID0+IHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGVJZF0gIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChzdGF0ZUlkID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicsIHtvbjoge2NsaWNrOiBbU1RBVEVfTk9ERV9TRUxFQ1RFRCwgc3RhdGVJZF19LCBzdHlsZToge2N1cnNvcjogJ3BvaW50ZXInLCBmb250U2l6ZTogJzE0cHgnLCBjb2xvcjogJ3doaXRlJywgYm94U2hhZG93OiAnaW5zZXQgMCAwIDAgMnB4ICcgKyAoc3RhdGUuc2VsZWN0ZWRTdGF0ZU5vZGVJZCA9PT0gc3RhdGVJZCA/ICcjZWFiNjVjJzogJyM4MjgyODInKSAsIGJhY2tncm91bmQ6ICcjNDQ0JywgcGFkZGluZzogJzJweCA1cHgnLCBtYXJnaW5SaWdodDogJzVweCcsIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snLCB0cmFuc2l0aW9uOiAnYWxsIDAuMnMnfX0sIHN0YXRlLmRlZmluaXRpb24uc3RhdGVbc3RhdGVJZF0udGl0bGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtjb2xvcjogJyM4ZThlOGUnfX0sIGV2ZW50RGF0YS5wcmV2aW91c1N0YXRlW3N0YXRlSWRdLnRvU3RyaW5nKCkgKyAnIOKAk+KAuiAnKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywgZXZlbnREYXRhLm11dGF0aW9uc1tzdGF0ZUlkXS50b1N0cmluZygpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIF0pXHJcbiAgICAgICAgY29uc3QgdHV0b3JpYWxDb21wb25lbnQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0ZXBzID0gW1xyXG4gICAgICAgICAgICAgICAgaCgnc3BhbicsIFtcclxuICAgICAgICAgICAgICAgICAgICBoKCdwJywgJ1VnbmlzIGlzIGEgdmlzdWFsIHRvb2wgZm9yIGNyZWF0aW5nIGZyb250LWVuZCBhcHBsaWNhdGlvbnMuIFRoZSBjbGlja2VyIGRlbW8gYWJvdmUgd2FzIHdyaXR0ZW4gd2l0aCB0aGlzIHRvb2wuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgncCcsICdUaGlzIGlzIG9ubHkgYSBwcmV2aWV3IHZlcnNpb24gYW5kIHdlIGRvIG5vdCByZWNvbW1lbmQgdXNpbmcgaXQgaW4gcHJvZHVjdGlvbiB5ZXQuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgncCcsICdGb3Igbm93LCB5b3UgY2FuIG1ha2Ugc3VyZSB0aGF0IHRoZSBjbGlja2VyIHdvcmtzLiBDbGljayBcImV4aXQgZnVsbHNjcmVlblwiIG9yIFwibmV4dFwiIHRvIHNlZSBob3cgaXQgaXQgaXMgbWFkZS4nKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtkaXNwbGF5OiAnZmxleCcsIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnYScsIHthdHRyczoge2hyZWY6ICdodHRwczovL3d3dy51Z25pcy5jb20nfSwgc3R5bGU6IHtiYWNrZ3JvdW5kOiAnI2Y0ZjRmNCcsIGN1cnNvcjogJ3BvaW50ZXInLCBjb2xvcjogJyM0NDQnLCB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLCBwYWRkaW5nOiAnMTJweCAxN3B4JywgYm9yZGVyOiAnM3B4IHNvbGlkICNkZGQnfX0sICdsZWFybiBtb3JlLi4uJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHttYXJnaW5MZWZ0OiAnYXV0bycsIG1hcmdpblJpZ2h0OiAnMTBweCd9fSwgJzEvNCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHt1c2VyU2VsZWN0OiAnbm9uZScsY3Vyc29yOiAncG9pbnRlcicsIGNvbG9yOiAnd2hpdGUnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjQUQ1MjUxJywgcGFkZGluZzogJzE1cHggMjBweCd9LCBvbjoge2NsaWNrOiBORVhUX1RVVE9SSUFMX1NURVB9fSwgJ25leHQnKV0pLFxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICBoKCdzcGFuJywgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3AnLCAnSW4gdGhlIHJpZ2h0IGJvdHRvbSBpcyB0aGUgY29tcG9uZW50IHRyZWUuIENvbXBvbmVudHMgYXJlIHRoZSB2aXNpYmxlIHBhcnQgb2YgeW91ciBhcHBsaWNhdGlvbi4nKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdwJywgJ1lvdSBjYW4gY2hhbmdlIGhvdyBjb21wb25lbnRzIGxvb2sgYW5kIHJlYWN0IHRvIGV2ZW50cyBieSBzZWxlY3RpbmcgYSBjb21wb25lbnQuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7ZGlzcGxheTogJ2ZsZXgnLCBqdXN0aWZ5Q29udGVudDogJ3NwYWNlLWJldHdlZW4nLCBhbGlnbkl0ZW1zOiAnY2VudGVyJ319LCBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2EnLCB7YXR0cnM6IHtocmVmOiAnaHR0cHM6Ly93d3cudWduaXMuY29tJ30sIHN0eWxlOiB7YmFja2dyb3VuZDogJyNmNGY0ZjQnLCBjdXJzb3I6ICdwb2ludGVyJywgY29sb3I6ICcjNDQ0JywgdGV4dERlY29yYXRpb246ICdub25lJywgcGFkZGluZzogJzEycHggMTdweCcsIGJvcmRlcjogJzNweCBzb2xpZCAjZGRkJ319LCAnbGVhcm4gbW9yZS4uLicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdzcGFuJywge3N0eWxlOiB7bWFyZ2luTGVmdDogJ2F1dG8nLCBtYXJnaW5SaWdodDogJzEwcHgnfX0sJzIvNCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHt1c2VyU2VsZWN0OiAnbm9uZScsY3Vyc29yOiAncG9pbnRlcicsIGNvbG9yOiAnd2hpdGUnLCBiYWNrZ3JvdW5kQ29sb3I6ICcjQUQ1MjUxJywgcGFkZGluZzogJzE1cHggMjBweCd9LCBvbjoge2NsaWNrOiBORVhUX1RVVE9SSUFMX1NURVB9fSwgJ25leHQnKV0pLFxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgICAgICBoKCdzcGFuJywgW1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3AnLCAnU3RhdGUgaXMgdGhlIGR5bmFtaWMgcGFydCBvZiB5b3VyIGFwcGxpY2F0aW9uIHRoYXQgaXMgaW52aXNpYmxlIHRvIHRoZSB1c2Vycy4nKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdwJywgJ0V2ZXJ5dGhpbmcgdGhhdCBjYW4gY2hhbmdlIG9yIGlzIHNoYXJlZCBhY3Jvc3MgdGhlIGNvbXBvbmVudHMgc2hvdWxkIGJlIGluIHN0YXRlLicpLFxyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3AnLCAnQ29tcG9uZW50cyBjYW4gdXNlIGFuZCBjaGFuZ2UgdGhlIHN0YXRlLCB5b3UganVzdCBuZWVkIHRvIGRyYWcgYW5kIGRyb3AgaXQgaW50byBhIHBsYWNlIHdoZXJlIHlvdSB3YW50IHRvIHVzZSBpdC4nKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtkaXNwbGF5OiAnZmxleCcsIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnYScsIHthdHRyczoge2hyZWY6ICdodHRwczovL3d3dy51Z25pcy5jb20nfSwgc3R5bGU6IHtiYWNrZ3JvdW5kOiAnI2Y0ZjRmNCcsIGN1cnNvcjogJ3BvaW50ZXInLCBjb2xvcjogJyM0NDQnLCB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLCBwYWRkaW5nOiAnMTJweCAxN3B4JywgYm9yZGVyOiAnM3B4IHNvbGlkICNkZGQnfX0sICdsZWFybiBtb3JlLi4uJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHttYXJnaW5MZWZ0OiAnYXV0bycsIG1hcmdpblJpZ2h0OiAnMTBweCd9fSwnMy80JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3VzZXJTZWxlY3Q6ICdub25lJyxjdXJzb3I6ICdwb2ludGVyJywgY29sb3I6ICd3aGl0ZScsIGJhY2tncm91bmRDb2xvcjogJyNBRDUyNTEnLCBwYWRkaW5nOiAnMTVweCAyMHB4J30sIG9uOiB7Y2xpY2s6IE5FWFRfVFVUT1JJQUxfU1RFUH19LCAnbmV4dCcpXSksXHJcbiAgICAgICAgICAgICAgICBdKSxcclxuICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCBbXHJcbiAgICAgICAgICAgICAgICAgICAgaCgncCcsICdGaW5hbGx5IHRoZXJlXFwncyB0aGUgc2lkZWJhciB3aGljaCBhbGxvd3MgeW91IHRvIHBhdXNlIHlvdXIgYXBwbGljYXRpb24gaW4gb3JkZXIgdG8gaW5zcGVjdCB5b3VyIGNvbXBvbmVudHMsIGFuZCB0byB2aWV3IHRoZSBhY3Rpb25zIHRoYXQgaGF2ZSBiZWVuIGV4ZWN1dGVkIHNvIGZhci4nKSxcclxuICAgICAgICAgICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6IHtkaXNwbGF5OiAnZmxleCcsIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsIGFsaWduSXRlbXM6ICdjZW50ZXInfX0sIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaCgnYScsIHthdHRyczoge2hyZWY6ICdodHRwczovL3d3dy51Z25pcy5jb20nfSwgc3R5bGU6IHtiYWNrZ3JvdW5kOiAnI2Y0ZjRmNCcsIGN1cnNvcjogJ3BvaW50ZXInLCBjb2xvcjogJyM0NDQnLCB0ZXh0RGVjb3JhdGlvbjogJ25vbmUnLCBwYWRkaW5nOiAnMTJweCAxN3B4JywgYm9yZGVyOiAnM3B4IHNvbGlkICNkZGQnfX0sICdsZWFybiBtb3JlLi4uJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHttYXJnaW5MZWZ0OiAnYXV0bycsIG1hcmdpblJpZ2h0OiAnMTBweCd9fSwnNC80JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGgoJ2RpdicsIHtzdHlsZToge3VzZXJTZWxlY3Q6ICdub25lJyxjdXJzb3I6ICdwb2ludGVyJywgY29sb3I6ICd3aGl0ZScsIGJhY2tncm91bmRDb2xvcjogJyNBRDUyNTEnLCBwYWRkaW5nOiAnMTVweCAyMHB4J30sIG9uOiB7Y2xpY2s6IE5FWFRfVFVUT1JJQUxfU1RFUH19LCAnY2xvc2UnKV0pLFxyXG4gICAgICAgICAgICAgICAgXSksXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgY29uc3Qgc3RlcFBvc2l0aW9ucyA9IFtcclxuICAgICAgICAgICAgICAgIHt0b3A6ICcxMjBweCcsIHJpZ2h0OiAnNDBweCd9LFxyXG4gICAgICAgICAgICAgICAge3RvcDogd2luZG93LmlubmVySGVpZ2h0IC0gNTAwICsgJ3B4JywgcmlnaHQ6ICAnNDAwcHgnfSxcclxuICAgICAgICAgICAgICAgIHt0b3A6ICcxMjBweCcsIHJpZ2h0OiAnNDAwcHgnfSxcclxuICAgICAgICAgICAgICAgIHt0b3A6IHdpbmRvdy5pbm5lckhlaWdodC8yIC0gMTAwICsgJ3B4JywgcmlnaHQ6IHdpbmRvdy5pbm5lcldpZHRoIC0gOTUwICsgJ3B4J30sXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgcmV0dXJuIGgoJ2RpdicsIHtzdHlsZToge3Bvc2l0aW9uOiAnZml4ZWQnLCB6SW5kZXg6ICc5OTk5OTk5JywgdHJhbnNpdGlvbjogJ2FsbCA1MDBtcycsIGZvbnQ6IFwiMzAwIDEuMmVtICdDb21mb3J0YWEnLCBzYW5zLXNlcmlmXCIsIC4uLnN0ZXBQb3NpdGlvbnNbc3RhdGUudHV0b3JpYWxTdGVwXSwgYmFja2dyb3VuZENvbG9yOid3aGl0ZScsIGNvbG9yOiAnYmxhY2snLCBib3JkZXI6ICc1cHggc29saWQgIzUzQjJFRCcsIG1heFdpZHRoOiAnNTAwcHgnLCBwYWRkaW5nOiAnMjBweCd9fSwgW3N0ZXBzW3N0YXRlLnR1dG9yaWFsU3RlcF1dKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVuZGVyVmlld0NvbXBvbmVudCA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIGZsZXg6ICcxIGF1dG8nLFxyXG4gICAgICAgICAgICAgICAgLy9iYWNrZ3JvdW5kSW1hZ2U6ICdyYWRpYWwtZ3JhZGllbnQoYmxhY2sgMTUlLCB0cmFuc3BhcmVudCAxNiUpLCByYWRpYWwtZ3JhZGllbnQoYmxhY2sgMTUlLCB0cmFuc3BhcmVudCAxNiUpLCByYWRpYWwtZ3JhZGllbnQocmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA5ODAzOTIpIDE1JSwgdHJhbnNwYXJlbnQgMjAlKSwgcmFkaWFsLWdyYWRpZW50KHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOTgwMzkyKSAxNSUsIHRyYW5zcGFyZW50IDIwJSknLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uWDogJzBweCwgOHB4LCAwcHgsIDhweCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUG9zaXRpb25ZOiAnMHB4LCA4cHgsIDFweCwgOXB4JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjonIzMzMycsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kU2l6ZTonMTZweCAxNnB4JyxcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6J3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICBoKCdkaXYnLCB7c3R5bGU6ICgoKT0+e1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wTWVudUhlaWdodCA9IDc1XHJcbiAgICAgICAgICAgICAgICBjb25zdCB3aWR0aExlZnQgPSB3aW5kb3cuaW5uZXJXaWR0aCAtICgoc3RhdGUubGVmdE9wZW4gPyBzdGF0ZS5lZGl0b3JMZWZ0V2lkdGg6IDApICsgKHN0YXRlLnJpZ2h0T3BlbiA/IHN0YXRlLmVkaXRvclJpZ2h0V2lkdGggOiAwKSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodExlZnQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgLSB0b3BNZW51SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBzdGF0ZS5mdWxsU2NyZWVuID8gJzEwMHZ3JyA6IHdpZHRoTGVmdCAtIDQwICsncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogc3RhdGUuZnVsbFNjcmVlbiA/ICcxMDB2aCcgOiBoZWlnaHRMZWZ0IC0gNDAgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICcjZmZmZmZmJyxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGVaKDApJyxcclxuICAgICAgICAgICAgICAgICAgICB6SW5kZXg6IHN0YXRlLmZ1bGxTY3JlZW4gPyAnMjAwMCcgOiAnMTAwJyxcclxuICAgICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICdyZ2JhKDAsIDAsIDAsIDAuMjQ3MDU5KSAwcHggMTRweCA0NXB4LCByZ2JhKDAsIDAsIDAsIDAuMjE5NjA4KSAwcHggMTBweCAxOHB4JyxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiAnYWxsIDAuNXMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvcDogc3RhdGUuZnVsbFNjcmVlbiA/ICcwcHgnIDogMjAgKyA3NSArICdweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdDogc3RhdGUuZnVsbFNjcmVlbiA/ICcwcHgnIDogKHN0YXRlLmxlZnRPcGVuID9zdGF0ZS5lZGl0b3JMZWZ0V2lkdGggOiAwKSArIDIwICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkoKX0sIFtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmZ1bGxTY3JlZW4gP1xyXG4gICAgICAgICAgICAgICAgICAgIGgoJ3NwYW4nLCB7c3R5bGU6IHtwb3NpdGlvbjogJ2ZpeGVkJywgcGFkZGluZzogJzEycHggMTBweCcsIHRvcDogJzAnLCByaWdodDogJzQwcHgnLCBib3JkZXI6ICcycHggc29saWQgIzMzMycsIGJvcmRlclRvcDogJ25vbmUnLCBiYWNrZ3JvdW5kOiAnIzQ0NCcsIGNvbG9yOiAnd2hpdGUnLCBvcGFjaXR5OiAnMC44JywgY3Vyc29yOiAncG9pbnRlcid9LCBvbjoge2NsaWNrOiBbRlVMTF9TQ1JFRU5fQ0xJQ0tFRCwgZmFsc2VdfX0sICdleGl0IGZ1bGwgc2NyZWVuJyk6XHJcbiAgICAgICAgICAgICAgICAgICAgaCgnc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgaCgnZGl2Jywge3N0eWxlOiB7b3ZlcmZsb3c6ICdhdXRvJywgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJSd9fSwgW2FwcC52ZG9tXSlcclxuICAgICAgICAgICAgXSlcclxuICAgICAgICBdKVxyXG4gICAgICAgIGNvbnN0IG1haW5Sb3dDb21wb25lbnQgPSBoKCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICBmbGV4OiAnMScsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHJlbmRlclZpZXdDb21wb25lbnQsXHJcbiAgICAgICAgICAgIGxlZnRDb21wb25lbnQsXHJcbiAgICAgICAgICAgIHJpZ2h0Q29tcG9uZW50LFxyXG4gICAgICAgICAgICBzdGF0ZS5zZWxlY3RlZFZpZXdOb2RlLnJlZiA/IGdlbmVyYXRlRWRpdE5vZGVDb21wb25lbnQoKTogaCgnc3BhbicpXHJcbiAgICAgICAgXSlcclxuICAgICAgICBjb25zdCB2bm9kZSA9IGgoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdmaXhlZCcsXHJcbiAgICAgICAgICAgICAgICB0b3A6ICcwJyxcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiAnMCcsXHJcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMHZ3JyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMHZoJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgIHRvcENvbXBvbmVudCxcclxuICAgICAgICAgICAgbWFpblJvd0NvbXBvbmVudCxcclxuICAgICAgICAgICAgc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcgPyBoKCdkaXYnLCB7c3R5bGU6IHtmb250RmFtaWx5OiBcIk9wZW4gU2Fuc1wiLCBwb2ludGVyRXZlbnRzOiAnbm9uZScsIHBvc2l0aW9uOiAnZml4ZWQnLCB0b3A6IHN0YXRlLm1vdXNlUG9zaXRpb24ueSArICdweCcsIGxlZnQ6IHN0YXRlLm1vdXNlUG9zaXRpb24ueCArICdweCcsIGxpbmVIZWlnaHQ6ICcxLjJlbScsIGZvbnRTaXplOiAnMS4yZW0nLCB6SW5kZXg6ICc5OTk5OScsIHdpZHRoOiBzdGF0ZS5lZGl0b3JSaWdodFdpZHRoICsgJ3B4J319LCBbaCgnZGl2Jywge3N0eWxlOiB7b3ZlcmZsb3c6ICdhdXRvJywgcG9zaXRpb246ICdyZWxhdGl2ZScsIGZsZXg6ICcxJywgZm9udFNpemU6ICcwLjhlbSd9fSwgW2Zha2VDb21wb25lbnQoc3RhdGUuZHJhZ2dlZENvbXBvbmVudFZpZXcsIHN0YXRlLmhvdmVyZWRWaWV3Tm9kZSA/IHN0YXRlLmhvdmVyZWRWaWV3Tm9kZS5kZXB0aCA6IHN0YXRlLmRyYWdnZWRDb21wb25lbnRWaWV3LmRlcHRoKV0pXSk6IGgoJ3NwYW4nKSxcclxuICAgICAgICAgICAgc3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWQgPyBoKCdkaXYnLCB7c3R5bGU6IHtmb250RmFtaWx5OiBcIk9wZW4gU2Fuc1wiLCBwb2ludGVyRXZlbnRzOiAnbm9uZScsIHBvc2l0aW9uOiAnZml4ZWQnLCB0b3A6IHN0YXRlLm1vdXNlUG9zaXRpb24ueSArICdweCcsIGxlZnQ6IHN0YXRlLm1vdXNlUG9zaXRpb24ueCArICdweCcsIGxpbmVIZWlnaHQ6ICcxLjJlbScsIGZvbnRTaXplOiAnMTZweCcsIHpJbmRleDogJzk5OTk5Jywgd2lkdGg6IHN0YXRlLmVkaXRvclJpZ2h0V2lkdGggKyAncHgnfX0sIHN0YXRlLmhvdmVyZWRFdmVudCB8fCBzdGF0ZS5ob3ZlcmVkUGlwZSA/IFtoKCdzcGFuJywge3N0eWxlOiB7Y29sb3I6ICcjNWJjYzViJywgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogJzAnLCBsZWZ0OiAnLTIwcHgnfX0sW2FkZENpcmNsZUljb24oKV0pLCBmYWtlU3RhdGUoc3RhdGUuZHJhZ2dlZENvbXBvbmVudFN0YXRlSWQpXTogW2Zha2VTdGF0ZShzdGF0ZS5kcmFnZ2VkQ29tcG9uZW50U3RhdGVJZCldKTogaCgnc3BhbicpLFxyXG4gICAgICAgICAgICBzdGF0ZS50dXRvcmlhbFBhc3NlZCA/IGgoJ3NwYW4nKTogdHV0b3JpYWxDb21wb25lbnQoKSxcclxuICAgICAgICBdKVxyXG5cclxuICAgICAgICBub2RlID0gcGF0Y2gobm9kZSwgdm5vZGUpXHJcbiAgICAgICAgY3VycmVudEFuaW1hdGlvbkZyYW1lUmVxdWVzdCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKClcclxufSIsImZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xyXG4gICAgdmFyIGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSxcclxuICAgICAgICBwcm9wcyA9IHZub2RlLmRhdGEubGl2ZVByb3BzIHx8IHt9O1xyXG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcclxuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xyXG4gICAgICAgIG9sZCA9IGVsbVtrZXldO1xyXG4gICAgICAgIGlmIChvbGQgIT09IGN1cikgZWxtW2tleV0gPSBjdXI7XHJcbiAgICB9XHJcbn1cclxuY29uc3QgbGl2ZVByb3BzUGx1Z2luID0ge2NyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHN9O1xyXG5pbXBvcnQgc25hYmJkb20gZnJvbSAnc25hYmJkb20nXHJcbmNvbnN0IHBhdGNoID0gc25hYmJkb20uaW5pdChbXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2NsYXNzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL3Byb3BzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL3N0eWxlJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2V2ZW50bGlzdGVuZXJzJyksXHJcbiAgICByZXF1aXJlKCdzbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMnKSxcclxuICAgIGxpdmVQcm9wc1BsdWdpblxyXG5dKTtcclxuaW1wb3J0IGggZnJvbSAnc25hYmJkb20vaCc7XHJcbmltcG9ydCBiaWcgZnJvbSAnYmlnLmpzJztcclxuXHJcbmZ1bmN0aW9uIGZsYXR0ZW4oYXJyKSB7XHJcbiAgICByZXR1cm4gYXJyLnJlZHVjZShmdW5jdGlvbiAoZmxhdCwgdG9GbGF0dGVuKSB7XHJcbiAgICAgICAgcmV0dXJuIGZsYXQuY29uY2F0KEFycmF5LmlzQXJyYXkodG9GbGF0dGVuKSA/IGZsYXR0ZW4odG9GbGF0dGVuKSA6IHRvRmxhdHRlbik7XHJcbiAgICB9LCBbXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IChkZWZpbml0aW9uKSA9PiB7XHJcblxyXG4gICAgbGV0IGN1cnJlbnRTdGF0ZSA9IGNyZWF0ZURlZmF1bHRTdGF0ZSgpXHJcblxyXG4gICAgLy8gQWxsb3dzIHN0b3BpbmcgYXBwbGljYXRpb24gaW4gZGV2ZWxvcG1lbnQuIFRoaXMgaXMgbm90IGFuIGFwcGxpY2F0aW9uIHN0YXRlXHJcbiAgICBsZXQgZnJvemVuID0gZmFsc2VcclxuICAgIGxldCBmcm96ZW5DYWxsYmFjayA9IG51bGxcclxuICAgIGxldCBzZWxlY3RIb3ZlckFjdGl2ZSA9IGZhbHNlXHJcbiAgICBsZXQgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudCA9IHt9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0Tm9kZUhvdmVyKHJlZiwgZSkge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcclxuICAgICAgICBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50ID0gcmVmXHJcbiAgICAgICAgZnJvemVuQ2FsbGJhY2socmVmKVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzZWxlY3ROb2RlQ2xpY2socmVmLCBlKSB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKVxyXG4gICAgICAgIHNlbGVjdEhvdmVyQWN0aXZlID0gZmFsc2VcclxuICAgICAgICBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50ID0gcmVmXHJcbiAgICAgICAgZnJvemVuQ2FsbGJhY2socmVmKVxyXG4gICAgICAgIHJlbmRlcigpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2xvYmFsIHN0YXRlIGZvciByZXNvbHZlclxyXG4gICAgbGV0IGN1cnJlbnRFdmVudCA9IG51bGxcclxuICAgIGxldCBjdXJyZW50TWFwVmFsdWUgPSB7fVxyXG4gICAgbGV0IGN1cnJlbnRNYXBJbmRleCA9IHt9XHJcbiAgICBsZXQgZXZlbnREYXRhID0ge31cclxuICAgIGZ1bmN0aW9uIHJlc29sdmUocmVmKXtcclxuICAgICAgICBpZihyZWYgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBzdGF0aWMgdmFsdWUgKHN0cmluZy9udW1iZXIpXHJcbiAgICAgICAgaWYocmVmLnJlZiA9PT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgcmV0dXJuIHJlZlxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBkZWYgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3BpcGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwaXBlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdjb25kaXRpb25hbCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoZGVmLnByZWRpY2F0ZSkgPyByZXNvbHZlKGRlZi50aGVuKSA6IHJlc29sdmUoZGVmLmVsc2UpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAnc3RhdGUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50U3RhdGVbcmVmLmlkXVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3ZOb2RlQm94Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gYm94Tm9kZShyZWYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAndk5vZGVUZXh0Jykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dE5vZGUocmVmKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3ZOb2RlSW5wdXQnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbnB1dE5vZGUocmVmKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3ZOb2RlTGlzdCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxpc3ROb2RlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd2Tm9kZUlmJykge1xyXG4gICAgICAgICAgICByZXR1cm4gaWZOb2RlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd2Tm9kZUltYWdlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1hZ2VOb2RlKHJlZilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdzdHlsZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGRlZikucmVkdWNlKChhY2MsIHZhbCk9PiB7XHJcbiAgICAgICAgICAgICAgICBhY2NbdmFsXSA9IHJlc29sdmUoZGVmW3ZhbF0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjXHJcbiAgICAgICAgICAgIH0sIHt9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ2V2ZW50RGF0YScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV2ZW50RGF0YVtyZWYuaWRdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWYucmVmID09PSAnbGlzdFZhbHVlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudE1hcFZhbHVlW2RlZi5saXN0LmlkXVtkZWYucHJvcGVydHldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IEVycm9yKHJlZilcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1WYWx1ZSh2YWx1ZSwgdHJhbnNmb3JtYXRpb25zKXtcclxuICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgdHJhbnNmb3JtYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZiA9IHRyYW5zZm9ybWF0aW9uc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtZXIgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdlcXVhbCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBhcmVWYWx1ZSA9IHJlc29sdmUodHJhbnNmb3JtZXIudmFsdWUpXHJcbiAgICAgICAgICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIGJpZyB8fCBjb21wYXJlVmFsdWUgaW5zdGFuY2VvZiBiaWcpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYmlnKHZhbHVlKS5lcShjb21wYXJlVmFsdWUpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSA9PT0gY29tcGFyZVZhbHVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdhZGQnKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGJpZyh2YWx1ZSkucGx1cyhyZXNvbHZlKHRyYW5zZm9ybWVyLnZhbHVlKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3N1YnRyYWN0Jykge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBiaWcodmFsdWUpLm1pbnVzKHJlc29sdmUodHJhbnNmb3JtZXIudmFsdWUpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAnbXVsdGlwbHknKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGJpZyh2YWx1ZSkudGltZXMocmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdkaXZpZGUnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkaXZpZGVyID0gcmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSlcclxuICAgICAgICAgICAgICAgIGlmKGJpZyhkaXZpZGVyKS5lcSgwKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAwXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYmlnKHZhbHVlKS5kaXYoZGl2aWRlcilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ3JlbWFpbmRlcicpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZCA9IHJlc29sdmUodHJhbnNmb3JtZXIudmFsdWUpXHJcbiAgICAgICAgICAgICAgICBpZihiaWcobW9kKS5lcSgwKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAwXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYmlnKHZhbHVlKS5tb2QobW9kKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAnam9pbicpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKS5jb25jYXQocmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICd0b1VwcGVyQ2FzZScpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9VcHBlckNhc2UoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZWYucmVmID09PSAndG9Mb3dlckNhc2UnKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVmLnJlZiA9PT0gJ2xlbmd0aCcpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUubGVuZ3RoXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdhbmQnKSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICYmIHJlc29sdmUodHJhbnNmb3JtZXIudmFsdWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlZi5yZWYgPT09ICdvcicpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgfHwgcmVzb2x2ZSh0cmFuc2Zvcm1lci52YWx1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGlwZShyZWYpIHtcclxuICAgICAgICBjb25zdCBkZWYgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtVmFsdWUocmVzb2x2ZShkZWYudmFsdWUpLCBkZWYudHJhbnNmb3JtYXRpb25zKVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZyb3plblNoYWRvdyA9ICdpbnNldCAwIDAgMCAzcHggIzM1OTBkZidcclxuXHJcbiAgICBmdW5jdGlvbiBib3hOb2RlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICBjb25zdCBzdHlsZSA9IHJlc29sdmUobm9kZS5zdHlsZSlcclxuICAgICAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgICAgICBzdHlsZTogZnJvemVuICYmIHNlbGVjdGVkTm9kZUluRGV2ZWxvcG1lbnQuaWQgPT09IHJlZi5pZCA/IHsuLi5zdHlsZSwgdHJhbnNpdGlvbjonYm94LXNoYWRvdyAwLjJzJywgYm94U2hhZG93OiBzdHlsZS5ib3hTaGFkb3cgPyBzdHlsZS5ib3hTaGFkb3cgKyAnICwgJyArIGZyb3plblNoYWRvdzogZnJvemVuU2hhZG93IH0gOiBzdHlsZSxcclxuICAgICAgICAgICAgb246IGZyb3plbiA/XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdmVyOiBzZWxlY3RIb3ZlckFjdGl2ZSA/IFtzZWxlY3ROb2RlSG92ZXIsIHJlZl06IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogW3NlbGVjdE5vZGVDbGljaywgcmVmXVxyXG4gICAgICAgICAgICAgICAgfTp7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IG5vZGUuY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBkYmxjbGljazogbm9kZS5kYmxjbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuZGJsY2xpY2tdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3Zlcjogbm9kZS5tb3VzZW92ZXIgPyBbZW1pdEV2ZW50LCBub2RlLm1vdXNlb3Zlcl0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdXQ6IG5vZGUubW91c2VvdXQgPyBbZW1pdEV2ZW50LCBub2RlLm1vdXNlb3V0XSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoKCdkaXYnLCBkYXRhLCBmbGF0dGVuKG5vZGUuY2hpbGRyZW4ubWFwKHJlc29sdmUpKSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpZk5vZGUocmVmKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXVxyXG4gICAgICAgIHJldHVybiByZXNvbHZlKG5vZGUudmFsdWUpID8gbm9kZS5jaGlsZHJlbi5tYXAocmVzb2x2ZSk6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdGV4dE5vZGUocmVmKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXVxyXG4gICAgICAgIGNvbnN0IHN0eWxlID0gcmVzb2x2ZShub2RlLnN0eWxlKVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgIHN0eWxlOiBmcm96ZW4gJiYgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudC5pZCA9PT0gcmVmLmlkID8gey4uLnN0eWxlLCB0cmFuc2l0aW9uOidib3gtc2hhZG93IDAuMnMnLCBib3hTaGFkb3c6IHN0eWxlLmJveFNoYWRvdyA/IHN0eWxlLmJveFNoYWRvdyArICcgLCAnICsgZnJvemVuU2hhZG93OiBmcm96ZW5TaGFkb3cgfSA6IHN0eWxlLFxyXG4gICAgICAgICAgICBvbjogZnJvemVuID9cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IHNlbGVjdEhvdmVyQWN0aXZlID8gW3NlbGVjdE5vZGVIb3ZlciwgcmVmXTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbc2VsZWN0Tm9kZUNsaWNrLCByZWZdXHJcbiAgICAgICAgICAgICAgICB9OntcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogbm9kZS5jbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuY2xpY2tdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGRibGNsaWNrOiBub2RlLmRibGNsaWNrID8gW2VtaXRFdmVudCwgbm9kZS5kYmxjbGlja10gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbW91c2VvdmVyOiBub2RlLm1vdXNlb3ZlciA/IFtlbWl0RXZlbnQsIG5vZGUubW91c2VvdmVyXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW91dDogbm9kZS5tb3VzZW91dCA/IFtlbWl0RXZlbnQsIG5vZGUubW91c2VvdXRdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGgoJ3NwYW4nLCBkYXRhLCByZXNvbHZlKG5vZGUudmFsdWUpKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGltYWdlTm9kZShyZWYpIHtcclxuICAgICAgICBjb25zdCBub2RlID0gZGVmaW5pdGlvbltyZWYucmVmXVtyZWYuaWRdXHJcbiAgICAgICAgY29uc3Qgc3R5bGUgPSByZXNvbHZlKG5vZGUuc3R5bGUpXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcclxuICAgICAgICAgICAgYXR0cnM6IHtcclxuICAgICAgICAgICAgICAgIHNyYzogcmVzb2x2ZShub2RlLnNyYylcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3R5bGU6IGZyb3plbiAmJiBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50LmlkID09PSByZWYuaWQgPyB7Li4uc3R5bGUsIHRyYW5zaXRpb246J2JveC1zaGFkb3cgMC4ycycsIGJveFNoYWRvdzogc3R5bGUuYm94U2hhZG93ID8gc3R5bGUuYm94U2hhZG93ICsgJyAsICcgKyBmcm96ZW5TaGFkb3c6IGZyb3plblNoYWRvdyB9IDogc3R5bGUsXHJcbiAgICAgICAgICAgIG9uOiBmcm96ZW4gP1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3Zlcjogc2VsZWN0SG92ZXJBY3RpdmUgPyBbc2VsZWN0Tm9kZUhvdmVyLCByZWZdOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6IFtzZWxlY3ROb2RlQ2xpY2ssIHJlZl1cclxuICAgICAgICAgICAgICAgIH06e1xyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBub2RlLmNsaWNrID8gW2VtaXRFdmVudCwgbm9kZS5jbGlja10gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZGJsY2xpY2s6IG5vZGUuZGJsY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmRibGNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IG5vZGUubW91c2VvdmVyID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW92ZXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBub2RlLm1vdXNlb3V0ID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW91dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaCgnaW1nJywgZGF0YSlcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpbnB1dE5vZGUocmVmKSB7XHJcbiAgICAgICAgY29uc3Qgbm9kZSA9IGRlZmluaXRpb25bcmVmLnJlZl1bcmVmLmlkXVxyXG4gICAgICAgIGNvbnN0IHN0eWxlID0gcmVzb2x2ZShub2RlLnN0eWxlKVxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgIHN0eWxlOiBmcm96ZW4gJiYgc2VsZWN0ZWROb2RlSW5EZXZlbG9wbWVudC5pZCA9PT0gcmVmLmlkID8gey4uLnN0eWxlLCB0cmFuc2l0aW9uOidib3gtc2hhZG93IDAuMnMnLCBib3hTaGFkb3c6IHN0eWxlLmJveFNoYWRvdyA/IHN0eWxlLmJveFNoYWRvdyArICcgLCAnICsgZnJvemVuU2hhZG93OiBmcm96ZW5TaGFkb3cgfSA6IHN0eWxlLFxyXG4gICAgICAgICAgICBvbjogZnJvemVuID9cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IHNlbGVjdEhvdmVyQWN0aXZlID8gW3NlbGVjdE5vZGVIb3ZlciwgcmVmXTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBbc2VsZWN0Tm9kZUNsaWNrLCByZWZdXHJcbiAgICAgICAgICAgICAgICB9OntcclxuICAgICAgICAgICAgICAgICAgICBjbGljazogbm9kZS5jbGljayA/IFtlbWl0RXZlbnQsIG5vZGUuY2xpY2tdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0OiBub2RlLmlucHV0ID8gW2VtaXRFdmVudCwgbm9kZS5pbnB1dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZGJsY2xpY2s6IG5vZGUuZGJsY2xpY2sgPyBbZW1pdEV2ZW50LCBub2RlLmRibGNsaWNrXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBtb3VzZW92ZXI6IG5vZGUubW91c2VvdmVyID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW92ZXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vdXNlb3V0OiBub2RlLm1vdXNlb3V0ID8gW2VtaXRFdmVudCwgbm9kZS5tb3VzZW91dF0gOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9jdXM6IG5vZGUuZm9jdXMgPyBbZW1pdEV2ZW50LCBub2RlLmZvY3VzXSA6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgICAgICBibHVyOiBub2RlLmJsdXIgPyBbZW1pdEV2ZW50LCBub2RlLmJsdXJdIDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvcHM6IHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXNvbHZlKG5vZGUudmFsdWUpLFxyXG4gICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6IG5vZGUucGxhY2Vob2xkZXJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaCgnaW5wdXQnLCBkYXRhKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxpc3ROb2RlKHJlZikge1xyXG4gICAgICAgIGNvbnN0IG5vZGUgPSBkZWZpbml0aW9uW3JlZi5yZWZdW3JlZi5pZF1cclxuICAgICAgICBjb25zdCBsaXN0ID0gcmVzb2x2ZShub2RlLnZhbHVlKVxyXG5cclxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9IE9iamVjdC5rZXlzKGxpc3QpLm1hcChrZXk9Pmxpc3Rba2V5XSkubWFwKCh2YWx1ZSwgaW5kZXgpPT4ge1xyXG4gICAgICAgICAgICBjdXJyZW50TWFwVmFsdWVbcmVmLmlkXSA9IHZhbHVlXHJcbiAgICAgICAgICAgIGN1cnJlbnRNYXBJbmRleFtyZWYuaWRdID0gaW5kZXhcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBub2RlLmNoaWxkcmVuLm1hcChyZXNvbHZlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZGVsZXRlIGN1cnJlbnRNYXBWYWx1ZVtyZWYuaWRdO1xyXG4gICAgICAgIGRlbGV0ZSBjdXJyZW50TWFwSW5kZXhbcmVmLmlkXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgbGlzdGVuZXJzID0gW11cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcihjYWxsYmFjaykge1xyXG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IGxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKVxyXG5cclxuICAgICAgICAvLyBmb3IgdW5zdWJzY3JpYmluZ1xyXG4gICAgICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuc3BsaWNlKGxlbmd0aCAtIDEsIDEpXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZW1pdEV2ZW50KGV2ZW50UmVmLCBlKSB7XHJcbiAgICAgICAgY29uc3QgZXZlbnRJZCA9IGV2ZW50UmVmLmlkXHJcbiAgICAgICAgY29uc3QgZXZlbnQgPSBkZWZpbml0aW9uLmV2ZW50W2V2ZW50SWRdXHJcbiAgICAgICAgY3VycmVudEV2ZW50ID0gZVxyXG4gICAgICAgIGV2ZW50LmRhdGEuZm9yRWFjaCgocmVmKT0+e1xyXG4gICAgICAgICAgICBpZihyZWYuaWQgPT09ICdfaW5wdXQnKXtcclxuICAgICAgICAgICAgICAgIGV2ZW50RGF0YVtyZWYuaWRdID0gZS50YXJnZXQudmFsdWVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgcHJldmlvdXNTdGF0ZSA9IGN1cnJlbnRTdGF0ZVxyXG4gICAgICAgIGxldCBtdXRhdGlvbnMgPSB7fVxyXG4gICAgICAgIGRlZmluaXRpb24uZXZlbnRbZXZlbnRJZF0ubXV0YXRvcnMuZm9yRWFjaCgocmVmKT0+IHtcclxuICAgICAgICAgICAgY29uc3QgbXV0YXRvciA9IGRlZmluaXRpb24ubXV0YXRvcltyZWYuaWRdXHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gbXV0YXRvci5zdGF0ZVxyXG4gICAgICAgICAgICBtdXRhdGlvbnNbc3RhdGUuaWRdID0gcmVzb2x2ZShtdXRhdG9yLm11dGF0aW9uKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY3VycmVudFN0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY3VycmVudFN0YXRlLCBtdXRhdGlvbnMpXHJcbiAgICAgICAgbGlzdGVuZXJzLmZvckVhY2goY2FsbGJhY2sgPT4gY2FsbGJhY2soZXZlbnRJZCwgZXZlbnREYXRhLCBlLCBwcmV2aW91c1N0YXRlLCBjdXJyZW50U3RhdGUsIG11dGF0aW9ucykpXHJcbiAgICAgICAgY3VycmVudEV2ZW50ID0ge31cclxuICAgICAgICBldmVudERhdGEgPSB7fVxyXG4gICAgICAgIGlmKE9iamVjdC5rZXlzKG11dGF0aW9ucykubGVuZ3RoKXtcclxuICAgICAgICAgICAgcmVuZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IHZkb20gPSByZXNvbHZlKHtyZWY6J3ZOb2RlQm94JywgaWQ6J19yb290Tm9kZSd9KVxyXG4gICAgZnVuY3Rpb24gcmVuZGVyKG5ld0RlZmluaXRpb24pIHtcclxuICAgICAgICBpZihuZXdEZWZpbml0aW9uKXtcclxuICAgICAgICAgICAgaWYoZGVmaW5pdGlvbi5zdGF0ZSAhPT0gbmV3RGVmaW5pdGlvbi5zdGF0ZSl7XHJcbiAgICAgICAgICAgICAgICBkZWZpbml0aW9uID0gbmV3RGVmaW5pdGlvblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3U3RhdGUgPSBPYmplY3Qua2V5cyhkZWZpbml0aW9uLnN0YXRlKS5tYXAoa2V5PT5kZWZpbml0aW9uLnN0YXRlW2tleV0pLnJlZHVjZSgoYWNjLCBkZWYpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY1tkZWYucmVmXSA9IGRlZi5kZWZhdWx0VmFsdWVcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjXHJcbiAgICAgICAgICAgICAgICB9LCB7fSlcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRTdGF0ZSA9IHsuLi5uZXdTdGF0ZSwgLi4uY3VycmVudFN0YXRlfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGVmaW5pdGlvbiA9IG5ld0RlZmluaXRpb25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBuZXd2ZG9tID0gcmVzb2x2ZSh7cmVmOid2Tm9kZUJveCcsIGlkOidfcm9vdE5vZGUnfSlcclxuICAgICAgICBwYXRjaCh2ZG9tLCBuZXd2ZG9tKVxyXG4gICAgICAgIHZkb20gPSBuZXd2ZG9tXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gX2ZyZWV6ZShpc0Zyb3plbiwgY2FsbGJhY2ssIG5vZGVJZCkge1xyXG4gICAgICAgIGZyb3plbkNhbGxiYWNrID0gY2FsbGJhY2tcclxuICAgICAgICBzZWxlY3RlZE5vZGVJbkRldmVsb3BtZW50ID0gbm9kZUlkXHJcbiAgICAgICAgaWYoZnJvemVuID09PSBmYWxzZSAmJiBpc0Zyb3plbiA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgIHNlbGVjdEhvdmVyQWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihmcm96ZW4gfHwgZnJvemVuICE9PSBpc0Zyb3plbil7XHJcbiAgICAgICAgICAgIGZyb3plbiA9IGlzRnJvemVuXHJcbiAgICAgICAgICAgIHJlbmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldEN1cnJlbnRTdGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gY3VycmVudFN0YXRlXHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0Q3VycmVudFN0YXRlKG5ld1N0YXRlKSB7XHJcbiAgICAgICAgY3VycmVudFN0YXRlID0gbmV3U3RhdGVcclxuICAgICAgICByZW5kZXIoKVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZURlZmF1bHRTdGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoZGVmaW5pdGlvbi5zdGF0ZSkubWFwKGtleT0+ZGVmaW5pdGlvbi5zdGF0ZVtrZXldKS5yZWR1Y2UoKGFjYywgZGVmKT0+IHtcclxuICAgICAgICAgICAgYWNjW2RlZi5yZWZdID0gZGVmLmRlZmF1bHRWYWx1ZVxyXG4gICAgICAgICAgICByZXR1cm4gYWNjXHJcbiAgICAgICAgfSwge30pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBkZWZpbml0aW9uLFxyXG4gICAgICAgIHZkb20sXHJcbiAgICAgICAgZ2V0Q3VycmVudFN0YXRlLFxyXG4gICAgICAgIHNldEN1cnJlbnRTdGF0ZSxcclxuICAgICAgICByZW5kZXIsXHJcbiAgICAgICAgZW1pdEV2ZW50LFxyXG4gICAgICAgIGFkZExpc3RlbmVyLFxyXG4gICAgICAgIF9mcmVlemUsXHJcbiAgICAgICAgX3Jlc29sdmU6IHJlc29sdmUsXHJcbiAgICAgICAgY3JlYXRlRGVmYXVsdFN0YXRlXHJcbiAgICB9XHJcbn0iLCJtb2R1bGUuZXhwb3J0cz17XHJcbiAgXCJldmVudERhdGFcIjoge1xyXG4gICAgXCJfaW5wdXRcIjoge1xyXG4gICAgICBcInRpdGxlXCI6IFwiaW5wdXQgdmFsdWVcIixcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiXHJcbiAgICB9XHJcbiAgfSxcclxuICBcInRvTG93ZXJDYXNlXCI6IHt9LFxyXG4gIFwidG9VcHBlckNhc2VcIjoge30sXHJcbiAgXCJlcXVhbFwiOiB7XHJcbiAgICBcImE3MjUxYWYwLTUwYTctNDgyMy04NWEwLTY2Y2UwOWQ4YTNjY1wiOiB7XHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJlZTI0MjNlNi01YjQ4LTQxYWUtOGNjZi02YTJjN2I0NmQyZjhcIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBcImFuZFwiOiB7fSxcclxuICBcIm9yXCI6IHt9LFxyXG4gIFwibGVuZ3RoXCI6IHt9LFxyXG4gIFwicGlwZVwiOiB7XHJcbiAgICBcImZ3OGpkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIk51bWJlciBjdXJyZW50bHkgaXM6IFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJqb2luXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwicDlzM2Q2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwiam9pblwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcIjhhNmNkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJ1bTVlZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwic3RhdGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfSxcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcInVpOGpkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIitcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImM4d2VkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIi1cIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcInBkcTZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiLFxyXG4gICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInN0YXRlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBcInJlZlwiOiBcImFkZFwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcInc4NmZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCI0NTJxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJudW1iZXJcIixcclxuICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI0NnZkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJzdWJ0cmFjdFwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcInU0M3dkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJldzgzZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJudW1iZXJcIixcclxuICAgICAgXCJ2YWx1ZVwiOiAxLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwidzNlOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgIFwidmFsdWVcIjogMSxcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjNxa2lkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiLFxyXG4gICAgICBcInZhbHVlXCI6IDAsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBcInJlZlwiOiBcImFkZFwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcIndicjdkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBcInJlZlwiOiBcImpvaW5cIixcclxuICAgICAgICAgIFwiaWRcIjogXCJzMjU4ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwidDd2cWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgIFwidmFsdWVcIjogMCxcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwiYWRkXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwidnE4ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwiam9pblwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcIndmOWFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9LFxyXG4gICAgXCJxd3c5ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCJweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwicWR3N2M2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwicHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjg0MzY5YWJhLTRhNGQtNDkzMi04YTlhLThmOWNhOTQ4YjZhMlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIlRoZSBudW1iZXIgaXMgZXZlbiDwn46JXCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCJjMmZiOWE5Yi0yNWJiLTRlOGItODBjMC1jZjUxYjg1MDYwNzBcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJib29sZWFuXCIsXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwic3RhdGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfSxcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwicmVtYWluZGVyXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwiMzQ3ODBkMjItZjUyMS00YzMwLTg5YTUtM2U3ZjViNWFmN2MyXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwiZXF1YWxcIixcclxuICAgICAgICAgIFwiaWRcIjogXCJhNzI1MWFmMC01MGE3LTQ4MjMtODVhMC02NmNlMDlkOGEzY2NcIlxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIFwiMTIyOWQ0NzgtYmMyNS00NDAxLThhODktNzRmYzZjZmU4OTk2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwibnVtYmVyXCIsXHJcbiAgICAgIFwidmFsdWVcIjogMixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImVlMjQyM2U2LTViNDgtNDFhZS04Y2NmLTZhMmM3YjQ2ZDJmOFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcIm51bWJlclwiLFxyXG4gICAgICBcInZhbHVlXCI6IDAsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCI5NDVmMDgxOC03NzQzLTRlZGQtOGM3Ni0zZGQ1YThiYTdmYTlcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCInQ29tZm9ydGFhJywgY3Vyc2l2ZVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiYTYwODk5ZWUtOTkyNS00ZTA1LTg5MGUtYjk0MjhiMDJkYmY5XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiI2Y1ZjVmNVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiMWU0NjU0MDMtNTM4Mi00YTQ1LTg5ZGEtOGQ4OGUyZWIyZmI5XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTAwJVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiZWYyZWMxODQtMTk5Zi00ZWU4LThlMzAtYjk5ZGJjMWRmNWRiXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiZmFiMjg2YzQtZGVkMy00YTVlLTg3NDktNzY3OGFiY2JiMTI1XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweCA1cHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjcwM2Y4ZTAyLWM1YzMtNGQyNy04Y2EyLTcyMmM0ZDBkMWVhMFwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHggMTVweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiOGYzYzY2MzAtZDhkOS00YmMxLThhM2QtYmE0ZGFkMzA5MWYwXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiI2FhYWFhYVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiZDMxYzQ3NDYtMjMyOS00NDA0LTg2ODktZmJmMjM5M2VmZDQ0XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiaW5saW5lLWJsb2NrXCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCI0MTY4NWFkYy0zNzkzLTQ1NjYtOGY2MS0yYzJhNDJmZGY4NmVcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCI1cHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImQ1NzU0ZmRiLTQ2ODktNGY4Ny04N2ZjLTUxZDYwMDIyYjMyY1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjNweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiMGJjNmExOGMtMTc2Ni00MmJkLThiNGEtMjAyYTJiMGMzNGZlXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwicG9pbnRlclwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiOWIyNTBlZjgtYzFiZS00NzA2LThhNzEtZjQ0NGYxOGYwZjgyXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwibm9uZVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiYXNkOTBlZjgtYzFiZS00NzA2LThhNzEtZjQ0NGYxOGYwZjgyXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwibm9uZVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiYjBhMTA0OTctZWMyNi00ZmY3LTg3MzktYTE5Mzc1NWNiY2FlXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweCA1cHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjg3NjRlMjU4LTU5OWQtNDI1Mi04MTEyLWQwNmZjZDBkNWUyYVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHggMTVweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiOGNhYWY4NzYtMTBiYy00N2RlLTg5ZDktODY5Yzg5MmNkNGNlXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiIzk5OTk5OVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiYWU5ODdiYmEtNzM0YS00NmFlLThjODItYzA0ODk2MjIxMTc5XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiaW5saW5lLWJsb2NrXCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCJmMDA5MGY4ZC04N2I0LTRkODMtOGE1My0wMzliMjFlMmI1OTRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCI1cHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImI3Yzc5MWE2LTJjOTEtNGI2Mi04ODIwLWRiYWFmOWQ1YzE3OVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjNweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiZDc5NWE1MTAtY2NmOS00ZDkyLTgxZWUtNWU1MTJiODFlZTU4XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwicG9pbnRlclwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiNzUxODUyNGEtMGJjMi00NjVjLTgxNGUtMGE1ZDM5ZGUyNWUzXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweCA1cHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImIyNGIxYzE4LThhODItNGM4Zi04MTgwLTZkMDYyYzc4YzlkOVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIm5vbmVcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjY3ZjcwZDk3LWEzNDYtNDJlNC04MzNmLTZlYWVhZWVkNGZlZlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHggMTBweCAxMHB4IDBcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjk4MjU3NDYxLTkyOGUtNGZmOS04YWM1LTBiODkyOThlNGVmMVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHggMTBweCAxMHB4IDBcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjk5MzFmZTZhLTA3NGUtNGNiNy04MzU1LWMxOGQ4MTg2NzlhN1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjcyYjU1OWU5LTI1NDYtNGJhZS04YTYxLTU1NTU2NzM2M2IxMVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcInJpZ2h0XCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCIzMGY4YzcwMS03YWRmLTQzOTgtODYyZS01NTM3MmUyOWMxNGRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCI1MHB4XCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCI2NjM1ZGJiMi1iMzY0LTRlZmQtODA2MS0yNjQzMjAwN2ViMWFcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCJyaWdodFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiMDQyY2NmN2QtODE5Yi00ZmFjLTgyODItMmYxOTA2OWI1Mzg2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiNTAwcHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImU3YmM2ZTIwLTE1MTAtNGJhYy04NTlmLTA0ZWMzZGNkYTY2YlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEuNVwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiZWY4ZGM5YzYtZjMzMy00YjYxLThkMjUtZDM2YWZlNTE3NTIwXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiNzU1YTcwYTItZDE4MS00ZmFmLTg1OTMtNWFiNzYwMTE1OGY5XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiYmxvY2tcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjlmNTAxYzM1LTU0YjMtNGM2MC04ZmM0LWQ2YTQ1ZTc3NmViM1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImU4YWNjNmIwLWQxZGUtNDQzYi04MTI4LWRmNmI1MTg2ZjcwY1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcImJsb2NrXCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCI3MTc2NDM2Mi1lMDlhLTQ0MTItOGZiYy1lZDNjYjRkNGM5NTRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCIxMHB4XCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCJjMTk5YjE5MS04OGQyLTQ2M2QtODU2NC0xY2UxYTE2MzFiMmRcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCJibG9ja1wiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiYjIxMTdlNmItYWNlNy00ZTc1LThlN2QtMzIzNjY4ZDFiMTlkXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiMTBweFwiLFxyXG4gICAgICBcInRyYW5zZm9ybWF0aW9uc1wiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiOGE1Mzg0OGQtOGM3ZC00NGRjLThkMTMtYWUwNjAxMDdjODBiXCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwidGV4dFwiLFxyXG4gICAgICBcInZhbHVlXCI6IFwiYmxvY2tcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcIjE5MDZiNWI0LTYwMjQtNDhmMS04NGRhLWMzMzJlNTU1YWZiM1wiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcIjEwcHhcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH0sXHJcbiAgICBcImE1NjU2OTZkLThhNjAtNDE2ZS04NDRhLTYwYzhmMmZlOGM1YVwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcInRleHRcIixcclxuICAgICAgXCJ2YWx1ZVwiOiBcImJsb2NrXCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCIxNWQ0N2IwNy0zOTZjLTRjMDMtODU5MS1mNDcyNTk4ZjE1ZTJcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCIxMHB4XCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCJhOGY1YzFjZS03ODNiLTQ2MjYtODI2YS00NzNhYjQzNGMwYjJcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCIxMHB4XCIsXHJcbiAgICAgIFwidHJhbnNmb3JtYXRpb25zXCI6IFtdXHJcbiAgICB9LFxyXG4gICAgXCI5cWM4NDI3NC01ZWZjLTRiZTEtODMwYi0wZmY4YzkyYjUwMjlcIjoge1xyXG4gICAgICBcInR5cGVcIjogXCJ0ZXh0XCIsXHJcbiAgICAgIFwidmFsdWVcIjogXCJcIixcclxuICAgICAgXCJ0cmFuc2Zvcm1hdGlvbnNcIjogW11cclxuICAgIH1cclxuICB9LFxyXG4gIFwiam9pblwiOiB7XHJcbiAgICBcInA5czNkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJ1bTVlZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJ3ZjlhZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwicXd3OWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiczI1OGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcInFkdzdjNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjhhNmNkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI5cWM4NDI3NC01ZWZjLTRiZTEtODMwYi0wZmY4YzkyYjUwMjlcIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBcImFkZFwiOiB7XHJcbiAgICBcInc4NmZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJldzgzZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJ3YnI3ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiOGQ0dmQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwidnE4ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ2YWx1ZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjdkYnZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIFwic3VidHJhY3RcIjoge1xyXG4gICAgXCJ1NDN3ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwidzNlOWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJtdWx0aXBseVwiOiB7fSxcclxuICBcImRpdmlkZVwiOiB7fSxcclxuICBcInJlbWFpbmRlclwiOiB7XHJcbiAgICBcIjM0NzgwZDIyLWY1MjEtNGMzMC04OWE1LTNlN2Y1YjVhZjdjMlwiOiB7XHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCIxMjI5ZDQ3OC1iYzI1LTQ0MDEtOGE4OS03NGZjNmNmZTg5OTZcIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBcInZOb2RlQm94XCI6IHtcclxuICAgIFwiX3Jvb3ROb2RlXCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcImFwcFwiLFxyXG4gICAgICBcInN0eWxlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIl9yb290U3R5bGVcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInBhcmVudFwiOiB7fSxcclxuICAgICAgXCJjaGlsZHJlblwiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZVRleHRcIixcclxuICAgICAgICAgIFwiaWRcIjogXCIyNDcxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZVRleHRcIixcclxuICAgICAgICAgIFwiaWRcIjogXCIxNDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZVRleHRcIixcclxuICAgICAgICAgIFwiaWRcIjogXCIzNDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUlmXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwiNTc4N2MxNWEtNDI2Yi00MWViLTgzMWQtZTNlMDc0MTU5NTgyXCJcclxuICAgICAgICB9XHJcbiAgICAgIF1cclxuICAgIH1cclxuICB9LFxyXG4gIFwidk5vZGVUZXh0XCI6IHtcclxuICAgIFwiMjQ3MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIk51bWJlciBjdXJyZW50bHlcIixcclxuICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJzdHlsZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI4NDgxZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInBhcmVudFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUJveFwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJfcm9vdE5vZGVcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInZhbHVlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiZnc4amQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiMTQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIisgYnV0dG9uXCIsXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJ1aThqZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInN0eWxlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjk0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwicGFyZW50XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInZOb2RlQm94XCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIl9yb290Tm9kZVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiY2xpY2tcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwiZXZlbnRcIixcclxuICAgICAgICBcImlkXCI6IFwiZDQ4cmQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiMzQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIi0gYnV0dG9uXCIsXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJjOHdlZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInN0eWxlXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInN0eWxlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjc0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwicGFyZW50XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInZOb2RlQm94XCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIl9yb290Tm9kZVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiY2xpY2tcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwiZXZlbnRcIixcclxuICAgICAgICBcImlkXCI6IFwiM2E1NGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiZThhZGQxYzctOGEwMS00MTY0LTg2MDQtNzIyZDhhYjUyOWYxXCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcImlzIGV2ZW5cIixcclxuICAgICAgXCJzdHlsZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJzdHlsZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI0ZGNhNzNiMy05MGViLTQxZTctODY1MS0yYmRjYzkzZjM4NzFcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInBhcmVudFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUlmXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjU3ODdjMTVhLTQyNmItNDFlYi04MzFkLWUzZTA3NDE1OTU4MlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI4NDM2OWFiYS00YTRkLTQ5MzItOGE5YS04ZjljYTk0OGI2YTJcIlxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBcInZOb2RlSW5wdXRcIjoge30sXHJcbiAgXCJ2Tm9kZUxpc3RcIjoge30sXHJcbiAgXCJ2Tm9kZUlmXCI6IHtcclxuICAgIFwiNTc4N2MxNWEtNDI2Yi00MWViLTgzMWQtZTNlMDc0MTU5NTgyXCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcImlzIG51bWJlciBldmVuXCIsXHJcbiAgICAgIFwidmFsdWVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJjMmZiOWE5Yi0yNWJiLTRlOGItODBjMC1jZjUxYjg1MDYwNzBcIlxyXG4gICAgICB9LFxyXG4gICAgICBcInBhcmVudFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZUJveFwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJfcm9vdE5vZGVcIlxyXG4gICAgICB9LFxyXG4gICAgICBcImNoaWxkcmVuXCI6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBcInJlZlwiOiBcInZOb2RlVGV4dFwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcImU4YWRkMWM3LThhMDEtNDE2NC04NjA0LTcyMmQ4YWI1MjlmMVwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuICBcInZOb2RlSW1hZ2VcIjoge30sXHJcbiAgXCJzdHlsZVwiOiB7XHJcbiAgICBcIl9yb290U3R5bGVcIjoge1xyXG4gICAgICBcImZvbnRGYW1pbHlcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI5NDVmMDgxOC03NzQzLTRlZGQtOGM3Ni0zZGQ1YThiYTdmYTlcIlxyXG4gICAgICB9LFxyXG4gICAgICBcImJhY2tncm91bmRcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJhNjA4OTllZS05OTI1LTRlMDUtODkwZS1iOTQyOGIwMmRiZjlcIlxyXG4gICAgICB9LFxyXG4gICAgICBcIm1pbkhlaWdodFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjFlNDY1NDAzLTUzODItNGE0NS04OWRhLThkODhlMmViMmZiOVwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjg0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImVmMmVjMTg0LTE5OWYtNGVlOC04ZTMwLWI5OWRiYzFkZjVkYlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwibWFyZ2luXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiZmFiMjg2YzQtZGVkMy00YTVlLTg3NDktNzY3OGFiY2JiMTI1XCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiOTQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJwYWRkaW5nXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNzAzZjhlMDItYzVjMy00ZDI3LThjYTItNzIyYzRkMGQxZWEwXCJcclxuICAgICAgfSxcclxuICAgICAgXCJiYWNrZ3JvdW5kXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiOGYzYzY2MzAtZDhkOS00YmMxLThhM2QtYmE0ZGFkMzA5MWYwXCJcclxuICAgICAgfSxcclxuICAgICAgXCJkaXNwbGF5XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiZDMxYzQ3NDYtMjMyOS00NDA0LTg2ODktZmJmMjM5M2VmZDQ0XCJcclxuICAgICAgfSxcclxuICAgICAgXCJib3JkZXJSYWRpdXNcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJkNTc1NGZkYi00Njg5LTRmODctODdmYy01MWQ2MDAyMmIzMmNcIlxyXG4gICAgICB9LFxyXG4gICAgICBcImN1cnNvclwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjBiYzZhMThjLTE3NjYtNDJiZC04YjRhLTIwMmEyYjBjMzRmZVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwidXNlclNlbGVjdFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjliMjUwZWY4LWMxYmUtNDcwNi04YTcxLWY0NDRmMThmMGY4MlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwibWFyZ2luXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiYjBhMTA0OTctZWMyNi00ZmY3LTg3MzktYTE5Mzc1NWNiY2FlXCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiNzQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJwYWRkaW5nXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiODc2NGUyNTgtNTk5ZC00MjUyLTgxMTItZDA2ZmNkMGQ1ZTJhXCJcclxuICAgICAgfSxcclxuICAgICAgXCJiYWNrZ3JvdW5kXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiOGNhYWY4NzYtMTBiYy00N2RlLTg5ZDktODY5Yzg5MmNkNGNlXCJcclxuICAgICAgfSxcclxuICAgICAgXCJkaXNwbGF5XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiYWU5ODdiYmEtNzM0YS00NmFlLThjODItYzA0ODk2MjIxMTc5XCJcclxuICAgICAgfSxcclxuICAgICAgXCJ1c2VyU2VsZWN0XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiYXNkOTBlZjgtYzFiZS00NzA2LThhNzEtZjQ0NGYxOGYwZjgyXCJcclxuICAgICAgfSxcclxuICAgICAgXCJib3JkZXJSYWRpdXNcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwicGlwZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCJiN2M3OTFhNi0yYzkxLTRiNjItODgyMC1kYmFhZjlkNWMxNzlcIlxyXG4gICAgICB9LFxyXG4gICAgICBcImN1cnNvclwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImQ3OTVhNTEwLWNjZjktNGQ5Mi04MWVlLTVlNTEyYjgxZWU1OFwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwibWFyZ2luXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNzUxODUyNGEtMGJjMi00NjVjLTgxNGUtMGE1ZDM5ZGUyNWUzXCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiODA5MmFjNWUtZGZkMC00NDkyLWE2NWQtOGFjM2VlYzMyNWUwXCI6IHtcclxuICAgICAgXCJwYWRkaW5nXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNjdmNzBkOTctYTM0Ni00MmU0LTgzM2YtNmVhZWFlZWQ0ZmVmXCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiYTk0NjFlMjgtN2Q5Mi00OWEwLTkwMDEtMjNkNzRlNGIzODJkXCI6IHtcclxuICAgICAgXCJwYWRkaW5nXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiOTgyNTc0NjEtOTI4ZS00ZmY5LThhYzUtMGI4OTI5OGU0ZWYxXCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiNzY2YjExZWMtZGEyNy00OTRjLWIyNzItYzI2ZmVjM2Y2NDc1XCI6IHtcclxuICAgICAgXCJwYWRkaW5nXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiOTkzMWZlNmEtMDc0ZS00Y2I3LTgzNTUtYzE4ZDgxODY3OWE3XCJcclxuICAgICAgfSxcclxuICAgICAgXCJmbG9hdFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjcyYjU1OWU5LTI1NDYtNGJhZS04YTYxLTU1NTU2NzM2M2IxMVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwidGV4dEFsaWduXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNjYzNWRiYjItYjM2NC00ZWZkLTgwNjEtMjY0MzIwMDdlYjFhXCJcclxuICAgICAgfSxcclxuICAgICAgXCJtYXhXaWR0aFwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjA0MmNjZjdkLTgxOWItNGZhYy04MjgyLTJmMTkwNjliNTM4NlwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImNiY2Q4ZWRiLTRhYTItNDNmZS1hZDM5LWNlZTc5YjQ5MDI5NVwiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImVmOGRjOWM2LWYzMzMtNGI2MS04ZDI1LWQzNmFmZTUxNzUyMFwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGlzcGxheVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjc1NWE3MGEyLWQxODEtNGZhZi04NTkzLTVhYjc2MDExNThmOVwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjY3NjNmMTAyLTIzZjctNDM5MC1iNDYzLTRlMWIxNGU4NjZjOVwiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjlmNTAxYzM1LTU0YjMtNGM2MC04ZmM0LWQ2YTQ1ZTc3NmViM1wiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGlzcGxheVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImU4YWNjNmIwLWQxZGUtNDQzYi04MTI4LWRmNmI1MTg2ZjcwY1wiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjkxYzlhZGYwLWQ2MmUtNDU4MC05M2U3LWYzOTU5NGFlNWU3ZFwiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjcxNzY0MzYyLWUwOWEtNDQxMi04ZmJjLWVkM2NiNGQ0Yzk1NFwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGlzcGxheVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImMxOTliMTkxLTg4ZDItNDYzZC04NTY0LTFjZTFhMTYzMWIyZFwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImU5ZmJlYjM5LTcxOTMtNDUyMi05MWIzLTc2MWJkMzU2MzlkM1wiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImIyMTE3ZTZiLWFjZTctNGU3NS04ZTdkLTMyMzY2OGQxYjE5ZFwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGlzcGxheVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjhhNTM4NDhkLThjN2QtNDRkYy04ZDEzLWFlMDYwMTA3YzgwYlwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjNjZjVkODlkLTM3MDMtNDgzZS1hYjY0LTVhNWI3ODBhZWMyN1wiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjE5MDZiNWI0LTYwMjQtNDhmMS04NGRhLWMzMzJlNTU1YWZiM1wiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGlzcGxheVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImE1NjU2OTZkLThhNjAtNDE2ZS04NDRhLTYwYzhmMmZlOGM1YVwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjRkY2E3M2IzLTkwZWItNDFlNy04NjUxLTJiZGNjOTNmMzg3MVwiOiB7XHJcbiAgICAgIFwicGFkZGluZ1wiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImE4ZjVjMWNlLTc4M2ItNDYyNi04MjZhLTQ3M2FiNDM0YzBiMlwiXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIFwibmFtZVNwYWNlXCI6IHtcclxuICAgIFwiX3Jvb3ROYW1lU3BhY2VcIjoge1xyXG4gICAgICBcInRpdGxlXCI6IFwic3RhdGVcIixcclxuICAgICAgXCJjaGlsZHJlblwiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuICBcInN0YXRlXCI6IHtcclxuICAgIFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ0aXRsZVwiOiBcIm51bWJlclwiLFxyXG4gICAgICBcInJlZlwiOiBcIjQ2dmRkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiLFxyXG4gICAgICBcInR5cGVcIjogXCJudW1iZXJcIixcclxuICAgICAgXCJkZWZhdWx0VmFsdWVcIjogMCxcclxuICAgICAgXCJtdXRhdG9yc1wiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJtdXRhdG9yXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwiYXM1NWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwibXV0YXRvclwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcIjlkcThkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9XHJcbiAgfSxcclxuICBcIm11dGF0b3JcIjoge1xyXG4gICAgXCJhczU1ZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIjoge1xyXG4gICAgICBcImV2ZW50XCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcImV2ZW50XCIsXHJcbiAgICAgICAgXCJpZFwiOiBcImQ0OHJkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwic3RhdGVcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwic3RhdGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNDZ2ZGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfSxcclxuICAgICAgXCJtdXRhdGlvblwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJwaXBlXCIsXHJcbiAgICAgICAgXCJpZFwiOiBcInBkcTZkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcIjlkcThkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwiZXZlbnRcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwiZXZlbnRcIixcclxuICAgICAgICBcImlkXCI6IFwiM2E1NGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfSxcclxuICAgICAgXCJzdGF0ZVwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJzdGF0ZVwiLFxyXG4gICAgICAgIFwiaWRcIjogXCI0NnZkZDZkMi0wMGRiLThhYjUtYzMzMi04ODI1NzVmMjU0MjZcIlxyXG4gICAgICB9LFxyXG4gICAgICBcIm11dGF0aW9uXCI6IHtcclxuICAgICAgICBcInJlZlwiOiBcInBpcGVcIixcclxuICAgICAgICBcImlkXCI6IFwiNDUycWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJldmVudFwiOiB7XHJcbiAgICBcImQ0OHJkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiOiB7XHJcbiAgICAgIFwidHlwZVwiOiBcImNsaWNrXCIsXHJcbiAgICAgIFwibXV0YXRvcnNcIjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIFwicmVmXCI6IFwibXV0YXRvclwiLFxyXG4gICAgICAgICAgXCJpZFwiOiBcImFzNTVkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNlwiXHJcbiAgICAgICAgfVxyXG4gICAgICBdLFxyXG4gICAgICBcImVtaXR0ZXJcIjoge1xyXG4gICAgICAgIFwicmVmXCI6IFwidk5vZGVUZXh0XCIsXHJcbiAgICAgICAgXCJpZFwiOiBcIjE0ODFkNmQyLTAwZGItOGFiNS1jMzMyLTg4MjU3NWYyNTQyNVwiXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiZGF0YVwiOiBbXVxyXG4gICAgfSxcclxuICAgIFwiM2E1NGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCI6IHtcclxuICAgICAgXCJ0eXBlXCI6IFwiY2xpY2tcIixcclxuICAgICAgXCJtdXRhdG9yc1wiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgXCJyZWZcIjogXCJtdXRhdG9yXCIsXHJcbiAgICAgICAgICBcImlkXCI6IFwiOWRxOGQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI2XCJcclxuICAgICAgICB9XHJcbiAgICAgIF0sXHJcbiAgICAgIFwiZW1pdHRlclwiOiB7XHJcbiAgICAgICAgXCJyZWZcIjogXCJ2Tm9kZVRleHRcIixcclxuICAgICAgICBcImlkXCI6IFwiMzQ4MWQ2ZDItMDBkYi04YWI1LWMzMzItODgyNTc1ZjI1NDI1XCJcclxuICAgICAgfSxcclxuICAgICAgXCJkYXRhXCI6IFtdXHJcbiAgICB9XHJcbiAgfVxyXG59Il19
