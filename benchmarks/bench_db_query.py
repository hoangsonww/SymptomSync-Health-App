"""Benchmark: db query performance."""
import time

def bench_db_query():
    start = time.perf_counter()
    # TODO: implement db query benchmark
    elapsed = time.perf_counter() - start
    print(f"db query: {elapsed:.4f}s")

if __name__ == "__main__":
    bench_db_query()
