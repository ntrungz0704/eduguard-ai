const { calculateRiskScore, classifyRiskLevel } = require('../src/shared/utils');

describe("Shared Utils Module", () => {
  
  describe("calculateRiskScore", () => {
    test("High GPA should return low risk", () => {
      const result = calculateRiskScore({
        gpa: 8.5,
        attendance: 95,
        failedSubjects: 0,
      });

      expect(result).toBeLessThan(0.3);
    });

    test("Low GPA and failed subjects should return high risk", () => {
      const result = calculateRiskScore({
        gpa: 4.5, // +0.5
        attendance: 75, // +0.3
        failedSubjects: 2, // +0.2
      });

      expect(result).toBeCloseTo(1.0);
    });
  });

  describe("classifyRiskLevel", () => {
    test("Score below 5 is high risk", () => {
      expect(classifyRiskLevel(4.9)).toBe('high');
    });

    test("Score between 5 and 6.5 is medium risk", () => {
      expect(classifyRiskLevel(6.0)).toBe('medium');
    });

    test("Score above 6.5 is low risk", () => {
      expect(classifyRiskLevel(8.0)).toBe('low');
    });
  });

});
