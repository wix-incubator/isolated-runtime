import { Options, Pool } from "generic-pool";
import { WorkerOptions, Worker } from "worker_threads";

export interface WorkerThreadsPoolOptions {
  workerPath: string;
  workerOptions: WorkerOptions;
  poolOptions: Options;
}

type createPool = (options: WorkerThreadsPoolOptions) => Pool<Worker>;

export default createPool;
