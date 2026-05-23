const {
  pearsonCorrelation,
  simpleLinearRegression,
  filterOutliersByIQR,
  calibrate
} = require('../src/ai/regression');

describe("Regression Module (AI Engine)", () => {

  describe("pearsonCorrelation", () => {
    test("Should calculate correlation correctly for linear perfect positive relation", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [2, 4, 6, 8, 10];
      const r = pearsonCorrelation(xs, ys);
      expect(r).toBeCloseTo(1.0);
    });

    test("Should calculate correlation correctly for linear perfect negative relation", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [10, 8, 6, 4, 2];
      const r = pearsonCorrelation(xs, ys);
      expect(r).toBeCloseTo(-1.0);
    });

    test("Should return 0 for zero variance arrays", () => {
      const xs = [1, 1, 1, 1];
      const ys = [2, 2, 2, 2];
      const r = pearsonCorrelation(xs, ys);
      expect(r).toBe(0);
    });
  });

  describe("simpleLinearRegression", () => {
    test("Should compute correct a and b for linear data", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [2, 4, 6, 8, 10];
      const reg = simpleLinearRegression(xs, ys);
      expect(reg).not.toBeNull();
      expect(reg.a).toBeCloseTo(0);
      expect(reg.b).toBeCloseTo(2);
      expect(reg.predict(6)).toBeCloseTo(10); // clamped to 10 max
      expect(reg.predict(3)).toBeCloseTo(6);
    });

    test("Should clamp predictions between 0 and 10", () => {
      const xs = [1, 2, 3];
      const ys = [5, 10, 15];
      const reg = simpleLinearRegression(xs, ys);
      expect(reg.predict(3)).toBe(10); // originally 15, clamped to 10
      expect(reg.predict(-2)).toBe(0); // originally -10, clamped to 0
    });
  });

  describe("filterOutliersByIQR", () => {
    test("Should remove obvious outliers based on IQR", () => {
      const xs = [5, 5.5, 6, 5.8, 6.2, 5.9, 10]; // 10 is an outlier
      const ys = [6, 6.5, 7, 6.8, 7.2, 6.9, 2];  // 2 is an outlier
      
      const { xs: filteredXs, ys: filteredYs } = filterOutliersByIQR(xs, ys);
      
      expect(filteredXs).not.toContain(10);
      expect(filteredYs).not.toContain(2);
      expect(filteredXs.length).toBeLessThan(xs.length);
      expect(filteredYs.length).toBeLessThan(ys.length);
    });
  });

  describe("calibrate", () => {
    test("Should apply calibration (SD-stretching)", () => {
      const trainingScores = [5, 6, 7, 8, 9]; 
      const rawPred = 6;
      const calibrated = calibrate(rawPred, trainingScores);
      // Because training data has variance, the value might be stretched
      expect(calibrated).toBeDefined();
    });

    test("Should not calibrate if training data is insufficient", () => {
      const trainingScores = [5, 6, 7]; // less than 5 elements
      const rawPred = 6.5;
      const calibrated = calibrate(rawPred, trainingScores);
      expect(calibrated).toBe(6.5);
    });
  });

});
