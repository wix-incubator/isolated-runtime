const createPool = require("..");
const messages = require("./messages");
const Chance = require("chance");

const chance = new Chance();

describe("Worker Threads Pool", () => {
  let pool;
  test("throws when given worker path does not exist", () => {
    expect(() =>
      createPool({
        workerPath: "./does-not-exist.js"
      })
    ).toThrow();
  });

  describe("run", () => {
    const multiplyFactor = chance.integer();

    beforeAll(() => {
      pool = createPool({
        workerPath: "./packages/thread-pool-node/test/worker.js",
        workerOptions: {
          workerData: {
            multiplyFactor
          }
        },
        poolOptions: {
          min: 2,
          max: 2
        }
      });
    });
    afterAll(async () => {
      await pool.drain();
      await pool.clear();
    });

    test("runs given worker", async done => {
      const expectedResult = chance.string();
      const worker = await pool.acquire();

      worker.on("message", result => {
        expect(result).toEqual(expectedResult);
        pool.release(worker);
        done();
      });

      worker.postMessage({
        code: messages.ECHO,
        str: expectedResult
      });
    });

    test("passes worker options", async done => {
      const multiplyBy = chance.integer();
      const expectedResult = multiplyFactor * multiplyBy;
      const worker = await pool.acquire();

      worker.on("message", result => {
        expect(result).toEqual(expectedResult);
        pool.release(worker);
        done();
      });

      worker.postMessage({
        code: messages.MULTIPLY,
        multiplyBy
      });
    });

    test("passes pool options", () => {
      expect(pool.min).toBe(2);
      expect(pool.max).toBe(2);
    });
  });
});
