const predictionService = require('../src/modules/prediction/service');

describe("Prediction Service Module", () => {
  const mockTrainingData = {
    students: [
      { id: "S1", scores: { "Math": 8, "Physics": 7 } },
      { id: "S2", scores: { "Math": 4, "Physics": 5 } },
      { id: "S3", scores: { "Math": 9, "Physics": 9 } },
      { id: "S4", scores: { "Math": 5, "Physics": 4 } },
      { id: "S5", scores: { "Math": 7, "Physics": 6 } }
    ],
    subjects: ["Math", "Physics"],
    curriculumOrder: ["Math", "Physics"]
  };

  const mockStudentsToPredict = [
    { id: "P1", scores: { "Math": 8 } }, // Expect high Physics
    { id: "P2", scores: { "Math": 3 } }  // Expect low Physics (high risk)
  ];

  test("Should predict missing scores dynamically using training data", async () => {
    const result = await predictionService.predictScores("Physics", mockStudentsToPredict, mockTrainingData, null);
    
    expect(result.status).toBe("success");
    expect(result.predictions).toHaveLength(2);

    const p1 = result.predictions.find(p => p.id === "P1");
    const p2 = result.predictions.find(p => p.id === "P2");

    expect(p1.predicted).toBeGreaterThan(p2.predicted); // P1 Math > P2 Math, correlation should be positive
    expect(p2.risk).toBe("high"); // P2 predicted should be < 5
  });

  test("Should return actual score if it already exists", async () => {
    const studentsWithActual = [
      { id: "P3", scores: { "Math": 8, "Physics": 9.5 } }
    ];
    
    const result = await predictionService.predictScores("Physics", studentsWithActual, mockTrainingData, null);
    
    expect(result.predictions[0].predicted).toBe(9.5);
    expect(result.predictions[0].risk).toBe("low");
  });
});
