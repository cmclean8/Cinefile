export interface JobState {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total: number;
  completed: number;
  successful: number;
  failed: number;
  current?: string; // Current movie being processed
  pass: number; // 1 or 2 for retry passes
  errors: Array<{ movieId: number; title: string; error: string }>;
  startTime: number;
  endTime?: number;
}

class JobTrackerService {
  private jobs: Map<string, JobState> = new Map();
  private jobCleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up completed jobs after 1 hour
    this.jobCleanupInterval = setInterval(() => {
      this.cleanupOldJobs();
    }, 60000); // Check every minute
  }

  /**
   * Create a new job
   */
  createJob(jobId: string, total: number): JobState {
    const job: JobState = {
      jobId,
      status: 'pending',
      total,
      completed: 0,
      successful: 0,
      failed: 0,
      pass: 1,
      errors: [],
      startTime: Date.now(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Get job state
   */
  getJob(jobId: string): JobState | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job progress
   */
  updateJob(
    jobId: string,
    updates: Partial<Pick<JobState, 'status' | 'completed' | 'successful' | 'failed' | 'current' | 'pass' | 'errors' | 'endTime'>>
  ): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  /**
   * Add error to job
   */
  addError(jobId: string, movieId: number, title: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.errors.push({ movieId, title, error });
    }
  }

  /**
   * Clean up jobs older than 1 hour
   */
  private cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.endTime &&
        job.endTime < oneHourAgo
      ) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'cancelled';
      job.endTime = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.jobCleanupInterval) {
      clearInterval(this.jobCleanupInterval);
    }
  }
}

export const jobTracker = new JobTrackerService();





