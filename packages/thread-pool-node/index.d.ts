import { Options, Pool } from "generic-pool";
import { WorkerOptions, Worker } from "worker_threads";

export interface WorkerThreadsPoolOptions {
  workerPath: string;
  workerOptions: WorkerOptions;
  poolOptions: Options;
}

export default function(options: WorkerThreadsPoolOptions): Pool<Worker>;
