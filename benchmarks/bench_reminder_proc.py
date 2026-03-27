"""Benchmark: reminder proc performance."""
import time

def bench_reminder_proc():
    start = time.perf_counter()
    # TODO: implement reminder proc benchmark
    elapsed = time.perf_counter() - start
    print(f"reminder proc: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_reminder_proc()
